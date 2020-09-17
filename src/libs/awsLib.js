import { API, Auth, Storage } from "aws-amplify";
import config from "../config";
import uuid from "uuid";

export async function updateRows(rows) {
  var info = {
    rows: rows,
  };
  await API.post("music-ocr-app-api", "/update_rows", {
    body: info,
  });
}

function scaleCanvas(canvas, maxWidth) {
  var originalWidth = canvas.width;
  var originalHeight = canvas.height;

  if (maxWidth && originalWidth / maxWidth > 2) {
    var newWidth = Math.floor(originalWidth / 2);
    var newHeight = Math.floor(originalHeight / 2);

    var newCanvas = document.createElement("canvas");
    newCanvas.height = newHeight;
    newCanvas.width = newWidth;
    var ctx = newCanvas.getContext("2d");
    ctx.drawImage(
      canvas,
      0,
      0,
      originalWidth,
      originalHeight,
      0,
      0,
      newWidth,
      newHeight
    );

    return scaleCanvas(newCanvas, maxWidth); // repeat until done
  } else if (maxWidth && originalWidth > maxWidth) {
    var scale = maxWidth / originalWidth;
    newWidth = maxWidth;
    newHeight = Math.floor(originalHeight * scale);

    newCanvas = document.createElement("canvas");
    newCanvas.height = newHeight;
    newCanvas.width = newWidth;
    ctx = newCanvas.getContext("2d");
    ctx.drawImage(
      canvas,
      0,
      0,
      originalWidth,
      originalHeight,
      0,
      0,
      newWidth,
      newHeight
    );
    return newCanvas;
  } else return canvas;
}

export function loadImage(url) {
  if (!url.startsWith("http")) url = config.s3.IMAGEURL + url;

  function loadImage(resolve, reject) {
    try {
      let image = new Image();
      image.onload = () => {
        resolve(image);
      };
      image.onerror = function () {
        setTimeout(function () {
          loadImage(resolve, reject);
        }, 2000);
      };
      image.crossOrigin = "Anonymous";
      image.src = url + "?v=" + uuid.v1();
    } catch (e) {
      console.log("image failed to load");
      reject(e);
    }
  }

  return new Promise((resolve, reject) => {
    loadImage(resolve, reject);
  });
}

function loadLocalFileAsImage(file) {
  return new Promise((resolve, reject) => {
    let reader = new FileReader();
    let image = new Image();

    reader.onload = function (_file) {
      image.onload = () => {
        resolve(image);
      };
      image.onerror = (error) => {
        console.log("error loading file");
        reject();
      };
      image.src = _file.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function s3DownloadImage(filename) {
  let imageData = await Storage.get(filename, { level: "public" });
  return new Promise((resolve, reject) => {
    let image = new Image();
    image.onload = () => {
      resolve(image);
    };

    image.src = imageData;
  });
}

export async function s3UploadText(text, filename) {
  var buf = new Buffer(text);
  await Storage.put(filename, buf, {
    level: "public",
    contentType: "text/plain",
    Acl: "public-read",
  });
}

export async function s3UploadImage(image, filename) {
  const dataURL = image.toDataURL("image/jpeg");

  var buf = new Buffer(
    dataURL.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );
  await Storage.put(filename, buf, {
    level: "public",
    contentType: "image/jpeg",
    ContentEncoding: "base64",
    Acl: "public-read",
  });
}

export async function uploadFile(file, filename) {
  let reader = new FileReader();

  let p = new Promise((resolve, reject) => {
    reader.onload = function (_file) {
      let arrayBuffer = _file.target.result;
      resolve(arrayBuffer);
    };
    reader.readAsArrayBuffer(file);
  });
  let arrayBuffer = await p;
  await Storage.remove(filename);

  await Storage.put(filename, arrayBuffer, {
    level: "public",
    contentType: file.type,
    ContentEncoding: "application/octet-stream",
    Acl: "public-read",
  });
}

export async function s3UploadImageFromFile(file, maxWidth) {
  var filename = file.name;
  filename = filename.replace(/ /g, "_");

  filename = filename.replace(".JPG", "");
  filename = filename.replace(".jpg", "");
  filename += ".jpg";

  filename = `${Date.now()}-${filename}`;

  const image = await loadLocalFileAsImage(file);

  var canvas = document.createElement("canvas");
  canvas.height = image.height;
  canvas.width = image.width;
  var ctx = canvas.getContext("2d");
  ctx.drawImage(image, 0, 0);

  const scaledImage = scaleCanvas(canvas, maxWidth);

  //const dataURL = scaledImage.toDataURL("image/png");
  const dataURL = scaledImage.toDataURL("image/jpeg");

  var buf = new Buffer(
    dataURL.replace(/^data:image\/\w+;base64,/, ""),
    "base64"
  );

  const stored = await Storage.put(filename, buf, {
    level: "public",
    contentType: "image/jpeg",
    ContentEncoding: "base64",
    Acl: "public-read",
  });
  return stored.key;
}

export async function getUserEmail() {
  const user = await Auth.currentAuthenticatedUser();
  const attributes = await Auth.userAttributes(user);
  var email = null;

  for (let x in attributes) {
    var att = attributes[x];
    if (att.Name === "email") {
      email = att.Value;
    }
  }
  return email;
}
