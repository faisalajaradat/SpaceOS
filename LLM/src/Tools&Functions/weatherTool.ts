import {DynamicStructuredTool} from '@langchain/core/tools'
import {z} from "zod";
import getWeather from './getWeather.js';


const weatherSchema = z.object({
    location: z.string().describe('The name of the location to get the weather for.'),
  });

const weatherTool = new DynamicStructuredTool({
    name:"Weather",
    description: 'Get the weather for any specified location',
    schema: weatherSchema,
    func: async ({ location }) => {
        const weather = await getWeather(location);
        return `The weather in ${weather.location}: ${weather.temperature}°C, ${weather.description}, Humidity: ${weather.humidity}%, Wind Speed: ${weather.windSpeed} m/s`;
    },

});



export default weatherTool;