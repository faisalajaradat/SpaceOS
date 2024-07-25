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
* [Type Analysis](#type-analysis)
* [Conventional Types](#conventional-types)
    * [Base Types](#base-types)
    * [Arrays](#arrays)
    * [Records](#records)
    * [Type Aliases](#type-aliases)

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

## Type Analysis

By default, the type of expressions are inferenced by the first hint of the type. There is always the option to
explicitly type a declaration.

```
var add = fn (var x: number, var y: number): number
    return x+y

var one: number = 1
var two: number = 2

print(add(one, two))
```

In most cases, it is not required to explicitly type a declaration. In the example above, the type hints for vars
`one` and `two` can be dropped as the assignment to a `number` gives enough information. There are cases where the
hints to the type are insufficient to infer and explicit typing is required or else an error will be raised. In the
example above, when considering the `add` function, the parameters `x` and `y` are required to be explicitly type
as their only use is with the `+` operator which can be used with both `number` and `string`.

## Conventional Types

### Base Types

```
bool

string

number

void
```

#### Numbers

The `number` type works the same as in JavaScript, so it is a double-precision 64-bit
binary format IEEE 754 value. They are no integers at the moment. Literals can be defined
in decimal form, or in scientific notation.

```
var PI: number = 3.14
var AVAGADRO = 6.02214076e23
```

The `number` type supports many of the standard math operators:

```
var x = 2 + ((5*5) - 2) / 4 % 6
```

#### Strings

String literals can be defined using either single or double quotes.

```
var sam = "Sam"
var marc: string = 'Marc'
```

To concatenate `string` types, use the `+` operator.

```
var samAndMarc = sam + " and " + marc
```

When using the `+` operator on a `number` and a `string`, the `number` will be coerced into a string.

```
"Sam is " + 21 + " years old!"
```

The following can be done to check string equality:

```
sam == "Sam"

marc != sam
```

#### Bools

The `bool` type is used for boolean logic. A `bool` can be either `true` or `false`. The common boolean operators
are supported.

```
var notTrue: bool = false
true != notTrue
true == !notTrue
true || notTrue == true
true && notTrue == false
```

### Arrays

An array type can be defined by appending `[]` to a type for each dimension of the array. An array can be initialized
by enclosing a comma seperated list of expressions within `[]`. Arrays initialized with no contents must be explicitly
type.

```
var names = ["Sam", "Marc"]

var nums: number[] = []
```

An array is accessed by appending an index enclosed with `[]`.

```
names[0] == "Sam"
```

The length of an array can be found with the `len` function.

```
len(names) == 2
```

To append an element to the end of an array, use the `push` function.

```
push(nums, 5)

nums[0] == 5

push(names, "Alec")

names[2] == "Alec"
```

To remove a specific number of elements starting from a specific index of an array, use the `removeElement` function.

```
removeElement(names, 1, 1)

names[1] == "Alec"
```


### Records

Records allow encapsulating data within. Records are defined with explicitly typed fields before use. After
definition, a record can be initialized by invoking the record name, and passing the desired field values as
inputs in the same order as the fields were declared within `{}`.

```
record Person {
    var name: string,
    var age: number
}

var sam = Person {"Sam", 21}
```

Fields can be accessed with `.`. Record fields are immutable, so they can only be retreived and not set.

```
sam.name == "Sam"
```

### Type Aliases

The `type` keyword allows for assigning a type to an identifier. A declaration using a type alias
can be used anywhere that expecting the aliased type.

```
type Name = string

var sam: Name = "Sam"
```
