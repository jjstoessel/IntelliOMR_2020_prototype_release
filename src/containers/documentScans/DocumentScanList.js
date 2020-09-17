import React from "react";
import { Button } from "react-bootstrap";
import "./DocumentScanList.css";
import classnames from "classnames";
import ImageUploader from "../../components/uploaders/ImageUploader";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { s3DownloadImage } from "../../libs/awsLib";
import LoadingDiv from "../../components/common/loadingDiv";
import { connect } from "react-redux";

import { LOADING_STATE_LOADED } from "../../store/actions/types";

import {
  deleteImage,
  selectImage
} from "../../store/actions/documentSetActions";

//import PhaseModel from "../../libs/PhaseModel";

class Thumbnail extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      loading: true,
      image: null
    };
  }

  async componentDidMount() {
    let image = await s3DownloadImage(this.props.data.smallImage);
    this.setState({
      loading: false,
      image: image
    });
  }

  render() {
    return (
      <div
        onClick={this.props.select}
        className={classnames({
          Thumbnail: true,
          ImageListItem: !this.props.isSelected,
          SelectedImageListItem: this.props.isSelected
        })}
      >
        {this.state.loading && (
          <div>
            <FontAwesomeIcon icon="spinner" className="fa-spin" />
          </div>
        )}
        {!this.state.loading && <img alt="" src={this.state.image.src} />}
        <div>{this.props.data.imageName}</div>
        <div
          className="DeleteImage"
          onClick={e => this.props.deleteItem(e, this.props.data)}
        >
          X
        </div>
      </div>
    );
  }
}

class DocumentScanList extends React.Component {
  constructor(props) {
    super(props);
    this.running = false;

    this.state = {
      documentSetName: "",
      isLoading: true,
      documentImages: []
    };
    this.closeImageUploader = this.closeImageUploader.bind(this);
  }

  componentWillMount() {
    //this.props.fetchDocumentImages(this.props.documentSetId);
  }

  deleteImage(e, item) {
    e.stopPropagation();
    var r = window.confirm("are you sure you want to delete this image?");
    if (r === true) {
      this.props.deleteImage(item.id);
    }
  }

  showImageUploader() {
    this.setState({
      imageUploaderVisible: true
    });
  }

  async closeImageUploader() {
    //await PhaseModel.reloadDocumentImages();

    this.setState({
      imageUploaderVisible: false
    });
  }

  selectImage(i) {
    this.props.selectImage(i.id, i.mediumImage);
  }

  renderThumbnailList(imageList) {
    const selectedImage = this.props.selectedImageId;

    return (
      <React.Fragment>
        {imageList.length === 0 && (
          <p>
            You currently have no images in this list, please click on the below
            button to upload scans.
          </p>
        )}
        <div className="ScanItems">
          {imageList.map(item => (
            <Thumbnail
              key={item.id}
              data={item}
              isSelected={item.id === selectedImage}
              select={() => this.selectImage(item)}
              deleteItem={e => this.deleteImage(e, item)}
            />
          ))}
        </div>
        <p>
          <Button color="primary" onClick={e => this.showImageUploader(e)}>
            + Upload Images
          </Button>
        </p>
      </React.Fragment>
    );
  }

  render() {
    let { thumbnails, loadingState } = this.props;

    return (
      <div className="DocumentScanList">
        <h3>Document Scans</h3>

        {loadingState === LOADING_STATE_LOADED &&
          this.renderThumbnailList(thumbnails)}
        {loadingState !== LOADING_STATE_LOADED && (
          <div>
            <LoadingDiv />
            Loading thumbnails... please wait.
          </div>
        )}

        <ImageUploader
          isVisible={this.state.imageUploaderVisible}
          closeImageUploader={() => this.closeImageUploader()}
          documentSet={this.props.entityId}
          onUpload={this.loadDocumentImages}
          documentSetId={this.props.documentSetId}
        />
      </div>
    );
  }
}

const mapStateToProps = state => ({
  thumbnails: state.documentSet.documentItems,
  loadingState: state.documentSet.loadingState,
  selectedImageId: state.documentSet.currentImageId
});

export default connect(mapStateToProps, { deleteImage, selectImage })(
  DocumentScanList
);
