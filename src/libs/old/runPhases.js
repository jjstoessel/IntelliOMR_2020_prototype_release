import { API } from "aws-amplify";
import { s3UploadImage, loadImage } from "../awsLib";
import config from "../../config";
import { ConsoleLogger } from "@aws-amplify/core";

export async function calculateOrientation(image) {
  var info = {
    image: image,
  };
  return API.post("music-ocr-python", "/phase1_calculate_orientation", {
    body: info,
  });
}

export async function calculatePhase2(image, orientation) {
  var info = {
    image: image,
    orientation: orientation,
  };
  return API.post("music-ocr-python", "/phase2", {
    body: info,
  });
}

export async function calculatePhase3(rowInfo) {
  return API.post("music-ocr-python", "/phase3", {
    body: rowInfo,
  });
}

async function processPhase4Page(page) {
  return API.post("music-ocr-python", "/phase4", {
    body: {
      imageUrl: page.url,
      staffLocations: page.staffLocations,
      orientation: page.orientation,
    },
  });
}

export async function calculatePhase4(rowInfo) {
  let pages = rowInfo.phase3.pages;

  let output = [];
  for (var i = 0; i < pages.length; i++) {
    let pageLocs = await processPhase4Page(pages[i]);
    output.push(pageLocs);
  }

  return {
    pages: output,
  };
}

export async function calculatePhase5(rowInfo) {
  // from phase 4
  // pages[]
  //    pointsOfInterest[]
  //       x,y,width,height
  //       pointsOfInterest[]
  //          x,y,height
  // phase 5:
  // pages[]
  //    staff[]   ---
  //       symbolsAtPosition[]
  //          symbols[]
  //             pitch (centreLine=0, each space or line is +-1)
  //             symbolNames (at that position)

  let pages = rowInfo.phase4.pages;

  let outputPages = [];
  for (let pageIndex = 0; pageIndex < pages.length; pageIndex++) {
    let page = pages[pageIndex];

    let staffs = [];
    outputPages.push({
      staffs: staffs,
    });

    for (
      let poiIndex = 0;
      poiIndex < page.pointsOfInterest.length;
      poiIndex++
    ) {
      let poi = page.pointsOfInterest[poiIndex];

      let symbolsAtPosition = [];
      staffs.push({
        symbolsAtPosition: symbolsAtPosition,
      });

      for (
        let poiIndex2 = 0;
        poiIndex2 < poi.pointsOfInterest.length;
        poiIndex2++
      ) {
        let poi2 = poi.pointsOfInterest[poiIndex2];
        let symbols = {}; // no symbols for now... we will identify them
        symbolsAtPosition.push({ symbols: symbols });
      }
    }
  }

  return {
    pages: outputPages,
  };
}
