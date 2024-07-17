let messageTimer = null;
const transcript = document.getElementById('transcript');

function updateUserTranscript(userInput) {
    
    if(transcript.innerHTML === 'Transcript will appear here...') {
        transcript.innerHTML = `<div class="user">User: ${userInput}</div>`;
    } else {
        transcript.innerHTML += `<div class="user">User: ${userInput}</div>`;
    }
    document.getElementById('inputField').value = ''; // Clear input after sending
}

function updateBotResponse(data, test=false) {
    let botMessageDiv;
    const lastElement = transcript.lastElementChild;
    if (lastElement && lastElement.className === 'bot') {

        botMessageDiv = lastElement;
    } else {
        botMessageDiv = document.createElement('div');
        botMessageDiv.className = 'bot';
        transcript.appendChild(botMessageDiv);
    }
    botMessageDiv.textContent += data; // Append new data to end of the new bot message

    clearTimeout(messageTimer);
    if(test !=true){
        messageTimer = setTimeout(() => {
            speakResponse(botMessageDiv.textContent);
        }, 1000);
    }
    
}
function getBotResponse(){
    const lastElement = transcript.lastElementChild;
    if (lastElement && lastElement.className === 'bot') {
        return lastElement.innerText;
    }
}


function speakResponse(text) { //function for speaking
    const synth = window.speechSynthesis;
    const utterance = new SpeechSynthesisUtterance(text);
    synth.speak(utterance);
}

function sendRowData(rowData) {
    // URL of the server endpoint
    const url = 'http://localhost:7777/sendrow';

    // Creating the request options for the fetch call
    const options = {
        method: 'POST', // HTTP method
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ row: rowData}) // Data to be sent in the body of the request
    };

    // Making the fetch call
    fetch(url, options)
        .then(response => response.json()) // Parsing the JSON response
        .then(data => console.log('Success:', data))
        .catch(error => console.error('Error:', error));
}

function saveCSVFile(){
    const url = 'http://localhost:7777/savedocument';
    fetch(url)
}

export { updateUserTranscript, updateBotResponse, speakResponse, sendRowData, getBotResponse, saveCSVFile };