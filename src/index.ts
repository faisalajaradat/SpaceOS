
import * as dotenv from 'dotenv';
import { handleChatModel } from './switchingLogic.js';

//init env variable
dotenv.config();
console.log(process.env.PREFER_REMOTE);


handleChatModel();





