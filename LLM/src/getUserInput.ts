import readline from 'readline';

export default function getUserInput(): Promise<string> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    return new Promise<string>(resolve => {
        rl.question("please input your question: ", (answer:string) => {
            rl.close();
            resolve(answer);
        });
    });
}