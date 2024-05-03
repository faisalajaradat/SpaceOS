import { ChatOpenAI } from "@langchain/openai";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import * as dotenv from 'dotenv';

//just to show import (doesnt need to be set if .env exists)
dotenv.config();


const chatModel = new ChatOpenAI();
const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a world class technical documentation writer."],
    ["user", "{input}"],
  ]);

const chain = prompt.pipe(chatModel);

const test = await chatModel.invoke("wassup");
console.log(test);