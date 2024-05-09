const remoteChatModel = require('./chatmodel');
const localChatModel = require('./LocalLLM');
import * as dotenv from 'dotenv';

//init env variable
dotenv.config();



async function handleChatModel() {
  const preferRemote = process.env.PREFER_REMOTE === 'true';  // Ensure boolean logic
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





