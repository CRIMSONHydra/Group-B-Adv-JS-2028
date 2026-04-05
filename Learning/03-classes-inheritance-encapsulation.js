// ============================================
// 03 - ES6 CLASSES, INHERITANCE & ENCAPSULATION
// ============================================
// ES6 classes are syntactic sugar over constructor functions + prototypes.
// Under the hood, they still use the prototype chain.
// Classes add cleaner syntax for: constructors, methods, static members,
// private fields (#), inheritance (extends/super), and getters/setters.

// ============================================
// SECTION 1: Basic Class Syntax
// ============================================

console.log("--- SECTION 1: Basic Class Syntax ---");

class UserBasic {
  // The constructor runs when you do `new UserBasic(...)`
  constructor(name, email) {
    this.name = name;   // instance property
    this.email = email;
  }

  // Methods defined here go on UserBasic.prototype (shared, not duplicated)
  greet() {
    return `Hi, I'm ${this.name} (${this.email})`;
  }
}

const ub = new UserBasic("Alice", "alice@test.com");
console.log(ub.greet()); // => "Hi, I'm Alice (alice@test.com)"

// Proof it's still prototype-based:
console.log(typeof UserBasic);                             // => "function"
console.log(ub.__proto__ === UserBasic.prototype);         // => true
console.log(ub.greet === UserBasic.prototype.greet);       // => true

// ============================================
// SECTION 2: Static Properties & Methods
// ============================================
// `static` members belong to the CLASS itself, not to instances.
// Use for: counters, utility methods, factory methods.

console.log("\n--- SECTION 2: Static Members ---");

class Product {
  static count = 0; // static property: shared across all instances

  constructor(name) {
    this.name = name;
    Product.count++; // access via ClassName, not `this`
  }

  // Static method: called as Product.getCount(), not instance.getCount()
  static getCount() {
    return Product.count;
  }

  // Instance method
  describe() {
    return `Product: ${this.name}`;
  }
}

const p1 = new Product("Laptop");
const p2 = new Product("Phone");
console.log(Product.getCount()); // => 2
console.log(p1.describe());     // => "Product: Laptop"

// --- BAD: Trying to access static from instance ---
// console.log(p1.getCount()); // TypeError: p1.getCount is not a function

// --- GOOD: Access static from the class ---
console.log(Product.getCount()); // => 2

// ============================================
// SECTION 3: Private Fields (#)
// ============================================
// Private fields start with #. They are TRULY private - not accessible
// outside the class body. Not even subclasses can access them.

console.log("\n--- SECTION 3: Private Fields ---");

class BankAccount {
  #balance; // private field declaration

  constructor(initialBalance) {
    this.#balance = initialBalance;
  }

  deposit(amount) {
    if (amount <= 0) throw new Error("Amount must be positive");
    this.#balance += amount;
    return this.#balance;
  }

  withdraw(amount) {
    if (amount > this.#balance) throw new Error("Insufficient funds");
    this.#balance -= amount;
    return this.#balance;
  }

  getBalance() {
    return this.#balance;
  }
}

const acc = new BankAccount(1000);
console.log(acc.getBalance()); // => 1000
console.log(acc.deposit(500)); // => 1500

// --- BAD: Trying to access private field from outside ---
// console.log(acc.#balance); // SyntaxError: Private field '#balance'

// --- GOOD: Use public methods to interact with private data ---
console.log(acc.getBalance()); // => 1500

// ============================================
// SECTION 4: Private Methods (#)
// ============================================

console.log("\n--- SECTION 4: Private Methods ---");

class PasswordValidator {
  // Private method: internal logic only
  #meetsLength(str) {
    return str.length >= 8;
  }

  #hasNumber(str) {
    return /\d/.test(str);
  }

  // Public API
  validate(password) {
    if (!this.#meetsLength(password)) return "Too short (min 8 chars)";
    if (!this.#hasNumber(password)) return "Must contain a number";
    return "Valid";
  }
}

const pv = new PasswordValidator();
console.log(pv.validate("hi"));          // => "Too short (min 8 chars)"
console.log(pv.validate("helloworld"));  // => "Must contain a number"
console.log(pv.validate("hello123!"));   // => "Valid"

// ============================================
// SECTION 5: Getters & Setters
// ============================================
// `get` and `set` let you define properties that run functions on access.

console.log("\n--- SECTION 5: Getters & Setters ---");

class Circle {
  #radius;

  constructor(radius) {
    this.#radius = radius;
  }

  // Getter: access as circle.radius (no parentheses needed)
  get radius() {
    return this.#radius;
  }

  // Setter: assign as circle.radius = 10
  set radius(value) {
    if (value <= 0) throw new Error("Radius must be positive");
    this.#radius = value;
  }

  // Computed getter: access as circle.area
  get area() {
    return Math.PI * this.#radius ** 2;
  }
}

const circle = new Circle(5);
console.log(circle.radius);              // => 5 (uses getter)
console.log(circle.area.toFixed(2));     // => "78.54"
circle.radius = 10;                      // uses setter
console.log(circle.radius);              // => 10

// ============================================
// SECTION 6: Inheritance with extends & super
// ============================================
// `extends` sets up the prototype chain: Child.prototype --> Parent.prototype
// `super()` calls the parent constructor (MUST be called before `this` in child)
// `super.method()` calls a parent method from a child override

console.log("\n--- SECTION 6: Inheritance ---");

class Shape {
  constructor(name) {
    this.name = name;
  }

  describe() {
    return `Shape: ${this.name}`;
  }
}

class Rectangle extends Shape {
  constructor(name, width, height) {
    super(name); // MUST call super() before using `this`
    this.width = width;
    this.height = height;
  }

  // Method override: replaces parent's describe()
  describe() {
    return `Rectangle: ${this.name}, ${this.width}x${this.height}`;
  }

  area() {
    return this.width * this.height;
  }
}

const rect = new Rectangle("Box", 10, 5);
console.log(rect.describe());          // => "Rectangle: Box, 10x5"
console.log(rect.area());              // => 50
console.log(rect instanceof Rectangle); // => true
console.log(rect instanceof Shape);     // => true

// --- BAD: Forgetting super() ---
// class BadChild extends Shape {
//   constructor(name) {
//     this.name = name; // ReferenceError: Must call super before accessing 'this'
//   }
// }

// --- GOOD: Always call super() first ---
class GoodChild extends Shape {
  constructor(name, extra) {
    super(name);        // parent constructor runs first
    this.extra = extra; // then you can use `this`
  }
}

// ============================================
// SECTION 7: Calling Parent Methods with super.method()
// ============================================

console.log("\n--- SECTION 7: super.method() ---");

class Animal {
  constructor(name) {
    this.name = name;
  }

  speak() {
    return `${this.name} makes a generic sound`;
  }
}

class Dog extends Animal {
  speak() {
    // Call parent's speak() and ADD to it
    const parentSpeech = super.speak();
    return `${parentSpeech}... then barks loudly!`;
  }
}

const dog = new Dog("Rex");
console.log(dog.speak());
// => "Rex makes a generic sound... then barks loudly!"

// ============================================
// PRACTICE Q9: ES6 Class with Private Field and Static Counter
// ============================================

console.log("\n--- PRACTICE Q9: Order Class ---");

class Order {
  static count = 0;
  #id;

  constructor() {
    this.#id = Order.count; // assign unique ID
    Order.count++;          // increment for next order
  }

  getId() {
    return this.#id;
  }

  static getCount() {
    return Order.count;
  }
}

const o1 = new Order();
const o2 = new Order();
console.log(o1.getId());       // => 0
console.log(o2.getId());       // => 1
console.log(Order.getCount()); // => 2

// ============================================
// PRACTICE Q10: Inheritance with extends and super
// ============================================

console.log("\n--- PRACTICE Q10: Shape/Circle ---");

class ShapeQ10 {
  constructor(name) {
    this.name = name;
  }

  describe() {
    return `Shape: ${this.name}`;
  }
}

class CircleQ10 extends ShapeQ10 {
  constructor(name, radius) {
    super(name);          // call parent constructor
    this.radius = radius;
  }

  describe() {
    // Override parent method
    return `Circle: ${this.name}, radius ${this.radius}`;
  }
}

const cq10 = new CircleQ10("Small", 5);
console.log(cq10.describe()); // => "Circle: Small, radius 5"

// ============================================
// PRACTICE Q11: Private Method and Public API
// ============================================

console.log("\n--- PRACTICE Q11: Validator ---");

class Validator {
  // Private method: cannot be called from outside
  #isEmpty(str) {
    return str === undefined || str === null || str.length === 0;
  }

  // Public API: uses private method internally
  validate(str) {
    if (this.#isEmpty(str)) return false;
    return true;
  }
}

const v = new Validator();
console.log(v.validate(""));      // => false
console.log(v.validate("hello")); // => true
// v.#isEmpty(""); // SyntaxError: Private field

// ============================================
// PRACTICE Q12: Class with Getter and Private Field
// ============================================

console.log("\n--- PRACTICE Q12: Temperature ---");

class Temperature {
  #celsius;

  constructor(celsius) {
    this.#celsius = celsius;
  }

  // Getter: accessed as t.celsius (no parens)
  get celsius() {
    return this.#celsius;
  }

  // Computed getter: converts to Fahrenheit
  get fahrenheit() {
    return (this.#celsius * 9) / 5 + 32;
  }
}

const t = new Temperature(25);
console.log(t.celsius);    // => 25
console.log(t.fahrenheit); // => 77

// ============================================
// PRACTICE P40: Class-Based Inheritance with Mixins
// ============================================
// Mixins let you compose reusable behaviors into classes.
// JS only supports single inheritance, but mixins work around this.

console.log("\n--- PRACTICE P40: Mixins ---");

// Base class
class Vehicle {
  constructor(name, speed) {
    this.name = name;
    this.speed = speed;
  }

  describe() {
    return `${this.name} going ${this.speed}km/h`;
  }
}

// Mixins are functions that take a superclass and return a subclass with extra methods
const canFly = (Base) =>
  class extends Base {
    fly() {
      return `${this.name} is flying at ${this.speed}km/h!`;
    }
  };

const canSail = (Base) =>
  class extends Base {
    sail() {
      return `${this.name} is sailing at ${this.speed}km/h!`;
    }
  };

// Plane: Vehicle + canFly
class Plane extends canFly(Vehicle) {
  constructor(name, speed) {
    super(name, speed);
  }
}

// Boat: Vehicle + canSail
class Boat extends canSail(Vehicle) {
  constructor(name, speed) {
    super(name, speed);
  }
}

// Seaplane: Vehicle + canFly + canSail (compose multiple mixins!)
class Seaplane extends canFly(canSail(Vehicle)) {
  constructor(name, speed) {
    super(name, speed);
  }
}

const plane = new Plane("Boeing", 900);
console.log(plane.fly());       // => "Boeing is flying at 900km/h!"
console.log(plane.describe());  // => "Boeing going 900km/h"

const boat = new Boat("Titanic", 40);
console.log(boat.sail());       // => "Titanic is sailing at 40km/h!"

const sp = new Seaplane("Amphibian", 300);
console.log(sp.fly());          // => "Amphibian is flying at 300km/h!"
console.log(sp.sail());         // => "Amphibian is sailing at 300km/h!"

// ============================================
// PRACTICE P41: Method Overriding & super Simulation (Without class)
// ============================================
// Using only constructor functions, simulate extends + super.

console.log("\n--- PRACTICE P41: Manual super ---");

function AnimalP41(name) {
  this.name = name;
}
AnimalP41.prototype.speak = function () {
  return `${this.name} makes a sound`;
};

function DogP41(name) {
  // Simulate super(): call parent constructor with `this`
  AnimalP41.call(this, name);
}
// Simulate extends: link prototypes
DogP41.prototype = Object.create(AnimalP41.prototype);
DogP41.prototype.constructor = DogP41;

// Override speak, but call parent's speak (simulate super.speak())
DogP41.prototype.speak = function () {
  // Manually call parent method
  const parentResult = AnimalP41.prototype.speak.call(this);
  return `${parentResult}... and then barks!`;
};

const dogP41 = new DogP41("Buddy");
console.log(dogP41.speak());
// => "Buddy makes a sound... and then barks!"
console.log(dogP41 instanceof DogP41);    // => true
console.log(dogP41 instanceof AnimalP41); // => true
