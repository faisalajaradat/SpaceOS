import { createTrailsFromFile as RDPtrail } from "../src/trail-generation/RDP-trail.js";
import { createTrailsFromFile as VWtrail } from "../src/trail-generation/VW-trail.js";

const filePath = './LLM/src/trail-generation/formatted_data.json'; 


const epsilon = 1; //threshold for simplification level according to RDP algo --no effect on these straight lines
const RDPsimplifiedTrails = RDPtrail(filePath, epsilon);

const threshold = 0.0001; //threshold for simplification level according to VW algo --no effect on these straight lines
const VWsimplifiedTrails = VWtrail(filePath, threshold);




console.log("RDP Simplified Trails:", RDPsimplifiedTrails);
console.log("VW Simplified Trails:", VWsimplifiedTrails);
