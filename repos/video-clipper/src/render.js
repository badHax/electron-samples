const { desktopCapturer,remote } = require( 'electron');
const {writeFile} = require('fs');
var dialog = require('electron').remote.dialog

//vars from imports
const  {Menu} = remote;


//Buttons
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('start-video');
const stopBtn = document.getElementById('stop-video');
const videoSelectBtn = document.getElementById('select-video');

//vars
let mediaRecorder; //recoreds the screen
const recordedChunks = []; //temp storage for the video in bytes

//on click
videoSelectBtn.onclick = getVideoSources;   //select screen to record
startBtn.onclick = function(){              //start the recording
    mediaRecorder.start();
    console.log(mediaRecorder.state);
    console.log("recorder started");
    startBtn.className = "button is-danger";
} 
stopBtn.onclick = function(){               //stop the recording
    mediaRecorder.stop();
    console.log(mediaRecorder.state);
    console.log("recorder stopped");
    startBtn.className = "button is-primary";
}

//get available video files
async function getVideoSources(){
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
    });

    const videoOptionsMenu = Menu.buildFromTemplate(inputSources.map(source => {
        return {
            label : source.name,
            click : () =>  selectSource(source)
        }
    }));
    videoOptionsMenu.popup();
}

//select the video source screen
async function selectSource(source){
videoSelectBtn.innerText = source.name;

const contraints = {
    audio: false,
    video: {
        mandatory : {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId : source.id
        }
    }
}

//create a stream
const stream = await navigator.mediaDevices.getUserMedia(contraints)

//preview the source in a video stream
videoElement.srcObject = stream;
videoElement.play();

//create the media recorder
const options = {mimeType: 'video/webm; codecs=vp9'}
mediaRecorder = new MediaRecorder(stream,options);

//register event
mediaRecorder.ondataavailable = handleDataAvailable;
mediaRecorder.onstop = handleStop;
}

//register even listener
async function handleDataAvailable(e){
recordedChunks.push(e.data);
}

//saves video on file stop
async function handleStop(e){
    const blob = new Blob(recordedChunks,{type: 'video/webm; codecs=vp9'});
    const buffer = Buffer.from(await blob.arrayBuffer());

    const {filePath} = await dialog.showSaveDialog({
        buttonlabel: 'Save Video',
        defaultPath: `vid-${Date.now()}.webm`
    });
    console.log(filePath);
    writeFile(filePath,buffer, () => console.log(`video ${filePath} downloaded successfully!`));
}


