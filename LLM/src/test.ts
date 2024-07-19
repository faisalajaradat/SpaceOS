import { GLM4ChatModel } from "./Types/GLM4.js";
import LoadJson from "./JSONLoader.js";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";


const llm = new GLM4ChatModel({baseURL: "http://192.168.2.18:9091/v1/",maxTokens:250});


let doc = await LoadJson("./LLM/src/formatted_data.json",["/x-coord","/y-coord","/id"]);
doc = JSON.stringify(doc);
console.log(doc);




let messages = [
    new HumanMessage(doc),
    new SystemMessage("use the JSON to answer the users question"),
    new HumanMessage("tell me about what you can gather from the JSON data provided")

]
let chunks = llm.invoke(messages,
    );
