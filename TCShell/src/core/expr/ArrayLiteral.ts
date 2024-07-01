import { ArrayType, BaseType, BaseTypeKind } from "../type/index.js";
import { ASTNode, dotString, newNodeId } from "../program.js";
import { getValueOfExpression } from "../../utils.js";
import { Expr } from "./Expr.js";

export class ArrayLiteral extends Expr {
  value: Expr[];

  constructor(value: Expr[], line: number = -1, column: number = -1) {
    super(
      new ArrayType(new BaseType(BaseTypeKind.ANY), value.length),
      line,
      column,
    );
    this.value = value;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.value);
    return children;
  }

  print(): string {
    const arrayNodeId = newNodeId();
    dotString.push(arrayNodeId + '[label=" Array "];\n');
    this.children()
      .map((child) => child.print())
      .forEach((nodeId) => dotString.push(arrayNodeId + "->" + nodeId + ";\n"));
    return arrayNodeId;
  }

  async evaluate(): Promise<unknown[]> {
    const array = new Array<unknown>();
    for (const exp of this.value)
      array.push(getValueOfExpression(await exp.evaluate()));
    return array;
  }
}
