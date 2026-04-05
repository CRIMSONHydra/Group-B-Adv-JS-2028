# 11 - Functional Utilities

## Core Concept
> Essential utility functions built on closures and higher-order functions: debounce, throttle, once, memoize, rate limiter, curry, infinite currying, and function logger.

---

## Section 1: Debounce (P9)

### Before (No debounce - fires on every keystroke)
```js
input.addEventListener("input", callApi);
// 20 keystrokes = 20 API calls!
```

### After (Debounced - fires once after user stops typing)
```js
function debounce(fn, delay) {
  let timerId = null;

  return function (...args) {
    clearTimeout(timerId);      // cancel previous timer
    timerId = setTimeout(() => {
      fn.apply(this, args);     // preserve `this` and args
    }, delay);
  };
}

// Test:
let callCount = 0;
const debouncedFn = debounce(() => {
  callCount++;
  console.log(`Debounced call #${callCount}`);
}, 100);

debouncedFn(); // timer starts
debouncedFn(); // timer resets
debouncedFn(); // timer resets - only THIS one fires (after 100ms)
```

---

## Section 2: Throttle (P10)

### Before (No throttle - fires on every scroll event)
```js
window.addEventListener("scroll", handleScroll);
// 100+ events per second while scrolling!
```

### After (Throttled - max one execution per interval)
```js
function throttle(fn, interval) {
  let lastCallTime = 0;

  return function (...args) {
    const now = Date.now();
    if (now - lastCallTime >= interval) {
      lastCallTime = now;
      return fn.apply(this, args);
    }
    // else: call is dropped (too soon)
  };
}

// Test:
const throttledFn = throttle(() => {
  console.log("Throttled call");
}, 100);

throttledFn(); // executes (first call)
throttledFn(); // dropped (too soon)
throttledFn(); // dropped (too soon)
// After 100ms+, next call would execute
```

---

## Section 3: once(fn) (P21)

### Before (No protection against multiple calls)
```js
function initialize() {
  console.log("Initializing...");
  // expensive setup work
  return { status: "ready" };
}

initialize(); // first time: good
initialize(); // second time: oops, runs again!
initialize(); // third time: runs yet again!
```

### After (Executes only once, returns cached result)
```js
function once(fn) {
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args);
    }
    return result; // always return first result
  };
}

const initialize = once(() => {
  console.log("Initializing...");
  return { status: "ready" };
});

console.log(initialize()); // => "Initializing..." then { status: "ready" }
console.log(initialize()); // => { status: "ready" } (no re-initialization)
console.log(initialize()); // => { status: "ready" } (still the same)
```

---

## Section 4: memoize(fn) (P22)

### Before (Recomputing expensive results)
```js
function factorial(n) {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

factorial(20); // computes from scratch
factorial(20); // computes from scratch AGAIN
```

### After (Cached results via closure)
```js
function memoize(fn) {
  const cache = new Map();

  return function (...args) {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`Cache hit for args: ${key}`);
      return cache.get(key);
    }

    console.log(`Computing for args: ${key}`);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const factorial = memoize(function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1);
});

console.log(factorial(5)); // => Computing... 120
console.log(factorial(5)); // => Cache hit... 120
console.log(factorial(3)); // => Computing... 6
```

**Limitations of JSON.stringify keying:**
- Objects with different key order: `{a:1, b:2}` vs `{b:2, a:1}` produce different keys
- Functions, undefined, symbols are dropped
- Circular references throw errors
- For production: use a custom key function or WeakMap

---

## Section 5: Rate Limiter (P24)

### Before (No rate limiting - server gets overwhelmed)
```js
function callApi(msg) { console.log(`API call: ${msg}`); }
callApi("a"); // goes through
callApi("b"); // goes through
callApi("c"); // goes through - server overwhelmed!
```

### After (Only `limit` calls per time window)
```js
function rateLimit(fn, limit, windowMs) {
  const timestamps = [];

  return function (...args) {
    const now = Date.now();

    // Remove timestamps outside the window
    while (timestamps.length > 0 && now - timestamps[0] >= windowMs) {
      timestamps.shift();
    }

    if (timestamps.length < limit) {
      timestamps.push(now);
      return fn.apply(this, args);
    } else {
      console.log("Rate limited! Try again later.");
      return undefined;
    }
  };
}

const limitedLog = rateLimit(
  (msg) => console.log(`API call: ${msg}`),
  2,    // max 2 calls
  1000  // per 1 second
);

limitedLog("first");  // => "API call: first"
limitedLog("second"); // => "API call: second"
limitedLog("third");  // => "Rate limited!"
```

---

## Section 6: Curry (P26)

### Before (Must pass all args at once)
```js
function addThree(a, b, c) { return a + b + c; }
addThree(1, 2, 3); // => 6
// Can't partially apply: addThree(1)(2)(3) doesn't work
```

### After (Arguments can be supplied gradually)
```js
function curry(fn) {
  return function curried(...args) {
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    return function (...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

function addThree(a, b, c) { return a + b + c; }
const curriedAdd = curry(addThree);

// All produce the same result:
console.log(curriedAdd(1, 2, 3));  // => 6
console.log(curriedAdd(1)(2)(3));  // => 6
console.log(curriedAdd(1, 2)(3));  // => 6
console.log(curriedAdd(1)(2, 3));  // => 6

// Create specialized functions:
const add10 = curriedAdd(10);
const add10and20 = add10(20);
console.log(add10and20(5)); // => 35
```

---

## Section 7: Infinite Currying Sum (P27)

### Before (Fixed number of arguments)
```js
function sum(a, b, c) { return a + b + c; }
// Can't chain: sum(1)(2)(3)(4)(5)
```

### After (Chain indefinitely, empty call terminates)
```js
function sum(...args) {
  const total = args.reduce((a, b) => a + b, 0);

  function inner(...moreArgs) {
    if (moreArgs.length === 0) {
      return total; // empty call -> return accumulated total
    }
    return sum(total + moreArgs.reduce((a, b) => a + b, 0));
  }

  return inner;
}

console.log(sum(1)(2)(3)(4)());       // => 10
console.log(sum(1, 2)(3)(4, 5)());    // => 15
console.log(sum(10)());               // => 10
console.log(sum(1)(2)(3)(4)(5)(6)()); // => 21
```

---

## Section 8: Function Logger Wrapper (P28)

### Before (Manual logging for every function)
```js
function multiply(a, b) {
  console.log(`Calling multiply with args: [${a}, ${b}]`);
  const result = a * b;
  console.log(`multiply returned: ${result}`);
  return result;
}
// Must add logging to every function manually
```

### After (Generic wrapper for any function)
```js
function withLogging(fn) {
  return function (...args) {
    const fnName = fn.name || "anonymous";
    console.log(`[LOG] Calling ${fnName} with args:`, args);

    try {
      const result = fn.apply(this, args);
      console.log(`[LOG] ${fnName} returned:`, result);
      return result;
    } catch (err) {
      console.log(`[LOG] ${fnName} threw:`, err.message);
      throw err; // re-throw
    }
  };
}

function multiply(a, b) { return a * b; }

const loggedMultiply = withLogging(multiply);
loggedMultiply(3, 4);
// => [LOG] Calling multiply with args: [3, 4]
// => [LOG] multiply returned: 12

function riskyFn() { throw new Error("Something broke"); }
const loggedRisky = withLogging(riskyFn);
try { loggedRisky(); } catch (e) {}
// => [LOG] Calling riskyFn with args: []
// => [LOG] riskyFn threw: Something broke
```
