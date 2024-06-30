import {DeferDecorator, Parameter, Return} from "../stmts.js";
import {ASTNode, dotString, ExprStmt, newNodeId, RuntimeType, unresolved,} from "../program.js";
import {Scope} from "../../semantics.js";
import {FunctionType} from "../type/index.js";
import {getValueOfExpression, popOutOfScopeVars} from "../../utils.js";
import {Expr} from "./Expr.js";

export class FunDeclaration extends Expr {
  params: Parameter[];
  _body: ExprStmt;
  scope: Scope;

  constructor(
    line: number,
    column: number,
    type: RuntimeType,
    params: Parameter[],
    body: ExprStmt,
  ) {
    const paramTypes: RuntimeType[] = params.map((param) => param.paramType);
    super(
      line,
      column,
      new FunctionType(type.line, type.column, type, paramTypes),
    );
    this.params = params;
    this._body = body;
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
      if (returnValue instanceof Return && returnValue.possibleValue !== null)
        returnValue = getValueOfExpression(
          await returnValue.possibleValue.evaluate(),
        );
    }
    popOutOfScopeVars(this);
    return returnValue;
  }
}
