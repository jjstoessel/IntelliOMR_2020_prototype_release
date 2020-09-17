import { graphqlOperation, API } from "aws-amplify";
import * as queries from "../graphql/queries";
import * as mutations from "../graphql/mutations";
import * as myqueries from "../graphql/myqueries";
import config from "../config";

let loadingDocumentSet = false;
let documentImages = [];
let documentSetId = null;
let listeners = [];
let selectedImage = {};
let loadingMediumImage = false;
let mediumImage = null;

class PhaseModel {
  _addListener(f) {
    listeners.push(f);
  }

  _removeListener(f) {
    var i = listeners.indexOf(f);
    if (i >= 0) listeners.slice(i, 1);
  }

  _notifyListeners() {
    for (var i = 0; i < listeners.length; i++) listeners[i]();
  }

  async reloadDocumentImages() {
    await this.loadDocumentImages(documentSetId);
  }

  async loadDocumentImages(id) {
    documentSetId = id;
    let images = [];
    selectedImage = {};
    loadingDocumentSet = true;
    this._notifyListeners();

    let startKey = null;

    do {
      var serverOutput = await API.graphql(
        graphqlOperation(myqueries.listDocumentImages, {
          filter: {
            documentSetId: {
              eq: id,
            },
          },
          nextToken: startKey,
          limit: 100,
        })
      );

      images = images.concat(serverOutput.data.listDocumentImages.items);

      startKey = serverOutput.data.listDocumentImages.nextToken;
    } while (startKey);

    function compare(a, b) {
      if (a.imageName < b.imageName) return -1;
      if (a.imageName > b.imageName) return 1;
      return 0;
    }
    images = images.sort(compare);

    documentImages = images;
    loadingDocumentSet = false;
    this._notifyListeners();
  }

  _getDocumentSetId() {
    return documentSetId;
  }

  _getDocumentImages() {
    return documentImages;
  }

  _isDocumentSetLoading() {
    return loadingDocumentSet;
  }

  loadMediumImage(image) {
    loadingMediumImage = true;
    let imageUrl = config.s3.IMAGEURL + image.mediumImage;
    var newImg = new Image();

    var id = image.id;
    var _this = this;
    newImg.onload = function () {
      if (id === selectedImage.id) {
        loadingMediumImage = false;
        mediumImage = newImg;
        _this._notifyListeners();
      }
    };
    newImg.src = imageUrl;
  }

  async _selectImage(i) {
    loadingMediumImage = true;
    selectedImage = i;
    this._notifyListeners();

    // step 1, lets load the image

    let data = await API.graphql(
      graphqlOperation(myqueries.getDocumentImageStaffs, {
        id: i.id,
        limit: 200,
      })
    );

    let staffsRaw = data.data.getDocumentImage.staffs.items;

    let ids = "";
    let staffs = {};
    for (let i = 0; i < staffsRaw.length; i++) {
      let sr = staffsRaw[i];
      sr.pointsOfInterest = JSON.parse(sr.pointsOfInterest);
      sr.guides = JSON.parse(sr.guides);
      if (sr.symbols) sr.symbols = JSON.parse(sr.symbols);
      let id = sr.pageNum + "_" + sr.staffNum;
      ids += " " + id;
      staffs[id] = sr;
      //alert(JSON.stringify(sr));
    }
    //alert("ids =" + ids);

    selectedImage.staffs = staffs;

    this.loadMediumImage(i);

    this._notifyListeners();
  }

  _getSelectedImage() {
    return selectedImage;
  }

  _updatePageBoundaries(pb) {
    selectedImage.pageBoundaries = JSON.stringify(pb);
    selectedImage.lastPhaseRun = 2;
    let variables = {
      id: selectedImage.id,
      pageBoundaries: selectedImage.pageBoundaries,
      lastPhaseRun: 2,
    };
    API.graphql(
      graphqlOperation(mutations.updateDocumentImage, {
        input: variables,
      })
    );
    this._notifyListeners();
  }

  _updatePageBoundariesNoSave(pb) {
    selectedImage.lastPhaseRun = 2;
    selectedImage.pageBoundaries = JSON.stringify(pb);
    this._notifyListeners();
  }

  _updatePageStaffLocations(pb, page) {
    let locs = JSON.parse(selectedImage.pageStaffLocations);
    locs[page].staffLocations = pb;
    selectedImage.pageStaffLocations = JSON.stringify(locs);
    selectedImage.lastPhaseRun = 3;

    let variables = {
      id: selectedImage.id,
      pageStaffLocations: selectedImage.pageStaffLocations,
      lastPhaseRun: 3,
    };
    API.graphql(
      graphqlOperation(mutations.updateDocumentImage, {
        input: variables,
      })
    );
    this._notifyListeners();
  }

  _updatePageStaffLocationsNoSave(pb, page) {
    let locs = JSON.parse(selectedImage.pageStaffLocations);
    locs[page].staffLocations = pb;
    selectedImage.pageStaffLocations = JSON.stringify(locs);
    selectedImage.lastPhaseRun = 3;

    this._notifyListeners();
  }

  _getLoadingMediumImage() {
    return loadingMediumImage;
  }

  _getMediumImage() {
    return mediumImage;
  }

  async _updateDocumentImage(imageData, variables) {
    for (var id in variables) {
      imageData[id] = variables[id];
    }
    variables.id = imageData.id;
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentImage, {
          input: variables,
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
    this._notifyListeners();
  }

  async _updateStaffSymbols(page, staff, symbols) {
    let pointsId = page + "_" + staff;
    let staffData = selectedImage.staffs[pointsId];
    staffData.symbols = symbols;
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentStaff, {
          input: {
            id: staffData.id,
            symbols: JSON.stringify(symbols),
          },
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
  }

  async _uploadTrainingImageData(item) {
    try {
      await API.graphql(
        graphqlOperation(mutations.deleteTrainingImage, {
          input: {
            id: item.id,
          },
        })
      );
    } catch (e) {
      // do nothing
    }
    try {
      await API.graphql(
        graphqlOperation(mutations.createTrainingImage, {
          input: item,
        })
      );
    } catch (e) {
      // do nothing
      alert(e);
    }
  }

  async _tagVoice(staffId, voice) {
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentStaff, {
          input: {
            id: staffId,
            voice: voice,
          },
        })
      );
      //alert("updated staff " + staffId + " voice=" + voice);
    } catch (e) {
      alert(JSON.stringify(e));
    }
  }

  async _updateDocumentStaff(documentStaffInfo) {
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentStaff, {
          input: documentStaffInfo,
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }

    selectedImage.lastPhaseRun = 4;
    let variables = {
      id: selectedImage.id,
      lastPhaseRun: 4,
    };
    API.graphql(
      graphqlOperation(mutations.updateDocumentImage, {
        input: variables,
      })
    );

    this._notifyListeners();
  }
}

export default new PhaseModel();
