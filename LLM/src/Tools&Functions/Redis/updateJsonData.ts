import { createClient } from 'redis';
import 'dotenv/config';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

const updateJsonData = async (key: string, path: string, value: any): Promise<void> => {
  try {
    await client.connect();
    await client.json.set(key, path, value);
    console.log(`JSON data updated for key: ${key} at path: ${path}`);
  } catch (error) {
    console.error('Error updating JSON data:', error);
  } finally {
    await client.disconnect();
  }
};

export default updateJsonData;
