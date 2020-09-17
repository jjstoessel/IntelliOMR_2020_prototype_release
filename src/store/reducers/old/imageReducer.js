import {
  SELECT_IMAGE,
  SET_IMAGE_LOADING_STATE,
  SET_IMAGE_DATA,
  UPDATE_IMAGE_DATA,
  UPDATE_DOCUMENT_STAFF,
  TAG_VOICE,
  DELETE_POINT_OF_INTEREST,
} from "../../actions/types";

const initialState = {
  loadingState: null,
  currentImageId: null,
  currentImage: null,
};

export default function (state = initialState, action) {
  switch (action.type) {
    case SET_IMAGE_LOADING_STATE:
      return {
        ...state,
        loadingState: action.payload,
      };
    case SELECT_IMAGE:
      return {
        ...state,
        currentImageId: action.payload,
      };
    case SET_IMAGE_DATA:
      return {
        ...state,
        currentImage: action.payload,
      };
    case UPDATE_IMAGE_DATA:
      let newCurrentImage = {};
      for (let i in state.currentImage)
        newCurrentImage[i] = state.currentImage[i];
      for (let i in action.payload) newCurrentImage[i] = action.payload[i];

      return {
        ...state,
        currentImage: newCurrentImage,
      };
    case UPDATE_DOCUMENT_STAFF:
      //console.log("updating document staff " + JSON.stringify(action.payload));
      return state;
    case TAG_VOICE:
      return state;
    case DELETE_POINT_OF_INTEREST:
      let staffId = action.payload.staffId;
      let pointToRemove = action.payload.pointToRemove;
      //alert(
      //  "deleting point staffId=" + staffId + " pointToRemove=" + pointToRemove
      //);
      return state;
    default:
      return state;
  }
}
