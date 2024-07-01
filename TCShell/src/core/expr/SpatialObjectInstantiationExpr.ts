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
    spatialType: SpatialType,
    args: Expr[],
    line: number = -1,
    column: number = -1,
  ) {
    super(spatialType, line, column);
    this.args = args;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._type);
    children.push(...this.args);
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
                  JSON.stringify(await this.args[0].evaluate()),
                )
              : delegateType instanceof EnclosedSpaceType
                ? new engine.EnclosedSpace(
                    properties.get("locality") as string,
                    properties.get("isControlled") as boolean,
                    JSON.stringify(await this.args[0].evaluate()),
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
    if (newObject instanceof engine.Space) {
      if (this.args.length > 1)
        newObject.dimension = (await this.args[1].evaluate()) as number;
      if (this.args.length > 2)
        newObject.name = (await this.args[2].evaluate()) as string;
    }
    return await saveData(getSpatialTypeSchema(newObject), newObject);
  }
}
