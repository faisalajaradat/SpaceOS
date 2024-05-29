import { handleChatModel } from './switchingLogic.js';
import express from 'express';


// handleChatModel();

const app = express();
const PORT = 7000;

app.use(express.json()); // Middleware for parsing JSON bodies
app.use(express.static('public'));
app.use('/dist', express.static('dist')); // Serves files from the 'dist' directory
app.use('/node_modules', express.static('node_modules')); // Serves files from the 'node_modules' directory

app.get('/', (req, res) => {
    res.sendFile('index.html', { root: __dirname });
});


app.post('/chat', async (req, res) => {
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