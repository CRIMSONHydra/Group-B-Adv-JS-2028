# 10 - Advanced Async Patterns

## Core Concept
> Real-world async patterns: Promise Pool, Retry with Backoff, Concurrency Control, Sequential Queue, Timeout Wrapper, and async/await via Generators.

---

## Section 1: Promise Pool / Concurrency Limiter (P1)

### Before (Running everything in parallel - overwhelms server)
```js
// BAD: 1000 API calls at once!
const results = await Promise.all(
  urls.map((url) => fetch(url))
);
// Server returns 429 Too Many Requests
```

### After (Pool limits concurrent tasks)
```js
function promisePool(tasks, limit) {
  return new Promise((resolve, reject) => {
    if (limit <= 0) return reject(new Error("Limit must be > 0"));

    const results = [];
    let nextIndex = 0;
    let activeCount = 0;
    let completed = 0;
    let rejected = false;

    function runNext() {
      if (completed === tasks.length) return resolve(results);
      if (nextIndex >= tasks.length) return;

      const index = nextIndex++;
      activeCount++;

      tasks[index]()
        .then((value) => { results[index] = value; })
        .catch((err) => {
          if (!rejected) { rejected = true; reject(err); }
        })
        .finally(() => {
          activeCount--;
          completed++;
          runNext(); // start next task as soon as one finishes
        });
    }

    // Start initial batch (up to limit)
    const initialBatch = Math.min(limit, tasks.length);
    for (let i = 0; i < initialBatch; i++) runNext();
  });
}

// Test:
const tasks = [
  () => new Promise((r) => setTimeout(() => r("A"), 100)),
  () => new Promise((r) => setTimeout(() => r("B"), 50)),
  () => new Promise((r) => setTimeout(() => r("C"), 80)),
  () => new Promise((r) => setTimeout(() => r("D"), 30)),
];

promisePool(tasks, 2).then((results) => {
  console.log(results); // => ["A", "B", "C", "D"] (order preserved)
});
```

---

## Section 2: Retry with Exponential Backoff (P2)

### Before (No retry - one failure = game over)
```js
async function fetchData() {
  const response = await fetch("/api/data");
  return response.json(); // if it fails, that's it
}
```

### After (Retry with growing delays)
```js
function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, retries, delay) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(); // success -> return immediately
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const waitTime = delay * 2 ** attempt; // exponential: 50, 100, 200, 400...
        console.log(`Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
        await wait(waitTime);
      }
    }
  }

  throw lastError; // all attempts failed
}

// Test: flaky function that fails first 2 times
let callCount = 0;
async function flakyFn() {
  callCount++;
  if (callCount <= 2) throw new Error(`Fail #${callCount}`);
  return "Success!";
}

retryWithBackoff(flakyFn, 3, 50)
  .then((r) => console.log(r)); // => "Success!" (on 3rd attempt)
```

---

## Section 3: Promise.all with Concurrency Control (P3)

### Before (Promise.all runs everything at once)
```js
// BAD: all tasks fire immediately - no concurrency control
const results = await Promise.all(taskFns.map((fn) => fn()));
```

### After (Drop-in replacement with concurrency limit)
```js
function limitedPromiseAll(taskFns, limit) {
  // Same scheduling logic as promisePool
  return promisePool(taskFns, limit);
}

// Usage: same as Promise.all but with a limit
const tasks = [
  () => fetch("/api/1"),
  () => fetch("/api/2"),
  () => fetch("/api/3"),
  () => fetch("/api/4"),
];

limitedPromiseAll(tasks, 2).then((results) => {
  console.log(results); // all 4 results, but only 2 ran at a time
});
```

> **Key difference from P1:** Same underlying logic, but framed as a production-grade `Promise.all` replacement. In practice, you'd reuse `promisePool`.

---

## Section 4: Sequential Async Task Queue (P6)

### Before (Tasks run in parallel - no ordering)
```js
taskA(); // starts immediately
taskB(); // starts immediately (doesn't wait for A)
taskC(); // starts immediately (doesn't wait for B)
```

### After (Tasks run one at a time, in order)
```js
function createSequentialQueue() {
  let tail = Promise.resolve();

  return {
    add(taskFn) {
      const taskPromise = new Promise((resolve, reject) => {
        tail = tail
          .catch(() => {})      // don't let previous failures block
          .then(() => taskFn()) // run after previous task completes
          .then(resolve)
          .catch(reject);
      });
      return taskPromise;
    },
  };
}

const queue = createSequentialQueue();

queue.add(() => {
  console.log("Task 1 start");
  return new Promise((r) => setTimeout(() => { console.log("Task 1 done"); r("A"); }, 100));
});

queue.add(() => {
  console.log("Task 2 start"); // only starts AFTER Task 1 finishes
  return new Promise((r) => setTimeout(() => { console.log("Task 2 done"); r("B"); }, 50));
});

queue.add(() => {
  console.log("Task 3 start");
  return Promise.resolve("C").then((v) => { console.log("Task 3 done"); return v; });
});
```

---

## Section 5: Promise Timeout Wrapper (P8)

### Before (No timeout - hangs forever)
```js
const data = await fetch("/api/slow-endpoint"); // could take minutes
```

### After (Reject if too slow)
```js
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  return Promise.race([promise, timeout]);
}

// Fast operation -> resolves before timeout
withTimeout(
  new Promise((r) => setTimeout(() => r("fast data"), 50)),
  200
).then((r) => console.log(r)); // => "fast data"

// Slow operation -> times out
withTimeout(
  new Promise((r) => setTimeout(() => r("slow data"), 500)),
  100
).catch((e) => console.log(e.message)); // => "Timeout after 100ms"
```

---

## Section 6: async/await Using Generators (P5)

### Before (Generator yields promises - but who resumes it?)
```js
function* fetchSequence() {
  const user = yield fetchUser(1);   // pauses here
  const posts = yield fetchPosts(user); // pauses here
  return { user, posts };
}
// How do we drive this generator automatically?
```

### After (Runner function simulates async/await)
```js
function run(generatorFn) {
  return new Promise((resolve, reject) => {
    const iterator = generatorFn();

    function step(nextFn) {
      let result;
      try {
        result = nextFn();
      } catch (err) {
        return reject(err);
      }

      if (result.done) return resolve(result.value);

      // Wait for the yielded promise, then resume
      Promise.resolve(result.value).then(
        (value) => step(() => iterator.next(value)),   // resume with value
        (error) => step(() => iterator.throw(error))   // throw into generator
      );
    }

    step(() => iterator.next()); // start
  });
}

// Usage: yield instead of await
function* fetchSequence() {
  const user = yield new Promise((r) => setTimeout(() => r({ name: "Alice" }), 50));
  console.log("Got user:", user.name);

  const posts = yield new Promise((r) => setTimeout(() => r(["Post 1", "Post 2"]), 50));
  console.log("Got posts:", posts);

  return { user, posts };
}

run(fetchSequence).then((result) => console.log("Final:", result));
```

**How this relates to async/await:**
```js
// Generator version:
function* myAsync() {
  const data = yield fetchData();
  return data;
}
run(myAsync);

// Equivalent async/await:
async function myAsync() {
  const data = await fetchData();
  return data;
}
myAsync();

// The run() function is what the JS engine does for async/await!
```
