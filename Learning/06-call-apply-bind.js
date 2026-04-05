// ============================================
// 06 - CALL, APPLY, BIND & THEIR POLYFILLS
// ============================================
// call, apply, and bind let you explicitly set `this` for a function.
//   call:  invoke NOW with individual args     → fn.call(ctx, a, b)
//   apply: invoke NOW with array of args       → fn.apply(ctx, [a, b])
//   bind:  return NEW function for LATER use   → fn.bind(ctx, a)(b)
// This file also covers thisArg in array methods and polyfills.

// ============================================
// SECTION 1: thisArg in Array Methods
// ============================================
// forEach, map, filter accept an optional 2nd argument: thisArg.
// It sets `this` inside the callback (only for regular functions, NOT arrows).

console.log("--- SECTION 1: thisArg in Array Methods ---");

const converter = {
  factor: 2.205,
  // Arrow functions IGNORE thisArg (they use lexical this)
};

const kgValues = [1, 5, 10];

// --- BAD: Arrow function ignores thisArg ---
// const lbsBad = kgValues.map((kg) => kg * this.factor, converter);
// `this` in arrow = module scope, not converter. Would get NaN.

// --- GOOD: Regular function respects thisArg ---
const lbsGood = kgValues.map(function (kg) {
  return kg * this.factor;
}, converter);
console.log(lbsGood); // => [2.205, 11.025, 22.05]

// ============================================
// SECTION 2: Function.prototype.call
// ============================================
// fn.call(context, arg1, arg2, ...)
// Invokes fn immediately with `this` = context.

console.log("\n--- SECTION 2: call ---");

function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}

const alice = { name: "Alice" };
const bob = { name: "Bob" };

// Reuse the same function with different `this`:
console.log(introduce.call(alice, "Hi", "!"));     // => "Hi, I'm Alice!"
console.log(introduce.call(bob, "Hello", "."));    // => "Hello, I'm Bob."

// Classic use: borrowing methods from other objects
const arrayLike = { 0: "a", 1: "b", 2: "c", length: 3 };
// arrayLike doesn't have .join(), but we can borrow it from Array.prototype:
const joined = Array.prototype.join.call(arrayLike, "-");
console.log(joined); // => "a-b-c"

// ============================================
// SECTION 3: Function.prototype.apply
// ============================================
// fn.apply(context, [arg1, arg2, ...])
// Same as call, but args are passed as an array.

console.log("\n--- SECTION 3: apply ---");

console.log(introduce.apply(alice, ["Hey", "?"])); // => "Hey, I'm Alice?"

// Classic use: Math.max with an array
const numbers = [3, 7, 1, 9, 4];
// Math.max expects separate args: Math.max(3, 7, 1, 9, 4)
// apply spreads the array: Math.max.apply(null, numbers)
console.log(Math.max.apply(null, numbers)); // => 9
// Modern alternative: spread operator
console.log(Math.max(...numbers));          // => 9

// ============================================
// SECTION 4: Function.prototype.bind
// ============================================
// fn.bind(context, ...presetArgs)
// Returns a NEW function with permanently bound `this` and optional preset args.
// Does NOT invoke the function.

console.log("\n--- SECTION 4: bind ---");

const aliceIntro = introduce.bind(alice, "Greetings");
// `this` is permanently alice, first arg is permanently "Greetings"
console.log(aliceIntro("!"));  // => "Greetings, I'm Alice!"
console.log(aliceIntro(".")); // => "Greetings, I'm Alice."

// --- BAD: Losing `this` when passing method as callback ---
const timer = {
  name: "Timer",
  start() {
    // setTimeout gets the function without the object context
    setTimeout(function () {
      // `this` is NOT timer here! It's globalThis or undefined.
    }, 100);
  },
};

// --- GOOD: Fix with bind ---
const timerFixed = {
  name: "Timer",
  start() {
    setTimeout(
      function () {
        console.log("Timer name:", this.name); // "Timer"
      }.bind(this), // bind `this` (timerFixed) to the callback
      100
    );
  },
};
timerFixed.start();

// Partial application with bind:
function add(a, b, c) {
  return a + b + c;
}
const add5 = add.bind(null, 5); // preset a=5, `this` doesn't matter
console.log(add5(3, 2));        // => 10 (5 + 3 + 2)

// ============================================
// SECTION 5: Comparison Table
// ============================================
/*
  ┌──────────┬──────────────┬─────────────────┬──────────────────┐
  │ Method   │ Invokes now? │ Args format      │ Returns          │
  ├──────────┼──────────────┼─────────────────┼──────────────────┤
  │ call     │ YES          │ Individual       │ Function result  │
  │ apply    │ YES          │ Array            │ Function result  │
  │ bind     │ NO           │ Individual       │ New function     │
  └──────────┴──────────────┴─────────────────┴──────────────────┘

  When to use:
  • call  → borrow a method, invoke with known args
  • apply → same, but args are in an array (or array-like)
  • bind  → fix `this` for callbacks, partial application, event handlers
*/

// ============================================
// SECTION 6: Polyfill - myCall
// ============================================
// Core trick: temporarily attach the function to the context object,
// call it as a method (so `this` = context), then clean up.
// Use Symbol to avoid property name collisions.

console.log("\n--- SECTION 6: myCall Polyfill ---");

Function.prototype.myCall = function (context, ...args) {
  // Handle null/undefined → default to globalThis
  context = context != null ? Object(context) : globalThis;

  // Use Symbol to guarantee no property collision
  const fnKey = Symbol("fn");

  // Attach `this` (the function being called) to the context
  context[fnKey] = this;

  // Call as a method → `this` inside the function = context
  const result = context[fnKey](...args);

  // Clean up the temporary property
  delete context[fnKey];

  return result;
};

function greet(greeting) {
  return `${greeting}, ${this.name}`;
}

console.log(greet.myCall({ name: "Alice" }, "Hello")); // => "Hello, Alice"
console.log(greet.myCall({ name: "Bob" }, "Hi"));      // => "Hi, Bob"

// ============================================
// SECTION 7: Polyfill - myApply
// ============================================
// Same as myCall, but accepts args as an array.

console.log("\n--- SECTION 7: myApply Polyfill ---");

Function.prototype.myApply = function (context, argsArray) {
  context = context != null ? Object(context) : globalThis;

  const fnKey = Symbol("fn");
  context[fnKey] = this;

  // If no args array provided, call with no args
  const result = argsArray ? context[fnKey](...argsArray) : context[fnKey]();

  delete context[fnKey];
  return result;
};

console.log(greet.myApply({ name: "Charlie" }, ["Hey"])); // => "Hey, Charlie"
console.log(Math.max.myApply(null, [1, 5, 3]));          // => 5

// ============================================
// SECTION 8: Polyfill - myBind
// ============================================
// Returns a new function with bound `this` and optional preset args.
// When called, combines preset args with new args.

console.log("\n--- SECTION 8: myBind Polyfill ---");

Function.prototype.myBind = function (context, ...boundArgs) {
  // Save reference to the original function
  const originalFn = this;

  // Return a new function that combines bound + new args
  return function (...calledArgs) {
    // Use myCall (or native call) to invoke with the bound context
    return originalFn.call(context, ...boundArgs, ...calledArgs);
  };
};

const boundGreet = greet.myBind({ name: "Diana" }, "Howdy");
console.log(boundGreet()); // => "Howdy, Diana"

// Partial application:
function multiply(a, b, c) {
  return a * b * c;
}
const multiplyBy2 = multiply.myBind(null, 2);
console.log(multiplyBy2(3, 4));  // => 24 (2 * 3 * 4)

const multiplyBy2And3 = multiply.myBind(null, 2, 3);
console.log(multiplyBy2And3(5)); // => 30 (2 * 3 * 5)

// ============================================
// SECTION 9: Edge Cases
// ============================================

console.log("\n--- SECTION 9: Edge Cases ---");

// null/undefined context → defaults to globalThis
function showThis() {
  return typeof this;
}
console.log(showThis.myCall(null));      // => "object" (globalThis)
console.log(showThis.myCall(undefined)); // => "object" (globalThis)

// Primitive context → wrapped in Object()
console.log(showThis.myCall(42));     // => "object" (Number wrapper)
console.log(showThis.myCall("str"));  // => "object" (String wrapper)

// bind + call: bind wins (bind creates a permanently bound function)
const alwaysAlice = greet.bind({ name: "Alice" });
console.log(alwaysAlice.call({ name: "Bob" }, "Hi")); // => "Hi, Alice" (bind wins!)

// ============================================
// PRACTICE P15: Polyfill Function.prototype.call
// ============================================
// (Already implemented in Section 6)

console.log("\n--- PRACTICE P15: myCall ---");
function sayHello(lang) {
  return `${lang}: Hello, ${this.name}`;
}
console.log(sayHello.myCall({ name: "Navi" }, "EN")); // => "EN: Hello, Navi"

// ============================================
// PRACTICE P16: Polyfill Function.prototype.apply
// ============================================
// (Already implemented in Section 7)

console.log("\n--- PRACTICE P16: myApply ---");
console.log(sayHello.myApply({ name: "Navi" }, ["FR"])); // => "FR: Hello, Navi"

// ============================================
// PRACTICE P17: Polyfill Function.prototype.bind
// ============================================
// (Already implemented in Section 8)

console.log("\n--- PRACTICE P17: myBind ---");
const boundSayHello = sayHello.myBind({ name: "Navi" }, "DE");
console.log(boundSayHello()); // => "DE: Hello, Navi"
