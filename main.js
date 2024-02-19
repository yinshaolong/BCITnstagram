/*
 * Project: Milestone 1
 * File Name: main.js
 * Description:
 *
 * Created Date:
 * Author:
 *
 */

const path = require("path");
const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");

IOhandler.unzip(zipFilePath, pathUnzipped)
  .then(() => console.log("Extraction operation complete"))
  .then(() => IOhandler.readDir(pathUnzipped))

  .then((directoryFiles) => {
    let filter = IOhandler.getFilter();
    return filter.then((filterType) => {
      return { directoryFiles: directoryFiles, filterType: filterType };
    });
  })
  .then((imageConversionInfo) => {
    IOhandler.convertImage(imageConversionInfo);
  })
  .then(() => console.log("All images done!"))
  .catch((err) => console.log("err", err));
