import { Scope } from "./semantics.js";

export interface ASTNode {
  children(): ASTNode[];
}

export enum BaseTypeKind {
  NUMBER,
  STRING,
  BOOL,
  VOID,
  NONE,
}

export abstract class Type implements ASTNode {
  abstract children(): ASTNode[];
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
}
export class ArrayType extends Type {
  type: Type;
  size: number;

  constructor(type: Type) {
    super();
    this.type = type;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
}
export class Program implements ASTNode {
  declarations: ASTNode[];
  scope: Scope;

  constructor(declarations: ASTNode[]) {
    this.declarations = declarations;
  }

  children(): ASTNode[] {
    const children: ASTNode[] = new Array<ASTNode>();
    children.push(...this.declarations);
    return children;
  }
}
export abstract class Stmt implements ASTNode {
  abstract children(): ASTNode[];
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
}
export class FunDeclaration implements ASTNode {
  funType: Type;
  identifier: Identifier;
  params: Parameter[];
  block: Block;
  scope: Scope;

  constructor(
    type: Type,
    identifier: Identifier,
    params: Parameter[],
    block: Block,
  ) {
    this.funType = type;
    this.identifier = identifier;
    this.params = params;
    this.block = block;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.funType);
    children.push(...this.params);
    children.push(this.block);
    return children;
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
}
export class ArrayAccess extends Expr {
  arrayExpr: Expr;
  accessExpr: Expr;

  constructor(type: Type, arrayExpr: Expr, accessExpr: Expr) {
    super(type);
    this.arrayExpr = arrayExpr;
    this.accessExpr = accessExpr;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.arrayExpr);
    children.push(this.accessExpr);
    return children;
  }
}
export class FunCall extends Expr {
  identifier: Identifier;
  args: Expr[];

  constructor(type: Type, identifier: Identifier, args: Expr[]) {
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
}
export class ArrayLiteral extends Expr {
  value: Expr[];

  constructor(value: Expr[]) {
    super(new ArrayType(new BaseType(BaseTypeKind.NONE)));
    this.value = value;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.value);
    return children;
  }
}
export class Identifier extends Expr {
  value: string;
  declaration: VarDeclaration | Parameter | FunDeclaration;

  constructor(value: string) {
    super(new BaseType(BaseTypeKind.NONE));
    this.value = value;
  }
  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
}

export const libFunctions = [
  new FunDeclaration(
    new BaseType(BaseTypeKind.VOID),
    new Identifier("print"),
    [new Parameter(new BaseType(BaseTypeKind.NONE), new Identifier("message"))],
    new Block(new Array<Stmt>()),
  ),
];
