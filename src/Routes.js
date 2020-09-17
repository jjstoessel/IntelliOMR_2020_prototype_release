import React, { Component } from "react";
import { Route, Switch } from "react-router-dom";
import Home from "./pages/home/Home";
import NotFound from "./pages/notFound/NotFound";
import Login from "./pages/loginAndSignup/Login";
import AppliedRoute from "./components/AppliedRoute";
import Signup from "./pages/loginAndSignup/Signup";
import DocumentSetInfo from "./containers/userDocumentSetLists/DocumentSetInfo";
import DocumentSetMain from "./containers/DocumentSetMain";
import UserDocumentSetList from "./pages/UserDocumentSetList/UserDocumentSetList";

import AuthenticatedRoute from "./components/AuthenticatedRoute";
import UnauthenticatedRoute from "./components/UnauthenticatedRoute";

export default class Routes extends Component {
  render() {
    let childProps = this.props.childProps;

    return (
      <Switch>
        <AppliedRoute path="/" exact component={Home} props={childProps} />
        <UnauthenticatedRoute
          path="/login"
          exact
          component={Login}
          props={childProps}
        />
        <UnauthenticatedRoute
          path="/signup"
          exact
          component={Signup}
          props={childProps}
        />

        <AuthenticatedRoute
          path="/documentsetinfo/:id"
          exact
          component={DocumentSetInfo}
          props={childProps}
        />
        <AuthenticatedRoute
          path="/documentset/:id"
          exact
          component={DocumentSetMain}
          props={childProps}
        />
        <AuthenticatedRoute
          path="/userdocumentsets"
          exact
          component={UserDocumentSetList}
          props={childProps}
        />

        <Route component={NotFound} />
      </Switch>
    );
  }
}
