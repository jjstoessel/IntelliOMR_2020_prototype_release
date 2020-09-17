import React from "react";
import "./MeiTaggerAndExporter.css";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { connect } from "react-redux";
import { deletePointOfInterest } from "../store/actions/documentSetActions";
import uuid from "uuid";

const staffColors = [
  "black",
  "blue",
  "red",
  "green",
  "purple",
  "orange",
  "maroon",
  "lightblue",
  "lightred",
  "lightgreen",
  "darkblue",
  "darkred",
  "darkgreen",
];

class MeiTaggerAndExporter extends React.Component {
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

      let pageId = this.props.pageNumber + "_" + i;

      let bookend = this.props.staffs[pageId].bookend;
      if (bookend) {
        let bookends = {};
        try {
          bookends = JSON.parse(bookend);
        } catch (e) {}
        for (let pos in bookends) {
          let bookendInfo = bookends[pos];
          ctx.fillStyle = "green";
          if (bookendInfo.type === "end") {
            ctx.fillStyle = "red";
          }
          let xp = _x1 + _width * pos;
          ctx.fillRect(xp - 10, _y1, 20, _height);

          ctx.fillStyle = "white";
          ctx.font = "20px Arial";
          ctx.save();
          ctx.translate(xp, _y1 + _height / 2);
          ctx.rotate(-Math.PI / 2);
          ctx.textAlign = "center";
          ctx.fillText(bookendInfo.type, 0, 5);
          ctx.restore();
        }

        /*if (bookend === "start") {
        ctx.fillStyle = "white";
        ctx.fillRect(_x1, _y1 - 30, _width, 30);
        ctx.fillStyle = "red";
        ctx.font = "20px Arial";
        ctx.fillText("vvvv start of document vvvv", _x1 + 7, _y1 - 10);
      }

      if (bookend === "end") {
        ctx.fillStyle = "white";
        ctx.fillRect(_x1, _y1 + _height, _width, 30);
        ctx.fillStyle = "green";
        ctx.font = "20px Arial";
        ctx.fillText("^^^^ end of document ^^^^", _x1 + 7, _y1 + _height + 20);
      }*/
      }

      let voice = this.props.staffs[pageId].voice;

      if (voice !== null) {
        ctx.strokeStyle = staffColors[voice];
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.rect(_x1, _y1, _width, _height);
        ctx.stroke();
        ctx.fillStyle = staffColors[voice];
        ctx.beginPath();
        //ctx.arc(_x1 + 15, _y1, 15, 0, 2 * Math.PI);
        ctx.ellipse(_x1 + 30, _y1, 30, 15, 0, 0, 2 * Math.PI);
        ctx.fill();
        ctx.beginPath();
        ctx.fillStyle = "white";
        ctx.font = "30px Arial";
        ctx.textAlign = "center";
        ctx.fillText(voice, _x1 + 30, _y1 + 10);
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

  tagVoice(value, staff) {
    value = parseInt(value);
    staff.voice = value;
    this.props.tagVoice(staff.id, value);
    this.forceUpdate();
  }

  tagBookend(value, staff, location) {
    let id = uuid.v1();
    if (staff.documentId) id = staff.documentId;

    let bookend = {};
    if (staff.bookend)
      try {
        bookend = JSON.parse(staff.bookend);
        if (bookend === null) bookend = {};
      } catch (e) {}

    bookend[location] = {
      type: value,
      id: id,
    };
    bookend = JSON.stringify(bookend);
    staff.bookend = bookend;
    this.props.tagBookend(staff.id, bookend);
    this.forceUpdate();
  }

  untagBookend(staff, location) {
    staff.bookend = JSON.stringify({});
    this.props.tagBookend(staff.id, staff.bookend);
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
        let selectedRegion = this.props.staffs[pointsId];

        switch (this.state.selectedIcon) {
          case "erase":
            this.untagBookend(selectedRegion, loc);
            break;
          case "start":
            this.tagBookend(this.state.selectedIcon, selectedRegion, loc);
            break;
          case "end":
            this.tagBookend(this.state.selectedIcon, selectedRegion, loc);
            break;
          case "0":
          case "1":
          case "2":
          case "3":
          case "4":
          case "5":
          case "6":
          case "7":
          case "8":
          case "9":
          case "10":
          case "11":
          case "12":
            this.tagVoice(this.state.selectedIcon, selectedRegion);
            break;
          default:
            // do nothing
            break;
        }
      }
    }

    this.props.updateParentGui();
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
          <div className="menuHeader">voice:</div>
          <div
            className={selectedIcon === "1" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "1" })}
          >
            1
          </div>
          <div
            className={selectedIcon === "2" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "2" })}
          >
            2
          </div>
          <div
            className={selectedIcon === "3" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "3" })}
          >
            3
          </div>
          <div
            className={selectedIcon === "4" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "4" })}
          >
            4
          </div>
          <div
            className={selectedIcon === "5" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "5" })}
          >
            5
          </div>
          <div
            className={selectedIcon === "6" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "6" })}
          >
            6
          </div>
          <div
            className={selectedIcon === "7" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "7" })}
          >
            7
          </div>
          <div
            className={selectedIcon === "8" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "8" })}
          >
            8
          </div>
          <div
            className={selectedIcon === "9" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "9" })}
          >
            9
          </div>
          <div
            className={selectedIcon === "10" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "10" })}
          >
            10
          </div>
          <div
            className={selectedIcon === "11" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "11" })}
          >
            11
          </div>
          <div
            className={selectedIcon === "12" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "12" })}
          >
            12
          </div>
          <div
            className={selectedIcon === "0" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "0" })}
          >
            ignore
          </div>
          <div className="menuHeader">bookend:</div>
          <div
            className={selectedIcon === "start" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "start" })}
          >
            start
          </div>
          <div
            className={selectedIcon === "end" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "end" })}
          >
            end
          </div>
          <div
            className={selectedIcon === "erase" ? "SelectedIcon" : "Icon"}
            onClick={() => this.setState({ selectedIcon: "erase" })}
          >
            <FontAwesomeIcon icon="eraser" />
          </div>
        </div>
        <div
          className="ImagePointsOfInterestSelector"
          ref="maindiv"
          style={{ position: "relative", width: "100%", maxWidth: "800px" }}
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
  MeiTaggerAndExporter
);
