# 06 - Call, Apply, Bind & Their Polyfills

## Core Concept
> `call`, `apply`, and `bind` let you explicitly set `this` for a function.

| Method | Invokes now? | Args format | Returns |
|---|---|---|---|
| `call` | YES | Individual | Function result |
| `apply` | YES | Array | Function result |
| `bind` | NO | Individual | New function |

---

## Section 1: thisArg in Array Methods

### Before (Arrow function ignores thisArg)
```js
const converter = { factor: 2.205 };
const kgValues = [1, 5, 10];

const lbs = kgValues.map((kg) => kg * this.factor, converter);
// `this` in arrow = module scope, NOT converter. Gets NaN!
```

### After (Regular function respects thisArg)
```js
const converter = { factor: 2.205 };
const kgValues = [1, 5, 10];

const lbs = kgValues.map(function (kg) {
  return kg * this.factor;
}, converter);
console.log(lbs); // => [2.205, 11.025, 22.05]
```

---

## Section 2: Function.prototype.call

### Before (Can't reuse function with different objects)
```js
function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}
const alice = { name: "Alice" };
// How to call introduce with `this` = alice?
```

### After (call sets `this`)
```js
function introduce(greeting, punctuation) {
  return `${greeting}, I'm ${this.name}${punctuation}`;
}
const alice = { name: "Alice" };
const bob = { name: "Bob" };

console.log(introduce.call(alice, "Hi", "!"));  // => "Hi, I'm Alice!"
console.log(introduce.call(bob, "Hello", ".")); // => "Hello, I'm Bob."

// Borrow methods from other objects:
const arrayLike = { 0: "a", 1: "b", 2: "c", length: 3 };
const joined = Array.prototype.join.call(arrayLike, "-");
console.log(joined); // => "a-b-c"
```

---

## Section 3: Function.prototype.apply

### Before (Can't spread array into Math.max)
```js
const numbers = [3, 7, 1, 9, 4];
// Math.max expects separate args: Math.max(3, 7, 1, 9, 4)
// Can't pass an array directly
```

### After (apply spreads the array)
```js
const numbers = [3, 7, 1, 9, 4];

console.log(Math.max.apply(null, numbers)); // => 9
// Modern alternative:
console.log(Math.max(...numbers));          // => 9

console.log(introduce.apply(alice, ["Hey", "?"])); // => "Hey, I'm Alice?"
```

---

## Section 4: Function.prototype.bind

### Before (Losing `this` in setTimeout)
```js
const timer = {
  name: "Timer",
  start() {
    setTimeout(function () {
      console.log(this.name); // undefined - `this` is lost!
    }, 100);
  },
};
timer.start();
```

### After (bind fixes `this` permanently)
```js
const timer = {
  name: "Timer",
  start() {
    setTimeout(
      function () {
        console.log("Timer name:", this.name); // "Timer"
      }.bind(this), // bind `this` (timer) to the callback
      100
    );
  },
};
timer.start();

// Partial application:
function add(a, b, c) { return a + b + c; }
const add5 = add.bind(null, 5); // preset a=5
console.log(add5(3, 2));        // => 10 (5 + 3 + 2)
```

---

## Section 6: Polyfill - myCall

### Before (Using call as a black box)
```js
greet.call({ name: "Alice" }, "Hello"); // how does this work?
```

### After (Custom implementation)
```js
Function.prototype.myCall = function (context, ...args) {
  // Handle null/undefined -> default to globalThis
  context = context != null ? Object(context) : globalThis;

  // Use Symbol to guarantee no property collision
  const fnKey = Symbol("fn");

  // Attach the function to the context
  context[fnKey] = this;

  // Call as a method -> `this` inside the function = context
  const result = context[fnKey](...args);

  // Clean up
  delete context[fnKey];

  return result;
};

function greet(greeting) {
  return `${greeting}, ${this.name}`;
}
console.log(greet.myCall({ name: "Alice" }, "Hello")); // => "Hello, Alice"
```

---

## Section 7: Polyfill - myApply

### Before (Black box)
```js
greet.apply({ name: "Alice" }, ["Hello"]); // how?
```

### After (Custom implementation)
```js
Function.prototype.myApply = function (context, argsArray) {
  context = context != null ? Object(context) : globalThis;

  const fnKey = Symbol("fn");
  context[fnKey] = this;

  const result = argsArray ? context[fnKey](...argsArray) : context[fnKey]();

  delete context[fnKey];
  return result;
};

console.log(greet.myApply({ name: "Charlie" }, ["Hey"])); // => "Hey, Charlie"
console.log(Math.max.myApply(null, [1, 5, 3]));           // => 5
```

---

## Section 8: Polyfill - myBind

### Before (Black box)
```js
const bound = greet.bind({ name: "Diana" }, "Howdy");
bound(); // how does bind work?
```

### After (Custom implementation)
```js
Function.prototype.myBind = function (context, ...boundArgs) {
  const originalFn = this; // save reference to original function

  return function (...calledArgs) {
    return originalFn.call(context, ...boundArgs, ...calledArgs);
  };
};

const boundGreet = greet.myBind({ name: "Diana" }, "Howdy");
console.log(boundGreet()); // => "Howdy, Diana"

// Partial application:
function multiply(a, b, c) { return a * b * c; }
const multiplyBy2 = multiply.myBind(null, 2);
console.log(multiplyBy2(3, 4));  // => 24 (2 * 3 * 4)

const multiplyBy2And3 = multiply.myBind(null, 2, 3);
console.log(multiplyBy2And3(5)); // => 30 (2 * 3 * 5)
```

---

## Section 9: Edge Cases

### Before (Confusion with null/undefined/primitive contexts)
```js
function showThis() { return typeof this; }
showThis.call(null);      // => ???
showThis.call(42);        // => ???

const alwaysAlice = greet.bind({ name: "Alice" });
alwaysAlice.call({ name: "Bob" }, "Hi"); // => ???
```

### After (Understanding edge cases)
```js
function showThis() { return typeof this; }

// null/undefined -> defaults to globalThis
console.log(showThis.myCall(null));      // => "object" (globalThis)
console.log(showThis.myCall(undefined)); // => "object" (globalThis)

// Primitive -> wrapped in Object()
console.log(showThis.myCall(42));    // => "object" (Number wrapper)
console.log(showThis.myCall("str")); // => "object" (String wrapper)

// bind + call: bind WINS (permanently bound)
const alwaysAlice = greet.bind({ name: "Alice" });
console.log(alwaysAlice.call({ name: "Bob" }, "Hi")); // => "Hi, Alice" (bind wins!)
```

---

## Practice P15-P17: Polyfills for call, apply, bind

### P15: myCall
```js
function sayHello(lang) { return `${lang}: Hello, ${this.name}`; }
console.log(sayHello.myCall({ name: "Navi" }, "EN")); // => "EN: Hello, Navi"
```

### P16: myApply
```js
console.log(sayHello.myApply({ name: "Navi" }, ["FR"])); // => "FR: Hello, Navi"
```

### P17: myBind
```js
const boundSayHello = sayHello.myBind({ name: "Navi" }, "DE");
console.log(boundSayHello()); // => "DE: Hello, Navi"
```
