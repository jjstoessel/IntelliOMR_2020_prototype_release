import React, { Component } from "react";
import { Form, Button, Table, thead, tr, th } from "react-bootstrap";
import LoaderButton from "../../components/uploaders/LoaderButton";
import "./DocumentSetInfo.css";
import { getUserEmail } from "../../libs/awsLib";
import { graphqlOperation, API } from "aws-amplify";

import * as mutations from "../../graphql/mutations";
import * as myqueries from "../../graphql/myqueries";

const uuidv1 = require("uuid/v1");

export default class DocumentSetInfo extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isLoading: true,
      entityId: "-1",
      name: "",
      description: "",
      users: [],
    };
    getUserEmail().then((email) => (this.state.currentUserEmail = email));
  }

  async reloadUsers() {
    try {
      const id = this.state.entityId;

      let docSetInfo = await API.graphql(
        graphqlOperation(myqueries.getDocumentSetInfo, {
          id: id,
        })
      );
      docSetInfo = docSetInfo.data.getDocumentSetInfo;
      this.setState({
        users: docSetInfo.users.items,
      });
    } catch (e) {
      console.log(JSON.stringify(e));
      alert(e);
    }
  }

  async componentDidMount() {
    try {
      const id = this.props.match.params.id;
      const email = await getUserEmail();
      this.setState({
        entityId: id,
        userID: email,
      });
      if (id === "-1") {
        this.setState({
          users: [email],
        });
      } else {
        let docSetInfo = await API.graphql(
          graphqlOperation(myqueries.getDocumentSetInfo, {
            id: id,
          })
        );
        docSetInfo = docSetInfo.data.getDocumentSetInfo;
        this.setState({
          name: docSetInfo.name,
          description: docSetInfo.description,
          users: docSetInfo.users.items,
        });
      }
    } catch (e) {
      alert(e);
    }
    this.setState({
      isLoading: false,
    });
  }

  validateForm() {
    return this.state.name.length > 0;
  }

  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };

  cancel() {
    this.props.history.push("/userdocumentsets");
  }

  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ isLoading: true });

    try {
      if (this.state.entityId === "-1") {
        // this is new!
        let id = uuidv1();

        await API.graphql(
          graphqlOperation(mutations.createDocumentSetInfo, {
            input: {
              id: id,
              name: this.state.name,
              description: this.state.description,
            },
          })
        );

        // now, link to user
        await API.graphql(
          graphqlOperation(mutations.createUserDocumentSets, {
            input: {
              id: uuidv1(),
              userID: this.state.userID,
              userDocumentSetsDocumentSetInfoId: id,
            },
          })
        );
      } else {
        // we are updating!
        await API.graphql(
          graphqlOperation(mutations.updateDocumentSetInfo, {
            input: {
              id: this.state.entityId,
              name: this.state.name,
              description: this.state.description,
            },
          })
        );
      }
    } catch (error) {
      alert(error);
      console.log(JSON.stringify(error));
      this.setState({ isLoading: false });
      return;
    }
    this.props.history.push("/userdocumentsets");
  };

  editDocumentSetInfo(info) {
    return API.post("music-ocr-app-api", "/update_document_set_info", {
      body: info,
    });
  }

  async inviteUser() {
    var person = prompt(
      "Please enter the email address of the person you would like to add"
    );
    person = person.trim();

    if (person === null || person === "") {
    } else {
      await API.graphql(
        graphqlOperation(mutations.createUserDocumentSets, {
          input: {
            id: uuidv1(),
            userID: person,
            userDocumentSetsDocumentSetInfoId: this.state.entityId,
          },
        })
      );
    }
    this.reloadUsers();
  }

  async removeUser(id) {
    if (window.confirm("Do you really wish to unsubscribe this user!")) {
      await API.graphql(
        graphqlOperation(mutations.deleteUserDocumentSets, {
          input: {
            id: id,
          },
        })
      );
      this.reloadUsers();
    }
  }

  renderUsers() {
    if (this.state.entityId === "-1") return <div />;
    return (
      <div className="userList">
        <h3>Current Users</h3>
        <Table striped bordered>
          <thead>
            <tr>
              <th>#</th>
              <th>email</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {this.state.users.map((user, index) => (
              <tr key={user.id}>
                <td>{index + 1}</td>
                <td>{user.userID}</td>
                <td>
                  <Button
                    variant="danger"
                    onClick={() => this.removeUser(user.id)}
                  >
                    Remove User
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
        <div>* to delete this Document Set, remove all the users</div>
        <Button onClick={() => this.inviteUser()}>Invite User</Button>
      </div>
    );
  }

  render() {
    const isLoading = this.state.isLoading;
    let buttonText = "Create";
    if (this.state.entityId !== "-1") buttonText = "Update";

    return (
      <div className="DocumentSetInfo container">
        <h1>Document Set Info</h1>
        {isLoading && <p>Loading...</p>}
        {!isLoading && (
          <form onSubmit={this.handleSubmit}>
            <Form.Group>
              <Form.Label>Document Set Name:</Form.Label>
              <Form.Control
                type="input"
                id="name"
                onChange={this.handleChange}
                value={this.state.name}
              />
            </Form.Group>

            <Form.Group>
              <Form.Label>Document Set Description:</Form.Label>
              <Form.Control
                type="textarea"
                id="description"
                onChange={this.handleChange}
                value={this.state.description}
              />
            </Form.Group>

            {this.renderUsers()}
            <Form.Group>
              <LoaderButton
                className="btn-success"
                disabled={!this.validateForm()}
                type="submit"
                isLoading={this.state.isLoading}
                text={buttonText}
                loadingText="Saving…"
              />
              <Button variant="danger" onClick={() => this.cancel()}>
                Cancel
              </Button>
            </Form.Group>
          </form>
        )}
      </div>
    );
  }
}
