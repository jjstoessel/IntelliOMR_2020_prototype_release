import {
  FETCH_THUMBNAILS,
  SET_LOADING_STATE,
  DELETE_IMAGE,
  SET_RUNNING_STATE
} from "../types";
import { API, graphqlOperation } from "aws-amplify";
import * as myQueries from "../../../graphql/myqueries";
import * as mutations from "../../../graphql/mutations";
import RunPhasesModel from "../../runPhases/RunPhasesModel";

export function fetchThumbnails(documentSetId) {
  return async function(dispatch) {
    dispatch({
      type: SET_LOADING_STATE,
      payload: "loading"
    });
    let data = await API.graphql(
      graphqlOperation(myQueries.getDocumentSetThumbnails, {
        id: documentSetId
      })
    );
    dispatch({
      type: FETCH_THUMBNAILS,
      payload: data.data.getDocumentSetInfo.images.items
    });
    dispatch({
      type: SET_LOADING_STATE,
      payload: "loaded"
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

export function runPhases() {
  return async function(dispatch) {
    RunPhasesModel._run(dispatch);
    dispatch({
      type: SET_RUNNING_STATE,
      payload: true
    });
  };
}

export function stopRunning() {
  return async function(dispatch) {
    RunPhasesModel._stop();
    dispatch({
      type: SET_RUNNING_STATE,
      payload: false
    });
  };
}

export function updateDocumentImage(imageData) {
  return async function(dispatch) {
    try {
      await API.graphql(
        graphqlOperation(mutations.updateDocumentImage, {
          input: imageData
        })
      );
    } catch (e) {
      alert(JSON.stringify(e));
    }
    dispatch({
      type: UPDATE_IMAGE_DATA,
      payload: false
    });
  };
}
