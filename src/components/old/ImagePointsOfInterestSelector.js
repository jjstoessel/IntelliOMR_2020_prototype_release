import React from "react";
import "./ImagePointsOfInterestSelector.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";
import { deletePointOfInterest } from "../store/actions/documentSetActions";

const staffColors = ["blue", "red", "green", "purple", "orange", "maroon"];

class ImagePointsOfInterestSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imageWidth: 500,
      imageHeight: 700,
      selectedIndex: -1,
      currentImage: "",
      imageLoading: false,
      loaded: false,
    };

    this.resize = this.resize.bind(this);
  }

  componentDidMount() {
    window.addEventListener("resize", this.resize);
    this.setState({ resizing: false });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }

  getCanvasSize() {
    let image = this.props.imageSrc;
    let imageWidth = image.width;
    let imageHeight = image.height;

    const canvasWidth = Math.min(800, this.refs.maindiv.offsetWidth);

    const canvasHeight = Math.round((imageHeight * canvasWidth) / imageWidth);
    return {
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      imageWidth: imageWidth,
      imageHeight: imageHeight,
    };
  }

  updateCanvas() {
    if (!this.props.imageSrc) {
      return;
    }
    if (!this.refs.maindiv) return;

    let image = this.generateRotatedImage();

    const regions = this.props.staffLocations;

    const size = this.getCanvasSize();

    this.refs.canvas.width = size.canvasWidth;
    this.refs.canvas.height = size.canvasHeight;

    this.refs.maindiv.style.height = size.canvasHeight + "px";

    const ctx = this.refs.canvas.getContext("2d");
    ctx.clearRect(0, 0, size.canvasWidth, size.canvasHeight);

    ctx.drawImage(image, 0, 0, size.canvasWidth, size.canvasHeight);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.fillRect(0, 0, size.canvasWidth, size.canvasHeight);
    // lets draw

    for (var i = 0; i < regions.length; i++) {
      var rect = regions[i];
      let _x1 = rect.x * size.canvasWidth;
      let _y1 = rect.y * size.canvasHeight;
      let _width = rect.width * size.canvasWidth;
      let _height = rect.height * size.canvasHeight;

      ctx.drawImage(
        image,
        rect.x * size.imageWidth,
        rect.y * size.imageHeight,
        rect.width * size.imageWidth,
        rect.height * size.imageHeight,
        _x1,
        _y1,
        _width,
        _height
      );
      ctx.fillStyle = "rgba(255,0,0,0.5)";

      let pointsId = this.props.pageNumber + "_" + i;
      //alert("pointsId=" + pointsId);
      let poiset = this.props.pointsOfInterest[pointsId].pointsOfInterest;
      //alert("poiset = " + poiset);

      let voice = this.props.pointsOfInterest[pointsId].voice;

      let barWidth = 3;
      for (var x = 0; x < poiset.length; x++) {
        var poi = poiset[x];
        var pos = poi.x / 1000.0;
        var x1 = size.canvasWidth * (rect.x + pos * rect.width);
        var y1 = (poi.y / 1000.0) * size.canvasHeight;
        var height = (poi.height / 1000.0) * size.canvasHeight;
        ctx.fillRect(x1 - 1, y1 - 1, 3, height);
        ctx.fillRect(x1 - 1 - barWidth, y1 - 1, 3 + barWidth * 2, 3);
        ctx.fillRect(x1 - 1 - barWidth, y1 + height - 1, 3 + barWidth * 2, 3);
      }

      if (voice) {
        ctx.strokeStyle = staffColors[voice - 1];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(_x1, _y1, _width, _height);
        ctx.stroke();
        ctx.fillStyle = staffColors[voice - 1];
        //ctx.font = "30px Arial";
        //ctx.fillText(voice, _x1, _y1);
        ctx.beginPath();
        ctx.arc(_x1 + 15, _y1, 15, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.fillText(voice, _x1 + 7, _y1 + 10);
      }
    }
  }

  generateRotatedImage() {
    let image = this.props.imageSrc;
    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    var ctx = canvas.getContext("2d");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-this.props.orientation * Math.PI) / 180);
    ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2);
    return canvas;
  }

  resize() {
    //const mode = this.getImageStatus();
    //if (mode === "loaded") this.updateCanvas();
    this.forceUpdate();
  }

  render() {
    const _this = this;
    let loading = this.state.imageLoading || !this.props.imageSrc;

    setTimeout(function () {
      _this.updateCanvas();
    }, 0);

    return (
      <div className="ImageRegionSelectorDiv">
        {loading && <div>Loading Image...</div>}
        {!loading && <div>{this.renderImageAndRegions()}</div>}
      </div>
    );
  }

  getCoordinates(e) {
    const bounding = this.refs.maindiv.getBoundingClientRect();
    const position = e;

    const x = position.clientX - bounding.x; // + window.pageXOffset;
    const y = position.clientY - bounding.y; // + window.pageYOffset;
    return { x: x / bounding.width, y: y / bounding.height };
  }

  async addPoint(selectedRegion, pos) {
    // step 1... find closest guide
    let guideLength = selectedRegion.guides.top.length;
    let index = Math.floor(pos * guideLength);
    let top = selectedRegion.guides.top[index] / 1000.0;
    let bottom = selectedRegion.guides.bottom[index] / 1000.0;
    let height = bottom - top;

    let x = Math.floor(pos * 1000.0);
    let y = Math.floor((selectedRegion.y + top * selectedRegion.height) * 1000);
    height = Math.floor(height * selectedRegion.height * 1000);

    var array = selectedRegion.pointsOfInterest;
    var newPoint = {
      x: x,
      y: y,
      height: height,
    };

    array.push(newPoint);

    //this.updateRowData(this.state.selectedRegions);
    //this.setState({
    //  selectedRegions: this.state.selectedRegions
    //});
    this.props.updateDocumentStaff(
      this.props.selectedImageId,
      {
        id: selectedRegion.id,
        pointsOfInterest: JSON.stringify(selectedRegion.pointsOfInterest),
      },
      4
    );
    this.forceUpdate();
  }

  async erasePoint(selectedRegion, pos) {
    alert("erasing point");
    var best = -1;
    var bestDist = 5;
    var array = selectedRegion.pointsOfInterest;
    for (var i = 0; i < array.length; i++) {
      let v = array[i].x / 1000.0;
      var dist = Math.abs(pos - v);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
      }
    }
    if (best >= 0) {
      //this.props.deletePointOfInterest(selectedRegion.id, best);
      array.splice(best, 1);

      let symbols = selectedRegion.symbols;

      if (symbols) {
        let newSymbols = {};
        for (let id in symbols) {
          let symbolInfo = symbols[id];
          if (id === best) {
            // do nothing
          } else {
            if (id > best) id = id - 1; // shift position
            newSymbols[id] = symbolInfo;
          }
        }
        symbols = newSymbols;
      } else symbols = {};
      selectedRegion.symbols = symbols;

      this.props.updateDocumentStaff(
        this.props.selectedImageId,
        {
          id: selectedRegion.id,
          pointsOfInterest: JSON.stringify(selectedRegion.pointsOfInterest),
          symbols: JSON.stringify(symbols),
        },
        5
      );
      this.forceUpdate();
    }
  }

  tagVoice(value, staff) {
    value = parseInt(value);
    staff.voice = value;
    this.props.tagVoice(staff.id, value);
    this.forceUpdate();
  }

  handleClick(e) {
    var coordinates = this.getCoordinates(e.nativeEvent);
    const x = coordinates.x;
    const y = coordinates.y;

    const regions = this.props.staffLocations;
    for (var i = 0; i < regions.length; i++) {
      var rect = regions[i];
      let x1 = rect.x;
      let x2 = rect.x + rect.width;
      let y1 = rect.y;
      let y2 = rect.y + rect.height;
      if (x >= x1 && x <= x2 && y >= y1 && y <= y2) {
        // we are part of the area
        let loc = (x - x1) / (x2 - x1);
        let pointsId = this.props.pageNumber + "_" + i;
        let selectedRegion = this.props.pointsOfInterest[pointsId];

        switch (this.state.selectedIcon) {
          case "draw":
            this.addPoint(selectedRegion, loc);
            break;
          case "erase":
            this.erasePoint(selectedRegion, loc);
            break;
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
            this.tagVoice(this.state.selectedIcon, selectedRegion);
            break;
          default:
            // do nothing
            break;
        }
      }
    }
  }

  updateRowData(selectedRegions) {
    // on drop, or delete
    // call parent code

    this.props.updateSelectedImageRegions(selectedRegions);
  }

  renderImageAndRegions() {
    const selectedIcon = this.state.selectedIcon;

    return (
      <div>
        <div>
          <div
            class={selectedIcon === "draw" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "draw" })}
          >
            <FontAwesomeIcon icon="pencil-alt" />
          </div>
          <div
            class={selectedIcon === "erase" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "erase" })}
          >
            <FontAwesomeIcon icon="eraser" />
          </div>
          <div
            class={selectedIcon === "1" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "1" })}
          >
            1
          </div>
          <div
            class={selectedIcon === "2" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "2" })}
          >
            2
          </div>
          <div
            class={selectedIcon === "3" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "3" })}
          >
            3
          </div>
          <div
            class={selectedIcon === "4" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "4" })}
          >
            4
          </div>
          <div
            class={selectedIcon === "5" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "5" })}
          >
            5
          </div>
          <div
            class={selectedIcon === "6" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "6" })}
          >
            6
          </div>
        </div>

        <div
          className="ImagePointsOfInterestSelector"
          ref="maindiv"
          style={{ position: "relative", width: "100%", "max-width": "800px" }}
          onClick={(e) => this.handleClick(e)}
        >
          <canvas ref="canvas" />
        </div>
      </div>
    );
  }
}

const mapStateToProps = (state) => ({});

export default connect(mapStateToProps, { deletePointOfInterest })(
  ImagePointsOfInterestSelector
);
