import { sendMessageToWebSocket, ws, isTesting} from "./main.js";
import { saveCSVFile } from "./utilityFunctions.js";


document.getElementById('TestBtn').addEventListener('click', fetchAudioFiles);

const recognition = new webkitSpeechRecognition();
const audio = new Audio();
let randomTesting= false;
export let resolveWebSocketResponse;





let audioFiles = [];
let currentFileIndex = 0;




export function saveCSV(){
    if(currentFileIndex >= audioFiles.length){
        console.log("Testing Complete");
            saveCSVFile();
    }
}
function waitForWebSocketResponse() {
    return new Promise((resolve) => {
        resolveWebSocketResponse = resolve;
    });
}

recognition.continuous = true;
recognition.interimResults = true;


recognition.onresult = async (event) => {
    if (event.results[0].isFinal) {
        sendMessageToWebSocket(event.results[0][0].transcript, true);
        recognition.stop();
        waitForWebSocketResponse().then(() =>{
            console.log("promise resolved");
            playNextAudio();

        });
    }
}

async function fetchAudioFiles() {
    try {
        const response = await fetch('http://localhost:7777/audio-files/');
        audioFiles = await response.json();
        console.log(audioFiles);
        if(randomTesting == true) audiofiles = randomizeOrder();
        playNextAudio();
    } catch (error) {
        console.error('Failed to fetch audio files:', error);
    }
}

function randomizeOrder(){
    
}

function playNextAudio() {
    if (currentFileIndex < audioFiles.length) {
        audio.src = audioFiles[currentFileIndex];
        audio.load(); 
        currentFileIndex++;
    }
}
audio.oncanplay = runTest;

function runTest() {
    recognition.start();
    audio.play();
}

//export {fetchAudioFiles}


