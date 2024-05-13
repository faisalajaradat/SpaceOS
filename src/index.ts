import * as remoteChatModel from './RemoteLLM';
import * as localChatModel from './LocalLLM';
import * as chatmodels from "./chatmodels";
import * as dotenv from 'dotenv';

//init env variable
dotenv.config();
console.log(process.env.PREFER_REMOTE);



async function handleChatModel() {
  const preferRemote = process.env.PREFER_REMOTE === 'true';  // bool logic
  console.log(preferRemote);
  let chatResponse = undefined;
  while (true) {
    try {
      if (preferRemote) {
        chatResponse = await remoteChatModel.makeCall();
      } else {
        chatResponse = await localChatModel.makeCall();
      }
    } catch (err) {
      console.log(`Error invoking ${preferRemote ? 'remote' : 'local'} chat model: ${err}`);
    }

    if (chatResponse === null){
      break;
    }
  }
}

handleChatModel();





