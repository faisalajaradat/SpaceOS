import { Scope } from "../semantics.js";
import {
  getTypeDeclaration,
  getValueOfExpression,
  isAnyType,
  isWildcard,
  parseSpatialTypeProperties,
  popOutOfScopeVars,
} from "../utils.js";
import * as engine from "../../../SpatialComputingEngine/src/frontend-objects.js";
import { fetchData } from "../../../SpatialComputingEngine/src/spatial-computing-engine.js";
import {
  ArrayRepresentation,
  ASTNode,
  dotString,
  ExprStmt,
  MatchCondition,
  newNodeId,
  RuntimeType,
  unresolved,
  varStacks,
} from "./program.js";
import { Expr, Identifier } from "./expr/Expr.js";
import {
  AirPathType,
  AnimateEntityType,
  ArrayType,
  BaseType,
  BaseTypeKind,
  BidirectionalDecorator,
  CompositionType,
  ControlledDecorator,
  DefaultBaseTypeInstance,
  DynamicEntityType,
  EnclosedSpaceType,
  EntityType,
  FunctionType,
  LandPathType,
  MobileDecorator,
  NotControlledDecorator,
  OpenSpaceType,
  PathType,
  PhysicalDecorator,
  RecordType,
  SmartEntityType,
  SpaceType,
  SpatialObjectType,
  SpatialType,
  StaticEntityType,
  StationaryDecorator,
  Type,
  UnidirectionalDecorator,
  UnionType,
  VirtualDecorator,
} from "./type/index.js";
import { FunDeclaration } from "./expr/index.js";

export abstract class Stmt implements ASTNode {
  abstract children(): ASTNode[];

  abstract print(): string;

  abstract evaluate(): Promise<unknown>;

  line: number;
  column: number;
  protected _type: RuntimeType;

  protected constructor(line: number, column: number, type: RuntimeType) {
    this.line = line;
    this.column = column;
    this._type = type;
  }

  getFilePos(): string {
    return "line: " + this.line + ", column: " + this.column + ", ";
  }

  get type(): Type {
    if (this._type instanceof Identifier) return getTypeDeclaration(this._type);
    return this._type;
  }

  set type(_type: RuntimeType) {
    this._type = _type;
  }
}

export class DeferDecorator extends Stmt {
  delegate: ExprStmt;
  scopeArgs: Identifier[];
  scopeParams: Parameter[];
  scope: Scope;

  constructor(line: number, column: number, scopeArgs: Identifier[]) {
    super(line, column, new BaseType(line, column, BaseTypeKind.NONE));
    this.scopeArgs = scopeArgs;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.scopeArgs);
    children.push(this.delegate);
    return children;
  }

  print(): string {
    const deferNodeId = newNodeId();
    dotString.push(deferNodeId + '[label=" defer "];\n');
    const scopeArgsNodeId = newNodeId();
    dotString.push(scopeArgsNodeId + '[label=" scope args "];\n');
    dotString.push(deferNodeId + "->" + scopeArgsNodeId + ";\n");
    this.scopeArgs
      .map((exp) => exp.print())
      .forEach((nodeId) =>
        dotString.push(scopeArgsNodeId + "->" + nodeId + ";\n"),
      );
    const delegateNodeId = this.delegate.print();
    dotString.push(deferNodeId + "->" + delegateNodeId + ";\n");
    return deferNodeId;
  }

  async evaluate(): Promise<unknown> {
    for (let pos = 0; pos < this.scopeArgs.length; pos++) {
      const arg = this.scopeArgs[pos];
      const value = getValueOfExpression(await arg.evaluate());
      const paramStack = varStacks.get(this.scopeParams[pos]);
      if (paramStack === undefined)
        varStacks.set(this.scopeParams[pos], [value]);
      else paramStack.push(value);
    }
    await this.delegate.evaluate();
    popOutOfScopeVars(this);
    return undefined;
  }
}

export class Parameter extends Stmt {
  identifier: Identifier;

  constructor(
    line: number,
    column: number,
    paramType: RuntimeType,
    identifier: Identifier,
  ) {
    super(line, column, paramType);
    this.identifier = identifier;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._type);
    children.push(this.identifier);
    return children;
  }

  print(): string {
    const paramNodeId = newNodeId();
    dotString.push(paramNodeId + '[label=" Param "];\n');
    const typeNodeId = this._type.print();
    const identifierNodeId = this.identifier.print();
    dotString.push(paramNodeId + "->" + typeNodeId + ";\n");
    dotString.push(paramNodeId + "->" + identifierNodeId + ";\n");
    return paramNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }

  get paramType(): RuntimeType {
    return this._type instanceof Identifier
      ? this._type.declaration === undefined
        ? this._type
        : getTypeDeclaration(this._type)
      : this._type;
  }
}

export class VarDeclaration extends Stmt {
  identifier: Identifier;
  value: Expr;
  isPublic: boolean;

  constructor(
    line: number,
    column: number,
    type: RuntimeType,
    identifier: Identifier,
    value: Expr,
    isPublic: boolean,
  ) {
    super(line, column, type);
    this.identifier = identifier;
    this.value = value;
    this.isPublic = isPublic;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._type);
    children.push(this.identifier);
    children.push(this.value);
    return children;
  }

  print(): string {
    const varDeclNodeId = newNodeId();
    dotString.push(varDeclNodeId + '[label=" = "];\n');
    const typeNodeId = this._type.print();
    const identifierNodeId = this.identifier.print();
    const valueNodeId = this.value.print();
    dotString.push(varDeclNodeId + "->" + typeNodeId + ";\n");
    dotString.push(varDeclNodeId + "->" + identifierNodeId + ";\n");
    dotString.push(varDeclNodeId + "->" + valueNodeId + ";\n");
    return varDeclNodeId;
  }

  async evaluate(): Promise<void> {
    const value =
      this.value instanceof FunDeclaration
        ? this.value
        : getValueOfExpression(await this.value.evaluate());
    const varStack = varStacks.get(this);
    if (varStack === undefined) varStacks.set(this, [value]);
    else varStack.push(value);
  }
}

export class UnionDeclaration extends Stmt {
  protected _options: RuntimeType[];

  constructor(
    line: number,
    column: number,
    unionType: UnionType,
    options: RuntimeType[],
  ) {
    super(line, column, unionType);
    this._options = options;
  }

  children(): ASTNode[] {
    return [...this._options];
  }

  print(): string {
    const unionDeclNodeId = newNodeId();
    dotString.push(unionDeclNodeId + '[label= "Union"];\n');
    const unionTypeNodeId = this._type.print();
    dotString.push(unionDeclNodeId + "->" + unionTypeNodeId + ";\n");
    this._options
      .map((option) => option.print())
      .forEach((nodeId) =>
        dotString.push(unionDeclNodeId + "->" + nodeId + ";\n"),
      );
    return unionDeclNodeId;
  }

  async evaluate(): Promise<void> {
    return undefined;
  }

  get options(): Type[] {
    return this._options.map((option) =>
      option instanceof Identifier ? getTypeDeclaration(option) : option,
    );
  }
}

export class AliasTypeDeclaration extends Stmt {
  aliasedType: RuntimeType;
  alias: Identifier;

  constructor(
    line: number,
    column: number,
    alias: Identifier,
    aliasedType: RuntimeType,
  ) {
    super(line, column, DefaultBaseTypeInstance.NONE);
    this.alias = alias;
    this.aliasedType = aliasedType;
  }

  children(): ASTNode[] {
    return [this.alias, this.aliasedType];
  }

  print(): string {
    const aliasTypeDeclarationNodeId = newNodeId();
    dotString.push(aliasTypeDeclarationNodeId + '[label=" = "];\n');
    this.children()
      .map((child) => child.print())
      .forEach((nodeId) =>
        dotString.push(aliasTypeDeclarationNodeId + "->" + nodeId + ";\n"),
      );
    return aliasTypeDeclarationNodeId;
  }

  evaluate(): Promise<unknown> {
    return undefined;
  }
}

export class RecordDeclaration extends Stmt {
  fields: Parameter[];
  defaultRecordImplementation: object;

  constructor(
    line: number,
    column: number,
    recordType: RecordType,
    fields: Parameter[],
  ) {
    super(line, column, recordType);
    this.fields = fields;
    this.defaultRecordImplementation = undefined;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this._type, ...this.fields);
    return children;
  }

  print(): string {
    const recordDeclarationNodeId = newNodeId();
    dotString.push(
      recordDeclarationNodeId + '[label=" RecordDeclaration "];\n',
    );
    const recordTypeNodeId = this._type.print();
    dotString.push(recordDeclarationNodeId + "->" + recordTypeNodeId + ";\n");
    this.fields
      .map((field) => field.print())
      .forEach((nodeId) =>
        dotString.push(recordDeclarationNodeId + "->" + nodeId + ";\n"),
      );
    return recordDeclarationNodeId;
  }

  async fieldDefaultImplementation(field: Parameter): Promise<object> {
    const value = field.type.equals(DefaultBaseTypeInstance.NUMBER)
      ? 0
      : field.type.equals(DefaultBaseTypeInstance.BOOL)
        ? false
        : field.type instanceof ArrayType
          ? []
          : field.type instanceof RecordType
            ? await field.type.identifier.declaration.evaluate()
            : "";
    return { [field.identifier.value]: { value: value, writable: true } };
  }

  async evaluate(): Promise<object> {
    if (this.defaultRecordImplementation === undefined)
      this.defaultRecordImplementation = Object.assign(
        {},
        ...(await Promise.all(
          this.fields.map(
            async (field) => await this.fieldDefaultImplementation(field),
          ),
        )),
      );
    return { ...this.defaultRecordImplementation };
  }
}

export class Return extends Stmt {
  possibleValue: Expr;

  constructor(line: number, column: number, possibleValue: Expr) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
    this.possibleValue = possibleValue;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    if (this.possibleValue !== undefined) children.push(this.possibleValue);
    return children;
  }

  print(): string {
    const returnNodeId = newNodeId();
    dotString.push(returnNodeId + '[label=" return "];\n');
    if (this.possibleValue === null) return returnNodeId;
    const valueNodeId = this.possibleValue.print();
    dotString.push(returnNodeId + "->" + valueNodeId + ";\n");
    return returnNodeId;
  }

  async evaluate(): Promise<Return> {
    return this;
  }
}

export class If extends Stmt {
  condition: Expr;
  ifStmt: ExprStmt;
  possibleElseStmt: ExprStmt;

  constructor(
    line: number,
    column: number,
    condition: Expr,
    ifStmt: ExprStmt,
    possibleElseStmt: ExprStmt,
  ) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
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

  print(): string {
    const ifNodeId = newNodeId();
    dotString.push(ifNodeId + '[label=" if "];\n');
    let elseStmtNodeId = "";
    let elseNodeId = "";
    const conditionNodeId = this.condition.print();
    const stmtNodeId = this.ifStmt.print();
    if (this.possibleElseStmt !== null) {
      elseNodeId = newNodeId();
      dotString.push(elseNodeId + '[label=" else "];\n');
      elseStmtNodeId = this.possibleElseStmt.print();
    }
    dotString.push(ifNodeId + "->" + conditionNodeId + ";\n");
    dotString.push(ifNodeId + "->" + stmtNodeId + ";\n");
    if (elseNodeId !== "") {
      dotString.push(ifNodeId + "->" + elseNodeId + ";\n");
      dotString.push(elseNodeId + "->" + elseStmtNodeId + ";\n");
    }
    return ifNodeId;
  }

  async evaluate(): Promise<unknown> {
    if (<boolean>getValueOfExpression(await this.condition.evaluate())) {
      if (this.ifStmt instanceof DeferDecorator) {
        unresolved.push(this.ifStmt.evaluate());
        return undefined;
      }
      return await this.ifStmt.evaluate();
    } else if (this.possibleElseStmt !== null) {
      if (this.possibleElseStmt instanceof DeferDecorator) {
        unresolved.push(this.possibleElseStmt.evaluate());
        return undefined;
      }
      return await this.possibleElseStmt.evaluate();
    }
  }
}

export class While extends Stmt {
  condition: Expr;
  whileStmt: ExprStmt;

  constructor(
    line: number,
    column: number,
    condition: Expr,
    whileStmt: ExprStmt,
  ) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
    this.condition = condition;
    this.whileStmt = whileStmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.condition);
    children.push(this.whileStmt);
    return children;
  }

  print(): string {
    const whileNodeId = newNodeId();
    dotString.push(whileNodeId + '[label=" while "];\n');
    const conditionNodeId = this.condition.print();
    const stmtNodeId = this.whileStmt.print();
    dotString.push(whileNodeId + "->" + conditionNodeId + ";\n");
    dotString.push(whileNodeId + "->" + stmtNodeId + ";\n");
    return whileNodeId;
  }

  async evaluate(): Promise<unknown> {
    let returnValue = undefined;
    while (<boolean>getValueOfExpression(await this.condition.evaluate())) {
      if (this.whileStmt instanceof DeferDecorator) {
        unresolved.push(this.whileStmt.evaluate());
        returnValue = undefined;
      } else returnValue = await this.whileStmt.evaluate();
    }
    return returnValue;
  }
}

export class Block extends Stmt {
  stmts: ExprStmt[];
  scope: Scope;

  constructor(line: number, column: number, stmts: ExprStmt[]) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
    this.stmts = stmts;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(...this.stmts);
    return children;
  }

  print(): string {
    const blockNodeId = newNodeId();
    dotString.push(blockNodeId + '[label=" Block "];\n');
    const stmtIds = new Array<string>();
    this.stmts.forEach((stmt) => stmtIds.push(stmt.print()));
    stmtIds.forEach((nodeId) =>
      dotString.push(blockNodeId + "->" + nodeId + ";\n"),
    );
    return blockNodeId;
  }

  async evaluate(): Promise<unknown> {
    let returnNode = undefined;
    for (let i = 0; i < this.stmts.length; i++) {
      if (this.stmts[i] instanceof DeferDecorator) {
        unresolved.push(this.stmts[i].evaluate());
        continue;
      }
      returnNode = await this.stmts[i].evaluate();
      if (returnNode instanceof Return) break;
    }
    if (returnNode instanceof Return && returnNode.possibleValue !== null)
      returnNode = getValueOfExpression(
        await returnNode.possibleValue.evaluate(),
      );
    popOutOfScopeVars(this);
    return returnNode;
  }
}

export class CaseStmt extends Stmt {
  matchCondition: MatchCondition;
  stmt: ExprStmt;
  scope: Scope;

  constructor(
    line: number,
    column: number,
    matchCondition: MatchCondition,
    stmt: ExprStmt,
  ) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
    this.matchCondition = matchCondition;
    this.stmt = stmt;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.matchCondition);
    children.push(this.stmt);
    return children;
  }

  print(): string {
    const caseStmtNodeId = newNodeId();
    dotString.push(caseStmtNodeId + '[label=" Case "];\n');
    const matchConditionNodeId = this.matchCondition.print();
    const stmtNodeId = this.stmt.print();
    dotString.push(caseStmtNodeId + "->" + matchConditionNodeId + ";\n");
    dotString.push(caseStmtNodeId + "->" + stmtNodeId + ";\n");
    return caseStmtNodeId;
  }

  async evaluate(): Promise<unknown> {
    let returnValue = undefined;
    if (this.stmt instanceof DeferDecorator)
      unresolved.push(this.stmt.evaluate());
    else {
      returnValue = await this.stmt.evaluate();
      if (returnValue instanceof Return && returnValue.possibleValue !== null)
        returnValue = getValueOfExpression(
          await returnValue.possibleValue.evaluate(),
        );
    }
    popOutOfScopeVars(this);
    return returnValue;
  }
}

export class Match extends Stmt {
  subject: Expr;
  caseStmts: CaseStmt[];

  constructor(
    line: number,
    column: number,
    subject: Expr,
    caseStmts: CaseStmt[],
  ) {
    super(line, column, new BaseType(-1, -1, BaseTypeKind.NONE));
    this.subject = subject;
    this.caseStmts = caseStmts;
  }

  async match(condition: MatchCondition, subject: unknown): Promise<boolean> {
    if (condition instanceof Expr)
      return subject === (await condition.evaluate());

    if (isAnyType(condition.type)) return true;
    if (condition.type instanceof BaseType)
      return typeof subject === (await condition.type.evaluate());
    if (
      condition.type instanceof ArrayType &&
      subject instanceof ArrayRepresentation
    ) {
      let subjectBase = subject.array;
      let conditionTypeBase = condition.type;
      while (
        conditionTypeBase instanceof ArrayType &&
        conditionTypeBase.type instanceof ArrayType &&
        Array.isArray(subjectBase[0])
      ) {
        conditionTypeBase = conditionTypeBase.type;
        subjectBase = subjectBase[0];
      }
      return (
        typeof subjectBase[0] ===
        (await (conditionTypeBase as ArrayType).type.evaluate())
      );
    }
    if (condition.type instanceof SpatialType && typeof subject === "string") {
      const [propertiesRaw, delegateTypeRaw] = parseSpatialTypeProperties(
        <SpatialType>condition.type,
      );
      const delegateType: SpatialType = delegateTypeRaw as SpatialType;
      const properties: Map<string, string | boolean> = propertiesRaw as Map<
        string,
        string | boolean
      >;
      let data = undefined;
      if (delegateType.equals(new SpatialType(-1, -1))) {
        for (const schema of [
          engine.ENTITY_SCHEMA,
          engine.SPACE_SCHEMA,
          engine.PATH_SCHEMA,
        ]) {
          const fetchedData = await fetchData(schema, subject);
          if (Object.keys(fetchedData).length > 0) data = fetchedData;
        }
        if (data === undefined) return false;
      } else {
        const schema = new SpaceType(-1, -1).contains(delegateType)
          ? engine.SPACE_SCHEMA
          : new EntityType(-1, -1).contains(delegateType)
            ? engine.ENTITY_SCHEMA
            : engine.PATH_SCHEMA;
        data = await fetchData(schema, subject);
        if (Object.keys(data).length === 0) return false;
      }
      let constructedType = undefined;
      switch (data._type) {
        case "Path": {
          constructedType = new PathType(-1, -1);
          break;
        }
        case "AirPath": {
          constructedType = new AirPathType(-1, -1);
          break;
        }
        case "LandPath": {
          constructedType = new LandPathType(-1, -1);
          break;
        }
        case "OpenSpace": {
          constructedType = new OpenSpaceType(-1, -1);
          break;
        }
        case "EnclosedSpace": {
          constructedType = new EnclosedSpaceType(-1, -1);
          break;
        }
        case "StaticEntity": {
          constructedType = new StaticEntityType(-1, -1);
          break;
        }
        case "AnimateEntity": {
          constructedType = new AnimateEntityType(-1, -1);
          break;
        }
        case "SmartEntity": {
          constructedType = new SmartEntityType(-1, -1);
          break;
        }
      }
      Array.from(properties.keys())
        .reverse()
        .forEach((property) => {
          if (property === "motion")
            constructedType =
              (<engine.DynamicEntity>data).motion === "mobile"
                ? new MobileDecorator(
                    -1,
                    -1,
                    <DynamicEntityType>constructedType,
                  )
                : new StationaryDecorator(
                    -1,
                    -1,
                    <DynamicEntityType>constructedType,
                  );
          if (property === "isControlled")
            constructedType = (<engine.SpatialObject>data).isControlled
              ? new ControlledDecorator(
                  -1,
                  -1,
                  <SpatialObjectType>constructedType,
                )
              : new NotControlledDecorator(
                  -1,
                  -1,
                  <SpatialObjectType>constructedType,
                );
          if (property === "direction")
            constructedType =
              (data as engine.Path).direction === "unidirectional"
                ? new UnidirectionalDecorator(
                    -1,
                    -1,
                    constructedType as PathType,
                  )
                : new BidirectionalDecorator(
                    -1,
                    -1,
                    constructedType as PathType,
                  );
          if (property === "locality")
            constructedType =
              data.locality === "physical"
                ? new PhysicalDecorator(-1, -1, constructedType)
                : new VirtualDecorator(-1, -1, constructedType);
        });
      return (condition.type as CompositionType).contains(constructedType);
    }
    return false;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.subject);
    children.push(...this.caseStmts);
    return children;
  }

  print(): string {
    const matchNodeId = newNodeId();
    dotString.push(matchNodeId + '[label=" Match "];\n');
    const subjectNodeId = this.subject.print();
    dotString.push(matchNodeId + "->" + subjectNodeId + ";\n");
    this.caseStmts
      .map((caseStmt) => caseStmt.print())
      .forEach((nodeId) => dotString.push(matchNodeId + "->" + nodeId + ";\n"));
    return matchNodeId;
  }

  async evaluate(): Promise<unknown> {
    const subjectValue = getValueOfExpression(await this.subject.evaluate());
    const sortedMatchCases = this.caseStmts.sort((a, b) => {
      if (
        (a.matchCondition instanceof Expr &&
          b.matchCondition instanceof Parameter) ||
        (isWildcard(b.matchCondition) && !isWildcard(a.matchCondition))
      )
        return -1;
      if (
        (a.matchCondition instanceof Parameter &&
          b.matchCondition instanceof Expr) ||
        isWildcard(a.matchCondition) ||
        !isWildcard(b.matchCondition)
      )
        return 1;
      return 0;
    });
    const matchedCases = new Array<CaseStmt>();
    for (const caseStmt of sortedMatchCases) {
      if (await this.match(caseStmt.matchCondition, subjectValue))
        matchedCases.push(caseStmt);
    }
    const matchedCase = matchedCases[0];
    if (
      matchedCase.matchCondition instanceof Parameter &&
      !isWildcard(matchedCase.matchCondition)
    ) {
      const paramStack = varStacks.get(matchedCase.matchCondition);
      if (paramStack === undefined)
        varStacks.set(matchedCase.matchCondition, [subjectValue]);
      else paramStack.push(subjectValue);
    }
    return await matchedCase.evaluate();
  }
}

export class ImportDeclaration extends Stmt {
  path: string;
  alias: Identifier;
  importedSymbols: VarDeclaration[];

  constructor(line: number, column: number, path: string, alias: Identifier) {
    super(line, column, new BaseType(line, column, BaseTypeKind.NONE));
    this.path = path;
    this.alias = alias;
  }

  children(): ASTNode[] {
    const children = new Array<ASTNode>();
    children.push(this.alias);
    return children;
  }

  print(): string {
    const importDeclarationNodeId = newNodeId();
    dotString.push(importDeclarationNodeId + '[label=" import "];\n');
    const pathNodeId = newNodeId();
    dotString.push(pathNodeId + '[label=" ' + this.path + ' "];\n');
    const aliasNodeId = this.alias.print();
    dotString.push(importDeclarationNodeId + "->" + pathNodeId + ";\n");
    dotString.push(importDeclarationNodeId + "->" + aliasNodeId + ";\n");
    return importDeclarationNodeId;
  }

  async evaluate(): Promise<unknown> {
    return await this.importedSymbols.forEach(
      async (varDecl) => await varDecl.evaluate(),
    );
  }
}

//Dictionary of predefined functions implemented in TS to be called in TCShell
export const libFunctions = new Map<
  VarDeclaration,
  (...args: unknown[]) => unknown
>();
libFunctions.set(
  new VarDeclaration(
    -1,
    -1,
    new FunctionType(-1, -1, new BaseType(-1, -1, BaseTypeKind.VOID), [
      new BaseType(-1, -1, BaseTypeKind.ANY),
    ]),
    new Identifier(-1, -1, "print"),
    new FunDeclaration(
      -1,
      -1,
      new BaseType(-1, -1, BaseTypeKind.VOID),
      [
        new Parameter(
          -1,
          -1,
          new BaseType(-1, -1, BaseTypeKind.ANY),
          new Identifier(-1, -1, "message"),
        ),
      ],
      new Block(-1, -1, []),
    ),
    false,
  ),
  (...args) => console.log(args[0]),
);
libFunctions.set(
  new VarDeclaration(
    -1,
    -1,
    new FunctionType(-1, -1, new BaseType(-1, -1, BaseTypeKind.NUMBER), [
      new ArrayType(-1, -1, new BaseType(-1, -1, BaseTypeKind.ANY), -1),
    ]),
    new Identifier(-1, -1, "len"),
    new FunDeclaration(
      -1,
      -1,
      new BaseType(-1, -1, BaseTypeKind.NUMBER),
      [
        new Parameter(
          -1,
          -1,
          new ArrayType(-1, -1, new BaseType(-1, -1, BaseTypeKind.ANY), -1),
          new Identifier(-1, -1, "array"),
        ),
      ],
      new Block(-1, -1, new Array<ExprStmt>()),
    ),
    false,
  ),
  (...args) => (<unknown[]>args[0]).length,
);
libFunctions.set(
  new VarDeclaration(
    -1,
    -1,
    new FunctionType(-1, -1, new BaseType(-1, -1, BaseTypeKind.NUMBER), [
      new ArrayType(-1, -1, new BaseType(-1, -1, BaseTypeKind.ANY), -1),
      new BaseType(-1, -1, BaseTypeKind.ANY),
    ]),
    new Identifier(-1, -1, "push"),
    new FunDeclaration(
      -1,
      -1,
      new BaseType(-1, -1, BaseTypeKind.NUMBER),
      [
        new Parameter(
          -1,
          -1,
          new ArrayType(-1, -1, new BaseType(-1, -1, BaseTypeKind.ANY), -1),
          new Identifier(-1, -1, "array"),
        ),
        new Parameter(
          -1,
          -1,
          new BaseType(-1, -1, BaseTypeKind.ANY),
          new Identifier(-1, -1, "element"),
        ),
      ],
      new Block(-1, -1, new Array<ExprStmt>()),
    ),
    false,
  ),
  (...args) => (<unknown[]>args[0]).push(<unknown>args[1]),
);
libFunctions.set(
  new VarDeclaration(
    -1,
    -1,
    new FunctionType(-1, -1, new BaseType(-1, -1, BaseTypeKind.VOID), [
      new ArrayType(-1, -1, new BaseType(-1, -1, BaseTypeKind.ANY), -1),
      new BaseType(-1, -1, BaseTypeKind.NUMBER),
      new BaseType(-1, -1, BaseTypeKind.NUMBER),
    ]),
    new Identifier(-1, -1, "removeElements"),
    new FunDeclaration(
      -1,
      -1,
      new BaseType(-1, -1, BaseTypeKind.VOID),
      [
        new Parameter(
          -1,
          -1,
          new ArrayType(-1, -1, new BaseType(-1, -1, BaseTypeKind.ANY), -1),
          new Identifier(-1, -1, "array"),
        ),
        new Parameter(
          -1,
          -1,
          new BaseType(-1, -1, BaseTypeKind.NUMBER),
          new Identifier(-1, -1, "startIndex"),
        ),
        new Parameter(
          -1,
          -1,
          new BaseType(-1, -1, BaseTypeKind.NUMBER),
          new Identifier(-1, -1, "count"),
        ),
      ],
      new Block(-1, -1, new Array<ExprStmt>()),
    ),
    false,
  ),
  (...args) => (<unknown[]>args[0]).splice(<number>args[1], <number>args[2]),
);
