import 'dotenv/config';


const preferRemote = process.env.PREFER_REMOTE === 'true'; 


export function fetchConfig(){
    return preferRemote;
}