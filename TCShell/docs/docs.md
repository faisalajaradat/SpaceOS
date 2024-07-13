# TCShell Documentation

## Introduction

TCShell is a statically typed, interpreted, spatial-oriented, scripting language designed
for the SpaceOS shell.

## Table of Contents

<table>
<tr><td width=33% valign=top>

* [Hello World](#hello-world)
* [Functions](#functions)

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
