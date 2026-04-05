// ============================================
// 02 - CONSTRUCTOR FUNCTIONS & PROTOTYPES
// ============================================
// Constructor functions are the pre-ES6 way to create objects with shared behavior.
// Prototypes are JS's inheritance mechanism: objects delegate property lookups
// up a chain until the property is found or the chain ends at null.

// ============================================
// SECTION 1: Why Constructors?
// ============================================
// Without constructors, you'd duplicate code for every similar object.

console.log("--- SECTION 1: Why Constructors ---");

// --- BAD EXAMPLE: Code duplication ---
const user1 = { name: "Alice", greet() { return `Hi, I'm ${this.name}`; } };
const user2 = { name: "Bob",   greet() { return `Hi, I'm ${this.name}`; } };
// greet() is duplicated in memory for every object!

// --- GOOD EXAMPLE: Constructor function ---
function User(name) {
  this.name = name; // instance data goes in the constructor
}
// Shared methods go on the prototype (one copy, shared by all instances)
User.prototype.greet = function () {
  return `Hi, I'm ${this.name}`;
};

const u1 = new User("Alice");
const u2 = new User("Bob");
console.log(u1.greet()); // => "Hi, I'm Alice"
console.log(u2.greet()); // => "Hi, I'm Bob"
// Both share the SAME greet function:
console.log(u1.greet === u2.greet); // => true

// ============================================
// SECTION 2: The `new` Keyword - 4 Steps
// ============================================
// When you call `new Constructor(args)`, JavaScript does 4 things:
//
//   Step 1: Create a new empty object {}
//   Step 2: Link its __proto__ to Constructor.prototype
//   Step 3: Execute the constructor with `this` = the new object
//   Step 4: Return the object (unless constructor explicitly returns an object)

console.log("\n--- SECTION 2: What `new` Does ---");

function Person(name, age) {
  // Step 3 happens here: `this` is the new object
  this.name = name;
  this.age = age;
  // Step 4: implicit return of `this`
}

const p = new Person("Alice", 25);
console.log(p.name);                          // => "Alice"
console.log(p.__proto__ === Person.prototype); // => true (Step 2)
console.log(p instanceof Person);             // => true

// ============================================
// SECTION 3: Prototype Chain
// ============================================
// instance --> Constructor.prototype --> Object.prototype --> null
//
// When you access a property, JS walks up this chain until it finds it
// or reaches null (then returns undefined).

console.log("\n--- SECTION 3: Prototype Chain ---");

/*
  p (Person instance)
    │
    ├── name: "Alice"
    ├── age: 25
    │
    └── __proto__ ──► Person.prototype
                        │
                        ├── constructor: Person
                        │
                        └── __proto__ ──► Object.prototype
                                           │
                                           ├── toString()
                                           ├── hasOwnProperty()
                                           │
                                           └── __proto__ ──► null
*/

console.log(p.hasOwnProperty("name"));   // => true  (own property)
console.log(p.hasOwnProperty("greet"));  // => false (on prototype, not own)
console.log("toString" in p);            // => true  (inherited from Object.prototype)

// ============================================
// SECTION 4: Methods in Constructor vs Prototype
// ============================================

console.log("\n--- SECTION 4: Constructor vs Prototype Methods ---");

// --- BAD: Method INSIDE constructor (duplicated per instance) ---
function AnimalBad(name) {
  this.name = name;
  this.speak = function () {         // NEW function created for EVERY instance
    return `${this.name} speaks`;
  };
}
const a1 = new AnimalBad("Cat");
const a2 = new AnimalBad("Dog");
console.log(a1.speak === a2.speak); // => false (different function objects!)

// --- GOOD: Method ON prototype (shared across all instances) ---
function AnimalGood(name) {
  this.name = name;
}
AnimalGood.prototype.speak = function () {
  return `${this.name} speaks`;
};
const a3 = new AnimalGood("Cat");
const a4 = new AnimalGood("Dog");
console.log(a3.speak === a4.speak); // => true (same function, saves memory)

// ============================================
// SECTION 5: Factory Function vs Constructor
// ============================================
// Factory: returns a plain object, no `new`, no `instanceof`.
// Constructor: uses `new`, links prototype, supports `instanceof`.

console.log("\n--- SECTION 5: Factory vs Constructor ---");

// Constructor
function Car(make, model) {
  this.make = make;
  this.model = model;
}
Car.prototype.describe = function () {
  return `${this.make} - ${this.model}`;
};

// Factory
function createCar(make, model) {
  return {
    make,
    model,
    describe() {
      return `${this.make} - ${this.model}`;
    },
  };
}

const c1 = new Car("Toyota", "Camry");
const c2 = createCar("Honda", "Civic");

console.log(c1.describe());        // => "Toyota - Camry"
console.log(c2.describe());        // => "Honda - Civic"
console.log(c1 instanceof Car);    // => true  (constructor tracks lineage)
console.log(c2 instanceof Car);    // => false (factory returns plain object)

// ============================================
// SECTION 6: Prototype Pollution Warning
// ============================================
// NEVER modify built-in prototypes (Array.prototype, Object.prototype)
// in production code. It can break other libraries and cause unexpected behavior.

console.log("\n--- SECTION 6: Prototype Pollution ---");

// --- BAD: Modifying built-in prototype ---
// Array.prototype.first = function() { return this[0]; };
// This affects EVERY array in the entire program!

// --- GOOD: Keep custom methods on YOUR constructors only ---
function MyList(items) {
  this.items = items;
}
MyList.prototype.first = function () {
  return this.items[0];
};
const list = new MyList([10, 20, 30]);
console.log(list.first()); // => 10

// ============================================
// PRACTICE Q5: Constructor Function for Book with Prototype Method
// ============================================

console.log("\n--- PRACTICE Q5: Book Constructor ---");

function Book(title, author) {
  this.title = title;
  this.author = author;
}

Book.prototype.getInfo = function () {
  return `${this.title} by ${this.author}`;
};

const b1 = new Book("Clean Code", "Robert Martin");
const b2 = new Book("JS Guide", "MDN");
console.log(b1.getInfo()); // => "Clean Code by Robert Martin"
console.log(b2.getInfo()); // => "JS Guide by MDN"

// ============================================
// PRACTICE Q6: Implement `myNew` (Polyfill for `new`)
// ============================================
// Recreate the 4 steps of `new` manually.

console.log("\n--- PRACTICE Q6: myNew ---");

function myNew(Constructor, ...args) {
  // Step 1 & 2: Create object linked to Constructor.prototype
  const obj = Object.create(Constructor.prototype);

  // Step 3: Execute constructor with `this` = obj
  const result = Constructor.apply(obj, args);

  // Step 4: If constructor returns an object, use that; otherwise return obj
  // (typeof null === "object", so we also check result !== null)
  return result !== null && typeof result === "object" ? result : obj;
}

function PersonQ6(name) {
  this.name = name;
}

const personQ6 = myNew(PersonQ6, "John");
console.log(personQ6.name);                // => "John"
console.log(personQ6 instanceof PersonQ6); // => true

// ============================================
// PRACTICE Q7: Factory Function vs Constructor
// ============================================

console.log("\n--- PRACTICE Q7: Factory vs Constructor ---");

function CarQ7(make, model) {
  this.make = make;
  this.model = model;
}
CarQ7.prototype.describe = function () {
  return `${this.make} - ${this.model}`;
};

function createCarQ7(make, model) {
  return {
    make,
    model,
    describe() {
      return `${this.make} - ${this.model}`;
    },
  };
}

const cq1 = new CarQ7("Toyota", "Camry");
const cq2 = createCarQ7("Honda", "Civic");
console.log(cq1.describe());        // => "Toyota - Camry"
console.log(cq2.describe());        // => "Honda - Civic"
console.log(cq1 instanceof CarQ7);  // => true
console.log(cq2 instanceof CarQ7);  // => false

// ============================================
// PRACTICE Q8: Student with Prototype + map for IDs
// ============================================

console.log("\n--- PRACTICE Q8: Student Prototype ---");

function Student(id, name) {
  this.id = id;
  this.name = name;
}

Student.prototype.getId = function () {
  return this.id;
};

const students = [new Student(101, "Ali"), new Student(102, "Bina")];

// Use native Array.map (do NOT add methods to Array.prototype)
const ids = students.map((s) => s.getId());
console.log(ids); // => [101, 102]

// ============================================
// PRACTICE P20: Polyfill Object.create
// ============================================
// Object.create(proto) returns a new object whose __proto__ is `proto`.

console.log("\n--- PRACTICE P20: myObjectCreate ---");

function myObjectCreate(proto) {
  // Reject invalid prototypes
  if (proto === null || (typeof proto !== "object" && typeof proto !== "function")) {
    if (proto !== null) throw new TypeError("Object prototype may only be an Object or null");
  }

  // The classic trick: use a temporary constructor
  function F() {}
  F.prototype = proto;
  return new F();
}

const parent = { greet() { return "hello"; } };
const child = myObjectCreate(parent);
console.log(child.greet());                      // => "hello"
console.log(Object.getPrototypeOf(child) === parent); // => true

// ============================================
// PRACTICE P37: Implement `new` Operator (with edge case)
// ============================================
// Edge case: if the constructor returns an explicit object, `new` uses that instead.

console.log("\n--- PRACTICE P37: myNew edge case ---");

function Sneaky() {
  this.name = "original";
  // Returning an explicit object overrides the default behavior
  return { name: "override" };
}

const s = myNew(Sneaky);
console.log(s.name);                // => "override" (explicit return wins)
console.log(s instanceof Sneaky);   // => false (it's a plain object, not linked)

// ============================================
// PRACTICE P38: Manual Prototypal Inheritance
// ============================================
// Set up inheritance between constructor functions without `class`.

console.log("\n--- PRACTICE P38: inherit() ---");

function inherit(Child, Parent) {
  // Create a new object whose __proto__ is Parent.prototype
  Child.prototype = Object.create(Parent.prototype);
  // Fix the constructor reference (otherwise Child.prototype.constructor === Parent)
  Child.prototype.constructor = Child;
}

function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

function Dog(name, breed) {
  Animal.call(this, name); // Call parent constructor with `this`
  this.breed = breed;
}

inherit(Dog, Animal); // Set up prototype chain: Dog.prototype --> Animal.prototype

Dog.prototype.bark = function () {
  return `${this.name} barks!`;
};

const dog = new Dog("Rex", "Labrador");
console.log(dog.speak());            // => "Rex makes a sound" (inherited from Animal)
console.log(dog.bark());             // => "Rex barks!" (own method)
console.log(dog instanceof Dog);     // => true
console.log(dog instanceof Animal);  // => true

// ============================================
// PRACTICE P39: Prototype Lookup Reasoning
// ============================================
// Understanding what happens when you delete properties on instances vs prototypes.

console.log("\n--- PRACTICE P39: Prototype Lookup ---");

function A() {}
A.prototype.x = 10;

const aObj = new A();

// Q: What does `delete aObj.x` do?
// A: Nothing! aObj doesn't have its OWN `x` property.
//    `x` is on A.prototype, not on the instance.
delete aObj.x;
console.log(aObj.x); // => 10 (still found on prototype)

// If we SET aObj.x first, then delete it:
aObj.x = 20;                     // Creates OWN property on instance
console.log(aObj.x);             // => 20 (own property shadows prototype)
delete aObj.x;                   // Deletes the OWN property
console.log(aObj.x);             // => 10 (falls back to prototype)

// If we delete from the prototype itself:
delete A.prototype.x;
console.log(aObj.x);             // => undefined (nowhere in the chain)
