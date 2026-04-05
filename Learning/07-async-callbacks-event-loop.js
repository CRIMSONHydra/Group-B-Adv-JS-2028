// ============================================
// 07 - ASYNC: CALLBACKS & THE EVENT LOOP
// ============================================
// JavaScript is SINGLE-THREADED: one call stack, one thing at a time.
// But it can handle async operations (timers, network, file I/O) by
// delegating them to the browser/Node APIs and using the event loop
// to schedule callbacks when the call stack is empty.

// ============================================
// SECTION 1: Synchronous vs Asynchronous
// ============================================

console.log("--- SECTION 1: Sync vs Async ---");

// Synchronous: each line blocks until complete
console.log("1 - sync");
console.log("2 - sync");
console.log("3 - sync");
// Output: 1, 2, 3 (always in order)

// Asynchronous: setTimeout doesn't block; it schedules for later
console.log("A - sync");
setTimeout(() => console.log("B - async (macrotask)"), 0);
console.log("C - sync");
// Output: A, C, B (B runs AFTER all sync code)

// ============================================
// SECTION 2: Callbacks
// ============================================
// A callback is a function passed to another function to be called later.

console.log("\n--- SECTION 2: Callbacks ---");

// Simple callback pattern
function fetchData(callback) {
  setTimeout(() => {
    const data = { id: 1, name: "Alice" };
    callback(data); // call the callback with the result
  }, 100);
}

fetchData((result) => {
  console.log("Fetched:", result); // => { id: 1, name: "Alice" }
});

// Error-first callback pattern (Node.js convention)
// First arg is error (null if success), second is data
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

// ============================================
// SECTION 3: The Event Loop
// ============================================
/*
  The event loop has these components:

  ┌─────────────────────────────────────────────┐
  │                CALL STACK                    │
  │  (executes one function at a time)           │
  └──────────────────┬──────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────┐
  │           WEB APIs / libuv                   │
  │  (setTimeout, fetch, fs.readFile, etc.)      │
  │  (runs in background, NOT on call stack)     │
  └──────────────────┬──────────────────────────┘
                     │ when done, callback goes to:
                     │
  ┌──────────────────▼──────────────────────────┐
  │         MICROTASK QUEUE                      │
  │  (Promise.then, queueMicrotask, MutationObs) │
  │  Priority: HIGHER (drained completely first) │
  └──────────────────┬──────────────────────────┘
                     │
  ┌──────────────────▼──────────────────────────┐
  │         MACROTASK QUEUE (Callback Queue)     │
  │  (setTimeout, setInterval, I/O callbacks)    │
  │  Priority: LOWER (one per loop tick)         │
  └─────────────────────────────────────────────┘

  EVENT LOOP RULE:
  1. Execute all synchronous code (call stack)
  2. Drain ALL microtasks (Promise callbacks, queueMicrotask)
  3. Execute ONE macrotask (setTimeout callback)
  4. Drain ALL microtasks again
  5. Repeat 3-4
*/

// ============================================
// SECTION 4: Event Loop Output Prediction
// ============================================
// This is the MOST common interview question on async JS.

console.log("\n--- SECTION 4: Event Loop Prediction ---");

// --- Exercise 1: Basic ordering ---
console.log("Exercise 1:");
console.log("1");                                    // sync → call stack
setTimeout(() => console.log("2"), 0);               // macrotask → callback queue
Promise.resolve().then(() => console.log("3"));      // microtask → microtask queue
console.log("4");                                    // sync → call stack

// Output: 1, 4, 3, 2
// Why:
//   - "1" and "4" are synchronous → execute immediately
//   - "3" is a microtask → runs after sync, before macrotasks
//   - "2" is a macrotask → runs last

// --- Exercise 2: Nested microtasks ---
console.log("\nExercise 2:");
setTimeout(() => console.log("timeout 1"), 0);

Promise.resolve()
  .then(() => {
    console.log("promise 1");
    // Nested microtask: runs BEFORE any macrotask
    Promise.resolve().then(() => console.log("promise 2"));
  })
  .then(() => console.log("promise 3"));

console.log("sync");

// Output: sync, promise 1, promise 2, promise 3, timeout 1
// Why: ALL microtasks (including nested ones) are drained before any macrotask.

// --- Exercise 3: Mixed ---
console.log("\nExercise 3:");
setTimeout(() => console.log("T1"), 0);
setTimeout(() => console.log("T2"), 0);

Promise.resolve().then(() => console.log("P1"));
Promise.resolve().then(() => {
  console.log("P2");
  setTimeout(() => console.log("T3"), 0);
});

console.log("S1");

// Output: S1, P1, P2, T1, T2, T3
// Why:
//   S1 = sync
//   P1, P2 = microtasks (drained before macrotasks)
//   T1, T2 = macrotasks (already queued)
//   T3 = macrotask (queued by P2, runs after T1, T2)

// ============================================
// SECTION 5: setTimeout is NOT exact timing
// ============================================

console.log("\n--- SECTION 5: setTimeout Misconceptions ---");

// setTimeout(fn, 0) does NOT mean "run immediately"
// It means "run after the call stack is empty AND all microtasks are done"

const start = Date.now();
setTimeout(() => {
  console.log(`setTimeout(0) actually ran after ${Date.now() - start}ms`);
}, 0);

// Heavy sync work delays ALL async callbacks
// for (let i = 0; i < 1e8; i++) {} // This would delay the setTimeout!

// ============================================
// SECTION 6: Callback Hell
// ============================================
// When you nest callbacks deeply, the code becomes hard to read and maintain.

console.log("\n--- SECTION 6: Callback Hell ---");

// --- BAD: Deeply nested callbacks (pyramid of doom) ---
function step1Bad(callback) { setTimeout(() => callback("step1"), 10); }
function step2Bad(callback) { setTimeout(() => callback("step2"), 10); }
function step3Bad(callback) { setTimeout(() => callback("step3"), 10); }

// BAD: Each step nests inside the previous one
step1Bad((r1) => {
  console.log("Bad:", r1);
  step2Bad((r2) => {
    console.log("Bad:", r2);
    step3Bad((r3) => {
      console.log("Bad:", r3);
      // Imagine 10 more levels... unreadable!
    });
  });
});

// --- GOOD: Named functions (flatten the structure) ---
function onStep1(r1) {
  console.log("Good:", r1);
  step2Bad(onStep2);
}
function onStep2(r2) {
  console.log("Good:", r2);
  step3Bad(onStep3);
}
function onStep3(r3) {
  console.log("Good:", r3);
}

setTimeout(() => step1Bad(onStep1), 100); // Flat and readable

// Even better: use Promises (covered in file 08)

// ============================================
// SECTION 7: setInterval
// ============================================

console.log("\n--- SECTION 7: setInterval ---");

// setInterval calls a function repeatedly at fixed intervals
let count = 0;
const intervalId = setInterval(() => {
  count++;
  console.log(`  Tick ${count}`);
  if (count >= 3) {
    clearInterval(intervalId); // Stop after 3 ticks
    console.log("  Interval cleared");
  }
}, 50);

// ============================================
// PRACTICE P4: Event Loop Output Prediction
// ============================================

console.log("\n--- PRACTICE P4: Predict the Output ---");

// Given:
console.log("A");
setTimeout(() => console.log("B"), 0);
Promise.resolve().then(() => console.log("C"));
console.log("D");

// Answer: A, D, C, B
// Explanation:
//   1. "A" → synchronous, runs immediately
//   2. setTimeout → schedules "B" as macrotask
//   3. Promise.then → schedules "C" as microtask
//   4. "D" → synchronous, runs immediately
//   5. Call stack empty → drain microtasks → "C"
//   6. Next macrotask → "B"

// What if the promise chain is nested?
// Promise.resolve().then(() => {
//   console.log("C1");
//   Promise.resolve().then(() => console.log("C2"));
// });
// Answer: A, D, C1, C2, B
// Nested microtasks are drained before ANY macrotask runs.

// ============================================
// BONUS: queueMicrotask
// ============================================

console.log("\n--- BONUS: queueMicrotask ---");

// queueMicrotask is a more explicit way to add microtasks
setTimeout(() => console.log("  macrotask"), 0);
queueMicrotask(() => console.log("  microtask 1"));
queueMicrotask(() => console.log("  microtask 2"));
console.log("  sync");

// Output: sync, microtask 1, microtask 2, macrotask
