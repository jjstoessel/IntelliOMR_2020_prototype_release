import meiConstants from "./meiRenderer_constants";
import meiRenderer_constants from "./meiRenderer_constants";
var $ = require("jquery");
const meiTemplate = `<mei xmlns:xlink="http://www.w3.org/1999/xlink"
xmlns="http://www.music-encoding.org/ns/mei"
 meiversion="2012"> 
 <meiHead> 
 <fileDesc>
 <titleStmt>
 <title>Example Render</title>
 </titleStmt>
 <pubStmt/>
 </fileDesc>
 </meiHead>
 <music n="opera">
    <body>      
    </body>
</music>
</mei>`;

class Measure {
  constructor(symbols, start, end) {
    this.symbols = [];
    for (var i = start; i < end; i++) {
      this.symbols.push(symbols[i]);
    }
  }

  calculatePitch(pitch) {
    let pnames = ["c", "d", "e", "f", "g", "a", "b"];
    let octave = Math.floor(pitch / 7);
    let notePos = pitch % 7;
    return {
      oct: octave,
      pname: pnames[notePos],
    };
  }

  ignoreSymbol(symbols, position) {
    let symbol = symbols[position];
    if (symbol.symbolCategory === "notes") {
      // ignore if the next symbol is an 8 clef!
      if (position < symbols.length - 1) {
        let nextSymbol = symbols[position + 1];
        if (nextSymbol.symbol === "clef8") return true;
      }
    }
    return false;
  }

  renderNotes(pitchOffset) {
    let s = "";
    for (var i = 0; i < this.symbols.length; i++) {
      let symbol = this.symbols[i];

      if (this.ignoreSymbol(this.symbols, i)) continue;

      if (symbol.symbolCategory === "notes") {
        let renderInfo = meiRenderer_constants.noteInfo[symbol.symbol];

        let pitch = this.calculatePitch(
          Math.round(pitchOffset - symbol.pitch * 2)
        );
        let dot = "";
        if (symbol.hasDot) dot = ' dots="1"';
        let accidental = "";
        if (symbol.accidental)
          accidental = ' accid="' + symbol.accidental + '"';
        let stemDir = "";
        if (renderInfo.dir) stemDir = ' stem.dir="' + renderInfo.dir + '"';

        let tieStart = symbol.tieStart ? ' tie="i"' : "";
        let tieEnd = symbol.tieEnd ? ' tie="t"' : "";
        s =
          s +
          '<note pname="' +
          pitch.pname +
          '" oct="' +
          pitch.oct +
          '" dur="' +
          renderInfo.dur +
          '"' +
          stemDir +
          dot +
          accidental +
          tieStart +
          tieEnd +
          "/>";
      }
      if (symbol.symbolCategory === "rests") {
        let renderInfo = meiRenderer_constants.restInfo[symbol.symbol];

        s = s + '<rest dur="' + renderInfo.dur + '"/>';
      }
    }
    return s;
  }

  getTimeSignature() {
    for (var i = 0; i < this.symbols.length; i++) {
      let symbol = this.symbols[i];
      if (symbol.symbolCategory === "timeSignatures") return symbol.symbol;
    }
    return null;
  }

  render(n, pitchOffset, voice) {
    return (
      '<measure xml:id="measure-' +
      n +
      '" n="' +
      n +
      '">' +
      '<staff n="' +
      voice +
      '">' +
      '<layer n="1">' +
      this.renderNotes(pitchOffset) +
      "</layer>" +
      "</staff>" +
      "</measure>"
    );
  }
}

class Section {
  constructor(symbols) {
    // lets see if we can figure out the clef shape and clef line
    this.clefShape = "F";
    this.clefLine = 3;

    this.calculateClef(symbols);

    // then lets see if we can figure out the key signature

    // lets break down into measures!
    this.calculateMeasures(symbols);
  }

  calculateClef(symbols) {
    for (var i = 0; i < symbols.length; i++) {
      let s = symbols[i];
      if (s.symbolCategory === "clefs") {
        this.clefLine = 3 - s.pitch;
        switch (s.symbol) {
          case "treble_clef":
            this.clefShape = "G";
            this.pitchOffset = 6 + 32 + -this.clefLine * 2;
            break;
          case "sing_clef":
            this.clefShape = "C";
            this.pitchOffset = 6 + 28 + -this.clefLine * 2;
            break;
          case "clef8":
            this.clefShape = "F";
            this.pitchOffset = 6 + 24 + -this.clefLine * 2;
            break;
          default:
            this.clefShape = "G";
            this.pitchOffset = 6 + 32 + -this.clefLine * 2;
        }
      }
      return; // only process the first cleff
    }
  }

  calculateMeasures(symbols) {
    this.measures = [];
    let start = 0;
    for (var i = 0; i < symbols.length; i++) {
      let s = symbols[i];
      if (s.symbol === "bar_line") {
        this.measures.push(new Measure(symbols, start, i));
        start = i;
      }
    }
    if (start < symbols.length - 1) {
      this.measures.push(new Measure(symbols, start, symbols.length));
    }
  }

  getTimeSignature() {
    // find first time sig
    for (var i = 0; i < this.measures.length; i++) {
      let timeSig = this.measures[i].getTimeSignature();
      if (timeSig) return timeSig;
    }
    return "null";
  }

  render(voice) {
    let s = "<section>";
    for (var i = 0; i < this.measures.length; i++) {
      s = s + this.measures[i].render(i + 1, this.pitchOffset, voice);
    }
    s = s + "</section>";
    return s;
  }
}

class Score {
  constructor(symbols) {
    this.section = new Section(symbols);
  }

  renderScoreDef(voice, timeSignature) {
    let clefShape = this.section.clefShape;
    let clefLine = this.section.clefLine;

    let timeSigData = meiRenderer_constants.timeSigMappings[timeSignature];
    if (!timeSigData)
      timeSigData = meiRenderer_constants.timeSigMappings["null"];

    return (
      '<scoreDef midi.bpm="120">' +
      '<staffGrp symbol="bracket">' +
      '<staffDef clef.shape="' +
      clefShape +
      '" clef.line="' +
      clefLine +
      '" ' +
      timeSigData.scoreDef +
      ' n="' +
      voice +
      '" lines="5" />' +
      "</staffGrp>" +
      "</scoreDef>"
    );
  }

  renderSections(voice) {
    return this.section.render(voice);
  }

  toXml(voice) {
    let timeSignature = this.section.getTimeSignature();

    let score =
      '<mdiv n="score_1"><score>' +
      this.renderScoreDef(voice, timeSignature) +
      this.renderSections(voice) +
      "</score></mdiv>";
    let scoreXml = $.parseXML(score);
    return scoreXml;
  }
}

class MeiRenderer {
  sortSymbols(symbols, pointsOfInterest, fromX, toX) {
    // points of interest may not be in order for this staff
    // returns an ordered set of symbols for the given staff (an array of arrays)
    // only include symbols between fromX and toX

    // for each point we will get an array of elements like
    //  {"pitch":1, "symbols":["treble_clef"]}
    function shouldCollapse(sortedSymbols, symbolSet) {
      // returns true if it is a tie by itself
      // merge this with the previous symbols
      if (sortedSymbols.length === 0) return false;
      if (symbolSet.length !== 1) return false;
      let symbols = symbolSet[0].symbols;
      if (symbols.indexOf("tie_top") >= 0) return true;
      if (symbols.indexOf("tie_bottom") >= 0) return true;
      return false;
    }

    let sortedSymbols = [];

    for (let pos in symbols) {
      let poi = pointsOfInterest[parseInt(pos)];
      let poiX = poi.x / 1000.0;
      if (poiX < fromX || poiX > toX) continue; // ignore this!

      let symbolInfo = symbols[pos];
      let symbolSet = [];
      for (let i in symbolInfo) {
        if (symbolInfo[i].symbols.length > 0) symbolSet.push(symbolInfo[i]);
      }

      if (symbolSet.length > 0) {
        if (shouldCollapse(sortedSymbols, symbolSet)) {
          let lastSymbol = sortedSymbols[sortedSymbols.length - 1];

          lastSymbol.symbols.push(symbolSet[0]);
        } else {
          sortedSymbols.push({
            x: poi.x,
            symbols: symbolSet,
          });
        }
      }
    }

    sortedSymbols.sort((a, b) => (a.x > b.x ? 1 : a.x === b.x ? 0 : -1));

    let symbolSet = [];
    for (var i = 0; i < sortedSymbols.length; i++)
      symbolSet.push(sortedSymbols[i].symbols);

    return symbolSet;
  }

  hasSymbol(symbols, newPosition, symbolToSeek) {
    if (newPosition < 0) return false;
    if (newPosition >= symbols.length) return false;
    let pitches = symbols[newPosition];
    for (var i = 0; i < pitches.length; i++) {
      var pitchInfo = pitches[i];
      if (pitchInfo.symbols.indexOf(symbolToSeek) >= 0) return true;
    }
    return false;
  }

  hasDot(symbols, position) {
    // returns true if adjacent symbol is a dot
    // OR adjacent symbol is a bar line and following is a dot

    if (this.hasSymbol(symbols, position + 1, "dot")) return true;

    return false;
  }

  hasAccidental(symbols, position) {
    // returns "s" for sharp, "n" for neutral, or "f" for flat if an accidental is present
    // returns null if none
    if (this.hasSymbol(symbols, position - 1, "sharp")) return "s";
    if (this.hasSymbol(symbols, position - 1, "flat")) return "f";
    if (this.hasSymbol(symbols, position - 1, "neutral")) return "n";
    return null;
  }

  isStartOfTie(symbols, position) {
    if (!this.hasSymbol(symbols, position + 1, "bar_line")) return false;
    if (this.hasSymbol(symbols, position, "tie_top")) return true;
    if (this.hasSymbol(symbols, position, "tie_bottom")) return true;
    if (this.hasSymbol(symbols, position + 1, "tie_top")) return true;
    if (this.hasSymbol(symbols, position + 1, "tie_bottom")) return true;
    return false;
  }

  isEndOfTie(symbols, position) {
    if (!this.hasSymbol(symbols, position - 1, "bar_line")) return false;
    if (this.hasSymbol(symbols, position - 1, "tie_top")) return true;
    if (this.hasSymbol(symbols, position - 1, "tie_bottom")) return true;
    if (this.hasSymbol(symbols, position - 2, "tie_top")) return true;
    if (this.hasSymbol(symbols, position - 2, "tie_bottom")) return true;
    return false;
  }

  generateTaggedSymbols(symbols) {
    let taggedSymbols = [];

    for (var pos = 0; pos < symbols.length; pos++) {
      let primarySymbol = null;
      let symbolSet = symbols[pos]; // these are the symbols at a certain x location
      for (let i = 0; i < symbolSet.length; i++) {
        let symbolsAtXY = symbolSet[i]; // has "pitch" as well as symbols [string]
        for (let s = 0; s < symbolsAtXY.symbols.length; s++) {
          let symbolString = symbolsAtXY.symbols[s];

          // lets iterate through primarySymbols sets
          let pi = meiConstants.primarySymbols;
          for (let cat in pi) {
            let isPrimary = pi[cat].indexOf(symbolString);
            if (isPrimary >= 0) {
              let hasDot = false;
              if (cat === "notes") hasDot = this.hasDot(symbols, pos);
              primarySymbol = {
                symbolCategory: cat,
                symbol: symbolString,
                pitch: symbolsAtXY.pitch,
                hasDot: hasDot,
                accidental: this.hasAccidental(symbols, pos),
                tieStart: this.isStartOfTie(symbols, pos),
                tieEnd: this.isEndOfTie(symbols, pos),
              };
            }
          }
        }
      }
      if (primarySymbol) taggedSymbols.push(primarySymbol);
    }

    return taggedSymbols;
  }

  identifyDottedTies(sortedSymbols) {
    function findNoteAtPitch(symbolSet, pitch) {
      for (let i = 0; i < symbolSet.length; i++) {
        let s = symbolSet[i];
        if (s.pitch === pitch) return s.symbols[0];
      }
      return null;
    }

    for (var i = 2; i < sortedSymbols.length; i++) {
      let symbolSet = sortedSymbols[i];
      for (var pitch = 0; pitch < symbolSet.length; pitch++) {
        let pitchSymbol = symbolSet[pitch];
        if (pitchSymbol.symbols.indexOf("dot") >= 0) {
          // it has a dot!!!
          if (this.hasSymbol(sortedSymbols, i - 1, "bar_line")) {
            // ok... lets find the note at the same pitch at the previous position
            let noteAtPitch = findNoteAtPitch(
              sortedSymbols[i - 2],
              pitchSymbol.pitch
            );
            if (noteAtPitch) {
              let newNote = meiConstants.halfDurations[noteAtPitch];
              pitchSymbol.symbols = [newNote];
              sortedSymbols[i - 1].push({
                pitch: 0,
                symbols: ["tie_top"],
              });
            }
          }
        }
      }
    }
  }

  async renderSingleStaff(pointsOfInterest, symbols) {
    // returns text string of resulting file
    let sortedSymbols = this.sortSymbols(symbols, pointsOfInterest); // the points of interest might not be in order
    this.identifyDottedTies(sortedSymbols);
    let taggedSymbols = this.generateTaggedSymbols(sortedSymbols); // uses context to identify the mei symbol

    let score = new Score(taggedSymbols);
    let scoreXml = score.toXml(1).documentElement;

    let meiTemplate = await this.loadMeiTemplate();
    try {
      let xmlDoc = $.parseXML(meiTemplate);
      let body = $(xmlDoc).find("body");
      $(scoreXml).appendTo(body);

      return new XMLSerializer().serializeToString(xmlDoc);
    } catch (e) {
      alert("error:" + e);
    }
    return "";
  }

  copyXml(xml) {
    //let s = new XMLSerializer().serializeToString(xml);
    //console.log("copyXml =" + s);
  }

  appendScore(completeScore, scoreToAdd) {
    // lets first add the staffGrp
    let origGrp = $(completeScore).find("staffGrp");
    let insertGrp = $(scoreToAdd).find("staffGrp");
    let staffDef = $(insertGrp).find("staffDef");
    $(staffDef).appendTo(origGrp);

    // insert measures!
    $(completeScore)
      .find("measure")
      .each(function () {
        let measure_number = $(this).attr("n");
        // let us iterate through the score to add and find the equivalent meaure
        let _parentThis = this;
        $(scoreToAdd)
          .find("measure")
          .each(function () {
            let measure_number2 = $(this).attr("n");
            if (measure_number2 === measure_number) {
              let staff_to_add = $(this).find("staff");
              $(staff_to_add).appendTo(_parentThis);
            }
          });
      });
  }

  async renderScore(documentItems, documentId, startX, endX) {
    // each document item has:
    //documentIndex
    //pageNum
    //staffNum
    //pointsOfInterest
    //symbols
    //voice
    //bookend
    //documentId

    // step 1 ... get number of voices!
    let maxVoices = 0;
    for (let i = 0; i < documentItems.length; i++)
      maxVoices = Math.max(maxVoices, documentItems[i].voice);

    let completeScore = null;

    // step 2 .... for each voice, get an array of staffs
    // and create a "sortedSymbol" set for each voice, and create the taggedSymbols
    for (let v = 1; v <= maxVoices; v++) {
      let completeSortedSymbols = [];

      let staffs = [];
      for (let i = 0; i < documentItems.length; i++) {
        let staff = documentItems[i];
        if (staff.voice === v) staffs.push(staff);
      }

      for (let i = 0; i < staffs.length; i++) {
        let staff = staffs[i];

        let fromX = 0;
        if (i === 0) {
          fromX = startX;
        }
        let toX = 1.0;
        if (i === staffs.length - 1) {
          toX = endX;
        }

        //console.log("staff info = " + JSON.stringify(staff));
        let sortedSymbols = this.sortSymbols(
          staff.symbols,
          staff.pointsOfInterest,
          fromX,
          toX
        ); // the points of interest might not be in order
        if (completeSortedSymbols.length > 0) {
          // insert a new bar line
          completeSortedSymbols.push([{ pitch: 0, symbols: ["bar_line"] }]);
        }
        for (let s = 0; s < sortedSymbols.length; s++)
          completeSortedSymbols.push(sortedSymbols[s]);
      }

      this.identifyDottedTies(completeSortedSymbols);
      let taggedSymbols = this.generateTaggedSymbols(completeSortedSymbols); // uses context to identify the mei symbol

      let score = new Score(taggedSymbols);
      let scoreXml = score.toXml(v).documentElement;
      if (!completeScore) completeScore = scoreXml;
      else this.appendScore(completeScore, scoreXml);
    }

    // now lets load an insert into template
    //let meiTemplate = await this.loadMeiTemplate();
    try {
      let xmlDoc = $.parseXML(meiTemplate);
      //let xmlDoc = meiTemplate;
      let body = $(xmlDoc).find("body");

      $(completeScore).appendTo(body);

      return {
        xml: new XMLSerializer().serializeToString(xmlDoc),
        documentId: documentId,
      };
    } catch (e) {
      alert("error:" + e);
      return { error: e };
    }
  }
}

export default new MeiRenderer();
