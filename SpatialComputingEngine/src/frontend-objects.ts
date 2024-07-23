import { Entity, EntityDataValue, Schema, SchemaDefinition } from "redis-om";

import { fetchData } from "./spatial-computing-engine.js";

export type EngineEntity =
  | SpatialTypeEntity
  | SpacePathGraph
  | RequestMessage
  | SpacePathGraphFactory;

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
  isFull: { type: "boolean" },
  factory: { type: "string" },
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
    name?: string,
    dimension?: number,
    innerSpace?: string,
  ) {
    super(locality, isControlled);
    this.locationJSON = locationJSON;
    this.entities = new Array<string>();
    this.name = name;
    this.dimension = dimension;
    this.innerSpace = innerSpace;
  }
}

export class SpaceLiteral {
  _type: string;
  locality: string;
  isControlled: boolean;
  name: string;
  locationJSON: string;
  dimension: number;
  innerSpace: SpaceLiteral;
  controlSignal: boolean;
  selectionTruePath: PathLiteral;
  selectionFalsePath: PathLiteral;
  mergeTrueSpace: SpaceLiteral;
  mergeFalseSpace: SpaceLiteral;
  isPrimaryOutput: boolean;

  constructor(
    _type: string,
    locality: string,
    isControlled: boolean,
    name: string,
    locationJSON: string,
    dimension: number,
    innerSpace: SpaceLiteral,
  ) {
    this._type = _type;
    this.locality = locality;
    this.isControlled = isControlled;
    this.name = name;
    this.locationJSON = locationJSON;
    this.dimension = dimension;
    this.innerSpace = innerSpace;
    this.isPrimaryOutput = false;
  }
}

export async function mapSpaceToSpaceLiteral(space: Space) {
  if (space === undefined) return undefined;
  return new SpaceLiteral(
    space._type,
    space.locality,
    space.isControlled,
    space.name,
    space.locationJSON,
    space.dimension,
    space.innerSpace === undefined
      ? undefined
      : await mapSpaceToSpaceLiteral(
          (await fetchData(SPACE_SCHEMA, space.innerSpace)) as Space,
        ),
  );
}

export function mapSpaceLiteralToSpace(spaceLiteral: SpaceLiteral) {
  if (spaceLiteral === undefined) return undefined;
  switch (spaceLiteral._type) {
    case "OpenSpace":
      return new OpenSpace(
        spaceLiteral.locality,
        spaceLiteral.isControlled,
        spaceLiteral.locationJSON,
        spaceLiteral.name,
        spaceLiteral.dimension,
        mapSpaceLiteralToSpace(spaceLiteral.innerSpace),
      );
    case "EnclosedSpace":
      return new EnclosedSpace(
        spaceLiteral.locality,
        spaceLiteral.isControlled,
        spaceLiteral.locationJSON,
        spaceLiteral.name,
        spaceLiteral.dimension,
        mapSpaceLiteralToSpace(spaceLiteral.innerSpace),
      );
    case "MergeSpace":
      return new MergeSpace(
        spaceLiteral.controlSignal,
        undefined,
        undefined,
        spaceLiteral.locality,
        spaceLiteral.locationJSON,
        spaceLiteral.name,
        spaceLiteral.dimension,
        mapSpaceLiteralToSpace(spaceLiteral.innerSpace),
      );
    case "SelectionSpace":
      return new SelectionSpace(
        spaceLiteral.controlSignal,
        undefined,
        undefined,
        spaceLiteral.locality,
        spaceLiteral.locationJSON,
        spaceLiteral.name,
        spaceLiteral.dimension,
        mapSpaceLiteralToSpace(spaceLiteral.innerSpace),
      );
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
  truePath: { type: "string" },
  falsePath: { type: "string" },
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
  constructor(
    locality: string,
    isControlled: boolean,
    locationJSON: string,
    name?: string,
    dimension?: number,
    innerSpace?: string,
  ) {
    super(locality, isControlled, locationJSON, name, dimension, innerSpace);
    this._type = "OpenSpace";
  }
}

export class EnclosedSpace extends Space {
  constructor(
    locality: string,
    isControlled: boolean,
    locationJSON: string,
    name?: string,
    dimension?: number,
    innerSpace?: string,
  ) {
    super(locality, isControlled, locationJSON, name, dimension, innerSpace);
    this._type = "EnclosedSpace";
  }
}

export interface ControlSpace {
  controlSignal: boolean;
  truePath: string;
  falsePath: string;
}

export function isControlSpace(space: Space): space is Space & ControlSpace {
  return (
    "controlSignal" in space && "truePath" in space && "falsePath" in space
  );
}

export class MergeSpace extends Space implements ControlSpace {
  controlSignal: boolean;
  truePath: string;
  falsePath: string;

  constructor(
    controlSignal: boolean,
    truePath: string,
    falsePath: string,
    locality: string,
    locationJSON: string,
    name?: string,
    dimension?: number,
    innerSpace?: string,
  ) {
    super(locality, true, locationJSON, name, dimension, innerSpace);
    this._type = "MergeSpace";
    this.entities = ["", ""];
    this.controlSignal = controlSignal;
    this.truePath = truePath;
    this.falsePath = falsePath;
  }
}

export class SelectionSpace extends Space implements ControlSpace {
  controlSignal: boolean;
  truePath: string;
  falsePath: string;

  constructor(
    controlSignal: boolean,
    truePath: string,
    falsePath: string,
    locality: string,
    locationJSON: string,
    name?: string,
    dimension?: number,
    innerSpace?: string,
  ) {
    super(locality, true, locationJSON, name, dimension, innerSpace);
    this._type = "SelectionSpace";
    this.controlSignal = controlSignal;
    this.truePath = truePath;
    this.falsePath = falsePath;
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
  isFull: boolean;
  factory: string;

  constructor(
    locality: string,
    name?: string,
    segment: number = 0,
    target?: string,
    reachable: Array<string> = [],
  ) {
    super(locality);
    this.name = name;
    this.segment = segment;
    this.target = target;
    this.reachable = reachable;
    this._type = "Path";
    this.isFull = false;
  }
}

export class PathLiteral {
  _type: string;
  locality: string;
  name: string;
  segment: number;
  target: SpaceLiteral;
  reachable: SpaceLiteral[];

  constructor(
    _type: string,
    locality: string,
    name: string,
    segment: number,
    target: SpaceLiteral,
    reachable: SpaceLiteral[],
  ) {
    this._type = _type;
    this.locality = locality;
    this.name = name;
    this.segment = segment;
    this.target = target;
    this.reachable = reachable;
  }
}

export function mapPathToPathLiteral(
  path: Path,
  spaceMap: Map<string, SpaceLiteral>,
) {
  return new PathLiteral(
    path._type,
    path.locality,
    path.name,
    path.segment,
    spaceMap.get(path.target),
    path.reachable.map((spaceId) => spaceMap.get(spaceId)),
  );
}

export function mapPathLiteralToPath(
  pathLiteral: PathLiteral,
  spaceMap: Map<string, string>,
  hash: (SpaceLiteral) => string,
) {
  switch (pathLiteral._type) {
    case "Path":
      return new Path(
        pathLiteral.locality,
        pathLiteral.name,
        pathLiteral.segment,
        spaceMap.get(hash(pathLiteral.target)),
        pathLiteral.reachable.map((spaceLiteral) =>
          spaceMap.get(hash(spaceLiteral)),
        ),
      );
    case "AirPath":
      return new AirPath(
        pathLiteral.name,
        pathLiteral.segment,
        spaceMap.get(hash(pathLiteral.target)),
        pathLiteral.reachable.map((spaceLiteral) =>
          spaceMap.get(hash(spaceLiteral)),
        ),
      );
    case "LandPath":
      return new LandPath(
        pathLiteral.name,
        pathLiteral.segment,
        spaceMap.get(hash(pathLiteral.target)),
        pathLiteral.reachable.map((spaceLiteral) =>
          spaceMap.get(hash(spaceLiteral)),
        ),
      );
  }
}

export class AirPath extends Path {
  constructor(
    name?: string,
    segment: number = 0,
    target?: string,
    reachable: Array<string> = [],
  ) {
    super("physical", name, segment, target, reachable);
    this._type = "AirPath";
  }
}

export class LandPath extends Path {
  constructor(
    name?: string,
    segment: number = 0,
    target?: string,
    reachable: Array<string> = [],
  ) {
    super("physical", name, segment, target, reachable);
    this._type = "LandPath";
  }
}

export class SpacePathGraphFactory implements Entity {
  [index: string]: EntityDataValue;
  SPGFactoryStructJSON: string;
  primaryOutputSpaceId: string;

  constructor(SPGFactoryStructJSON: string) {
    this.SPGFactoryStructJSON = SPGFactoryStructJSON;
  }
}

const SpacePathGraphFactorySchemaDef: SchemaDefinition = {
  SPGFactoryStructJSON: { type: "string" },
  primaryOutputSpaceId: { type: "string" },
};

export const SPG_FACTORY_SCHEMA = new Schema(
  "SpacePathGraphFactory",
  SpacePathGraphFactorySchemaDef,
  { dataStructure: "JSON" },
);

export abstract class RequestMessage implements Entity {
  [index: string]: EntityDataValue;
  timestamp: Date;
  status: string;
  errorMsg: string | undefined;

  constructor() {
    this.timestamp = new Date(Date.now());
    this.status = "POSTED";
    this.errorMsg = undefined;
  }
}

export abstract class MoveEntityRequestMessage extends RequestMessage {
  space: string;
  entity: string;
  path: string;
  isTruePath: boolean;

  constructor(space: string, entity: string, path: string) {
    super();
    this.space = space;
    this.entity = entity;
    this.path = path;
  }
}

const MoveEntityRequestMessageSchemaDef: SchemaDefinition = {
  timestamp: { type: "date", sortable: true },
  status: { type: "string" },
  errorMsg: { type: "string" },
  space: { type: "string" },
  entity: { type: "string" },
  path: { type: "string" },
  isTruePath: { type: "boolean" },
};

export class SendEntityRequestMessage extends MoveEntityRequestMessage {}

export const SEND_ENTITY_SCHEMA = new Schema(
  "SendEntityRequestMessage",
  MoveEntityRequestMessageSchemaDef,
  { dataStructure: "JSON" },
);

export class EnterSpaceRequestMessage extends MoveEntityRequestMessage {}

export const ENTER_SPACE_SCHEMA = new Schema(
  "EnterSpaceRequestMessage",
  MoveEntityRequestMessageSchemaDef,
  { dataStructure: "JSON" },
);
