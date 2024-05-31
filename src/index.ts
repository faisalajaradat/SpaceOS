import { handleChatModel } from './switchingLogic.js';
import express from 'express';
import expressWs from 'express-ws';
const { app, getWss, applyTo } = expressWs(express());
const router = express.Router() as expressWs.Router;

router.ws('/echo', (ws, req) => {
    ws.on('message', async (msg: string) => {
        for await (const chunk of await handleChatModel(msg)) {
            ws.send(chunk);
        }
    });
});


handleChatModel();

// const app = express();
const PORT = 7000;
app.use('/ws',router);
app.use(express.json()); //parse the json
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});


app.post('/chat', async (req, res) => { //chat API endpoint for use with front-end
    const userInput = req.body.userInput;

    try {
        const response = await handleChatModel(userInput);
        res.json({ response });
    } catch (error) {
        console.error('Error handling chat model:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
}); 