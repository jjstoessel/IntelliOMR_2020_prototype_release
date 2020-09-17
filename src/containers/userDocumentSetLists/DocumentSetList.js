import React, { Component } from "react";

import { LinkContainer } from "react-router-bootstrap";
//import logo from "../images/simple_header_small.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import { Button } from "react-bootstrap";
import { getUserEmail } from "../../libs/awsLib";
import { graphqlOperation, API } from "aws-amplify";

import * as queries from "../../graphql/queries";

export default class DocumentSetList extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: true,
      documentSetList: [],
    };
  }

  async componentDidMount() {
    try {
      const email = await getUserEmail();
      const documentSetList = await this.getDocumentSets(email);
      this.setState({
        documentSetList: documentSetList,
      });
    } catch (e) {
      alert(e);
    }
    this.setState({
      isLoading: false,
    });
  }

  async getDocumentSets(email) {
    try {
      var data = await API.graphql(
        graphqlOperation(queries.listUserDocumentSetss, {
          filter: {
            userID: {
              eq: email,
            },
          },
          limit: 1000,
        })
      );

      return data.data.listUserDocumentSetss.items;
    } catch (e) {
      console.log(JSON.stringify(e));
      alert("error = " + e);
    }
    return [];
  }

  renderDocumentSetList(d) {
    const documentSetList = this.state.documentSetList;
    return (
      <div>
        {documentSetList.length === 0 && (
          <p>
            You currently have no document sets, please click on the button
            below to create one.
          </p>
        )}
        {documentSetList.length > 0 && (
          <div>
            <table className="table table-striped table-bordered">
              <thead className="thead-dark">
                <tr>
                  <th>Document Set</th>
                  <th>Description</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {documentSetList.map((item) => (
                  <tr key={item.documentSetInfo.id}>
                    <td>{item.documentSetInfo.name}</td>
                    <td>{item.documentSetInfo.description}</td>
                    <td>
                      <LinkContainer
                        to={`/documentset/${item.documentSetInfo.id}`}
                      >
                        <button className="btn-success">Launch</button>
                      </LinkContainer>

                      <LinkContainer
                        to={`/documentsetinfo/${item.documentSetInfo.id}`}
                      >
                        <button>
                          <FontAwesomeIcon icon="cog" />
                        </button>
                      </LinkContainer>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div>
          <LinkContainer to={`/documentsetinfo/${-1}`}>
            <Button color="primary">+ Create New Document Set</Button>
          </LinkContainer>
        </div>
      </div>
    );
  }

  handleNoteClick = (event) => {
    event.preventDefault();
    this.props.history.push(event.currentTarget.getAttribute("href"));
  };

  /*renderLander() {
    return (
      <div className="lander">
        <img alt="imagelogo" src={logo} />{" "}
        <p> A simple OCR app for sheet music </p>{" "}
      </div>
    );
  }*/

  render() {
    const isLoading = this.state.isLoading;
    return (
      <div>
        <h1>Document Sets</h1>
        {isLoading && <p>Loading....</p>}
        {!isLoading && this.renderDocumentSetList()}
      </div>
    );
  }
}
