import { ChatOpenAI } from '@langchain/openai';
import 'dotenv/config';
import { ChatGLM4 } from '../Types/GLM4.js';
import getJsonDataTool from './Redis/getJsonDataTool.js';
import getAllJsonDataTool from './Redis/getAllJsonDataTool.js';
import { createToolCallingAgent, AgentExecutor, createOpenAIToolsAgent } from "langchain/agents";
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { createTrailsFromFile as RDPtrail } from '../trail-generation/RDP-trail.js';
import { AIMessage,HumanMessage, SystemMessage } from 'langchain/schema';

const filePath = './LLM/src/trail-generation/formatted_data.json'; 


const epsilon = 1; //threshold for simplification level according to RDP algo --no effect on these straight lines
const RDPsimplifiedTrails = JSON.stringify(RDPtrail(filePath, epsilon));



const tools = [getAllJsonDataTool, getJsonDataTool];

const prompt = ChatPromptTemplate.fromMessages([
  new MessagesPlaceholder("chat_history"),
  ["system", "Given the information from the trails and objects in the database, find the corresponding entities"],
  ["human", "{input}"],
  ["human", "here is a following list of trails: {trails}"],
  ["placeholder", "{agent_scratchpad}"],
]);

const llm = new ChatOpenAI({
    model: "gpt-3.5-turbo",
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

let sampleChatHistory = [
  new SystemMessage("Given the information from the trails and objects in the database, find the corresponding entities, make sure to explicitly mention relevant identifiers"),
  new HumanMessage("find the Space Path Graph in the database by searching all JSON data, and map which entities correspond to which objects"),
  new HumanMessage(`here is a trail in the format ID: [{start}, {end}]: '19384756_3': [
    { x: 134.567890, y: 4, timeStamp: 2023-02-15T10:30:00.000Z },
    { x: 1023.456789, y: 6, timeStamp: 2023-02-15T10:55:00.000Z }]`),
  new AIMessage("Given there is only one trail, and trails between SpaceBase and TCShell don’t share the same x and y values and there is only one entity in the database, the trail 58A9Z2Y7PQ1TR3M4L6W8V5N1JX must belong to this entity.")
  //new ToolMessage()
]
const main = async () => {
  const res = await agentExecutor.invoke({
    input: 'find the Space Path Graph in the database by searching all JSON data, and map which entities correspond to which objects',
    trails: RDPsimplifiedTrails ,
    chat_history: sampleChatHistory, 
    tools
  },
  {callbacks: 
    [
    {
      handleAgentAction(action, runId){
       // console.log("\nhandleAgentAction", action, runId);
      }
    }
  ]});
  //console.log(agentExecutor)
  //console.log(res);
  console.log(res.output);

  };
  
  main();

  //chain of thought