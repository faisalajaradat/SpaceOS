
import * as chatModelInitializer from './chatModelInitializer.js';
import { initializedChatModel, isChatModelInstance } from "./Types/chatModelTypes.js";
import * as dotenv from 'dotenv';
import { ChatModelType } from './Types/chatModelTypes';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatOllama } from '@langchain/community/chat_models/ollama.js';
//switching logic will go here 


dotenv.config();


const chatModels: initializedChatModel[] = [];
const initializedModels: { [key: string]: initializedChatModel } = {};
const failedModels: Set<string> = new Set();


export async function handleChatModel() {
    const preferRemote = process.env.PREFER_REMOTE === 'true';  // bool logic
    console.log(preferRemote);
    let chatResponse = undefined;
    let chatModel = undefined;





    while (true) {


      try {

        
        if (preferRemote){
            if(!chatModels.some(x => x instanceof ChatOpenAI)){
                chatModel = chatModelInitializer.initializeChatModel(ChatModelType.ChatGPT);
            }else{
                chatModel = chatModels.find(x => x instanceof ChatOpenAI); 
            }
            
            
            if(!chatModels.some(x => x instanceof ChatGroq)){
                chatModel = chatModelInitializer.initializeChatModel(ChatModelType.Groq);
            }else{
                chatModel = chatModels.find(x => x instanceof ChatGroq);
            }
        }else if (!preferRemote){
            if(!chatModels.some(x => x instanceof ChatOllama)){
                chatModel = chatModelInitializer.initializeChatModel(ChatModelType.Local)
            }else{
                chatModel = chatModels.find(x => x instanceof ChatOllama);
            }
        }

        if (chatModel) {
            chatModels.push(chatModel);
        } else {
            console.error("Failed to initialize or retrieve a chat model");
        }
        console.log(chatModels.map(model => model.constructor.name));
      
    
    } catch (err) {
        console.log(`Error invoking ${preferRemote ? 'remote' : 'local'} chat model: ${err}`);
      }
  
      if (chatResponse === null){
        break;
      }
    }
  }

  /*
  1. Each type of chat Model should only be intialized once
  2. use the variable preferRemote to decide whether to use a local or Remote model
  3. if a Model has failed, store that and try another model (remembering to prefer local/Remote) 
  */