import { ChatOpenAI } from "@langchain/openai";
import { BaseMessageLike } from "@langchain/core/messages";

interface ChatModels{

}

//measures the latency of the function (includes network latency atm)
export async function measureLatency(model: ChatOpenAI, inputText: BaseMessageLike[][]) {
    const startTime = Date.now();  
    await model.generate(inputText); 
    const endTime = Date.now();  
    const latency = endTime - startTime;  
    return latency;
}
export async function measureCost(model, inputText, costPerToken:number){

}
export async function measureThroughput(model, inputText, durationSeconds = 10){
    const endTime = Date.now() + durationSeconds * 1000;
    let count = 0;
    while (Date.now() < endTime) {
        await model.generate(inputText);
        count++;
    }
    return count;

}