import {BaseType, BaseTypeKind} from "../type/index.js";
import {ASTNode, dotString, newNodeId} from "../program.js";
import {Expr} from "./Expr.js";

export class NumberLiteral extends Expr {
  value: number;

  constructor(line: number, column: number, value: number) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NUMBER));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  print(): string {
    const numberLiteralNodeId = newNodeId();
    dotString.push(numberLiteralNodeId + '[label=" ' + this.value + ' "];\n');
    return numberLiteralNodeId;
  }

  async evaluate(): Promise<number> {
    return this.value;
  }
}
