import { createClient } from 'redis';
import * as dotenv from 'dotenv';

dotenv.config();

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

const getJsonData = async (key: string, path: string = '$'): Promise<any> => {
  try {
    await client.connect();
    const data = await client.json.get(key, { path });
    console.log(`JSON data for key: ${key}`, data);
    return data;
  } catch (error) {
    console.error('Error getting JSON data:', error);
  } finally {
    await client.disconnect();
  }
};

export default getJsonData;
