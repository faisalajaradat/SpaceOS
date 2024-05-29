import * as dotenv from 'dotenv';


dotenv.config();
const preferRemote = process.env.PREFER_REMOTE === 'true';  // bool logic


export function fetchConfig(){
    return preferRemote;
}