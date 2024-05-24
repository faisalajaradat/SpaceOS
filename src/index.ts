
import { handleChatModel } from './switchingLogic.js';
import express from 'express';


//handleChatModel();

const app = express();
const PORT = 7000;

app.use(express.static('public'));

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});