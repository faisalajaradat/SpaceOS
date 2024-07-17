# TCShell Documentation

## Introduction

TCShell is a statically typed, interpreted, spatial-oriented, scripting language designed
for the SpaceOS shell.

## Table of Contents

<table>
<tr><td width=33% valign=top>

* [Hello World](#hello-world)
* [Functions](#functions)
* [Symbol Visibility](#symbol-visibility)
* [Variables](#variables)
* [Types](#types)
    * [Base Types](#base-types)
    * [Numbers](#numbers)
    * [Strings](#strings)

</td><td width=33% valign=top>
</tr>
</table>


## Hello World

```
var main = fn () {
    print("hello world")
}
main()
```

From this example, quite a few features are expressed. All function declarations are
variable declarations as function declarations are expressions. The `var` keyword is used
to declare a new variable, and the `fn` keyword followed by parameters in parenthesis. Using a
`main` function is just for tradition as the entry point of a file is just the first statement.
Therefore, a hello world program can simply be the following:

```
print("hello world")
```

## Functions

```
var multiply = fn (var x, var y) {
    return x*y
}

var subtract = fn (var x, var y) return x-y

print(multiply(10, 5))
print(subtract(55, 5))
```

Variables assigned to a function are immutable. Parameters are declared the same as variables.
Function declarations expect a statement after defining parameters, so this can a block, or any
other statement. Functions cannot be overloaded. Declarations are in order, so you may not use
functions before declaration.

## Symbol Visibility


```
pub var PI = 3.14

pub var foo = fn () print("foo")
```

All declarations are not exported by default. Prepend `pub` to expose declarations to other modules.

## Variables

```
var name = "Sam"
print(name)
name = "Marc"
print(name)
```

Variables are declared with the `var` keyword. Variables must be initialized using `=` with a value at declaration.
All variables will always have an intial value. You cannot declare a new variable of a same name within the same scope.

The type of a variable is inferred from the value on the right side of the assignment. You cannot change
the type of a declared variable.

Excluding functions, all variables are mutable. To reassign the value of a variable, you reuse `=` with the new value.

## Types

### Base Types

```
bool

string

number

void
```

### Numbers

The `number` type works the same as in JavaScript, so it is a double-precision 64-bit
binary format IEEE 754 value. They are no integers at the moment. Literals can be defined
in decimal form, or in scientific notation.

```
var PI = 3.14
var AVAGADRO = 6.02214076e23
```

### Strings

String literals can be defined using either single or double quotes.

```
var sam = "Sam"
var marc = 'Marc'
```
