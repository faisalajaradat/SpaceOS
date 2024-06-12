import { saveCSV, resolveWebSocketResponse } from './testsuite.js';
import { updateUserTranscript, updateBotResponse, speakResponse, sendRowData, getBotResponse } from './utilityFunctions.js';


export let isTesting = false; //should be false by default.
let llmCallStartTime;
let firstllmResponse = false;
let llmCallResponseTime;
let llmInput;
export const ws = new WebSocket('ws://localhost:7777/ws/echo');
let botResponse = "";
//newRow= [new Date(),response.chatmodel.name, message, output, latency]
//headers = ["Date","Model_Name","Input","Output","Latency"];


ws.onopen = function() {
    console.log('WebSocket connection established');
};

ws.onerror = function(error) {
    console.error('WebSocket Error:', error);
    const transcript = document.getElementById('transcript');
    transcript.innerHTML += `<div class="error">WebSocket Connection Error: ${error.message}</div>`;
};


ws.onmessage = function(event) {
    let response = JSON.parse(event.data);
    console.log(response);
    if(firstllmResponse && response.chunk.kwargs.content){
        
        let llmCallEndTime = new Date();
        llmCallResponseTime = llmCallEndTime - llmCallStartTime ;
        console.log('Response Time: '+llmCallResponseTime + 'ms');
        firstllmResponse = false;
    }else if(firstllmResponse && !response.chunk.kwargs.content){
        console.log("LLM did not respond");
    }
    
    if(response.type == 'end'){
        let finalMessage = getBotResponse();
        if(isTesting){
            sendRowData([new Date, response.chatmodel.name,llmInput,finalMessage,llmCallResponseTime])
            saveCSV();
        }
        if (resolveWebSocketResponse) {
            resolveWebSocketResponse();
        }
    }else{
        updateBotResponse(response.chunk.kwargs.content, isTesting);
    }
    //csvHandler.addRow([new Date(),response.chunk ]);
    
};

async function sendMessageToWebSocket(message, fromTestSuite=false) {
    llmInput = message;
    if(fromTestSuite) {isTesting =true};
    if (!message.trim()) return; // return if input is empty
    firstllmResponse = true;
    if (ws.readyState === WebSocket.OPEN) {
        llmCallStartTime = new Date();
        ws.send(message);
        updateUserTranscript(message);
    } else {
        console.log('WebSocket is not open. Current State:', ws.readyState);
        const transcript = document.getElementById('transcript');
        transcript.innerHTML += `<div class="error">Cannot send message, WebSocket is not open.</div>`;
    }
}



document.getElementById('LLM').addEventListener('click', () => {
    const userInput = document.getElementById('inputField').value;
    sendMessageToWebSocket(userInput);
});


    




// Web Speech API 
const speakBtn = document.getElementById('speakBtn');
const stopBtn = document.getElementById('stopBtn');
let recognition = new webkitSpeechRecognition();
recognition.continuous = false;
recognition.lang = 'en-US';
recognition.interimResults = false;


let startTime ; //when the button is gonna be clicked
let lastSoundTime; //the last time a sound is detected
let speechEnded = false; //Needed this because when speech was short the result would be ready before speech end
let resultsBuffer = null;


recognition.onspeechstart = function() {
    console.log('Speech recognition started');
    //transcript.textContent = ''; // Clear when re-recognizing voice
    startTime = new Date(); //to time how long it takes
    speechEnded = false;
};

recognition.onerror = function(event) {
    console.error('Speech recognition error:', event.error);
};
recognition.onspeechend = () => {
        lastSoundTime = new Date(); // Capture the time when the last sound ends
        speechEnded = true;
        //console.log('Last speech ended at:', lastSoundTime);
        lastSoundDuration, processTimeDuration = calculateProcessingTime();
};

recognition.onresult = function(event) {
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                inputField.value = event.results[i][0].transcript;  // Display recognized text at the end to prevent duplicates
                resultsBuffer = {
                    transcript: event.results[i][0].transcript,
                    endTime: new Date()

                }
                sendMessageToWebSocket(resultsBuffer.transcript);
                //logging for how long recognition takes
                let endTime = new Date(); 
                let duration = endTime - startTime; //button click to speech end
                let lastSoundDuration = endTime - lastSoundTime; //from speech end to transcript
                


                calculateProcessingTime();
                // if (speechEnded) {
                //     let lastSoundDuration = new Date() - lastSoundTime; // Calculate duration from last speech end to now
                //     console.log('The time from the last recorded sound to output is: ' + lastSoundDuration + 'ms');
                //     speechEnded = false; // Reset flag for next session
                // }else{
                //     console.log('Speech recognition finished before speech was processed as finished')
                // }
            }
        }
};


function calculateProcessingTime(){
    if(speechEnded && resultsBuffer ){
        let processTimeDuration = resultsBuffer.endTime - startTime;
        let lastSoundDuration = resultsBuffer.endTime - lastSoundTime;
        //console.log('Total duration from button click to result: ' + processTimeDuration + 'ms');
        console.log('The time from the last recorded sound to output is: ' + lastSoundDuration + 'ms');
        resultsBuffer = null;
        return lastSoundDuration, processTimeDuration
    }


}

speakBtn.onclick = () => recognition.start();
stopBtn.onclick = () => recognition.stop();

export {sendMessageToWebSocket};