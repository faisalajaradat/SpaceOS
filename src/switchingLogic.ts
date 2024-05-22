
import * as chatModelInitializer from './chatModelInitializer.js';
import { initializedChatModel, isChatModelInstance, ChatModelType } from "./Types/chatModelTypes.js";
import * as dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
//switching logic will go here 


dotenv.config();
const preferRemote = process.env.PREFER_REMOTE === 'true';  // bool logic

const chatModels: initializedChatModel[] = [];
const modelFailures: {[model: string]: number} = {};
//const initializedModels: { [key: string]: initializedChatModel } = {};
//const failedModels: Set<string> = new Set();






export async function handleChatModel() {

    console.log(preferRemote);
    let chatResponse = undefined;
    let chatModel: initializedChatModel | undefined = undefined;
    


    while (true) {


      try {

        
        chatModel = await getModelWithLeastFailures(
            [ChatOpenAI, ChatGroq, ChatOllama],  // All model classes
            [ChatModelType.ChatGPT, ChatModelType.Groq, ChatModelType.Local],  // Corresponding types
            preferRemote
        );
        

        if (chatModel) {
            if(!chatModels.some(x => x.constructor === chatModel!.constructor )){
                chatModels.push(chatModel);
            }
            
            await chatModelInitializer.makeCall(chatModel);
            modelFailures[chatModel.constructor.name] = 0;
            console.log(modelFailures);
            
        } else {
            console.error("Failed to initialize or retrieve a chat model");
        }
      
    
    } catch (err) {
        console.log(`Error invoking ${preferRemote ? 'remote' : 'local'} chat model: ${err}`);
        if (chatModel && chatModel.constructor) {
            const modelName = chatModel.constructor.name;
            modelFailures[modelName] = (modelFailures[modelName] || 0) + 1;
        }
        console.log(modelFailures);
        
      }
      console.log(chatModels.map(model => `${model.constructor.name} - Failures: ${modelFailures[model.constructor.name] || 0}`));
      
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


  async function getModelWithLeastFailures(allModelClasses: any[], allModelTypes: any[], preferRemote: boolean): Promise<initializedChatModel | undefined> {
    let selectedModel = undefined;
    let leastFailures = Number.MAX_SAFE_INTEGER;
    let preferredModel = undefined;
    let initializationType = null; // Keep track of which model type should be initialized

    // Check all models for the one with the least failures
    for (let i = 0; i < allModelClasses.length; i++) {
        const modelClass = allModelClasses[i];
        const modelType = allModelTypes[i];
        const existingModel = chatModels.find(x => x instanceof modelClass);

        const failures = existingModel ? modelFailures[existingModel.constructor.name] || 0 : 0;
    
        

        // Identify model with the least failures
        if (failures < leastFailures) {
            leastFailures = failures;
            selectedModel = existingModel;
            preferredModel = undefined;  // Reset the preferred model since a better option has been found
            initializationType = undefined; // Reset initialization option since a better model was found
        }

        // Check if this model should be the preferred model based on `preferRemote`
        if (failures === leastFailures) {
            const isRemoteModel = (modelType === ChatModelType.ChatGPT || modelType === ChatModelType.Groq);
            if ((preferRemote && isRemoteModel) || (!preferRemote && !isRemoteModel)) {
                preferredModel = existingModel;
            }
            if (!existingModel) {
                // Mark this type for potential initialization if no better model is found
                initializationType = modelType;
            }
        }
    }

    // If no suitable model was found or selected, initialize the appropriate type
    if (!selectedModel && initializationType) {
        selectedModel = await chatModelInitializer.initializeChatModel(initializationType);
        modelFailures[selectedModel.constructor.name] = 0; // Initialize the failure count for new models
    }

    // Return the preferred model if set, else return the selected model
    return preferredModel || selectedModel;
}

