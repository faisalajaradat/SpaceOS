import { CompositionType, Type } from "./primitive-types.js";
import { ASTNode, dotString, newNodeId } from "../program.js";
import { isAnyType } from "../../utils.js";
import { UnionDeclaration } from "../stmts.js";
import { Identifier } from "../expr/Expr.js";

export class UnionType extends CompositionType {
  identifier: Identifier;

  constructor(identifier: Identifier, line: number = -1, column: number = -1) {
    super(line, column);
    this.identifier = identifier;
  }

  children(): ASTNode[] {
    return [this.identifier];
  }

  equals(_type: Type): boolean {
    if (isAnyType(_type)) return true;
    if (
      _type instanceof UnionType &&
      (<UnionDeclaration>this.identifier.declaration).options.length ===
        (<UnionDeclaration>_type.identifier.declaration).options.length
    ) {
      let numOfMatchingOptions = 0;
      (<UnionDeclaration>this.identifier.declaration).options.forEach(
        (option0) => {
          numOfMatchingOptions += (<UnionDeclaration>(
            _type.identifier.declaration
          )).options.filter((option1) => option0.equals(option1)).length;
        },
      );
      return (
        numOfMatchingOptions ===
        (<UnionDeclaration>this.identifier.declaration).options.length
      );
    }
    return false;
  }

  print(): string {
    const unionType = newNodeId();
    dotString.push(unionType + '[label=" UnionType "];\n');
    const identifierNodeId = this.identifier.print();
    dotString.push(unionType + "->" + identifierNodeId + ";\n");
    return unionType;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }

  contains(_type: Type): boolean {
    let containsType = false;
    (<UnionDeclaration>this.identifier.declaration).options.forEach(
      (option) => {
        if (containsType) return;
        containsType = option.equals(_type);
      },
    );
    return containsType;
  }
}
