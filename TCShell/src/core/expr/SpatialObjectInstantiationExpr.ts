import {
  AirPathType,
  EnclosedSpaceType,
  LandPathType,
  OpenSpaceType,
  PathType,
  SmartEntityType,
  SpatialType,
  StaticEntityType,
} from "../type/index.js";
import { ASTNode, dotString, newNodeId } from "../program.js";
import {
  getSpatialTypeSchema,
  parseSpatialTypeProperties,
} from "../../utils.js";
import * as engine from "../../../../SpatialComputingEngine/src/frontend-objects.js";
import { saveData } from "../../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import { Expr } from "./Expr.js";

export class SpatialObjectInstantiationExpr extends Expr {
  args: Expr[];

  constructor(
    line: number,
    column: number,
    spatialType: SpatialType,
    args: Expr[],
  ) {
    super(line, column, spatialType);
    this.args = args;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._type);
    return children;
  }

  print(): string {
    const spatialObjectInstantiationNodeId = newNodeId();
    dotString.push(spatialObjectInstantiationNodeId + '[label=" new "];\n');
    const spatialTypeNodeId = this._type.print();
    dotString.push(
      spatialObjectInstantiationNodeId + "->" + spatialTypeNodeId + ";\n",
    );
    return spatialObjectInstantiationNodeId;
  }

  async evaluate(): Promise<string> {
    const [propertiesRaw, delegateType] = parseSpatialTypeProperties(
      <SpatialType>this._type,
    );
    const properties: Map<string, string | boolean> = propertiesRaw as Map<
      string,
      string | boolean
    >;
    const newObject: engine.SpatialTypeEntity =
      delegateType instanceof AirPathType
        ? new engine.AirPath(properties.get("direction") as string)
        : delegateType instanceof LandPathType
          ? new engine.LandPath(properties.get("direction") as string)
          : delegateType instanceof PathType
            ? new engine.Path("virtual", properties.get("direction") as string)
            : delegateType instanceof OpenSpaceType
              ? new engine.OpenSpace(
                  properties.get("locality") as string,
                  properties.get("isControlled") as boolean,
                )
              : delegateType instanceof EnclosedSpaceType
                ? new engine.EnclosedSpace(
                    properties.get("locality") as string,
                    properties.get("isControlled") as boolean,
                  )
                : delegateType instanceof StaticEntityType
                  ? new engine.StaticEntity(
                      properties.get("locality") as string,
                      properties.get("isControlled") as boolean,
                    )
                  : delegateType instanceof SmartEntityType
                    ? new engine.SmartEntity(
                        properties.get("locality") as string,
                        properties.get("isControlled") as boolean,
                        properties.get("motion") as string,
                      )
                    : new engine.AnimateEntity(
                        properties.get("locality") as string,
                        properties.get("isControlled") as boolean,
                        properties.get("motion") as string,
                      );
    return await saveData(getSpatialTypeSchema(newObject), newObject);
  }
}
