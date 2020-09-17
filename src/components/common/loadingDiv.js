import React from "react";
import "./loadingDiv.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default () => (
  <div className="loadingDiv">
    <FontAwesomeIcon icon="spinner" className="fa-spin" /> Loading
  </div>
);
