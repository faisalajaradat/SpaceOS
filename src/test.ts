import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from 'dotenv';


dotenv.config();


let chatModel = new ChatOpenAI({
    model: "gpt-3.5-turbo-0125"
  });

console.log(chatModel);