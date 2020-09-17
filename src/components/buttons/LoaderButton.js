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
  variant,
  ...props
}) => (
  <Button
    className={`LoaderButton ${className}`}
    disabled={disabled || isLoading}
    variant={variant}
    {...props}
  >
    {isLoading && <FontAwesomeIcon icon="spinner" className="fa-spin" />}
    <span> </span>
    {!isLoading ? text : loadingText}
  </Button>
);
