import { ChatOpenAI } from "@langchain/openai";
import { BaseMessageLike } from "@langchain/core/messages";

interface ChatModels{

}

//measures the latency of the function (includes network latency atm)
export async function measureLatency(model: ChatOpenAI, inputText: string) {
    const startTime = Date.now();  
    await model.invoke(inputText); 
    const endTime = Date.now();  
    const latency = endTime - startTime;  
    return latency;
}
export async function measureCost(model: ChatOpenAI, inputText:string, costPerToken:number){
    let TokenAmount = tokenAmount(inputText);

}
function tokenAmount(inputText:string): number{
    let tokens = inputText.split(" "); //later we can use another method to tokenize 
    return tokens.length;
    
}
export async function measureThroughput(model: ChatOpenAI, inputText:string, durationSeconds = 10){
    const endTime = Date.now() + durationSeconds * 1000;
    let count = 0;
    while (Date.now() < endTime) {
        await model.invoke(inputText);
        count++;
    }
    return count;

}

console.log(tokenAmount("Hello my name is Faisal"));
