import PhaseModel from "../PhaseModel";
import config from "../../config";
import { graphqlOperation, API } from "aws-amplify";
import * as mutations from "../../graphql/mutations";
import * as myqueries from "../../graphql/myqueries";

let runListeners = [];
let isRunning = false;
let progress = {
  phase1: 0,
  phase2: 0,
  phase3: 0,
  phase4: 0,
  phase5: 0,
};

let runAll = false,
  runPhase4 = false;
let debug = true;

class RunPhaseModel {
  _addListener(f) {
    runListeners.push(f);
  }

  _removeListener(f) {
    var i = runListeners.indexOf(f);
    if (i >= 0) runListeners.slice(i, 1);
  }

  _notifyListeners() {
    for (var i = 0; i < runListeners.length; i++) runListeners[i]();
  }

  _updatePhaseProgress() {
    let images = PhaseModel._getDocumentImages();
    if (images.length === 0) return;
    for (let level = 1; level <= 5; level++) {
      let sum = 0.0;
      for (let im = 0; im < images.length; im++) {
        if (images[im].lastPhaseRun >= level) sum++;
      }
      progress["phase" + level] = Math.floor((sum / images.length) * 100);
    }
    this._notifyListeners();
  }

  async runPhase1() {
    var images = PhaseModel._getDocumentImages();

    for (let i = 0; i < images.length; i++) {
      if (!isRunning) return; // someone hit stop
      var image = images[i];
      if (image.lastPhaseRun < 1 || runAll) {
        let imageUrl = config.s3.IMAGEURL + image.mediumImage;
        //let imageUrl = config.s3.IMAGEURL + image.smallImage;

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

        try {
          await API.graphql(
            graphqlOperation(mutations.updateDocumentImage, {
              input: uploadData,
            })
          );
        } catch (e) {
          alert(JSON.stringify(e));
        }

        // lets update
        image.lastPhaseRun = 1;
        image.calculatedOrientation = angle;
      }

      const prog = Math.round(((i + 1) * 100) / images.length);
      progress.phase1 = prog;
      this._notifyListeners();
    }
  }

  async runPhase2() {
    var images = PhaseModel._getDocumentImages();

    for (let i = 0; i < images.length; i++) {
      if (!isRunning) return; // someone hit stop
      var image = images[i];
      if (image.lastPhaseRun < 2 || runAll) {
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
          pageBoundaries: pageBoundaries,
          lastPhaseRun: 2,
        };

        try {
          await API.graphql(
            graphqlOperation(mutations.updateDocumentImage, {
              input: uploadData,
            })
          );
        } catch (e) {
          alert(JSON.stringify(e));
        }

        // lets update
        image.lastPhaseRun = 2;
        image.pageBoundaries = pageBoundaries;
      }

      const prog = Math.round(((i + 1) * 100) / images.length);
      progress.phase2 = prog;
      this._notifyListeners();
    }
  }

  async runPhase3() {
    var images = PhaseModel._getDocumentImages();

    for (let i = 0; i < images.length; i++) {
      if (!isRunning) return; // someone hit stop
      var image = images[i];
      if (image.lastPhaseRun < 3 || runAll) {
        let imageUrl = image.largeImage;
        //let imageUrl = image.mediumImage;
        let orientation = image.calculatedOrientation;

        var info = {
          image: imageUrl,
          orientation: orientation,
          pageBoundaries: image.pageBoundaries,
        };
        let out = await API.post("music-ocr-python", "/phase3", {
          body: info,
        });

        let pages = JSON.stringify(out.pages);

        // upload data
        let uploadData = {
          id: image.id,
          pageStaffLocations: pages,
          lastPhaseRun: 3,
        };

        try {
          await API.graphql(
            graphqlOperation(mutations.updateDocumentImage, {
              input: uploadData,
            })
          );
        } catch (e) {
          alert(JSON.stringify(e));
        }

        // lets update
        image.lastPhaseRun = 3;
        image.pageStaffLocations = pages;
      }

      const prog = Math.round(((i + 1) * 100) / images.length);
      progress.phase3 = prog;
      this._notifyListeners();
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
          API.graphql(
            graphqlOperation(mutations.deleteDocumentStaff, {
              input: {
                id: staffIds[i].id,
              },
            })
          );
        }
      } while (nextToken !== null);
    } catch (e) {
      console.log("ERROR " + JSON.stringify(e));
      alert(JSON.stringify(e));
    }
  }

  async processPagePhase4(info, image, page) {
    let startPos = 0;

    info.firstItem = startPos;
    let lastItem = -1;
    do {
      info.firstItem = startPos;
      let out = await API.post("music-ocr-python", "/phase4", {
        body: info,
      });
      if (debug) {
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
          pointsOfInterest: JSON.stringify(staffInfo.pointsOfInterest),
          guides: JSON.stringify(staffInfo.guides),
          x: staffInfo.x,
          y: staffInfo.y,
          width: staffInfo.width,
          height: staffInfo.height,
        };

        try {
          API.graphql(
            graphqlOperation(mutations.createDocumentStaff, {
              input: infoToSave,
            })
          );
        } catch (e) {
          alert(JSON.stringify(e));
        }
      }

      lastItem = out.lastItem;
      startPos = lastItem;
    } while (lastItem >= 0);
  }

  async runPhase4() {
    var images = PhaseModel._getDocumentImages();

    for (let i = 0; i < images.length; i++) {
      if (!isRunning) return; // someone hit stop
      var image = images[i];
      if (image.lastPhaseRun < 4 || runAll || runPhase4) {
        await this.deleteImageStaffs(image);
        let pageStaffLocations = JSON.parse(image.pageStaffLocations);
        for (let page = 0; page < pageStaffLocations.length; page++) {
          let pageData = pageStaffLocations[page];
          let url = pageData.url;
          let orientation = pageData.orientation;
          let staffLocations = pageData.staffLocations;
          let info = {
            imageUrl: url,
            staffLocations: staffLocations,
            orientation: orientation,
          };
          if (debug) {
            console.log("music-ocr-python/phase4 BODY:");
            console.log(JSON.stringify(info));
            console.log("");
          }
          await this.processPagePhase4(info, image, page);
        }

        image.lastPhaseRun = 4;
        // upload data
        let uploadData = {
          id: image.id,
          lastPhaseRun: 4,
        };

        try {
          await API.graphql(
            graphqlOperation(mutations.updateDocumentImage, {
              input: uploadData,
            })
          );
        } catch (e) {
          alert(JSON.stringify(e));
        }
      }

      const prog = Math.round(((i + 1) * 100) / images.length);
      progress.phase4 = prog;
      this._notifyListeners();
    }
  }

  async runPhase5() {
    var images = PhaseModel._getDocumentImages();

    for (let i = 0; i < images.length; i++) {
      if (!isRunning) return; // someone hit stop
      var image = images[i];
      if (image.lastPhaseRun < 5 || runAll || runPhase4) {
        image.lastPhaseRun = 5;

        let data = await API.graphql(
          graphqlOperation(myqueries.getDocumentImageStaffIds, {
            id: image.id,
            limit: 200,
          })
        );
        let staffIds = data.data.getDocumentImage.staffs.items;

        // lets delete all symbols
        for (let i = 0; i < staffIds.length; i++) {
          await API.graphql(
            graphqlOperation(mutations.updateDocumentStaff, {
              input: {
                id: staffIds[i].id,
                symbols: {},
              },
            })
          );
        }

        // upload data
        let uploadData = {
          id: image.id,
          lastPhaseRun: 5,
        };
        //alert("updating phase 5 info " + JSON.stringify(uploadData));

        try {
          await API.graphql(
            graphqlOperation(mutations.updateDocumentImage, {
              input: uploadData,
            })
          );
        } catch (e) {
          alert(JSON.stringify(e));
        }
      }

      const prog = Math.round(((i + 1) * 100) / images.length);
      progress.phase5 = prog;
      this._notifyListeners();
    }
  }

  async _run(onDone) {
    isRunning = true;
    progress = {
      phase1: 0,
      phase2: 0,
      phase3: 0,
      phase4: 0,
      phase5: 0,
    };
    this._notifyListeners();

    await this.runPhase1();
    await this.runPhase2();
    await this.runPhase3();
    await this.runPhase4();
    await this.runPhase5();
    isRunning = false;
    onDone();

    this._notifyListeners();
  }

  _stop() {
    isRunning = false;
    this._notifyListeners();
  }

  _isRunning() {
    return isRunning;
  }

  _getProgress() {
    return progress;
  }
}

export default new RunPhaseModel();
