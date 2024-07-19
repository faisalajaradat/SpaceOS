import { JSONLoader } from "langchain/document_loaders/fs/json";


export default async function LoadJson(PATH: string): Promise<any>;
export default async function LoadJson(PATH: string, keys: string[]): Promise<any>;


export default async function LoadJson(PATH: string, keys?: string[]): Promise<any> {
    if (!keys) {
        const loader = new JSONLoader(PATH);
        const docs = await loader.load();
        return docs;
    }

    const loader = new JSONLoader(PATH, keys);
    const docs = await loader.load();

    return docs;
}








