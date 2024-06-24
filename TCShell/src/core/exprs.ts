import {
    ArrayRepresentation,
    ASTNode,
    dotString, ExprStmt,
    newNodeId,
    SymbolDeclaration,
    unresolved,
    varStacks
} from "./program.js";
import {getSpatialTypeSchema, getValueOfExpression, parseSpatialTypeProperties, popOutOfScopeVars} from "../utils.js";
import * as engine from "../../../SpatialComputingEngine/src/frontend-objects.js";
import {saveData} from "../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import {Scope} from "../semantics.js";
import {DeferredDecorator, libFunctions, Parameter, Return, UnionDeclaration, VarDeclaration} from "./stmts.js";
import {ArrayType, BaseType, BaseTypeKind, FunctionType, Type} from "./type/primitive-types.js";
import {
    AirPathType,
    EnclosedSpaceType, LandPathType,
    OpenSpaceType, PathType,
    SmartEntityType, SpatialType,
    StaticEntityType
} from "./type/spatial-types.js";

export abstract class Exprs implements ASTNode {
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

export class BinaryExpr extends Exprs {
    leftExpr: Exprs;
    operator: string;
    rightExpr: Exprs;

    constructor(
        line: number,
        column: number,
        type: Type,
        operator: string,
        leftExpr: Exprs,
        rightExpr: Exprs,
    ) {
        super(line, column, type);
        this.leftExpr = leftExpr;
        this.operator = operator;
        this.rightExpr = rightExpr;
    }

    children(): ASTNode[] {
        const children = new Array<ASTNode>();
        children.push(this.leftExpr);
        children.push(this.rightExpr);
        return children;
    }

    print(): string {
        const opNodeId = newNodeId();
        dotString.push(
            opNodeId + '[label=" ' + this.operator + ' "];\n',
        );
        const leftExprId = this.leftExpr.print();
        const rightExprId = this.rightExpr.print();
        dotString.push(opNodeId + "->" + leftExprId + ";\n");
        dotString.push(opNodeId + "->" + rightExprId + ";\n");
        return opNodeId;
    }

    async evaluate(): Promise<unknown> {
        let leftHandExp = await this.leftExpr.evaluate();
        const rightHandExp =
            this.rightExpr instanceof FunDeclaration
                ? this.rightExpr
                : getValueOfExpression(await this.rightExpr.evaluate());
        if (this.operator === "=") {
            if (leftHandExp instanceof Identifier) {
                const varStack = varStacks.get(
                    <SymbolDeclaration>(<Identifier>leftHandExp).declaration,
                );
                varStack[varStack.length - 1] = rightHandExp;
            } else if (leftHandExp instanceof ArrayRepresentation)
                leftHandExp.array[leftHandExp.index] = rightHandExp;
            return rightHandExp;
        }
        leftHandExp = getValueOfExpression(leftHandExp);
        switch (this.operator) {
            case "||":
                return <boolean>leftHandExp || <boolean>rightHandExp;
            case "&&":
                return <boolean>leftHandExp && <boolean>rightHandExp;
            case "==":
                return leftHandExp === rightHandExp;
            case "!=":
                return leftHandExp !== rightHandExp;
            case "<=":
                return <number>leftHandExp <= <number>rightHandExp;
            case "<":
                return <number>leftHandExp < <number>rightHandExp;
            case ">=":
                return <number>leftHandExp >= <number>rightHandExp;
            case ">":
                return <number>leftHandExp > <number>rightHandExp;
            case "+":
                return typeof leftHandExp === "number"
                    ? <number>leftHandExp + <number>rightHandExp
                    : <string>leftHandExp + <string>rightHandExp;
            case "-":
                return <number>leftHandExp - <number>rightHandExp;
            case "*":
                return <number>leftHandExp * <number>rightHandExp;
            case "/":
                return <number>leftHandExp / <number>rightHandExp;
            case "%":
                return <number>leftHandExp % <number>rightHandExp;
        }
    }
}

export class UnaryExpr extends Exprs {
    operator: string;
    expr: Exprs;

    constructor(
        line: number,
        column: number,
        type: Type,
        operator: string,
        expr: Exprs,
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

export class FunDeclaration extends Exprs {
    params: Parameter[];
    _body: ExprStmt;
    scope: Scope;

    constructor(
        line: number,
        column: number,
        type: Type,
        params: Parameter[],
        body: ExprStmt,
    ) {
        const paramTypes: Type[] = params.map((param) => param._type);
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
        dotString.push(
            funDeclNodeId + '[label=" AnonFunDecl "];\n',
        );
        const typeNodeId = this._type.print();
        const paramNodeIds = new Array<string>();
        this.params.forEach((child) => paramNodeIds.push(child.print()));
        const blockNodeId = this._body.print();
        dotString.push(funDeclNodeId + "->" + typeNodeId + ";\n");
        paramNodeIds.forEach(
            (nodeId) =>
                (dotString.push(funDeclNodeId + "->" + nodeId + ";\n")),
        );
        dotString.push(funDeclNodeId + "->" + blockNodeId + ";\n");
        return funDeclNodeId;
    }

    async evaluate(): Promise<unknown> {
        let returnValue = undefined;
        if (this._body instanceof DeferredDecorator)
            unresolved.push(this._body.evaluate());
        else {
            returnValue = await this._body.evaluate();
            if (returnValue instanceof Return && returnValue.possibleValue !== null)
                returnValue = getValueOfExpression(await returnValue.possibleValue.evaluate());
        }
        popOutOfScopeVars(this);
        return returnValue;
    }
}

export class ArrayAccess extends Exprs {
    arrayExpr: Exprs;
    accessExpr: Exprs;

    constructor(line: number, column: number, arrayExpr: Exprs, accessExpr: Exprs) {
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

export class TypeCast extends Exprs {
    castedExpr: Exprs;

    constructor(
        line: number,
        column: number,
        desiredType: Type,
        castedExpr: Exprs,
    ) {
        super(line, column, desiredType);
        this.castedExpr = castedExpr;
    }

    children(): ASTNode[] {
        const children = new Array<ASTNode>();
        children.push(this._type);
        children.push(this.castedExpr);
        return children;
    }

    print(): string {
        const typeCastNodeId = newNodeId();
        dotString.push(typeCastNodeId + '[label=" TypeCast "];\n');
        const desiredTypeNodeId = this._type.print();
        const castedExprNodeId = this.castedExpr.print();
        dotString.push(
            typeCastNodeId + "->" + desiredTypeNodeId + ";\n",
        );
        dotString.push(
            typeCastNodeId + "->" + castedExprNodeId + ";\n",
        );
        return typeCastNodeId;
    }

    async evaluate(): Promise<unknown> {
        return await this.castedExpr.evaluate();
    }
}

export class FunCall extends Exprs {
    identifier: Exprs;
    args: Exprs[];

    constructor(
        line: number,
        column: number,
        type: Type,
        identifier: Exprs,
        args: Exprs[],
    ) {
        super(line, column, type);
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
        dotString.push(
            funCallNodeId + "->" + identifierNodeId + ";\n",
        );
        argNodeIds.forEach(
            (nodeId) =>
                (dotString.push(funCallNodeId + "->" + nodeId + ";\n")),
        );
        return funCallNodeId;
    }

    async evaluate(): Promise<unknown> {
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

export class SpacialObjectInstantiationExpr extends Exprs {
    args: Exprs[];

    constructor(
        line: number,
        column: number,
        spatialType: SpatialType,
        args: Exprs[],
    ) {
        super(line, column, spatialType);
        this.args = args;
    }

    children(): ASTNode[] {
        const children = new Array<ASTNode>();
        children.push(this._type);
        return children;
    }

    print(): string {
        const spatialObjectInstantiationNodeId = newNodeId();
        dotString.push(
            spatialObjectInstantiationNodeId + '[label=" new "];\n',
        );
        const spatialTypeNodeId = this._type.print();
        dotString.push(
            spatialObjectInstantiationNodeId + "->" + spatialTypeNodeId + ";\n",
        );
        return spatialObjectInstantiationNodeId;
    }

    async evaluate(): Promise<string> {
        const [propertiesRaw, delegateType] = parseSpatialTypeProperties(
            <SpatialType>this._type,
        );
        const properties: Map<string, string | boolean> = propertiesRaw as Map<
            string,
            string | boolean
        >;
        const newObject: engine.SpatialTypeEntity =
            delegateType instanceof AirPathType
                ? new engine.AirPath()
                : delegateType instanceof LandPathType
                    ? new engine.LandPath()
                    : delegateType instanceof PathType
                        ? new engine.Path("virtual")
                        : delegateType instanceof OpenSpaceType
                            ? new engine.OpenSpace(
                                properties.get("locality") as string,
                                properties.get("isControlled") as boolean,
                            )
                            : delegateType instanceof EnclosedSpaceType
                                ? new engine.EnclosedSpace(
                                    properties.get("locality") as string,
                                    properties.get("isControlled") as boolean,
                                )
                                : delegateType instanceof StaticEntityType
                                    ? new engine.StaticEntity(
                                        properties.get("locality") as string,
                                        properties.get("isControlled") as boolean,
                                    )
                                    : delegateType instanceof SmartEntityType
                                        ? new engine.SmartEntity(
                                            properties.get("locality") as string,
                                            properties.get("isControlled") as boolean,
                                            properties.get("motion") as string,
                                        )
                                        : new engine.AnimateEntity(
                                            properties.get("locality") as string,
                                            properties.get("isControlled") as boolean,
                                            properties.get("motion") as string,
                                        );
        return await saveData(getSpatialTypeSchema(newObject), newObject);
    }
}

export class StringLiteral extends Exprs {
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

export class BoolLiteral extends Exprs {
    value: boolean;

    constructor(line: number, column: number, value: boolean) {
        super(line, column, new BaseType(-1, -1, BaseTypeKind.BOOL));
        this.value = value;
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const boolLiteralNodeId = newNodeId();
        dotString.push(
            boolLiteralNodeId + '[label=" ' + this.value + ' "];\n',
        );
        return boolLiteralNodeId;
    }

    async evaluate(): Promise<boolean> {
        return this.value;
    }
}

export class NumberLiteral extends Exprs {
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
        dotString.push(
            numberLiteralNodeId + '[label=" ' + this.value + ' "];\n',
        );
        return numberLiteralNodeId;
    }

    async evaluate(): Promise<number> {
        return this.value;
    }
}

export class NoneLiteral extends Exprs {
    value: undefined;

    constructor(line: number, column: number) {
        super(line, column, new BaseType(-1, -1, BaseTypeKind.VOID));
        this.value = undefined;
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const noneLiteralNodeId = newNodeId();
        dotString.push(noneLiteralNodeId + '[label= " None " ];\n');
        return noneLiteralNodeId;
    }

    async evaluate(): Promise<undefined> {
        return this.value;
    }
}

export class ArrayLiteral extends Exprs {
    value: Exprs[];

    constructor(line: number, column: number, value: Exprs[]) {
        super(
            line,
            column,
            new ArrayType(
                -1,
                -1,
                new BaseType(-1, -1, BaseTypeKind.NONE),
                value.length,
            ),
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
            .forEach(
                (nodeId) =>
                    (dotString.push(arrayNodeId + "->" + nodeId + ";\n")),
            );
        return arrayNodeId;
    }

    async evaluate(): Promise<unknown[]> {
        const array = new Array<unknown>();
        for (const exp of this.value)
            array.push(getValueOfExpression(await exp.evaluate()));
        return array;
    }
}

export class Identifier extends Exprs {
    value: string;
    declaration: SymbolDeclaration | UnionDeclaration;

    constructor(line: number, column: number, value: string) {
        super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
        this.value = value;
    }

    children(): ASTNode[] {
        return new Array<ASTNode>();
    }

    print(): string {
        const identifierNodeId = newNodeId();
        dotString.push(
            identifierNodeId + '[label=" ' + this.value + ' "];\n',
        );
        return identifierNodeId;
    }

    async evaluate(): Promise<Identifier> {
        return this;
    }
}