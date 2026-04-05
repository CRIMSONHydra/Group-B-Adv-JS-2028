# 12 - Object & Array Utilities

## Core Concept
> Essential utility functions for objects and arrays: deep clone, deep equality, flatten/unflatten, diff, merge, pick, omit, flatten array, and groupBy.

---

## Section 1: Deep Clone with Circular Reference Handling (P29)

### Before (JSON.stringify - loses data)
```js
const original = { date: new Date(), fn: () => {}, undef: undefined };
const cloned = JSON.parse(JSON.stringify(original));
// date -> string (not Date object!)
// fn -> lost entirely
// undef -> lost entirely
// Circular references -> THROWS ERROR
```

### After (Proper deep clone)
```js
function deepClone(value, seen = new Map()) {
  // Primitives and null -> return as-is
  if (value === null || typeof value !== "object") return value;

  // Circular reference check
  if (seen.has(value)) return seen.get(value);

  // Handle special types
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
console.log(original.b.c); // => 2 (unmodified!)

// Test: circular reference
const circular = { name: "self" };
circular.self = circular;
const clonedCircular = deepClone(circular);
console.log(clonedCircular.self === clonedCircular); // => true (preserved)
console.log(clonedCircular === circular);            // => false (different object)
```

---

## Section 2: Deep Equality Check (P30)

### Before (Only reference equality)
```js
const a = { x: 1 };
const b = { x: 1 };
console.log(a === b); // => false (different references!)
// No way to check structural equality
```

### After (Recursive structural comparison)
```js
function isEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (typeof a !== typeof b) return false;

  if (typeof a === "object") {
    const aIsArray = Array.isArray(a);
    const bIsArray = Array.isArray(b);
    if (aIsArray !== bIsArray) return false;

    const keysA = Object.keys(a);
    const keysB = Object.keys(b);
    if (keysA.length !== keysB.length) return false;

    return keysA.every((key) => isEqual(a[key], b[key]));
  }

  return false;
}

console.log(isEqual(1, 1));                              // => true
console.log(isEqual({ a: 1 }, { a: 1 }));                // => true
console.log(isEqual({ a: 1 }, { a: 2 }));                // => false
console.log(isEqual([1, [2, 3]], [1, [2, 3]]));          // => true
console.log(isEqual({ a: { b: 1 } }, { a: { b: 1 } })); // => true
console.log(isEqual({ a: 1, b: 2 }, { a: 1 }));          // => false
```

---

## Section 3: Flatten an Object (P31)

### Before (Nested objects are hard to iterate)
```js
const config = {
  user: {
    name: "Alice",
    address: { city: "NYC" },
  },
};
// How to get a flat key-value representation?
```

### After (Dot-path keys)
```js
function flattenObject(obj, prefix = "", result = {}) {
  for (const key of Object.keys(obj)) {
    const newKey = prefix ? `${prefix}.${key}` : key;

    if (obj[key] !== null && typeof obj[key] === "object" && !Array.isArray(obj[key])) {
      flattenObject(obj[key], newKey, result); // recurse
    } else {
      result[newKey] = obj[key]; // leaf value
    }
  }
  return result;
}

console.log(flattenObject({ a: { b: 2 }, c: 3 }));
// => { "a.b": 2, c: 3 }

console.log(flattenObject({ user: { name: "Alice", address: { city: "NYC" } } }));
// => { "user.name": "Alice", "user.address.city": "NYC" }
```

---

## Section 4: Unflatten an Object (P32)

### Before (Flat dot-path keys)
```js
const flat = { "a.b": 2, c: 3 };
// How to reconstruct nested structure?
```

### After (Reconstruct nested objects)
```js
function unflattenObject(obj) {
  const result = {};

  for (const [flatKey, value] of Object.entries(obj)) {
    const keys = flatKey.split(".");
    let current = result;

    for (let i = 0; i < keys.length; i++) {
      const key = keys[i];
      if (i === keys.length - 1) {
        current[key] = value; // leaf -> assign
      } else {
        if (!current[key] || typeof current[key] !== "object") {
          current[key] = {}; // create nested object
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
```

---

## Section 5: Object Diff (P33)

### Before (Manual comparison)
```js
const old = { name: "Alice", age: 25 };
const new_ = { name: "Alice", age: 26 };
// What changed? Must compare field by field manually
```

### After (Automated diff)
```js
function diffObjects(oldObj, newObj, prefix = "") {
  const result = {};
  const allKeys = new Set([...Object.keys(oldObj), ...Object.keys(newObj)]);

  for (const key of allKeys) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    const oldVal = oldObj[key];
    const newVal = newObj[key];

    if (oldVal && newVal &&
        typeof oldVal === "object" && typeof newVal === "object" &&
        !Array.isArray(oldVal) && !Array.isArray(newVal)) {
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
// => {
//   "user.age": { oldValue: 25, newValue: 26 },
//   "theme": { oldValue: "dark", newValue: "light" }
// }
```

---

## Section 6: Deep Merge Objects (P34)

### Before (Shallow spread loses nested data)
```js
const defaults = { db: { host: "localhost", port: 5432 }, debug: false };
const overrides = { db: { port: 3306 }, debug: true };

const config = { ...defaults, ...overrides };
console.log(config.db); // => { port: 3306 } -- host is LOST!
```

### After (Deep merge preserves nested values)
```js
function deepMerge(target, source) {
  const result = { ...target };

  for (const key of Object.keys(source)) {
    if (result[key] && source[key] &&
        typeof result[key] === "object" && typeof source[key] === "object" &&
        !Array.isArray(result[key]) && !Array.isArray(source[key])) {
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
```

---

## Section 7: pick(obj, keys) (P35)

### Before (Manual property selection)
```js
const user = { name: "Alice", email: "a@b.com", password: "secret", age: 25 };
const public_ = { name: user.name, email: user.email }; // tedious for many keys
```

### After (Generic pick function)
```js
function pick(obj, keys) {
  const result = {};
  for (const key of keys) {
    if (key in obj) result[key] = obj[key];
  }
  return result;
}

const user = { name: "Alice", email: "a@b.com", password: "secret", age: 25 };
console.log(pick(user, ["name", "email"]));
// => { name: "Alice", email: "a@b.com" }
```

---

## Section 8: omit(obj, keys) (P36)

### Before (Manual property exclusion)
```js
const user = { name: "Alice", email: "a@b.com", password: "secret", age: 25 };
const { password, ...safe } = user; // destructuring works but verbose for many keys
```

### After (Generic omit function)
```js
function omit(obj, keys) {
  const keysToOmit = new Set(keys);
  const result = {};
  for (const key of Object.keys(obj)) {
    if (!keysToOmit.has(key)) result[key] = obj[key];
  }
  return result;
}

console.log(omit(user, ["password"]));
// => { name: "Alice", email: "a@b.com", age: 25 }
```

---

## Section 9: Flatten a Deeply Nested Array (P49)

### Before (Nested arrays are hard to process)
```js
const nested = [1, [2, [3, [4]]]];
// How to get [1, 2, 3, 4]?
```

### After (Approach 1: Recursive)
```js
function flattenArrayRecursive(arr) {
  const result = [];
  for (const item of arr) {
    if (Array.isArray(item)) {
      result.push(...flattenArrayRecursive(item));
    } else {
      result.push(item);
    }
  }
  return result;
}

console.log(flattenArrayRecursive([1, [2, [3, [4]]]])); // => [1, 2, 3, 4]
```

### After (Approach 2: Iterative - avoids stack overflow)
```js
function flattenArrayIterative(arr) {
  const stack = [...arr];
  const result = [];

  while (stack.length > 0) {
    const item = stack.pop();
    if (Array.isArray(item)) {
      stack.push(...item);
    } else {
      result.push(item);
    }
  }
  return result.reverse(); // pop reverses order
}

console.log(flattenArrayIterative([1, [2, [3, [4]]]]));      // => [1, 2, 3, 4]
console.log(flattenArrayIterative([[1, 2], [3, [4, [5]]]])); // => [1, 2, 3, 4, 5]
```

---

## Section 10: groupBy (P50)

### Before (Manual grouping with loops)
```js
const users = [
  { name: "Alice", age: 25 },
  { name: "Bob", age: 17 },
  { name: "Charlie", age: 25 },
];

const byAge = {};
for (const u of users) {
  if (!byAge[u.age]) byAge[u.age] = [];
  byAge[u.age].push(u);
}
```

### After (Generic groupBy function)
```js
function groupBy(items, keyOrFn) {
  return items.reduce((groups, item) => {
    const key = typeof keyOrFn === "function" ? keyOrFn(item) : item[keyOrFn];
    if (!groups[key]) groups[key] = [];
    groups[key].push(item);
    return groups;
  }, {});
}

// Group by property name
console.log(groupBy(users, "age"));
// => { "25": [Alice, Charlie], "17": [Bob] }

// Group by function
console.log(groupBy(users, (u) => (u.age >= 18 ? "adult" : "minor")));
// => { adult: [Alice, Charlie], minor: [Bob] }

// Group numbers by even/odd
console.log(groupBy([1, 2, 3, 4, 5, 6], (n) => (n % 2 === 0 ? "even" : "odd")));
// => { odd: [1, 3, 5], even: [2, 4, 6] }
```
