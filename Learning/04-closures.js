// ============================================
// 04 - CLOSURES
// ============================================
// A closure is a function that remembers variables from its outer (lexical) scope,
// even after the outer function has finished executing.
// Closures are the foundation of: private state, memoization, currying,
// function factories, and the module pattern.

// ============================================
// SECTION 1: Lexical Scope & Scope Chain
// ============================================
// Lexical scope = where a function is WRITTEN determines what variables it can access.
// Scope chain = current scope → parent scope → grandparent → ... → global

console.log("--- SECTION 1: Lexical Scope ---");

const globalVar = "I'm global";

function outer() {
  const outerVar = "I'm outer";

  function inner() {
    const innerVar = "I'm inner";
    // inner() can access: innerVar, outerVar, globalVar (walks up the chain)
    console.log(innerVar, outerVar, globalVar);
  }

  inner();
  // outer() can access: outerVar, globalVar (but NOT innerVar)
}

outer(); // => "I'm inner I'm outer I'm global"

// ============================================
// SECTION 2: What is a Closure?
// ============================================
// When a function is returned from another function, it carries its
// lexical environment with it. The outer variables stay alive in memory.

console.log("\n--- SECTION 2: Closure Basics ---");

function createGreeter(greeting) {
  // `greeting` is captured in the closure
  return function (name) {
    return `${greeting}, ${name}!`;
  };
}

const sayHi = createGreeter("Hello");
const sayBye = createGreeter("Goodbye");

// createGreeter() has already finished, but `greeting` is still accessible!
console.log(sayHi("Alice"));  // => "Hello, Alice!"
console.log(sayBye("Bob"));   // => "Goodbye, Bob!"

// ============================================
// SECTION 3: Independent Closures
// ============================================
// Each call to the outer function creates a NEW closure with its OWN variables.

console.log("\n--- SECTION 3: Independent Closures ---");

function createCounter() {
  let count = 0; // each call gets its OWN `count`
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

// ============================================
// SECTION 4: Function Factories
// ============================================
// A function that returns customized functions based on parameters.

console.log("\n--- SECTION 4: Function Factories ---");

function createMultiplier(factor) {
  return function (n) {
    return n * factor; // `factor` is captured by closure
  };
}

const double = createMultiplier(2);
const triple = createMultiplier(3);
console.log(double(7));  // => 14
console.log(triple(7));  // => 21

// ============================================
// SECTION 5: Private State with Closures
// ============================================
// Closures let you create truly private variables that can only be
// accessed/modified through returned functions.

console.log("\n--- SECTION 5: Private State ---");

function createBankAccount(initialBalance) {
  let balance = initialBalance; // private! not on the returned object

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      if (amount > balance) return "Insufficient funds";
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const myAccount = createBankAccount(1000);
console.log(myAccount.deposit(500));    // => 1500
console.log(myAccount.withdraw(200));   // => 1300
console.log(myAccount.getBalance());    // => 1300
// console.log(myAccount.balance);      // => undefined (truly private!)

// ============================================
// SECTION 6: Memoization
// ============================================
// Cache expensive computation results in a closure.

console.log("\n--- SECTION 6: Memoization ---");

function memoize(fn) {
  const cache = {}; // closure-held cache

  return function (...args) {
    const key = JSON.stringify(args);
    if (key in cache) {
      console.log(`  (cache hit for ${key})`);
      return cache[key];
    }
    console.log(`  (computing for ${key})`);
    const result = fn(...args);
    cache[key] = result;
    return result;
  };
}

const expensiveAdd = memoize((a, b) => a + b);
console.log(expensiveAdd(1, 2)); // => (computing) 3
console.log(expensiveAdd(1, 2)); // => (cache hit) 3
console.log(expensiveAdd(3, 4)); // => (computing) 7

// ============================================
// SECTION 7: Closures in Loops - The Classic Bug
// ============================================
// The most common closure interview question.

console.log("\n--- SECTION 7: Closures in Loops ---");

// --- BAD EXAMPLE: `var` in a loop ---
// `var` is function-scoped, so there's only ONE `i` shared by all callbacks.
// By the time setTimeout fires, the loop has finished and i === 5.

console.log("BAD (var):");
for (var i = 0; i < 5; i++) {
  setTimeout(() => console.log("  var i:", i), 0);
}
// Output: 5, 5, 5, 5, 5 (all see the same `i`)

// --- GOOD EXAMPLE (Fix 1): Use `let` ---
// `let` is block-scoped: each iteration gets its OWN `i`.
console.log("GOOD (let):");
for (let j = 0; j < 5; j++) {
  setTimeout(() => console.log("  let j:", j), 50);
}
// Output: 0, 1, 2, 3, 4

// --- GOOD EXAMPLE (Fix 2): IIFE ---
// Immediately Invoked Function Expression creates a new scope per iteration.
console.log("GOOD (IIFE):");
for (var k = 0; k < 5; k++) {
  (function (captured) {
    setTimeout(() => console.log("  IIFE k:", captured), 100);
  })(k); // pass current value of k as argument
}
// Output: 0, 1, 2, 3, 4

// --- GOOD EXAMPLE (Fix 3): setTimeout's 3rd argument ---
console.log("GOOD (setTimeout 3rd arg):");
for (var m = 0; m < 5; m++) {
  setTimeout(
    (val) => console.log("  3rd arg m:", val),
    150,
    m // this value is passed as the first arg to the callback
  );
}
// Output: 0, 1, 2, 3, 4

// ============================================
// SECTION 8: Module Pattern (Revealing Module)
// ============================================
// Use an IIFE + closures to create a module with private internals
// and a public API. This was THE pattern before ES modules.

console.log("\n--- SECTION 8: Module Pattern ---");

const counterModule = (function () {
  // Private variables (not accessible outside)
  let count = 0;
  const MAX = 100;

  // Private function
  function validate(n) {
    return n >= 0 && n <= MAX;
  }

  // Public API (revealed)
  return {
    increment() {
      if (validate(count + 1)) count++;
      return count;
    },
    decrement() {
      if (validate(count - 1)) count--;
      return count;
    },
    getCount() {
      return count;
    },
  };
})();

console.log(counterModule.increment()); // => 1
console.log(counterModule.increment()); // => 2
console.log(counterModule.decrement()); // => 1
// console.log(counterModule.count);    // => undefined (private)
// counterModule.validate(5);           // TypeError (private)

// ============================================
// SECTION 9: Memory Considerations
// ============================================
// Closures keep outer variables alive as long as the inner function exists.
// This is usually fine, but can cause memory leaks if not managed.

console.log("\n--- SECTION 9: Memory ---");

// If you're done with a closure, set the reference to null
// so the garbage collector can free the memory.
let bigDataProcessor = (function () {
  const largeArray = new Array(10000).fill("data");
  return function () {
    return largeArray.length;
  };
})();

console.log(bigDataProcessor()); // => 10000
bigDataProcessor = null; // Now largeArray can be garbage collected

// ============================================
// PRACTICE Q13: Closure Counter with Initial and Step
// ============================================

console.log("\n--- PRACTICE Q13: Counter with Step ---");

function createCounterQ13(initial, step) {
  let count = initial; // private via closure

  return {
    increment() {
      count += step;
    },
    decrement() {
      count -= step;
    },
    getCount() {
      return count;
    },
  };
}

const c1 = createCounterQ13(0, 2);
c1.increment();
console.log(c1.getCount()); // => 2
c1.increment();
console.log(c1.getCount()); // => 4

const c2 = createCounterQ13(10, 1);
c2.decrement();
console.log(c2.getCount()); // => 9

// ============================================
// PRACTICE Q14: Memoized Add (Closure Cache)
// ============================================

console.log("\n--- PRACTICE Q14: Memoized Add ---");

function createMemoizedAdd() {
  const cache = {}; // private cache via closure

  return function (n) {
    if (n in cache) {
      return cache[n]; // return cached result
    }
    const result = n + n;
    cache[n] = result; // store in cache
    return result;
  };
}

const add = createMemoizedAdd();
console.log(add(5)); // => 10 (computed)
console.log(add(5)); // => 10 (cached)

// ============================================
// PRACTICE Q15: Private Bank Account with Closures
// ============================================

console.log("\n--- PRACTICE Q15: Bank Account ---");

function createBankAccountQ15(initialBalance) {
  let balance = initialBalance;

  return {
    deposit(amount) {
      balance += amount;
      return balance;
    },
    withdraw(amount) {
      balance -= amount;
      return balance;
    },
    getBalance() {
      return balance;
    },
  };
}

const acc = createBankAccountQ15(1000);
console.log(acc.deposit(500));    // => 1500
console.log(acc.withdraw(200));   // => 1300
console.log(acc.getBalance());    // => 1300

// ============================================
// PRACTICE Q16: Function Factory (Multiplier)
// ============================================

console.log("\n--- PRACTICE Q16: Multiplier Factory ---");

function createMultiplierQ16(factor) {
  return function (n) {
    return n * factor;
  };
}

const doubleQ16 = createMultiplierQ16(2);
const tripleQ16 = createMultiplierQ16(3);
console.log(doubleQ16(7)); // => 14
console.log(tripleQ16(7)); // => 21

// ============================================
// PRACTICE P23: Private Variables Using Closures (Bank Account with validation)
// ============================================

console.log("\n--- PRACTICE P23: Bank Account with Validation ---");

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
    getBalance() {
      return balance;
    },
  };
}

const secure = createSecureBankAccount(500);
console.log(secure.deposit(100));   // => 600
console.log(secure.withdraw(50));   // => 550
try {
  secure.withdraw(1000);
} catch (e) {
  console.log(e.message);          // => "Insufficient funds"
}

// ============================================
// PRACTICE P25: Fix the var + setTimeout Bug
// ============================================

console.log("\n--- PRACTICE P25: var + setTimeout Bug ---");

// Problem: What does this print?
// for (var i = 0; i < 5; i++) {
//   setTimeout(() => console.log(i), 1000);
// }
// Answer: 5, 5, 5, 5, 5
// Why: `var` is function-scoped. There's one `i` shared by all callbacks.
//      By the time callbacks fire, the loop is done and i === 5.

// Fix 1: let (block-scoped, each iteration gets its own i)
// for (let i = 0; i < 5; i++) { setTimeout(() => console.log(i), 1000); }

// Fix 2: IIFE (creates new scope per iteration)
// for (var i = 0; i < 5; i++) {
//   (function(j) { setTimeout(() => console.log(j), 1000); })(i);
// }

// Fix 3: Helper function
function delayLog(val) {
  setTimeout(() => console.log("  P25 helper:", val), 200);
}
for (var n = 0; n < 5; n++) {
  delayLog(n); // `n` is passed by value, creating a new binding
}
// Output: 0, 1, 2, 3, 4
