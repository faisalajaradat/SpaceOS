import { createReadStream, createWriteStream } from 'fs';
import { parse } from 'csv-parse';
import { stringify, Stringifier } from 'csv-stringify';
import { ChatOllama } from 'langchain/chat_models/ollama';
import { HumanMessage } from 'langchain/schema';
import { performance } from 'perf_hooks';

import 'dotenv/config';
import { ChatGLM4 } from '../Types/GLM4.js';

//change to include your models
const models = ['phi3:latest', "phi3:mini", "wizard-math:7b", "wizard-math:13b", "phi3:14b", "mixtral:8x22b", "mistral:latest"]; //'wizardlm2:latest', 'deepseek-coder:latest', "gemma:latest", "llama2:latest","llama3:latest", "llama3:70b", "mistral:latest", "mixtral:8x22b","wizard-math:13b", "wizard-math:7b"
//'GLM4'

const outputFile = 'results.csv';
const outputStream = createWriteStream(outputFile);
const stringifier = stringify({
  header: true,
  columns: ['ID', 'Model', 'Question', 'Answer', 'Latency (ms)', 'Throughput (chars/sec)']
});
stringifier.pipe(outputStream);

function delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function processModel(model: string, useStreaming: boolean) {
  const chatModel = new ChatOllama({
    baseUrl: process.env.OLLAMA_BASE_URL,
    model: model,
    temperature: 0.5,
    topP: 0.5,
    keepAlive: "60s",
  });
  // const chatModel = new ChatGLM4({
  //   temperature: 0.9,
  //   topP: 0.8,
  //   baseURL: "http://192.168.2.18:9091/v1/", // baseURL should look like: http://localhost:8000/v1/
  // });
  const parser = createReadStream('questions.csv').pipe(parse({ columns: true }));

  for await (const row of parser) {
    try {
      const { id, question } = row;
      const startTime = performance.now();
      console.log(startTime);

      let answer = '';
      let latency = 0;
      if (useStreaming) {
        let firstToken = true;
        const stream = await chatModel.stream([new HumanMessage(question)]);
        for await (const token of stream) {
          
          if (firstToken) {
            console.log("first token is:" + firstToken + token.content);
            console.log(performance.now());
            latency = performance.now() - startTime;
            console.log("latency to first token is:", latency);
            firstToken = false;
          }
          console.log("token is:" +  token.content);
          answer += token.content;
        }
      } else {
        const response = await chatModel.invoke([new HumanMessage(question)]);
        answer = String(response.content);
        latency = performance.now() - startTime;
      }

      const throughput = answer.length / (latency / 1000);

      stringifier.write({ ID: id, Model: model, Question: question, Answer: answer, 'Latency (ms)': latency.toFixed(2), 'Throughput (chars/sec)': throughput.toFixed(2) });
      
    } catch (error) {
      console.error(`Error processing question ID ${row.id}: ${error}`);
    }
  }
}

async function main() {
  let useStreaming = process.argv.includes('--stream');

  for (const model of models) {
    await processModel(model, useStreaming = true);
    await delay(60000);  // Wait for 60 seconds between processing different models
  }

  stringifier.end();
  outputStream.on('finish', () => {
    console.log('CSV processing completed for all models.');
  });
}

main();

/*
1,What year was the United Nations established?
2,Which planet is known as the 'Red Planet'?
3,Who wrote the novel '1984'?
4,What is the chemical symbol for gold?
5,What is the capital city of Japan?
6,How many continents are there on Earth?
7,What is the largest mammal in the world?
8,Which country won the FIFA World Cup in 2018?
9,What is the primary ingredient in guacamole?
10,Who painted the Mona Lisa?
11,What is the hardest natural substance on Earth?
12,What language has the most native speakers worldwide?
13,What does the acronym 'NASA' stand for?
14,Which element has the highest electrical conductivity?
15,What is the longest river in the world?
16,Who is the author of 'Pride and Prejudice'?
17,What is the formula for water?
18,Which musical instrument has six strings typically?
19,What is the main gas found in the Earth's atmosphere?
20,Who discovered penicillin?
*/