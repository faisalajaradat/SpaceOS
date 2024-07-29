import { ChatOpenAI } from '@langchain/openai';
import weatherTool from './WeatherTool-example/weatherTool.js';
import { AgentExecutor, createStructuredChatAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import 'dotenv/config';
import { ChatGLM4 } from '../src/Types/GLM4.js';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import getAllJsonDataTool from '../src/Tools&Functions/Redis/getAllJsonDataTool.js';
import getJsonDataTool from '../src/Tools&Functions/Redis/getJsonDataTool.js';


const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo-0125",
    temperature: 0
});
// const llm = new ChatGLM4({
//     temperature: 0,
//     baseURL: "http://192.168.2.18:9091/v1/", // baseURL should look like: http://localhost:8000/v1/
//   });

const prompt = await pull<ChatPromptTemplate>(
  "hwchase17/structured-chat-agent"
);
console.log(prompt);
const tools = [weatherTool];
// const prompt  = ChatPromptTemplate.fromMessages([
//   ["human", "{input}"],
//   ["placeholder", "{agent_scratchpad}"]
// ]);


const agent = await createStructuredChatAgent({
  llm,
  tools: tools,
  prompt,
});


const agentExecutor = new AgentExecutor({
  agent,
  tools,
});

const main = async () => {




  const result = await agentExecutor.invoke({
    input: "What is the humidity in moncton?"
  });
    console.log(result);


    const result2 = await agentExecutor.invoke({
      input: "What is the temperature in moncton?"
    });
      console.log(result2);
  };
  
  main();