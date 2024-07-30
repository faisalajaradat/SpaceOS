import { Schema, SchemaDefinition } from "redis-om";




const MAPPED_ENTITIES_SCHEMA_DEF: SchemaDefinition = {
    SpaceBaseID: { type: 'string' },
    TCShellID: { type: 'string' }
  };
  
  export const MAPPED_ENTITIES_SCHEMA: Schema = new Schema("Path", MAPPED_ENTITIES_SCHEMA_DEF, {
    dataStructure: "JSON",
  });

export class MappedEntities {
    private Entities: MappedEntities.MappedEntity[]

    constructor(){
        this.Entities = []
    }


    updateDB(){
        //todo

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
    updateCorrelation(){
    //todo
    }
    getAllCorrelations(): JSON{
    //todo
    return;
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