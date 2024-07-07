import { Entity, EntityDataValue, Schema, SchemaDefinition } from "redis-om";

export type EngineEntity = SpatialTypeEntity | SpacePathGraph;

export abstract class SpatialTypeEntity implements Entity {
  [index: string]: EntityDataValue;
  _type: string;
  locality: string;

  protected constructor(locality: string) {
    this.locality = locality;
  }
}

const PATH_SCHEMA_DEF: SchemaDefinition = {
  _type: { type: "string" },
  locality: { type: "string" },
  name: { type: "string" },
  segment: { type: "number" },
  target: { type: "string" },
  reachable: { type: "string[]" },
};

export const PATH_SCHEMA: Schema = new Schema("Path", PATH_SCHEMA_DEF, {
  dataStructure: "JSON",
});

export abstract class SpatialObject extends SpatialTypeEntity {
  isControlled: boolean;
  name: string;

  constructor(locality: string, isControlled: boolean) {
    super(locality);
    this.isControlled = isControlled;
  }
}

export abstract class Space extends SpatialObject {
  locationJSON: string;
  dimension: number;
  innerSpace: string;
  entities: string[];
  protected constructor(
    locality: string,
    isControlled: boolean,
    locationJSON: string,
  ) {
    super(locality, isControlled);
    this.locationJSON = locationJSON;
    this.entities = new Array<string>();
  }
}

export abstract class SpatialEntity extends SpatialObject {}

const SPACE_SCHEMA_DEF: SchemaDefinition = {
  _type: { type: "string" },
  locality: { type: "string" },
  isControlled: { type: "boolean" },
  name: { type: "string" },
  locationJSON: { type: "string" },
  dimension: { type: "string" },
  innerSpace: { type: "string" },
  entities: { type: "string[]" },
  controlSignal: { type: "boolean" },
};

export const SPACE_SCHEMA: Schema = new Schema("Space", SPACE_SCHEMA_DEF, {
  dataStructure: "JSON",
});

export abstract class DynamicEntity extends SpatialEntity {
  motion: string;

  protected constructor(
    locality: string,
    isControlled: boolean,
    motion: string,
  ) {
    super(locality, isControlled);
    this.motion = motion;
  }
}

const ENTITY_SCHEMA_DEF: SchemaDefinition = {
  _type: { type: "string" },
  locality: { type: "string" },
  isControlled: { type: "boolean" },
  name: { type: "string" },
  motion: { type: "string" },
};

export const ENTITY_SCHEMA: Schema = new Schema("Entity", ENTITY_SCHEMA_DEF, {
  dataStructure: "JSON",
});

export class SpacePathGraph implements Entity {
  [index: string]: EntityDataValue;
  structJSON: string;
  stateJSON: string;
  hazardJSON: string;
  final: boolean;

  constructor(structJSON: string) {
    this.structJSON = structJSON;
    this.final = false;
  }
}

const SPG_SCHEMA_DEF: SchemaDefinition = {
  structJSON: { type: "string" },
  stateJSON: { type: "string" },
  hazardJSON: { type: "string" },
  final: { type: "boolean" },
};

export const SPG_SCHEMA: Schema = new Schema("SpacePathGraph", SPG_SCHEMA_DEF, {
  dataStructure: "JSON",
});

export class OpenSpace extends Space {
  constructor(locality: string, isControlled: boolean, locationJSON: string) {
    super(locality, isControlled, locationJSON);
    this._type = "OpenSpace";
  }
}

export class EnclosedSpace extends Space {
  constructor(locality: string, isControlled: boolean, locationJSON: string) {
    super(locality, isControlled, locationJSON);
    this._type = "EnclosedSpace";
  }
}

export interface ControlSpace {
  controlSignal: boolean;
}

export class MergeSpace extends Space implements ControlSpace {
  controlSignal: boolean;

  constructor(locality: string, locationJSON: string) {
    super(locality, true, locationJSON);
    this._type = "MergeSpace";
  }
}

export class SelectionSpace extends Space implements ControlSpace {
  controlSignal: boolean;

  constructor(locality: string, locationJSON: string) {
    super(locality, true, locationJSON);
    this._type = "SelectionSpace";
  }
}

export class StaticEntity extends SpatialEntity {
  constructor(locality: string, isControlled: boolean) {
    super(locality, isControlled);
    this._type = "StaticEntity";
  }
}

export class AnimateEntity extends DynamicEntity {
  constructor(locality: string, isControlled: boolean, motion: string) {
    super(locality, isControlled, motion);
    this._type = "AnimateEntity";
  }
}

export class SmartEntity extends DynamicEntity {
  constructor(locality: string, isControlled: boolean, motion: string) {
    super(locality, isControlled, motion);
    this._type = "SmartEntity";
  }
}

export class Path extends SpatialTypeEntity {
  name: string;
  segment: number;
  target: string;
  reachable: string[];

  constructor(locality: string, segment: number = 0) {
    super(locality);
    this.segment = segment;
    this.reachable = new Array<string>();
    this._type = "Path";
  }
}

export class AirPath extends Path {
  constructor(segment: number = 0) {
    super("physical", segment);
    this._type = "AirPath";
  }
}

export class LandPath extends Path {
  constructor(segment: number = 0) {
    super("physical", segment);
    this._type = "LandPath";
  }
}
