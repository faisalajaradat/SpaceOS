import { Entity, SchemaDefinition } from "redis-om";

export abstract class SpatialType implements Entity {
  [index: string]: string | boolean;
  locality: string;

  constructor(locality: string) {
    this.locality = locality;
  }
}

export const spatialTypeSchemaDef: SchemaDefinition = {
  locality: { type: "string" },
};

export abstract class SpatialObject extends SpatialType {
  isControlled: boolean;

  constructor(locality: string, isControlled: boolean) {
    super(locality);
    this.isControlled = isControlled;
  }
}

export const spatialObjectSchemaDef: SchemaDefinition = {
  ...spatialTypeSchemaDef,
  isControlled: { type: "boolean" },
};

export abstract class DynamicEntity extends SpatialObject {
  motion: string;

  constructor(locality: string, isControlled: boolean, motion: string) {
    super(locality, isControlled);
    this.motion = motion;
  }
}

export const dynamicEntitySchemaDef: SchemaDefinition = {
  ...spatialObjectSchemaDef,
  motion: { type: "string" },
};

export class OpenSpace extends SpatialObject {}

export class EnclosedSpace extends SpatialObject {}

export class StaticEntity extends SpatialObject {}

export class AnimateEntity extends DynamicEntity {}

export class SmartEntity extends DynamicEntity {}

export class Path extends SpatialType {
  constructor(locality: string) {
    super(locality);
  }
}

export class AirPath extends Path {
  constructor() {
    super("physical");
  }
}

export class LandPath extends Path {
  constructor() {
    super("physical");
  }
}
