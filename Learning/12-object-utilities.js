// ============================================
// 12 - OBJECT & ARRAY UTILITIES
// ============================================
// Essential utility functions for objects and arrays:
// deep clone, deep equality, flatten/unflatten object, diff, merge,
// pick, omit, flatten array, and groupBy.

// ============================================
// SECTION 1: Deep Clone with Circular Reference Handling (P29)
// ============================================
// Clone complex objects safely, including self-references.
// Handles: objects, arrays, Date, Map, Set, and circular refs.
// Do NOT use JSON.stringify (loses functions, Dates, undefined, circular refs).

console.log("--- SECTION 1: Deep Clone ---");

function deepClone(value, seen = new Map()) {
  // Primitives and null → return as-is
  if (value === null || typeof value !== "object") return value;

  // Circular reference check: if we've already cloned this object, return the clone
  if (seen.has(value)) return seen.get(value);

  // Handle special object types
  if (value instanceof Date) return new Date(value.getTime());
  if (value instanceof RegExp) return new RegExp(value.source, value.flags);

  if (value instanceof Map) {
    const clone = new Map();
    seen.set(value, clone);
    value.forEach((v, k) => clone.set(deepClone(k, seen), deepClone(v, seen)));
    return clone;
  }

  if (value instanceof Set) {
    const clone = new Set();
    seen.set(value, clone);
    value.forEach((v) => clone.add(deepClone(v, seen)));
    return clone;
  }

  // Arrays and plain objects
  const clone = Array.isArray(value) ? [] : {};
  seen.set(value, clone); // register BEFORE recursing (handles circular refs)

  for (const key of Object.keys(value)) {
    clone[key] = deepClone(value[key], seen);
  }

  return clone;
}

// Test: basic clone
const original = { a: 1, b: { c: 2 }, d: [3, 4] };
const cloned = deepClone(original);
cloned.b.c = 99;
console.log("Original:", original.b.c); // => 2 (unmodified)
console.log("Cloned:", cloned.b.c);     // => 99

// Test: circular reference
const circular = { name: "self" };
circular.self = circular; // circular!
const clonedCircular = deepClone(circular);
console.log(clonedCircular.name);               // => "self"
console.log(clonedCircular.self === clonedCircular); // => true (preserved)
console.log(clonedCircular === circular);           // => false (different object)

// Test: Date and Map
const withSpecials = { date: new Date("2024-01-01"), map: new Map([["key", "val"]]) };
const clonedSpecials = deepClone(withSpecials);
console.log(clonedSpecials.date instanceof Date);   // => true
console.log(clonedSpecials.map.get("key"));         // => "val"

// ============================================
// SECTION 2: Deep Equality Check (P30)
// ============================================
// Structurally compare two values (primitives, arrays, objects).

console.log("\n--- SECTION 2: Deep Equality ---");

function isEqual(a, b) {
  // Same reference or same primitive
  if (a === b) return true;

  // If either is null/undefined or different types
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  // Both are objects (arrays or plain objects)
  if (typeof a === "object") {
    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);

    // Different number of keys → not equal
    if (keysA.length !== keysB.length) return false;

    // Recursively compare each key
    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  return false; // different primitives
}

console.log(isEqual(1, 1));                           // => true
console.log(isEqual({ a: 1 }, { a: 1 }));             // => true
console.log(isEqual({ a: 1 }, { a: 2 }));             // => false
console.log(isEqual([1, [2, 3]], [1, [2, 3]]));       // => true
console.log(isEqual({ a: { b: 1 } }, { a: { b: 1 } })); // => true
console.log(isEqual({ a: 1, b: 2 }, { a: 1 }));       // => false

// ============================================
// SECTION 3: Flatten an Object (P31)
// ============================================
// Convert nested objects to dot-path keys: { a: { b: 2 } } → { "a.b": 2 }

console.log("\n--- SECTION 3: Flatten Object ---");

function flattenObject(obj, prefix = "", result = {}) {
  for (const key of Object.keys(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (
      obj[key] !== null &&
      typeof obj[key] === "object" &&
      !Array.isArray(obj[key]) // treat arrays as leaf values
    ) {
      flattenObject(obj[key], newKey, result); // recurse into nested objects
    } else {
      result[newKey] = obj[key]; // leaf value → add to result
    }
  }
  return result;
}

console.log(flattenObject({ a: { b: 2 }, c: 3 }));
// => { "a.b": 2, c: 3 }

console.log(flattenObject({ user: { name: "Alice", address: { city: "NYC" } } }));
// => { "user.name": "Alice", "user.address.city": "NYC" }

// ============================================
// SECTION 4: Unflatten an Object (P32)
// ============================================
// Reverse: { "a.b": 2, c: 3 } → { a: { b: 2 }, c: 3 }

console.log("\n--- SECTION 4: Unflatten Object ---");

function unflattenObject(obj) {
  const result = {};

  for (const [flatKey, value] of Object.entries(obj)) {
    const keys = flatKey.split(".");
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        current[key] = value; // leaf → assign value
      } else {
        if (!current[key] || typeof current[key] !== "object") {
          current[key] = {}; // create nested object if needed
        }
        current = current[key]; // go deeper
      }
    }
  }

  return result;
}

console.log(unflattenObject({ "a.b": 2, c: 3 }));
// => { a: { b: 2 }, c: 3 }

console.log(unflattenObject({ "user.name": "Alice", "user.address.city": "NYC" }));
// => { user: { name: "Alice", address: { city: "NYC" } } }

// ============================================
// SECTION 5: Object Diff (P33)
// ============================================
// Compare two objects and report changed fields.

console.log("\n--- SECTION 5: Object Diff ---");

function diffObjects(oldObj, newObj, prefix = "") {
  const result = {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    // Both are plain objects → recurse
    if (
      oldVal && newVal &&
      typeof oldVal === "object" && typeof newVal === "object" &&
      !Array.isArray(oldVal) && !Array.isArray(newVal)
    ) {
      Object.assign(result, diffObjects(oldVal, newVal, fullKey));
    } else if (!isEqual(oldVal, newVal)) {
      result[fullKey] = { oldValue: oldVal, newValue: newVal };
    }
  }

  return result;
}

const oldState = { user: { name: "Alice", age: 25 }, theme: "dark" };
const newState = { user: { name: "Alice", age: 26 }, theme: "light" };
console.log(diffObjects(oldState, newState));
// => { "user.age": { oldValue: 25, newValue: 26 }, "theme": { oldValue: "dark", newValue: "light" } }

// ============================================
// SECTION 6: Deep Merge Objects (P34)
// ============================================
// Recursively merge source into target. Arrays are overwritten (not concatenated).

console.log("\n--- SECTION 6: Deep Merge ---");

function deepMerge(target, source) {
  // Create new object to avoid mutating inputs
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (
      result[key] && source[key] &&
      typeof result[key] === "object" && typeof source[key] === "object" &&
      !Array.isArray(result[key]) && !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(result[key], source[key]); // recurse
    } else {
      result[key] = source[key]; // overwrite
    }
  }

  return result;
}

const defaults = { db: { host: "localhost", port: 5432 }, debug: false };
const overrides = { db: { port: 3306 }, debug: true };
console.log(deepMerge(defaults, overrides));
// => { db: { host: "localhost", port: 3306 }, debug: true }

// ============================================
// SECTION 7: pick(obj, keys) (P35)
// ============================================
// Return new object with only the specified keys.

console.log("\n--- SECTION 7: pick ---");

function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (key in obj) {
      result[key] = obj[key];
    }
  }
  return result;
}

const user = { name: "Alice", email: "a@b.com", password: "secret", age: 25 };
console.log(pick(user, ["name", "email"]));
// => { name: "Alice", email: "a@b.com" }

// ============================================
// SECTION 8: omit(obj, keys) (P36)
// ============================================
// Return new object excluding the specified keys.

console.log("\n--- SECTION 8: omit ---");

function omit(obj, keys) {
  const keysToOmit = new Set(keys);
  const result = {};
  for (const key of Object.keys(obj)) {
    if (!keysToOmit.has(key)) {
      result[key] = obj[key];
    }
  }
  return result;
}

console.log(omit(user, ["password"]));
// => { name: "Alice", email: "a@b.com", age: 25 }

// ============================================
// SECTION 9: Flatten a Deeply Nested Array (P49)
// ============================================

console.log("\n--- SECTION 9: Flatten Array ---");

// Approach 1: Recursive
function flattenArrayRecursive(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenArrayRecursive(item)); // recurse and spread
    } else {
      result.push(item);
    }
  }
  return result;
}

console.log(flattenArrayRecursive([1, [2, [3, [4]]]])); // => [1, 2, 3, 4]

// Approach 2: Iterative (stack-based, avoids call stack overflow)
function flattenArrayIterative(arr) {
  const stack = [...arr]; // copy to avoid mutation
  const result = [];

  while (stack.length > 0) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item); // push sub-items back onto the stack
    } else {
      result.push(item);
    }
  }

  return result.reverse(); // pop reverses order, so reverse at the end
}

console.log(flattenArrayIterative([1, [2, [3, [4]]]])); // => [1, 2, 3, 4]
console.log(flattenArrayIterative([[1, 2], [3, [4, [5]]]])); // => [1, 2, 3, 4, 5]

// ============================================
// SECTION 10: groupBy (P50)
// ============================================
// Group items by a key (string) or mapping function.

console.log("\n--- SECTION 10: groupBy ---");

function groupBy(items, keyOrFn) {
  return items.reduce((groups, item) => {
    // Determine the group key
    const key = typeof keyOrFn === "function" ? keyOrFn(item) : item[keyOrFn];

    // Initialize array if first item in this group
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);

    return groups;
  }, {});
}

const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 17 },
  { name: "Charlie", age: 25 },
  { name: "Diana", age: 17 },
];

// Group by property name (string key)
console.log(groupBy(users, "age"));
// => { "25": [{ name: "Alice", age: 25 }, { name: "Charlie", age: 25 }],
//      "17": [{ name: "Bob", age: 17 }, { name: "Diana", age: 17 }] }

// Group by function
console.log(groupBy(users, (u) => (u.age >= 18 ? "adult" : "minor")));
// => { adult: [Alice, Charlie], minor: [Bob, Diana] }

// Group array of numbers by even/odd
console.log(groupBy([1, 2, 3, 4, 5, 6], (n) => (n % 2 === 0 ? "even" : "odd")));
// => { odd: [1, 3, 5], even: [2, 4, 6] }
