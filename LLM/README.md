# SpaceOS

# Chat Model Handler

This project provides a mechanism to initialize and manage different types of chat models, such as ChatGPT, Groq, and Ollama. The application decides whether to initialize a remote or local chat model based on environment settings.

## Table of Contents

- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)



## Installation

1. **Clone the repository:**

    ```bash
    git clone 
    cd your-repo-name
    ```

2. **Install dependencies:**

    Ensure you have [Node.js](https://nodejs.org/) and [npm](https://www.npmjs.com/) installed. Then run:

    ```bash
    npm install
    ```


## environment-variables
Create a `.env` file in the root directory of the project

```bash
mv .env.example .env
```

Supported Env Variables
```
PREFER_REMOTE: Whether or not to use a Remote LLM or Local

OPENAI_API_KEY: API key to use OPENAI Models (ChatGPT)

GROQ_API_KEY: API key to use Groq

OLLAMA_BASE_URL: The URL where Ollama is accessible (ex. http://localhost:11434)
OLLAMA_MODEL: The Ollama model to use in the API Call

LANGCHAIN_TRACING_V2=true
LANGCHAIN_API_KEY=<your-api-key>
```

## Usage

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```
If everything is working as expected you should see: 
Server running on http://localhost:7777

and you should be able to type/speak to the bot

### Fine-tuning
in order to pick the supported models, pick between the two dropdowns
1. OpenAI
    1. gpt-3.5-turbo-0125
    2. gpt-4o
2. Groq
    1. llama3-8b-8192
    2. llama3-70b-8192
    3. mixtral-8x7b-32768
    4. gemma-7b-it
3. Ollama (Local)
    1. mistral

In order to change the Temperature & topP of the models, use the provided sliders. The models automatically retain history currently. Refreshing the page clears the history, and is the only way to do so currently (the history is retained but a new SessionID is initiated on page refresh which is used to generate a new history array)

### Testing
In order to run tests based on set questions, compile all audio files and place them in /public/Voice_Recordings and then you can run the server and hit the button that says "Run tests", the audio will play from your computer and then be detected by the WebSpeech API and will automatically send the input with the relevant temperature/topP selected.

The result will be a CSV file which will be saved in the TestingData Folder, you can then easily move the CSV and do as you like with it.


