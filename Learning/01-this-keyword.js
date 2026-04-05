// ============================================
// 01 - THE `this` KEYWORD IN JAVASCRIPT
// ============================================
// Golden Rule: `this` depends on HOW a function is called, not WHERE it is written.
// Think of `this` as a dynamic pointer that changes based on the call-site.
// This file covers: global context, object methods, nested functions, arrow functions,
// strict mode, and all Contest Practice Q1-Q4.

"use strict";

// ============================================
// SECTION 1: Global Context
// ============================================
// In Node.js top-level: `this` === module.exports (an empty object {})
// In Browser top-level: `this` === window
// In strict mode at top-level: same behavior (global `this` is still available)

console.log("--- SECTION 1: Global Context ---");
console.log("Top-level this in Node:", this); // => {} (module.exports)

// ============================================
// SECTION 2: Object Method Binding
// ============================================
// When a function is called as a method (obj.method()), `this` = the object before the dot.

console.log("\n--- SECTION 2: Object Method Binding ---");

const user = {
  name: "Alice",
  greet() {
    // `this` here is `user` because we call it as user.greet()
    return `Hello, I'm ${this.name}`;
  },
};

console.log(user.greet()); // => "Hello, I'm Alice"

// ============================================
// SECTION 3: Nested Functions Losing `this`
// ============================================
// A regular function called WITHOUT an object before the dot
// gets `this` = undefined (strict mode) or globalThis (sloppy mode).
// This is the #1 interview trap with `this`.

console.log("\n--- SECTION 3: Nested Functions (BAD vs GOOD) ---");

// --- BAD EXAMPLE ---
// The inner function is a plain function call, NOT a method call.
// So `this` inside innerGreet is undefined (strict) or global (sloppy).
const userBad = {
  name: "Alice",
  greet() {
    console.log("Outer this.name:", this.name); // "Alice" - works fine
    function innerGreet() {
      // BAD: `this` is NOT userBad here! It's undefined in strict mode.
      console.log("Inner this.name:", typeof this); // undefined
    }
    innerGreet(); // plain call - no object before the dot
  },
};
// userBad.greet(); // Would throw in strict mode: Cannot read properties of undefined

// --- GOOD EXAMPLE (Fix 1): Arrow Function ---
// Arrow functions do NOT have their own `this`.
// They inherit `this` from the enclosing scope (lexical `this`).
const userGood1 = {
  name: "Alice",
  greet() {
    console.log("Outer:", this.name); // "Alice"
    const innerGreet = () => {
      // GOOD: Arrow function uses `this` from greet(), which is userGood1
      console.log("Inner (arrow):", this.name); // "Alice"
    };
    innerGreet();
  },
};
userGood1.greet();

// --- GOOD EXAMPLE (Fix 2): Store `this` in a variable ---
// Classic pattern: save `this` as `self` or `that` before the inner function.
const userGood2 = {
  name: "Alice",
  greet() {
    const self = this; // save reference
    console.log("Outer:", self.name); // "Alice"
    function innerGreet() {
      // GOOD: `self` is just a regular variable, not affected by call-site
      console.log("Inner (self):", self.name); // "Alice"
    }
    innerGreet();
  },
};
userGood2.greet();

// ============================================
// SECTION 4: Arrow Functions
// ============================================
// Arrow functions NEVER have their own `this`.
// They always use the `this` from the surrounding scope where they were DEFINED.
// This makes them great for callbacks but BAD for object methods.

console.log("\n--- SECTION 4: Arrow Functions ---");

// --- BAD EXAMPLE ---
// Arrow function as object method: `this` is NOT the object!
// It inherits `this` from the module scope (which is {} in Node / window in browser).
const badObj = {
  name: "Bob",
  // BAD: arrow function doesn't get its own `this`
  greet: () => {
    return `Hello, I'm ${typeof globalThis}`; // NOT "Bob"
  },
};
console.log("Arrow as method (BAD):", badObj.greet());

// --- GOOD EXAMPLE ---
// Use regular function for methods, arrow function for callbacks
const goodObj = {
  name: "Bob",
  greet() {
    // Regular function: `this` = goodObj
    // Arrow callback: inherits `this` from greet()
    const items = ["a", "b", "c"];
    const result = items.map((item) => `${this.name}-${item}`);
    return result;
  },
};
console.log("Regular method + arrow callback (GOOD):", goodObj.greet());
// => ["Bob-a", "Bob-b", "Bob-c"]

// ============================================
// SECTION 5: Strict Mode
// ============================================
// In strict mode, a plain function call gets `this` = undefined
// In sloppy mode, a plain function call gets `this` = globalThis (window/global)
// Strict mode prevents accidental global pollution.

console.log("\n--- SECTION 5: Strict Mode ---");

function showThisStrict() {
  // "use strict" is already at the top of this file
  console.log("this in strict plain call:", this); // => undefined
}
showThisStrict();

// Without strict mode (conceptual - can't mix in same file):
// function showThisSloppy() {
//   console.log(this); // => globalThis (window in browser, global in Node)
// }

// ============================================
// SECTION 6: `this` Cheat Sheet
// ============================================
/*
  ┌──────────────────────────────────┬──────────────────────────────┐
  │ How function is called           │ What `this` is               │
  ├──────────────────────────────────┼──────────────────────────────┤
  │ obj.method()                     │ obj                          │
  │ fn()  (sloppy mode)              │ globalThis (window/global)   │
  │ fn()  (strict mode)              │ undefined                    │
  │ new Constructor()                │ the new object               │
  │ fn.call(ctx) / fn.apply(ctx)     │ ctx                          │
  │ fn.bind(ctx)()                   │ ctx                          │
  │ arrow function                   │ `this` from enclosing scope  │
  │ setTimeout(fn)                   │ globalThis (or undefined)    │
  │ addEventListener callback        │ the DOM element              │
  └──────────────────────────────────┴──────────────────────────────┘
*/

// ============================================
// PRACTICE Q1: Fix `this` in Object Method and Nested Function
// ============================================
// Problem: innerGreet() logs undefined because it's a plain function call.
// Fix: Use arrow function so innerGreet inherits `this` from greet().

console.log("\n--- PRACTICE Q1: Fix Nested this ---");

const userQ1 = {
  name: "Alice",
  greet() {
    console.log(this.name); // "Alice"
    // FIX: Changed from regular function to arrow function
    const innerGreet = () => {
      console.log(this.name); // "Alice" - arrow inherits `this` from greet()
    };
    innerGreet();
  },
};
userQ1.greet();
// Output:
// Alice
// Alice

// ============================================
// PRACTICE Q2: Predict and Fix `this` with setTimeout
// ============================================
// Problem: setTimeout callback is a plain function call, so `this` is lost.
// Fix: Use arrow function in the callback.

console.log("\n--- PRACTICE Q2: Fix setTimeout this ---");

const timer = {
  name: "Timer",
  start() {
    // --- BAD: regular function callback ---
    // setTimeout(function() {
    //   console.log(this.name); // undefined (strict) or "" (sloppy)
    // }, 100);

    // --- GOOD: arrow function callback ---
    setTimeout(() => {
      console.log(this.name); // "Timer" - arrow inherits from start()
    }, 100);
  },
};
timer.start(); // => "Timer" (after 100ms)

// ============================================
// PRACTICE Q3: Method Called Without Object (Lost `this`)
// ============================================
// Problem: When you extract a method (const fn = obj.method), calling fn()
//          loses the object context. `this` becomes undefined/global.
// Solution: Use a closure (bindBase) that captures `base` as a regular variable.

console.log("\n--- PRACTICE Q3: Lost this / bindBase ---");

const calc = {
  base: 10,
  add(a, b) {
    return this.base + a + b;
  },
};

// This works: method call with object before the dot
console.log("calc.add(1,2):", calc.add(1, 2)); // => 13

// This breaks: fn is detached from calc, `this` is lost
// const fn = calc.add;
// fn(1, 2); // TypeError or NaN

// Solution: closure-based function that doesn't rely on `this`
function bindBase(base) {
  return function (a, b) {
    return base + a + b; // `base` is captured by closure, no `this` needed
  };
}

const fn = bindBase(10);
console.log("bindBase(10)(1,2):", fn(1, 2)); // => 13

// ============================================
// PRACTICE Q4: Global vs Method `this` (Strict Mode)
// ============================================
// Demonstrates that top-level `this` is the module object,
// but inside a strict-mode function called plainly, `this` is undefined.

console.log("\n--- PRACTICE Q4: Strict Mode this ---");

// Top-level `this` in Node.js = module.exports = {}
console.log("Top-level this:", this); // => {}

function showThis() {
  // In strict mode, plain function call => `this` is undefined
  console.log("Inside function this:", this); // => undefined
}
showThis();

// ============================================
// BONUS: Common Interview Traps
// ============================================

console.log("\n--- BONUS: Interview Traps ---");

// Trap 1: Method passed as callback loses `this`
const obj = {
  value: 42,
  getValue() {
    return this.value;
  },
};

// Direct call works
console.log("Direct:", obj.getValue()); // => 42

// Passing as callback loses `this`
// [1].map(obj.getValue); // => [undefined] - `this` is not obj!

// Fix with bind:
console.log("With bind:", [1].map(obj.getValue.bind(obj))); // => [42]

// Trap 2: Nested setTimeout
const counter = {
  count: 0,
  start() {
    // Arrow function preserves `this` even in nested callbacks
    setTimeout(() => {
      this.count++;
      console.log("Count:", this.count); // => 1
      setTimeout(() => {
        this.count++;
        console.log("Count:", this.count); // => 2
      }, 50);
    }, 50);
  },
};
counter.start();
