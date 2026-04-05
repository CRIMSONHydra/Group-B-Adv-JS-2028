// ============================================
// 11 - FUNCTIONAL UTILITIES
// ============================================
// Essential utility functions that appear in interviews and real codebases:
// debounce, throttle, once, memoize, rate limiter, curry, infinite currying,
// and function logger. All built on closures and higher-order functions.

// ============================================
// SECTION 1: Debounce (P9)
// ============================================
// Delays execution until no calls happen for `delay` ms.
// If called again during the delay, the timer resets.
// Use case: search input, window resize, auto-save.

console.log("--- SECTION 1: Debounce ---");

// --- BAD: No debounce → fires on every keystroke ---
// input.addEventListener("input", callApi); // 20 keystrokes = 20 API calls!

// --- GOOD: Debounced → fires once after user stops typing ---
function debounce(fn, delay) {
  let timerId = null; // closure holds the timer

  return function (...args) {
    clearTimeout(timerId); // cancel previous timer
    timerId = setTimeout(() => {
      fn.apply(this, args); // preserve `this` and args
    }, delay);
  };
}

// Test:
let debounceCallCount = 0;
const debouncedFn = debounce(() => {
  debounceCallCount++;
  console.log(`  Debounced call #${debounceCallCount}`);
}, 100);

// Rapid calls: only the LAST one fires
debouncedFn();
debouncedFn();
debouncedFn(); // only this one executes (after 100ms)

// ============================================
// SECTION 2: Throttle (P10)
// ============================================
// Allows at most ONE execution per `interval` ms.
// First call executes immediately, subsequent calls within the interval are dropped.
// Use case: scroll handler, analytics events, button clicks.

console.log("\n--- SECTION 2: Throttle ---");

function throttle(fn, interval) {
  let lastCallTime = 0; // closure tracks last execution time

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
let throttleCount = 0;
const throttledFn = throttle(() => {
  throttleCount++;
  console.log(`  Throttled call #${throttleCount}`);
}, 100);

throttledFn(); // executes (first call)
throttledFn(); // dropped (too soon)
throttledFn(); // dropped (too soon)
// After 100ms+, next call would execute

// ============================================
// SECTION 3: once(fn) (P21)
// ============================================
// Ensures a function executes only ONCE. Subsequent calls return the first result.
// Use case: initialization, one-time setup, database connection.

console.log("\n--- SECTION 3: once ---");

function once(fn) {
  let called = false;
  let result;

  return function (...args) {
    if (!called) {
      called = true;
      result = fn.apply(this, args); // preserve context
    }
    return result; // always return first result
  };
}

const initialize = once(() => {
  console.log("  Initializing...");
  return { status: "ready" };
});

console.log(initialize()); // => "Initializing..." then { status: "ready" }
console.log(initialize()); // => { status: "ready" } (no re-initialization)
console.log(initialize()); // => { status: "ready" } (still the same)

// ============================================
// SECTION 4: memoize(fn) (P22)
// ============================================
// Caches function results based on arguments.
// Same args → return cached result instead of recomputing.
// Limitation: JSON.stringify keying doesn't work well for objects/functions.

console.log("\n--- SECTION 4: memoize ---");

function memoize(fn) {
  const cache = new Map(); // closure-held cache

  return function (...args) {
    // Create a key from the arguments
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      console.log(`  Cache hit for args: ${key}`);
      return cache.get(key);
    }

    console.log(`  Computing for args: ${key}`);
    const result = fn.apply(this, args);
    cache.set(key, result);
    return result;
  };
}

const factorial = memoize(function fact(n) {
  if (n <= 1) return 1;
  return n * fact(n - 1); // note: recursive calls won't hit the cache
});

console.log(factorial(5));  // => Computing... 120
console.log(factorial(5));  // => Cache hit... 120
console.log(factorial(3));  // => Computing... 6

/*
  Limitations of JSON.stringify keying:
  - Objects with different key order: {a:1, b:2} vs {b:2, a:1} → different keys
  - Functions, undefined, symbols are dropped by JSON.stringify
  - Circular references throw errors

  For production: use a custom key function or WeakMap for object args.
*/

// ============================================
// SECTION 5: Rate Limiter (P24)
// ============================================
// Allow only `limit` calls within a rolling `windowMs` time window.
// Calls beyond the limit are rejected.

console.log("\n--- SECTION 5: Rate Limiter ---");

function rateLimit(fn, limit, windowMs) {
  const timestamps = []; // closure tracks call times

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
      console.log("  Rate limited! Try again later.");
      return undefined;
    }
  };
}

const limitedLog = rateLimit(
  (msg) => console.log(`  API call: ${msg}`),
  2,    // max 2 calls
  1000  // per 1 second
);

limitedLog("first");  // => "API call: first"
limitedLog("second"); // => "API call: second"
limitedLog("third");  // => "Rate limited!"

// ============================================
// SECTION 6: Curry (P26)
// ============================================
// Transform a function so arguments can be supplied gradually.
// curry(fn)(1)(2)(3) === fn(1, 2, 3)
// curry(fn)(1, 2)(3) === fn(1, 2, 3)

console.log("\n--- SECTION 6: Curry ---");

function curry(fn) {
  return function curried(...args) {
    // If enough args collected, call the original function
    if (args.length >= fn.length) {
      return fn.apply(this, args);
    }
    // Otherwise, return a function that collects more args
    return function (...moreArgs) {
      return curried.apply(this, [...args, ...moreArgs]);
    };
  };
}

function addThree(a, b, c) {
  return a + b + c;
}

const curriedAdd = curry(addThree);

// All these produce the same result:
console.log(curriedAdd(1, 2, 3));    // => 6
console.log(curriedAdd(1)(2)(3));    // => 6
console.log(curriedAdd(1, 2)(3));    // => 6
console.log(curriedAdd(1)(2, 3));    // => 6

// Practical use: create specialized functions
const add10 = curriedAdd(10);
const add10and20 = add10(20);
console.log(add10and20(5)); // => 35

// ============================================
// SECTION 7: Infinite Currying Sum (P27)
// ============================================
// Chain calls: sum(1)(2)(3)(4)() → 10
// Empty call () terminates and returns the total.

console.log("\n--- SECTION 7: Infinite Currying ---");

function sum(...args) {
  const total = args.reduce((a, b) => a + b, 0);

  // Return a function that accumulates more args
  function inner(...moreArgs) {
    if (moreArgs.length === 0) {
      return total; // empty call → return accumulated total
    }
    return sum(total + moreArgs.reduce((a, b) => a + b, 0));
  }

  return inner;
}

console.log(sum(1)(2)(3)(4)());         // => 10
console.log(sum(1, 2)(3)(4, 5)());      // => 15
console.log(sum(10)());                 // => 10
console.log(sum(1)(2)(3)(4)(5)(6)());   // => 21

// ============================================
// SECTION 8: Function Logger Wrapper (P28)
// ============================================
// Wrap any function to log its name, args, return value, and errors.
// Useful for debugging and analytics.

console.log("\n--- SECTION 8: Function Logger ---");

function withLogging(fn) {
  return function (...args) {
    const fnName = fn.name || "anonymous";
    console.log(`  [LOG] Calling ${fnName} with args:`, args);

    try {
      const result = fn.apply(this, args); // preserve `this`
      console.log(`  [LOG] ${fnName} returned:`, result);
      return result;
    } catch (err) {
      console.log(`  [LOG] ${fnName} threw:`, err.message);
      throw err; // re-throw so caller still gets the error
    }
  };
}

function multiply(a, b) {
  return a * b;
}

const loggedMultiply = withLogging(multiply);
loggedMultiply(3, 4);
// => [LOG] Calling multiply with args: [3, 4]
// => [LOG] multiply returned: 12

function riskyFn() {
  throw new Error("Something broke");
}

const loggedRisky = withLogging(riskyFn);
try {
  loggedRisky();
} catch (e) {
  // error was logged and re-thrown
}
// => [LOG] Calling riskyFn with args: []
// => [LOG] riskyFn threw: Something broke
