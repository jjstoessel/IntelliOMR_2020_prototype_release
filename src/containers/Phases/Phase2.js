import React from "react";
import ImageRegionSelector from "../../components/ImageRegionSelector";
import { connect } from "react-redux";
import {
  updateImage,
  updateImageDataNoSave,
} from "../../store/actions/documentSetActions";
import LoadingDiv from "../../components/common/loadingDiv";

class Phase2 extends React.Component {
  constructor(props) {
    super(props);
    this.redraw = this.redraw.bind(this);
    this.updateRegions = this.updateRegions.bind(this);
    this.updateRegionsNoSave = this.updateRegionsNoSave.bind(this);
  }

  redraw() {
    this.forceUpdate();
  }

  orderRegions(regions) {
    regions.sort(function (a, b) {
      return a.x + a.y / 10 - (b.x + b.y / 10);
    });
  }

  async updateRegions(regions) {
    this.orderRegions(regions);
    this.props.updateImage({
      id: this.props.imageData.id,
      lastPhaseRun: 2,
      pageBoundaries: regions,
    });
  }

  async updateRegionsNoSave(regions) {
    this.props.updateImageDataNoSave({
      id: this.props.imageData.id,
      lastPhaseRun: 2,
      pageBoundaries: regions,
    });
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <p>
          Individual page boundaries have been automatically detected. Please
          use the interface below to correct/add/remove page boundaries.
        </p>
      </div>
    );
  }

  render() {
    let rot = 0.0;
    let image = this.props.imageData;
    let loadedImage = !this.props.imageLoading;
    let src = this.props.imageSrc;

    // 3 states
    // not selected
    // phase not run
    // image loading
    // ok
    let state = "";
    let pageBoundaries = null;

    if (image) {
      if (image.lastPhaseRun < 2) {
        state = "not run";
      } else {
        if (!loadedImage) {
          state = "image loading";
        } else {
          state = "ok";
          rot = image.calculatedOrientation;
          pageBoundaries = image.pageBoundaries;
          //alert(
          //  "page boundaries = " +
          //    pageBoundaries.length +
          //    JSON.stringify(pageBoundaries)
          //);
        }
      }
    } else {
      image = null;
      state = "not selected";
    }

    return (
      <div>
        <h2>PHASE 2 - identify page boundaries</h2>
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

        {state === "ok" && (
          <div>
            {this.renderInstructions()}
            <ImageRegionSelector
              updateRegions={this.updateRegions}
              updateRegionsNoSave={this.updateRegionsNoSave}
              pageBoundaries={pageBoundaries}
              imageSrc={src}
              orientation={rot}
              imageLoading={this.props.imageLoading}
            />
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
  Phase2
);
