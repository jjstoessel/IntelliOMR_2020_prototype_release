import React from "react";
import "./Phase3.css";
import ImageRegionSelector from "../../components/ImageRegionSelector";
import { Tab, Tabs } from "react-bootstrap";
import { connect } from "react-redux";
import {
  updateImage,
  updateImageDataNoSave,
} from "../../store/actions/documentSetActions";
import DocumentImageLoader from "../DocumentImageLoader";
import LoadingDiv from "../../components/common/loadingDiv";

class Phase3 extends React.Component {
  constructor(props) {
    super(props);
    this.redraw = this.redraw.bind(this);
    this.state = {
      selectedPage: 0,
    };
    this.updateRegions = this.updateRegions.bind(this);
    this.updateRegionsNoSave = this.updateRegionsNoSave.bind(this);
  }

  getPageStaffLocations(newRegionInfo) {
    let image = this.props.imageData;
    let pageStaffLocations = image.pageStaffLocations;
    pageStaffLocations[this.state.selectedPage].staffLocations = newRegionInfo;
    //return JSON.stringify(pageStaffLocations);
    return pageStaffLocations;
  }

  orderLocations(locations) {
    for (var i = 0; i < locations.length; i++) {
      let staffLocations = locations[i].staffLocations;
      staffLocations.sort(function (a, b) {
        return a.y - b.y;
      });
      //alert("locations = " + JSON.stringify(staffLocations));
    }
  }

  async updateRegions(regions) {
    let locations = this.getPageStaffLocations(regions);
    this.orderLocations(locations);

    this.props.updateImage({
      id: this.props.imageData.id,
      lastPhaseRun: 3,
      pageStaffLocations: locations,
    });
  }

  async updateRegionsNoSave(regions) {
    this.props.updateImageDataNoSave({
      id: this.props.imageData.id,
      lastPhaseRun: 3,
      pageStaffLocations: this.getPageStaffLocations(regions),
    });
  }

  redraw() {
    this.forceUpdate();
  }

  selectPage(key) {
    let page = parseInt(key.key);
    this.setState({
      selectedPage: page,
    });
  }

  renderRegionSelector(pageStaffLocations) {
    return (
      <DocumentImageLoader
        imageUrl={pageStaffLocations[this.state.selectedPage].url}
      >
        <ImageRegionSelector
          updateRegions={this.updateRegions}
          updateRegionsNoSave={this.updateRegionsNoSave}
          pageBoundaries={
            pageStaffLocations[this.state.selectedPage].staffLocations
          }
          orientation={pageStaffLocations[this.state.selectedPage].orientation}
        />
      </DocumentImageLoader>
    );
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <p>
          Individual staff boundaries have been automatically detected. Please
          use the interface below to correct/add/remove staff boundaries.
        </p>
      </div>
    );
  }

  render() {
    let image = this.props.imageData;

    let pageStaffLocations = [];

    let state = "";

    if (image) {
      if (image.lastPhaseRun < 3) {
        state = "not run";
      } else {
        state = "ok";
        pageStaffLocations = image.pageStaffLocations;
        //alert("page staff locations = " + image.pageStaffLocations);
      }
    } else {
      image = null;
      state = "not selected";
    }

    return (
      <div>
        <h2>PHASE 3 - identify staffs</h2>
        {state === "not selected" && (
          <div>Please select an image from the left panel.</div>
        )}
        {state === "not run" && (
          <div>Please click on "run" to calculate the image orientation.</div>
        )}
        {state === "image loading" && (
          <div>
            <LoadingDiv />
            Loading image... please wait.
          </div>
        )}

        {(state === "ok" || state === "image loading") && (
          <div>
            {this.renderInstructions()}
            <Tabs
              variant="pills"
              defaultActiveKey="0"
              id="pageSelectorPhase3"
              onSelect={(key) => this.selectPage({ key })}
            >
              {pageStaffLocations.map((page, index) => (
                <Tab
                  key={index}
                  eventKey={"" + index}
                  title={"page " + (index + 1)}
                >
                  {this.state.selectedPage === index && (
                    <div>{this.renderRegionSelector(pageStaffLocations)}</div>
                  )}
                </Tab>
              ))}
            </Tabs>
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

export default connect(mapStateToProps, { updateImage, updateImageDataNoSave })(
  Phase3
);
