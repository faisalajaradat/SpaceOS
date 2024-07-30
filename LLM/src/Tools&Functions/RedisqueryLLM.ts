import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';
import { ChatGLM4 } from '../Types/GLM4.js';
import getJsonDataTool from './Redis/getJsonDataTool.js';
import getAllJsonDataTool from './Redis/getAllJsonDataTool.js';
import { createToolCallingAgent, AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { createTrailsFromFile as RDPtrail } from '../trail-generation/RDP-trail.js';

const filePath = './LLM/src/trail-generation/formatted_data.json'; 


const epsilon = 1; //threshold for simplification level according to RDP algo --no effect on these straight lines
const RDPsimplifiedTrails = JSON.stringify(RDPtrail(filePath, epsilon));



const tools = [getAllJsonDataTool, getJsonDataTool];

const prompt = ChatPromptTemplate.fromMessages([
  ["system", "Given the information from the trails and objects in the database, find the corresponding entities"],
  ["human", "{input}"],
  ["human", "here is a following list of trails: {trails}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const llm = new ChatOpenAI({
    model: "gpt-4o",
    temperature: 0
});
// const llm = new ChatGLM4({
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
    input: 'find the Space Path Graph in the database by searching all JSON data, and tell which entities correspond to which objects',
    trails: RDPsimplifiedTrails ,
    // tools
  });
  // console.log(agentExecutor)
  console.log(res);
  console.log("all done");

  };
  
  main();

  //chain of thought