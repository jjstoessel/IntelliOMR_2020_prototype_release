import React from "react";
import "./Phase3.css";

import SymbolEditor from "../../components/symbolEditor";
import { Tabs, Tab } from "react-bootstrap";
import { connect } from "react-redux";
import {
  updateStaffSymbols,
  tagVoice,
  updateDocumentStaff,
} from "../../store/actions/documentSetActions";
import DocumentImageLoader from "../DocumentImageLoader";

class Phase4 extends React.Component {
  constructor(props) {
    super(props);
    this.redraw = this.redraw.bind(this);
    this.state = {
      visiblePage: 0,
      visibleStaff: 0,
    };
    this.setVisiblePage = this.setVisiblePage.bind(this);
    this.setVisibleStaff = this.setVisibleStaff.bind(this);
    this.saveCurrentSymbols = this.saveCurrentSymbols.bind(this);
  }

  redraw() {
    this.forceUpdate();
  }

  setVisiblePage(page) {
    this.setState({
      visiblePage: parseInt(page.key),
      visibleStaff: 0,
    });
  }

  setVisibleStaff(staff) {
    this.setState({
      visibleStaff: parseInt(staff.key),
    });
  }

  saveCurrentSymbols(symbols) {
    let visiblePage = this.state.visiblePage;
    let visibleStaff = this.state.visibleStaff;
    let pointsId = visiblePage + "_" + visibleStaff;
    let staffData = this.props.imageData.staffs[pointsId];

    this.props.updateStaffSymbols(
      visiblePage,
      visibleStaff,
      symbols,
      staffData
    );
  }

  renderSymbolEditor(pageStaffLocations, staffData, symbols) {
    if (!staffData) return;
    let staffId =
      this.props.selectedImageId +
      "_" +
      this.state.visiblePage +
      "_" +
      this.state.visibleStaff;
    return (
      <DocumentImageLoader
        imageUrl={pageStaffLocations[this.state.visiblePage].url}
      >
        <SymbolEditor
          staffId={staffId}
          area={staffData}
          symbols={symbols}
          image={pageStaffLocations[this.state.visiblePage].url}
          orientation={pageStaffLocations[this.state.visiblePage].orientation}
          updateSelectedImageRegions={this.updateSelectedImageRegions}
          page={this.state.visiblePage}
          staff={this.state.visibleStaff}
          saveSymbols={this.saveCurrentSymbols}
          updateDocumentStaff={this.props.updateDocumentStaff}
          selectedImageId={this.props.selectedImageId}
        />
      </DocumentImageLoader>
    );
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <ol>
          <li>
            Check to see if the top and bottom lines have been correctly
            identified for each staff. If they are inaccurate, use the &#8593;
            and &#8595; tools below to redraw them more accurately.
          </li>
          <li>
            Click on "classify" below to automatically classify the symbols in
            the image. And then use the interface to correct/ammend the output.
          </li>
        </ol>

        <p>
          Note: toggle the "add to training set" button to ON to allow
          corrections to be added to the training set to refine the automated
          classification.
        </p>
      </div>
    );
  }

  render() {
    let image = this.props.imageData;
    let pageStaffLocations = [];
    let symbols = {};

    let state = "";
    let staffLocations = null;

    let visiblePage = this.state.visiblePage;
    let visibleStaff = this.state.visibleStaff;
    let staffData = [];
    //alert("last phase run = " + image.lastPhaseRun);

    if (image) {
      if (image.lastPhaseRun < 4) {
        state = "not run";
      } else {
        state = "ok";
        pageStaffLocations = image.pageStaffLocations;
        visiblePage = Math.min(visiblePage, pageStaffLocations.length - 1);
        staffLocations =
          pageStaffLocations[this.state.visiblePage].staffLocations;
        if (!staffLocations) {
          state = "image loading";
        } else {
          visibleStaff = Math.min(visibleStaff, staffLocations.length - 1);
          let pointsId = visiblePage + "_" + visibleStaff;
          staffData = image.staffs[pointsId];
          if (staffData) {
            symbols = staffData.symbols;
            if (!symbols) symbols = {};
          }
        }
      }
    } else {
      image = null;
      state = "not selected";
    }

    return (
      <div className="Phase4">
        <h2>PHASE 4 - identify symbols</h2>
        {state === "not selected" && (
          <div>Please select an image from the left panel.</div>
        )}
        {state === "not run" && (
          <div>Please click on "run" to calculate the image orientation.</div>
        )}
        {state === "image loading" && <div>loading image</div>}
        {(state === "ok" || state === "image loading") && (
          <div>
            {this.renderInstructions()}
            <div>
              <Tabs
                variant="pills"
                defaultActiveKey="0"
                onSelect={(key) => this.setVisiblePage({ key })}
              >
                {pageStaffLocations.map((page, index) => (
                  <Tab
                    key={index}
                    eventKey={"" + index}
                    title={"page " + (index + 1)}
                  />
                ))}
              </Tabs>
            </div>
            <hr />
            {state !== "image loading" && (
              <div>
                <Tabs
                  variant="pills"
                  defaultActiveKey="0"
                  onSelect={(key) => this.setVisibleStaff({ key })}
                >
                  {staffLocations.map((page, index) => (
                    <Tab
                      key={index}
                      eventKey={"" + index}
                      title={"staff " + (index + 1)}
                    />
                  ))}
                </Tabs>
                {this.renderSymbolEditor(
                  pageStaffLocations,
                  staffData,
                  symbols
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  selectedImageId: state.documentSet.currentImageId,
  imageData: state.documentSet.currentImageData,
});

export default connect(mapStateToProps, {
  updateStaffSymbols,
  tagVoice,
  updateDocumentStaff,
})(Phase4);
