import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { GLM4ChatModel } from '../Types/GLM4.js';
import weatherTool from '../Tools&Functions/weatherTool.js';

const messages = [
    new SystemMessage("Translate the following from English into Italian"),
    new HumanMessage("hi!"),
  ];
  
// Initialize the model
const model = new GLM4ChatModel({
  temperature: 0.9,
  topP: 0.8,
  maxTokens: 25,
  baseURL: "http://192.168.2.18:9091/v1/", // baseURL should look like: http://localhost:8000/v1/
});

// Sample Call using the above messages
async function exampleCall() {
  try {
    const response = await model.invoke(messages);
    console.log(response);
  } catch (error) {
    if (error instanceof Error) {
      console.error("Error in exampleCall:", error.message);
    } else {
      console.error("Unexpected error in exampleCall:", error);
    }
  }
}

// streaming not supported by the model API server at the moment
async function exampleStream() {
    try {
      const stream = await model.stream(messages);
      for await (const responseChunk of stream) {
        console.log(responseChunk);
      }
    } catch (error) {
      if (error instanceof Error) {
        console.error("Error in exampleCall:", error.message);
      } else {
        console.error("Unexpected error in exampleCall:", error);
      }
    }
}


exampleCall();


//Function/tool calling example (weather in certain city )


const llmWithTools = model.bindTools([weatherTool]);

const toolCall = async (city:string) => {
  const res = await llmWithTools.invoke(`What is the weather in ${city}?`);

  if (res.tool_calls && res.tool_calls.length > 0) {
    for (const toolCall of res.tool_calls) {
      if (toolCall.name === 'Weather') {
        console.log(`Tool Call: ${JSON.stringify(toolCall.args)}`);
        const weatherResponse = await weatherTool.func({ ...toolCall.args, city });
        console.log(`Weather Response: ${weatherResponse}`);
      }
    }
  } else {
    console.log('No tool calls made by the LLM.');
  }
};

// Usage example
const cityName = 'Moncton';
toolCall(cityName);
