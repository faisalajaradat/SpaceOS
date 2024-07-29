import { createClient } from 'redis';
import 'dotenv/config';

const client = createClient({ url: process.env.REDIS_URL });

client.on('error', (err) => console.log('Redis Client Error', err));

const getAllJsonData = async (): Promise<any> => {
    try {
      await client.connect();
  

      const keys = await client.keys('*');

  
      const allData = {};
  

      for (const key of keys) {
        try {

          const jsonData = await client.json.get(key, { path: '$' });
          if (jsonData !== null) {
            allData[key] = jsonData;
            continue;
          }
        } catch (jsonError) {
            //regular get if errors out
        }
  
        try {
          const data = await client.get(key);
          allData[key] = data;
        } catch (getError) {
          console.error(`Error getting data for key: ${key}`, getError);
        }
      }
  
      return allData;
    } catch (error) {
      console.error('Error getting all data:', error);
    } finally {
      await client.disconnect();
    }
  };

export default getAllJsonData;
