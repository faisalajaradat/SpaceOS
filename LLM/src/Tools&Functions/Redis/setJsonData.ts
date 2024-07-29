import { createClient } from 'redis';
import 'dotenv/config';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

interface JsonData {
  [key: string]: any;
}

const setJsonData = async (key: string, data: JsonData): Promise<void> => {
  try {
    await client.connect();
    await client.json.set(key, '$', data);
    console.log(`JSON data set for key: ${key}`);
  } catch (error) {
    console.error('Error setting JSON data:', error);
  } finally {
    await client.disconnect();
  }
};

export default setJsonData;
