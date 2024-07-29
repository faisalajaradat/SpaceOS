import { ChatGLM4 } from '../src/Types/GLM4.js';
import { createTrailsFromFile as RDPtrail } from "../src/trail-generation/RDP-trail.js";
import { createTrailsFromFile as VWtrail } from "../src/trail-generation/VW-trail.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import 'dotenv/config';


// const llm = new ChatGLM4({baseURL: "http://192.168.2.18:9091/v1/",maxTokens:250});
const llm  = new ChatOpenAI();


let VWtrails = JSON.stringify(VWtrail("./LLM/src/formatted_data.json", 1));
console.log(VWtrails);


let RDPtrails = JSON.stringify(RDPtrail("./LLM/src/formatted_data.json",1));
console.log(RDPtrails);

let messages = [
    new HumanMessage(RDPtrails),
    new SystemMessage("use the JSON to answer the users question"),
    new HumanMessage("tell me about what you can gather from the JSON data provided")

]
console.log(messages);

let chunks = await llm.invoke(messages);

console.log(chunks);
