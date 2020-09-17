import {
  SELECT_IMAGE,
  SET_IMAGE_LOADING_STATE,
  SET_IMAGE_DATA,
  UPDATE_IMAGE_DATA,
  UPDATE_DOCUMENT_STAFF,
  UPDATE_STAFF_SYMBOLS,
  TAG_VOICE,
  DELETE_POINT_OF_INTEREST
} from "../types";
import { API, graphqlOperation } from "aws-amplify";
import * as myqueries from "../../../graphql/myqueries";
import * as mutations from "../../../graphql/mutations";

export function updateImageData(variableSet) {
  //alert("updating image data " + JSON.stringify(variableSet));
  return async function(dispatch) {
    dispatch({
      type: UPDATE_IMAGE_DATA,
      payload: variableSet
    });
    try {
      //alert("updating image data to server");
      await API.graphql(
        graphqlOperation(mutations.updateDocumentImage, {
          input: variableSet
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
  };
}

export function updateImageDataNoSave(variableSet) {
  return async function(dispatch) {
    dispatch({
      type: UPDATE_IMAGE_DATA,
      payload: variableSet
    });
  };
}

export function selectImage(imageId) {
  return async function(dispatch) {
    dispatch({
      type: SELECT_IMAGE,
      payload: imageId
    });
    dispatch({
      type: SET_IMAGE_LOADING_STATE,
      payload: "loading"
    });

    // step 1, lets load the image

    let data = await API.graphql(
      graphqlOperation(myqueries.getDocumentImageStaffs, {
        id: imageId
      })
    );

    data = data.data.getDocumentImage;
    let staffsRaw = data.staffs.items;

    let staffs = {};
    for (let i = 0; i < staffsRaw.length; i++) {
      let sr = staffsRaw[i];
      sr.pointsOfInterest = JSON.parse(sr.pointsOfInterest);
      sr.guides = JSON.parse(sr.guides);
      if (sr.symbols) sr.symbols = JSON.parse(sr.symbols);
      let id = sr.pageNum + "_" + sr.staffNum;
      staffs[id] = sr;
    }

    data.staffs = staffs;

    dispatch({
      type: SET_IMAGE_DATA,
      payload: data
    });
    dispatch({
      type: SET_IMAGE_LOADING_STATE,
      payload: "loaded"
    });
  };
}

export function updateDocumentStaff(documentStaffInfo) {
  return async function(dispatch) {
    //let updateImage = updateImageData({
    //  id: imageId,
    //  lastPhaseRun: lastPhaseRun
    //});
    //await updateImage(dispatch);

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
