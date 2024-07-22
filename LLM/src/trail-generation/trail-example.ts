import { createTrailsFromFile as RDPtrail } from "./RDP-trail.js";
import { createTrailsFromFile as VWtrail } from "./VW-trail.js";

const filePath = './LLM/src/formatted_data.json'; 


const epsilon = 1; //threshold for simplification level according to RDP algo --no effect on these straight lines
const RDPsimplifiedTrails = RDPtrail(filePath, epsilon);

const threshold = 0.0001; //threshold for simplification level according to VW algo --no effect on these straight lines
const VWsimplifiedTrails = VWtrail(filePath, threshold);




console.log("RDP Simplified Trails:", RDPsimplifiedTrails);
console.log("VW Simplified Trails:", VWsimplifiedTrails);
