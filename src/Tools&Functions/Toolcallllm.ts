import { ChatOpenAI } from '@langchain/openai';
import weatherTool from './weatherTool.js';
import * as dotenv from 'dotenv';
import { GLM4ChatModel } from '../Types/GLM4.js';
import { ChatOllama } from '@langchain/community/chat_models/ollama';


dotenv.config();

// const llm = new ChatOpenAI({
//     model: "gpt-3.5-turbo-0125",
//     temperature: 0
// });
// const llm = new GLM4ChatModel({
//     temperature: 0,
//     baseURL: "http://192.168.2.18:9091/v1/", // baseURL should look like: http://localhost:8000/v1/
//   });
const llm = new ChatOllama({
  baseUrl: "http://192.168.2.18:9090", 
  model: "mistral:latest",
  temperature: 0,
});
const llmWithTools = llm.bindTools([weatherTool]);

const main = async () => {
    const res = await llmWithTools.invoke('What is the weather in Beirut?');
  
    // Check if there are any tool calls in the response
    if (res.tool_calls && res.tool_calls.length > 0) {
      for (const toolCall of res.tool_calls) {
        if (toolCall.name === 'Weather') {
          console.log(`Tool Call: ${JSON.stringify(toolCall.args)}`);
          const weatherResponse = await weatherTool.func(toolCall.args);
          console.log(`Weather Response: ${weatherResponse}`);
        }
      }
    } else {
      console.log('No tool calls made by the LLM.');
    }
  };
  
  main();