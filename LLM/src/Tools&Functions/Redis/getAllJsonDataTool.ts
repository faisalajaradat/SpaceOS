import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import getAllJsonData from './getAllJsonData.js';

const getAllJsonDataTool = new DynamicStructuredTool({
  name: "GetAllJsonData",
  description: 'Retrieve all JSON data from a Redis database.',
  schema: z.object({}).describe('No parameters are needed for this tool.'),
  func: async () => {
    const data = await getAllJsonData();
    return data ? JSON.stringify(data, null, 2) : 'No data found in the Redis database.';
  },
});

export default getAllJsonDataTool;
