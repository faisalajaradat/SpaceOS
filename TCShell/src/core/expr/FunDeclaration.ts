import { DeferDecorator, Parameter, Return, Stmt } from "../stmts.js";
import {
  ASTNode,
  dotString,
  ExprStmt,
  newNodeId,
  RuntimeType,
  unresolved,
} from "../program.js";
import { Scope } from "../../semantics.js";
import { FunctionType } from "../type/index.js";
import { getValueOfExpression, popOutOfScopeVars } from "../../utils.js";
import { Expr } from "./Expr.js";

export class FunDeclaration extends Expr {
  params: Parameter[];
  _body: ExprStmt;
  scope: Scope;
  stmtsNeedingRevisiting: Array<Stmt>;

  constructor(
    type: RuntimeType,
    params: Parameter[],
    body: ExprStmt,
    line: number = -1,
    column: number = -1,
  ) {
    const paramTypes: RuntimeType[] = params.map((param) => param.paramType);
    super(
      new FunctionType(type, paramTypes, type.line, type.column),
      line,
      column,
    );
    this.params = params;
    this._body = body;
    this.stmtsNeedingRevisiting = new Array<Stmt>();
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._type);
    children.push(...this.params);
    children.push(this._body);
    return children;
  }

  print(): string {
    const funDeclNodeId = newNodeId();
    dotString.push(funDeclNodeId + '[label=" AnonFunDecl "];\n');
    const typeNodeId = this._type.print();
    const paramNodeIds = new Array<string>();
    this.params.forEach((child) => paramNodeIds.push(child.print()));
    const blockNodeId = this._body.print();
    dotString.push(funDeclNodeId + "->" + typeNodeId + ";\n");
    paramNodeIds.forEach((nodeId) =>
      dotString.push(funDeclNodeId + "->" + nodeId + ";\n"),
    );
    dotString.push(funDeclNodeId + "->" + blockNodeId + ";\n");
    return funDeclNodeId;
  }

  async evaluate(): Promise<unknown> {
    let returnValue = undefined;
    if (this._body instanceof DeferDecorator)
      unresolved.push(this._body.evaluate());
    else {
      returnValue = await this._body.evaluate();
      if (
        returnValue instanceof Return &&
        returnValue.possibleValue !== undefined
      )
        returnValue = getValueOfExpression(
          await returnValue.possibleValue.evaluate(),
        );
    }
    popOutOfScopeVars(this);
    return returnValue;
  }
}
