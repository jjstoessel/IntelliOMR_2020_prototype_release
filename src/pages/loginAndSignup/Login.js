import React, { Component } from "react";
import { Form, Button } from "react-bootstrap";
import LoaderButton from "../../components/uploaders/LoaderButton";
import "./Login.css";
import { Auth } from "aws-amplify";

export default class Login extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoading: false,
      phase: "signin",
      email: "",
      password: "",
      newpassword: "",
      newpassword2: "",
    };
  }
  validateForm() {
    return this.state.email.length > 0 && this.state.password.length > 0;
  }
  handleChange = (event) => {
    this.setState({
      [event.target.id]: event.target.value,
    });
  };
  handleSubmit = async (event) => {
    event.preventDefault();
    this.setState({ isLoading: true });

    try {
      await Auth.signIn(this.state.email, this.state.password);
      this.props.userHasAuthenticated(true);
    } catch (e) {
      alert("error in Login handleSubmit " + JSON.stringify(e.message));
      this.setState({ isLoading: false });
    }
  };

  forgotPassword() {
    this.setState({
      phase: "forgotPassword",
    });
  }

  cancelVerify() {
    this.setState({
      phase: "signin",
    });
  }

  sendEmailReset() {
    this.setState({
      submittingPasswordReset: true,
    });
    Auth.forgotPassword(this.state.resetPasswordEmail)
      .then((data) => {
        this.setState({
          phase: "confirmationCode",
          submittingPasswordReset: false,
        });
      })
      .catch((e) => {
        this.setState({
          submittingPasswordReset: false,
        });
        //MessageServer._showErrorMessage(e.message, false);
        alert(e.message);
      });
  }

  validatePassword() {
    const password = this.state.newpassword.trim();
    if (password.length < 8)
      return "passwords need to contain at least 8 characters";
    return "";
  }

  validatePasswordMatch() {
    const password1 = this.state.newpassword;
    const password2 = this.state.newpassword2;
    if (password1 !== password2) return "passwords must match";
    return "";
  }

  formIsValid() {
    var errors = this.validatePassword() + this.validatePasswordMatch();
    if (errors.length > 0) return false;
    return true;
  }

  async changePassword() {
    this.setState({
      submittingPasswordReset: true,
    });
    Auth.forgotPasswordSubmit(
      this.state.resetPasswordEmail,
      this.state.passwordResetCode,
      this.state.newpassword
    )
      .then((data) => {
        this.setState({
          phase: "signin",
          submittingPasswordReset: false,
        });
        alert(
          "You have successfully changed your password.  You can now login."
        );
      })
      .catch((e) => {
        this.setState({
          submittingPasswordReset: false,
        });
        alert(e.message);
      });
  }

  render() {
    const password1Error = this.validatePassword();
    const password2Error = this.validatePasswordMatch();
    const formIsValid = this.formIsValid();

    return (
      <div className="Login">
        {this.state.phase === "signin" && (
          <form onSubmit={this.handleSubmit}>
            <h1>Login</h1>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                id="email"
                autoFocus
                value={this.state.email}
                onChange={this.handleChange}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>Password</Form.Label>
              <Form.Control
                id="password"
                value={this.state.password}
                onChange={this.handleChange}
                type="password"
              />
              <div class="small clearfix">
                <span class="float-right">
                  <a
                    href="#"
                    class="button"
                    onClick={(e) => this.forgotPassword(e)}
                  >
                    Forgot/Reset Password
                  </a>
                </span>
              </div>
            </Form.Group>
            <LoaderButton
              block
              disabled={!this.validateForm()}
              type="submit"
              isLoading={this.state.isLoading}
              text="Login"
              variant="success"
              loadingText="Logging in…"
            />
          </form>
        )}
        {this.state.phase === "forgotPassword" && (
          <form>
            <h4>Forgotten Password</h4>
            <p>
              Please enter your email address, and we will send you a
              verification code to enable you to change your password
            </p>
            <div class="form-group">
              <label>Email:</label>
              <input
                type="email"
                class="form-control"
                id="resetPasswordEmail"
                value={this.state.resetPasswordEmail}
                onChange={this.handleChange}
              />
            </div>

            <LoaderButton
              className="btn-success btn-block"
              onClick={(e) => this.sendEmailReset(e)}
              text="Submit"
              variant="success"
              loadingText="Submitting ..."
              isLoading={this.state.submittingPasswordReset}
            />

            <Button
              variant="danger"
              className="btn-block"
              onClick={(e) => this.cancelVerify(e)}
            >
              Cancel
            </Button>
          </form>
        )}
        {this.state.phase === "confirmationCode" && (
          <form>
            <h4>Reset Password</h4>
            <p>
              You have been sent a verification code to your email address.
              Please enter this code below in order to change your password:
            </p>
            <div class="form-group">
              <label for="myemail">Code:</label>
              <input
                type="text"
                class="form-control"
                id="passwordResetCode"
                value={this.state.passwordResetCode}
                onChange={this.handleChange}
              />
            </div>
            <div class="form-group">
              <label for="myemail">Type your new password:</label>
              <input
                type="password"
                class="form-control"
                id="newpassword"
                value={this.state.newpassword}
                onChange={this.handleChange}
              />
              {this.state.newpassword.length > 0 && (
                <div class="text-danger">{password1Error}</div>
              )}
            </div>
            <div class="form-group">
              <label for="myemail">Retype your password:</label>
              <input
                type="password"
                class="form-control"
                id="newpassword2"
                value={this.state.newpassword2}
                onChange={this.handleChange}
              />
              {this.state.newpassword2.length > 0 && (
                <div class="text-danger">{password2Error}</div>
              )}
            </div>

            <LoaderButton
              className="btn-block"
              disabled={!formIsValid}
              variant="success"
              onClick={(e) => this.changePassword(e)}
              text="Submit"
              loadingText="Submitting..."
              isLoading={this.state.submittingPasswordReset}
            />

            <Button
              variant="danger"
              className="btn-block"
              onClick={(e) => this.cancelVerify(e)}
            >
              Cancel
            </Button>
          </form>
        )}
      </div>
    );
  }
}
