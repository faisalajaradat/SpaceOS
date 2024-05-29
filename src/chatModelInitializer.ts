import {RunnableConfig, RunnableWithMessageHistory} from '@langchain/core/runnables';

//Chat Models
import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatModelType, initializedChatModel } from './Types/chatModelTypes';
//prompt management 
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';

import { ChatMessageHistory } from '@langchain/community/stores/message/in_memory';
//Env Variables
import * as dotenv from 'dotenv';
import getUserInput from './getUserInput.js';


dotenv.config();

const spaceOSInformation = `SpaceBase functions similarly to a file system in traditional operating systems but is specifically designed for spatial management. It operates across all nodes of Space OS and is responsible for creating a detailed mathematical representation of physical spaces. This allows computational objects and data to be linked directly to these spatial representations.

Key functionalities of SpaceBase include:

Information Streaming: SpaceBase provides real-time data about specific segments of the mathematical space, crucial for applications like real-time visualizers that need to display operations dynamically within the physical space.
Streaming Updates: It can receive and process live data from external sources, such as camera feeds, to continuously update the spatial representations based on the recognition of objects and their movements.
Object Interaction Service (OIS): This service allows nodes within Space OS to report and update their movements and interactions, enhancing the system's real-time responsiveness and interaction capabilities.
Moreover, SpaceBase supports distributed spatial computing with a sophisticated load/store model, enabling applications to interact seamlessly based on both spatial and memory contexts. It features a comprehensive mapping function that translates real-world coordinates into the system's coordinates, accommodating various coordinate systems used by different applications.

Additional capabilities include:

Distributed Visualization Protocols: These protocols facilitate the capture and real-time reporting of node movements and interactions within specific areas, enhancing the capabilities of distributed spatial applications.
Node Interaction Predictor (NIP): Utilizes historical spatial data to predict likely interactions between nodes, supporting advanced planning and interaction within autonomous systems.
SpaceBase is built to ensure high reliability and continuous operation, with robust fault tolerance and data replication strategies to manage complex, dynamic environments effectively.`; 




const messageHistory =  new ChatMessageHistory();


export function initializeChatModel(type:ChatModelType):initializedChatModel { //depending on enum, inits each type.
    let chatModel;
    
    switch (type.toLowerCase()) {
      case "chatgpt":
        chatModel = new ChatOpenAI({
          model: "gpt-3.5-turbo-0125"
        });
        console.log("Initializing ChatGPT model");
        break;
      case "groq":
        chatModel = new ChatGroq({
          apiKey: process.env.GROQ_API_KEY
        });
        console.log("Initializing Groq model");
        break;
      case "local":
        chatModel = new ChatOllama({
          baseUrl: process.env.OLLAMA_BASE_URL, 
          model: process.env.OLLAMA_MODEL
        });
        console.log("Initializing Local (Ollama) model");
        break;
      default:
        throw new Error("Unsupported model type");
    }
    console.log(`Model initialized: ${type}`);
    return chatModel;
  }




async function createMessageArray(userInput?: string ){ //creates the ChatPromptTemplate
    if (userInput === undefined){
      userInput = await getUserInput();
    }
    
    if (userInput!.toLowerCase() === 'exit') {
      return  { messages: null, userInput: null };
    }
    const messages = ChatPromptTemplate.fromMessages([
      ["system", spaceOSInformation],  // System message with predefined information
      ["human", userInput!],            // Human message based on user input
      new MessagesPlaceholder("history"),
    ]);
    return { messages, userInput }
  
  }


export async function makeCall(chatmodel: initializedChatModel, passedInput:string= ''){ // | initializedChatModel[]
    const chatModel = chatmodel;
    let messages, userInput;
    if (passedInput === ''){
      ({ messages, userInput } = await createMessageArray());
      
    }else{
      ({ messages, userInput } = await createMessageArray(passedInput));
    }

   
    if (messages !== null){
      const response = messages!.pipe(chatModel);
      
      
      const withHistory = new RunnableWithMessageHistory({
        runnable: response,
        getMessageHistory: (_sessionId: string) => messageHistory,
        inputMessagesKey: "input",
        // This shows the runnable where to insert the history.
        // We set to "history" here because of our MessagesPlaceholder above.
        historyMessagesKey: "history",
      });
      const config: RunnableConfig = { configurable: { sessionId: "1" } };
  
      const output = await withHistory.invoke(
        {input: userInput},
        config
      );
      
      console.log(output.lc_kwargs.content);
      
      
      return output.lc_kwargs.content;
  
  
      //console.log("output:", output);
      //console.log("chat message history:", messageHistory.getMessages() );
    }
    else return null;
  }
  