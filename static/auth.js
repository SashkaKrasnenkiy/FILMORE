import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js";
import { getFirestore, doc, setDoc, getDoc } from "https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js";
import { auth, db } from "./firebaseConfig.js";  // Импорт конфигурации Firebase

document.addEventListener("DOMContentLoaded", () => {
  const registerBtn = document.querySelector("button[onclick='showRegisterForm()']");
  const loginBtn = document.querySelector("button[onclick='showLoginForm()']");

  registerBtn?.addEventListener("click", showRegisterForm);
  loginBtn?.addEventListener("click", showLoginForm);
});

// Показывает форму регистрации
export function showRegisterForm() {
  document.getElementById("loginForm").style.display = "none";
  document.getElementById("registerForm").style.display = "block";
}

// Показывает форму входа
export function showLoginForm() {
  document.getElementById("registerForm").style.display = "none";
  document.getElementById("loginForm").style.display = "block";
}

// Регистрация пользователя
window.register = function () {
  const name = document.getElementById("regName").value.trim();
  const email = document.getElementById("regEmail").value.trim();
  const password = document.getElementById("regPassword").value;

  if (!name || !email || !password) {
    alert("Пожалуйста, заполните все поля.");
    return;
  }

  createUserWithEmailAndPassword(auth, email, password)
    .then(({ user }) => {
      return setDoc(doc(db, "users", user.uid), {
        name,
        email,
      });
    })
    .then(() => {
      alert("Регистрация успешна!");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Ошибка: " + error.message);
    });
};

// Авторизация пользователя
window.login = function () {
  const email = document.getElementById("loginEmail").value.trim();
  const password = document.getElementById("loginPassword").value;

  if (!email || !password) {
    alert("Введите email и пароль.");
    return;
  }

  signInWithEmailAndPassword(auth, email, password)
    .then(({ user }) => {
      return getDoc(doc(db, "users", user.uid));
    })
    .then((docSnap) => {
      if (docSnap.exists()) {
        document.getElementById("loginForm").style.display = "none";
        document.getElementById("registerForm").style.display = "none";
        document.getElementById("logoutButton").style.display = "block";
        alert("Вход выполнен!");
        window.location.href = "index.html";
      } else {
        alert("Пользователь не найден в базе данных.");
      }
    })
    .catch((error) => {
      alert("Ошибка входа: " + error.message);
    });
};

// Выход из аккаунта
window.logout = function () {
  signOut(auth)
    .then(() => {
      document.getElementById("logoutButton").style.display = "none";
      document.getElementById("loginForm").style.display = "block";
      alert("Вы вышли из аккаунта.");
      window.location.href = "index.html";
    })
    .catch((error) => {
      alert("Ошибка выхода: " + error.message);
    });
};
