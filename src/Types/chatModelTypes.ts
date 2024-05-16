import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';


//Current supported types - Local is a running Ollama instance atm 
export type ChatModelType = "chatgpt" | "groq" | "local";


//ChatModel after it has been intialized 
export type initializedChatModel = ChatOpenAI | ChatGroq | ChatOllama
