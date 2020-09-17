import {
  FETCH_THUMBNAILS,
  SET_LOADING_STATE,
  DELETE_IMAGE,
  SET_RUNNING_STATE
} from "../../actions/types";

const initialState = {
  loadingState: null,
  items: [],
  newImage: {},
  runningPhases: false,
  progress: {
    phase1: 0,
    phase2: 0,
    phase3: 0,
    phase4: 0,
    phase5: 0
  }
};

function calculatePhaseProgress(images) {
  let progress = {
    phase1: 0,
    phase2: 0,
    phase3: 0,
    phase4: 0,
    phase5: 0
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

export default function(state = initialState, action) {
  switch (action.type) {
    case SET_LOADING_STATE:
      return {
        ...state,
        loadingState: action.payload
      };
    case FETCH_THUMBNAILS:
      let items = action.payload;
      let progress = calculatePhaseProgress(items);
      return {
        ...state,
        progress: progress,
        items: items
      };
    case DELETE_IMAGE:
      let items2 = state.items;

      for (let i = 0; i < items2.length; i++) {
        if (items2[i].id === action.payload) {
          items2 = [...items2.slice(0, i), ...items2.slice(i + 1)];
          break;
        }
      }
      let progress2 = calculatePhaseProgress(items2);

      return {
        ...state,
        items: items2,
        progress: progress2
      }; // couldn't find the item to delete
    case SET_RUNNING_STATE:
      return {
        ...state,
        runningPhases: action.payload
      };
    default:
      return state;
  }
}
