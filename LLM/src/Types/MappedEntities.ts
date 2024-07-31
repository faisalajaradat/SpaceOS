import "dotenv/config";
import { createClient } from "redis";
import { Schema, SchemaDefinition, Repository, Entity, EntityId } from "redis-om";


const client = await createClient({ url: process.env.REDIS_URL })
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();


const MAPPED_ENTITIES_SCHEMA_DEF: SchemaDefinition = {
    SpaceBaseID: { type: 'string' },
    TCShellID: { type: 'string' }
  };
  
  export const MAPPED_ENTITIES_SCHEMA: Schema = new Schema("Path", MAPPED_ENTITIES_SCHEMA_DEF, {
    dataStructure: "JSON",
  });

export class MappedEntities {
    private static instance: MappedEntities | null = null;
    private Entities: MappedEntities.MappedEntity[]
    private repository: Repository

    constructor(repository: Repository){
        this.Entities = []
        this.repository = repository
    }

    public static getInstance(repository:Repository): MappedEntities {
        if (!MappedEntities.instance) {
            MappedEntities.instance = new MappedEntities(repository);
        }
        return MappedEntities.instance;
    }

    async updateDB(){
        const repo: Repository = new Repository(MAPPED_ENTITIES_SCHEMA, client);
        await repo.createIndex();
        return(await repo.save(this.Entities)[EntityId])

    }

    addCorrelation(SpaceBaseID:string, TCShellID:string ):void {

        const existingEntityIndex = this.Entities.findIndex(entity => entity.SpaceBaseID === SpaceBaseID);

        if(existingEntityIndex !== -1){
            console.log("issue adding to DB (Entity already assigned value, update the Correlation instead.)");
        }else{
            const newEntity = new MappedEntities.MappedEntity(SpaceBaseID, TCShellID);
            this.Entities.push(newEntity);
        }
        
    }
    removeCorrelation(SpaceBaseID?: string, TCShellID?: string): void {
        const initialLength = this.Entities.length;

        if (!SpaceBaseID && TCShellID) {
            this.Entities = this.Entities.filter(entity => entity.TCShellID !== TCShellID);
            console.log(`Removed correlation(s) with TCShellID: ${TCShellID}`);
        } else if (!TCShellID && SpaceBaseID) {
            this.Entities = this.Entities.filter(entity => entity.SpaceBaseID !== SpaceBaseID);
            console.log(`Removed correlation with SpaceBaseID: ${SpaceBaseID}`);
        } else if (TCShellID && SpaceBaseID) {
            this.Entities = this.Entities.filter(
                entity => !(entity.SpaceBaseID === SpaceBaseID && entity.TCShellID === TCShellID)
            );
            console.log(`Removed correlation with SpaceBaseID: ${SpaceBaseID} and TCShellID: ${TCShellID}`);
        } else {
            // Incorrect usage
            console.log("Error: At least one of SpaceBaseID or TCShellID must be provided");
            return;
        }

        if (this.Entities.length < initialLength) {
            console.log(`${initialLength - this.Entities.length} correlation(s) removed.`);
        } else {
            console.log("No matching correlations found.");
        }
    }


    //update correlations and remove old ones.
    updateCorrelation(updatedSpaceBaseID: string, updatedTCShellID: string): void {
        let entityIndex = this.Entities.findIndex(entity => entity.SpaceBaseID === updatedSpaceBaseID);

        if (entityIndex !== -1) {
            const existingTCShellIndex = this.Entities.findIndex(entity=> entity.TCShellID ==updatedTCShellID)
            if(existingTCShellIndex !== -1 && this.Entities[existingTCShellIndex].SpaceBaseID !== updatedSpaceBaseID){
                this.Entities.splice(existingTCShellIndex, 1);
            }
            this.Entities[entityIndex].TCShellID = updatedTCShellID;
            console.log(`Updated correlation for SpaceBaseID: ${updatedSpaceBaseID} with new TCShellID: ${updatedTCShellID}`);
        } else {
            const existingTCShellIndex = this.Entities.findIndex(entity => entity.TCShellID === updatedTCShellID);
            
            if (existingTCShellIndex !== -1) {

                const oldSpaceBaseID = this.Entities[existingTCShellIndex].SpaceBaseID;
                this.Entities.splice(existingTCShellIndex, 1);
                console.log(`Removed previous correlation: SpaceBaseID ${oldSpaceBaseID} - TCShellID ${updatedTCShellID}`);
            }

            this.Entities.push(new MappedEntities.MappedEntity(updatedSpaceBaseID, updatedTCShellID));
            console.log(`Added new correlation: SpaceBaseID ${updatedSpaceBaseID} - TCShellID ${updatedTCShellID}`);
        }
    }
    getAllCorrelations(): { [key: string]: string } {
        return this.Entities.reduce((acc, entity) => {
            acc[entity.SpaceBaseID] = entity.TCShellID;
            return acc;
        }, {} as { [key: string]: string });
    }

    
}

export namespace MappedEntities{
    export class MappedEntity{
        SpaceBaseID: string;
        TCShellID:string
        constructor(SpaceBaseID, TCShellID){
            this.SpaceBaseID = SpaceBaseID;
            this.TCShellID = TCShellID;
        }
    }
    
}