export interface ASTNode {
  children(): ASTNode[];
}

export class Program implements ASTNode {
  declarations: ASTNode[];

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
  stmtType: string;

  constructor(type: string) {
    this.stmtType = type;
  }
}
export abstract class Expr extends Stmt implements ASTNode {
  constructor(type: string) {
    super(type);
  }
}

export class FunDeclaration implements ASTNode {
  funType: string;
  identifier: Identifier;
  argTypes: string[];
  argIdentifiers: Identifier[];
  block: Block;

  constructor(
    type: string,
    identifier: Identifier,
    argTypes: string[],
    argIdentifiers: Identifier[],
    block: Block,
  ) {
    this.funType = type;
    this.identifier = identifier;
    this.argTypes = argTypes;
    this.argIdentifiers = argIdentifiers;
    this.block = block;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.argIdentifiers);
    children.push(this.block);
    return children;
  }
}
export class VarDeclaration extends Stmt implements ASTNode {
  identifier: Identifier;
  value: Expr;

  constructor(type: string, identifier: Identifier, value: Expr) {
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
export class Return extends Stmt implements ASTNode {
  possibleValue: Expr;

  constructor(type: string, possibleValue: Expr) {
    super(type);
    this.possibleValue = possibleValue;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    if (this.possibleValue != null) children.push(this.possibleValue);
    return children;
  }
}
export class If extends Stmt implements ASTNode {
  condition: Expr;
  ifStmt: Stmt;
  possibleElseStmt: Stmt;

  constructor(
    type: string,
    condition: Expr,
    ifStmt: Stmt,
    possibleElseStmt: Stmt,
  ) {
    super(type);
    this.condition = condition;
    this.ifStmt = ifStmt;
    this.possibleElseStmt = possibleElseStmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.condition);
    children.push(this.ifStmt);
    if (this.possibleElseStmt != null) children.push(this.possibleElseStmt);
    return children;
  }
}
export class While extends Stmt implements ASTNode {
  condition: Expr;
  whileStmt: Stmt;

  constructor(type: string, condition: Expr, whileStmt: Stmt) {
    super(type);
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
export class Block extends Stmt implements ASTNode {
  stmts: Stmt[];

  constructor(type: string, stmts: Stmt[]) {
    super(type);
    this.stmts = stmts;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.stmts);
    return children;
  }
}
export class BinaryExpr extends Expr implements ASTNode {
  leftExpr: Expr;
  operator: string;
  rightExpr: Expr;

  constructor(type: string, operator: string, leftExpr: Expr, rightExpr: Expr) {
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
export class UnaryExpr extends Expr implements ASTNode {
  operator: string;
  expr: Expr;

  constructor(type: string, operator: string, expr: Expr) {
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
export class ArrayAccess extends Expr implements ASTNode {
  arrayExpr: Expr;
  accessExpr: Expr;

  constructor(type: string, arrayExpr: Expr, accessExpr: Expr) {
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
export class FunCall extends Expr implements ASTNode {
  identifier: Identifier;
  args: Expr[];

  constructor(type: string, identifier: Identifier, args: Expr[]) {
    super(type);
    this.identifier = identifier;
    this.args = args;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.identifier);
    if (this.args != null) children.push(...this.args);
    return children;
  }
}
export class StringLiteral extends Expr implements ASTNode {
  value: string;

  constructor(value: string) {
    super("string");
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
}
export class BoolLiteral extends Expr implements ASTNode {
  value: boolean;

  constructor(value: boolean) {
    super("bool");
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
}
export class NumberLiteral extends Expr implements ASTNode {
  value: number;

  constructor(value: number) {
    super("number");
    this.value = value;
  }

  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
}
export class Identifier extends Expr implements ASTNode {
  value: string;

  constructor(type: string, value: string) {
    super(type);
    this.value = value;
  }
  children(): ASTNode[] {
    return new Array<ASTNode>();
  }
}
