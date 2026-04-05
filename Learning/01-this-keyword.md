# 01 - The `this` Keyword in JavaScript

## Golden Rule
> `this` depends on **HOW** a function is called, not **WHERE** it is written.

---

## Cheat Sheet

| How function is called | What `this` is |
|---|---|
| `obj.method()` | `obj` |
| `fn()` (sloppy mode) | `globalThis` (window/global) |
| `fn()` (strict mode) | `undefined` |
| `new Constructor()` | the new object |
| `fn.call(ctx)` / `fn.apply(ctx)` | `ctx` |
| `fn.bind(ctx)()` | `ctx` |
| Arrow function | `this` from enclosing scope |
| `setTimeout(fn)` | `globalThis` (or undefined) |
| `setTimeout(() => ...)` | `this` from enclosing scope (arrow fix) |
| `addEventListener` callback | the DOM element |

---

## Section 1: Global Context

### Before (Confusion)
```js
// What does `this` refer to at the top level?
console.log(this); // ??? depends on environment
```

### After (Understanding)
```js
// Node.js top-level: `this` === module.exports (an empty object {})
console.log(this); // => {}

// Browser top-level: `this` === window
console.log(this); // => Window {...}
```

---

## Section 2: Object Method Binding

### Before (No object context)
```js
function greet() {
  return `Hello, I'm ${this.name}`;
}
greet(); // `this` is undefined (strict) or globalThis (sloppy)
```

### After (Method call with object)
```js
const user = {
  name: "Alice",
  greet() {
    return `Hello, I'm ${this.name}`;
  },
};
console.log(user.greet()); // => "Hello, I'm Alice"
// `this` = user because it's called as user.greet()
```

---

## Section 3: Nested Functions Losing `this`

### Before (Bug - inner function loses `this`)
```js
const user = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice" - works
    function innerGreet() {
      console.log(this.name); // undefined! plain call = no object
    }
    innerGreet(); // BAD: plain function call, `this` is lost
  },
};
user.greet(); // Throws in strict mode
```

### After (Fix 1 - Arrow function)
```js
const user = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice"
    const innerGreet = () => {
      console.log(this.name); // "Alice" - arrow inherits from greet()
    };
    innerGreet();
  },
};
user.greet(); // => "Alice", "Alice"
```

### After (Fix 2 - Store `this` in variable)
```js
const user = {
  name: "Alice",
  greet() {
    const self = this; // save reference
    function innerGreet() {
      console.log(self.name); // "Alice" - `self` is a regular variable
    }
    innerGreet();
  },
};
user.greet(); // => "Alice"
```

---

## Section 4: Arrow Functions

### Before (Arrow function as method - BAD)
```js
const obj = {
  name: "Bob",
  greet: () => {
    return `Hello, I'm ${this.name}`; // `this` is NOT obj!
  },
};
console.log(obj.greet()); // => "Hello, I'm undefined"
// Arrow inherits `this` from module scope, not from obj
```

### After (Regular method + arrow callback - GOOD)
```js
const obj = {
  name: "Bob",
  greet() {
    // Regular function: `this` = obj
    const items = ["a", "b", "c"];
    const result = items.map((item) => `${this.name}-${item}`);
    // Arrow callback inherits `this` from greet()
    return result;
  },
};
console.log(obj.greet()); // => ["Bob-a", "Bob-b", "Bob-c"]
```

---

## Section 5: Strict Mode

### Before (Sloppy mode - dangerous global pollution)
```js
function showThis() {
  console.log(this); // => globalThis (window/global)
  this.accidental = "oops"; // pollutes global scope!
}
showThis();
```

### After (Strict mode - safe undefined)
```js
"use strict";
function showThis() {
  console.log(this); // => undefined
  // this.accidental = "oops"; // TypeError! Can't set on undefined
}
showThis();
```

---

## Practice Q1: Fix `this` in Nested Function

### Before (Bug)
```js
const user = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice"
    function innerGreet() {
      console.log(this.name); // undefined - plain call!
    }
    innerGreet();
  },
};
user.greet();
// Output: "Alice", then TypeError in strict mode
```

### After (Fix)
```js
const user = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice"
    const innerGreet = () => {
      console.log(this.name); // "Alice" - arrow inherits `this`
    };
    innerGreet();
  },
};
user.greet();
// Output: "Alice", "Alice"
```

---

## Practice Q2: Fix `this` with setTimeout

### Before (Bug)
```js
const timer = {
  name: "Timer",
  start() {
    setTimeout(function () {
      console.log(this.name); // undefined - callback is a plain call
    }, 100);
  },
};
timer.start(); // => undefined
```

### After (Fix)
```js
const timer = {
  name: "Timer",
  start() {
    setTimeout(() => {
      console.log(this.name); // "Timer" - arrow inherits from start()
    }, 100);
  },
};
timer.start(); // => "Timer"
```

---

## Practice Q3: Method Called Without Object (Lost `this`)

### Before (Bug)
```js
const calc = {
  base: 10,
  add(a, b) {
    return this.base + a + b;
  },
};

const fn = calc.add; // extract method - loses object context
fn(1, 2); // TypeError or NaN - `this` is not calc!
```

### After (Fix - Using `.bind()`)
```js
const fn = calc.add.bind(calc); // locks `this` to calc permanently
console.log(fn(1, 2)); // => 13
```

### Why not use an arrow function or `self = this`?

> **But wait — in Q1, `this` works fine inside `greet()`. Why is Q3 different?**

It's actually NOT different! `calc.add(1, 2)` works perfectly — `this` is `calc` because there's an object before the dot. The Q3 problem is specifically about **extracting** the method to a variable:

```js
const fn = calc.add; // detach method from calc
fn(1, 2);            // no object before the dot → `this` is lost
```

So we need a fix that survives extraction. Let's see why arrow functions and `self = this` **don't** help:

#### Bad Attempt 1: Arrow function as method

```js
const calc = {
  base: 10,
  add(a, b) => {                 // SyntaxError!
    return this.base + a + b;
  },
};
```

`add(a, b) => {}` is **invalid syntax** — you can't mix method shorthand with `=>`. The valid arrow form would be:

```js
const calc = {
  base: 10,
  add: (a, b) => this.base + a + b,  // No SyntaxError, but `this` is WRONG
};
```

Arrow functions inherit `this` from the **enclosing scope** where they are defined. An object literal `{}` is **not a scope** — it doesn't create its own `this`. So `this` here is the outer scope: `module.exports` (`{}`) in Node, `window` in browser. `this.base` would be `undefined`, not `10`.

#### Bad Attempt 2: `self = this` as an object property

```js
const calc = {
  base: 10,
  self: this,          // `this` here is NOT calc!
  add(a, b) {
    return self + a + b; // `self` is {} (module.exports), not calc
  },
};
```

When JavaScript creates an object literal, `this` in property values refers to the **outer scope**, not the object being created. The object doesn't exist yet while its properties are being evaluated. Only **functions** and **classes** create a new `this` context — object literals don't. So `self` would be `{}` (`module.exports`) or `window`, not `calc`.

#### Why `.bind()` is the right fix

`.bind(calc)` creates a new function where `this` is **permanently** set to `calc`. Even when extracted to a variable, the bound function always knows its `this`:

```js
const fn = calc.add.bind(calc);
fn(1, 2); // 13 — works even without calc. in front
```

---

## Practice Q4: Global vs Method `this` (Strict Mode)

### Before (Confusion)
```js
console.log(this);       // What is this?
function showThis() {
  console.log(this);     // What is this?
}
showThis();
```

### After (Understanding)
```js
"use strict";
console.log(this);       // => {} (module.exports in Node.js)

function showThis() {
  console.log(this);     // => undefined (strict mode plain call)
}
showThis();
```

---

## Bonus: Interview Traps

### Trap 1: Method passed as callback loses `this`

#### Before
```js
const obj = {
  value: 42,
  getValue() { return this.value; },
};

[1].map(obj.getValue); // => [undefined] - `this` is not obj!
```

#### After
```js
const obj = {
  value: 42,
  getValue() { return this.value; },
};

[1].map(obj.getValue.bind(obj)); // => [42] - bind fixes `this`
```

### Trap 2: Nested setTimeout

#### Before
```js
const counter = {
  count: 0,
  start() {
    setTimeout(function () {
      this.count++; // `this` is NOT counter!
      setTimeout(function () {
        this.count++; // still NOT counter!
      }, 50);
    }, 50);
  },
};
```

#### After
```js
const counter = {
  count: 0,
  start() {
    setTimeout(() => {
      this.count++; // "this" = counter (arrow inherits)
      console.log(this.count); // => 1
      setTimeout(() => {
        this.count++; // still counter (nested arrows)
        console.log(this.count); // => 2
      }, 50);
    }, 50);
  },
};
counter.start();
```
