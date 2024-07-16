import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseDirectory = path.join(__dirname, '../../../public/');

export default async function listAudioFiles(directory) {
    let fileList = [];
    try {
        const files = await fs.readdir(directory, { withFileTypes: true });
        for (let file of files) {
            const filePath = path.join(directory, file.name);
            if (file.isDirectory()) {
                const nestedFiles = await listAudioFiles(filePath);
                fileList = fileList.concat(nestedFiles);
            } else if (['.m4a', '.mp3'].includes(path.extname(file.name))) {
                const relativePath = path.relative(baseDirectory, filePath); // Calculate relative path
                fileList.push(relativePath);
            }
        }
    } catch (err) {
        console.error('Error accessing directory:', err);
        return [];
    }
    return fileList;
}

// listAudioFiles(directoryPath).then(files => {
//     console.log('Audio Files:', files);
// });
