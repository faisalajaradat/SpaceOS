import { handleChatModel } from './switchingLogic.js';
import express from 'express';
import expressWs from 'express-ws';
import listAudioFiles  from './TestSuite/testingscript.js';
import { fileURLToPath } from 'url';
import path from 'path';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

const { app, getWss, applyTo } = expressWs(express());
const router = express.Router() as expressWs.Router;

const AUDIOFILEPATH= path.join(__dirname, '../../public/Voice_Recordings');


router.ws('/echo', (ws, req) => {

    ws.on('message', async (data) => {
        let parsedData = JSON.parse(data.toString());
        let msg = parsedData.message;
        let model = parsedData.model;
        let chatmodel2;
        console.log("session ID is:" + model.sessionID);
        console.log("selected model is: " + model.forceModel, model.location);
        for await (const {chunk, chatmodel} of await handleChatModel(msg, undefined, undefined, model)) {
            
            ws.send(JSON.stringify({chunk, chatmodel,type:'streaming'}));
            chatmodel2 = chatmodel
        }
        ws.send(JSON.stringify({chatmodel:chatmodel2, type:'end'}));
    });
});


handleChatModel();

// const app = express();
const PORT = 7777;
app.use('/ws',router);
app.use(express.json()); //parse the json
app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.get('/audio-files', async (req, res) => {
    try {
        const audioFiles = await listAudioFiles(AUDIOFILEPATH);
        res.json(audioFiles);
    } catch (error) {
        console.error('Failed to retrieve audio files:', error);
        res.status(500).send('Server error occurred while listing files.');
    }
});

app.post('/chat', async (req, res) => { //chat API endpoint for use with front-end (deprecated for websocket)
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