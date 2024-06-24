import {Type} from "../type/index.js";
import {ASTNode, dotString, newNodeId} from "../program.js";
import {getValueOfExpression} from "../../utils.js";
import {Expr} from "./Expr.js";

export class UnaryExpr extends Expr {
    operator: string;
    expr: Expr;

    constructor(
        line: number,
        column: number,
        type: Type,
        operator: string,
        expr: Expr,
    ) {
        super(line, column, type);
        this.operator = operator;
        this.expr = expr;
    }

    children(): ASTNode[] {
        const children = new Array<ASTNode>();
        children.push(this.expr);
        return children;
    }

    print(): string {
        const opNodeId = newNodeId();
        dotString.push(
            opNodeId + '[label" ' + this.operator + ' "];\n',
        );
        const rightExprId = this.expr.print();
        dotString.push(opNodeId + "->" + rightExprId + ";\n");
        return opNodeId;
    }

    async evaluate(): Promise<number | boolean> {
        const expression = getValueOfExpression(await this.expr.evaluate());
        switch (this.operator) {
            case "+":
                return +(<number>expression);
            case "-":
                return -(<number>expression);
            case "!":
                return !(<boolean>expression);
        }
    }
}