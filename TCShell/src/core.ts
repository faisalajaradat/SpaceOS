import { Scope } from "./semantics.js";
import { popOutOfScopeVars, getValueOfExpression } from "./utils.js";

//A map variable declaration and their stack of assigned values
const varStacks = new Map<VarDeclaration | Parameter, unknown[]>();

export class ArrayRepresentation {
  array: unknown[];
  index: number;

  constructor(array: unknown[], index: number) {
    this.array = array;
    this.index = index;
  }
}

//Define all AST nodes
export interface ASTNode {
  children(): ASTNode[];
  //Implement tree walker behaviour for node
  evaluate(): unknown;
}

export enum BaseTypeKind {
  NUMBER,
  STRING,
  BOOL,
  VOID,
  ANY,
  NONE,
}

export abstract class Type implements ASTNode {
  abstract children(): ASTNode[];
  abstract evaluate(): unknown;
}
export class BaseType extends Type {
  kind: BaseTypeKind;

  constructor(kind: BaseTypeKind) {
    super();
    this.kind = kind;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  evaluate(): unknown {
    return undefined;
  }
}
export abstract class ContainerType extends Type {
  _attributes: Map<FunDeclaration, (...args: unknown[]) => unknown>;
  scope: Scope;

  constructor(
    attributes: Map<FunDeclaration, (...args: unknown[]) => unknown>,
  ) {
    super();
    this._attributes = attributes;
  }

  evaluate(): unknown {
    return undefined;
  }
}
export class TypeType extends Type {
  types: Type[];
  identifier: Identifier;

  constructor(identifier: Identifier, types: Type[]) {
    super();
    this.identifier = identifier;
    this.types = types;
  }
  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
  evaluate(): unknown {
    return undefined;
  }
}
export class FunctionType extends Type {
  returnType: Type;
  paramTypes: Type[];

  constructor(returnType: Type, paramTypes: Type[]) {
    super();
    this.returnType = returnType;
    this.paramTypes = paramTypes;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
  evaluate(): unknown {
    return undefined;
  }
}
export class ArrayType extends Type {
  _type: Type;
  _size: number;

  constructor(type: Type, size: number) {
    super();
    this._type = type;
    this._size = size;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
  evaluate(): unknown {
    return undefined;
  }
}
export class Program implements ASTNode {
  stmts: ASTNode[];
  scope: Scope;

  constructor(stmts: ASTNode[]) {
    this.stmts = stmts;
  }

  children(): ASTNode[] {
    const children: ASTNode[] = new Array<ASTNode>();
    children.push(...this.stmts);
    return children;
  }
  evaluate(): unknown {
    this.children()
      .filter((child) => !(child instanceof FunDeclaration))
      .forEach((stmt) => stmt.evaluate());
    popOutOfScopeVars(this, varStacks);
    return undefined;
  }
}
export abstract class Stmt implements ASTNode {
  abstract children(): ASTNode[];
  abstract evaluate(): unknown;
  stmtType: Type;

  constructor(type: Type) {
    this.stmtType = type;
  }
}
export abstract class Expr extends Stmt {
  constructor(type: Type) {
    super(type);
  }
}
export class Parameter extends Stmt {
  identifier: Identifier;

  constructor(paramType: Type, identifier: Identifier) {
    super(paramType);
    this.identifier = identifier;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.stmtType);
    children.push(this.identifier);
    return children;
  }

  evaluate(): unknown {
    return undefined;
  }
}
export class FunDeclaration extends Stmt {
  identifier: Identifier;
  params: Parameter[];
  _body: Stmt;
  scope: Scope;

  constructor(
    type: Type,
    identifier: Identifier,
    params: Parameter[],
    body: Stmt,
  ) {
    const paramTypes: Type[] = params.map((param) => param.stmtType);
    super(new FunctionType(type, paramTypes));
    this.identifier = identifier;
    this.params = params;
    this._body = body;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.stmtType);
    children.push(this.identifier);
    children.push(...this.params);
    children.push(this._body);
    return children;
  }
  evaluate(): unknown {
    if (libFunctions.has(this)) {
      const args = this.params.map((param) => varStacks.get(param).pop());
      return libFunctions.get(this)(...args);
    }
    let returnValue = this._body.evaluate();
    if (returnValue instanceof Return && returnValue.possibleValue !== null)
      returnValue = getValueOfExpression(
        returnValue.possibleValue.evaluate(),
        varStacks,
      );
    popOutOfScopeVars(this, varStacks);
    return returnValue;
  }
}
export class VarDeclaration extends Stmt {
  identifier: Identifier;
  value: Expr;

  constructor(type: Type, identifier: Identifier, value: Expr) {
    super(type);
    this.identifier = identifier;
    this.value = value;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.identifier);
    children.push(this.value);
    return children;
  }

  evaluate(): unknown {
    const value =
      this.value instanceof AnonymousFunDeclaration
        ? this.value
        : getValueOfExpression(this.value.evaluate(), varStacks);
    const varStack = varStacks.get(this);
    if (varStack === undefined) varStacks.set(this, [value]);
    else varStack.push(value);
    return undefined;
  }
}
export class Return extends Stmt {
  possibleValue: Expr;

  constructor(possibleValue: Expr) {
    super(new BaseType(BaseTypeKind.NONE));
    this.possibleValue = possibleValue;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    if (this.possibleValue !== null) children.push(this.possibleValue);
    return children;
  }

  evaluate(): unknown {
    return this;
  }
}
export class If extends Stmt {
  condition: Expr;
  ifStmt: Stmt;
  possibleElseStmt: Stmt;

  constructor(condition: Expr, ifStmt: Stmt, possibleElseStmt: Stmt) {
    super(new BaseType(BaseTypeKind.NONE));
    this.condition = condition;
    this.ifStmt = ifStmt;
    this.possibleElseStmt = possibleElseStmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.condition);
    children.push(this.ifStmt);
    if (this.possibleElseStmt !== null) children.push(this.possibleElseStmt);
    return children;
  }

  evaluate(): unknown {
    if (<boolean>getValueOfExpression(this.condition.evaluate(), varStacks))
      return this.ifStmt.evaluate();
    else if (this.possibleElseStmt !== null)
      return this.possibleElseStmt.evaluate();
  }
}
export class While extends Stmt {
  condition: Expr;
  whileStmt: Stmt;

  constructor(condition: Expr, whileStmt: Stmt) {
    super(new BaseType(BaseTypeKind.NONE));
    this.condition = condition;
    this.whileStmt = whileStmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.condition);
    children.push(this.whileStmt);
    return children;
  }
  evaluate(): unknown {
    let returnValue = undefined;
    while (<boolean>getValueOfExpression(this.condition.evaluate(), varStacks))
      returnValue = this.whileStmt.evaluate();
    return returnValue;
  }
}
export class Block extends Stmt {
  stmts: Stmt[];
  scope: Scope;

  constructor(stmts: Stmt[]) {
    super(new BaseType(BaseTypeKind.NONE));
    this.stmts = stmts;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.stmts);
    return children;
  }

  evaluate(): unknown {
    let returnNode = undefined;
    for (let i = 0; i < this.stmts.length; i++) {
      returnNode = this.stmts[i].evaluate();
      if (returnNode instanceof Return) break;
    }
    if (returnNode instanceof Return && returnNode.possibleValue !== null)
      returnNode = getValueOfExpression(
        returnNode.possibleValue.evaluate(),
        varStacks,
      );
    popOutOfScopeVars(this, varStacks);
    return returnNode;
  }
}
export class BinaryExpr extends Expr {
  leftExpr: Expr;
  operator: string;
  rightExpr: Expr;

  constructor(type: Type, operator: string, leftExpr: Expr, rightExpr: Expr) {
    super(type);
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

  evaluate(): unknown {
    let leftHandExp = this.leftExpr.evaluate();
    const rightHandExp =
      this.rightExpr instanceof AnonymousFunDeclaration
        ? this.rightExpr
        : getValueOfExpression(this.rightExpr.evaluate(), varStacks);
    if (this.operator === "=") {
      if (leftHandExp instanceof Identifier) {
        const varStack = varStacks.get(
          <VarDeclaration | Parameter>(<Identifier>leftHandExp).declaration,
        );
        varStack[varStack.length - 1] = rightHandExp;
      } else if (leftHandExp instanceof ArrayRepresentation)
        leftHandExp.array[leftHandExp.index] = rightHandExp;
      return rightHandExp;
    }
    leftHandExp = getValueOfExpression(leftHandExp, varStacks);
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
export class UnaryExpr extends Expr {
  operator: string;
  expr: Expr;

  constructor(type: Type, operator: string, expr: Expr) {
    super(type);
    this.operator = operator;
    this.expr = expr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.expr);
    return children;
  }
  evaluate(): unknown {
    const expression = getValueOfExpression(this.expr.evaluate(), varStacks);
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
export class ArrayAccess extends Expr {
  arrayExpr: Expr;
  accessExpr: Expr;

  constructor(arrayExpr: Expr, accessExpr: Expr) {
    super(null);
    this.arrayExpr = arrayExpr;
    this.accessExpr = accessExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.arrayExpr);
    children.push(this.accessExpr);
    return children;
  }

  evaluate(): unknown {
    const indices = new Array<number>();
    let arrayBase = <ArrayAccess>this;
    while (true) {
      indices.push(
        <number>(
          getValueOfExpression(arrayBase.accessExpr.evaluate(), varStacks)
        ),
      );
      if (!((<ArrayAccess>arrayBase).arrayExpr instanceof ArrayAccess)) break;
      arrayBase = <ArrayAccess>arrayBase.arrayExpr;
    }
    let returnArray = <unknown[]>(
      varStacks
        .get(
          <VarDeclaration | Parameter>(
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
export class AttributeAccess extends Expr {
  containerExpr: Expr;
  callExpr: Expr;

  constructor(containerExpr: Expr, callExpr: Expr) {
    super(null);
    this.containerExpr = containerExpr;
    this.callExpr = callExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.containerExpr);
    children.push(this.callExpr);
    return children;
  }
  evaluate(): unknown {
    return undefined;
  }
}
export class FunCall extends Expr {
  identifier: Expr;
  args: Expr[];

  constructor(type: Type, identifier: Expr, args: Expr[]) {
    super(type);
    this.identifier = identifier;
    this.args = args;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.identifier);
    if (this.args !== null) children.push(...this.args);
    return children;
  }

  evaluate(): unknown {
    const funDecl = <FunDeclaration | AnonymousFunDeclaration>(
      getValueOfExpression(this.identifier.evaluate(), varStacks)
    );
    this.args.forEach((arg, pos) => {
      const value = getValueOfExpression(arg.evaluate(), varStacks);
      const paramStack = varStacks.get(
        (<FunDeclaration | AnonymousFunDeclaration>funDecl).params[pos],
      );
      if (paramStack === undefined)
        varStacks.set(
          (<FunDeclaration | AnonymousFunDeclaration>funDecl).params[pos],
          [value],
        );
      else paramStack.push(value);
    });
    return funDecl.evaluate();
  }
}
export class AnonymousFunDeclaration extends Expr {
  params: Parameter[];
  _body: Stmt;
  scope: Scope;

  constructor(type: Type, params: Parameter[], body: Stmt) {
    const paramTypes: Type[] = params.map((param) => param.stmtType);
    super(new FunctionType(type, paramTypes));
    this.params = params;
    this._body = body;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.stmtType);
    children.push(...this.params);
    children.push(this._body);
    return children;
  }
  evaluate(): unknown {
    let returnValue = this._body.evaluate();
    if (returnValue instanceof Return && returnValue.possibleValue !== null)
      returnValue = getValueOfExpression(
        returnValue.possibleValue.evaluate(),
        varStacks,
      );
    popOutOfScopeVars(this, varStacks);
    return returnValue;
  }
}
export class StringLiteral extends Expr {
  value: string;

  constructor(value: string) {
    super(new BaseType(BaseTypeKind.STRING));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  evaluate(): unknown {
    return this.value;
  }
}
export class BoolLiteral extends Expr {
  value: boolean;

  constructor(value: boolean) {
    super(new BaseType(BaseTypeKind.BOOL));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  evaluate(): unknown {
    return this.value;
  }
}
export class NumberLiteral extends Expr {
  value: number;

  constructor(value: number) {
    super(new BaseType(BaseTypeKind.NUMBER));
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  evaluate(): unknown {
    return this.value;
  }
}
export class ArrayLiteral extends Expr {
  value: Expr[];

  constructor(value: Expr[]) {
    super(new ArrayType(new BaseType(BaseTypeKind.NONE), value.length));
    this.value = value;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.value);
    return children;
  }
  evaluate(): unknown {
    return this.value.map((exp) =>
      getValueOfExpression(exp.evaluate(), varStacks),
    );
  }
}
export class Identifier extends Expr {
  value: string;
  declaration: VarDeclaration | Parameter | FunDeclaration | TypeType;

  constructor(value: string) {
    super(new BaseType(BaseTypeKind.NONE));
    this.value = value;
  }
  children(): ASTNode[] {
    return new Array<ASTNode>();
  }

  evaluate(): unknown {
    return this;
  }
}

//Dictionary of predefined functions implemented in TS to be called in TCShell
export const libFunctions = new Map<
  FunDeclaration,
  (...args: unknown[]) => unknown
>();

libFunctions.set(
  new FunDeclaration(
    new BaseType(BaseTypeKind.VOID),
    new Identifier("print"),
    [new Parameter(new BaseType(BaseTypeKind.ANY), new Identifier("message"))],
    new Block(new Array<Stmt>()),
  ),
  (...args) => console.log(args[0]),
);
libFunctions.set(
  new FunDeclaration(
    new BaseType(BaseTypeKind.NUMBER),
    new Identifier("len"),
    [
      new Parameter(
        new ArrayType(new BaseType(BaseTypeKind.ANY), -1),
        new Identifier("array"),
      ),
    ],
    new Block(new Array<Stmt>()),
  ),
  (...args) => (<unknown[]>args[0]).length,
);
