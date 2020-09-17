import React, { Component } from "react";
import { withRouter } from "react-router-dom";
import { Nav, Navbar } from "react-bootstrap";
import { Auth } from "aws-amplify";
import { Provider } from "react-redux";

import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faCog,
  faSpinner,
  faArrowLeft,
  faMousePointer,
  faEraser,
  faPencilAlt,
  faArrowUp,
  faArrowDown,
} from "@fortawesome/free-solid-svg-icons";

import "./App.css";
import Routes from "./Routes";
import store from "./store/store.js";

library.add(faCog);
library.add(faSpinner);
library.add(faArrowLeft);
library.add(faMousePointer);
library.add(faEraser);
library.add(faPencilAlt);
library.add(faArrowUp);
library.add(faArrowDown);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isAuthenticated: false,
      isAuthenticating: true,
      isOpen: false,
    };
  }

  userHasAuthenticated = (authenticated) => {
    this.setState({ isAuthenticated: authenticated });
    this.props.history.push("/userdocumentsets");
  };

  handleLogout = async (event) => {
    await Auth.signOut();
    this.userHasAuthenticated(false);
    this.props.history.push("/login");
  };

  async componentDidMount() {
    try {
      await Auth.currentSession();
      this.userHasAuthenticated(true);
    } catch (e) {
      if (e !== "No current user") {
        alert("error in App did mount " + JSON.stringify(e));
      }
    }
    this.setState({ isAuthenticating: false });
  }

  render() {
    const childProps = {
      isAuthenticated: this.state.isAuthenticated,
      userHasAuthenticated: this.userHasAuthenticated,
    };

    return (
      <Provider store={store}>
        {!this.state.isAuthenticating && (
          <div className="App">
            <Navbar bg="dark" variant="dark" expand="md">
              <Navbar.Brand href="/">IntelliOMR</Navbar.Brand>

              <Navbar.Toggle aria-controls="responsive-navbar-nav" />
              <Navbar.Collapse
                id="responsive-navbar-nav"
                className="justify-content-end"
              >
                {!childProps.isAuthenticated && (
                  <Navbar.Text>
                    <Nav className="mr-auto">
                      <Nav.Link href="signup">Signup</Nav.Link>
                      <Nav.Link href="login">Login</Nav.Link>
                    </Nav>
                  </Navbar.Text>
                )}
                {childProps.isAuthenticated && (
                  <Navbar.Text>
                    <Nav className="mr-auto">
                      <Nav.Link href="#" onClick={this.handleLogout}>
                        Logout
                      </Nav.Link>
                    </Nav>
                  </Navbar.Text>
                )}
              </Navbar.Collapse>
            </Navbar>
            <Routes childProps={childProps} />
          </div>
        )}
      </Provider>
    );
  }
}

export default withRouter(App);
