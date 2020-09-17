import React from "react";
import config from "../config";
import uuid from "uuid";

export default class DocumentImageLoader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      imageSrc: null,
      imageId: null,
      imageUrl: null
    };
    this.loadImage = this.loadImage.bind(this);
    this.imageUrl = null;
  }

  loadImage(imageUrl) {
    this.imageUrl = imageUrl;
    this.setState({
      loading: true,
      imageSrc: null,
      imageId: this.props.selectedImageId,
      imageUrl: imageUrl
    });

    var newImg = new Image();

    var _this = this;
    newImg.onload = function() {
      _this.setState({
        loading: false,
        imageSrc: newImg
      });
    };
    newImg.crossOrigin = "Anonymous";
    newImg.src = imageUrl + "?v=" + uuid.v1();
  }

  getImageUrl() {
    if (!this.props.imageUrl) return null;
    return config.s3.IMAGEURL + this.props.imageUrl;
  }

  render() {
    let imageUrl = this.getImageUrl();

    let _this = this;
    if (imageUrl && this.imageUrl !== imageUrl) {
      this.imageUrl = imageUrl;
      setTimeout(function() {
        _this.loadImage(imageUrl);
      }, 0);
    }
    let loading = this.state.loading;
    let newPage = React.cloneElement(this.props.children, {
      imageLoading: loading,
      imageSrc: this.state.imageSrc
    });
    return newPage;
  }
}
