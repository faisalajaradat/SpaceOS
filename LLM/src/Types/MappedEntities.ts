
export class MappedEntities {
    private Entities: MappedEntities.MappedEntity[]

    constructor(){
        this.Entities = []
    }

    updateDB(input ){

    }

    addCorrelation(SpaceBaseID, TCShellID ){
        const existingEntityIndex = this.Entities.findIndex(entity => entity.SpaceBaseID === SpaceBaseID);

        if(existingEntityIndex !== -1){
            this.Entities[existingEntityIndex]
        }else{
            const newEntity = new MappedEntities.MappedEntity(SpaceBaseID, TCShellID);
            this.Entities.push(newEntity);
        }
        
    }
    removeCorrelation(SpaceBaseID, ){

    }
    updateCorrelation(){

    }
    getAllCorrelations(){

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