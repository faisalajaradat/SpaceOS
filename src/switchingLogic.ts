import * as chatModelInitializer from './chatModelInitializer.js';
import { initializedChatModel, isChatModelInstance, ChatModelType } from "./Types/chatModelTypes.js";
import * as dotenv from 'dotenv';
import { ChatOpenAI } from '@langchain/openai';
import { ChatGroq } from '@langchain/groq';
import { ChatOllama } from '@langchain/community/chat_models/ollama';
import { fetchConfig } from './fetchconfig.js';


const preferRemote = fetchConfig();
const MODELCLASSES =  [ChatOpenAI, ChatGroq, ChatOllama]
const MODELCLASSTYPES = [ChatModelType.ChatGPT, ChatModelType.Groq, ChatModelType.Local]

const chatModels: initializedChatModel[] = [];
const modelFailures: {[model: string]: number} = {};

//string, void, unknown

//,main logic for handling which chat Model to use next
export async function* handleChatModel(userInput:string = "", attempts = 0, maxRetries = 3):AsyncGenerator<{chunk:any, chatmodel:any}>  {

    let chatResponse = undefined;
    let chatModel: initializedChatModel | undefined = undefined;
        try {
            chatModel = await getModelWithLeastFailures(
                MODELCLASSES,  // All model classes
                MODELCLASSTYPES,  // Corresponding types
                preferRemote
            );
        

        if (chatModel) {
            if(!chatModels.some(x => x.constructor === chatModel!.constructor )){
                chatModels.push(chatModel);
            }
            for await (const chunk of chatModelInitializer.makeCall(chatModel, userInput)) {
                yield {chunk, "chatmodel":{name: chatModel.constructor.name, failures:modelFailures}};
                process.stdout.write(chunk.lc_kwargs.content);
            }
            //chatResponse = chatModelInitializer.makeCall(chatModel, userInput);
            modelFailures[chatModel.constructor.name] = 0;
            
        } else {
            console.error("Failed to initialize or retrieve a chat model");
            chatResponse = "Error: Model initialization failed.";
        }
        

        } catch (err) {
            console.log(`Error invoking ${preferRemote ? 'remote' : 'local'} chat model: ${err}`);
            if (chatModel && chatModel.constructor) {
                const modelName = chatModel.constructor.name;
                modelFailures[modelName] = (modelFailures[modelName] || 0) + 1;
            }
            yield* handleChatModel(userInput, attempts + 1, maxRetries);
            
        }
        console.log(chatModels.map(model => `${model.constructor.name} - Failures: ${modelFailures[model.constructor.name] || 0}`));
        

}    
    

  /*
  1. Each type of chat Model should only be intialized once
  2. use the variable preferRemote to decide whether to use a local or Remote model
  3. if a Model has failed, store that and try another model (remembering to prefer local/Remote) 
  */


async function getModelWithLeastFailures(allModelClasses: any[], allModelTypes: any[], preferRemote: boolean): Promise<initializedChatModel | undefined> {
    let leastFailures = Number.MAX_SAFE_INTEGER;
    let selectedModel = undefined;
    let modelInitialized; //checks if there is a model of this type already
    let selectedModelInitialized = false;
    let existingModel //the existing Model of certain type

    for (let i = 0; i < allModelClasses.length; i++) {
        //get model name and Object type
        const modelClass = allModelClasses[i];
        const modelType = allModelTypes[i];
        //see if a model of the same type already exists - if not set it to 

        if (chatModels.find(x => x instanceof modelClass)){
            modelInitialized = true;
            existingModel = chatModels.find(x => x instanceof modelClass)
        }else{
            existingModel = modelType;
            modelInitialized = false;
           
        }

        //check to see if the model has failures otherwise we set it to 0
        const failures = existingModel ? modelFailures[existingModel.constructor.name] || 0 : 0;



        if (failures < leastFailures) {
            leastFailures = failures;
            selectedModel = existingModel; 
            
        }
        if(failures == leastFailures){
            const isRemoteModel = (modelType === ChatModelType.ChatGPT || modelType === ChatModelType.Groq);
            if ((preferRemote && isRemoteModel) || (!preferRemote && !isRemoteModel)) {
               selectedModel = existingModel 
            }
        }
        if(modelInitialized && selectedModel ==existingModel){
            selectedModelInitialized = true;
        } if (!modelInitialized && selectedModel == existingModel){
            selectedModelInitialized =false;
        }

        
    }

    if(selectedModelInitialized == false) selectedModel = chatModelInitializer.initializeChatModel(selectedModel);
    return selectedModel;
}