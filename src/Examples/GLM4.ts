import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { GLM4ChatModel } from '../Types/GLM4';

const messages = [
    new SystemMessage("Translate the following from English into Italian"),
    new HumanMessage("hi!"),
  ];
  
  // Initialize the model
  const model = new GLM4ChatModel({
    temperature: 0.9,
    topP: 0.8,
    maxTokens: 25,
    baseURL: "http://localhost:8000/v1/", // baseURL should look like: http://localhost:8000/v1/
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



//todo: test function/tool calling 



//todo: fix streaming