# 05 - Higher-Order Functions & Polyfills

## Core Concept
> A Higher-Order Function (HOF) either takes a function as an argument OR returns a function.

---

## When to Use Which HOF

| Method | Use when... | Output |
|---|---|---|
| `map` | Transform every element | Array (same length) |
| `filter` | Keep elements matching condition | Array (<= length) |
| `reduce` | Combine into single value | Any type |
| `forEach` | Side effects (logging, mutation) | undefined |
| `find` | Get first matching element | Element or undefined |
| `some` | Check if ANY match | boolean |
| `every` | Check if ALL match | boolean |

---

## Section 1: What is a HOF?

### Before (No HOFs - imperative loops)
```js
// Repeat an action 3 times
console.log("Iteration 0");
console.log("Iteration 1");
console.log("Iteration 2");
```

### After (HOF - pass behavior as argument)
```js
function repeat(n, action) {
  for (let i = 0; i < n; i++) action(i);
}
repeat(3, (i) => console.log(`Iteration ${i}`));

// Returns a function
function greaterThan(n) {
  return (m) => m > n;
}
const greaterThan10 = greaterThan(10);
console.log(greaterThan10(15)); // => true
console.log(greaterThan10(5));  // => false
```

---

## Section 2: Array.prototype.map

### Before (Manual loop)
```js
const numbers = [1, 2, 3, 4, 5];
const doubled = [];
for (let i = 0; i < numbers.length; i++) {
  doubled.push(numbers[i] * 2);
}
console.log(doubled); // => [2, 4, 6, 8, 10]
```

### After (Using map)
```js
const numbers = [1, 2, 3, 4, 5];
const doubled = numbers.map((n) => n * 2);
console.log(doubled); // => [2, 4, 6, 8, 10]

// With index:
const indexed = numbers.map((val, idx) => `${idx}:${val}`);
console.log(indexed); // => ["0:1", "1:2", "2:3", "3:4", "4:5"]
```

---

## Section 3: Array.prototype.filter

### Before (Manual loop)
```js
const scores = [85, 42, 93, 67, 55, 98];
const passing = [];
for (let i = 0; i < scores.length; i++) {
  if (scores[i] >= 60) passing.push(scores[i]);
}
console.log(passing); // => [85, 93, 67, 98]
```

### After (Using filter)
```js
const scores = [85, 42, 93, 67, 55, 98];
const passing = scores.filter((score) => score >= 60);
console.log(passing); // => [85, 93, 67, 98]
```

---

## Section 4: Array.prototype.reduce

### Before (Manual accumulation)
```js
const nums = [1, 2, 3, 4, 5];
let sum = 0;
for (let i = 0; i < nums.length; i++) {
  sum += nums[i];
}
console.log(sum); // => 15
```

### After (Using reduce)
```js
const nums = [1, 2, 3, 4, 5];

// Basic sum
const sum = nums.reduce((acc, curr) => acc + curr, 0);
console.log(sum); // => 15

// Find max
const max = nums.reduce((acc, curr) => (curr > acc ? curr : acc));
console.log(max); // => 5

// Count occurrences
const fruits = ["apple", "banana", "apple", "cherry", "banana", "apple"];
const fruitCount = fruits.reduce((acc, fruit) => {
  acc[fruit] = (acc[fruit] || 0) + 1;
  return acc;
}, {});
console.log(fruitCount); // => { apple: 3, banana: 2, cherry: 1 }
```

**Trace table for sum:**

| Step | acc | curr | result |
|---|---|---|---|
| Start | 0 | 1 | 1 |
| Step 2 | 1 | 2 | 3 |
| Step 3 | 3 | 3 | 6 |
| Step 4 | 6 | 4 | 10 |
| Step 5 | 10 | 5 | 15 |

---

## Section 5: Chaining HOFs

### Before (Separate loops for each operation)
```js
const products = [
  { name: "Laptop", price: 1000, inStock: true },
  { name: "Phone", price: 500, inStock: false },
  { name: "Tablet", price: 300, inStock: true },
  { name: "Watch", price: 200, inStock: true },
];

// Step 1: filter in-stock
const inStock = [];
for (const p of products) { if (p.inStock) inStock.push(p); }
// Step 2: add tax
const withTax = [];
for (const p of inStock) { withTax.push(p.price * 1.1); }
// Step 3: sum
let total = 0;
for (const price of withTax) { total += price; }
```

### After (Chain: filter -> map -> reduce)
```js
const totalInStock = products
  .filter((p) => p.inStock)               // keep only in-stock
  .map((p) => p.price * 1.1)              // add 10% tax
  .reduce((sum, price) => sum + price, 0); // sum up

console.log(totalInStock); // => 1650
```

---

## Section 6: Polyfill - myMap

### Before (Using built-in map as a black box)
```js
[1, 2, 3].map((x) => x * 2); // how does this work internally?
```

### After (Custom implementation)
```js
Array.prototype.myMap = function (callback, thisArg) {
  if (this == null) throw new TypeError("Cannot read properties of null");
  if (typeof callback !== "function") throw new TypeError(callback + " is not a function");

  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) { // handle sparse arrays
      result[i] = callback.call(thisArg, this[i], i, this);
    }
  }
  return result;
};

const arr = [1, 2, 3];
console.log(arr.myMap((x) => x * 2)); // => [2, 4, 6]

// With thisArg:
const multiplier = { factor: 10 };
const scaled = arr.myMap(function (x) {
  return x * this.factor;
}, multiplier);
console.log(scaled); // => [10, 20, 30]
```

---

## Section 7: Polyfill - myFilter

### Before (Black box)
```js
[1, 2, 3, 4, 5, 6].filter((x) => x % 2 === 0); // how?
```

### After (Custom implementation)
```js
Array.prototype.myFilter = function (callback, thisArg) {
  if (this == null) throw new TypeError("Cannot read properties of null");
  if (typeof callback !== "function") throw new TypeError(callback + " is not a function");

  const result = [];
  for (let i = 0; i < this.length; i++) {
    if (i in this) {
      if (callback.call(thisArg, this[i], i, this)) {
        result.push(this[i]);
      }
    }
  }
  return result;
};

const evens = [1, 2, 3, 4, 5, 6].myFilter((x) => x % 2 === 0);
console.log(evens); // => [2, 4, 6]
```

---

## Section 8: Polyfill - myReduce

### Before (Black box)
```js
[1, 2, 3, 4, 5].reduce((acc, curr) => acc + curr, 0); // how?
```

### After (Custom implementation)
```js
Array.prototype.myReduce = function (callback, initialValue) {
  if (this == null) throw new TypeError("Cannot read properties of null");
  if (typeof callback !== "function") throw new TypeError(callback + " is not a function");

  let acc;
  let startIndex;

  if (arguments.length >= 2) {
    acc = initialValue;
    startIndex = 0;
  } else {
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

console.log([1, 2, 3, 4, 5].myReduce((acc, curr) => acc + curr, 0)); // => 15
console.log([1, 2, 3, 4, 5].myReduce((acc, curr) => acc + curr));    // => 15

// Error case:
try {
  [].myReduce((acc, curr) => acc + curr);
} catch (e) {
  console.log(e.message); // => "Reduce of empty array with no initial value"
}
```

---

## Practice Q17-Q19: myMap, myFilter, myReduce

(See polyfill implementations above in Sections 6-8)

---

## Practice Q20: Chaining HOFs

### Before (Imperative approach)
```js
const people = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 17 },
  { name: "Charlie", age: 30 },
];

const adultNames = [];
for (const p of people) {
  if (p.age >= 18) {
    adultNames.push(`${p.name} is adult`);
  }
}
const result = adultNames.join("; ");
```

### After (Declarative chain)
```js
const people = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 17 },
  { name: "Charlie", age: 30 },
];

const result = people
  .filter((p) => p.age >= 18)                    // keep adults
  .map((p) => `${p.name} is adult`)              // transform to string
  .reduce((acc, curr) => {                        // join with "; "
    return acc ? `${acc}; ${curr}` : curr;
  }, "");

console.log(result); // => "Alice is adult; Charlie is adult"
```
