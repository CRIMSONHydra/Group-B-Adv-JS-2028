// ============================================
// 08 - PROMISES
// ============================================
// A Promise represents the eventual result of an async operation.
// States: pending → fulfilled (resolved with value) OR rejected (with reason)
// Once settled (fulfilled/rejected), a promise NEVER changes state again.

// ============================================
// SECTION 1: Promise States & Constructor
// ============================================

console.log("--- SECTION 1: Promise Basics ---");

// Creating a promise with the constructor:
const myPromise = new Promise((resolve, reject) => {
  // Do some async work...
  const success = true;
  if (success) {
    resolve("Data loaded!"); // transitions to fulfilled
  } else {
    reject(new Error("Something went wrong")); // transitions to rejected
  }
});

// Consuming a promise:
myPromise
  .then((value) => console.log("Resolved:", value))  // => "Data loaded!"
  .catch((err) => console.log("Rejected:", err.message));

// ============================================
// SECTION 2: .then(), .catch(), .finally()
// ============================================

console.log("\n--- SECTION 2: then/catch/finally ---");

// .then(onFulfilled, onRejected) — handles resolve/reject
// .catch(onRejected) — shorthand for .then(undefined, onRejected)
// .finally(onFinally) — runs regardless of outcome (no arguments)

Promise.resolve(42)
  .then((val) => {
    console.log("then:", val); // => 42
    return val * 2;
  })
  .then((val) => {
    console.log("chained then:", val); // => 84
  })
  .finally(() => {
    console.log("finally: cleanup"); // always runs
  });

// Error handling:
Promise.reject(new Error("Oops"))
  .then((val) => console.log("This won't run"))
  .catch((err) => console.log("catch:", err.message)) // => "Oops"
  .finally(() => console.log("finally: done"));        // always runs

// ============================================
// SECTION 3: Promise Chaining
// ============================================
// Each .then() returns a NEW promise. The return value flows to the next .then().
// If you return a promise, it's awaited before the next .then() runs.

console.log("\n--- SECTION 3: Chaining ---");

// --- BAD: Forgetting to return in .then() ---
Promise.resolve(1)
  .then((val) => {
    val * 2; // BAD: no return! Next .then() gets undefined.
  })
  .then((val) => console.log("BAD - no return:", val)); // => undefined

// --- GOOD: Always return in .then() ---
Promise.resolve(1)
  .then((val) => {
    return val * 2; // GOOD: return passes value to next .then()
  })
  .then((val) => console.log("GOOD - with return:", val)); // => 2

// Chaining async operations:
function fetchUser(id) {
  return new Promise((resolve) =>
    setTimeout(() => resolve({ id, name: "Alice" }), 50)
  );
}

function fetchPosts(user) {
  return new Promise((resolve) =>
    setTimeout(() => resolve([`Post by ${user.name}`]), 50)
  );
}

fetchUser(1)
  .then((user) => {
    console.log("User:", user.name);
    return fetchPosts(user); // return promise for chaining
  })
  .then((posts) => {
    console.log("Posts:", posts);
  })
  .catch((err) => {
    console.log("Error in chain:", err.message);
  });

// ============================================
// SECTION 4: Promise.all
// ============================================
// Runs promises in PARALLEL. Resolves when ALL succeed. Rejects on FIRST failure.
// Results are in the SAME ORDER as input (not completion order).

console.log("\n--- SECTION 4: Promise.all ---");

const p1 = Promise.resolve("A");
const p2 = new Promise((r) => setTimeout(() => r("B"), 100));
const p3 = Promise.resolve("C");

Promise.all([p1, p2, p3]).then((results) => {
  console.log("all:", results); // => ["A", "B", "C"] (order preserved)
});

// Fail-fast: if ANY rejects, the whole thing rejects
Promise.all([
  Promise.resolve("ok"),
  Promise.reject(new Error("fail")),
  Promise.resolve("ok2"),
])
  .then((r) => console.log("Won't reach"))
  .catch((err) => console.log("all rejected:", err.message)); // => "fail"

// ============================================
// SECTION 5: Promise.allSettled
// ============================================
// Waits for ALL promises to settle (no fail-fast). Returns status objects.
// Never rejects due to input rejection.

console.log("\n--- SECTION 5: Promise.allSettled ---");

Promise.allSettled([
  Promise.resolve("success"),
  Promise.reject(new Error("fail")),
  Promise.resolve(42),
]).then((results) => {
  console.log("allSettled:", results);
  // => [
  //   { status: "fulfilled", value: "success" },
  //   { status: "rejected", reason: Error("fail") },
  //   { status: "fulfilled", value: 42 }
  // ]

  // Filter successful results:
  const successes = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);
  console.log("Successes:", successes); // => ["success", 42]
});

// ============================================
// SECTION 6: Promise.race
// ============================================
// Settles with the FIRST promise to settle (whether fulfilled or rejected).
// Useful for: timeouts, first-response-wins.

console.log("\n--- SECTION 6: Promise.race ---");

const slow = new Promise((r) => setTimeout(() => r("slow"), 200));
const fast = new Promise((r) => setTimeout(() => r("fast"), 50));

Promise.race([slow, fast]).then((winner) => {
  console.log("race winner:", winner); // => "fast"
});

// Timeout pattern using race:
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout!")), ms)
  );
  return Promise.race([promise, timeout]);
}

const slowOp = new Promise((r) => setTimeout(() => r("data"), 500));
withTimeout(slowOp, 100)
  .then((r) => console.log(r))
  .catch((e) => console.log("race timeout:", e.message)); // => "Timeout!"

// ============================================
// SECTION 7: Promise.any
// ============================================
// Resolves with the FIRST FULFILLED promise. Ignores rejections.
// Only rejects if ALL promises reject (AggregateError).

console.log("\n--- SECTION 7: Promise.any ---");

Promise.any([
  Promise.reject("err1"),
  Promise.reject("err2"),
  Promise.resolve("success!"),
  Promise.resolve("also success"),
]).then((first) => {
  console.log("any:", first); // => "success!" (first fulfilled)
});

// All rejected → AggregateError
Promise.any([
  Promise.reject("fail1"),
  Promise.reject("fail2"),
]).catch((err) => {
  console.log("any all rejected:", err.constructor.name); // => "AggregateError"
  console.log("any errors:", err.errors);                 // => ["fail1", "fail2"]
});

// ============================================
// SECTION 8: Choosing the Right Combinator
// ============================================
/*
  ┌─────────────────┬─────────────────────────────────────────────────┐
  │ Combinator      │ Use when...                                     │
  ├─────────────────┼─────────────────────────────────────────────────┤
  │ Promise.all     │ ALL must succeed (fetch user + posts + settings)│
  │ Promise.allSettled│ Partial success is OK (load dashboard widgets)│
  │ Promise.race    │ First-to-settle wins (timeout, fallback)        │
  │ Promise.any     │ First success wins (try multiple CDNs)          │
  └─────────────────┴─────────────────────────────────────────────────┘

  Decision tree:
  - Need ALL results? → all (strict) or allSettled (lenient)
  - Need FIRST result? → race (any settlement) or any (first success)
*/

// ============================================
// SECTION 9: Real-World Patterns
// ============================================

console.log("\n--- SECTION 9: Real Patterns ---");

// Pattern 1: Parallel fetch with error handling
async function loadDashboard() {
  const results = await Promise.allSettled([
    fetchUser(1),
    fetchPosts({ name: "Alice" }),
  ]);

  results.forEach((result, i) => {
    if (result.status === "fulfilled") {
      console.log(`Widget ${i}: loaded`);
    } else {
      console.log(`Widget ${i}: failed - ${result.reason}`);
    }
  });
}
loadDashboard();

// Pattern 2: Timeout wrapper (using race)
async function fetchWithTimeout(url, ms) {
  // Simulate fetch
  const fetchPromise = new Promise((r) =>
    setTimeout(() => r(`Data from ${url}`), 50)
  );
  return withTimeout(fetchPromise, ms);
}

fetchWithTimeout("api.example.com", 1000)
  .then((data) => console.log("Fetched:", data))
  .catch((err) => console.log("Failed:", err.message));

// ============================================
// BONUS: Common Mistakes
// ============================================

console.log("\n--- BONUS: Common Mistakes ---");

// Mistake 1: Not returning in .then() (breaks the chain)
// Already shown in Section 3

// Mistake 2: Using wrong combinator
// BAD: Using Promise.all when partial failure is OK
// If one dashboard widget fails, the entire page breaks!
// GOOD: Use Promise.allSettled for partial rendering

// Mistake 3: Forgetting .catch()
// ALWAYS handle rejections to avoid UnhandledPromiseRejection
Promise.reject(new Error("handle me!")).catch((e) =>
  console.log("Caught:", e.message)
);

// Mistake 4: Creating unnecessary promises
// BAD:
// function getData() { return new Promise(resolve => resolve(42)); }
// GOOD:
function getData() {
  return Promise.resolve(42);
}
getData().then((v) => console.log("Simple:", v));
