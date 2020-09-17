import {
  FETCH_DOCUMENT_IMAGES,
  SET_LOADING_STATE,
  DELETE_IMAGE,
  SET_RUNNING_STATE,
  LOADING_STATE_LOADING,
  LOADING_STATE_LOADED,
  SELECT_IMAGE,
  RUNNING_STATE_RUNNING,
  RUNNING_STATE_STOPPED,
  UPDATE_IMAGE_DATA,
  TAG_VOICE,
  TAG_BOOKEND,
  DELETE_POINT_OF_INTEREST,
  UPDATE_STAFF_SYMBOLS,
  UPDATE_DOCUMENT_STAFF
} from "../actions/types";
import { API, graphqlOperation } from "aws-amplify";
import * as myQueries from "../../graphql/myqueries";
import * as mutations from "../../graphql/mutations";
import RunPhasesModel from "../runPhases/RunPhasesModel";
import { updateImageData } from "../helpers";

export function fetchDocumentImages(documentSetId) {
  return async function(dispatch) {
    dispatch({
      type: SET_LOADING_STATE,
      payload: LOADING_STATE_LOADING
    });

    let images = [];

    let startKey = null;

    do {
      var serverOutput = await API.graphql(
        graphqlOperation(myQueries.listDocumentImages, {
          filter: {
            documentSetId: {
              eq: documentSetId
            }
          },
          nextToken: startKey,
          limit: 100
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

    for (var i = 0; i < images.length; i++) {
      let image = images[i];
      image.pageBoundaries = JSON.parse(image.pageBoundaries);
      image.pageStaffLocations = JSON.parse(image.pageStaffLocations);
      //alert("loading page staff locations = " + image.pageStaffLocations);

      let staffsRaw = images[i].staffs.items;
      let staffs = {};
      for (let i = 0; i < staffsRaw.length; i++) {
        let sr = staffsRaw[i];
        sr.pointsOfInterest = JSON.parse(sr.pointsOfInterest);
        sr.guides = JSON.parse(sr.guides);
        if (sr.symbols) sr.symbols = JSON.parse(sr.symbols);
        let id = sr.pageNum + "_" + sr.staffNum;
        staffs[id] = sr;
      }

      images[i].staffs = staffs;
    }

    dispatch({
      type: FETCH_DOCUMENT_IMAGES,
      payload: {
        images: images,
        documentSetId: documentSetId
      }
    });
    dispatch({
      type: SET_LOADING_STATE,
      payload: LOADING_STATE_LOADED
    });
  };
}

export function deleteImage(imageId) {
  return async function(dispatch) {
    // note, should also delete links and images ... hmmm
    dispatch({
      type: DELETE_IMAGE,
      payload: imageId
    });
    await API.graphql(
      graphqlOperation(mutations.deleteDocumentImage, {
        input: { id: imageId }
      })
    );
  };
}

export function updateImage(data) {
  return async function(dispatch) {
    updateImageData(dispatch, data);
  };
}

export function updateImageDataNoSave(data) {
  return async function(dispatch) {
    dispatch({
      type: UPDATE_IMAGE_DATA,
      payload: data
    });
  };
}

export function selectImage(imageId, imageUrl) {
  return async function(dispatch) {
    dispatch({
      type: SELECT_IMAGE,
      payload: imageId
    });
  };
}

export function runPhases() {
  return async function(dispatch) {
    dispatch({
      type: SET_RUNNING_STATE,
      payload: RUNNING_STATE_RUNNING
    });
    RunPhasesModel._run(dispatch);
  };
}

export function stopRunning() {
  return async function(dispatch) {
    RunPhasesModel._stop();
    dispatch({
      type: SET_RUNNING_STATE,
      payload: RUNNING_STATE_STOPPED
    });
  };
}

export function tagVoice(staffId, voice) {
  return async function(dispatch) {
    dispatch({
      type: TAG_VOICE,
      payload: { staffId: staffId, voice: voice }
    });
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentStaff, {
          input: {
            id: staffId,
            voice: voice
          }
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
  };
}

export function tagBookend(staffId, bookend) {
  return async function(dispatch) {
    dispatch({
      type: TAG_BOOKEND,
      payload: { staffId: staffId, bookend: bookend }
    });
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentStaff, {
          input: {
            id: staffId,
            bookend: bookend
          }
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
  };
}

export function deletePointOfInterest(staffId, pointToRemove) {
  return async function(dispatch) {
    dispatch({
      type: DELETE_POINT_OF_INTEREST,
      payload: {
        staffId: staffId,
        pointToRemove: pointToRemove
      }
    });
  };
}

export function updateStaffSymbols(page, staff, symbols, staffData) {
  return async function(dispatch) {
    dispatch({
      type: UPDATE_STAFF_SYMBOLS,
      payload: {
        page: page,
        staff: staff,
        symbols: symbols,
        staffData: staffData
      }
    });
    //let pointsId = page + "_" + staff;
    //let staffData = selectedImage.staffs[pointsId];
    staffData.symbols = symbols;
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentStaff, {
          input: {
            id: staffData.id,
            symbols: JSON.stringify(symbols)
          }
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
  };
}

export function updateDocumentStaff(documentStaffInfo) {
  return async function(dispatch) {
    dispatch({
      type: UPDATE_DOCUMENT_STAFF,
      payload: documentStaffInfo
    });

    try {
      //alert("updating document staff " + JSON.stringify(documentStaffInfo));
      await API.graphql(
        graphqlOperation(mutations.updateDocumentStaff, {
          input: documentStaffInfo
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
  };
}
