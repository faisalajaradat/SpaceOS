import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AUDIOFILEPATH= path.join(__dirname, '../../TestingData');

export class CSVHandler {
    private data: string[][];
    private headers: string[];

    constructor(data: string[][] = [], headers: string[] = []) {
        this.data = data;
        this.headers = ["Date","Model_Name","Input","Output","Latency"];
    }

    // Generate CSV content from existing data
    public generateCSV(): string {
        const csvContent: string[] = [];
        if (this.headers.length > 0) {
            csvContent.push(this.headers.join(','));
        }
        this.data.forEach(row => {
            const rowItems = row.map(item => {
                // Ensure item is a string
                const strItem = String(item);
                // Escape double quotes by replacing them
                return `"${strItem.replace(/"/g, '""')}"`;
            });
            csvContent.push(rowItems.join(','));
        });
        return csvContent.join('\n');
    }

    // Load CSV content from a file
    public loadCSV(filePath: string): void {
        const csvString = fs.readFileSync(filePath, 'utf8');
        this.loadFromCSVString(csvString);
    }

    // Assume common CSV format parsing
    public loadFromCSVString(csvString: string): void {
        const lines = csvString.split('\n').map(line => line.trim());
        this.headers = lines[0].split(',').map(header => header.replace(/(^"|"$)/g, ''));
        this.data = lines.slice(1).map(line => 
            line.split(',').map(item => item.replace(/(^"|"$)/g, ''))
        );
    }

    // Update a cell in the CSV
    public updateCell(rowIndex: number, colIndex: number, value: string): void {
        if (rowIndex < 0 || rowIndex >= this.data.length) {
            throw new Error('Row index out of range.');
        }
        if (colIndex < 0 || colIndex >= this.headers.length) {
            throw new Error('Column index out of range.');
        }
        this.data[rowIndex][colIndex] = value;
    }

    // Add new data row
    public addRow(newRow: string[]): void {
        if (newRow.length !== this.headers.length) {
            throw new Error('New row must have the same number of items as the headers.');
        }
        this.data.push(newRow);
    }

    // Save the CSV to a file
    
    public saveToFile(): void {
        if(this.data.length > 0 ){
            const csvContent = this.generateCSV();
            const filename  = new Date()+ 'LLM TEST';
            fs.writeFileSync(path.resolve(AUDIOFILEPATH, filename), csvContent, 'utf8');
            console.log('File saved to:', path.resolve(AUDIOFILEPATH, filename));
        }else{
            console.log("tried to save file with no data");
        }
        
    }
}
