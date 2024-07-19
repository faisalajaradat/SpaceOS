import { ChatOpenAI } from '@langchain/openai';
import * as dotenv from 'dotenv';
import { GLM4ChatModel } from '../../Types/GLM4.js';
import getJsonDataTool from './getJsonDatatool.js';


dotenv.config();

const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo-0125",
    temperature: 0
});
// const llm = new GLM4ChatModel({
//     temperature: 0,
//     baseURL: "http://192.168.2.18:9091/v1/", // baseURL should look like: http://localhost:8000/v1/
//   });

const llmWithTools = llm.bindTools([getJsonDataTool]);

const main = async () => {
    const res = await llmWithTools.invoke('give me information about the object Entity:01J33858ANA2GM45QZY1YD5M27');
    console.log(res);
  
    // Check if there are any tool calls in the response
    if (res.tool_calls && res.tool_calls.length > 0) {
      for (const toolCall of res.tool_calls) {
        if (toolCall.name === 'GetJsonData') {
          console.log(`Tool Call: ${JSON.stringify(toolCall.args)}`);
          const weatherResponse = await getJsonDataTool.func(toolCall.args);
          console.log(`JsonDataTool Response: ${weatherResponse}`);
        }
      }
    } else {
      console.log('No tool calls made by the LLM.');
    }
  };
  
  main();