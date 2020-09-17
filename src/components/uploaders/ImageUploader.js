import React from "react";
import { Button, Modal, ProgressBar } from "react-bootstrap";
import "./ImageUploader.css";
import { s3UploadImageFromFile } from "../../libs/awsLib";
import LoaderButton from "./LoaderButton";
import { graphqlOperation, API } from "aws-amplify";
import * as mutations from "../../graphql/mutations";
import { connect } from "react-redux";
import { fetchDocumentImages } from "../../store/actions/documentSetActions";

const uuidv1 = require("uuid/v1");

class ImageUploader extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      modal: false,
      uploading: false,
      selectedFiles: [],
      currentFileBeingSaved: "",
      uploadingProgress: 0,
    };

    this.close = this.close.bind(this);
    this.selectFiles = this.selectFiles.bind(this);
    this.uploadFiles = this.uploadFiles.bind(this);
  }

  close() {
    this.setState({
      selectedFiles: [],
      uploading: false,
    });
    this.props.closeImageUploader();
  }

  async saveImageId(imageList, name) {
    let documentSet = this.props.documentSetId;

    try {
      await API.graphql(
        graphqlOperation(mutations.createDocumentImage, {
          input: {
            id: uuidv1(),
            imageName: name,
            smallImage: imageList.small,
            mediumImage: imageList.medium,
            largeImage: imageList.large,
            lastPhaseRun: 0,
            documentSetId: documentSet,
            documentImageDocumentSetInfoId: documentSet,
          },
        })
      );
    } catch (e) {
      alert("error in ImageUploader saveImageId " + JSON.stringify(e));
    }
  }

  async uploadFiles() {
    this.setState({
      uploading: true,
    });
    const files = this.state.selectedFiles;
    for (var i = 0; i < files.length; i++) {
      const file = files[i];

      this.setState({
        currentFileBeingSaved: file.name,
        uploadingProgress: Math.round((i * 100) / files.length),
      });
      const attachment_full = await s3UploadImageFromFile(file.rawFile, 2000);
      const attachment_medium = await s3UploadImageFromFile(file.rawFile, 600);
      const attachment_thumbnail = await s3UploadImageFromFile(
        file.rawFile,
        100
      );
      await this.saveImageId(
        {
          small: attachment_thumbnail,
          medium: attachment_medium,
          large: attachment_full,
        },
        file.name
      );
      if (!this.state.uploading) break;
    }
    //PhaseModel._notifyListeners();
    let documentSetId = this.props.documentSetId;
    this.props.fetchDocumentImages(documentSetId);
    //this.props.fetchThumbnails(documentSet);
    //await PhaseModel.loadDocumentImages(documentSet);
    //RunPhasesModel._updatePhaseProgress();

    this.close();
  }

  selectFiles() {
    var input = document.createElement("input");
    input.type = "file";
    input.multiple = true;
    var _this = this;

    input.onchange = function () {
      let files = input.files;
      const ValidImageTypes = ["image/gif", "image/jpeg", "image/png"];

      let fileList = _this.state.selectedFiles;

      for (var i = 0; i < files.length; i++) {
        var file = files[i];

        if (ValidImageTypes.indexOf(file.type) >= 0) {
          fileList.push({
            name: file.name,
            rawFile: file,
          });
        } else {
          alert(
            file.name +
              " is not of a valid type.  Images should be gif / jpeg or png "
          );
        }
      }
      _this.setState({ selectedFiles: fileList });
    };
    input.click();
  }

  render() {
    const isOpen = this.props.isVisible;
    const selectedFiles = this.state.selectedFiles;
    const uploading = this.state.uploading;
    const uploadingProgress = this.state.uploadingProgress;

    return (
      <Modal show={isOpen} onHide={this.close} className={this.props.className}>
        <Modal.Header closeButton>Image Uploader</Modal.Header>
        <Modal.Body>
          {uploading && (
            <div>
              <h4>Uploading files...</h4>
              <p>
                Current file being uploaded:
                {this.state.currentFileBeingSaved}
              </p>
              <div className="text-center">{uploadingProgress}%</div>
              <ProgressBar now={uploadingProgress} />
            </div>
          )}
          {!uploading && (
            <div>
              {selectedFiles.length === 0 && (
                <p>You have no files selected. Click on Select Files below:</p>
              )}

              {selectedFiles.map((file) => (
                <div key={file.name}>{file.name}</div>
              ))}
              <Button onClick={this.selectFiles}>Select Files</Button>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedFiles.length > 0 && (
            <LoaderButton
              className="btn-success"
              color="success"
              onClick={this.uploadFiles}
              isLoading={uploading}
              text="Upload"
              loadingText="Uploading"
            >
              Upload
            </LoaderButton>
          )}{" "}
          <Button
            variant="danger"
            onClick={() => this.close()}
            disabled={uploading}
          >
            Cancel
          </Button>
        </Modal.Footer>
      </Modal>
    );
  }
}

const mapStateToProps = (state) => ({
  documentSetId: state.documentSet.documentSetId,
});

export default connect(mapStateToProps, { fetchDocumentImages })(ImageUploader);
