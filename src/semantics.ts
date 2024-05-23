import * as core from "./core.js";

export default function analyze(astHead: core.Program): number {
  visitNameAnalyzer(astHead, null);
  return errors;
}

abstract class ProgramSymbol {
  name: string;

  constructor(name: string) {
    this.name = name;
  }
}

class VarSymbol extends ProgramSymbol {
  varDeclaration: core.VarDeclaration | core.Parameter;

  constructor(varDeclaration: core.VarDeclaration | core.Parameter) {
    super(varDeclaration.identifier.value);
    this.varDeclaration = varDeclaration;
  }
}

class FunSymbol extends ProgramSymbol {
  funDeclaration: core.FunDeclaration;

  constructor(funDeclaration: core.FunDeclaration) {
    super(funDeclaration.identifier.value);
    this.funDeclaration = funDeclaration;
  }
}

class Scope {
  outer: Scope;
  symbolTable: Map<string, ProgramSymbol>;

  constructor(outer: Scope) {
    this.outer = outer;
    this.symbolTable = new Map<string, ProgramSymbol>();
  }

  lookup(name: string): ProgramSymbol {
    const programSymbol = this.lookupCurrent(name);
    if (programSymbol != undefined) return programSymbol;
    if (this.outer === null) return null;
    return this.outer.lookup(name);
  }

  lookupCurrent(name: string): ProgramSymbol {
    const programSymbol = this.symbolTable.get(name);
    if (programSymbol != undefined) return programSymbol;
    return null;
  }

  put(programSymbol: ProgramSymbol) {
    this.symbolTable.set(programSymbol.name, programSymbol);
  }
}

let errors = 0;

function visitNameAnalyzer(node: core.ASTNode, scope: Scope) {
  if (node instanceof core.Program) {
    const curScope = new Scope(scope);
    core.libFunctions.forEach((fun) => curScope.put(new FunSymbol(fun)));
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
  } else if (node instanceof core.FunDeclaration) {
    const funSymbol = scope.lookupCurrent(node.identifier.value);
    if (funSymbol != null) {
      errors++;
      console.log(
        "Function name: " +
          node.identifier.value +
          "already defined within scope!",
      );
    } else scope.put(new FunSymbol(node));
    const curScope = new Scope(scope);
    node.params.forEach((param) => visitNameAnalyzer(param, curScope));
    visitNameAnalyzer(node.block, curScope);
  } else if (
    node instanceof core.VarDeclaration ||
    node instanceof core.Parameter
  ) {
    const paramSymbol = scope.lookupCurrent(node.identifier.value);
    if (paramSymbol != null) {
      errors++;
      console.log(
        "Variable name: " +
          node.identifier.value +
          " already defined within scope!",
      );
    } else scope.put(new VarSymbol(node));
  } else if (node instanceof core.Block) {
    const curScope = new Scope(scope);
    node.children().forEach((child) => visitNameAnalyzer(child, curScope));
  } else if (node instanceof core.Identifier) {
    const programSymbol = scope.lookup(node.value);
    if (programSymbol === null) {
      errors++;
      console.log("Symbol: " + node.value + " has not been declared!");
      return;
    } else if (programSymbol instanceof FunSymbol)
      node.declaration = programSymbol.funDeclaration;
    else if (programSymbol instanceof VarSymbol)
      node.declaration = programSymbol.varDeclaration;
  } else node.children().forEach((child) => visitNameAnalyzer(child, scope));
}
