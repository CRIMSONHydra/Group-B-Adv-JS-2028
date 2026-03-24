// race , any

function fetchFromOpenWeather() {
  return new Promise((resolve, reject) =>
    setTimeout(() => resolve("25 C in Bangalore"), 1000)
  );
}

function fetchFromWeatherAPI() {
  return new Promise((resolve, reject) =>
    setTimeout(() => reject("No Data"), 700)
  );
}

function fetchFromAccuWeather() {
  return new Promise((resolve, reject) =>
    setTimeout(() => resolve("24 C in Bengaluru"), 1200)
  );
}

// Promise.race([
//   fetchFromAccuWeather(),
//   fetchFromOpenWeather(),
//   fetchFromWeatherAPI(),
// ]).then((result)=>{
//     console.log(result)
// }).catch((err)=>{
//     console.log(err)
// });


Promise.any([
    fetchFromAccuWeather(),
    fetchFromOpenWeather(),
    fetchFromWeatherAPI(),
  ]).then((result)=>{
      console.log(result)
  }).catch((err)=>{
      console.log(err)
  });


  // Write all the polyfills for all Combinators
  // COnstruct your Own Promise
