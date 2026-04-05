// ============================================
// 13 - DESIGN PATTERNS
// ============================================
// Classic design patterns implemented in JavaScript:
// Singleton, Factory, Observer, EventEmitter, Pub-Sub,
// LRU Cache, and Priority Task Scheduler.

// ============================================
// SECTION 1: Singleton Pattern (P42)
// ============================================
// Ensures only ONE instance of a class/object exists.
// Use case: config managers, database connections, loggers.

console.log("--- SECTION 1: Singleton ---");

// Approach 1: Closure-based (no class)
const ConfigManager = (function () {
  let instance = null;

  function create() {
    const config = {}; // private config store
    return {
      set(key, value) {
        config[key] = value;
      },
      get(key) {
        return config[key];
      },
      getAll() {
        return { ...config };
      },
    };
  }

  return {
    getInstance() {
      if (!instance) {
        instance = create();
      }
      return instance; // always returns the SAME instance
    },
  };
})();

const config1 = ConfigManager.getInstance();
const config2 = ConfigManager.getInstance();
config1.set("theme", "dark");
console.log(config2.get("theme"));     // => "dark" (same instance!)
console.log(config1 === config2);       // => true

// Approach 2: Class-based
class Logger {
  static #instance = null;

  constructor() {
    if (Logger.#instance) {
      return Logger.#instance; // return existing instance
    }
    this.logs = [];
    Logger.#instance = this;
  }

  log(message) {
    this.logs.push({ message, timestamp: Date.now() });
    console.log(`  [LOG]: ${message}`);
  }

  getHistory() {
    return this.logs;
  }
}

const logger1 = new Logger();
const logger2 = new Logger();
logger1.log("Server started");
console.log(logger1 === logger2);           // => true (same instance)
console.log(logger2.getHistory().length);   // => 1

// ============================================
// SECTION 2: Factory Pattern (P43)
// ============================================
// Create objects without exposing creation logic or using `new`.
// A central function decides which type to create based on input.

console.log("\n--- SECTION 2: Factory ---");

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
        promote(user) {
          return `${this.name} promoted ${user}`;
        },
      };

    case "moderator":
      return {
        ...base,
        permissions: ["read", "write", "delete"],
        ban(user) {
          return `${this.name} banned ${user}`;
        },
      };

    case "customer":
      return {
        ...base,
        permissions: ["read"],
        purchase(item) {
          return `${this.name} purchased ${item}`;
        },
      };

    default:
      throw new Error(`Unknown user type: ${type}`);
  }
}

const admin = createUser("admin", { name: "Alice" });
const customer = createUser("customer", { name: "Bob" });

console.log(admin.promote("Bob"));      // => "Alice promoted Bob"
console.log(customer.purchase("Laptop")); // => "Bob purchased Laptop"
console.log(admin.permissions);           // => ["read", "write", "delete", "manage-users"]

// ============================================
// SECTION 3: Observer Pattern (P44)
// ============================================
// A subject maintains a list of observers (subscribers).
// When state changes, all observers are notified.
// Foundation of: React state, Redux, event systems.

console.log("\n--- SECTION 3: Observer ---");

function createObservable() {
  const listeners = [];

  return {
    subscribe(listener) {
      listeners.push(listener);
    },

    unsubscribe(listener) {
      const index = listeners.indexOf(listener);
      if (index > -1) listeners.splice(index, 1);
    },

    notify(data) {
      // Notify all subscribers in order
      listeners.forEach((listener) => listener(data));
    },
  };
}

const store = createObservable();

function loggerObserver(data) {
  console.log("  Observer A:", data);
}
function displayObserver(data) {
  console.log("  Observer B:", data);
}

store.subscribe(loggerObserver);
store.subscribe(displayObserver);

store.notify({ action: "UPDATE", value: 42 });
// => Observer A: { action: "UPDATE", value: 42 }
// => Observer B: { action: "UPDATE", value: 42 }

store.unsubscribe(loggerObserver);
store.notify({ action: "DELETE" });
// => Observer B: { action: "DELETE" } (only B remains)

// ============================================
// SECTION 4: EventEmitter (P45)
// ============================================
// Node.js-style event system: on, off, emit, once.
// Multiple listeners per event. Unknown events are safe.

console.log("\n--- SECTION 4: EventEmitter ---");

class EventEmitter {
  constructor() {
    this.events = {}; // { eventName: [listener1, listener2, ...] }
  }

  // Register a listener for an event
  on(event, listener) {
    if (!this.events[event]) this.events[event] = [];
    this.events[event].push(listener);
    return this; // for chaining
  }

  // Remove a specific listener
  off(event, listener) {
    if (!this.events[event]) return this;
    this.events[event] = this.events[event].filter((fn) => fn !== listener);
    return this;
  }

  // Trigger all listeners for an event
  emit(event, ...args) {
    if (!this.events[event]) return false; // safe: unknown event
    // Copy array to avoid issues if listener removes itself
    [...this.events[event]].forEach((listener) => listener(...args));
    return true;
  }

  // Register a one-time listener (auto-removes after first call)
  once(event, listener) {
    const wrapper = (...args) => {
      listener(...args);
      this.off(event, wrapper); // remove after first invocation
    };
    this.on(event, wrapper);
    return this;
  }
}

const emitter = new EventEmitter();

emitter.on("data", (payload) => console.log("  Listener 1:", payload));
emitter.once("data", (payload) => console.log("  Listener 2 (once):", payload));

emitter.emit("data", "first");
// => Listener 1: first
// => Listener 2 (once): first

emitter.emit("data", "second");
// => Listener 1: second
// (Listener 2 was removed after first emit)

emitter.emit("unknown-event"); // safe, returns false

// ============================================
// SECTION 5: Pub-Sub System (P46)
// ============================================
// Topic-based messaging: decouple publishers from subscribers.
// subscribe() returns an unsubscribe function.

console.log("\n--- SECTION 5: Pub-Sub ---");

function createPubSub() {
  const topics = {}; // { topic: [listener, ...] }

  return {
    subscribe(topic, listener) {
      if (!topics[topic]) topics[topic] = [];
      topics[topic].push(listener);

      // Return unsubscribe function (closure over topic and listener)
      return function unsubscribe() {
        topics[topic] = topics[topic].filter((fn) => fn !== listener);
      };
    },

    publish(topic, payload) {
      if (!topics[topic]) return; // safe: no subscribers
      topics[topic].forEach((listener) => listener(payload));
    },
  };
}

const pubsub = createPubSub();

const unsub1 = pubsub.subscribe("user:login", (user) =>
  console.log(`  Analytics: ${user} logged in`)
);
const unsub2 = pubsub.subscribe("user:login", (user) =>
  console.log(`  Notification: Welcome back ${user}`)
);

pubsub.publish("user:login", "Alice");
// => Analytics: Alice logged in
// => Notification: Welcome back Alice

unsub1(); // unsubscribe analytics
pubsub.publish("user:login", "Bob");
// => Notification: Welcome back Bob (only one subscriber left)

pubsub.publish("user:logout", "Bob"); // safe: no subscribers for this topic

// ============================================
// SECTION 6: LRU Cache (P47)
// ============================================
// Least Recently Used cache with O(1) get and put.
// Uses Map (which preserves insertion order in JS).
// When full, evicts the least recently used entry.

console.log("\n--- SECTION 6: LRU Cache ---");

class LRUCache {
  constructor(capacity) {
    this.capacity = capacity;
    this.cache = new Map(); // Map preserves insertion order
  }

  get(key) {
    if (!this.cache.has(key)) return -1;

    // Move to "most recently used" position:
    // delete and re-insert (Map puts it at the end)
    const value = this.cache.get(key);
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  put(key, value) {
    // If key exists, delete first (so re-insert moves it to end)
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // If at capacity, evict the LEAST recently used (first entry in Map)
    if (this.cache.size >= this.capacity) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    this.cache.set(key, value);
  }

  // Helper for debugging
  toString() {
    return JSON.stringify([...this.cache.entries()]);
  }
}

const lru = new LRUCache(3);

lru.put("a", 1);
lru.put("b", 2);
lru.put("c", 3);
console.log("Get b:", lru.get("b"));   // => 2 (moves "b" to most recent)
lru.put("d", 4);                       // evicts "a" (least recently used)
console.log("Get a:", lru.get("a"));   // => -1 (evicted)
console.log("Get c:", lru.get("c"));   // => 3
console.log("Get d:", lru.get("d"));   // => 4

// ============================================
// SECTION 7: Priority-Based Task Scheduler (P48)
// ============================================
// Tasks are added with a priority. Higher priority runs first.
// Same priority → FIFO (stable ordering).

console.log("\n--- SECTION 7: Priority Task Scheduler ---");

class TaskScheduler {
  constructor() {
    this.queue = []; // [{ taskFn, priority, insertionOrder }]
    this.insertionCounter = 0;
  }

  add(taskFn, priority) {
    this.queue.push({
      taskFn,
      priority,
      order: this.insertionCounter++,
    });
    // Sort: higher priority first; same priority → earlier insertion first
    this.queue.sort((a, b) => {
      if (b.priority !== a.priority) return b.priority - a.priority;
      return a.order - b.order; // stable: earlier first
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

scheduler.add(() => {
  console.log("  Low priority task");
  return "low";
}, 1);

scheduler.add(() => {
  console.log("  High priority task");
  return "high";
}, 10);

scheduler.add(() => {
  console.log("  Medium priority task");
  return "medium";
}, 5);

scheduler.add(() => {
  console.log("  Another high priority task");
  return "high2";
}, 10);

scheduler.runAll().then((results) => {
  console.log("Scheduler results:", results);
  // => ["high", "high2", "medium", "low"] (priority order, stable within same priority)
});
