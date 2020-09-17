import React from "react";
import "./Phase1.css";
import { connect } from "react-redux";
import { updateImage } from "../../store/actions/documentSetActions";
import LoadingDiv from "../../components/common/loadingDiv";

class Phase1 extends React.Component {
  constructor(props) {
    super(props);

    this.rotateImage = this.rotateImage.bind(this);
  }

  rotateImage(amount) {
    this.props.updateImage({
      id: this.props.imageData.id,
      lastPhaseRun: 1,
      calculatedOrientation:
        this.props.imageData.calculatedOrientation + amount,
    });
  }

  renderInstructions() {
    return (
      <div className="instructions">
        <h1>Instructions</h1>
        <p>
          The orientation for the page has been automatically detected. Please
          use the buttons below to adjust the value if you believe it is
          inaccuate.
        </p>
      </div>
    );
  }

  render() {
    let rot = 0.0;
    let image = this.props.imageData;
    let imageStyle = {};
    let src = this.props.imageSrc;
    let loadedImage = !this.props.imageLoading;

    // 3 states
    // not selected
    // phase not run
    // image loading
    // ok
    let state = "";

    if (image) {
      if (image.lastPhaseRun < 1) {
        state = "not run";
      } else {
        if (!loadedImage) {
          state = "image loading";
        } else {
          state = "ok";
          rot = -image.calculatedOrientation;
          imageStyle = {
            transform: "rotate(" + rot + "deg)",
          };

          //url = config.s3.IMAGEURL + image.mediumImage;
        }
      }
    } else {
      image = null;
      state = "not selected";
    }

    return (
      <div className="Phase1">
        <h2>PHASE 1 - fix page orientation</h2>
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
            <div>orientation = {rot.toFixed(2)} degrees</div>
            {image && (
              <div>
                <button
                  onClick={() => {
                    this.rotateImage(-1.0);
                  }}
                >
                  &lt;&lt;
                </button>
                <button
                  onClick={() => {
                    this.rotateImage(-0.1);
                  }}
                >
                  &lt;
                </button>
                <button
                  onClick={() => {
                    this.rotateImage(0.1);
                  }}
                >
                  &gt;
                </button>
                <button
                  onClick={() => {
                    this.rotateImage(1.0);
                  }}
                >
                  &gt;&gt;
                </button>
                <div className="imageArea">
                  <img
                    alt="rotatedImage"
                    className="rotatedImage"
                    style={imageStyle}
                    src={src.src}
                  />
                  <div className="gridOverlay" />
                </div>
              </div>
            )}
            {!image && <div>Please select an image</div>}
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

export default connect(mapStateToProps, { updateImage })(Phase1);
