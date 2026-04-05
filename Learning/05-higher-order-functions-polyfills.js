// ============================================
// 05 - HIGHER-ORDER FUNCTIONS & POLYFILLS
// ============================================
// A Higher-Order Function (HOF) either:
//   1. Takes a function as an argument (e.g., map, filter, reduce), OR
//   2. Returns a function (e.g., function factories, bind)
// Polyfills are custom implementations of built-in methods for learning
// and for environments where the native method doesn't exist.

// ============================================
// SECTION 1: What is a Higher-Order Function?
// ============================================

console.log("--- SECTION 1: HOF Basics ---");

// Takes a function as argument
function repeat(n, action) {
  for (let i = 0; i < n; i++) action(i);
}
repeat(3, (i) => console.log(`  Iteration ${i}`));
// => Iteration 0, Iteration 1, Iteration 2

// Returns a function
function greaterThan(n) {
  return (m) => m > n;
}
const greaterThan10 = greaterThan(10);
console.log(greaterThan10(15)); // => true
console.log(greaterThan10(5));  // => false

// ============================================
// SECTION 2: Array.prototype.map
// ============================================
// map() creates a NEW array by transforming each element.
// Output length === Input length. Does NOT mutate the original.

console.log("\n--- SECTION 2: map ---");

const numbers = [1, 2, 3, 4, 5];

// --- BAD: Manual loop for transformation ---
const doubledBad = [];
for (let i = 0; i < numbers.length; i++) {
  doubledBad.push(numbers[i] * 2);
}
console.log("Manual loop:", doubledBad); // => [2, 4, 6, 8, 10]

// --- GOOD: Using map (declarative, cleaner) ---
const doubledGood = numbers.map((n) => n * 2);
console.log("map:", doubledGood); // => [2, 4, 6, 8, 10]

// map with index and array:
const indexed = numbers.map((val, idx) => `${idx}:${val}`);
console.log("Indexed:", indexed); // => ["0:1", "1:2", "2:3", "3:4", "4:5"]

// ============================================
// SECTION 3: Array.prototype.filter
// ============================================
// filter() creates a NEW array with only elements that pass the test.
// Output length <= Input length.

console.log("\n--- SECTION 3: filter ---");

const scores = [85, 42, 93, 67, 55, 98];

// --- BAD: Manual loop ---
const passingBad = [];
for (let i = 0; i < scores.length; i++) {
  if (scores[i] >= 60) passingBad.push(scores[i]);
}
console.log("Manual:", passingBad); // => [85, 93, 67, 98]

// --- GOOD: Using filter ---
const passingGood = scores.filter((score) => score >= 60);
console.log("filter:", passingGood); // => [85, 93, 67, 98]

// ============================================
// SECTION 4: Array.prototype.reduce
// ============================================
// reduce() collapses an array into a SINGLE value using an accumulator.
// Most versatile HOF: can implement map, filter, find, etc.

console.log("\n--- SECTION 4: reduce ---");

const nums = [1, 2, 3, 4, 5];

// Basic sum
const sum = nums.reduce((acc, curr) => acc + curr, 0);
console.log("Sum:", sum); // => 15

// Without initial value: first element becomes initial accumulator
const sumNoInit = nums.reduce((acc, curr) => acc + curr);
console.log("Sum (no init):", sumNoInit); // => 15

// reduce to find max
const max = nums.reduce((acc, curr) => (curr > acc ? curr : acc));
console.log("Max:", max); // => 5

// reduce to count occurrences
const fruits = ["apple", "banana", "apple", "cherry", "banana", "apple"];
const fruitCount = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log("Count:", fruitCount); // => { apple: 3, banana: 2, cherry: 1 }

/*
  Step-by-step trace for sum with initial value 0:
  ┌─────────┬─────┬──────┬────────┐
  │ Step    │ acc │ curr │ result │
  ├─────────┼─────┼──────┼────────┤
  │ Start   │  0  │  1   │   1    │
  │ Step 2  │  1  │  2   │   3    │
  │ Step 3  │  3  │  3   │   6    │
  │ Step 4  │  6  │  4   │  10    │
  │ Step 5  │ 10  │  5   │  15    │
  └─────────┴─────┴──────┴────────┘
*/

// ============================================
// SECTION 5: Chaining HOFs
// ============================================
// The power of HOFs: chain map → filter → reduce for clean data pipelines.

console.log("\n--- SECTION 5: Chaining ---");

const products = [
  { name: "Laptop", price: 1000, inStock: true },
  { name: "Phone", price: 500, inStock: false },
  { name: "Tablet", price: 300, inStock: true },
  { name: "Watch", price: 200, inStock: true },
];

// Get total value of in-stock products with 10% tax
const totalInStock = products
  .filter((p) => p.inStock)          // keep only in-stock
  .map((p) => p.price * 1.1)         // add 10% tax
  .reduce((sum, price) => sum + price, 0); // sum up

console.log("Total (with tax):", totalInStock); // => 1650

// ============================================
// SECTION 6: Polyfill - myMap
// ============================================
// Recreate Array.prototype.map from scratch.

console.log("\n--- SECTION 6: myMap Polyfill ---");

Array.prototype.myMap = function (callback, thisArg) {
  // `this` refers to the array the method is called on
  if (this == null) throw new TypeError("Cannot read properties of null");
  if (typeof callback !== "function") throw new TypeError(callback + " is not a function");

  const result = [];
  for (let i = 0; i < this.length; i++) {
    // Only process existing indices (handles sparse arrays)
    if (i in this) {
      // Use .call() to apply thisArg as the callback's `this`
      result[i] = callback.call(thisArg, this[i], i, this);
    }
  }
  return result;
};

const arr = [1, 2, 3];
const doubled = arr.myMap((x) => x * 2);
console.log(doubled); // => [2, 4, 6]

// With thisArg:
const multiplier = { factor: 10 };
const scaled = arr.myMap(function (x) {
  return x * this.factor; // `this` is `multiplier` thanks to thisArg
}, multiplier);
console.log(scaled); // => [10, 20, 30]

// ============================================
// SECTION 7: Polyfill - myFilter
// ============================================

console.log("\n--- SECTION 7: myFilter Polyfill ---");

Array.prototype.myFilter = function (callback, thisArg) {
  if (this == null) throw new TypeError("Cannot read properties of null");
  if (typeof callback !== "function") throw new TypeError(callback + " is not a function");

  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) {
      // Only push elements where callback returns truthy
      if (callback.call(thisArg, this[i], i, this)) {
        result.push(this[i]);
      }
    }
  }
  return result;
};

const evens = [1, 2, 3, 4, 5, 6].myFilter((x) => x % 2 === 0);
console.log(evens); // => [2, 4, 6]

// ============================================
// SECTION 8: Polyfill - myReduce
// ============================================

console.log("\n--- SECTION 8: myReduce Polyfill ---");

Array.prototype.myReduce = function (callback, initialValue) {
  if (this == null) throw new TypeError("Cannot read properties of null");
  if (typeof callback !== "function") throw new TypeError(callback + " is not a function");

  let acc;
  let startIndex;

  if (arguments.length >= 2) {
    // Initial value provided: start accumulator = initialValue, loop from index 0
    acc = initialValue;
    startIndex = 0;
  } else {
    // No initial value: use first element as accumulator, loop from index 1
    if (this.length === 0) {
      throw new TypeError("Reduce of empty array with no initial value");
    }
    acc = this[0];
    startIndex = 1;
  }

  for (let i = startIndex; i < this.length; i++) {
    if (i in this) {
      acc = callback(acc, this[i], i, this);
    }
  }

  return acc;
};

const sum1 = [1, 2, 3, 4, 5].myReduce((acc, curr) => acc + curr, 0);
const sum2 = [1, 2, 3, 4, 5].myReduce((acc, curr) => acc + curr);
console.log(sum1); // => 15
console.log(sum2); // => 15

// Error case:
try {
  [].myReduce((acc, curr) => acc + curr);
} catch (e) {
  console.log(e.message); // => "Reduce of empty array with no initial value"
}

// ============================================
// PRACTICE Q17: Polyfill for Array.prototype.myMap
// ============================================
// (Already implemented above in Section 6)

console.log("\n--- PRACTICE Q17: myMap ---");
const result17 = [1, 2, 3].myMap((x) => x * 2);
console.log(result17); // => [2, 4, 6]

// ============================================
// PRACTICE Q18: Polyfill for Array.prototype.myFilter
// ============================================
// (Already implemented above in Section 7)

console.log("\n--- PRACTICE Q18: myFilter ---");
const evens18 = [1, 2, 3, 4, 5, 6].myFilter((x) => x % 2 === 0);
console.log(evens18); // => [2, 4, 6]

// ============================================
// PRACTICE Q19: Polyfill for Array.prototype.myReduce
// ============================================
// (Already implemented above in Section 8)

console.log("\n--- PRACTICE Q19: myReduce ---");
const sumQ19a = [1, 2, 3, 4, 5].myReduce((acc, curr) => acc + curr, 0);
const sumQ19b = [1, 2, 3, 4, 5].myReduce((acc, curr) => acc + curr);
console.log(sumQ19a); // => 15
console.log(sumQ19b); // => 15

// ============================================
// PRACTICE Q20: Chaining HOFs (map, filter, reduce)
// ============================================

console.log("\n--- PRACTICE Q20: Chaining HOFs ---");

const people = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 17 },
  { name: "Charlie", age: 30 },
];

const result20 = people
  .filter((p) => p.age >= 18)                     // keep adults
  .map((p) => `${p.name} is adult`)               // transform to string
  .reduce((acc, curr) => {                         // join with "; "
    return acc ? `${acc}; ${curr}` : curr;
  }, "");

console.log(result20); // => "Alice is adult; Charlie is adult"

// ============================================
// BONUS: When to use which HOF?
// ============================================
/*
  ┌────────────┬──────────────────────────────────┬────────────────────┐
  │ Method     │ Use when...                      │ Output             │
  ├────────────┼──────────────────────────────────┼────────────────────┤
  │ map        │ Transform every element           │ Array (same length)│
  │ filter     │ Keep elements matching condition  │ Array (≤ length)   │
  │ reduce     │ Combine into single value         │ Any type           │
  │ forEach    │ Side effects (logging, mutation)  │ undefined          │
  │ find       │ Get first matching element        │ Element or undef   │
  │ some       │ Check if ANY match                │ boolean            │
  │ every      │ Check if ALL match                │ boolean            │
  └────────────┴──────────────────────────────────┴────────────────────┘
*/
