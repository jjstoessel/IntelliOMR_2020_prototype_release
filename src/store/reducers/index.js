import { combineReducers } from "redux";
import documentSetReducer from "./documentSetReducer";

export default combineReducers({
  documentSet: documentSetReducer
});
