const remoteChatModel = require('./chatmodel');
const localChatModel = require('./LocalLLM');
import * as dotenv from 'dotenv';

//init env variable
dotenv.config();
const preferRemote = process.env.preferRemote;


if(preferRemote){
  try {
    remoteChatModel.makeCall();
  } catch(err){
    console.log("Error invoking remote chatmodel");
    
  }

}else{
  try {
    localChatModel.makeCall();
  } catch(err){
    console.log("Error invoking remote chatmodel");
    
  }
}






