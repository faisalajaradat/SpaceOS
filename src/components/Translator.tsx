"use client";
import { useEffect } from 'react';

function handleonRecord(){
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.start();
  
}

const Translator = () => {

  useEffect(() => {
      // This will ensure that the container takes the full height and adjusts correctly
      document.documentElement.style.height = '100%';
      document.body.style.height = '100%';
      document.body.style.margin = '0';
  }, []);

  return(
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 w-full">
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 text-gray-800 w-full px-10 py-3">
          <h1 className="text-3xl font-bold text-blue-600 mb-4">SpaceOS LLM Interface</h1>
          <div className="flex flex-col items-center w-full mb-4">
            <div className="flex items-center w-full mb-4">
              <label htmlFor="temperature" className="mr-2">
                Temperature
              </label>
              <input
                type="range"
                id="temperature"
                min="0"
                max="2"
                value="1"
                step="0.01"
                className="flex-grow mr-2"
              />
              <span id="temperaturevalue" className="mr-4">
                50
              </span>
              <label htmlFor="topP" className="mr-2">
                Top P
              </label>
              <input
                type="range"
                id="topP"
                min="0"
                max="100"
                value="50"
                className="flex-grow mr-2"
              />
              <span id="topPValue">50</span>
            </div>
            <div className="flex gap-4">
              <select id="locationSelector" className="p-2 bg-blue-600 text-white rounded">
                <option value="chatgpt">OpenAI</option>
                <option value="groq">Groq</option>
                <option value="local">Ollama (Local)</option>
              </select>
              <select id="modelTypeSelector" className="p-2 bg-blue-600 text-white rounded"></select>
              <button id="speakBtn" className="p-2 bg-blue-600 text-white rounded" onClick={handleonRecord}>
                Speak
              </button>
              <button id="stopBtn" className="p-2 bg-blue-600 text-white rounded">
                Stop speaking
              </button>
              <button id="TestBtn" className="p-2 bg-blue-600 text-white rounded">
                Run Tests
              </button>
            </div>
          </div>
          <div
            id="transcript"
            className="flex-grow w-full p-4 bg-white border border-gray-300 rounded overflow-y-scroll"
          >
            Transcript will appear here...
          </div>
          <div className="flex w-full mt-4 gap-2">
            <input
              type="text"
              id="inputField"
              placeholder="Type here..."
              className="flex-grow p-2 border border-gray-300 rounded"
            />
            <button id="LLM" className="p-2 bg-blue-600 text-white rounded">
              Call LLM
            </button>
          </div>
        </main>
      </div>
        // <script src="js/testsuite.js" type="module"></script>
        // <script src="js/utilityFunctions.js" type="module"></script>
        // <script src="js/main.js" type="module"></script>
  );
}
export default Translator;