// ============================================
// 10 - ADVANCED ASYNC PATTERNS
// ============================================
// Real-world async patterns from the practice sheet:
// Promise Pool, Retry with Backoff, Concurrency Control,
// Sequential Queue, Timeout Wrapper, async/await via Generators.

// ============================================
// SECTION 1: Promise Pool / Concurrency Limiter (P1)
// ============================================
// Run at most `limit` async tasks at once, preserving result order.
// Start the next task as soon as one finishes.

console.log("--- SECTION 1: Promise Pool ---");

function promisePool(tasks, limit) {
  return new Promise((resolve, reject) => {
    if (limit <= 0) return reject(new Error("Limit must be > 0"));

    const results = [];
    let nextIndex = 0;    // next task to schedule
    let activeCount = 0;  // currently running tasks
    let completed = 0;    // finished tasks
    let rejected = false;

    function runNext() {
      // If all tasks are done, resolve
      if (completed === tasks.length) return resolve(results);
      // If no more tasks to start, wait for active ones
      if (nextIndex >= tasks.length) return;

      // Grab the next task
      const index = nextIndex++;
      activeCount++;

      tasks[index]()
        .then((value) => {
          results[index] = value; // preserve order
        })
        .catch((err) => {
          if (!rejected) {
            rejected = true;
            reject(err); // fail-fast
          }
        })
        .finally(() => {
          activeCount--;
          completed++;
          runNext(); // start next task as soon as this one finishes
        });
    }

    // Start initial batch (up to `limit`)
    const initialBatch = Math.min(limit, tasks.length);
    for (let i = 0; i < initialBatch; i++) {
      runNext();
    }
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
  console.log("Pool results:", results); // => ["A", "B", "C", "D"] (order preserved)
});

// ============================================
// SECTION 2: Retry with Exponential Backoff (P2)
// ============================================
// Retry a flaky operation with growing delays: delay, delay*2, delay*4, ...

console.log("\n--- SECTION 2: Retry with Backoff ---");

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function retryWithBackoff(fn, retries, delay) {
  let lastError;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn(); // success → return immediately
    } catch (err) {
      lastError = err;
      if (attempt < retries) {
        const waitTime = delay * 2 ** attempt; // exponential: delay, delay*2, delay*4...
        console.log(`  Attempt ${attempt + 1} failed, retrying in ${waitTime}ms...`);
        await wait(waitTime);
      }
    }
  }

  throw lastError; // all attempts failed
}

// Test: simulate flaky function that fails first 2 times
let callCount = 0;
async function flakyFn() {
  callCount++;
  if (callCount <= 2) throw new Error(`Fail #${callCount}`);
  return "Success!";
}

retryWithBackoff(flakyFn, 3, 50)
  .then((r) => console.log("Retry result:", r))   // => "Success!"
  .catch((e) => console.log("Retry failed:", e.message));

// ============================================
// SECTION 3: Promise.all with Concurrency Control (P3)
// ============================================
// Same as promisePool but framed as a drop-in for Promise.all.

console.log("\n--- SECTION 3: Concurrency-Limited Promise.all ---");

function limitedPromiseAll(taskFns, limit) {
  // Reuses the same logic as promisePool
  return promisePool(taskFns, limit);
}

// ============================================
// SECTION 4: Sequential Async Task Queue (P6)
// ============================================
// Tasks run one at a time, in insertion order.
// Each add() returns a promise for that task's result.

console.log("\n--- SECTION 4: Sequential Queue ---");

function createSequentialQueue() {
  let tail = Promise.resolve(); // the "end" of the queue

  return {
    add(taskFn) {
      // Chain the new task onto the tail
      // .catch(() => {}) ensures the queue continues even if a task fails
      const taskPromise = new Promise((resolve, reject) => {
        tail = tail
          .catch(() => {}) // don't let previous failures block the queue
          .then(() => taskFn())
          .then(resolve)
          .catch(reject);
      });
      return taskPromise;
    },
  };
}

const queue = createSequentialQueue();

// These run sequentially, not in parallel:
queue.add(() => {
  console.log("Task 1 start");
  return new Promise((r) => setTimeout(() => { console.log("Task 1 done"); r("A"); }, 100));
});

queue.add(() => {
  console.log("Task 2 start"); // only starts after Task 1 finishes
  return new Promise((r) => setTimeout(() => { console.log("Task 2 done"); r("B"); }, 50));
});

queue.add(() => {
  console.log("Task 3 start");
  return Promise.resolve("C").then((v) => { console.log("Task 3 done"); return v; });
});

// ============================================
// SECTION 5: Promise Timeout Wrapper (P8)
// ============================================
// Wrap a promise so it rejects if it takes too long.
// Uses Promise.race under the hood.

console.log("\n--- SECTION 5: Timeout Wrapper ---");

function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error(`Timeout after ${ms}ms`)), ms)
  );
  // First to settle wins
  return Promise.race([promise, timeout]);
}

// Fast operation → resolves before timeout
withTimeout(
  new Promise((r) => setTimeout(() => r("fast data"), 50)),
  200
).then((r) => console.log("Timeout test 1:", r)); // => "fast data"

// Slow operation → times out
withTimeout(
  new Promise((r) => setTimeout(() => r("slow data"), 500)),
  100
)
  .then((r) => console.log(r))
  .catch((e) => console.log("Timeout test 2:", e.message)); // => "Timeout after 100ms"

// ============================================
// SECTION 6: async/await Using Generators (P5)
// ============================================
// Before async/await existed, you could simulate it with generators + promises.
// A generator yields promises; the runner resumes it with resolved values.

console.log("\n--- SECTION 6: async/await via Generators ---");

function run(generatorFn) {
  return new Promise((resolve, reject) => {
    const iterator = generatorFn();

    function step(nextFn) {
      let result;
      try {
        result = nextFn(); // iterator.next(value) or iterator.throw(error)
      } catch (err) {
        return reject(err); // unhandled error in generator
      }

      if (result.done) {
        return resolve(result.value); // generator finished
      }

      // result.value should be a promise; wait for it
      Promise.resolve(result.value)
        .then(
          (value) => step(() => iterator.next(value)),  // resume with resolved value
          (error) => step(() => iterator.throw(error))  // throw error into generator
        );
    }

    step(() => iterator.next()); // start the generator
  });
}

// Usage: write async code with yield instead of await
function* fetchSequence() {
  const user = yield new Promise((r) => setTimeout(() => r({ name: "Alice" }), 50));
  console.log("Generator got user:", user.name);

  const posts = yield new Promise((r) => setTimeout(() => r(["Post 1", "Post 2"]), 50));
  console.log("Generator got posts:", posts);

  return { user, posts };
}

run(fetchSequence).then((result) => {
  console.log("Generator final result:", result);
});

/*
  How this relates to async/await:

  // This generator code:
  function* myAsync() {
    const data = yield fetchData();
    return data;
  }
  run(myAsync);

  // Is equivalent to this async/await code:
  async function myAsync() {
    const data = await fetchData();
    return data;
  }
  myAsync();

  The run() function is essentially what the JS engine does
  when it encounters async/await.
*/
