import {ASTNode} from "../program.js";
import {Type} from "../type/index.js";

export abstract class Expr implements ASTNode {
    column: number;
    line: number;
    _type: Type;

    protected constructor(line: number, column: number, exprType: Type) {
        this.column = column;
        this.line = line;
        this._type = exprType;
    }
    abstract children(): Array<ASTNode>;

    abstract print(): string;

    abstract evaluate(): Promise<unknown>;

    getFilePos(): string {
        return "line: " + this.line + ", column: " + this.column + ", ";
    }


}

