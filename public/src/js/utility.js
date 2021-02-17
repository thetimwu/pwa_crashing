var dbPromise = idb.open("posts-store", 1, (db) => {
  console.log("making a posts object store");
  if (!db.objectStoreNames.contains("posts")) {
    db.createObjectStore("posts", { keyPath: "id" });
  }
  if (!db.objectStoreNames.contains("sync-posts")) {
    db.createObjectStore("sync-posts", { keyPath: "id" });
  }
});

function writeData(st, data) {
  return dbPromise
    .then((db) => {
      let tx = db.transaction(st, "readwrite");
      let store = tx.objectStore(st);
      store.add(data);
      return tx.complete;
    })
    .then(() => {
      console.log("added item to the posts store");
    });
}

function readAllData(st) {
  return dbPromise.then((db) => {
    let tx = db.transaction(st, "readonly");
    let store = tx.objectStore(st);
    return store.getAll();
  });
}

function deleteAllData(st) {
  return dbPromise.then((db) => {
    let tx = db.transaction(st, "readwrite");
    let store = tx.objectStore(st);
    return store.clear();
  });
}

function deleteItemFromData(st, id) {
  return dbPromise
    .then((db) => {
      let tx = db.transaction(st, "readwrite");
      let store = tx.objectStore(st);
      store.delete(id);
      return tx.complete;
    })
    .then(() => {
      console.log("item deleted");
    });
}
