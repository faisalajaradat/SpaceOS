import * as chatModelInitializer from './chatModelInitializer.js';
import * as chatmodels from "./switchingLogic";
import * as dotenv from 'dotenv';

//init env variable
dotenv.config();
console.log(process.env.PREFER_REMOTE);



async function handleChatModel() {
  const preferRemote = process.env.PREFER_REMOTE === 'true';  // bool logic
  console.log(preferRemote);
  let chatResponse = undefined;
  let chatModel = undefined;
  while (true) {
    try {
      if (preferRemote) {
        chatModel = await chatModelInitializer.initializeChatModel("chatgpt");
      } else {
        chatModel = await chatModelInitializer.initializeChatModel("local");
      }
      chatResponse = await chatModelInitializer.makeCall(chatModel);
    } catch (err) {
      console.log(`Error invoking ${preferRemote ? 'remote' : 'local'} chat model: ${err}`);
    }

    if (chatResponse === null){
      break;
    }
  }
}

handleChatModel();





