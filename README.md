# SpaceOS

# Chat Model Handler

This project provides a mechanism to initialize and manage different types of chat models, such as ChatGPT, Groq, and Ollama. The application decides whether to initialize a remote or local chat model based on environment settings.

## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
- [Environment Variables](#environment-variables)


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

## Usage

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```


## environment-variables
Create a `.env` file in the root directory of the project

```bash
mv .env.example .env
```

Supported Env Variables

PREFER_REMOTE=

OPENAI_API_KEY=

GROQ_API_KEY=

OLLAMA_BASE_URL=
OLLAMA_MODEL=

