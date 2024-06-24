import {BaseType, BaseTypeKind} from "../type/index.js";
import {ASTNode, dotString, newNodeId} from "../program.js";
import {Expr} from "./Expr.js";

export class StringLiteral extends Expr {
    value: string;

    constructor(line: number, column: number, value: string) {
        super(line, column, new BaseType(-1, -1, BaseTypeKind.STRING));
        this.value = value;
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const stringLiteralNodeId = newNodeId();
        dotString.push(
            stringLiteralNodeId + '[label=" ' + this.value + ' "];\n',
        );
        return stringLiteralNodeId;
    }

    async evaluate(): Promise<string> {
        return this.value;
    }
}