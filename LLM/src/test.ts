import { GLM4ChatModel } from "./Types/GLM4.js";
import LoadJson from "./JSONLoader.js";
import { createTrailsFromFile as RDPtrail } from "./trail-generation/RDP-trail.js";
import { createTrailsFromFile as VWtrail } from "./trail-generation/VW-trail.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";

import * as dotenv from 'dotenv';


dotenv.config();


// const llm = new GLM4ChatModel({baseURL: "http://192.168.2.18:9091/v1/",maxTokens:250});
const llm  = new ChatOpenAI();



// let doc = await LoadJson("./LLM/src/formatted_data.json",["/x-coord","/y-coord","/id"]);
// doc = JSON.stringify(doc);
// console.log(doc);

let RDPtrails = JSON.stringify(RDPtrail("./LLM/src/formatted_data.json",1));
console.log(RDPtrails);




let messages = [
    new HumanMessage(RDPtrails),
    new SystemMessage("use the JSON to answer the users question"),
    new HumanMessage("tell me about what you can gather from the JSON data provided")

]
let chunks = await llm.invoke(messages);

console.log(chunks);
