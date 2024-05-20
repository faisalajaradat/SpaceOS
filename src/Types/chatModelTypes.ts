import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';


//Current supported types - Local is a running Ollama instance atm 
export enum ChatModelType {
    ChatGPT = "chatgpt",
    Groq = "groq",
    Local = "local"
}


//ChatModel after it has been intialized 
export type initializedChatModel = ChatOpenAI | ChatGroq | ChatOllama


export function isChatModelInstance(object: any): object is initializedChatModel {
    return object instanceof ChatOpenAI || object instanceof ChatGroq || object instanceof ChatOllama;
}

