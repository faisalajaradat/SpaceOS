import {grammar} from "./grammar.js";
import {
    Block,
    CaseStmt,
    DeferredDecorator,
    If,
    libFunctions,
    Match,
    Parameter,
    Return,
    UnionDeclaration,
    VarDeclaration,
    While
} from "./core/stmts.js";
import {
    AirPathType,
    AnimateEntityType,
    ArrayAccess,
    ArrayLiteral,
    ArrayType,
    BaseType,
    BaseTypeKind,
    BinaryExpr,
    BoolLiteral,
    ControlledDecorator,
    DynamicEntityType,
    EnclosedSpaceType,
    EntityFactoryType,
    EntityType,
    FunctionType,
    FunDeclaration,
    Identifier,
    LandPathType,
    MobileDecorator,
    NoneLiteral,
    NotControlledDecorator,
    NumberLiteral,
    OpenSpaceType,
    PathFactoryType,
    PathType,
    PhysicalDecorator,
    SmartEntityType,
    SpaceFactoryType,
    SpacePathGraphType,
    SpaceType,
    SpacialObjectInstantiationExpr,
    SpatialObjectType,
    SpatialType,
    StaticEntityType,
    StationaryDecorator,
    StringLiteral,
    UnaryExpr,
    UnionType,
    VirtualDecorator
} from "./core/index.js";
import {Program} from "./core/program.js";
import {TypeCast} from "./core/expr/TypeCast.js";
import {FunCall} from "./core/expr/FunCall.js";
import { MatchResult } from "ohm-js";

export function ast(match: MatchResult) {
    return astBuilder(match).ast();
}

//Describe how to build AST for each Ohm rule
const astBuilder = grammar.createSemantics().addOperation("ast", {
    Program(stmts) {
        const lineAndColumn = this.source.getLineAndColumn();
        const _program = new Program(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            stmts.ast(),
        );
        libFunctions.forEach((value, key) => _program.stmts.unshift(key));
        return _program;
    },
    Stmt_simple(simpleStatements, _newline) {
        return simpleStatements.ast()[0];
    },
    Stmt_compound(compoundStatement) {
        return compoundStatement.ast();
    },
    SimpleStmts(nonemptyListWithOptionalEndSep) {
        return nonemptyListWithOptionalEndSep.ast();
    },
    SimpleStmt_return(returnKeyword, possibleExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new Return(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            possibleExpression.ast()[0],
        );
    },
    SimpleStmt(simpleStmt) {
        return simpleStmt.ast();
    },
    CompoundStmt_block(block) {
        return block.ast();
    },
    CompoundStmt_if(
        ifKeyword,
        expression,
        ifStatement,
        possibleElseKeyword,
        possibleElseStatement,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new If(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            expression.ast(),
            ifStatement.ast(),
            possibleElseStatement.ast()[0] ?? null,
        );
    },
    CompoundStmt_while(whileKeyword, expression, statement) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new While(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            expression.ast(),
            statement.ast(),
        );
    },
    CompoundStmt_match(
        possibleDeferDeclaration,
        _match,
        expression,
        _leftBracket,
        caseStmts,
        _rightBracket,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        const matchStmt = new Match(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            expression.ast(),
            caseStmts.ast(),
        );
        const deferDeclaration = possibleDeferDeclaration.ast()[0];
        if (deferDeclaration === undefined) return matchStmt;
        (<DeferredDecorator>deferDeclaration).delegate = matchStmt;
        return deferDeclaration;
    },
    CaseStmt(condition, _arrow, stmt) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new CaseStmt(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            condition.ast(),
            stmt.ast(),
        );
    },
    Exp(assignExpression) {
        return assignExpression.ast();
    },
    AssignExp_assign(unaryExpression, _equal, assignExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BinaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            _equal.sourceString,
            unaryExpression.ast(),
            assignExpression.ast(),
        );
    },
    AssignExp(lorExpression) {
        return lorExpression.ast();
    },
    LorExp_lor(lorExpression, _lor, larExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BinaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            _lor.sourceString,
            lorExpression.ast(),
            larExpression.ast(),
        );
    },
    LorExp(larExpression) {
        return larExpression.ast();
    },
    LarExp_lar(larExpression, _lar, eqExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BinaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            _lar.sourceString,
            larExpression.ast(),
            eqExpression.ast(),
        );
    },
    LarExp(eqExpression) {
        return eqExpression.ast();
    },
    EqExp_eq(eqExpression, operator, relExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BinaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            operator.sourceString,
            eqExpression.ast(),
            relExpression.ast(),
        );
    },
    EqExp(relExpression) {
        return relExpression.ast();
    },
    RelExp_rel(relExpression, operator, addExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BinaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            operator.sourceString,
            relExpression.ast(),
            addExpression.ast(),
        );
    },
    RelExp(addExpression) {
        return addExpression.ast();
    },
    AddExp_add(addExpression, operator, multExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BinaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            operator.sourceString,
            addExpression.ast(),
            multExpression.ast(),
        );
    },
    AddExp(multExpression) {
        return multExpression.ast();
    },
    MultExp_mult(multExpression, operator, unaryExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BinaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            operator.sourceString,
            multExpression.ast(),
            unaryExpression.ast(),
        );
    },
    MultExp(unaryExpression) {
        return unaryExpression.ast();
    },
    UnaryExp_unary(operator, unaryExpression) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new UnaryExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            operator.sourceString,
            unaryExpression.ast(),
        );
    },
    UnaryExp_typecast(
        _leftParenthesis,
        _type,
        _rightParenthesis,
        unaryExpression,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new TypeCast(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            _type.ast(),
            unaryExpression.ast(),
        );
    },
    UnaryExp_new(_new, spatialType, _leftParenthesis, args, _rightParenthesis) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new SpacialObjectInstantiationExpr(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            spatialType.ast(),
            args.asIteration().ast(),
        );
    },
    UnaryExp(leftExpression) {
        return leftExpression.ast();
    },
    LeftExp_call(
        leftExpression,
        _leftParenthesis,
        listOfExpressions,
        _rightParenthesis,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new FunCall(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            leftExpression.ast(),
            listOfExpressions.asIteration().ast(),
        );
    },
    LeftExp_array(
        leftExpression,
        _leftSquareBracket,
        expression,
        _rightSquareBracket,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new ArrayAccess(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            leftExpression.ast(),
            expression.ast(),
        );
    },
    LeftExp(primaryExpression) {
        return primaryExpression.ast();
    },
    PrimaryExp_group(_leftParenthesis, expression, _rightParenthesis) {
        return expression.ast();
    },
    PrimaryExp_array(_leftBracket, listOfExpressions, _rightBracket) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new ArrayLiteral(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            listOfExpressions.asIteration().ast(),
        );
    },
    PrimaryExp_function(
        type,
        _leftParenthesis,
        listOfParameters,
        _rightParenthesis,
        stmt,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        const params =
            listOfParameters.sourceString === "none"
                ? []
                : listOfParameters.asIteration().ast();
        return new FunDeclaration(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            type.ast(),
            params,
            stmt.ast(),
        );
    },
    PrimaryExp(expression) {
        return expression.ast();
    },
    Block(_leftBracket, statements, _rightBracket) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new Block(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            statements.ast(),
        );
    },
    VarDeclaration(parameter, _equal, expression) {
        const lineAndColumn = this.source.getLineAndColumn();
        const typeAndIdentifier = parameter.ast();
        return new VarDeclaration(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            typeAndIdentifier._type,
            typeAndIdentifier.identifier,
            expression.ast(),
        );
    },
    UnionDeclaration(unionType, _equal, listOfTypes) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new UnionDeclaration(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            unionType.ast(),
            listOfTypes.asIteration().ast(),
        );
    },
    DeferDeclaration(
        _defer,
        _leftParenthesis,
        listOfIdentifiers,
        _rightParenthesis,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new DeferredDecorator(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            listOfIdentifiers.asIteration().ast(),
        );
    },
    Parameter(type, identifier) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new Parameter(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            type.ast(),
            identifier.ast(),
        );
    },
    Type(baseTypeDef, typeSpecifiers) {
        const baseType = baseTypeDef.ast();
        const numOfSpecifiers = <(ArrayType | FunctionType)[]>(
            typeSpecifiers.ast()
        );
        let fullType = baseType;
        numOfSpecifiers.forEach((specifier) => {
            if (specifier instanceof ArrayType) {
                (<ArrayType>specifier)._type = fullType;
                fullType = specifier;
            } else if (specifier instanceof FunctionType) {
                (<FunctionType>specifier).returnType = fullType;
                fullType = specifier;
            }
        });
        return fullType;
    },
    baseTypeKeyword(keyword) {
        const lineAndColumn = this.source.getLineAndColumn();
        let baseTypeKind = BaseTypeKind.NONE;
        switch (keyword.sourceString) {
            case "number":
                baseTypeKind = BaseTypeKind.NUMBER;
                break;
            case "string":
                baseTypeKind = BaseTypeKind.STRING;
                break;
            case "bool":
                baseTypeKind = BaseTypeKind.BOOL;
                break;
            case "void":
                baseTypeKind = BaseTypeKind.VOID;
                break;
        }
        return new BaseType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            baseTypeKind,
        );
    },
    UnionType(_union, identifier) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new UnionType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            identifier.ast(),
        );
    },
    TypeSpecifier_array(specifier) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new ArrayType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            -1,
        );
    },
    TypeSpecifier_function(_leftParenthesis, listOfTypes, _rightParenthesis) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new FunctionType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            null,
            listOfTypes.asIteration().ast(),
        );
    },
    SpatialType(spatialType) {
        return spatialType.ast();
    },
    MaybeVirtualSpatialType(possibleVirtualOrPhysical, spatialType) {
        const maybeVirtualSpatialType: SpatialType = spatialType.ast();
        const localityDescriptor = possibleVirtualOrPhysical.ast()[0];
        const localityLineAndColumn =
            possibleVirtualOrPhysical.source.getLineAndColumn();
        return localityDescriptor === undefined
            ? maybeVirtualSpatialType
            : localityDescriptor === "physical"
                ? new PhysicalDecorator(
                    localityLineAndColumn.lineNum,
                    localityLineAndColumn.colNum,
                    maybeVirtualSpatialType,
                )
                : new VirtualDecorator(
                    localityLineAndColumn.lineNum,
                    localityLineAndColumn.colNum,
                    maybeVirtualSpatialType,
                );
    },
    MaybeImmutableSpatialType(possibleImmutableOrMutable, spatialType) {
        const maybeImmutableSpatialType: SpatialObjectType = spatialType.ast();
        const controllDescriptor = possibleImmutableOrMutable.ast()[0];
        const controllLineAndColumn =
            possibleImmutableOrMutable.source.getLineAndColumn();
        return controllDescriptor === undefined
            ? maybeImmutableSpatialType
            : controllDescriptor === "mutable"
                ? new ControlledDecorator(
                    controllLineAndColumn.lineNum,
                    controllLineAndColumn.colNum,
                    maybeImmutableSpatialType,
                )
                : new NotControlledDecorator(
                    controllLineAndColumn.lineNum,
                    controllLineAndColumn.colNum,
                    maybeImmutableSpatialType,
                );
    },
    MaybeMobileSpatialType(possibleMobileOrStationary, spatialType) {
        const maybeMobileSpatialType: DynamicEntityType = spatialType.ast();
        const motionDescriptor = possibleMobileOrStationary.ast()[0];
        const motionLineAndColumn =
            possibleMobileOrStationary.source.getLineAndColumn();
        return motionDescriptor === undefined
            ? maybeMobileSpatialType
            : motionDescriptor === "stationary"
                ? new StationaryDecorator(
                    motionLineAndColumn.lineNum,
                    motionLineAndColumn.colNum,
                    maybeMobileSpatialType,
                )
                : new MobileDecorator(
                    motionLineAndColumn.lineNum,
                    motionLineAndColumn.colNum,
                    maybeMobileSpatialType,
                );
    },
    physical(_physical) {
        return this.sourceString;
    },
    virtual(_virtual) {
        return this.sourceString;
    },
    mutable(_mutable) {
        return this.sourceString;
    },
    immutable(_immutable) {
        return this.sourceString;
    },
    stationary(_stationary) {
        return this.sourceString;
    },
    mobile(_mobile) {
        return this.sourceString;
    },
    spatialTypeKeyword(_spatialType) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new SpatialType(lineAndColumn.lineNum, lineAndColumn.colNum);
    },
    landPath(_landPath) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new PhysicalDecorator(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            new LandPathType(lineAndColumn.lineNum, lineAndColumn.colNum),
        );
    },
    airPath(_airPath) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new PhysicalDecorator(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            new AirPathType(lineAndColumn.lineNum, lineAndColumn.colNum),
        );
    },
    spaceFactory(_spaceFactory) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new SpaceFactoryType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    entityFactory(_entityFactory) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new EntityFactoryType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    pathFactory(_pathFactory) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new PathFactoryType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    path(_path) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new PathType(lineAndColumn.lineNum, lineAndColumn.colNum);
    },
    spaceKeyword(_space) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new SpaceType(lineAndColumn.lineNum, lineAndColumn.colNum);
    },
    openSpace(_openSpace) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new OpenSpaceType(lineAndColumn.lineNum, lineAndColumn.colNum);
    },
    enclosedSpace(_enclosedSpace) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new EnclosedSpaceType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    entity(_entity) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new EntityType(lineAndColumn.lineNum, lineAndColumn.colNum);
    },
    staticEntity(_staticEntity) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new StaticEntityType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    dynamicEntity(_dynamicEntity) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new DynamicEntityType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    animateEntity(_animateEntity) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new AnimateEntityType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    smartEntity(_smartEntity) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new SmartEntityType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    spacePathGraph(_spacePathGraph) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new SpacePathGraphType(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
        );
    },
    wildcard(_underscore) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new Parameter(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            new BaseType(-1, -1, BaseTypeKind.ANY),
            new Identifier(lineAndColumn.lineNum, lineAndColumn.colNum, "_"),
        );
    },
    identifier(component) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new Identifier(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            this.sourceString,
        );
    },
    booleanLiteral(keyword) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new BoolLiteral(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            JSON.parse(this.sourceString),
        );
    },
    numberLiteral(
        component0,
        component1,
        component2,
        component3,
        component4,
        component5,
    ) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new NumberLiteral(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            Number(this.sourceString),
        );
    },
    stringLiteral_doublequotes(_leftDoubleQuote, chars, _rightDoubleQuote) {
        const lineAndColumn = this.source.getLineAndColumn();
        const value = this.sourceString.slice(1, this.sourceString.length - 1);
        return new StringLiteral(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            value,
        );
    },
    stringLiteral_singlequotes(_leftSingleQuote, chars, _rightSingleQuote) {
        const lineAndColumn = this.source.getLineAndColumn();
        const value = this.sourceString.slice(1, this.sourceString.length - 1);
        return new StringLiteral(
            lineAndColumn.lineNum,
            lineAndColumn.colNum,
            value,
        );
    },
    noneLiteral(keyword) {
        const lineAndColumn = this.source.getLineAndColumn();
        return new NoneLiteral(lineAndColumn.lineNum, lineAndColumn.colNum);
    },
    NonemptyListWithOptionalEndSep(nonemptyList, possibleSeperator) {
        return nonemptyList.asIteration().ast();
    },
    _iter(...children) {
        return children.map((c) => c.ast());
    },
});
