import {
  ASTNode,
  dotString,
  newNodeId,
  RuntimeType,
  SymbolDeclaration,
} from "../program.js";
import { libFunctions, VarDeclaration } from "../stmts.js";
import { getValueOfExpression, isDecorator } from "../../utils.js";
import { FunDeclaration } from "./FunDeclaration.js";
import { Expr, Identifier } from "./Expr.js";
import { SymbolAccess } from "./SymbolAccess.js";
import {
  ControlSpaceType,
  PathType,
  SpacePathGraphFactoryType,
  SpacePathGraphType,
  SpaceType,
} from "../type/index.js";

export class FunCall extends Expr {
  identifier: Expr;
  args: Expr[];

  constructor(
    type: RuntimeType,
    identifier: Expr,
    args: Expr[],
    line: number = -1,
    column: number = -1,
  ) {
    super(type, line, column);
    this.identifier = identifier;
    this.args = args;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.identifier);
    if (this.args !== null) children.push(...this.args);
    return children;
  }

  print(): string {
    const funCallNodeId = newNodeId();
    dotString.push(funCallNodeId + '[label=" FunCall "];\n');
    const identifierNodeId = this.identifier.print();
    const argNodeIds = new Array<string>();
    this.args.forEach((arg) => argNodeIds.push(arg.print()));
    dotString.push(funCallNodeId + "->" + identifierNodeId + ";\n");
    argNodeIds.forEach((nodeId) =>
      dotString.push(funCallNodeId + "->" + nodeId + ";\n"),
    );
    return funCallNodeId;
  }

  async evaluate(
    varStacks: Map<SymbolDeclaration, unknown[]>,
  ): Promise<unknown> {
    if (this.identifier instanceof SymbolAccess) {
      let spatialBaseType = this.identifier.locationExpr.type;
      while (isDecorator(spatialBaseType))
        spatialBaseType = spatialBaseType.delegate;
      if (
        spatialBaseType instanceof SpacePathGraphFactoryType ||
        spatialBaseType instanceof SpacePathGraphType ||
        spatialBaseType instanceof SpaceType ||
        spatialBaseType instanceof PathType
      ) {
        const args = new Array<unknown>();
        for (const arg of this.args)
          args.push(
            getValueOfExpression(await arg.evaluate(varStacks), varStacks),
          );
        args.unshift(
          getValueOfExpression(
            await this.identifier.locationExpr.evaluate(varStacks),
            varStacks,
          ),
        );
        return await (
          spatialBaseType instanceof SpacePathGraphFactoryType
            ? SpacePathGraphFactoryType
            : spatialBaseType instanceof SpacePathGraphType
              ? SpacePathGraphType
              : spatialBaseType instanceof ControlSpaceType
                ? ControlSpaceType
                : spatialBaseType instanceof SpaceType
                  ? SpaceType
                  : PathType
        ).libMethods.get(this.identifier.symbol.value)(...args);
      }
    }
    const identifier = await this.identifier.evaluate(varStacks);
    if (
      identifier instanceof Identifier &&
      libFunctions.has(<VarDeclaration>identifier.declaration)
    ) {
      const args = new Array<unknown>();
      for (const arg of this.args)
        args.push(
          getValueOfExpression(await arg.evaluate(varStacks), varStacks),
        );
      return await libFunctions.get(<VarDeclaration>identifier.declaration)(
        ...args,
      );
    }
    const funDecl = <FunDeclaration>getValueOfExpression(identifier, varStacks);
    for (let pos = 0; pos < this.args.length; pos++) {
      const arg = this.args[pos];
      const value = getValueOfExpression(
        await arg.evaluate(varStacks),
        varStacks,
      );
      const paramStack = varStacks.get((<FunDeclaration>funDecl).params[pos]);
      if (paramStack === undefined)
        varStacks.set((<FunDeclaration>funDecl).params[pos], [value]);
      else paramStack.push(value);
    }
    return await funDecl.evaluate(varStacks);
  }
}
