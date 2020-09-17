import React from "react";
import { Button } from "react-bootstrap";
import "./LoaderButton.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

export default ({
  isLoading,
  text,
  loadingText,
  className = "",
  disabled = false,
  ...props
}) => (
  <Button
    className={`LoaderButton ${className}`}
    disabled={disabled || isLoading}
    {...props}
  >
    {isLoading && <FontAwesomeIcon icon="spinner" className="fa-spin" />}{" "}
    {!isLoading ? text : loadingText}
  </Button>
);
