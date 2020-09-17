import React, { Component } from "react";
import "./UserDocumentSetList.css";

import DocumentSetList from "../../containers/userDocumentSetLists/DocumentSetList";

export default class UserDocumentSetList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      documentSetList: []
    };
  }

  renderError() {
    return (
      <div className="lander">
        <p>
          {" "}
          I am sorry ... you cannot view this page... you are not logged in.
        </p>
      </div>
    );
  }

  render() {
    return (
      <div className="DocSet container">
        {" "}
        {this.props.isAuthenticated ? (
          <DocumentSetList />
        ) : (
          this.renderError()
        )}{" "}
      </div>
    );
  }
}
