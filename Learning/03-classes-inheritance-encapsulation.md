# 03 - ES6 Classes, Inheritance & Encapsulation

## Core Concept
> ES6 classes are syntactic sugar over constructor functions + prototypes. Under the hood, they still use the prototype chain.

---

## Section 1: Basic Class Syntax

### Before (Constructor function)
```js
function User(name, email) {
  this.name = name;
  this.email = email;
}
User.prototype.greet = function () {
  return `Hi, I'm ${this.name} (${this.email})`;
};

const u = new User("Alice", "alice@test.com");
```

### After (ES6 class)
```js
class User {
  constructor(name, email) {
    this.name = name;
    this.email = email;
  }

  greet() {
    return `Hi, I'm ${this.name} (${this.email})`;
  }
}

const u = new User("Alice", "alice@test.com");
console.log(u.greet()); // => "Hi, I'm Alice (alice@test.com)"

// Still prototype-based under the hood:
console.log(typeof User);                        // => "function"
console.log(u.__proto__ === User.prototype);      // => true
console.log(u.greet === User.prototype.greet);    // => true
```

---

## Section 2: Static Properties & Methods

### Before (No static - accessing count on instances)
```js
let productCount = 0; // global variable, not encapsulated

function Product(name) {
  this.name = name;
  productCount++;
}
// Count lives outside the constructor - messy
```

### After (Static members on the class)
```js
class Product {
  static count = 0;

  constructor(name) {
    this.name = name;
    Product.count++;
  }

  static getCount() {
    return Product.count;
  }

  describe() {
    return `Product: ${this.name}`;
  }
}

const p1 = new Product("Laptop");
const p2 = new Product("Phone");
console.log(Product.getCount()); // => 2
console.log(p1.describe());      // => "Product: Laptop"
// p1.getCount(); // TypeError - static is on the class, not instances
```

---

## Section 3: Private Fields (#)

### Before (No true privacy - underscore convention)
```js
class BankAccount {
  constructor(balance) {
    this._balance = balance; // convention only, not enforced
  }
  getBalance() { return this._balance; }
}

const acc = new BankAccount(1000);
console.log(acc._balance); // => 1000 -- anyone can access it!
acc._balance = -9999;      // anyone can modify it!
```

### After (True private with #)
```js
class BankAccount {
  #balance;

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
// acc.#balance; // SyntaxError: Private field '#balance'
```

---

## Section 4: Private Methods (#)

### Before (All methods publicly accessible)
```js
class PasswordValidator {
  meetsLength(str) { return str.length >= 8; }   // exposed!
  hasNumber(str) { return /\d/.test(str); }       // exposed!

  validate(password) {
    if (!this.meetsLength(password)) return "Too short";
    if (!this.hasNumber(password)) return "Must contain a number";
    return "Valid";
  }
}
const pv = new PasswordValidator();
pv.meetsLength("hi"); // anyone can call internal logic
```

### After (Private methods hidden)
```js
class PasswordValidator {
  #meetsLength(str) { return str.length >= 8; }
  #hasNumber(str) { return /\d/.test(str); }

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
// pv.#meetsLength("hi"); // SyntaxError
```

---

## Section 5: Getters & Setters

### Before (Manual get/set methods)
```js
class Circle {
  constructor(radius) { this._radius = radius; }
  getRadius() { return this._radius; }
  setRadius(value) {
    if (value <= 0) throw new Error("Must be positive");
    this._radius = value;
  }
  getArea() { return Math.PI * this._radius ** 2; }
}

const c = new Circle(5);
console.log(c.getRadius()); // => 5
c.setRadius(10);
console.log(c.getArea());   // => 314.15...
```

### After (get/set keywords - cleaner syntax)
```js
class Circle {
  #radius;

  constructor(radius) { this.#radius = radius; }

  get radius() { return this.#radius; }

  set radius(value) {
    if (value <= 0) throw new Error("Radius must be positive");
    this.#radius = value;
  }

  get area() { return Math.PI * this.#radius ** 2; }
}

const circle = new Circle(5);
console.log(circle.radius);          // => 5 (uses getter, no parens!)
console.log(circle.area.toFixed(2)); // => "78.54"
circle.radius = 10;                  // uses setter
console.log(circle.radius);          // => 10
```

---

## Section 6: Inheritance with extends & super

### Before (No inheritance)
```js
class Shape {
  constructor(name) { this.name = name; }
  describe() { return `Shape: ${this.name}`; }
}

// Rectangle has no connection to Shape
class Rectangle {
  constructor(name, width, height) {
    this.name = name;
    this.width = width;
    this.height = height;
  }
  // Must redefine describe() from scratch
}
```

### After (extends + super)
```js
class Shape {
  constructor(name) { this.name = name; }
  describe() { return `Shape: ${this.name}`; }
}

class Rectangle extends Shape {
  constructor(name, width, height) {
    super(name); // MUST call super() before using `this`
    this.width = width;
    this.height = height;
  }

  describe() {
    return `Rectangle: ${this.name}, ${this.width}x${this.height}`;
  }

  area() { return this.width * this.height; }
}

const rect = new Rectangle("Box", 10, 5);
console.log(rect.describe());           // => "Rectangle: Box, 10x5"
console.log(rect.area());               // => 50
console.log(rect instanceof Rectangle); // => true
console.log(rect instanceof Shape);     // => true
```

---

## Section 7: Calling Parent Methods with super.method()

### Before (Override completely replaces parent)
```js
class Animal {
  speak() { return `${this.name} makes a generic sound`; }
}

class Dog extends Animal {
  speak() {
    return `${this.name} barks loudly!`; // parent logic is lost
  }
}
```

### After (super.method() extends parent behavior)
```js
class Animal {
  constructor(name) { this.name = name; }
  speak() { return `${this.name} makes a generic sound`; }
}

class Dog extends Animal {
  speak() {
    const parentSpeech = super.speak(); // call parent's version
    return `${parentSpeech}... then barks loudly!`;
  }
}

const dog = new Dog("Rex");
console.log(dog.speak());
// => "Rex makes a generic sound... then barks loudly!"
```

---

## Practice Q9: Private Field + Static Counter

### Before (No encapsulation)
```js
let orderCount = 0;
function createOrder() {
  return { id: orderCount++ };
}
// count is global, id is publicly mutable
```

### After (Class with private field + static)
```js
class Order {
  static count = 0;
  #id;

  constructor() {
    this.#id = Order.count;
    Order.count++;
  }

  getId() { return this.#id; }
  static getCount() { return Order.count; }
}

const o1 = new Order();
const o2 = new Order();
console.log(o1.getId());       // => 0
console.log(o2.getId());       // => 1
console.log(Order.getCount()); // => 2
```

---

## Practice Q10: Inheritance with extends and super

### Before (Separate unrelated classes)
```js
class Shape {
  constructor(name) { this.name = name; }
  describe() { return `Shape: ${this.name}`; }
}
// Circle doesn't extend Shape
```

### After (Proper inheritance)
```js
class Shape {
  constructor(name) { this.name = name; }
  describe() { return `Shape: ${this.name}`; }
}

class Circle extends Shape {
  constructor(name, radius) {
    super(name);
    this.radius = radius;
  }
  describe() {
    return `Circle: ${this.name}, radius ${this.radius}`;
  }
}

const c = new Circle("Small", 5);
console.log(c.describe()); // => "Circle: Small, radius 5"
```

---

## Practice Q11: Private Method + Public API

### Before (Internal logic exposed)
```js
class Validator {
  isEmpty(str) { return !str || str.length === 0; } // anyone can call
  validate(str) { return !this.isEmpty(str); }
}
```

### After (Private internal method)
```js
class Validator {
  #isEmpty(str) {
    return str === undefined || str === null || str.length === 0;
  }
  validate(str) {
    if (this.#isEmpty(str)) return false;
    return true;
  }
}

const v = new Validator();
console.log(v.validate(""));      // => false
console.log(v.validate("hello")); // => true
// v.#isEmpty(""); // SyntaxError: Private field
```

---

## Practice Q12: Getter with Private Field

### Before (Direct property access)
```js
class Temperature {
  constructor(celsius) { this.celsius = celsius; }
  toFahrenheit() { return (this.celsius * 9) / 5 + 32; }
}
const t = new Temperature(25);
t.celsius = -999; // no validation!
```

### After (Private field + getter)
```js
class Temperature {
  #celsius;

  constructor(celsius) { this.#celsius = celsius; }

  get celsius() { return this.#celsius; }
  get fahrenheit() { return (this.#celsius * 9) / 5 + 32; }
}

const t = new Temperature(25);
console.log(t.celsius);    // => 25
console.log(t.fahrenheit); // => 77
```

---

## Practice P40: Mixins (Composition)

### Before (Single inheritance limitation)
```js
class Vehicle { /* ... */ }
class FlyingVehicle extends Vehicle { fly() {} }
class SailingVehicle extends Vehicle { sail() {} }
// Can't have a vehicle that both flies AND sails!
```

### After (Mixins compose behaviors)
```js
class Vehicle {
  constructor(name, speed) { this.name = name; this.speed = speed; }
  describe() { return `${this.name} going ${this.speed}km/h`; }
}

const canFly = (Base) => class extends Base {
  fly() { return `${this.name} is flying at ${this.speed}km/h!`; }
};

const canSail = (Base) => class extends Base {
  sail() { return `${this.name} is sailing at ${this.speed}km/h!`; }
};

// Compose multiple mixins!
class Seaplane extends canFly(canSail(Vehicle)) {
  constructor(name, speed) { super(name, speed); }
}

const sp = new Seaplane("Amphibian", 300);
console.log(sp.fly());     // => "Amphibian is flying at 300km/h!"
console.log(sp.sail());    // => "Amphibian is sailing at 300km/h!"
console.log(sp.describe()); // => "Amphibian going 300km/h"
```

---

## Practice P41: Manual super Simulation (Without class)

### Before (No inheritance between constructors)
```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return `${this.name} makes a sound`; };

function Dog(name) { this.name = name; }
Dog.prototype.speak = function () { return `${this.name} barks!`; };
// No connection to Animal, can't call parent speak()
```

### After (Manual extends + super)
```js
function Animal(name) { this.name = name; }
Animal.prototype.speak = function () { return `${this.name} makes a sound`; };

function Dog(name) {
  Animal.call(this, name); // simulate super()
}
Dog.prototype = Object.create(Animal.prototype); // simulate extends
Dog.prototype.constructor = Dog;

Dog.prototype.speak = function () {
  const parentResult = Animal.prototype.speak.call(this); // simulate super.speak()
  return `${parentResult}... and then barks!`;
};

const dog = new Dog("Buddy");
console.log(dog.speak());           // => "Buddy makes a sound... and then barks!"
console.log(dog instanceof Dog);    // => true
console.log(dog instanceof Animal); // => true
```
