import { auth, db } from './firebaseConfig.js';
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  onAuthStateChanged,
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';
import {
  doc,
  getDoc,
  setDoc,
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';

const imgbbApiKey = "88bb12dd761bc7cc33cc85c81f4e6e54";

async function uploadToImgBB(file) {
  const formData = new FormData();
  formData.append("image", file);

  const res = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
    method: "POST",
    body: formData,
  });

  if (!res.ok) throw new Error("Ошибка при загрузке изображения на ImgBB");

  const data = await res.json();
  return data.data.url;
}

onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "/login.html";
    return;
  }

  const profileForm = document.getElementById('profileForm');
  const nameInput = document.getElementById('name');
  const passwordInput = document.getElementById('password');
  const currentPasswordInput = document.getElementById('currentPassword');
  const profilePicInput = document.getElementById('profilePic');
  const userEmailElem = document.getElementById('userEmail');
  const userNameElem = document.getElementById('userName');
  const userProfilePicElem = document.getElementById('userProfilePic');

  // Показываем email из Firebase Auth
  userEmailElem.textContent = user.email;

  // Загружаем имя и фото из Firestore
  try {
    const docRef = doc(db, 'users', user.uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      userNameElem.textContent = data.name || "Без имени";
      userProfilePicElem.src = data.photoURL || 'static/img/user.jpg';
      nameInput.value = data.name || "";
    } else {
      userNameElem.textContent = "Без имени";
      userProfilePicElem.src = 'static/img/user.jpg';
      nameInput.value = "";
    }
  } catch (error) {
    console.error("Ошибка при загрузке данных из Firestore:", error);
    userNameElem.textContent = "Без имени";
    userProfilePicElem.src = 'static/img/user.jpg';
    nameInput.value = "";
  }

  if (profileForm) {
    profileForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const name = nameInput.value.trim();
      const password = passwordInput.value.trim();
      const currentPassword = currentPasswordInput.value.trim();
      const profilePic = profilePicInput.files[0];
      let updated = false;
      let photoURL = userProfilePicElem.src; // начальный URL с картинки

      try {
        // Обновляем имя в Firestore и локально
        if (name && name !== userNameElem.textContent && name !== "") {
          await setDoc(doc(db, "users", user.uid), { name: name }, { merge: true });
          userNameElem.textContent = name;
          updated = true;
        }

        // Обновляем пароль
        if (password && currentPassword) {
          if (password.length < 6) {
            throw new Error('Новый пароль должен содержать не менее 6 символов.');
          }
          const credential = EmailAuthProvider.credential(user.email, currentPassword);
          await reauthenticateWithCredential(user, credential);
          await updatePassword(user, password);
          updated = true;
        } else if (password && !currentPassword) {
          throw new Error('Введите текущий пароль для изменения пароля.');
        }

        // Обновляем фото профиля
        if (profilePic) {
          const validImageTypes = ['image/jpeg', 'image/png'];
          const maxSizeInBytes = 5 * 1024 * 1024;

          if (!validImageTypes.includes(profilePic.type)) {
            throw new Error('Только изображения JPEG или PNG.');
          }
          if (profilePic.size > maxSizeInBytes) {
            throw new Error('Размер изображения превышает 5 МБ.');
          }

          photoURL = await uploadToImgBB(profilePic);
          await setDoc(doc(db, "users", user.uid), { photoURL: photoURL }, { merge: true });
          userProfilePicElem.src = photoURL;
          updated = true;
        }

        if (updated) {
          alert('Профиль успешно обновлён!');
          profileForm.reset();
        } else {
          alert('Изменений не обнаружено.');
        }
      } catch (error) {
        console.error("Ошибка при обновлении профиля:", error);
        alert(`Ошибка при обновлении профиля: ${error.message}`);
      }
    });
  }
});
