import React, { Component } from "react";
import "./Home.css";

import logo from "./images/simple_header_small.png";

export default class Home extends Component {
  render() {
    return (
      <div className="Home container">
        <div className="lander">
          <img alt="imagelogo" src={logo} />{" "}
          <p> A simple OCR app for sheet music </p>{" "}
        </div>
      </div>
    );
  }
}
