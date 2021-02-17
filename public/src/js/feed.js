var shareImageButton = document.querySelector("#share-image-button");
var createPostArea = document.querySelector("#create-post");
var closeCreatePostModalButton = document.querySelector(
  "#close-create-post-modal-btn"
);
var sharedMomentsArea = document.querySelector("#shared-moments");
const form = document.querySelector("form");
const titleInput = document.querySelector("#title");
const locationInput = document.querySelector("#location");

function openCreatePostModal() {
  createPostArea.style.display = "block";
  if (deferredPrompt) {
    deferredPrompt.prompt();

    deferredPrompt.userChoice.then(function (choiceResult) {
      //console.log(choiceResult.outcome);

      if (choiceResult.outcome === "dismissed") {
        console.log("User cancelled installation");
      } else {
        console.log("User added to home screen");
      }
    });

    deferredPrompt = null;
  }
}

function closeCreatePostModal() {
  createPostArea.style.display = "none";
}

shareImageButton.addEventListener("click", openCreatePostModal);

closeCreatePostModalButton.addEventListener("click", closeCreatePostModal);

function clearCard() {
  if (sharedMomentsArea.hasChildNodes) {
    sharedMomentsArea.removeChild(sharedMomentsArea.lastChild);
  }
}

function createCard() {
  var cardWrapper = document.createElement("div");
  cardWrapper.className = "shared-moment-card mdl-card mdl-shadow--2dp";
  var cardTitle = document.createElement("div");
  cardTitle.className = "mdl-card__title";
  cardTitle.style.backgroundImage = 'url("/src/images/sf-boat.jpg")';
  cardTitle.style.backgroundSize = "cover";
  cardTitle.style.height = "180px";
  cardWrapper.appendChild(cardTitle);
  var cardTitleTextElement = document.createElement("h2");
  cardTitleTextElement.className = "mdl-card__title-text";
  cardTitleTextElement.textContent = "San Francisco Trip";
  cardTitle.appendChild(cardTitleTextElement);
  var cardSupportingText = document.createElement("div");
  cardSupportingText.className = "mdl-card__supporting-text";
  cardSupportingText.textContent = "In San Francisco";
  cardSupportingText.style.textAlign = "center";
  cardWrapper.appendChild(cardSupportingText);
  componentHandler.upgradeElement(cardWrapper);
  sharedMomentsArea.appendChild(cardWrapper);
}

let url = "https://jsonplaceholder.typicode.com/posts";
let networkDataReceived = false;

// if (caches in window) {
//   caches
//     .match(url)
//     .then((response) => {
//       if (response) {
//         return response.json();
//       }
//     })
//     .then((data) => {
//       console.log("From cache ", data);
//       if (!networkDataReceived) {
//         //clearCard();
//         //createCard();
//       }
//     });
// }

fetch(url)
  .then(function (res) {
    return res.json();
  })
  .then(function (data) {
    networkDataReceived = true;
    console.log("From web ", data);
    //createCard();
  });

if (window.indexedDB) {
  readAllData("posts").then((data) => {
    console.log(networkDataReceived);
    if (!networkDataReceived) {
      console.log("read from idb: ", data);
    }
  });
}

form.addEventListener("click", (event) => {
  event.preventDefault();

  if (titleInput.value.trim() === "" || locationInput.value.trim() === "") {
    alert("please enter valid data!");
    return;
  }

  closeCreatePostModal();

  if ("serviceWorker" in navigator && "SyncManager" in window) {
    navigator.serviceWorker.ready.then((sw) => {
      const post = {
        id: new Date().toISOString(),
        title: titleInput.value,
        location: locationInput.value,
      };

      writeData("sync-posts", post)
        .then(() => {
          return sw.sync.register("sync-new-posts");
        })
        .then(() => {
          const snackbarContainer = document.querySelector(
            "#confirmation-toast"
          );
          const data = { message: "Your Post was saved for syncing" };
          snackbarContainer.MaterialSnackbar.showSnackbar(data);
        })
        .catch((err) => {
          console.log(err);
        });
    });
  }
});
