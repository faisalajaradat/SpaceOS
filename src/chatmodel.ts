import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import * as dotenv from 'dotenv';
import readline from 'readline';

// Load environment variables
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

//getuserinput
function getUserInput(){
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise<string>(resolve => {
    rl.question("please input your question: ", (answer) => {
        rl.close();
        resolve(answer);
    });
  });
}


async function createMessagearray(){
  const userInput = await getUserInput();
  const messages = [
    new SystemMessage(spaceOSInformation),
    new HumanMessage(userInput),
  ];
  return messages

}

export async function makeCall(){
    //init 
  const chatModel = new ChatOpenAI({
    model : "gpt-3.5-turbo-0125"
  });

  let messages = await createMessagearray();
  const response = await chatModel.invoke(messages);

}


