const path = require("path");
const fs = require('fs');
const wt = require("worker-thread");
/*
 * Project: Milestone 1
 * File Name: main.js
 * Description:
 *
 * Created Date:
 * Author:
 *
 */

const IOhandler = require("./IOhandler");
const zipFilePath = path.join(__dirname, "myfile.zip");
const pathUnzipped = path.join(__dirname, "unzipped");
const pathProcessed = path.join(__dirname, "grayscaled");

console.log(zipFilePath)
console.log(pathUnzipped)
console.log(pathProcessed)

IOhandler.unzip(zipFilePath, pathUnzipped)
    .then(()=> console.log("Extraction operation complete"))
    .then(()=> IOhandler.readDir(pathUnzipped))
//     .then((files) => Promise.all([IOhandler.filterMyImage(path.join(__dirname,"unzipped",files[0]), pathProcessed + "/modified1.png", "sepia"), 
//          IOhandler.filterMyImage(path.join(__dirname,"unzipped",files[1]), pathProcessed + "/modified2.png", "sepia"),
//          IOhandler.filterMyImage(path.join(__dirname,"unzipped",files[2]), pathProcessed + "/modified3.png", "sepia")
// ]))
    .then((directoryFiles) => {
        let numFiles = fs.readdir(path.join(__dirname,"unzipped"), (err, files) =>{
            if(!err){
                // console.log(files.length);
                return files.length;
            }
        })

        const ch = wt.createChannel(IOhandler.filterMyImage, numFiles);

        for(let index in directoryFiles){
            ch.add({pathIn: path.join(__dirname,"unzipped",directoryFiles[index]), pathOut: pathProcessed + `/modified${index}.png`, filterKind: "sepia", callback: ch.stop})

        }
        
    })
    .then(() => console.log("All images done!"))
    .catch((err) => console.log("err", err))