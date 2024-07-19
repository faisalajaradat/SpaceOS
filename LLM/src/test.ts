import { GLM4ChatModel } from "./Types/GLM4.js";
import LoadJson from "./JSONLoader.js";
import { HumanMessage, SystemMessage } from "langchain/schema";


const llm = new GLM4ChatModel({baseURL: "http://192.168.2.18:9091/v1/"});


let doc = await LoadJson("./LLM/src/formatted_data.json");

console.log(doc);





let messages = [
    new HumanMessage(doc),
    new SystemMessage("the JSON data represents information from realworld objects"),
    new HumanMessage("tell me about what you can gather from the JSON data provided")
]
let chunks = llm.stream(messages);
for await (const chunk of await chunks){
    console.log(chunk.content);

}