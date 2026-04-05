# 13 - Design Patterns

## Core Concept
> Classic design patterns implemented in JavaScript: Singleton, Factory, Observer, EventEmitter, Pub-Sub, LRU Cache, and Priority Task Scheduler.

---

## Section 1: Singleton Pattern (P42)

### Before (Multiple instances - inconsistent state)
```js
class ConfigManager {
  constructor() {
    this.config = {};
  }
  set(key, value) { this.config[key] = value; }
  get(key) { return this.config[key]; }
}

const config1 = new ConfigManager();
const config2 = new ConfigManager();
config1.set("theme", "dark");
console.log(config2.get("theme")); // => undefined (different instance!)
console.log(config1 === config2);  // => false
```

### After (Approach 1: Closure-based singleton)
```js
const ConfigManager = (function () {
  let instance = null;

  function create() {
    const config = {};
    return {
      set(key, value) { config[key] = value; },
      get(key) { return config[key]; },
      getAll() { return { ...config }; },
    };
  }

  return {
    getInstance() {
      if (!instance) instance = create();
      return instance; // always returns the SAME instance
    },
  };
})();

const config1 = ConfigManager.getInstance();
const config2 = ConfigManager.getInstance();
config1.set("theme", "dark");
console.log(config2.get("theme")); // => "dark" (same instance!)
console.log(config1 === config2);  // => true
```

### After (Approach 2: Class-based singleton)
```js
class Logger {
  static #instance = null;

  constructor() {
    if (Logger.#instance) return Logger.#instance;
    this.logs = [];
    Logger.#instance = this;
  }

  log(message) {
    this.logs.push({ message, timestamp: Date.now() });
    console.log(`[LOG]: ${message}`);
  }

  getHistory() { return this.logs; }
}

const logger1 = new Logger();
const logger2 = new Logger();
logger1.log("Server started");
console.log(logger1 === logger2);         // => true (same instance)
console.log(logger2.getHistory().length); // => 1
```

---

## Section 2: Factory Pattern (P43)

### Before (Manually creating different object types)
```js
const admin = {
  name: "Alice", type: "admin",
  permissions: ["read", "write", "delete", "manage-users"],
  promote(user) { return `${this.name} promoted ${user}`; },
};
const customer = {
  name: "Bob", type: "customer",
  permissions: ["read"],
  purchase(item) { return `${this.name} purchased ${item}`; },
};
// Repetitive, error-prone, no centralized creation logic
```

### After (Factory function decides which type to create)
```js
function createUser(type, data) {
  const base = {
    name: data.name,
    type,
    createdAt: new Date().toISOString(),
  };

  switch (type) {
    case "admin":
      return {
        ...base,
        permissions: ["read", "write", "delete", "manage-users"],
        promote(user) { return `${this.name} promoted ${user}`; },
      };
    case "moderator":
      return {
        ...base,
        permissions: ["read", "write", "delete"],
        ban(user) { return `${this.name} banned ${user}`; },
      };
    case "customer":
      return {
        ...base,
        permissions: ["read"],
        purchase(item) { return `${this.name} purchased ${item}`; },
      };
    default:
      throw new Error(`Unknown user type: ${type}`);
  }
}

const admin = createUser("admin", { name: "Alice" });
const customer = createUser("customer", { name: "Bob" });
console.log(admin.promote("Bob"));       // => "Alice promoted Bob"
console.log(customer.purchase("Laptop")); // => "Bob purchased Laptop"
```

---

## Section 3: Observer Pattern (P44)

### Before (Tight coupling - manually notifying each component)
```js
function updateUI(data) { console.log("UI updated:", data); }
function logChange(data) { console.log("Logged:", data); }

// Must manually call each function when data changes
function onDataChange(data) {
  updateUI(data);
  logChange(data);
  // Must add every new handler here - tight coupling!
}
```

### After (Loose coupling - subscribe/notify)
```js
function createObservable() {
  const listeners = [];

  return {
    subscribe(listener) { listeners.push(listener); },
    unsubscribe(listener) {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    },
    notify(data) {
      listeners.forEach((listener) => listener(data));
    },
  };
}

const store = createObservable();

function loggerObserver(data) { console.log("Observer A:", data); }
function displayObserver(data) { console.log("Observer B:", data); }

store.subscribe(loggerObserver);
store.subscribe(displayObserver);

store.notify({ action: "UPDATE", value: 42 });
// => Observer A: { action: "UPDATE", value: 42 }
// => Observer B: { action: "UPDATE", value: 42 }

store.unsubscribe(loggerObserver);
store.notify({ action: "DELETE" });
// => Observer B: { action: "DELETE" } (only B remains)
```

---

## Section 4: EventEmitter (P45)

### Before (No event system - manual callback management)
```js
const handlers = [];
function addHandler(fn) { handlers.push(fn); }
function trigger(data) { handlers.forEach((fn) => fn(data)); }
// No support for: multiple event types, removal, once
```

### After (Full Node.js-style EventEmitter)
```js
class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return this;
  }

  off(event, listener) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter((fn) => fn !== listener);
    return this;
  }

  emit(event, ...args) {
    if (!this.events[event]) return false;
    [...this.events[event]].forEach((listener) => listener(...args));
    return true;
  }

  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper); // auto-remove after first call
    };
    this.on(event, wrapper);
    return this;
  }
}

const emitter = new EventEmitter();

emitter.on("data", (payload) => console.log("Listener 1:", payload));
emitter.once("data", (payload) => console.log("Listener 2 (once):", payload));

emitter.emit("data", "first");
// => Listener 1: first
// => Listener 2 (once): first

emitter.emit("data", "second");
// => Listener 1: second
// (Listener 2 was removed after first emit)
```

---

## Section 5: Pub-Sub System (P46)

### Before (Direct function calls - tight coupling)
```js
function onLogin(user) {
  logAnalytics(user);  // must know about analytics
  sendWelcome(user);   // must know about notifications
}
```

### After (Topic-based messaging - fully decoupled)
```js
function createPubSub() {
  const topics = {};

  return {
    subscribe(topic, listener) {
      if (!topics[topic]) topics[topic] = [];
      topics[topic].push(listener);

      // Return unsubscribe function
      return function unsubscribe() {
        topics[topic] = topics[topic].filter((fn) => fn !== listener);
      };
    },

    publish(topic, payload) {
      if (!topics[topic]) return;
      topics[topic].forEach((listener) => listener(payload));
    },
  };
}

const pubsub = createPubSub();

const unsub1 = pubsub.subscribe("user:login", (user) =>
  console.log(`Analytics: ${user} logged in`)
);
const unsub2 = pubsub.subscribe("user:login", (user) =>
  console.log(`Notification: Welcome back ${user}`)
);

pubsub.publish("user:login", "Alice");
// => Analytics: Alice logged in
// => Notification: Welcome back Alice

unsub1(); // unsubscribe analytics
pubsub.publish("user:login", "Bob");
// => Notification: Welcome back Bob (only one subscriber left)
```

---

## Section 6: LRU Cache (P47)

### Before (No eviction - cache grows forever)
```js
const cache = {};
cache["key1"] = "value1";
cache["key2"] = "value2";
// ... keeps growing, eventually runs out of memory
```

### After (Fixed capacity, evicts least recently used)
```js
class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map preserves insertion order
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    // Move to "most recently used" (delete + re-insert)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    if (this.cache.has(key)) this.cache.delete(key);

    // At capacity? Evict the least recently used (first entry)
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }
}

const lru = new LRUCache(3);

lru.put("a", 1);
lru.put("b", 2);
lru.put("c", 3);
console.log(lru.get("b"));  // => 2 (moves "b" to most recent)
lru.put("d", 4);            // evicts "a" (least recently used)
console.log(lru.get("a"));  // => -1 (evicted)
console.log(lru.get("c"));  // => 3
console.log(lru.get("d"));  // => 4
```

---

## Section 7: Priority-Based Task Scheduler (P48)

### Before (FIFO only - no priority)
```js
const queue = [];
queue.push(taskA);
queue.push(taskB);
queue.push(taskC);
// Always runs in insertion order, can't prioritize
```

### After (Higher priority runs first)
```js
class TaskScheduler {
  constructor() {
    this.queue = [];
    this.insertionCounter = 0;
  }

  add(taskFn, priority) {
    this.queue.push({
      taskFn,
      priority,
      order: this.insertionCounter++,
    });
    // Sort: higher priority first; same priority -> FIFO
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.order - b.order;
    });
  }

  async runNext() {
    if (this.queue.length === 0) return null;
    const task = this.queue.shift();
    return task.taskFn();
  }

  async runAll() {
    const results = [];
    while (this.queue.length > 0) {
      const result = await this.runNext();
      results.push(result);
    }
    return results;
  }
}

const scheduler = new TaskScheduler();

scheduler.add(() => { console.log("Low priority"); return "low"; }, 1);
scheduler.add(() => { console.log("High priority"); return "high"; }, 10);
scheduler.add(() => { console.log("Medium priority"); return "medium"; }, 5);
scheduler.add(() => { console.log("Another high"); return "high2"; }, 10);

scheduler.runAll().then((results) => {
  console.log(results);
  // => ["high", "high2", "medium", "low"]
});
```
