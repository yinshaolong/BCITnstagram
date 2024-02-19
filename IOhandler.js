/*
 * Project: Milestone 1
 * File Name: IOhandler.js
 * Description: Collection of functions for files input/output related operations
 *
 * Created Date:
 * Author:
 *
 */

const wt = require("worker-thread");
const yauzl = require("yauzl-promise");
const fs = require("fs").promises;
const { AutoComplete } = require("enquirer");
const { createReadStream, createWriteStream, readdir } = require("fs");
const PNG = require("pngjs").PNG;
const path = require("path");
const { pipeline } = require("stream/promises");

const grayscaleHelper = function (idx) {
  const gray = (this.data[idx] + this.data[idx + 1] + this.data[idx + 2]) / 3;
  this.data[idx] = gray;
  this.data[idx + 1] = gray;
  this.data[idx + 2] = gray;
};
const sepiaHelper = function (idx) {
  let red = this.data[idx];
  let green = this.data[idx + 1];
  let blue = this.data[idx + 2];

  let sepiaRed = red * 0.393 + green * 0.769 + blue * 0.189;
  let sepiaGreen = red * 0.349 + green * 0.686 + blue * 0.168;
  let sepiaBlue = red * 0.272 + green * 0.534 + blue * 0.131;

  this.data[idx] = sepiaRed < 255 ? sepiaRed : 255;
  this.data[idx + 1] = sepiaGreen < 255 ? sepiaGreen : 255;
  this.data[idx + 2] = sepiaBlue < 255 ? sepiaBlue : 255;
};

const filters = {
  grayscale: grayscaleHelper,
  sepia: sepiaHelper,
};

/**
 * Description: decompress file from given pathIn, write to given pathOut
 *
 * @param {string} pathIn
 * @param {string} pathOut
 * @return {promise}
 */

const unzip = async (pathIn, pathOut) => {
  const zip = await yauzl.open(pathIn);
  try {
    for await (const entry of zip) {
      if (entry.filename.includes("/")) {
        continue;
      }
      const readStream = await entry.openReadStream();
      const writeStream = createWriteStream(
        // path.join(pathOut, entry.fileName)
        `${pathOut}/${entry.filename}`
      );
      await pipeline(readStream, writeStream);
    }
  } finally {
    await zip.close();
  }
};

/**
 * Description: read all the png files from given directory and return Promise containing array of each png file path
 *
 * @param {string} path
 * @return {promise}
 */
const readDir = (dir) => {
  return new Promise((resolve, reject) => {
    readdir(dir, (err, files) => {
      if (err) reject(err);
      else resolve(files.filter((file) => path.extname(file) === ".png"));
    });
  });
};

//no longer used as the errorHandling for pipelines is deal with by stream/promise
const errorHandler = (err) => {
  if (err) {
    console.log("in error");
    console.log(err);
  }
};

const filterStream = function (imageFilter) {
  for (let y = 0; y < this.height; y++) {
    for (let x = 0; x < this.width; x++) {
      let i = (this.width * y + x) << 2;
      filters[imageFilter].call(this, i);
    }
  }
  this.pack();
};

/**
 * Description: Read in png file by given pathIn,
 * convert to grayscale and write to given pathOut
 *
 * @param {string} filePath
 * @param {string} pathProcessed
 * @return {promise}
 */

const filterMyImage = ({ pathIn, pathOut, filterKind, callback }) => {
  let promise = pipeline(
    createReadStream(pathIn),
    new PNG().on("parsed", function () {
      filterStream.call(this, filterKind);
    }),
    createWriteStream(pathOut)
  );
  //* if we dont use "message", we can use callback to resolve -> line 148 *
  // promise.then(() => {
  //   callback();
  //   return promise;
  // });
};

const convertImage = (imageConversionInfo) => {
  const pathProcessedGray = path.join(__dirname, "grayscaled");
  const pathProcessedSepia = path.join(__dirname, "sepia");
  let numFiles = fs.readdir(path.join(__dirname, "unzipped"), (err, files) => {
    if (!err) {
      return files.length;
    }
  });
  let pathProcessed =
    imageConversionInfo.filterType === "sepia"
      ? pathProcessedSepia
      : pathProcessedGray;

  const ch = wt.createChannel(filterMyImage, numFiles);
  ch.on("message", (msg) => resolve(msg));

  for (let index in imageConversionInfo.directoryFiles) {
    // ch.add({pathIn: path.join(__dirname,"unzipped",imageConversionInfo.directoryFiles[index]), pathOut: pathProcessed + `/modified${index}.png`, filterKind: imageConversionInfo.filterType, callback: ch.stop})
    ch.add({
      pathIn: path.join(
        __dirname,
        "unzipped",
        imageConversionInfo.directoryFiles[index]
      ),
      pathOut: pathProcessed + `/modified${index}.png`,
      filterKind: imageConversionInfo.filterType,
    });
  }
};

const getFilter = async () => {
  const askFilter = new AutoComplete({
    name: "filter",
    message: "Choose from available filters: ",
    limit: 10,
    initial: 0,
    choices: ["grayscale", "sepia"],
  });
  const filter = await askFilter.run();
  return filter;
};
module.exports = {
  unzip,
  readDir,
  filterMyImage,
  convertImage,
  getFilter,
};
