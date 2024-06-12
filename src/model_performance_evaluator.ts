import { initializedChatModel } from './Types/chatModelTypes.js';



//measures the latency of the function (includes network latency atm)
export async function measureLatency(model: initializedChatModel, inputText: string) {
    const startTime = Date.now();  
    await model.invoke(inputText); 
    const endTime = Date.now();  
    const latency = endTime - startTime;  
    return latency;
}
export async function measureCost(model: initializedChatModel, inputText:string, costPerToken:number):Promise<number>{
    let TokenAmount = tokenAmount(inputText);
    const cost = TokenAmount * costPerToken;
    return cost;
}
function tokenAmount(inputText:string): number{
    let tokens = inputText.split(" "); //later we can use another method to tokenize 
    return tokens.length;
    
}
export async function measureThroughput(model: initializedChatModel, inputText:string, durationSeconds = 10){
    const endTime = Date.now() + durationSeconds * 1000;
    let count = 0;
    while (Date.now() < endTime) {
        await model.invoke(inputText);
        count++;
    }
    return count;

}

export async function test_model_performance(model:initializedChatModel, inputText:string, costPerToken:number):Promise<number>{

    const Throughput = await measureThroughput(model, inputText);
    const Cost = await measureCost(model,inputText,costPerToken);
    const Latency = await measureLatency(model,inputText);
    //weighted avg
    return (Throughput*.15)+ (Cost*.7)+ (Latency*.15);

}

