// import { openDB, deleteDB, wrap, unwrap } from "idb";
importScripts("/src/js/idb.js");
importScripts("/src/js/utility.js");

const CACHE_STATIC_NAME = "static-5";
const CACHE_DYNAMIC_NAME = "dynamic-v5";
const STATIC_FILES = [
  "/",
  "/index.html",
  "/offline.html",
  "/src/js/app.js",
  "/src/js/feed.js",
  "/src/js/idb.js",
  "/src/js/promise.js",
  "/src/js/fetch.js",
  "/src/js/material.min.js",
  "/src/css/app.css",
  "/src/css/feed.css",
  "https://jsonplaceholder.typicode.com/posts",
  "/src/images/main-image.jpg",
  "https://fonts.googleapis.com/css?family=Roboto:400,700",
  "https://fonts.googleapis.com/icon?family=Material+Icons",
  "https://cdnjs.cloudflare.com/ajax/libs/material-design-lite/1.3.0/material.indigo-pink.min.css",
];

self.addEventListener("install", (event) => {
  console.log("service work installed...", event);
  event.waitUntil(
    caches.open(CACHE_STATIC_NAME).then((cache) => {
      console.log("open cache");
      return cache.addAll(STATIC_FILES);
    })
  );
});

self.addEventListener("activate", (event) => {
  console.log("service worker activated...", event);
  event.waitUntil(
    caches.keys().then((keyList) => {
      return Promise.all(
        keyList.map((key) => {
          if (key !== CACHE_STATIC_NAME && key !== CACHE_DYNAMIC_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
});

// cache then fetch
// self.addEventListener("fetch", (event) => {
//   event.respondWith(
//     caches.match(event.request).then((response) => {
//       //cache hit - return response
//       if (response) {
//         return response;
//       }
//       return fetch(event.request)
//         .then((response) => {
//           // Check if we received a valid response
//           if (
//             !response ||
//             response.status !== 200 ||
//             response.type !== "basic"
//           ) {
//             return response; //null
//           }

//           // need to return 2 stream, one for cache, the other for the return
//           var responseToCache = response.clone();

//           caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
//             cache.put(event.request, responseToCache);
//           });

//           return response;
//         })
//         .catch((err) => {
//           return cache.match("/offLine.html");
//         });
//     })
//   );
// });

function trimCache(cacheName, maxItems) {
  caches.open(cacheName).then((cache) => {
    return cache.keys().then((keys) => {
      if (keys > maxItems) {
        cache.delete(cache[0]).then(trimCache(cacheName, maxItems));
      }
    });
  });
}

function isInArray(string, array) {
  var cachePath;
  if (string.indexOf(self.origin) === 0) {
    // request targets domain where we serve the page from (i.e. NOT a CDN)
    //console.log("matched ", string);
    cachePath = string.substring(self.origin.length); // take the part of the URL AFTER the domain (e.g. after localhost:8080)
  } else {
    cachePath = string; // store the full request (for CDNs)
  }
  return array.indexOf(cachePath) > -1;
}

// save to indexedDB
self.addEventListener("fetch", (event) => {
  let url = "https://jsonplaceholder.typicode.com/posts";

  if (event.request.url.indexOf(url) > -1) {
    event.respondWith(
      fetch(event.request).then((response) => {
        let cloneRes = response.clone();
        deleteAllData("posts").then(() => {
          cloneRes.json().then((data) => {
            console.log(data);
            for (let key in data) {
              writeData("posts", data[key]);
            }
          });
        });
        return response;
      })
    );
  } else if (isInArray(event.request.url, STATIC_FILES)) {
    event.respondWith(caches.match(event.request));
  } else {
    event.respondWith(
      caches.match(event.request).then((response) => {
        //cache hit - return response
        if (response) {
          return response;
        }
        return fetch(event.request)
          .then((response) => {
            // Check if we received a valid response
            if (
              !response ||
              response.status !== 200 ||
              response.type !== "basic"
            ) {
              return response; //null
            }

            // need to return 2 stream, one for cache, the other for the return
            var responseToCache = response.clone();

            caches.open(CACHE_DYNAMIC_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });

            return response;
          })
          .catch((err) => {
            return caches.open(CACHE_STATIC_NAME).then((cache) => {
              console.log("offline");
              if (
                event.request.headers.get("accept").indexOf("text/html") !== -1
              ) {
                return cache.match("/offline.html");
              }
            });
          });
      })
    );
  }
});
