import {
  AirPathType,
  EnclosedSpaceType,
  LandPathType,
  OpenSpaceType,
  PathType,
  SmartEntityType,
  SpacePathGraphFactoryType,
  SpacePathGraphType,
  SpatialType,
  StaticEntityType,
} from "../type/index.js";
import {
  ASTNode,
  dotString,
  jsonReplacer,
  newNodeId,
  RuntimeType,
  SPGStruct,
  SymbolDeclaration,
} from "../program.js";
import {
  getSpatialTypeSchema,
  getValueOfExpression,
  parseSpatialTypeProperties,
} from "../../utils.js";
import * as engine from "../../../../SpatialComputingEngine/src/frontend-objects.js";
import { saveData } from "../../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import { Expr } from "./Expr.js";
import { intializeSPGFactory } from "../spg-factory-methods.js";

export class SpatialObjectInstantiationExpr extends Expr {
  args: Expr[];

  constructor(
    spatialType: RuntimeType,
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

  async evaluate(
    varStacks: Map<SymbolDeclaration, unknown[]>,
  ): Promise<unknown> {
    if (this.type instanceof SpacePathGraphType) {
      const rootSpaceId = getValueOfExpression(
        await this.args[0].evaluate(varStacks),
        varStacks,
      ) as string;
      const struct: SPGStruct = {
        root: rootSpaceId,
        table: new Map<string, string[]>(),
      };
      struct.table.set(rootSpaceId, new Array<string>());
      const newSPG = new engine.SpacePathGraph(
        JSON.stringify(struct, jsonReplacer, 4),
      );
      return await saveData(engine.SPG_SCHEMA, newSPG);
    }
    if (this.type instanceof SpacePathGraphFactoryType)
      return await intializeSPGFactory(
        getValueOfExpression(
          await this.args[0].evaluate(varStacks),
          varStacks,
        ) as string,
      );
    const [propertiesRaw, delegateType] = parseSpatialTypeProperties(
      this.type as SpatialType,
    );
    const properties: Map<string, string | boolean> = propertiesRaw as Map<
      string,
      string | boolean
    >;
    const newObject: engine.SpatialTypeEntity =
      delegateType instanceof AirPathType
        ? new engine.AirPath()
        : delegateType instanceof LandPathType
          ? new engine.LandPath()
          : delegateType instanceof PathType
            ? new engine.Path("virtual")
            : delegateType instanceof OpenSpaceType
              ? new engine.OpenSpace(
                  properties.get("locality") as string,
                  properties.get("isControlled") as boolean,
                  JSON.stringify(
                    getValueOfExpression(
                      await this.args[0].evaluate(varStacks),
                      varStacks,
                    ),
                    jsonReplacer,
                  ),
                )
              : delegateType instanceof EnclosedSpaceType
                ? new engine.EnclosedSpace(
                    properties.get("locality") as string,
                    properties.get("isControlled") as boolean,
                    JSON.stringify(
                      getValueOfExpression(
                        await this.args[0].evaluate(varStacks),
                        varStacks,
                      ),
                      jsonReplacer,
                    ),
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
        newObject.dimension = getValueOfExpression(
          await this.args[1].evaluate(varStacks),
          varStacks,
        ) as number;
      if (this.args.length > 2)
        newObject.name = getValueOfExpression(
          await this.args[2].evaluate(varStacks),
          varStacks,
        ) as string;
    } else if (this.args.length > 0)
      (newObject as engine.SpatialObject | engine.Path).name =
        getValueOfExpression(
          await this.args[0].evaluate(varStacks),
          varStacks,
        ) as string;
    return await saveData(getSpatialTypeSchema(newObject), newObject);
  }
}
