const path = require("path");
const fs = require('fs');
const wt = require("worker-thread");
const {AutoComplete} = require('enquirer');
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
const pathProcessedGray = path.join(__dirname, "grayscaled");
const pathProcessedSepia = path.join(__dirname, "sepia");
const readline = require('readline');

console.log(zipFilePath)
console.log(pathUnzipped)
console.log(pathProcessedGray)

IOhandler.unzip(zipFilePath, pathUnzipped)
    .then(()=> console.log("Extraction operation complete"))
    .then(()=> IOhandler.readDir(pathUnzipped))
//     .then((files) => Promise.all([IOhandler.filterMyImage(path.join(__dirname,"unzipped",files[0]), pathProcessed + "/modified1.png", "sepia"), 
//          IOhandler.filterMyImage(path.join(__dirname,"unzipped",files[1]), pathProcessed + "/modified2.png", "sepia"),
//          IOhandler.filterMyImage(path.join(__dirname,"unzipped",files[2]), pathProcessed + "/modified3.png", "sepia")
// ]))
    .then((directoryFiles) => {
        const run = async () => {
            const askFilter = new AutoComplete({
            name: 'filter',
            message: 'Choose from available filters: ',
            limit: 10,
            initial: 0,
            choices: ['grayscale','sepia',]
            
            });
        const filter = await askFilter.run();
        return filter
        }
        let filter = run()
        return filter.then(filterType => {
            return {'directoryFiles':directoryFiles, 'filterType':filterType}
        }
        )
})
    .then((imageConversionInfo) => {
        console.log("imageConversionInfo", imageConversionInfo)
        let numFiles = fs.readdir(path.join(__dirname,"unzipped"), (err, files) =>{
            if(!err){
                // console.log(files.length);
                return files.length;
            }
        })
        console.log("filtertype", imageConversionInfo.filterType)
        let pathProcessed = (imageConversionInfo.filterType === "sepia") ? pathProcessedSepia : pathProcessedGray
        console.log("path", pathProcessed)

        const ch = wt.createChannel(IOhandler.filterMyImage, numFiles);
        ch.on('message', (msg) => resolve(msg))
        ch.on("done", (err, result) => {
        if (err) {
            console.error(err);
        }
        
        console.log(result);
        });
        
        ch.on("stop", () => {
        console.log("channel is stop");
        });
        for(let index in imageConversionInfo.directoryFiles){
            // ch.add({pathIn: path.join(__dirname,"unzipped",imageConversionInfo.directoryFiles[index]), pathOut: pathProcessed + `/modified${index}.png`, filterKind: imageConversionInfo.filterType, callback: ch.stop})
            ch.add({pathIn: path.join(__dirname,"unzipped",imageConversionInfo.directoryFiles[index]), pathOut: pathProcessed + `/modified${index}.png`, filterKind: imageConversionInfo.filterType})

        }
        
    })
    .then(() => console.log("All images done!"))
    .catch((err) => console.log("err", err))