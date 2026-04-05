// ============================================
// WHAT IS STRICT MODE?
// ============================================
// Strict mode is a restricted variant of JavaScript introduced in ES5.
// It catches common coding mistakes, throws errors for unsafe actions,
// and disables confusing or poorly thought-out features.
//
// Key differences in strict mode:
//   - `this` in a plain function call is `undefined` (instead of globalThis)
//   - Assigning to undeclared variables throws a ReferenceError
//   - Deleting variables, functions, or function arguments is not allowed
//   - Duplicate parameter names are not allowed
//   - Octal literals (e.g., 0123) are not allowed
//   - `with` statements are not allowed
//   - `arguments` and `eval` cannot be reassigned
//
// HOW TO ENABLE STRICT MODE:
//   1. For an entire file:  put "use strict"; at the very top of the file
//   2. For a single function: put "use strict"; as the first line inside the function body
//   3. ES modules (.mjs or type:"module") are ALWAYS in strict mode automatically
//   4. Classes are ALWAYS in strict mode automatically
//
// NOTE: "use strict"; must be a string literal at the top — no code before it
//       (comments are fine, but not statements).
// ============================================

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
// Solution: Use .bind() to permanently attach `this` to the object.

console.log("\n--- PRACTICE Q3: Lost this / bind ---");

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

// Solution: .bind(calc) locks `this` to calc permanently
const fn = calc.add.bind(calc);
console.log("bind(calc)(1,2):", fn(1, 2)); // => 13

// --------------------------------------------
// Q3 DEEP DIVE: Why not use an arrow function or `self = this`?
// --------------------------------------------
//
// You might wonder: "In Q1, `this` works fine inside greet(). Why can't we
// just use `this` directly in calc too?"
//
// Answer: We CAN — calc.add(1,2) works perfectly! The problem is only when
// we EXTRACT the method: `const fn = calc.add; fn(1,2);`
// Now there's no object before the dot, so `this` is lost.
//
// --- BAD ATTEMPT 1: Arrow function as method ---
//
//   const calc = {
//     base: 10,
//     add(a, b) => {                 // SyntaxError!
//       return this.base + a + b;
//     },
//   };
//
// `add(a, b) => {}` is INVALID syntax. You can't mix method shorthand with =>.
// The valid arrow form would be:
//
//   const calc = {
//     base: 10,
//     add: (a, b) => this.base + a + b,   // No SyntaxError, but `this` is WRONG
//   };
//
// Arrow functions inherit `this` from the ENCLOSING SCOPE where they are defined.
// An object literal {} is NOT a scope — it doesn't create its own `this`.
// So `this` here is the outer scope: module.exports ({}) in Node, window in browser.
// `this.base` would be undefined, NOT 10.
//
// --- BAD ATTEMPT 2: `self = this` as an object property ---
//
//   const calc = {
//     base: 10,
//     self: this,                    // `this` here is NOT calc!
//     add(a, b) {
//       return self + a + b;         // `self` is {} (module.exports), not calc
//     },
//   };
//
// When JavaScript creates an object literal, `this` in property values refers
// to the OUTER scope, not the object being created. The object doesn't exist
// yet while its properties are being evaluated.
// Only FUNCTIONS and CLASSES create a new `this` context — object literals don't.
// So `self` would be {} (module.exports) or window, not calc.
//
// --- WHY .bind() IS THE RIGHT FIX ---
// .bind(calc) creates a new function where `this` is permanently set to calc.
// Even when extracted to a variable, the bound function always knows its `this`.
// --------------------------------------------

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
