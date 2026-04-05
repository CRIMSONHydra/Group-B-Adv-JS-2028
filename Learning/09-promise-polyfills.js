// ============================================
// 09 - PROMISE POLYFILLS
// ============================================
// Building promises from scratch teaches you exactly how they work:
// state management, callback queues, chaining, and error propagation.
// This file covers: MyPromise constructor, Promise.all, allSettled, race, any.

// ============================================
// SECTION 1: MyPromise Constructor Polyfill
// ============================================
// A promise has:
//   - state: "pending" | "fulfilled" | "rejected"
//   - value: the resolved value or rejection reason
//   - callback queues: for .then() handlers registered while still pending

console.log("--- SECTION 1: MyPromise Constructor ---");

class MyPromise {
  constructor(executor) {
    this.state = "pending";
    this.value = undefined;
    this.onFulfilledCallbacks = []; // queue of success handlers
    this.onRejectedCallbacks = [];  // queue of error handlers

    // resolve and reject functions passed to the executor
    const resolve = (value) => {
      if (this.state !== "pending") return; // once settled, never change
      this.state = "fulfilled";
      this.value = value;
      // Execute all queued success handlers
      this.onFulfilledCallbacks.forEach((cb) => cb(value));
    };

    const reject = (reason) => {
      if (this.state !== "pending") return;
      this.state = "rejected";
      this.value = reason;
      this.onRejectedCallbacks.forEach((cb) => cb(reason));
    };

    // Execute the executor immediately; catch sync errors
    try {
      executor(resolve, reject);
    } catch (err) {
      reject(err);
    }
  }

  then(onFulfilled, onRejected) {
    // .then() returns a NEW promise for chaining
    return new MyPromise((resolve, reject) => {
      // Wrapper that handles the callback and chains the result
      const handleFulfilled = (value) => {
        try {
          if (typeof onFulfilled === "function") {
            const result = onFulfilled(value);
            // If result is a promise-like, wait for it
            if (result instanceof MyPromise) {
              result.then(resolve, reject);
            } else {
              resolve(result);
            }
          } else {
            resolve(value); // pass through if no handler
          }
        } catch (err) {
          reject(err); // errors in handler flow to rejection
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
            reject(reason); // pass through if no handler
          }
        } catch (err) {
          reject(err);
        }
      };

      // If already settled, execute immediately (async via queueMicrotask)
      if (this.state === "fulfilled") {
        queueMicrotask(() => handleFulfilled(this.value));
      } else if (this.state === "rejected") {
        queueMicrotask(() => handleRejected(this.value));
      } else {
        // Still pending: queue the handlers
        this.onFulfilledCallbacks.push(handleFulfilled);
        this.onRejectedCallbacks.push(handleRejected);
      }
    });
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }

  finally(onFinally) {
    return this.then(
      (value) => {
        onFinally();
        return value;
      },
      (reason) => {
        onFinally();
        throw reason;
      }
    );
  }

  // Static helpers
  static resolve(value) {
    return new MyPromise((resolve) => resolve(value));
  }

  static reject(reason) {
    return new MyPromise((_, reject) => reject(reason));
  }
}

// Test MyPromise:
const mp = new MyPromise((resolve) => {
  setTimeout(() => resolve(42), 50);
});

mp.then((val) => {
  console.log("MyPromise resolved:", val); // => 42
  return val * 2;
})
  .then((val) => {
    console.log("Chained:", val); // => 84
  })
  .catch((err) => {
    console.log("Error:", err);
  });

// Test error handling:
new MyPromise((_, reject) => {
  reject(new Error("boom"));
})
  .then(() => console.log("Won't run"))
  .catch((err) => console.log("MyPromise caught:", err.message)); // => "boom"

/*
  COMMON BUG in class code (promiseConstructor.js line 46):
  ❌ else if ((this.state = "rejected"))   // ASSIGNMENT, not comparison!
  ✅ else if (this.state === "rejected")   // COMPARISON — correct!
  The = operator assigns "rejected" (truthy), so it always enters the block.
  Always use === for comparisons!
*/

// ============================================
// SECTION 2: Promise.all Polyfill (P11)
// ============================================
// Resolves when ALL succeed, rejects on FIRST failure.
// Results preserve input order.

console.log("\n--- SECTION 2: myPromiseAll ---");

function myPromiseAll(items) {
  return new Promise((resolve, reject) => {
    const results = [];
    let completed = 0;
    const itemsArr = Array.from(items);

    // Edge case: empty input → resolve immediately
    if (itemsArr.length === 0) return resolve([]);

    itemsArr.forEach((item, index) => {
      // Promise.resolve wraps non-promise values
      Promise.resolve(item)
        .then((value) => {
          results[index] = value; // preserve order (NOT push!)
          completed++;
          if (completed === itemsArr.length) {
            resolve(results); // all done
          }
        })
        .catch((err) => {
          reject(err); // fail-fast on first rejection
        });
    });
  });
}

myPromiseAll([
  Promise.resolve(1),
  Promise.resolve(2),
  Promise.resolve(3),
]).then((r) => console.log("myPromiseAll:", r)); // => [1, 2, 3]

myPromiseAll([Promise.resolve(1), Promise.reject("fail"), Promise.resolve(3)])
  .then((r) => console.log(r))
  .catch((e) => console.log("myPromiseAll rejected:", e)); // => "fail"

// Plain values handled:
myPromiseAll([1, 2, 3]).then((r) => console.log("myPromiseAll plain:", r)); // => [1, 2, 3]

// ============================================
// SECTION 3: Promise.allSettled Polyfill (P14)
// ============================================
// Waits for ALL to settle. Never rejects due to input rejection.
// Returns: [{ status, value } | { status, reason }]

console.log("\n--- SECTION 3: myPromiseAllSettled ---");

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

myPromiseAllSettled([
  Promise.resolve("ok"),
  Promise.reject("fail"),
  Promise.resolve(42),
]).then((results) => {
  console.log("myPromiseAllSettled:");
  results.forEach((r) => console.log(" ", r));
});
// => { status: "fulfilled", value: "ok" }
// => { status: "rejected", reason: "fail" }
// => { status: "fulfilled", value: 42 }

// ============================================
// SECTION 4: Promise.race Polyfill (P13)
// ============================================
// First settled promise (fulfilled OR rejected) wins.

console.log("\n--- SECTION 4: myPromiseRace ---");

function myPromiseRace(items) {
  return new Promise((resolve, reject) => {
    const itemsArr = Array.from(items);

    // Note: empty iterable → promise stays pending (matches spec)
    itemsArr.forEach((item) => {
      // First one to settle calls resolve/reject
      // Subsequent calls are ignored (promise already settled)
      Promise.resolve(item).then(resolve, reject);
    });
  });
}

myPromiseRace([
  new Promise((r) => setTimeout(() => r("slow"), 200)),
  new Promise((r) => setTimeout(() => r("fast"), 50)),
]).then((winner) => console.log("myPromiseRace:", winner)); // => "fast"

// ============================================
// SECTION 5: Promise.any Polyfill (P12)
// ============================================
// First FULFILLED promise wins. Ignores rejections.
// Rejects with AggregateError only if ALL reject.

console.log("\n--- SECTION 5: myPromiseAny ---");

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
          errors[index] = reason; // preserve order of errors
          rejectedCount++;
          if (rejectedCount === itemsArr.length) {
            // ALL rejected → AggregateError
            reject(new AggregateError(errors, "All promises were rejected"));
          }
        });
    });
  });
}

myPromiseAny([
  Promise.reject("err1"),
  Promise.reject("err2"),
  Promise.resolve("success!"),
]).then((val) => console.log("myPromiseAny:", val)); // => "success!"

myPromiseAny([Promise.reject("e1"), Promise.reject("e2")])
  .then((v) => console.log(v))
  .catch((err) => {
    console.log("myPromiseAny all rejected:", err.message); // => "All promises were rejected"
    console.log("myPromiseAny errors:", err.errors);        // => ["e1", "e2"]
  });

// ============================================
// BONUS: Summary of all combinators
// ============================================
/*
  ┌──────────────┬───────────────────────┬────────────────────────────┐
  │ Method       │ Resolves when         │ Rejects when               │
  ├──────────────┼───────────────────────┼────────────────────────────┤
  │ all          │ ALL fulfilled          │ ANY rejects (fail-fast)    │
  │ allSettled   │ ALL settled            │ NEVER                      │
  │ race         │ First settled          │ First settled (if reject)  │
  │ any          │ First fulfilled        │ ALL rejected               │
  └──────────────┴───────────────────────┴────────────────────────────┘
*/
