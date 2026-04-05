# 04 - Closures

## Core Concept
> A closure is a function that remembers variables from its outer (lexical) scope, even after the outer function has finished executing.

---

## Section 1: Lexical Scope & Scope Chain

### Before (Confusion about variable access)
```js
const globalVar = "I'm global";

function outer() {
  const outerVar = "I'm outer";
  // Can inner() access outerVar and globalVar? 
}
```

### After (Understanding scope chain)
```js
const globalVar = "I'm global";

function outer() {
  const outerVar = "I'm outer";

  function inner() {
    const innerVar = "I'm inner";
    // Scope chain: inner → outer → global
    console.log(innerVar, outerVar, globalVar);
  }

  inner(); // => "I'm inner I'm outer I'm global"
  // outer() CANNOT access innerVar
}
outer();
```

---

## Section 2: What is a Closure?

### Before (Function can't remember outer variables after return)
```js
function createGreeter(greeting) {
  // After createGreeter returns, is `greeting` gone?
}
```

### After (Closure keeps variables alive)
```js
function createGreeter(greeting) {
  return function (name) {
    return `${greeting}, ${name}!`; // `greeting` is captured in the closure
  };
}

const sayHi = createGreeter("Hello");
const sayBye = createGreeter("Goodbye");

// createGreeter() has already returned, but greeting is still accessible!
console.log(sayHi("Alice"));  // => "Hello, Alice!"
console.log(sayBye("Bob"));   // => "Goodbye, Bob!"
```

---

## Section 3: Independent Closures

### Before (Shared state confusion)
```js
// Do two calls to the same function share variables?
```

### After (Each call creates its OWN closure)
```js
function createCounter() {
  let count = 0; // each call gets its OWN count
  return {
    increment() { return ++count; },
    getCount() { return count; },
  };
}

const counterA = createCounter();
const counterB = createCounter();

counterA.increment();
counterA.increment();
counterB.increment();

console.log(counterA.getCount()); // => 2 (independent)
console.log(counterB.getCount()); // => 1 (independent)
```

---

## Section 4: Function Factories

### Before (Repetitive functions)
```js
function double(n) { return n * 2; }
function triple(n) { return n * 3; }
function quadruple(n) { return n * 4; }
// Duplicated logic for each multiplier
```

### After (Factory using closures)
```js
function createMultiplier(factor) {
  return function (n) {
    return n * factor; // `factor` is captured by closure
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
console.log(double(7));  // => 14
console.log(triple(7));  // => 21
```

---

## Section 5: Private State with Closures

### Before (No privacy - everything is public)
```js
const account = {
  balance: 1000,
  deposit(amount) { this.balance += amount; },
};
account.balance = -9999; // anyone can directly modify!
```

### After (Truly private via closure)
```js
function createBankAccount(initialBalance) {
  let balance = initialBalance; // private! not on the returned object

  return {
    deposit(amount) { balance += amount; return balance; },
    withdraw(amount) {
      if (amount > balance) return "Insufficient funds";
      balance -= amount;
      return balance;
    },
    getBalance() { return balance; },
  };
}

const myAccount = createBankAccount(1000);
console.log(myAccount.deposit(500));   // => 1500
console.log(myAccount.withdraw(200));  // => 1300
console.log(myAccount.getBalance());   // => 1300
console.log(myAccount.balance);        // => undefined (truly private!)
```

---

## Section 6: Memoization

### Before (Recomputing every time)
```js
function expensiveAdd(a, b) {
  console.log("Computing...");
  return a + b;
}
expensiveAdd(1, 2); // Computing... => 3
expensiveAdd(1, 2); // Computing... => 3 (recomputed!)
```

### After (Cached via closure)
```js
function memoize(fn) {
  const cache = {}; // closure-held cache

  return function (...args) {
    const key = JSON.stringify(args);
    if (key in cache) {
      console.log(`(cache hit for ${key})`);
      return cache[key];
    }
    console.log(`(computing for ${key})`);
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const expensiveAdd = memoize((a, b) => a + b);
console.log(expensiveAdd(1, 2)); // (computing) => 3
console.log(expensiveAdd(1, 2)); // (cache hit) => 3
console.log(expensiveAdd(3, 4)); // (computing) => 7
```

---

## Section 7: Closures in Loops - The Classic Bug

### Before (Bug with `var`)
```js
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 0);
}
// Output: 5, 5, 5, 5, 5
// Why: `var` is function-scoped, ONE `i` shared by all callbacks.
// By the time setTimeout fires, loop is done and i === 5.
```

### After (Fix 1: `let` - block scoped)
```js
for (let j = 0; j < 5; j++) {
  setTimeout(() => console.log(j), 0);
}
// Output: 0, 1, 2, 3, 4
// `let` creates a new `j` per iteration
```

### After (Fix 2: IIFE)
```js
for (var k = 0; k < 5; k++) {
  (function (captured) {
    setTimeout(() => console.log(captured), 0);
  })(k); // pass current value as argument
}
// Output: 0, 1, 2, 3, 4
```

### After (Fix 3: setTimeout 3rd argument)
```js
for (var m = 0; m < 5; m++) {
  setTimeout((val) => console.log(val), 0, m);
  // 3rd arg is passed to the callback
}
// Output: 0, 1, 2, 3, 4
```

---

## Section 8: Module Pattern (Revealing Module)

### Before (Global variables polluting scope)
```js
let count = 0;
const MAX = 100;
function validate(n) { return n >= 0 && n <= MAX; }
function increment() { if (validate(count + 1)) count++; return count; }
// Everything is global and accessible
```

### After (IIFE + closures = module)
```js
const counterModule = (function () {
  let count = 0;        // private
  const MAX = 100;      // private

  function validate(n) { return n >= 0 && n <= MAX; } // private

  return {
    increment() { if (validate(count + 1)) count++; return count; },
    decrement() { if (validate(count - 1)) count--; return count; },
    getCount() { return count; },
  };
})();

console.log(counterModule.increment()); // => 1
console.log(counterModule.increment()); // => 2
console.log(counterModule.decrement()); // => 1
// counterModule.count;    // => undefined (private)
// counterModule.validate; // => undefined (private)
```

---

## Section 9: Memory Considerations

### Before (Closure holds large data forever)
```js
let processor = (function () {
  const largeArray = new Array(10000).fill("data");
  return function () { return largeArray.length; };
})();
// largeArray stays in memory as long as processor exists
```

### After (Release reference when done)
```js
let processor = (function () {
  const largeArray = new Array(10000).fill("data");
  return function () { return largeArray.length; };
})();

console.log(processor()); // => 10000
processor = null; // Now largeArray can be garbage collected
```

---

## Practice Q13: Counter with Initial and Step

### Before (Hardcoded counter)
```js
let count = 0;
function increment() { count += 1; }
function getCount() { return count; }
// Not configurable, single instance, global variable
```

### After (Configurable counter via closure)
```js
function createCounter(initial, step) {
  let count = initial;
  return {
    increment() { count += step; },
    decrement() { count -= step; },
    getCount() { return count; },
  };
}

const c1 = createCounter(0, 2);
c1.increment();
console.log(c1.getCount()); // => 2
c1.increment();
console.log(c1.getCount()); // => 4

const c2 = createCounter(10, 1);
c2.decrement();
console.log(c2.getCount()); // => 9
```

---

## Practice Q14: Memoized Add

### Before (No caching)
```js
function add(n) { return n + n; }
add(5); // computed every time
add(5); // computed again
```

### After (Closure cache)
```js
function createMemoizedAdd() {
  const cache = {};
  return function (n) {
    if (n in cache) return cache[n];
    const result = n + n;
    cache[n] = result;
    return result;
  };
}

const add = createMemoizedAdd();
console.log(add(5)); // => 10 (computed)
console.log(add(5)); // => 10 (cached)
```

---

## Practice Q15: Private Bank Account

### Before (Public balance)
```js
const account = { balance: 1000 };
account.balance = -5000; // no protection!
```

### After (Private via closure)
```js
function createBankAccount(initialBalance) {
  let balance = initialBalance;
  return {
    deposit(amount) { balance += amount; return balance; },
    withdraw(amount) { balance -= amount; return balance; },
    getBalance() { return balance; },
  };
}

const acc = createBankAccount(1000);
console.log(acc.deposit(500));   // => 1500
console.log(acc.withdraw(200));  // => 1300
console.log(acc.getBalance());   // => 1300
```

---

## Practice Q16: Function Factory (Multiplier)

### Before (Separate functions)
```js
function double(n) { return n * 2; }
function triple(n) { return n * 3; }
```

### After (Factory)
```js
function createMultiplier(factor) {
  return function (n) { return n * factor; };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
console.log(double(7)); // => 14
console.log(triple(7)); // => 21
```

---

## Practice P23: Bank Account with Validation

### Before (No validation)
```js
function createAccount(balance) {
  return {
    deposit(amt) { balance += amt; return balance; },
    withdraw(amt) { balance -= amt; return balance; }, // can go negative!
  };
}
```

### After (Validation in closure)
```js
function createSecureBankAccount(initialBalance) {
  let balance = initialBalance;
  return {
    deposit(amount) {
      if (amount <= 0) throw new Error("Deposit must be positive");
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount <= 0) throw new Error("Withdrawal must be positive");
      if (amount > balance) throw new Error("Insufficient funds");
      balance -= amount;
      return balance;
    },
    getBalance() { return balance; },
  };
}

const secure = createSecureBankAccount(500);
console.log(secure.deposit(100));  // => 600
console.log(secure.withdraw(50));  // => 550
secure.withdraw(1000);             // throws "Insufficient funds"
```

---

## Practice P25: Fix the var + setTimeout Bug

### Before (Bug)
```js
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log(i), 1000);
}
// Output: 5, 5, 5, 5, 5
```

### After (Fix with helper function)
```js
function delayLog(val) {
  setTimeout(() => console.log(val), 1000);
}
for (var n = 0; n < 5; n++) {
  delayLog(n); // `n` is passed by value, creating a new binding
}
// Output: 0, 1, 2, 3, 4
```
