# 02 - Constructor Functions & Prototypes

## Core Concept
> Constructor functions are the pre-ES6 way to create objects with shared behavior. Prototypes are JS's inheritance mechanism.

---

## Section 1: Why Constructors?

### Before (Code duplication)
```js
const user1 = { name: "Alice", greet() { return `Hi, I'm ${this.name}`; } };
const user2 = { name: "Bob",   greet() { return `Hi, I'm ${this.name}`; } };
// greet() is duplicated in memory for every object!
```

### After (Constructor + prototype)
```js
function User(name) {
  this.name = name;
}
User.prototype.greet = function () {
  return `Hi, I'm ${this.name}`;
};

const u1 = new User("Alice");
const u2 = new User("Bob");
console.log(u1.greet()); // => "Hi, I'm Alice"
console.log(u2.greet()); // => "Hi, I'm Bob"
console.log(u1.greet === u2.greet); // => true (shared!)
```

---

## Section 2: The `new` Keyword - 4 Steps

When you call `new Constructor(args)`, JavaScript does:
1. Create a new empty object `{}`
2. Link its `__proto__` to `Constructor.prototype`
3. Execute the constructor with `this` = the new object
4. Return the object (unless constructor explicitly returns an object)

```js
function Person(name, age) {
  this.name = name;
  this.age = age;
}

const p = new Person("Alice", 25);
console.log(p.name);                          // => "Alice"
console.log(p.__proto__ === Person.prototype); // => true
console.log(p instanceof Person);             // => true
```

---

## Section 3: Prototype Chain

```
instance --> Constructor.prototype --> Object.prototype --> null
```

```js
// p has own properties: name, age
console.log(p.hasOwnProperty("name"));  // => true  (own)
console.log(p.hasOwnProperty("greet")); // => false (on prototype)
console.log("toString" in p);           // => true  (inherited from Object.prototype)
```

---

## Section 4: Methods in Constructor vs Prototype

### Before (Method inside constructor - BAD)
```js
function Animal(name) {
  this.name = name;
  this.speak = function () {     // NEW function for EVERY instance
    return `${this.name} speaks`;
  };
}
const a1 = new Animal("Cat");
const a2 = new Animal("Dog");
console.log(a1.speak === a2.speak); // => false (different function objects!)
```

### After (Method on prototype - GOOD)
```js
function Animal(name) {
  this.name = name;
}
Animal.prototype.speak = function () {
  return `${this.name} speaks`;
};
const a1 = new Animal("Cat");
const a2 = new Animal("Dog");
console.log(a1.speak === a2.speak); // => true (same function, saves memory)
```

---

## Section 5: Factory Function vs Constructor

### Before (Factory - no instanceof)
```js
function createCar(make, model) {
  return {
    make,
    model,
    describe() { return `${this.make} - ${this.model}`; },
  };
}
const c = createCar("Honda", "Civic");
console.log(c instanceof createCar); // => false (plain object)
```

### After (Constructor - supports instanceof)
```js
function Car(make, model) {
  this.make = make;
  this.model = model;
}
Car.prototype.describe = function () {
  return `${this.make} - ${this.model}`;
};
const c = new Car("Toyota", "Camry");
console.log(c instanceof Car); // => true (tracks lineage)
```

---

## Section 6: Prototype Pollution Warning

### Before (BAD - modifying built-in prototype)
```js
Array.prototype.first = function () { return this[0]; };
// This affects EVERY array in the entire program!
```

### After (GOOD - custom constructor only)
```js
function MyList(items) {
  this.items = items;
}
MyList.prototype.first = function () {
  return this.items[0];
};
const list = new MyList([10, 20, 30]);
console.log(list.first()); // => 10
```

---

## Practice Q5: Constructor Function for Book

### Before (No shared methods)
```js
const b1 = { title: "Clean Code", author: "Robert Martin",
  getInfo() { return `${this.title} by ${this.author}`; }
};
const b2 = { title: "JS Guide", author: "MDN",
  getInfo() { return `${this.title} by ${this.author}`; }
};
// getInfo duplicated for every book
```

### After (Constructor + prototype)
```js
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
```

---

## Practice Q6: Implement `myNew` (Polyfill for `new`)

### Before (Using `new` as a black box)
```js
const p = new Person("John");
// What actually happens inside `new`?
```

### After (Manual implementation)
```js
function myNew(Constructor, ...args) {
  // Step 1 & 2: Create object linked to Constructor.prototype
  const obj = Object.create(Constructor.prototype);

  // Step 3: Execute constructor with `this` = obj
  const result = Constructor.apply(obj, args);

  // Step 4: If constructor returns an object, use that; otherwise return obj
  return result !== null && typeof result === "object" ? result : obj;
}

function Person(name) { this.name = name; }

const p = myNew(Person, "John");
console.log(p.name);                // => "John"
console.log(p instanceof Person);   // => true
```

---

## Practice Q7: Factory vs Constructor Comparison

### Factory
```js
function createCar(make, model) {
  return {
    make, model,
    describe() { return `${this.make} - ${this.model}`; },
  };
}
const c = createCar("Honda", "Civic");
console.log(c.describe());        // => "Honda - Civic"
console.log(c instanceof Object); // => true (just a plain object)
```

### Constructor
```js
function Car(make, model) {
  this.make = make;
  this.model = model;
}
Car.prototype.describe = function () {
  return `${this.make} - ${this.model}`;
};
const c = new Car("Toyota", "Camry");
console.log(c.describe());     // => "Toyota - Camry"
console.log(c instanceof Car); // => true (linked to Car)
```

---

## Practice Q8: Student with Prototype + map

### Before (No prototype methods)
```js
const students = [
  { id: 101, name: "Ali" },
  { id: 102, name: "Bina" },
];
const ids = students.map((s) => s.id); // works but no encapsulation
```

### After (Constructor + prototype method)
```js
function Student(id, name) {
  this.id = id;
  this.name = name;
}
Student.prototype.getId = function () {
  return this.id;
};

const students = [new Student(101, "Ali"), new Student(102, "Bina")];
const ids = students.map((s) => s.getId());
console.log(ids); // => [101, 102]
```

---

## Practice P20: Polyfill Object.create

### Before (Using Object.create as a black box)
```js
const parent = { greet() { return "hello"; } };
const child = Object.create(parent);
child.greet(); // => "hello" -- but how does this work?
```

### After (Manual implementation)
```js
function myObjectCreate(proto) {
  if (proto === null || (typeof proto !== "object" && typeof proto !== "function")) {
    if (proto !== null) throw new TypeError("Object prototype may only be an Object or null");
  }
  function F() {}
  F.prototype = proto;
  return new F();
}

const parent = { greet() { return "hello"; } };
const child = myObjectCreate(parent);
console.log(child.greet());                      // => "hello"
console.log(Object.getPrototypeOf(child) === parent); // => true
```

---

## Practice P37: `myNew` Edge Case

### Before (What happens when constructor returns an object?)
```js
function Sneaky() {
  this.name = "original";
  return { name: "override" }; // explicit object return
}
const s = new Sneaky();
console.log(s.name); // => ???
```

### After (Explicit return wins)
```js
function Sneaky() {
  this.name = "original";
  return { name: "override" };
}
const s = new Sneaky();
console.log(s.name);              // => "override" (explicit return wins)
console.log(s instanceof Sneaky); // => false (it's a plain object)
```

---

## Practice P38: Manual Prototypal Inheritance

### Before (No inheritance between constructors)
```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return `${this.name} makes a sound`; };

function Dog(name, breed) {
  this.name = name;
  this.breed = breed;
}
// Dog doesn't inherit from Animal!
const dog = new Dog("Rex", "Lab");
// dog.speak(); // TypeError: dog.speak is not a function
```

### After (Manual inheritance with `inherit()`)
```js
function inherit(Child, Parent) {
  Child.prototype = Object.create(Parent.prototype);
  Child.prototype.constructor = Child;
}

function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return `${this.name} makes a sound`; };

function Dog(name, breed) {
  Animal.call(this, name); // call parent constructor
  this.breed = breed;
}
inherit(Dog, Animal);

Dog.prototype.bark = function () { return `${this.name} barks!`; };

const dog = new Dog("Rex", "Labrador");
console.log(dog.speak());           // => "Rex makes a sound" (inherited)
console.log(dog.bark());            // => "Rex barks!" (own)
console.log(dog instanceof Dog);    // => true
console.log(dog instanceof Animal); // => true
```

---

## Practice P39: Prototype Lookup Reasoning

### Before (Confusion about delete)
```js
function A() {}
A.prototype.x = 10;
const obj = new A();

delete obj.x;
console.log(obj.x); // => ???
```

### After (Understanding prototype lookup)
```js
function A() {}
A.prototype.x = 10;
const obj = new A();

delete obj.x;
console.log(obj.x); // => 10 (x is on prototype, not own property)

obj.x = 20;         // creates OWN property (shadows prototype)
console.log(obj.x); // => 20

delete obj.x;       // deletes OWN property
console.log(obj.x); // => 10 (falls back to prototype)

delete A.prototype.x;
console.log(obj.x); // => undefined (nowhere in the chain)
```
