import * as tf from "@tensorflow/tfjs";
import { API } from "aws-amplify";
import config from "../config";

var _network = null;
var _symbolSet = null;

class Network {
  setNetwork(network, symbolSet) {
    _network = network;
    _symbolSet = symbolSet;
  }

  async saveCurrentModel() {
    await _network.save("downloads://intelliomrmodel"); // save locally!
  }

  async saveCurrentSymbols() {
    // lets upload symbols
    var info = {
      symbols: JSON.stringify(_symbolSet),
    };
    await API.post("music-ocr-python", "/uploadNetworkSymbols", {
      body: info,
    });
  }

  loadSymbols() {
    return new Promise(function (resolve, reject) {
      //fetch("https://omrimageuploads.s3.amazonaws.com/public/omr_symbols.json")
      fetch(config.s3.IMAGEURL + "omr_symbols.json")
        .then(function (response) {
          if (response.status !== 200) {
            console.log(
              "Looks like there was a problem. Status Code: " + response.status
            );
            reject();
            return;
          }

          // Examine the text in the response
          response.json().then(function (data) {
            _symbolSet = data;
            resolve(data);
          });
        })
        .catch(function (err) {
          console.log("Fetch Error :", err);
        });
    });
  }

  async loadNetwork() {
    _symbolSet = await this.loadSymbols();

    if (_symbolSet) {
      try {
        _network = await tf.loadLayersModel(
          "https://omrimageuploads.s3.amazonaws.com/public/intelliomrmodel.json"
        );
      } catch (e) {
        alert("error loading network " + e);
      }
      console.log("NETWORK LOADED");
    } else {
      console.log("NETWORK DOESNT EXIST");
      _network = null;
      _symbolSet = null;
    }
  }

  isTrained() {
    return _network !== null;
  }

  isValidSymbol(symbol, pitch) {
    if (symbol === "bar_line" || symbol === "double_bar_line") {
      if (pitch !== 0) return false;
    }
    if (symbol === "tie_top" && pitch >= -2.0) return false;
    if (symbol === "tie_bottom" && pitch <= 2.0) return false;
    return true;
  }

  async getClassification(image, symbolSet, pitch) {
    // returns an object
    // symbols []
    // strength: float

    var pixels = tf.browser.fromPixels(image);
    pixels = pixels.slice([0, 0, 0], [100, 50, 1]);
    const b = tf.scalar(1.0 / 255.0);
    pixels = pixels.mul(b);

    // create input values
    let inputs = [];
    inputs.push(pixels);

    let input = tf.stack(inputs);

    let scores = await _network.predict(input).data();

    let symbols = {};

    for (var i = 0; i < scores.length; i++) {
      let s = _symbolSet[i];
      if (s === "blank") continue;
      let score = scores[i];
      if (score > 0.5) {
        //m = Math.max(m, score);
        if (this.isValidSymbol(s, pitch)) symbols[s] = score;
      }
    }

    return {
      symbols: symbols,
    };
  }

  canInhibit(symbol1, symbol2) {
    // some keys will have several sharps or flats ... so don't inhibit
    if (symbol1 === "flat" && symbol2 === "flat") return false;
    if (symbol1 === "sharp" && symbol2 === "sharp") return false;

    // ties can inhibit other ties
    if (symbol1.startsWith("tie") && symbol2.startsWith("tie")) return true;

    // ties and symbols can co-exist
    if (symbol1.startsWith("tie") || symbol2.startsWith("tie")) return false;

    // numbers and symbols can co-exist
    if (symbol1.startsWith("number") || symbol2.startsWith("number"))
      return false;

    return true;
  }

  performLateralInhibition(symbolList, width, height) {
    // only allow one item in a column (except if it is a number or tie)
    let newSymbolList = {};
    let _this = this;
    let scaledWidth = width / height;
    let distThreshold = 150;

    function isWinner(x, ht, symbolName, strength) {
      for (let xpos in symbolList) {
        let dx = Math.abs(xpos - x) * scaledWidth;
        if (dx > distThreshold) continue;

        let lateralCompeditors = symbolList[xpos];
        for (let y in lateralCompeditors) {
          let symbolsAtY = lateralCompeditors[y];
          let symbolList = symbolsAtY.symbols;
          for (let symbolName2 in symbolList) {
            let strength2 = symbolList[symbolName2];
            if (x === xpos && symbolName2 === symbolName && y === ht) continue; // this is the same element
            if (
              _this.canInhibit(symbolName, symbolName2) &&
              strength < strength2
            )
              return false;
          }
        }
      }
      return true;
    }

    for (let x in symbolList) {
      // scans along the xaxis
      let newSymbolsAtX = {};
      newSymbolList[x] = newSymbolsAtX;

      let symbolsAtX = symbolList[x];
      for (let ht in symbolsAtX) {
        let symbolsAtY = symbolsAtX[ht];
        let symbolList = symbolsAtY.symbols;

        let newSymbolsAtY = { symbols: {} };
        newSymbolsAtX[ht] = newSymbolsAtY;

        for (let symbolName in symbolList) {
          let strength = symbolList[symbolName];
          if (isWinner(x, ht, symbolName, strength)) {
            newSymbolsAtY.symbols[symbolName] = strength;
          }
        }
      }
    }

    return newSymbolList;
  }
}

export default new Network();
