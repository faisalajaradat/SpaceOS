import { MemoryVectorStore } from "langchain/vectorstores/memory";



/*

If you're after something that can just run inside your Node.js application, in-memory, without any other servers to stand up, then go for HNSWLib, Faiss, LanceDB or CloseVector
If you're looking for something that can run in-memory in browser-like environments, then go for MemoryVectorStore or CloseVector
If you come from Python and you were looking for something similar to FAISS, try HNSWLib or Faiss
If you're looking for an open-source full-featured vector database that you can run locally in a docker container, then go for Chroma
If you're looking for an open-source vector database that offers low-latency, local embedding of documents and supports apps on the edge, then go for Zep
If you're looking for an open-source production-ready vector database that you can run locally (in a docker container) or hosted in the cloud, then go for Weaviate.
If you're using Supabase already then look at the Supabase vector store to use the same Postgres database for your embeddings too
If you're looking for a production-ready vector store you don't have to worry about hosting yourself, then go for Pinecone
If you are already utilizing SingleStore, or if you find yourself in need of a distributed, high-performance database, you might want to consider the SingleStore vector store.
If you are looking for an online MPP (Massively Parallel Processing) data warehousing service, you might want to consider the AnalyticDB vector store.
If you're in search of a cost-effective vector database that allows run vector search with SQL, look no further than MyScale.
If you're in search of a vector database that you can load from both the browser and server side, check out CloseVector. It's a vector database that aims to be cross-platform.
If you're looking for a scalable, open-source columnar database with excellent performance for analytical queries, then consider ClickHouse.

*/

let userInput;


export const vectorStore = await MemoryVectorStore.fromExistingIndex;



// async function getInputSimilarity(userInput){
//     await vectorStore.similaritySearch(userInput);
// }






