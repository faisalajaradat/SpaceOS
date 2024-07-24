import { ChatOpenAI } from '@langchain/openai';
import * as dotenv from 'dotenv';
import { GLM4ChatModel } from '../../Types/GLM4.js';
import getJsonDataTool from './getJsonDatatool.js';
import getAllJsonDataTool from './getAllJsonDataTool.js';
import { createToolCallingAgent, AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createTrailsFromFile as RDPtrail } from '../../trail-generation/RDP-trail.js';

const filePath = './LLM/src/formatted_data.json'; 


const epsilon = 1; //threshold for simplification level according to RDP algo --no effect on these straight lines
const RDPsimplifiedTrails = JSON.stringify(RDPtrail(filePath, epsilon));


dotenv.config();

const tools = [getAllJsonDataTool, getJsonDataTool];

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "Given the information from the trails and objects in the database, match them"],
  ["human", "{input}"],
  ["human", "here is a following list of trails: {trails}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo-0125",
    temperature: 0
});
// const llm = new GLM4ChatModel({
//     temperature: 0,
//     baseURL: "http://192.168.2.18:9091/v1/", // baseURL should look like: http://localhost:8000/v1/
//   });


const agent = await createOpenAIToolsAgent({llm,tools,prompt})

const agentExecutor = new AgentExecutor({
  agent,
  tools,
  returnIntermediateSteps: true,
});


const main = async () => {
  const res = await agentExecutor.invoke({
    input: 'find the Space Path Graph in the database by searching all JSON data, and tell which trails correspond to which objects',
    trails: RDPsimplifiedTrails ,
  });
  // console.log(agentExecutor)
  console.log(res);



  
    // Check if there are any tool calls in the response
    if (res.tool_calls && res.tool_calls.length > 0) {
      for (const toolCall of res.tool_calls) {
        if (toolCall.name === 'GetAllJsonData') {
          console.log(`Tool Call: ${JSON.stringify(toolCall.args)}`);
          const weatherResponse = await getAllJsonDataTool.func(toolCall.args);
          console.log(`JsonDataTool Response: ${weatherResponse}`);
        }
      }
    } else {
      console.log('No tool calls made by the LLM.');
    }
  };
  
  main();

  //chain of thought