import React from "react";
import "./ImageRegionSelector.css";
import { Button } from "react-bootstrap";
import LoadingDiv from "../components/common/loadingDiv";

export default class ImageRegionSelector extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imageWidth: 500,
      imageHeight: 300,
      selectedIndex: -1,
      currentImage: "",
      imageLoading: false,
      loaded: false,
    };

    this.handleMouseMove = this.handleMouseMove.bind(this);
    this.resize = this.resize.bind(this);
    this.handleMouseDown = this.handleMouseDown.bind(this);
    this.handleMouseDownOnCorner = this.handleMouseDownOnCorner.bind(this);
    this.handleMouseUp = this.handleMouseUp.bind(this);
    this.createNewRegion = this.createNewRegion.bind(this);
    this.deleteSelectedRegion = this.deleteSelectedRegion.bind(this);
  }

  componentDidMount() {
    window.addEventListener("resize", this.resize);
    this.setState({ resizing: false });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }

  async createNewRegion() {
    let regions = this.props.pageBoundaries;
    let selectedItem = { x: 0.25, y: 0.25, width: 0.5, height: 0.5 };
    regions.push(selectedItem);
    await this.props.updateRegions(regions);

    // now, lets make sure the selectedIndex is the same
    for (var i = 0; i < regions.length; i++) {
      if (regions[i] === selectedItem) this.setState({ selectedIndex: i });
    }
  }

  deleteSelectedRegion() {
    let regions = this.props.pageBoundaries;
    const splicePos = this.state.selectedIndex;
    regions.splice(splicePos, 1);
    this.props.updateRegions(regions);
    this.setState({ selectedIndex: -1 });
  }

  getCoordinates(e) {
    const bounding = this.refs.maindiv.getBoundingClientRect();
    const position = e;
    const x = position.clientX - bounding.x + window.pageXOffset;
    const y = position.clientY - bounding.y + window.pageYOffset;
    return { x: x / bounding.width, y: y / bounding.height };
  }

  handleMouseDown(e, area, action, index) {
    // action = moveArea
    var coordinates = this.getCoordinates(e);
    if (action === "moveArea") {
      this._moveData = {
        type: "moveArea",
        startPos: coordinates,
        originalArea: JSON.parse(JSON.stringify(area)),
        index: index,
      };
    }
    //alert("mouse down =" + JSON.stringify(coordinates));
    this.setState({
      mouseDown: true,
      selectedIndex: index,
      changed: false,
    });
  }

  handleMouseDownOnCorner(e, index, anchor, pointStart) {
    // action = moveArea
    var coordinates = this.getCoordinates(e);
    this._moveData = {
      type: "moveCorner",
      index: index,
      anchor: anchor,
      pointStart: pointStart,
      startCoordinates: coordinates,
    };

    this.setState({
      mouseDown: true,
      selectedIndex: index,
    });
  }

  async handleMouseUp(e) {
    this.setState({
      mouseDown: false,
    });
    // lets save the data!
    if (this.state.changed === true) {
      let selectedItem = null;
      let regions = this.props.pageBoundaries;
      if (this.state.selectedIndex)
        selectedItem = regions[this.state.selectedIndex];
      await this.props.updateRegions(regions);

      // now, lets make sure the selectedIndex is the same
      for (var i = 0; i < regions.length; i++) {
        if (regions[i] === selectedItem) this.setState({ selectedIndex: i });
      }
    }
  }

  handleMouseMove(e) {
    // mouse drag
    this.setState({
      changed: true,
    });

    var coordinates = this.getCoordinates(e.nativeEvent);

    if (this._moveData.type === "moveArea") {
      var area = JSON.parse(JSON.stringify(this._moveData.originalArea));
      var startPos = this._moveData.startPos;
      var dx = coordinates.x - startPos.x;
      var dy = coordinates.y - startPos.y;
      var x = area.x + dx;
      var y = area.y + dy;
      if (x < 0) x = 0;
      if (y < 0) y = 0;
      if (x + area.width > 1.0) x = 1.0 - area.width;
      if (y + area.height > 1.0) y = 1.0 - area.height;
      area.x = x;
      area.y = y;

      let regions = this.props.pageBoundaries;
      regions[this._moveData.index] = area;
      this.props.updateRegionsNoSave(regions);
    }

    if (this._moveData.type === "moveCorner") {
      var sx = this._moveData.anchor.x;
      var sy = this._moveData.anchor.y;
      var ex = this._moveData.pointStart.x + dx;
      var ey = this._moveData.pointStart.y + dy;

      var x1 = Math.min(sx, ex);
      var x2 = Math.max(sx, ex);
      var y1 = Math.min(sy, ey);
      var y2 = Math.max(sy, ey);
      if (x1 < 0) x1 = 0;
      if (y1 < 0) y1 = 0;
      if (x2 > 1.0) x2 = 1.0;
      if (y2 > 1.0) y2 = 1.0;
      const area = {
        x: x1,
        y: y1,
        width: x2 - x1,
        height: y2 - y1,
      };

      let regions = this.props.pageBoundaries;
      regions[this._moveData.index] = area;
      this.props.updateRegionsNoSave(regions);
    }
  }

  getCanvasSize() {
    if (!this.refs.maindiv) alert("calling getCanvas size without refs");
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

  updateCanvas() {
    if (!this.props.imageSrc) {
      return;
    }
    if (!this.refs.maindiv) return;
    let image = this.generateRotatedImage();

    const regions = this.props.pageBoundaries;

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
      let opacity = this.state.selectedIndex === i ? 1.0 : 0.3;
      ctx.globalAlpha = opacity;
      var rect = regions[i];
      ctx.drawImage(
        image,
        rect.x * size.imageWidth,
        rect.y * size.imageHeight,
        rect.width * size.imageWidth,
        rect.height * size.imageHeight,
        rect.x * size.canvasWidth,
        rect.y * size.canvasHeight,
        rect.width * size.canvasWidth,
        rect.height * size.canvasHeight
      );
    }
    ctx.globalAlpha = 1.0;
  }

  resize() {
    this.forceUpdate();
  }

  render() {
    const _this = this;

    setTimeout(function () {
      _this.updateCanvas();
    }, 0);

    return (
      <div className="ImageRegionSelectorDiv">
        <div>
          <div>
            <Button variant="success" onClick={this.createNewRegion}>
              Create New Region
            </Button>
            {this.state.selectedIndex > -1 && (
              <Button onClick={this.deleteSelectedRegion} variant="danger">
                Delete Selected Region
              </Button>
            )}
          </div>
          {this.renderImageAndRegions()}
        </div>
      </div>
    );
  }

  renderRegion(index) {
    let regions = this.props.pageBoundaries;
    if (regions.length === 0) return;
    let region = regions[index];
    if (!region) return;
    const _this = this;
    let getCircleClassName = function (index) {
      if (_this.state.selectedIndex === index) return "selectedCircle";
      return "circle";
    };

    return (
      <div key={JSON.stringify(region)}>
        <div
          onMouseDown={(e) =>
            this.handleMouseDown(e, region, "moveArea", index)
          }
          style={{
            position: "absolute",
            top: region.y * 100.0 + "%",
            left: region.x * 100.0 + "%",
            width: region.width * 100.0 + "%",
            height: region.height * 100.0 + "%",
            border:
              index === this.state.selectedIndex
                ? "1px dashed red"
                : "1px solid blue",
            cursor: "move",
          }}
        >
          {" "}
        </div>
        <div
          onMouseDown={(e) =>
            this.handleMouseDownOnCorner(
              e,
              index,
              { x: region.x + region.width, y: region.y + region.height },
              { x: region.x, y: region.y }
            )
          }
          className={getCircleClassName(index)}
          style={{
            left: region.x * 100.0 + "%",
            top: region.y * 100.0 + "%",
            cursor: "nwse-resize",
          }}
        />
        <div
          className={getCircleClassName(index)}
          style={{
            left: (region.x + region.width) * 100.0 + "%",
            top: region.y * 100.0 + "%",
            cursor: "nesw-resize",
          }}
          onMouseDown={(e) =>
            this.handleMouseDownOnCorner(
              e,
              index,
              { x: region.x, y: region.y + region.height },
              { x: region.x + region.width, y: region.y }
            )
          }
        />
        <div
          className={getCircleClassName(index)}
          style={{
            left: region.x * 100.0 + "%",
            top: (region.y + region.height) * 100.0 + "%",
            cursor: "nesw-resize",
          }}
          onMouseDown={(e) =>
            this.handleMouseDownOnCorner(
              e,
              index,
              { x: region.x + region.width, y: region.y },
              { x: region.x, y: region.y + region.height }
            )
          }
        />
        <div
          className={getCircleClassName(index)}
          style={{
            left: (region.x + region.width) * 100.0 + "%",
            top: (region.y + region.height) * 100.0 + "%",
            cursor: "nwse-resize",
          }}
          onMouseDown={(e) =>
            this.handleMouseDownOnCorner(
              e,
              index,
              { x: region.x, y: region.y },
              { x: region.x + region.width, y: region.y + region.height }
            )
          }
        />
      </div>
    );
  }

  renderNonselectedRegion(index) {
    if (this.state.selectedIndex === index) return;
    // skip if selected
    else return this.renderRegion(index);
  }

  renderSelectedRegion() {
    if (this.state.selectedIndex < 0) return;
    return this.renderRegion(this.state.selectedIndex);
  }

  renderImageAndRegions() {
    if (!this.props.imageSrc || this.props.imageLoading) {
      return (
        <div>
          <LoadingDiv />
          Loading image... please wait.
        </div>
      );
    }
    let regions = this.props.pageBoundaries;

    return (
      <div
        className="ImageRegionSelector"
        ref="maindiv"
        style={{ position: "relative", width: "100%", maxWidth: "800px" }}
      >
        <canvas ref="canvas" />
        {regions.map((region, index) => this.renderNonselectedRegion(index))}
        {this.renderSelectedRegion()}
        {this.state.mouseDown && (
          <div
            className="movementPanel"
            onMouseMove={(e) => this.handleMouseMove(e)}
            onMouseUp={(e) => this.handleMouseUp(e)}
            onMouseLeave={(e) => this.handleMouseUp(e)}
          />
        )}
      </div>
    );
  }
}
