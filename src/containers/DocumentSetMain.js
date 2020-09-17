import React, { Component } from "react";
import "./DocumentSetMain.css";
import { LinkContainer } from "react-router-bootstrap";
import { connect } from "react-redux";

import { Row, Col, Tab, Tabs } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import DocumentScanList from "./documentScans/DocumentScanList";
import RunProject from "./Phases/RunProject";
//import PhaseModel from "../libs/PhaseModel";
//import RunPhasesModel from "../libs/RunPhasesModel";
import Phase1 from "./Phases/Phase1";
import Phase2 from "./Phases/Phase2";
import Phase3 from "./Phases/Phase3";
import Phase4 from "./Phases/Phase4";
import MeiExport from "./Phases/MeiExport";
import TrainNetwork from "./Phases/TrainNetwork";
import network from "../libs/network";
import DocumentImageLoader from "./DocumentImageLoader";
import { getUserEmail } from "../libs/awsLib";
import config from "../config";
/*import {
  updateDocumentStaff,
  updateImageData
} from "../store/actions/imageActions";*/
import { fetchDocumentImages } from "../store/actions/documentSetActions";

class DocumentSetMain extends Component {
  constructor(props) {
    super(props);
    this._redraw = this._redraw.bind(this);
    this.state = {
      selectedImageId: null,
      key: "run",
      canTrainNetwork: false,
    };
    this.selectImage = this.selectImage.bind(this);
    this.updateStaffInfo = this.updateStaffInfo.bind(this);
  }

  async canTrainNetwork() {
    // returns true if the current user is in the whitelist
    const email = await getUserEmail();
    const whitelist = config.canTrainNetwork;
    return whitelist.indexOf(email) >= 0;
  }

  async componentDidMount() {
    this.props.fetchDocumentImages(this.props.match.params.id);

    // lets load the network if it exits
    network.loadNetwork();
    let canTrain = await this.canTrainNetwork();
    this.setState({ canTrainNetwork: canTrain });
  }

  _redraw() {
    this.forceUpdate();
  }

  showPage(key) {
    this.setState({ key: key });
  }

  selectImage(imageId) {
    //alert("selecting image:" + imageId);
    this.setState({ selectedImageId: imageId });
  }

  renderPage(key) {
    let currentState = this.state.key;
    let selectedImageId = this.props.selectedImageId;

    if (key !== currentState) return <div />;

    let documentSetId = this.props.match.params.id;
    if (key === "run") return <RunProject documentSetId={documentSetId} />;

    // now, suppres if isRunning
    let isRunning = false;
    //RunPhasesModel._isRunning();
    if (isRunning)
      return (
        <div>
          sorry, you cannot view these phases while the pages are processing.
        </div>
      );

    if (!selectedImageId && key !== "retrain")
      return <div>Please select an Image.</div>;
    let mainImage = null;
    if (this.props.imageData) {
      mainImage = this.props.imageData.mediumImage;
    }

    switch (key) {
      case "phase1":
        return (
          <DocumentImageLoader imageUrl={mainImage}>
            <Phase1 />
          </DocumentImageLoader>
        );
      case "phase2":
        return (
          <DocumentImageLoader imageUrl={mainImage}>
            <Phase2 />
          </DocumentImageLoader>
        );
      case "phase3":
        return <Phase3 />;
      case "phase4":
        return <Phase4 updateDocumentStaff={this.updateStaffInfo} />;
      case "MeiExport":
        return <MeiExport />;
      case "retrain":
        return <TrainNetwork />;
      default:
        return <div />;
    }
  }

  updateStaffInfo(imageId, documentStaffInfo, lastPhaseRun) {
    // we need to update documentStaff in 2 places ... thumbnails and in image!
    this.props.updateDocumentStaff(documentStaffInfo);

    this.props.updateImageData({
      id: imageId,
      lastPhaseRun: lastPhaseRun,
    });
  }

  render() {
    //let isLoading = PhaseModel._isDocumentSetLoading();
    //let isRunning = RunPhasesModel._isRunning();
    let isLoading = false;
    let documentSetId = this.props.match.params.id;

    return (
      <div>
        <div className="DocumentSet">
          <LinkContainer to={`/userdocumentsets`}>
            <div className="btn-secondary">
              <a>
                <FontAwesomeIcon icon="arrow-left" /> Back to Document Sets
              </a>
            </div>
          </LinkContainer>
          <Row>
            <Col xs="4" className="bg-light">
              <div className="leftColumn">
                <DocumentScanList documentSetId={documentSetId} />
              </div>
            </Col>
            <Col xs="8">
              {isLoading && (
                <div>
                  <FontAwesomeIcon icon="spinner" className="fa-spin" />{" "}
                  Loading....
                </div>
              )}
              {!isLoading && (
                <Tabs
                  variant="pills"
                  defaultActiveKey="run"
                  id="uncontrolled-tab-example"
                  onSelect={(key) => this.showPage(key)}
                >
                  <Tab eventKey="run" title="Run">
                    {this.renderPage("run")}
                  </Tab>
                  <Tab eventKey="phase1" title="Phase 1">
                    {this.renderPage("phase1")}
                  </Tab>
                  <Tab eventKey="phase2" title="Phase 2">
                    {this.renderPage("phase2")}
                  </Tab>
                  <Tab eventKey="phase3" title="Phase 3">
                    {this.renderPage("phase3")}
                  </Tab>
                  <Tab eventKey="phase4" title="Phase 4">
                    {this.renderPage("phase4")}
                  </Tab>
                  <Tab eventKey="MeiExport" title="MEI Export">
                    {this.renderPage("MeiExport")}
                  </Tab>
                  {this.state.canTrainNetwork && (
                    <Tab eventKey="retrain" title="Retrain">
                      {this.renderPage("retrain")}
                    </Tab>
                  )}
                </Tabs>
              )}
            </Col>
          </Row>
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  selectedImageId: state.documentSet.currentImageId,
  imageData: state.documentSet.currentImageData,
});

export default connect(mapStateToProps, {
  fetchDocumentImages,
})(DocumentSetMain);
