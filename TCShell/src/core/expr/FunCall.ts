import {
  ASTNode,
  dotString,
  newNodeId,
  RuntimeType,
  varStacks,
} from "../program.js";
import { libFunctions, SPGLibMethods, VarDeclaration } from "../stmts.js";
import { getValueOfExpression, isDecorator } from "../../utils.js";
import { FunDeclaration } from "./FunDeclaration.js";
import { Expr, Identifier } from "./Expr.js";
import { SymbolAccess } from "./SymbolAccess.js";
import { SpacePathGraphType } from "../type/spatial-types.js";

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

  async evaluate(): Promise<unknown> {
    if (
      this.identifier instanceof SymbolAccess &&
      (this.identifier.locationExpr.type instanceof SpacePathGraphType ||
        (isDecorator(this.identifier.locationExpr.type) &&
          this.identifier.locationExpr.type.delegate instanceof
            SpacePathGraphType))
    ) {
      const args = new Array<unknown>();
      for (const arg of this.args)
        args.push(getValueOfExpression(await arg.evaluate()));
      args.unshift(
        getValueOfExpression(await this.identifier.locationExpr.evaluate()),
      );
      return await SPGLibMethods.get(this.identifier.symbol.value)(...args);
    }
    const identifier = await this.identifier.evaluate();
    if (
      identifier instanceof Identifier &&
      libFunctions.has(<VarDeclaration>identifier.declaration)
    ) {
      const args = new Array<unknown>();
      for (const arg of this.args)
        args.push(getValueOfExpression(await arg.evaluate()));
      return libFunctions.get(<VarDeclaration>identifier.declaration)(...args);
    }
    const funDecl = <FunDeclaration>getValueOfExpression(identifier);
    for (let pos = 0; pos < this.args.length; pos++) {
      const arg = this.args[pos];
      const value = getValueOfExpression(await arg.evaluate());
      const paramStack = varStacks.get((<FunDeclaration>funDecl).params[pos]);
      if (paramStack === undefined)
        varStacks.set((<FunDeclaration>funDecl).params[pos], [value]);
      else paramStack.push(value);
    }
    return await funDecl.evaluate();
  }
}
