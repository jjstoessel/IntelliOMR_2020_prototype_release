import config from "../../config";
import { graphqlOperation, API } from "aws-amplify";
import * as mutations from "../../graphql/mutations";
import * as myqueries from "../../graphql/myqueries";
import store from "../store";
import {
  UPDATE_IMAGE_DATA,
  SET_RUNNING_STATE,
  RUNNING_STATE_STOPPED,
} from "../actions/types";
import { updateImageData } from "../helpers";

class RunPhaseModel {
  constructor() {
    this.isRunning = false;
    this.runAll = false;
    this.debug = false;
    this.runPhase_4 = false;
  }

  clearAll() {
    var images = store.getState().documentSet.documentItems;
    for (let i = 0; i < images.length; i++) {
      var image = images[i];
      this.dispatch({
        type: UPDATE_IMAGE_DATA,
        payload: { id: image.id, lastPhaseRun: 0 },
      });
    }
  }

  async _run(dispatch) {
    this.dispatch = dispatch;
    this.isRunning = true;

    if (this.runAll) this.clearAll();

    await this.runPhase1();
    await this.runPhase2();
    await this.runPhase3();
    await this.runPhase4();
    //await this.runPhase5();
    this._stop();
  }

  _stop() {
    this.isRunning = false;
    this.dispatch({
      type: SET_RUNNING_STATE,
      payload: RUNNING_STATE_STOPPED,
    });
  }

  async updateImage(uploadData) {
    await updateImageData(this.dispatch, uploadData);
  }

  async runPhase1() {
    var images = store.getState().documentSet.documentItems;

    try {
      for (let i = 0; i < images.length; i++) {
        if (!this.isRunning) return; // someone hit stop
        var image = images[i];
        if (image.lastPhaseRun < 1 || this.runAll) {
          let imageUrl = config.s3.IMAGEURL + image.mediumImage;

          var info = {
            image: imageUrl,
          };
          let out = await API.post(
            "music-ocr-python",
            "/phase1_calculate_orientation",
            {
              body: info,
            }
          );

          let angle = parseFloat(out.bestAngle);

          // upload data
          let uploadData = {
            id: image.id,
            lastPhaseRun: 1,
            calculatedOrientation: angle,
          };

          this.updateImage(uploadData);
        }
      }
    } catch (e) {
      this._stop();
      alert(
        "error running phase 1  - Something went wrong... perhaps refresh the page and try again"
      );
    }
  }

  async runPhase2() {
    var images = store.getState().documentSet.documentItems;

    try {
      for (let i = 0; i < images.length; i++) {
        if (!this.isRunning) return; // someone hit stop
        var image = images[i];
        if (image.lastPhaseRun < 2 || this.runAll) {
          let imageUrl = config.s3.IMAGEURL + image.mediumImage;
          //let imageUrl = config.s3.IMAGEURL + image.smallImage;
          let orientation = image.calculatedOrientation;

          var info = {
            image: imageUrl,
            orientation: orientation,
          };
          let out = await API.post("music-ocr-python", "/phase2", {
            body: info,
          });

          let pageBoundaries = JSON.stringify(out.pageBoundaries);

          // upload data
          let uploadData = {
            id: image.id,
            pageBoundaries: out.pageBoundaries,
            lastPhaseRun: 2,
          };

          this.updateImage(uploadData);
        }
      }
    } catch (e) {
      this._stop();
      alert(
        "error running phase 2  - Something went wrong... perhaps refresh the page and try again"
      );
    }
  }

  async runPhase3() {
    var images = store.getState().documentSet.documentItems;

    try {
      for (let i = 0; i < images.length; i++) {
        if (!this.isRunning) return; // someone hit stop
        var image = images[i];
        if (image.lastPhaseRun < 3 || this.runAll) {
          let imageUrl = image.largeImage;
          //let imageUrl = image.mediumImage;
          let orientation = image.calculatedOrientation;

          var info = {
            image: imageUrl,
            orientation: orientation,
            pageBoundaries: JSON.stringify(image.pageBoundaries),
          };
          let out = await API.post("music-ocr-python", "/phase3", {
            body: info,
          });

          let pages = out.pages;

          // upload data
          let uploadData = {
            id: image.id,
            pageStaffLocations: pages,
            lastPhaseRun: 3,
          };

          this.updateImage(uploadData);
        }
      }
    } catch (e) {
      this._stop();
      alert(
        "error running phase 3  - Something went wrong... perhaps refresh the page and try again"
      );
    }
  }

  async deleteImageStaffs(image) {
    try {
      let nextToken = null;
      do {
        let data = await API.graphql(
          graphqlOperation(myqueries.getDocumentImageStaffIds, {
            id: image.id,
            limit: 200,
          })
        );
        nextToken = data.data.getDocumentImage.staffs.nextToken;
        let staffIds = data.data.getDocumentImage.staffs.items;

        // lets delete all of them!
        for (let i = 0; i < staffIds.length; i++) {
          try {
            await API.graphql(
              graphqlOperation(mutations.deleteDocumentStaff, {
                input: {
                  id: staffIds[i].id,
                },
              })
            );
          } catch (e) {
            this._stop();
            alert(
              "error deleting staff  - Something went wrong... perhaps refresh the page and try again"
            );
          }
        }
      } while (nextToken !== null);
    } catch (e) {
      this._stop();
      console.log(
        "ERROR " +
          JSON.stringify(e) +
          " - Something went wrong... perhaps refresh the page and try again"
      );
      alert(JSON.stringify(e));
    }
  }

  async processPagePhase4(info, image, page, staffs) {
    let startPos = 0;

    info.firstItem = startPos;
    let lastItem = -1;
    do {
      info.firstItem = startPos;
      try {
        let out = await API.post("music-ocr-python", "/phase4", {
          body: info,
        });

        if (this.debug) {
          console.log("OUTPUT:");
          console.log(JSON.stringify(out));
        }

        let endPos = out.lastItem;
        if (endPos < 0) endPos = out.pointsOfInterest.length;

        for (let staff = startPos; staff < endPos; staff++) {
          let staffInfo = out.pointsOfInterest[staff];
          let infoToSave = {
            id: image.id + "_" + page + "_" + staff,
            pageNum: page,
            staffNum: staff,
            documentStaffDocumentImageId: image.id,
            pointsOfInterest: staffInfo.pointsOfInterest,
            guides: staffInfo.guides,
            x: staffInfo.x,
            y: staffInfo.y,
            width: staffInfo.width,
            height: staffInfo.height,
            symbols: {},
          };
          let id = page + "_" + staff;
          staffs[id] = infoToSave;
          /*try {
            await API.graphql(
              graphqlOperation(mutations.createDocumentStaff, {
                input: infoToSave
              })
            );
          } catch (e) {
            alert("error in processPagePhase4.1 " + JSON.stringify(e));
          }*/
        }

        lastItem = out.lastItem;
        startPos = lastItem;
      } catch (e) {
        this._stop();
        alert(
          "error in processPagePhase4 " +
            JSON.stringify(e) +
            " - Something went wrong... perhaps refresh the page and try again"
        );
      }
    } while (lastItem >= 0);
  }

  async runPhase4() {
    var images = store.getState().documentSet.documentItems;

    for (let i = 0; i < images.length; i++) {
      if (!this.isRunning) return; // someone hit stop
      if (this.debug) {
        console.log("runPhase4 image#" + i + "/" + images.length);
      }
      var image = images[i];
      if (image.lastPhaseRun < 4 || this.runAll || this.runPhase_4) {
        if (this.debug) {
          console.log("deleting image staffs");
        }
        await this.deleteImageStaffs(image);
        if (this.debug) {
          console.log("image staff deleted");
        }
        let pageStaffLocations = image.pageStaffLocations;
        let staffs = {};
        for (let page = 0; page < pageStaffLocations.length; page++) {
          if (this.debug) {
            console.log("processing page " + page);
          }
          let pageData = pageStaffLocations[page];
          let url = pageData.url;
          let orientation = pageData.orientation;
          let staffLocations = pageData.staffLocations;
          let info = {
            imageUrl: url,
            staffLocations: staffLocations,
            orientation: orientation,
          };
          if (this.debug) {
            console.log("music-ocr-python/phase4 BODY:");
            console.log(JSON.stringify(info));
            console.log("");
          }
          await this.processPagePhase4(info, image, page, staffs);
        }

        image.lastPhaseRun = 4;
        // upload data
        let uploadData = {
          id: image.id,
          lastPhaseRun: 4,
          staffs: staffs,
        };
        if (this.debug) {
          console.log("updating image");
        }
        this.updateImage(uploadData);
      }
    }
  }
}

export default new RunPhaseModel();
