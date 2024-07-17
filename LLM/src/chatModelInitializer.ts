import {RunnableConfig, RunnableWithMessageHistory} from '@langchain/core/runnables';

//Chat Models
import { ChatOpenAI } from "@langchain/openai";
import { ChatGroq } from "@langchain/groq";
import { ChatOllama } from "@langchain/community/chat_models/ollama";
import { ChatModelType, initializedChatModel } from './Types/chatModelTypes.js';
//prompt management 
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { InMemoryChatMessageHistory } from "@langchain/core/chat_history";
import { traceable } from "langsmith/traceable";

//Env Variables
import * as dotenv from 'dotenv';
import getUserInput from './getUserInput.js';


dotenv.config();

export let systemPrompt:string;

const spaceOSInformation = `respond to the user as you would in a conversation, keep it short sweet and concise. Use the following for context if relevant to the users questions, you can ask the user specifying questions, infact it is encouraged: 
SpaceBase functions similarly to a file system in traditional operating systems but is specifically designed for spatial management. It operates across all nodes of Space OS and is responsible for creating a detailed mathematical representation of physical spaces. This allows computational objects and data to be linked directly to these spatial representations.

Key functionalities of SpaceBase include:

Information Streaming: SpaceBase provides real-time data about specific segments of the mathematical space, crucial for applications like real-time visualizers that need to display operations dynamically within the physical space.
Streaming Updates: It can receive and process live data from external sources, such as camera feeds, to continuously update the spatial representations based on the recognition of objects and their movements.
Object Interaction Service (OIS): This service allows nodes within Space OS to report and update their movements and interactions, enhancing the system's real-time responsiveness and interaction capabilities.
Moreover, SpaceBase supports distributed spatial computing with a sophisticated load/store model, enabling applications to interact seamlessly based on both spatial and memory contexts. It features a comprehensive mapping function that translates real-world coordinates into the system's coordinates, accommodating various coordinate systems used by different applications.

Additional capabilities include:

Distributed Visualization Protocols: These protocols facilitate the capture and real-time reporting of node movements and interactions within specific areas, enhancing the capabilities of distributed spatial applications.
Node Interaction Predictor (NIP): Utilizes historical spatial data to predict likely interactions between nodes, supporting advanced planning and interaction within autonomous systems.
SpaceBase is built to ensure high reliability and continuous operation, with robust fault tolerance and data replication strategies to manage complex, dynamic environments effectively.`; 




const messageHistories: Record<string, InMemoryChatMessageHistory> = {};


export function initializeChatModel(type:ChatModelType, model?:string, temperature?: number, topP?: number):initializedChatModel { //depending on enum, inits each type.
    let chatModel;
    temperature = Number(temperature);
    topP = Number(topP);
    switch (type.toLowerCase()) {
      case "chatgpt":
        chatModel = new ChatOpenAI({
          model: model || "gpt-3.5-turbo-0125",
          temperature: temperature || 0.5,
          topP: topP || 0.5
        });
        console.log("Initializing ChatGPT model");
        break;
      case "groq":
        chatModel = new ChatGroq({
          model: model || "mixtral-8x7b-32768",
          apiKey: process.env.GROQ_API_KEY,
          temperature: temperature || 0.5,
        });
        console.log("Initializing Groq model");
        break;
      case "local":
        chatModel = new ChatOllama({
          baseUrl: process.env.OLLAMA_BASE_URL, 
          model: model || process.env.OLLAMA_MODEL,
          temperature: temperature || 0.5,
          topP: topP || 0.5
        });
        console.log("Initializing Local (Ollama) model");
        break;
      default:
        throw new Error("Unsupported model type");
    }
    console.log(`Model initialized: ${type}`);
    return chatModel;
  }

function getSystemPrompt(userInput:string): string{
  if (userInput!.toLowerCase().includes("spacebase") || userInput!.toLowerCase().includes("space base") || userInput!.toLowerCase().includes("space os") || userInput!.toLowerCase().includes("spaceos")) {
    return spaceOSInformation;

  } else return "You are a concise, helpful chatbot";


}


async function createMessageArray(userInput?: string ){ //creates the ChatPromptTemplate
    if (userInput === undefined){
      userInput = await getUserInput();
    }
    
    if (userInput!.toLowerCase() === 'exit') {
      return  { messages: null, userInput: null };
    }
    let messages;
    systemPrompt = getSystemPrompt(userInput);

    messages = ChatPromptTemplate.fromMessages([
      ["system", systemPrompt],  // Include detailed system depending on 
      ["user", userInput!],
      ["placeholder", "{history}"]
      //new MessagesPlaceholder("history"),
    ]);
    return { messages, userInput }
  
  }


async function* makeCallImplementation(chatmodellocation: initializedChatModel, passedInput:string= '',sessionID:string = '1'){ // | initializedChatModel[]
    const chatModellocation = chatmodellocation;
    let messages, userInput;
    if (passedInput === ''){
      ({ messages, userInput } = await createMessageArray());
      
    }else{
      ({ messages, userInput } = await createMessageArray(passedInput));
    }
    
   
    if (messages !== null){
      const response = messages!.pipe(chatModellocation);
      
      
      const withHistory = new RunnableWithMessageHistory({
        runnable: response,
        getMessageHistory: async (sessionId) => {
          if (messageHistories[sessionId] === undefined) {
            messageHistories[sessionId] = new InMemoryChatMessageHistory();
          }
          return messageHistories[sessionId];
        },
        inputMessagesKey: "input",
        // This shows the runnable where to insert the history.
        // We set to "history" here because of our MessagesPlaceholder above.
        historyMessagesKey: "history",
      });
      const config: RunnableConfig = { configurable: { sessionId: sessionID } };

      const output = await withHistory.stream( 
        {input: userInput},
        config
      );

      for await (const chunk of output) {
        yield chunk;
      }
    }
    else return null;
  }
  
export const makeCall  = traceable((makeCallImplementation));