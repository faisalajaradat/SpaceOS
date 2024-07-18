import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

const deleteJsonData = async (key: string, path: string = '$'): Promise<void> => {
  try {
    await client.connect();
    await client.json.del(key, path);
    console.log(`JSON data deleted for key: ${key} at path: ${path}`);
  } catch (error) {
    console.error('Error deleting JSON data:', error);
  } finally {
    await client.disconnect();
  }
};

export default deleteJsonData;
