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

function generateSessionID() {
    const timestamp = new Date().getTime(); // Get current time as a timestamp
    const randomNum = Math.random().toString(36).substring(2, 15); // Generate a random string
    const sessionID = `${timestamp}-${randomNum}`;
    return sessionID;
}

const sessionID = generateSessionID();

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
        //console.log("LLM did not respond");
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
    let location = document.getElementById('locationSelector').value;
    let forceModel = document.getElementById('modelTypeSelector').value;
    let temperature = document.getElementById('temperature').value;
    let topP = document.getElementById('topP').value;
    llmInput = message;
    if(fromTestSuite) {isTesting =true};
    if (!message.trim()) return; // return if input is empty
    firstllmResponse = true;
    if (ws.readyState === WebSocket.OPEN) {
        llmCallStartTime = new Date();
        ws.send(JSON.stringify({message, "model":{forceModel, location, temperature, topP, sessionID}}));
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



var inputField = document.getElementById("inputField");

//If the user presses the "Enter" key on the keyboard
inputField.addEventListener("keypress", function(event) {
  
  if (event.key === "Enter") {
    // Cancels the default
    event.preventDefault();
    document.getElementById("LLM").click(); //calls LLM
  }
});

export {sendMessageToWebSocket};







//DROPDOWN
document.addEventListener('DOMContentLoaded', function() {
    const locationSelector = document.getElementById('locationSelector');
    const modelTypeSelector = document.getElementById('modelTypeSelector');

    const modelOptions = {
        'chatgpt': ['gpt-3.5-turbo-0125', 'gpt-4o'],
        'groq': ['llama3-8b-8192', 'llama3-70b-8192', 'mixtral-8x7b-32768', 'gemma-7b-it'],
        'local': ['mistral',] 
    };

    // Function to update model type dropdown based on selected location
    function updateModelDropdown() {
        const selectedLocation = locationSelector.value;
        const models = modelOptions[selectedLocation] || [];

        modelTypeSelector.innerHTML = '';

        models.forEach(model => {
            const option = document.createElement('option');
            option.value = model;
            option.textContent = model;
            modelTypeSelector.appendChild(option);
        });
    }

    locationSelector.addEventListener('change', updateModelDropdown);

    // Initialize the model dropdown on first load
    updateModelDropdown();
});

//disable TopP for chatGroq
document.addEventListener('DOMContentLoaded', function() {
    const locationSelector = document.getElementById('locationSelector');
    const topPSlider = document.getElementById('topP');

    // Function to enable or disable the Top P slider
    function toggleTopPSlider() {
        if (locationSelector.value === 'groq') {
            topPSlider.disabled = true;
            topPSlider.value = 0; 
            document.getElementById('topPValue').textContent = '0'; // Update the display value
        } else {
            topPSlider.disabled = false;
        }
    }

    locationSelector.addEventListener('change', toggleTopPSlider);

    toggleTopPSlider();
});

document.addEventListener('DOMContentLoaded', function() {
    const sliderOne = document.getElementById('temperature');
    const sliderTwo = document.getElementById('topP');
    const sliderOneValue = document.getElementById('temperaturevalue');
    const sliderTwoValue = document.getElementById('topPValue');

    // Function to update the display for slider one
    sliderOne.addEventListener('input', function() {
        sliderOneValue.textContent = sliderOne.value;
    });

    // Function to update the display for slider two
    sliderTwo.addEventListener('input', function() {
        sliderTwoValue.textContent = sliderTwo.value;
    });


    function adjustSliderRanges() {
        if (locationSelector.value === 'chatgpt' || locationSelector.value == 'groq') {
            // Adjustments for OpenAI / ChatGPT
            // Temperature Slider
            sliderOne.min = "0";
            sliderOne.max = "2";
            sliderOne.step = "0.01";
            sliderOne.value = "1"; 
            sliderOneValue.textContent = sliderOne.value;  

            // Top P Slider
            sliderTwo.min = "0";
            sliderTwo.max = "1";
            sliderTwo.step = "0.01";
            sliderTwo.value = "0.5"; 
            sliderTwoValue.textContent = sliderTwo.value; 
        } else {

            sliderOne.min = "0";
            sliderOne.max = "100";
            sliderOne.step = "1";
            sliderOne.value = "50"; 
            sliderOneValue.textContent = sliderOne.value; 

            // Top P Slider
            sliderTwo.min = "0";
            sliderTwo.max = "100";
            sliderTwo.step = "1";
            sliderTwo.value = "50";  
            sliderTwoValue.textContent = sliderTwo.value; 
        }
    }

    // Event listener for changes on the location selector
    locationSelector.addEventListener('change', adjustSliderRanges);
    adjustSliderRanges();

});
