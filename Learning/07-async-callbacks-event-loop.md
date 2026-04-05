# 07 - Async: Callbacks & The Event Loop

## Core Concept
> JavaScript is **single-threaded**: one call stack, one thing at a time. But it handles async operations by delegating to browser/Node APIs and using the **event loop** to schedule callbacks.

---

## Event Loop Diagram

```
┌─────────────────────────────────────┐
│            CALL STACK               │
│  (executes one function at a time)  │
└──────────────┬──────────────────────┘
               │
┌──────────────▼──────────────────────┐
│        WEB APIs / libuv             │
│  (setTimeout, fetch, fs.readFile)   │
│  (runs in background)              │
└──────────────┬──────────────────────┘
               │ when done, callback goes to:
┌──────────────▼──────────────────────┐
│      MICROTASK QUEUE                │
│  (Promise.then, queueMicrotask)     │
│  Priority: HIGHER (drained first)   │
└──────────────┬──────────────────────┘
┌──────────────▼──────────────────────┐
│      MACROTASK QUEUE                │
│  (setTimeout, setInterval, I/O)     │
│  Priority: LOWER (one per tick)     │
└─────────────────────────────────────┘
```

**Event Loop Rule:**
1. Execute all synchronous code (call stack)
2. Drain ALL microtasks (Promise callbacks, queueMicrotask)
3. Execute ONE macrotask (setTimeout callback)
4. Drain ALL microtasks again
5. Repeat 3-4

---

## Section 1: Synchronous vs Asynchronous

### Before (Everything blocks)
```js
console.log("1 - sync");
console.log("2 - sync");
console.log("3 - sync");
// Output: 1, 2, 3 (always in order, each blocks)
```

### After (Async doesn't block)
```js
console.log("A - sync");
setTimeout(() => console.log("B - async (macrotask)"), 0);
console.log("C - sync");
// Output: A, C, B
// B runs AFTER all sync code, even with 0ms delay
```

---

## Section 2: Callbacks

### Before (No callback - can't get async result)
```js
function fetchData() {
  setTimeout(() => {
    const data = { id: 1, name: "Alice" };
    // How do we return this? Can't use `return` in async!
  }, 100);
}
const result = fetchData(); // => undefined
```

### After (Callback receives the result)
```js
function fetchData(callback) {
  setTimeout(() => {
    const data = { id: 1, name: "Alice" };
    callback(data); // pass result to the callback
  }, 100);
}

fetchData((result) => {
  console.log("Fetched:", result); // => { id: 1, name: "Alice" }
});
```

### Error-First Callback Pattern (Node.js convention)
```js
function readFileFake(path, callback) {
  setTimeout(() => {
    if (path === "missing.txt") {
      callback(new Error("File not found"), null);
    } else {
      callback(null, `Contents of ${path}`);
    }
  }, 50);
}

readFileFake("data.txt", (err, data) => {
  if (err) {
    console.log("Error:", err.message);
  } else {
    console.log("Read:", data); // => "Contents of data.txt"
  }
});
```

---

## Section 4: Event Loop Output Prediction

### Exercise 1: Basic ordering

#### Before (Guess)
```js
console.log("1");
setTimeout(() => console.log("2"), 0);
Promise.resolve().then(() => console.log("3"));
console.log("4");
// What's the output order?
```

#### After (Understanding)
```js
console.log("1");                               // sync -> runs first
setTimeout(() => console.log("2"), 0);          // macrotask -> runs last
Promise.resolve().then(() => console.log("3")); // microtask -> runs after sync
console.log("4");                               // sync -> runs second

// Output: 1, 4, 3, 2
// Why: sync first, then microtasks, then macrotasks
```

### Exercise 2: Nested microtasks

#### Before (Guess)
```js
setTimeout(() => console.log("timeout 1"), 0);
Promise.resolve()
  .then(() => {
    console.log("promise 1");
    Promise.resolve().then(() => console.log("promise 2"));
  })
  .then(() => console.log("promise 3"));
console.log("sync");
```

#### After (Understanding)
```js
// Output: sync, promise 1, promise 2, promise 3, timeout 1
// Why: ALL microtasks (including nested ones) drain before ANY macrotask
```

### Exercise 3: Mixed

#### Before (Guess)
```js
setTimeout(() => console.log("T1"), 0);
setTimeout(() => console.log("T2"), 0);
Promise.resolve().then(() => console.log("P1"));
Promise.resolve().then(() => {
  console.log("P2");
  setTimeout(() => console.log("T3"), 0);
});
console.log("S1");
```

#### After (Understanding)
```js
// Output: S1, P1, P2, T1, T2, T3
// S1 = sync
// P1, P2 = microtasks (drained before macrotasks)
// T1, T2 = macrotasks (already queued)
// T3 = macrotask (queued by P2, runs after T1, T2)
```

---

## Section 5: setTimeout is NOT exact timing

### Before (Misconception)
```js
setTimeout(fn, 0); // "This runs immediately!"
```

### After (Reality)
```js
// setTimeout(fn, 0) means:
// "Run after the call stack is empty AND all microtasks are done"

const start = Date.now();
setTimeout(() => {
  console.log(`setTimeout(0) actually ran after ${Date.now() - start}ms`);
}, 0);
// Usually 1-4ms, NOT 0ms!

// Heavy sync work delays ALL async callbacks
for (let i = 0; i < 1e8; i++) {} // This blocks the setTimeout!
```

---

## Section 6: Callback Hell

### Before (Pyramid of doom)
```js
step1((r1) => {
  console.log(r1);
  step2((r2) => {
    console.log(r2);
    step3((r3) => {
      console.log(r3);
      // Imagine 10 more levels... unreadable!
    });
  });
});
```

### After (Named functions flatten the structure)
```js
function onStep1(r1) {
  console.log(r1);
  step2(onStep2);
}
function onStep2(r2) {
  console.log(r2);
  step3(onStep3);
}
function onStep3(r3) {
  console.log(r3);
}

step1(onStep1); // Flat and readable
// Even better: use Promises (covered in file 08)
```

---

## Section 7: setInterval

### Before (Manual repeated setTimeout)
```js
let count = 0;
function tick() {
  count++;
  console.log(`Tick ${count}`);
  if (count < 3) setTimeout(tick, 50); // manual repeat
}
setTimeout(tick, 50);
```

### After (setInterval + clearInterval)
```js
let count = 0;
const intervalId = setInterval(() => {
  count++;
  console.log(`Tick ${count}`);
  if (count >= 3) {
    clearInterval(intervalId); // stop after 3 ticks
    console.log("Interval cleared");
  }
}, 50);
```

---

## Practice P4: Event Loop Output Prediction

### Before (Guess the output)
```js
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");
```

### After (Answer: A, D, C, B)
```js
console.log("A");                                // 1. sync -> runs first
setTimeout(() => console.log("B"), 0);           // 4. macrotask -> runs last
Promise.resolve().then(() => console.log("C"));  // 3. microtask -> after sync
console.log("D");                                // 2. sync -> runs second

// Step-by-step:
// 1. "A" -> synchronous, runs immediately
// 2. setTimeout -> schedules "B" as macrotask
// 3. Promise.then -> schedules "C" as microtask
// 4. "D" -> synchronous, runs immediately
// 5. Call stack empty -> drain microtasks -> "C"
// 6. Next macrotask -> "B"
```

---

## Bonus: queueMicrotask

### Before (Only Promise.then for microtasks)
```js
Promise.resolve().then(() => console.log("microtask"));
```

### After (Explicit queueMicrotask)
```js
setTimeout(() => console.log("macrotask"), 0);
queueMicrotask(() => console.log("microtask 1"));
queueMicrotask(() => console.log("microtask 2"));
console.log("sync");

// Output: sync, microtask 1, microtask 2, macrotask
```
