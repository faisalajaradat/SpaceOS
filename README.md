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


