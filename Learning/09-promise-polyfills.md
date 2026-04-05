# 09 - Promise Polyfills

## Core Concept
> Building promises from scratch teaches you exactly how they work: state management, callback queues, chaining, and error propagation.

---

## Combinator Summary

| Method | Resolves when | Rejects when |
|---|---|---|
| `all` | ALL fulfilled | ANY rejects (fail-fast) |
| `allSettled` | ALL settled | NEVER |
| `race` | First settled | First settled (if reject) |
| `any` | First fulfilled | ALL rejected |

---

## Section 1: MyPromise Constructor

### Before (Using Promise as a black box)
```js
const p = new Promise((resolve, reject) => {
  setTimeout(() => resolve(42), 50);
});
p.then((val) => console.log(val)); // => 42
// How does this work internally?
```

### After (Custom MyPromise implementation)
```js
class MyPromise {
  constructor(executor) {
    this.state = "pending";
    this.value = undefined;
    this.onFulfilledCallbacks = [];
    this.onRejectedCallbacks = [];

    const resolve = (value) => {
      if (this.state !== "pending") return; // once settled, never change
      this.state = "fulfilled";
      this.value = value;
      this.onFulfilledCallbacks.forEach((cb) => cb(value));
    };

    const reject = (reason) => {
      if (this.state !== "pending") return;
      this.state = "rejected";
      this.value = reason;
      this.onRejectedCallbacks.forEach((cb) => cb(reason));
    };

    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err); // catch sync errors in executor
    }
  }

  then(onFulfilled, onRejected) {
    return new MyPromise((resolve, reject) => {
      const handleFulfilled = (value) => {
        try {
          if (typeof onFulfilled === "function") {
            const result = onFulfilled(value);
            if (result instanceof MyPromise) {
              result.then(resolve, reject);
            } else {
              resolve(result);
            }
          } else {
            resolve(value); // pass through
          }
        } catch (err) {
          reject(err);
        }
      };

      const handleRejected = (reason) => {
        try {
          if (typeof onRejected === "function") {
            const result = onRejected(reason);
            if (result instanceof MyPromise) {
              result.then(resolve, reject);
            } else {
              resolve(result); // caught errors become fulfilled
            }
          } else {
            reject(reason); // pass through
          }
        } catch (err) {
          reject(err);
        }
      };

      if (this.state === "fulfilled") {
        queueMicrotask(() => handleFulfilled(this.value));
      } else if (this.state === "rejected") {
        queueMicrotask(() => handleRejected(this.value));
      } else {
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });
  }

  catch(onRejected) { return this.then(undefined, onRejected); }

  finally(onFinally) {
    return this.then(
      (value) => { onFinally(); return value; },
      (reason) => { onFinally(); throw reason; }
    );
  }

  static resolve(value) { return new MyPromise((resolve) => resolve(value)); }
  static reject(reason) { return new MyPromise((_, reject) => reject(reason)); }
}

// Test:
const mp = new MyPromise((resolve) => setTimeout(() => resolve(42), 50));
mp.then((val) => { console.log("Resolved:", val); return val * 2; })
  .then((val) => console.log("Chained:", val))
  .catch((err) => console.log("Error:", err));
// => Resolved: 42
// => Chained: 84
```

> **Common Bug:** `else if ((this.state = "rejected"))` uses `=` (assignment) instead of `===` (comparison). The assignment always evaluates to truthy!

---

## Section 2: Promise.all Polyfill (P11)

### Before (Using Promise.all as a black box)
```js
Promise.all([p1, p2, p3]).then((results) => console.log(results));
```

### After (Custom implementation)
```js
function myPromiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    const itemsArr = Array.from(items);

    if (itemsArr.length === 0) return resolve([]);

    itemsArr.forEach((item, index) => {
      Promise.resolve(item)
        .then((value) => {
          results[index] = value; // preserve order (NOT push!)
          completed++;
          if (completed === itemsArr.length) {
            resolve(results);
          }
        })
        .catch((err) => {
          reject(err); // fail-fast
        });
    });
  });
}

// Test:
myPromiseAll([Promise.resolve(1), Promise.resolve(2), Promise.resolve(3)])
  .then((r) => console.log(r)); // => [1, 2, 3]

myPromiseAll([Promise.resolve(1), Promise.reject("fail"), Promise.resolve(3)])
  .catch((e) => console.log("Rejected:", e)); // => "fail"

myPromiseAll([1, 2, 3]).then((r) => console.log(r)); // => [1, 2, 3] (plain values)
```

---

## Section 3: Promise.allSettled Polyfill (P14)

### Before (No way to handle partial failures gracefully)
```js
// Promise.all fails everything on one rejection
```

### After (Custom implementation - never rejects)
```js
function myPromiseAllSettled(items) {
  return new Promise((resolve) => {
    const results = [];
    let completed = 0;
    const itemsArr = Array.from(items);

    if (itemsArr.length === 0) return resolve([]);

    itemsArr.forEach((item, index) => {
      Promise.resolve(item)
        .then((value) => {
          results[index] = { status: "fulfilled", value };
        })
        .catch((reason) => {
          results[index] = { status: "rejected", reason };
        })
        .finally(() => {
          completed++;
          if (completed === itemsArr.length) {
            resolve(results); // always resolves
          }
        });
    });
  });
}

// Test:
myPromiseAllSettled([
  Promise.resolve("ok"),
  Promise.reject("fail"),
  Promise.resolve(42),
]).then((results) => console.log(results));
// => [
//   { status: "fulfilled", value: "ok" },
//   { status: "rejected", reason: "fail" },
//   { status: "fulfilled", value: 42 }
// ]
```

---

## Section 4: Promise.race Polyfill (P13)

### Before (Black box)
```js
Promise.race([slow, fast]).then((winner) => console.log(winner));
```

### After (Custom implementation)
```js
function myPromiseRace(items) {
  return new Promise((resolve, reject) => {
    const itemsArr = Array.from(items);

    // Note: empty iterable -> promise stays pending (matches spec)
    itemsArr.forEach((item) => {
      // First one to settle calls resolve/reject
      // Subsequent calls are ignored (promise already settled)
      Promise.resolve(item).then(resolve, reject);
    });
  });
}

// Test:
myPromiseRace([
  new Promise((r) => setTimeout(() => r("slow"), 200)),
  new Promise((r) => setTimeout(() => r("fast"), 50)),
]).then((winner) => console.log(winner)); // => "fast"
```

---

## Section 5: Promise.any Polyfill (P12)

### Before (No way to get first success ignoring failures)
```js
// Promise.race returns first settled (even if rejected)
// We need first FULFILLED
```

### After (Custom implementation)
```js
function myPromiseAny(items) {
  return new Promise((resolve, reject) => {
    const errors = [];
    let rejectedCount = 0;
    const itemsArr = Array.from(items);

    if (itemsArr.length === 0) {
      return reject(new AggregateError([], "All promises were rejected"));
    }

    itemsArr.forEach((item, index) => {
      Promise.resolve(item)
        .then((value) => {
          resolve(value); // first fulfilled wins
        })
        .catch((reason) => {
          errors[index] = reason; // preserve order
          rejectedCount++;
          if (rejectedCount === itemsArr.length) {
            reject(new AggregateError(errors, "All promises were rejected"));
          }
        });
    });
  });
}

// Test:
myPromiseAny([
  Promise.reject("err1"),
  Promise.reject("err2"),
  Promise.resolve("success!"),
]).then((val) => console.log(val)); // => "success!"

myPromiseAny([Promise.reject("e1"), Promise.reject("e2")])
  .catch((err) => {
    console.log(err.message); // => "All promises were rejected"
    console.log(err.errors);  // => ["e1", "e2"]
  });
```
