import { Entity, Schema, SchemaDefinition } from "redis-om";

export abstract class SpatialTypeEntity implements Entity {
  [index: string]: string | boolean | null | undefined;
  locality: string;

  constructor(locality: string) {
    this.locality = locality;
  }
}

const PATH_SCHEMA_DEF: SchemaDefinition = {
  locality: { type: "string" },
};

export const PATH_SCHEMA: Schema = new Schema("Path", PATH_SCHEMA_DEF, {
  dataStructure: "JSON",
});

export abstract class SpatialObject extends SpatialTypeEntity {
  isControlled: boolean;

  constructor(locality: string, isControlled: boolean) {
    super(locality);
    this.isControlled = isControlled;
  }
}

export abstract class Space extends SpatialObject {}

export abstract class SpatialEntity extends SpatialObject {}

const SPACE_SCHEMA_DEF: SchemaDefinition = {
  ...PATH_SCHEMA_DEF,
  isControlled: { type: "boolean" },
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
  ...SPACE_SCHEMA_DEF,
  motion: { type: "string" },
};

export const ENTITY_SCHEMA: Schema = new Schema("Entity", ENTITY_SCHEMA_DEF, {
  dataStructure: "JSON",
});

export class OpenSpace extends Space {}

export class EnclosedSpace extends Space {}

export class StaticEntity extends SpatialEntity {}

export class AnimateEntity extends DynamicEntity {}

export class SmartEntity extends DynamicEntity {}

export class Path extends SpatialTypeEntity {
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
