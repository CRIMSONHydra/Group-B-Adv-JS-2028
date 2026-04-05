# 08 - Promises

## Core Concept
> A Promise represents the eventual result of an async operation.
> States: `pending` -> `fulfilled` (with value) OR `rejected` (with reason).
> Once settled, a promise NEVER changes state again.

---

## Choosing the Right Combinator

| Combinator | Use when... |
|---|---|
| `Promise.all` | ALL must succeed (fetch user + posts + settings) |
| `Promise.allSettled` | Partial success is OK (load dashboard widgets) |
| `Promise.race` | First-to-settle wins (timeout, fallback) |
| `Promise.any` | First success wins (try multiple CDNs) |

---

## Section 1: Promise States & Constructor

### Before (Callback-based async)
```js
function fetchData(callback) {
  setTimeout(() => {
    const success = true;
    if (success) callback(null, "Data loaded!");
    else callback(new Error("Something went wrong"), null);
  }, 100);
}

fetchData((err, data) => {
  if (err) console.log("Error:", err.message);
  else console.log("Success:", data);
});
```

### After (Promise-based async)
```js
const myPromise = new Promise((resolve, reject) => {
  const success = true;
  if (success) {
    resolve("Data loaded!");      // -> fulfilled
  } else {
    reject(new Error("Something went wrong")); // -> rejected
  }
});

myPromise
  .then((value) => console.log("Resolved:", value))   // => "Data loaded!"
  .catch((err) => console.log("Rejected:", err.message));
```

---

## Section 2: .then(), .catch(), .finally()

### Before (Separate error handling)
```js
myPromise.then(
  (val) => console.log("success:", val),
  (err) => console.log("error:", err) // easy to forget
);
```

### After (Chained with catch and finally)
```js
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
```

---

## Section 3: Promise Chaining

### Before (Forgetting to return in .then())
```js
Promise.resolve(1)
  .then((val) => {
    val * 2; // BAD: no return! Next .then() gets undefined.
  })
  .then((val) => console.log(val)); // => undefined
```

### After (Always return in .then())
```js
Promise.resolve(1)
  .then((val) => {
    return val * 2; // GOOD: return passes value to next .then()
  })
  .then((val) => console.log(val)); // => 2

// Chaining async operations:
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
```

---

## Section 4: Promise.all

### Before (Sequential - slow)
```js
const resultA = await fetchA(); // wait...
const resultB = await fetchB(); // wait...
const resultC = await fetchC(); // wait...
// Total time = A + B + C
```

### After (Parallel with Promise.all - fast)
```js
const [resultA, resultB, resultC] = await Promise.all([
  fetchA(), fetchB(), fetchC(),
]);
// Total time = max(A, B, C)
// Results in SAME ORDER as input

// Fail-fast: if ANY rejects, the whole thing rejects
Promise.all([
  Promise.resolve("ok"),
  Promise.reject(new Error("fail")),
  Promise.resolve("ok2"),
])
  .catch((err) => console.log("Rejected:", err.message)); // => "fail"
```

---

## Section 5: Promise.allSettled

### Before (Promise.all fails everything on one error)
```js
// BAD: If one dashboard widget fails, ENTIRE page breaks
await Promise.all([loadHeader(), loadSidebar(), loadContent()]);
// If loadSidebar fails, header and content are thrown away!
```

### After (allSettled - partial success is OK)
```js
const results = await Promise.allSettled([
  Promise.resolve("success"),
  Promise.reject(new Error("fail")),
  Promise.resolve(42),
]);

console.log(results);
// => [
//   { status: "fulfilled", value: "success" },
//   { status: "rejected", reason: Error("fail") },
//   { status: "fulfilled", value: 42 }
// ]

// Filter successful results:
const successes = results
  .filter((r) => r.status === "fulfilled")
  .map((r) => r.value);
console.log(successes); // => ["success", 42]
```

---

## Section 6: Promise.race

### Before (No timeout on slow operations)
```js
const data = await fetchData(); // could hang forever!
```

### After (Race with timeout)
```js
const slow = new Promise((r) => setTimeout(() => r("slow"), 200));
const fast = new Promise((r) => setTimeout(() => r("fast"), 50));

const winner = await Promise.race([slow, fast]);
console.log(winner); // => "fast"

// Timeout pattern:
function withTimeout(promise, ms) {
  const timeout = new Promise((_, reject) =>
    setTimeout(() => reject(new Error("Timeout!")), ms)
  );
  return Promise.race([promise, timeout]);
}

withTimeout(slowOperation, 100)
  .then((r) => console.log(r))
  .catch((e) => console.log(e.message)); // => "Timeout!"
```

---

## Section 7: Promise.any

### Before (First rejection kills everything)
```js
// With Promise.all, one failure = total failure
await Promise.all([cdn1(), cdn2(), cdn3()]); // all must succeed
```

### After (First success wins, ignores rejections)
```js
const first = await Promise.any([
  Promise.reject("err1"),
  Promise.reject("err2"),
  Promise.resolve("success!"),
  Promise.resolve("also success"),
]);
console.log(first); // => "success!" (first fulfilled)

// All rejected -> AggregateError
Promise.any([
  Promise.reject("fail1"),
  Promise.reject("fail2"),
]).catch((err) => {
  console.log(err.constructor.name); // => "AggregateError"
  console.log(err.errors);           // => ["fail1", "fail2"]
});
```

---

## Section 9: Real-World Patterns

### Pattern 1: Dashboard with partial loading
```js
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
```

### Pattern 2: Fetch with timeout
```js
async function fetchWithTimeout(url, ms) {
  const fetchPromise = fetch(url);
  return withTimeout(fetchPromise, ms);
}
```

---

## Bonus: Common Mistakes

### Mistake 1: Not returning in .then()
```js
// BAD
.then((val) => { val * 2; })  // no return -> undefined

// GOOD
.then((val) => { return val * 2; })
// or
.then((val) => val * 2)
```

### Mistake 2: Wrong combinator
```js
// BAD: Using Promise.all when partial failure is OK
await Promise.all([loadHeader(), loadSidebar()]); // one fail = all fail

// GOOD: Use allSettled for partial rendering
await Promise.allSettled([loadHeader(), loadSidebar()]);
```

### Mistake 3: Forgetting .catch()
```js
// BAD: Unhandled rejection
Promise.reject(new Error("oops"));

// GOOD: Always handle rejections
Promise.reject(new Error("oops")).catch((e) => console.log(e.message));
```

### Mistake 4: Unnecessary promise wrapping
```js
// BAD
function getData() { return new Promise(resolve => resolve(42)); }

// GOOD
function getData() { return Promise.resolve(42); }
```
