import React from "react";
import "./symbolEditor.css";

import { Tabs, Tab } from "react-bootstrap";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import SymbolToggleSelector from "./symbolToggleSelector";
import { graphqlOperation, API } from "aws-amplify";
import * as mutations from "../graphql/mutations";
import LoaderButton from "../components/buttons/LoaderButton";

// clefs
import sing_clef from "./clefs/sing_clef.png";
import treble_clef from "./clefs/treble_clef.png";
import clef8 from "./clefs/clef8.png";

// timesigs
import o_timesig from "./timesigs/O.png";
import o_dot_timesig from "./timesigs/O_dot.png";
import o_I_timesig from "./timesigs/O_I.png";
import o__I_dot_timesig from "./timesigs/O_I_dot.png";

import c_timesig from "./timesigs/C.png";
import c_dot_timesig from "./timesigs/C_dot.png";
import c_I_timesig from "./timesigs/C_I.png";
import c_I_dot_timesig from "./timesigs/C_I_dot.png";

import inverted_c_timesig from "./timesigs/inverted_C.png";
import inverted_c_dot_timesig from "./timesigs/inverted_C_dot.png";
import inverted_c_I_timesig from "./timesigs/inverted_C_I.png";
import inverted_c_I_dot_timesig from "./timesigs/inverted_C_I_dot.png";

// numbers
import number_1 from "./numbers/number_1.png";
import number_2 from "./numbers/number_2.png";
import number_3 from "./numbers/number_3.png";
import number_4 from "./numbers/number_4.png";
import number_5 from "./numbers/number_5.png";
import number_6 from "./numbers/number_6.png";
import number_7 from "./numbers/number_7.png";
import number_8 from "./numbers/number_8.png";
import number_9 from "./numbers/number_9.png";

// notes
import longa_down from "./notes/longa_down.png";
import breve from "./notes/breve.png";
import breve_full from "./notes/breve_full.png";
import semibreve from "./notes/semibreve.png";
import semibreve_full from "./notes/semibreve_full.png";
import minim_down from "./notes/minim_down.png";
import semiminim_down from "./notes/semiminim_down.png";
import fusa_down from "./notes/fusa_down.png";
import semifusa_down from "./notes/semifusa_down.png";
import longa_up from "./notes/longa_up.png";
import minim_up from "./notes/minim_up.png";
import semiminim_up from "./notes/semiminim_up.png";
import fusa_up from "./notes/fusa_up.png";
import semifusa_up from "./notes/semifusa_up.png";
import pred_note from "./notes/pred_note.png";

// rests
import imperfect_long_rest from "./rests/imperfect_long_rest.png";
import minim_rest from "./rests/minim_rest.png";
import semibreve_rest from "./rests/semibreve_rest.png";
import breve_rest from "./rests/breve_rest.png";
import crotchet_rest from "./rests/crotchet_rest.png";
import semiquaver_rest from "./rests/semiquaver_rest.png";

// varia

import dot from "./varia/dot.png";
import sharp from "./varia/sharp.png";
import flat from "./varia/flat.png";
import neutral from "./varia/neutral.png";
import bar_line from "./varia/bar_line.png";
import double_bar_line from "./varia/double_bar_line.png";
import repeat from "./varia/repeat.png";
import tie_top from "./varia/tie_top.png";
import tie_bottom from "./varia/tie_bottom.png";

import uuid from "uuid";
import { s3UploadImage } from "../libs/awsLib";
import Network from "../libs/network";
const canvasHeight = 120;

const clefIcons = [
  { icon: treble_clef, id: "treble_clef", offX: 14, offY: 50 },
  { icon: sing_clef, id: "sing_clef", offX: 12, offY: 41 },
  { icon: longa_down, id: "longa_down", offX: 12, offY: 15 },
  { icon: clef8, id: "clef8", offX: 14, offY: 27 },
];

const timesigIcons = [
  { icon: o_timesig, id: "o_timesig", offX: 30, offY: 47 },
  { icon: o_dot_timesig, id: "o_dot_timesig", offX: 30, offY: 47 },
  { icon: o_I_timesig, id: "o_I_timesig", offX: 30, offY: 47 },
  { icon: o__I_dot_timesig, id: "o__I_dot_timesig", offX: 30, offY: 47 },

  { icon: c_timesig, id: "c_timesig", offX: 30, offY: 47 },
  { icon: c_dot_timesig, id: "c_dot_timesig", offX: 30, offY: 47 },
  { icon: c_I_timesig, id: "c_I_timesig", offX: 30, offY: 47 },
  { icon: c_I_dot_timesig, id: "c_I_dot_timesig", offX: 30, offY: 47 },

  { icon: inverted_c_timesig, id: "inverted_c_timesig", offX: 30, offY: 47 },
  {
    icon: inverted_c_dot_timesig,
    id: "inverted_c_dot_timesig",
    offX: 30,
    offY: 47,
  },
  {
    icon: inverted_c_I_timesig,
    id: "inverted_c_I_timesig",
    offX: 30,
    offY: 47,
  },
  {
    icon: inverted_c_I_dot_timesig,
    id: "inverted_c_I_dot_timesig",
    offX: 30,
    offY: 47,
  },
];

const numberIcons = [
  { icon: number_1, id: "number_1", offX: 8, offY: 8 },
  { icon: number_2, id: "number_2", offX: 8, offY: 8 },
  { icon: number_3, id: "number_3", offX: 8, offY: 8 },
  { icon: number_4, id: "number_4", offX: 8, offY: 8 },
  { icon: number_5, id: "number_5", offX: 8, offY: 8 },
  { icon: number_6, id: "number_6", offX: 8, offY: 8 },
  { icon: number_7, id: "number_7", offX: 8, offY: 8 },
  { icon: number_8, id: "number_8", offX: 8, offY: 8 },
  { icon: number_9, id: "number_9", offX: 8, offY: 8 },
];

const noteIcons = [
  { icon: longa_down, id: "longa_down", offX: 12, offY: 15 },
  { icon: longa_up, id: "longa_up", offX: 11, offY: 64 },
  { icon: breve, id: "breve", offX: 12, offY: 14 },
  { icon: breve_full, id: "breve_full", offX: 12, offY: 14 },
  { icon: semibreve, id: "semibreve", offX: 12, offY: 14 },
  { icon: semibreve_full, id: "semibreve_full", offX: 12, offY: 14 },
  { icon: minim_down, id: "minim_down", offX: 12, offY: 14 },
  { icon: semiminim_down, id: "semiminim_down", offX: 12, offY: 14 },
  { icon: fusa_down, id: "fusa_down", offX: 12, offY: 14 },
  { icon: semifusa_down, id: "semifusa_down", offX: 12, offY: 15 },
  { icon: minim_up, id: "minim_up", offX: 12, offY: 64 },
  { icon: semiminim_up, id: "semiminim_up", offX: 12, offY: 64 },
  { icon: fusa_up, id: "fusa_up", offX: 12, offY: 64 },
  { icon: semifusa_up, id: "semifusa_up", offX: 11, offY: 72 },
  { icon: pred_note, id: "pred_note", offX: 21, offY: 7 },
  { icon: dot, id: "dot", offX: 3, offY: 3 },
];

const restIcons = [
  { icon: imperfect_long_rest, id: "imperfect_long_rest", offX: 13, offY: 21 },
  { icon: breve_rest, id: "breve_rest", offX: 12, offY: 12 },
  { icon: semibreve_rest, id: "semibreve_rest", offX: 8, offY: 0 },
  { icon: minim_rest, id: "minim_rest", offX: 8, offY: 8 },
  { icon: crotchet_rest, id: "crotchet_rest", offX: 8, offY: 8 },
  { icon: semiquaver_rest, id: "semiquaver_rest", offX: 8, offY: 8 },
];

const variaIcons = [
  { icon: neutral, id: "neutral", offX: 5, offY: 24 },
  { icon: sharp, id: "sharp", offX: 8, offY: 9 },
  { icon: flat, id: "flat", offX: 5, offY: 35 },
  { icon: bar_line, id: "bar_line", offX: 1, offY: 36 },
  { icon: double_bar_line, id: "double_bar_line", offX: 1, offY: 36 },
  { icon: repeat, id: "repeat", offX: 13, offY: 21 },
  { icon: tie_top, id: "tie_top", offX: 12, offY: 8 },
  { icon: tie_bottom, id: "tie_bottom", offX: 12, offY: 8 },
];

let allIcons = {};

function convertToRedImage(image) {
  var newCanvas = document.createElement("canvas");
  newCanvas.height = image.height;
  newCanvas.width = image.width;
  var ctx = newCanvas.getContext("2d");
  ctx.drawImage(image, 0, 0);
  var imgData = ctx.getImageData(0, 0, image.width, image.height);
  for (var i = 0; i < imgData.data.length; i += 4) {
    imgData.data[i] = 255;
    imgData.data[i + 1] = 1;
    imgData.data[i + 2] = 1;
  }

  var newCanvas2 = document.createElement("canvas");
  newCanvas2.height = image.height;
  newCanvas2.width = image.width;
  var ctx2 = newCanvas2.getContext("2d");
  ctx2.putImageData(imgData, 0, 0);

  return newCanvas2;
}

function loadImage(icon) {
  var im = new Image();
  icon.image = im;
  im.onload = function () {
    icon.redImage = convertToRedImage(im);
  };
  im.src = icon.icon;
}

function addIconsToSet(list) {
  for (var i = 0; i < list.length; i++) {
    var icon = list[i];
    allIcons[icon.id] = icon;

    loadImage(icon);
  }
}

addIconsToSet(noteIcons);
addIconsToSet(restIcons);
addIconsToSet(clefIcons);
addIconsToSet(numberIcons);
addIconsToSet(variaIcons);
addIconsToSet(timesigIcons);

export default class SymbolEditor extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      imageWidth: 500,
      imageHeight: 700,
      selectedRegions: [],
      imageState: null,
      imageUrl: null,
      selectedIndex: -1,
      selectedTool: "draw",
      selectedSymbolType: "notes",
      selectedNoteIcon: null,
      selectedDeltaIcon: null,
      selectedSymbolIcon: null,
      snapToGrid: true,
      addToTrainingSet: true,
      meiFrame: null,
      staffId: "",
      classifying: false,
      classifyingProgress: "0%",
    };

    this.resize = this.resize.bind(this);
    this.runClassification = this.runClassification.bind(this);
  }

  tagSymbols(symbolActivations) {
    let rect = this.props.area;
    var symbols = this.props.symbols;

    for (let x = 0; x < rect.pointsOfInterest.length; x++) {
      let poi = rect.pointsOfInterest[x];
      let loc = "" + poi.x;
      let detectedSymbols = symbolActivations[loc];
      let set = {};

      symbols[x] = set;
      for (let p = -4.0; p <= 4.0; p += 0.5) {
        let id = "_" + Math.round(p * 10);
        if (detectedSymbols[id]) {
          let s = detectedSymbols[id].symbols;
          let symbs = [];
          for (let symbolId in s) {
            symbs.push(symbolId);
          }
          if (symbs.length > 0) {
            set[id] = {
              pitch: p,
              symbols: symbs,
            };
          }
        }
      }
    }
  }

  async runClassificationAfterUpdate() {
    let _this = this;
    this.setState({ classifying: true }, function () {
      setTimeout(_this.runClassification, 1000);
    });
  }

  async runClassification() {
    let rect = this.props.area;
    var symbols = this.props.symbols;
    //alert("symbols = " + JSON.stringify(symbols));

    let symbolActivations = {};
    const size = this.getCanvasSize();
    const width = size.imageWidth * rect.width;
    const height = size.imageHeight * rect.height;

    for (let x = 0; x < rect.pointsOfInterest.length; x++) {
      let p = Math.round((100 * x) / rect.pointsOfInterest.length);
      this.setState({
        classifyingProgress: p + "%",
      });
      let poi = rect.pointsOfInterest[x];

      //let x1 = rect.x + pos * rect.width;

      // start by resetting symbols

      let set = {};
      let loc = "" + poi.x;
      symbolActivations[loc] = set;

      //symbols[x] = set;

      for (let p = -4.0; p <= 4.0; p += 0.5) {
        let pitch = p;
        //let image = this.getImageAtLocation(x1, pitch);
        let image = this.getImageAtIndex(x, pitch, true);
        let classification = await Network.getClassification(
          image,
          this.props.symbols,
          p
        );

        let id = "_" + Math.round(p * 10);
        set[id] = classification;
      }
    }

    symbolActivations = Network.performLateralInhibition(
      symbolActivations,
      width,
      height
    );

    this.tagSymbols(symbolActivations);

    this.renderStaff();
    this.props.saveSymbols(symbols);
    this.setState({
      classifying: false,
    });
  }

  componentDidMount() {
    window.addEventListener("resize", this.resize);
    this.setState({ resizing: false });
  }

  componentWillUnmount() {
    window.removeEventListener("resize", this.resize);
  }

  resize() {
    let loading = !this.props.imageSrc || this.props.imageLoading;

    if (!loading) {
      this.updateCanvas();
      this.renderStaff();
    }
  }

  getCanvasSize() {
    const canvasWidth = Math.min(1000, this.refs.maindiv.offsetWidth);
    let image = this.image;
    let imageWidth = image.width;
    let imageHeight = image.height;

    const canvasHeight = Math.round((imageHeight * canvasWidth) / imageWidth);
    return {
      canvasWidth: canvasWidth,
      canvasHeight: canvasHeight,
      imageWidth: imageWidth,
      imageHeight: imageHeight,
    };
  }

  async uploadTrainingImageData(item) {
    try {
      await API.graphql(
        graphqlOperation(mutations.deleteTrainingImage, {
          input: {
            id: item.id,
          },
        })
      );
    } catch (e) {
      // do nothing
    }
    try {
      await API.graphql(
        graphqlOperation(mutations.createTrainingImage, {
          input: item,
        })
      );
    } catch (e) {
      // do nothing
      alert(e);
    }
  }

  getImageAtIndex(pointOfInterestIndex, pitch, dontSaveToState) {
    let array = this.props.area.pointsOfInterest;
    let x = array[pointOfInterestIndex].x / 1000.0;
    const size = this.getCanvasSize();
    // x is in % of image width,
    let selectedRegion = this.props.area;
    let rect = this.props.area;

    // step 1... find closest guide
    let guideLength = selectedRegion.guides.top.length;
    let index = Math.floor(x * guideLength);
    index = Math.max(0, index);
    index = Math.min(index, guideLength - 1);
    let top = selectedRegion.guides.top[index] / 1000.0;
    let bottom = selectedRegion.guides.bottom[index] / 1000.0;
    let height = bottom - top;
    let lineWidth = height / 4;

    // screen coordinates
    let midPoint = top + height / 2;
    midPoint += lineWidth * pitch;

    let screenX = (rect.x + rect.width * x) * size.imageWidth;
    let screenY = (rect.y + rect.height * midPoint) * size.imageHeight;

    let screenBarHeight = height * rect.height * size.imageHeight;

    var canvas = document.createElement("canvas");
    var cWidth = 50;
    var cHeight = 100;
    var targetBarHeight = 50;
    canvas.width = cWidth;
    canvas.height = cHeight;

    const ctx = canvas.getContext("2d");
    ctx.save();

    ctx.translate(cWidth / 2, cHeight / 2);

    let scale = targetBarHeight / screenBarHeight;
    ctx.scale(scale, scale);
    ctx.translate(-screenX, -screenY);

    ctx.drawImage(this.image, 0, 0);

    ctx.restore();
    if (dontSaveToState) return canvas;
    //;'var img = canvas.toDataURL("image/png");

    this.setState({
      currentSymbolImage: canvas,
    });
    return canvas;
  }

  async saveSymbolImage(
    documentSet,
    image,
    page,
    staff,
    location,
    pitch,
    categories
  ) {
    // don't add to training set if not set
    if (!this.state.addToTrainingSet) {
      return;
    }

    // step 1, upload the image and get the uuid
    let filename = uuid.v1() + ".jpg";
    let imageAtIndex = this.getImageAtIndex(location, pitch);

    await s3UploadImage(imageAtIndex, filename);

    // now, lets add it to the database
    var id =
      documentSet +
      "_" +
      image +
      "_" +
      page +
      "_" +
      staff +
      "_" +
      location +
      "_" +
      pitch;
    var item = {
      id: id,
      image: image,
      page: page,
      staff: staff,
      location: location,
      pitch: pitch,
      filename: filename,
      value: JSON.stringify(categories),
      hidden: "true",
    };
    await this.uploadTrainingImageData(item);
  }

  getRawStaffCoordinates(e) {
    const bounding = this.refs.canvas.getBoundingClientRect();
    const position = e;

    const x = position.clientX - bounding.x; // + window.pageXOffset;
    const y = position.clientY - bounding.y; // + window.pageYOffset;
    return {
      x: x,
      y: y,
    };
  }

  convertToLocalArea(x) {
    // this value is between 0 and 1 based on the full width
    // lets convert to location within selected window
    var rect = this.props.area;
    let pos = (x - rect.x) / rect.width;
    return pos;
  }

  getCoordinates(e) {
    const size = this.getCanvasSize();
    const bounding = this.refs.staff.getBoundingClientRect();
    const position = e;

    const x = position.clientX - bounding.x; // + window.pageXOffset;
    const y = position.clientY - bounding.y; // + window.pageYOffset;
    let px = x / bounding.width;
    px = this.convertToLocalArea(px);
    const py = y / bounding.height;

    var output = {
      x: x,
      y: y,
      px: px,
      py: py,
    };

    // lets convert x to relative position in area
    var rect = this.props.area;
    let unitX = x / size.canvasWidth;
    output.relX = (unitX - rect.x) / rect.width;

    // lets calculate xposition in terms of closest matching point of interest
    var best = -1;
    var bestDist = 5;
    var bestIndexX = 0;
    var array = this.props.area.pointsOfInterest;
    for (var i = 0; i < array.length; i++) {
      let v = array[i].x / 1000.0;
      let x1 = rect.x + v * rect.width;
      var dist = Math.abs(px - v);
      if (dist < bestDist) {
        bestDist = dist;
        best = i;
        bestIndexX = x1 * bounding.width;
        output.relX = x1;
      }
    }

    output.bestIndex = best;
    output.bestIndexX = bestIndexX;

    if (!this.state.snapToGrid) output.bestIndexX = x;

    const height = canvasHeight;
    const lineSpacing = 14;
    output.bestPitchIndex =
      Math.round((2.0 * (y - 0.5 * height)) / lineSpacing) / 2.0;
    output.bestPitchIndexY = 0.5 * height + output.bestPitchIndex * lineSpacing;

    return output;
  }

  getClosestSymbol(coordinates) {
    // if we are using the erase tool ... this should return the best matching symbol
    // otherwise return null
    if (this.state.selectedTool !== "erase") return null;

    var array = this.props.area.pointsOfInterest;
    let bestMatchInfo = null;
    let bestMatchValue = 5;
    for (var i = 0; i < array.length; i++) {
      let v = array[i].x / 1000.0;
      var dist = Math.abs(coordinates.px - v);
      if (dist < 0.05) {
        // only consider nearish symbols
        var set = this.props.symbols[i];
        for (var s in set) {
          let pitch = set[s].pitch;
          let pitchOffset = Math.abs(pitch - coordinates.bestPitchIndex);
          let match = pitchOffset + dist * 100;
          if (match < bestMatchValue) {
            bestMatchValue = match;
            bestMatchInfo = {
              pointOfInterest: i,
              pitch: pitch,
              setKey: s,
            };
          }
        }
      }
    }
    return bestMatchInfo;
  }

  handleMove(e) {
    var coordinates = this.getCoordinates(e.nativeEvent);
    this.highlightedSymbol = this.getClosestSymbol(coordinates);
    this.renderStaff(coordinates);
    this.setState({ coordinates: coordinates });
  }

  handleLeave(e) {
    this.pointToDraw = null;
    this.renderStaff();
  }

  eraseHighlightedSymbol() {
    if (!this.highlightedSymbol) return;
    var index = this.highlightedSymbol.pointOfInterest;
    var pitch = this.highlightedSymbol.pitch;
    var id = "_" + Math.round(pitch * 10);

    var notes = this.props.symbols;
    var set = this.props.symbols[index];
    if (!set) {
      set = {};
      notes[index] = set;
    }
    set[id] = {
      pitch: pitch,
      symbols: [],
    };
    this.props.saveSymbols(notes);

    this.renderStaff();
    this.saveSymbolImage(
      "ds",
      this.props.image,
      this.props.page,
      this.props.staff,
      index,
      pitch,
      []
    );
  }

  addSymbols(coordinates, chosenSymbols) {
    var index = coordinates.bestIndex;
    var pitch = coordinates.bestPitchIndex;
    var id = "_" + Math.round(pitch * 10);

    var notes = this.props.symbols;
    var set = this.props.symbols[index];
    if (!set) {
      set = {};
      notes[index] = set;
    }
    set[id] = {
      pitch: pitch,
      symbols: chosenSymbols,
    };
    this.props.saveSymbols(notes);

    this.renderStaff();
    this.saveSymbolImage(
      "ds",
      this.props.image,
      this.props.page,
      this.props.staff,
      index,
      pitch,
      chosenSymbols
    );
  }

  addPoint(pos) {
    let selectedRegion = this.props.area;
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

    this.props.updateDocumentStaff({
      id: selectedRegion.id,
      pointsOfInterest: JSON.stringify(selectedRegion.pointsOfInterest),
    });
    this.forceUpdate();
    return array.length - 1;
  }

  handleClick(e) {
    var coordinates = this.getCoordinates(e.nativeEvent);

    if (this.state.selectedTool === "erase") {
      this.eraseHighlightedSymbol();
    } else if (this.state.snapToGrid) {
      let chosenSymbols = this.getChosenSymbols();
      this.addSymbols(coordinates, chosenSymbols);
    } else {
      let position = this.addPoint(coordinates.px);
      let chosenSymbols = this.getChosenSymbols();
      coordinates.bestIndex = position;
      this.addSymbols(coordinates, chosenSymbols);
    }
  }

  drawSymbols(ctx, x, y, symbols, selected) {
    for (let s = 0; s < symbols.length; s++) {
      let symbol = symbols[s];
      let icon = allIcons[symbol];
      if (!icon) return;
      ctx.save();
      ctx.translate(x, y);
      ctx.scale(0.8, 0.8);
      ctx.translate(-icon.offX, -icon.offY);
      let image = selected ? icon.redImage : icon.image;
      ctx.drawImage(image, 0, 0);
      ctx.restore();
    }
  }

  renderStaff(currentPointToDraw) {
    let pointToDraw = currentPointToDraw || this.pointToDraw;
    if (currentPointToDraw) this.pointToDraw = currentPointToDraw;

    let loading =
      !this.props.imageSrc || this.props.imageLoading || !this.refs.maindiv;
    if (loading) return;

    const size = this.getCanvasSize();
    const width = size.canvasWidth;
    const height = canvasHeight;
    const lineSpacing = 14;
    this.refs.staff.width = size.canvasWidth;
    this.refs.staff.height = height;

    const ctx = this.refs.staff.getContext("2d");

    // draw staff lines
    ctx.fillStyle = "rgb(255,255,255)";
    ctx.fillRect(0, 0, width, height);

    for (let x = -2; x <= 2; x++) {
      ctx.fillStyle = "rgb(0,0,0)";
      let h = height / 2 + x * lineSpacing;
      ctx.fillRect(0, h, width, 1);
    }

    // draw points of interest
    ctx.fillStyle = "rgba(0,0,0,0.1)";
    var rect = this.props.area;
    for (let x = 0; x < rect.pointsOfInterest.length; x++) {
      let poi = rect.pointsOfInterest[x];
      let pos = poi.x / 1000.0;
      let x1 = width * (rect.x + pos * rect.width);
      let y1 = 0;
      ctx.fillRect(x1 - 1, y1 - 1, 3, height);
    }

    // draw symbols

    rect = this.props.area;

    for (let x = 0; x < rect.pointsOfInterest.length; x++) {
      let poi = rect.pointsOfInterest[x];
      let pos = poi.x / 1000.0;
      let x1 = width * (rect.x + pos * rect.width);
      let y1 = 0;
      ctx.fillRect(x1 - 1, y1 - 1, 3, height);

      let symbolsAtPos = this.props.symbols[x];
      if (symbolsAtPos) {
        for (let i in symbolsAtPos) {
          let symbolSet = symbolsAtPos[i];
          let pitch = symbolSet.pitch;
          let symbols = symbolSet.symbols;
          let y = height / 2 + pitch * lineSpacing;
          if (symbols.length > 0) {
            let selected = false;
            if (this.highlightedSymbol) {
              if (
                this.highlightedSymbol.pointOfInterest === x &&
                this.highlightedSymbol.setKey === i
              ) {
                selected = true;
              }
            }

            this.drawSymbols(ctx, x1, y, symbols, selected);
          }
        }
      }
    }

    if (pointToDraw) {
      let chosenSymbols = this.getChosenSymbols();
      ctx.fillStyle = "red";
      ctx.fillRect(
        pointToDraw.bestIndexX - 2,
        pointToDraw.bestPitchIndexY - 2,
        5,
        5
      );
      this.drawSymbols(
        ctx,
        pointToDraw.bestIndexX,
        pointToDraw.bestPitchIndexY,
        chosenSymbols
      );

      // lets get the image to draw
      /*let image = this.getImageAtLocation(
        pointToDraw.relX,
        pointToDraw.bestPitchIndex
      );*/
      //ctx.drawImage(image, 0, 0);
    }
  }

  getChosenSymbols() {
    var symbols = [];
    const selectedTool = this.state.selectedTool;
    if (selectedTool === "draw") {
      symbols.push(this.state.selectedSymbol);
    }

    return symbols;
  }

  renderGuideLine(ctx, size, rect, points) {
    let poi = points[0] / 1000.0;
    let x0 = size.canvasWidth * (rect.x + 0 * rect.width);
    let y0 = size.canvasHeight * (rect.y + poi * rect.height);

    ctx.beginPath(); // Start a new path
    ctx.moveTo(x0, y0);

    for (var n = 1; n < points.length; n++) {
      let poi = points[n] / 1000.0;
      let px = n / (points.length - 1);
      let x = size.canvasWidth * (rect.x + px * rect.width);
      let y = size.canvasHeight * (rect.y + poi * rect.height);
      ctx.lineTo(x, y);
    }
    ctx.strokeStyle = "rgba(255,0,0,0.3)";
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  convertYCoordinate(xpos, ypos, size, rect, topGuides, bottomGuides) {
    function getYPos(guide) {
      let index = Math.floor((guide.length * xpos) / size.canvasWidth);
      let poi = guide[index] / 1000;
      let y = size.canvasHeight * (rect.y + poi * rect.height);
      return y;
    }
    let topPos = getYPos(topGuides);
    let bottomPos = getYPos(bottomGuides);
    let relPos = (ypos + 2) / 4;
    let pos = topPos + (bottomPos - topPos) * relPos;

    return pos;
  }

  updateCanvas() {
    let loading =
      !this.props.imageSrc || this.props.imageLoading || !this.refs.maindiv;
    if (loading) return;

    this.generateImage();
    const size = this.getCanvasSize();

    this.refs.canvas.width = size.canvasWidth;

    this.refs.canvas.height = 150;

    const ctx = this.refs.canvas.getContext("2d");
    ctx.save();

    var rect = this.props.area;
    const yoff = (rect.y + rect.height / 2) * size.canvasHeight;
    ctx.translate(0, 75 - yoff);
    ctx.fillStyle = "rgba(0,0,0,0.5)";
    ctx.clearRect(0, 0, size.canvasWidth, size.canvasHeight);

    ctx.drawImage(this.image, 0, 0, size.canvasWidth, size.canvasHeight);
    ctx.fillRect(0, 0, size.canvasWidth, size.canvasHeight);

    ctx.drawImage(
      this.image,
      rect.x * size.imageWidth,
      rect.y * size.imageHeight,
      rect.width * size.imageWidth,
      rect.height * size.imageHeight,
      rect.x * size.canvasWidth,
      rect.y * size.canvasHeight,
      rect.width * size.canvasWidth,
      rect.height * size.canvasHeight
    );

    this.renderGuideLine(ctx, size, rect, this.props.area.guides.top);
    this.renderGuideLine(ctx, size, rect, this.props.area.guides.bottom);
    let pointToDraw = this.pointToDraw;
    if (pointToDraw) {
      let y = this.convertYCoordinate(
        pointToDraw.bestIndexX,
        pointToDraw.bestPitchIndex,
        size,
        rect,
        this.props.area.guides.top,
        this.props.area.guides.bottom
      );

      let chosenSymbols = this.getChosenSymbols();
      ctx.fillStyle = "red";
      ctx.fillRect(pointToDraw.bestIndexX - 2, y - 2, 5, 5);
      this.drawSymbols(ctx, pointToDraw.bestIndexX, y, chosenSymbols);
    }

    ctx.restore();

    if (this.state.drawingLine) {
      let start = this.state.startDragPos;
      let end = this.state.endDragPos;
      ctx.beginPath(); // Start a new path
      ctx.moveTo(start.x, start.y);
      ctx.lineTo(end.x, end.y);

      ctx.strokeStyle = "rgba(0,255,255,0.6)";
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  generateImage() {
    //this.setState({
    //  selectedRegion: JSON.parse(JSON.stringify(this.props.area)) // makes a copy
    //});

    var image = this.props.imageSrc;

    var canvas = document.createElement("canvas");
    canvas.width = image.width;
    canvas.height = image.height;

    var ctx = canvas.getContext("2d");
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate((-this.props.orientation * Math.PI) / 180);
    ctx.drawImage(image, -canvas.width / 2, -canvas.height / 2);

    //var img = canvas.toDataURL("image/png");

    this.image = canvas;
  }

  renderSymbolPalette() {
    return (
      <div style={{ textAlign: "left", marginTop: "10px" }}>
        <Tabs defaultActiveKey="notes" id="editor-tabs">
          <Tab eventKey="clefs" title="Clefs">
            <SymbolToggleSelector
              icons={clefIcons}
              selected={this.state.selectedSymbol}
              select={(icon) => {
                this.setState({ selectedSymbol: icon });
              }}
            />
          </Tab>
          <Tab eventKey="timesigs" title="Time Signatures">
            <SymbolToggleSelector
              icons={timesigIcons}
              selected={this.state.selectedSymbol}
              select={(icon) => {
                this.setState({ selectedSymbol: icon });
              }}
            />
          </Tab>
          <Tab eventKey="numbers" title="Numbers">
            <SymbolToggleSelector
              icons={numberIcons}
              selected={this.state.selectedSymbol}
              select={(icon) => {
                this.setState({ selectedSymbol: icon });
              }}
            />
          </Tab>
          <Tab eventKey="notes" title="Notes">
            <SymbolToggleSelector
              icons={noteIcons}
              selected={this.state.selectedSymbol}
              select={(icon) => {
                this.setState({ selectedSymbol: icon });
              }}
            />
          </Tab>
          <Tab eventKey="rests" title="Rests">
            <SymbolToggleSelector
              icons={restIcons}
              selected={this.state.selectedSymbol}
              select={(icon) => {
                this.setState({ selectedSymbol: icon });
              }}
            />
          </Tab>
          <Tab eventKey="varia" title="Varia">
            <SymbolToggleSelector
              icons={variaIcons}
              selected={this.state.selectedSymbol}
              select={(icon) => {
                this.setState({ selectedSymbol: icon });
              }}
            />
          </Tab>
        </Tabs>
      </div>
    );
  }

  handleMouseDownOnOriginal(e) {
    let selectedTool = this.state.selectedTool;

    if (selectedTool === "topLine" || selectedTool === "bottomLine") {
      let coors = this.getRawStaffCoordinates(e);
      this.setState({
        startDragPos: coors,
        drawingLine: true,
      });
    }
  }

  handleMouseMoveOnOriginal(e) {
    let coors = this.getRawStaffCoordinates(e);
    this.setState({
      endDragPos: coors,
    });
  }

  updatePointsOfInterest() {
    // now that the guides have been updated, we need to update each point of interest
    let pointsOfInterest = this.props.area.pointsOfInterest;
    //alert("points of interest = " + JSON.stringify(pointsOfInterest));
    let topLine = this.props.area.guides.top;
    let bottomLine = this.props.area.guides.bottom;
    //alert("guides = " + JSON.stringify(this.props.area.guides));
    let size = topLine.length;

    let selectedRegion = this.props.area;

    for (var i = 0; i < pointsOfInterest.length; i++) {
      let point = pointsOfInterest[i];
      let x = point.x / 1000.0;
      x = Math.round(x * (size - 1));

      let top = topLine[x] / 1000;
      let height = (bottomLine[x] - topLine[x]) / 1000;

      let y = Math.floor(
        (selectedRegion.y + top * selectedRegion.height) * 1000
      );
      height = Math.floor(height * selectedRegion.height * 1000);

      point.y = y;
      point.height = height;
    }
  }

  updateGuideValues(guide) {
    const size = this.getCanvasSize();
    var rect = this.props.area;

    let start = this.state.startDragPos;
    let end = this.state.endDragPos;

    for (let p = 0; p <= 100; p++) {
      // should be to 100
      let sx = start.x + (p * (end.x - start.x)) / 100;
      let sy = start.y + (p * (end.y - start.y)) / 100; // these are the screen coordinates!
      sy = sy - 75;
      sy = sy / size.canvasWidth;
      sy = sy * size.imageWidth;
      sy = Math.round((0.5 + sy / (rect.height * size.imageHeight)) * 1000);

      sx = sx / size.canvasWidth; // now is in image coordinates (0-1)
      sx = sx - rect.x;
      sx = sx / rect.width; // 0-1 within rectangle plane

      sx = Math.round(sx * (guide.length - 1));

      if (sx >= 0 && sx < guide.length) guide[sx] = sy;
    }

    this.updatePointsOfInterest();

    this.props.updateDocumentStaff({
      id: rect.id,
      //pointsOfInterest: JSON.stringify(selectedRegion.pointsOfInterest)
      guides: JSON.stringify({
        bottom: this.props.area.guides.bottom,
        top: this.props.area.guides.top,
      }),
      pointsOfInterest: JSON.stringify(this.props.area.pointsOfInterest),
    });
  }

  handleMouseUpOnOriginal(e) {
    let selectedTool = this.state.selectedTool;
    if (selectedTool === "topLine" || selectedTool === "bottomLine") {
      let guide = this.props.area.guides.top;
      if (selectedTool === "bottomLine") guide = this.props.area.guides.bottom;
      this.updateGuideValues(guide);
    }
    this.setState({
      drawingLine: false,
    });
  }

  handleMouseLeaveOnOriginal(e) {
    this.setState({
      drawingLine: false,
    });
  }

  toggleSnapToGrid() {
    this.setState({ snapToGrid: !this.state.snapToGrid });
  }

  toggleAddToTrainingSet() {
    this.setState({ addToTrainingSet: !this.state.addToTrainingSet });
  }

  getSnapToGridStyle() {
    if (this.state.snapToGrid) {
      return {
        color: "green",
        background: "black",
      };
    } else {
      return {
        color: "red",
        background: "white",
      };
    }
  }

  getAddToTrainingSetStyle() {
    if (this.state.addToTrainingSet) {
      return {
        color: "green",
        background: "black",
      };
    } else {
      return {
        color: "red",
        background: "white",
      };
    }
  }

  getSnapToGridText() {
    if (this.state.snapToGrid) return "snap to grid: on";
    else return "snap to grid: off";
  }

  getAddToTrainingSetText() {
    if (this.state.addToTrainingSet) return "add to training set: on";
    else return "add to training set: off";
  }

  closeMei() {
    this.setState({ meiFrame: null });
  }

  renderImageAndRegions() {
    const selectedTool = this.state.selectedTool;
    let isTrained = Network.isTrained();
    let classifying = this.state.classifying;

    return (
      <div>
        {isTrained && (
          <LoaderButton
            text="classify"
            loadingText={this.state.classifyingProgress}
            isLoading={classifying}
            disabled={classifying}
            onClick={() => {
              this.runClassificationAfterUpdate();
            }}
          ></LoaderButton>
        )}

        {!isTrained && (
          <div
            style={{
              border: "1px solid red",
              margin: "3px",
              background: "rgba(255,0,0,0.1)",
            }}
          >
            Network not yet trained - click on "retrain"
          </div>
        )}
        <div
          className="snapToGridButton"
          onClick={() => this.toggleSnapToGrid()}
          style={this.getSnapToGridStyle()}
        >
          {this.getSnapToGridText()}
        </div>
        <div
          className="snapToGridButton"
          onClick={() => this.toggleAddToTrainingSet()}
          style={this.getAddToTrainingSetStyle()}
        >
          {this.getAddToTrainingSetText()}
        </div>
        <div
          className=""
          ref="maindiv"
          style={{ position: "relative", width: "100%", maxWidth: "1000px" }}
        >
          <canvas
            ref="canvas"
            style={{ cursor: "crosshair" }}
            onMouseDown={(e) => this.handleMouseDownOnOriginal(e)}
            onMouseMove={(e) => this.handleMouseMoveOnOriginal(e)}
            onMouseUp={(e) => this.handleMouseUpOnOriginal(e)}
            onMouseLeave={(e) => this.handleMouseLeaveOnOriginal(e)}
          />
          <canvas
            ref="staff"
            onMouseMove={(e) => this.handleMove(e)}
            onClick={(e) => this.handleClick(e)}
            onMouseLeave={(e) => this.handleLeave(e)}
          />
          {this.state.meiFrame && this.state.meiFrame}
        </div>
        <div>
          <div style={{ textAlign: "left" }}>
            <div
              className={selectedTool === "draw" ? "SelectedIcon" : "Icon"}
              onClick={() => this.setState({ selectedTool: "draw" })}
            >
              <FontAwesomeIcon icon="pencil-alt" />
            </div>
            <div
              className={selectedTool === "erase" ? "SelectedIcon" : "Icon"}
              onClick={() => this.setState({ selectedTool: "erase" })}
            >
              <FontAwesomeIcon icon="eraser" />
            </div>
            <div
              style={{ borderTop: "black solid 2px" }}
              className={selectedTool === "topLine" ? "SelectedIcon" : "Icon"}
              onClick={() => this.setState({ selectedTool: "topLine" })}
            >
              <FontAwesomeIcon icon="arrow-up" />
            </div>
            <div
              style={{ borderBottom: "black solid 2px" }}
              className={
                selectedTool === "bottomLine" ? "SelectedIcon" : "Icon"
              }
              onClick={() => this.setState({ selectedTool: "bottomLine" })}
            >
              <FontAwesomeIcon icon="arrow-down" />
            </div>
          </div>
          <div style={{ height: "220px" }}>
            {selectedTool === "draw" && this.renderSymbolPalette()}
          </div>
        </div>
      </div>
    );
  }

  render() {
    let loading = !this.props.imageSrc || this.props.imageLoading;

    if (!loading) {
      const _this = this;
      setTimeout(function () {
        _this.updateCanvas();
        _this.renderStaff();
        if (_this.state.staffId !== _this.props.staffId) {
          _this.setState({ staffId: _this.props.staffId, meiFrame: null });
        }
      }, 0);
    }

    return (
      <div className="ImageRegionSelectorDiv">
        {loading && <div>...loading</div>}
        {!loading && <div>{this.renderImageAndRegions()}</div>}
      </div>
    );
  }
}
