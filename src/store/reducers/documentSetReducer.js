import {
  FETCH_DOCUMENT_IMAGES,
  SET_LOADING_STATE,
  DELETE_IMAGE,
  SET_RUNNING_STATE,
  LOADING_STATE_UNLOADED,
  RUNNING_STATE_STOPPED,
  UPDATE_IMAGE_DATA,
  SELECT_IMAGE,
  TAG_VOICE,
  TAG_BOOKEND,
  DELETE_POINT_OF_INTEREST,
} from "../actions/types";

const initialState = {
  documentSetId: null,
  loadingState: LOADING_STATE_UNLOADED,
  documentItems: [],
  currentImageId: null,
  currentImageData: null,
  currentImageSrc: null, // loaded the actual image
  imageLoadingState: LOADING_STATE_UNLOADED,

  runningState: RUNNING_STATE_STOPPED,
  progress: {
    phase1: 0,
    phase2: 0,
    phase3: 0,
    phase4: 0,
    phase5: 0,
  },
};

export default function (state = initialState, action) {
  switch (action.type) {
    case SET_LOADING_STATE:
      return {
        ...state,
        loadingState: action.payload,
      };
    case FETCH_DOCUMENT_IMAGES:
      let items = action.payload.images;
      let documentSetId = action.payload.documentSetId;
      let progress = calculatePhaseProgress(items);
      return {
        ...state,
        progress: progress,
        documentItems: items,
        documentSetId: documentSetId,
        currentImageId: null,
        currentImageData: null,
        currentImageSrc: null, // loaded the actual image
        imageLoadingState: LOADING_STATE_UNLOADED,
      };
    case SELECT_IMAGE:
      return {
        ...state,
        currentImageId: action.payload,
        currentImageData: getCurrentImageData(
          state.documentItems,
          action.payload
        ),
      };
    case DELETE_IMAGE:
      let items2 = state.documentItems;

      for (let i = 0; i < items2.length; i++) {
        if (items2[i].id === action.payload) {
          items2 = [...items2.slice(0, i), ...items2.slice(i + 1)];
          break;
        }
      }
      let progress2 = calculatePhaseProgress(items2);

      return {
        ...state,
        documentItems: items2,
        progress: progress2,
        currentImageData: getCurrentImageData(items2, state.currentImageId),
      }; // couldn't find the item to delete
    case SET_RUNNING_STATE:
      return {
        ...state,
        runningState: action.payload,
      };
    case UPDATE_IMAGE_DATA:
      //alert("updating image");
      // step 1, find the position of the original version
      let updatedItem = JSON.parse(JSON.stringify(action.payload));
      for (let i = 0; i < state.documentItems.length; i++) {
        let item = state.documentItems[i];
        if (item.id === updatedItem.id) {
          for (let key in item) {
            if (typeof updatedItem[key] === "undefined")
              updatedItem[key] = item[key]; // copy the missing variables across
          }

          let items3 = state.documentItems;
          items3 = [...items3.slice(0, i), updatedItem, ...items3.slice(i + 1)];
          let progress3 = calculatePhaseProgress(items3);

          return {
            ...state,
            documentItems: items3,
            progress: progress3,
            currentImageData: getCurrentImageData(items3, state.currentImageId),
          };
        }
      }

      return state;
    case TAG_VOICE:
      return state;
    case TAG_BOOKEND:
      return state;
    case DELETE_POINT_OF_INTEREST:
      //alert(
      //  "deleting point staffId=" + staffId + " pointToRemove=" + pointToRemove
      //);
      return state;
    default:
      return state;
  }
}

function getCurrentImageData(images, selectedImageId) {
  let currentImageData = null;
  for (var i = 0; i < images.length; i++)
    if (images[i].id === selectedImageId) currentImageData = images[i];
  return currentImageData;
}

function calculatePhaseProgress(images) {
  let progress = {
    phase1: 0,
    phase2: 0,
    phase3: 0,
    phase4: 0,
    phase5: 0,
  };
  if (images.length === 0) return progress;
  for (let level = 1; level <= 5; level++) {
    let sum = 0.0;
    for (let im = 0; im < images.length; im++) {
      if (images[im].lastPhaseRun >= level) sum++;
    }
    progress["phase" + level] = Math.floor((sum / images.length) * 100);
  }

  return progress;
}
