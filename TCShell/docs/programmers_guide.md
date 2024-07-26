# TCShell Programmer's Guide

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
    * [Union Types](#union-types)
* [Spatial Types](#spatial-types)

</td><td width=33% valign=top>

* [Control Flow Statements](#control-flow-statements)
    * [If & Else](#if-&-else)
    * [While](#while)
    * [Defer](#defer)
* [Pattern Matching](#pattern-matching)
    * [Value Pattern](#value-pattern)
    * [Type Pattern](#type-pattern)
    * [Wildcard Pattern](#wildcard-pattern)


</td>
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
can be used anywhere that expecting the aliased type. Defined types are immutable, so an identifier cannot
refer to a different type after declaration.

```
type Name = string

var sam: Name = "Sam"
```

### Union Types

When extending a type alias with more types seperated by `|`, the type alias becomes a union type. A variable
declared as a union type means that the value within that variable could be any of the types within the union
at any given time.

```
type EitherStringOrNumber = string | number
```

#### Typecasting

A union type is not equal to each individual type within the union. The following is invalid:

```
var foo: EitherStringOrNumber = "foo"
```

We are attempting to assign the variable `foo` of type `EitherStringOrNumber` to an expression of type `string`.
A `string` is not a `string | number`, but rather belongs to `string | number`. To make the above example valid,
we must cast the `string` expression to an `EitherStringOrNumber` through typecasting.

```
var foo: EitherStringOrNumber = (EitherStringOrNumber) "foo"
```

Typecasting is only valid when casting a value of a type that belongs to the desired type. The inverse of the
above example (casting an `EitherStringOrNumber` to a `string`) is not allowed since a `string | number` is still
not a `string`, nor does a `string | number` belong to a `string`. The following is invalid:

```
var bar: string = (string) foo
```

The only way to turn a union typed value to its actual type is through [type pattern matching](#type-pattern).

## Spatial Types

todo

## Control Flow Statements

### If & Else

`if` and `if-else` statements are like most languages, but there are no `()` surrounding the condition.
A condition must be of `bool` type.

```
var x = 10

if x < 10
    print("wrong")
else if x > 10
    print("wrong")
else {
    print("right")
}
```

### While

`while` loop statements are like most languages, but there are no `()` surrounding the condition.
A condition must be of `bool` type.

```
var iterations = 0
while iterations < 10 {
    iterations = iterations + 1
    print(iterations)
}
```

### Defer

The `defer` keyword turns the following statement into a coroutine that immediately begins executing 
asynchronously. It is functionally similar to using the go keyword in Go. The program will wait for all 
coroutines to finish before ending execution.

When a coroutine is started, the lexical scope is copied and passed as the new scope for the coroutine. 
This means the state of the program is the same entering the coroutine, but any state changes that occur 
within the coroutine will not be reflected outside the coroutine.

```
var counter = fn (var id: number, var end: number) {
    var count = 0
    while count < end  {
        count = count + 1
        print("counter " + id + ": " + count)
    }
}

defer counter(1, 3)
defer counter(2, 3)
defer counter(3, 3)
```

output:

```
counter 1: 1
counter 2: 1
counter 3: 1
counter 1: 2
counter 2: 2
counter 3: 2
counter 1: 3
counter 2: 3
counter 3: 3
```

#### Non-Blocking System Calls

Coroutines using `defer` can be very useful to not stall on synchronous, blocking code. A great 
example is using `defer` in conjunction with the `sendEntityThrough` method. By the nature of 
`sendEntityThrough`, if ran synchronously, execution might stall for a long time depending on factors
such as the distance of the entity's journey, the speed of the entity's movement, and the number of
entities enqueued waiting for their turn to go. To avoid forcing unrelated logic waiting on the entity to finish
its journey before executing, we can do the following:

```
var printErrorIfFailed = fn (var maybeError: MaybeString) {
    match maybeError {
        var error: string => print(error)
        var _nothing : void => {}
    }
}

defer printErrorIfFailed(spg.sendEntityThrough(entity1, startSpace, endSpace, 500))
defer printErrorIfFailed(spg.sendEntityThrough(entity2, startSpace, endSpace, 500))

print("Time Sensitive Data!")
```

In this example, entities `entity1` and `entity2` get to begin their journeys concurrently, and the time
sensitive data does not have to wait on their journeys to either finish or fail.

## Pattern Matching

`match` statements allow for changing control flow by pattern matching on a specific expression. 
There are three patterns supported. In order of precedence, they are the [value pattern](#value-pattern), 
the [type pattern](#type-pattern), and the [wildcard pattern](#wildcard-pattern).  

### Value Pattern

Matching by value means 

### Type Pattern

todo

### Wildcard Pattern
