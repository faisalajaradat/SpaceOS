import { Entity, EntityDataValue, Schema, SchemaDefinition } from "redis-om";

export abstract class SpatialTypeEntity implements Entity {
  [index: string]: EntityDataValue;
  _type: string;
  locality: string;

  constructor(locality: string) {
    this.locality = locality;
  }
}

const PATH_SCHEMA_DEF: SchemaDefinition = {
  _type: { type: "string" },
  locality: { type: "string" },
  direction: { type: "string" },
  name: { type: "string" },
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
  constructor(locality: string, isControlled: boolean, locationJSON: string) {
    super(locality, isControlled);
    this.locationJSON = locationJSON;
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
};

export const SPACE_SCHEMA: Schema = new Schema("Space", SPACE_SCHEMA_DEF, {
  dataStructure: "JSON",
});

export abstract class DynamicEntity extends SpatialEntity {
  motion: string;

  constructor(locality: string, isControlled: boolean, motion: string) {
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

export class SpacePathGraph extends SpatialTypeEntity {
  structJSON: string;
  stateJSON: string;
  hazardJSON: string;

  constructor(locality: string, structJSON: string) {
    super(locality);
    this.structJSON = structJSON;
  }
}

const SPG_SCHEMA_DEF: SchemaDefinition = {
  _type: { type: "string" },
  locality: { type: "string" },
  structJSON: { type: "string" },
  stateJSON: { type: "string" },
  hazardJSON: { type: "string" },
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
  direction: string;
  name: string;
  constructor(locality: string, direction: string) {
    super(locality);
    this.direction = direction;
    this._type = "Path";
  }
}

export class AirPath extends Path {
  constructor(direction: string) {
    super("physical", direction);
    this._type = "AirPath";
  }
}

export class LandPath extends Path {
  constructor(direction) {
    super("physical", direction);
    this._type = "LandPath";
  }
}
