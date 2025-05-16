import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";  
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js"; 
import { auth, db } from "./firebaseConfig.js";

window.onload = function () {
  onAuthStateChanged(auth, async (user) => {
    const exitButton = document.getElementById("Exit");
    const userNameElem = document.getElementById("userName");
    const userPhotoElem = document.getElementById("userPhotoImg");

    if (user) {
      try {
        const userDocRef = doc(db, "users", user.uid);
        const docSnapshot = await getDoc(userDocRef);

        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          const userName = userData.name || "Без имени";
          const userPhotoURL = userData.photoURL || "static/img/user.jpg";

          userNameElem.textContent = userName;
          userPhotoElem.src = userPhotoURL;
        } else {
          userNameElem.textContent = "Гость";
          userPhotoElem.src = "static/img/user.jpg";
        }
      } catch (error) {
        console.error("Ошибка при получении данных пользователя: ", error);
        userNameElem.textContent = "Гость";
        userPhotoElem.src = "static/img/user.jpg";
      }

      exitButton.textContent = "Выход";
      exitButton.onclick = handleExit;
    } else {
      userNameElem.textContent = "Гость";
      userPhotoElem.src = "static/img/user.jpg";

      exitButton.textContent = "Вход";
      exitButton.onclick = () => {
        window.location.href = "SING.html";
      };
    }
  });
};

function handleExit() {
  signOut(auth).then(() => {
    window.location.href = "index.html";
  }).catch((error) => {
    console.error("Ошибка выхода: ", error);
  });
}
