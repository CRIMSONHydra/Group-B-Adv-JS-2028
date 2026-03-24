// Promise

// all , allSettled , race , any

function fetchUserData() {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ userId: 1, username: "JohnDoe" }), 2000);
  });
}

function fetchUserPosts() {
  return new Promise((resolve) => {
    setTimeout(() => resolve(["Post 1", "Post 2", "Post 3"]), 1000);
  });
}

function fetchUserComments() {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      let success = Math.random() > 1; // 50% chance of failure
      if (success) {
        resolve(["Nice!", "Interesting post", "Subscribed!"]);
      } else {
        reject("Failed to fetch comments ❌");
      }
    }, 800);
  });
}

// fetchUserData().then(function(data){
//     console.log(data)
// })


// fetchUserComments().then(function(data){
//     console.log(data)
// })

// fetchUserPosts().then(function(data){
//     console.log(data)
// })

// fetchUserData().then((data) => {
//   console.log(data);
//   return fetchUserPosts()
// }).then((data)=>{
//     console.log(data)
//     return fetchUserComments()
// }).then((data)=>{
//     console.log(data)
// })

// all  , allSettled

// Promise.all([fetchUserData(), fetchUserPosts(), fetchUserComments()])
//   .then(function(results){
//     console.log(results)
//   })
//   .catch((err)=>{
//     console.log(err)
//   });

Promise.allSettled([fetchUserData(), fetchUserPosts(), fetchUserComments()])
  .then(function(results){
    console.log(results)
    console.log(results[1].value)
    
  })
  .catch((err)=>{
    console.log(err)
  });



