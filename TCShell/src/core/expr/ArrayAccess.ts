import {ArrayRepresentation, ASTNode, dotString, newNodeId, SymbolDeclaration, varStacks} from "../program.js";
import {getValueOfExpression} from "../../utils.js";
import {Expr} from "./Expr.js";
import {Identifier} from "./Identifier.js";

export class ArrayAccess extends Expr {
    arrayExpr: Expr;
    accessExpr: Expr;

    constructor(line: number, column: number, arrayExpr: Expr, accessExpr: Expr) {
        super(line, column, null);
        this.arrayExpr = arrayExpr;
        this.accessExpr = accessExpr;
    }

    children(): ASTNode[] {
        const children = new Array<ASTNode>();
        children.push(this.arrayExpr);
        children.push(this.accessExpr);
        return children;
    }

    print(): string {
        const arrayAccessNodeId = newNodeId();
        dotString.push(arrayAccessNodeId + '[label=" at "];\n');
        const arrayExprId = this.arrayExpr.print();
        const accessExprId = this.accessExpr.print();
        dotString.push(
            arrayAccessNodeId + "->" + arrayExprId + ";\n",
        );
        dotString.push(
            arrayAccessNodeId + "->" + accessExprId + ";\n",
        );
        return arrayAccessNodeId;
    }

    async evaluate(): Promise<ArrayRepresentation> {
        const indices = new Array<number>();
        let arrayBase = <ArrayAccess>this;
        while (true) {
            indices.push(
                <number>(
                    getValueOfExpression(await arrayBase.accessExpr.evaluate())
                ),
            );
            if (!((<ArrayAccess>arrayBase).arrayExpr instanceof ArrayAccess)) break;
            arrayBase = <ArrayAccess>arrayBase.arrayExpr;
        }
        let returnArray = <unknown[]>(
            varStacks
                .get(
                    <SymbolDeclaration>(
                        (<Identifier>arrayBase.arrayExpr).declaration
                    ),
                )
                .at(-1)
        );
        while (indices.length > 1) {
            returnArray = <unknown[]>returnArray[indices.pop()];
        }
        return new ArrayRepresentation(returnArray, indices.pop());
    }
}