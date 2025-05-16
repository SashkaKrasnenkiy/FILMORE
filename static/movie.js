import { db, auth } from './firebaseConfig.js';
import {
  getDocs,
  collection,
  addDoc,
  query,
  orderBy,
  getDoc,
  doc
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-firestore.js';
import {
  onAuthStateChanged
} from 'https://www.gstatic.com/firebasejs/10.5.2/firebase-auth.js';

const videoContainer = document.getElementById('video-container');
const progress = document.getElementById('progress');
const volume = document.getElementById('volume');
const episodeList = document.getElementById('episode-list');
const video = document.getElementById('video');
const commentForm = document.getElementById('comment-form');
const commentsList = document.getElementById('comments-list');
const userNameDisplay = document.getElementById('userNameDisplay');

const leftSeriesBtn = document.getElementById('left-series');
const rightSeriesBtn = document.getElementById('right-series');
const cardsSeries = document.getElementById('cards-series');
const moviesRef = collection(db, 'movies');

const urlParams = new URLSearchParams(window.location.search);
let movieId = urlParams.get("id");
let episodeId = urlParams.get("episode") || 'default';

let currentUserName = 'Гость';
let currentUserId = null;

// Кнопки прокрутки серий
leftSeriesBtn.addEventListener('click', () => {
  cardsSeries.scrollBy({ left: -300, behavior: 'smooth' });
});
rightSeriesBtn.addEventListener('click', () => {
  cardsSeries.scrollBy({ left: 300, behavior: 'smooth' });
});

// Аутентификация
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUserId = user.uid;
    try {
      const docSnap = await getDoc(doc(db, "users", user.uid));
      if (docSnap.exists()) {
        currentUserName = docSnap.data().name || user.displayName || 'Пользователь';
      } else {
        currentUserName = user.displayName || 'Пользователь';
      }
    } catch (error) {
      console.error("Ошибка при получении имени пользователя:", error);
      currentUserName = user.displayName || 'Пользователь';
    }

    commentForm.style.display = 'block';
  } else {
    currentUserName = 'Гость';
    currentUserId = null;
    commentForm.style.display = 'none';
  }

  if (userNameDisplay) {
    userNameDisplay.textContent = `Имя: ${currentUserName}`;
  }

  loadComments(movieId, episodeId);
});

// Обработка формы комментария
commentForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const commentText = document.getElementById('commentText').value.trim();
  if (!commentText || currentUserName === 'Гость') return;

  await addComment(movieId, episodeId, currentUserId, currentUserName, commentText);
  commentForm.reset();
});

// Добавление комментария в Firestore
async function addComment(movieId, episodeId, userId, userName, text) {
  const commentsRef = collection(db, 'comments', `${movieId}_${episodeId}`, 'messages');
  try {
    await addDoc(commentsRef, {
      userId: userId || null,  // если неавторизован - null
      userName,
      text,
      date: new Date()
    });
    await loadComments(movieId, episodeId);
  } catch (error) {
    console.error("Ошибка при добавлении комментария:", error);
    alert('Не удалось добавить комментарий.');
  }
}

// Загрузка комментариев из Firestore с фото профиля
async function loadComments(movieId, episodeId) {
  const commentsRef = collection(db, 'comments', `${movieId}_${episodeId}`, 'messages');
  const q = query(commentsRef, orderBy('date', 'desc'));

  try {
    const snapshot = await getDocs(q);
    const commentsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    // Получаем фото профиля для каждого комментария
    const commentsWithPhoto = await Promise.all(commentsData.map(async (comment) => {
      if (!comment.userId) {
        // Если userId нет, показываем заглушку
        return { ...comment, photoURL: 'static/img/user.jpg' };
      }
      try {
        const userDoc = await getDoc(doc(db, 'users', comment.userId));
        const photoURL = userDoc.exists() ? userDoc.data().photoURL || 'static/img/user.jpg' : 'static/img/user.jpg';
        return { ...comment, photoURL };
      } catch {
        return { ...comment, photoURL: 'static/img/user.jpg' };
      }
    }));

    renderComments(commentsWithPhoto);
  } catch (error) {
    console.error("Ошибка загрузки комментариев:", error);
    commentsList.innerHTML = '<p>Ошибка при загрузке комментариев.</p>';
  }
}

// Отображение комментариев с фото профиля
function renderComments(comments) {
  commentsList.innerHTML = '';
  if (comments.length === 0) {
    commentsList.innerHTML = '<p>Комментариев пока нет.</p>';
    return;
  }

  comments.forEach(c => {
    const commentEl = document.createElement('div');
    commentEl.classList.add('comment');
    commentEl.innerHTML = `
      <div style="display:flex; align-items:center; gap:10px; margin-bottom:4px;">
        <img src="${c.photoURL}" alt="${c.userName}" style="width:40px; height:40px; border-radius:50%; object-fit:cover;">
        <p><strong>${c.userName}</strong> <em>${new Date(c.date?.toDate?.() || c.date).toLocaleString()}</em></p>
      </div>
      <p>${c.text}</p>
    `;
    commentsList.appendChild(commentEl);
  });
}

// ... остальной твой код без изменений ...

// Загрузка фильма и эпизодов
function updateVideo(movieId, episodeId) {
  getDocs(moviesRef)
    .then(snapshot => {
      const movies = snapshot.docs.map(doc => doc.data());
      const movie = movies.find(m => m.url.includes(movieId));
      const episodeWrapper = document.getElementById('episode-wrapper');

      if (movie) {
        if (episodeId && movie.episodes) {
          const episode = movie.episodes.find(e => e.url.includes(episodeId));
          if (episode) {
            video.src = episode.trailer;
            document.title = `${movie.name} - ${episode.title}`;
          }
        } else {
          video.src = movie.Film;
          document.title = movie.name;
        }

        if (movie.episodes?.length > 0) {
          episodeWrapper.style.display = 'block';
          createEpisodeCards(movie.episodes, movieId);
        } else {
          episodeWrapper.style.display = 'none';
        }

        if (Array.isArray(movie.actors)) {
          createActorCards(movie.actors);
        }

        loadComments(movieId, episodeId || 'default');
      } else {
        document.body.innerHTML = "<h1>Фильм не найден</h1>";
      }
    })
    .catch(error => {
      console.error("Ошибка загрузки фильма:", error);
      document.body.innerHTML = "<h1>Ошибка при загрузке фильма</h1>";
    });
}

// Перезагрузка при изменении URL
window.addEventListener('popstate', () => {
  const urlParams = new URLSearchParams(window.location.search);
  movieId = urlParams.get("id");
  episodeId = urlParams.get("episode") || 'default';
  updateVideo(movieId, episodeId);
});

updateVideo(movieId, episodeId);

// Создание карточек эпизодов
function createEpisodeCards(episodes, movieId) {
  if (!episodeList) return;
  episodeList.innerHTML = '';

  episodes.forEach(episode => {
    const episodeCard = document.createElement('a');
    episodeCard.classList.add('episode-card');
    episodeCard.href = `movie.html?id=${movieId}&episode=${episode.url.split('=')[1]}`;
    episodeCard.innerHTML = `
      <img src="${episode.thumbnail}" alt="${episode.title}">
      <div class="episode-info">
        <h2>${episode.title}</h2>
        <p>${episode.descriptionS}</p>
      </div>
    `;
    episodeList.appendChild(episodeCard);
  });
}

// Загрузка сериалов
const seriesContainer = document.getElementById('cards-series');
getDocs(moviesRef)
  .then(snapshot => {
    const series = snapshot.docs.map(doc => doc.data()).filter(item => item.type === 'series');
    series.forEach(seriesItem => {
      const seriesCard = document.createElement('a');
      seriesCard.classList.add('series-card');
      seriesCard.href = seriesItem.url;
      seriesCard.innerHTML = `
        <img src="${seriesItem.sposter}" alt="${seriesItem.name}" class="poster">
        <div class="series-info">
          <h4>${seriesItem.name}</h4>
          <div class="sub">
            <p>${seriesItem.genre}, ${seriesItem.date}</p>
            <h3><span>IMBD </span> <i class="bi bi-star-fill"></i> ${seriesItem.imdb}</h3>
          </div>
        </div>
      `;
      seriesContainer.appendChild(seriesCard);
    });
  })
  .catch(error => console.error("Ошибка при загрузке сериалов:", error));

// Карточки актёров
function createActorCards(actors) {
  const actorList = document.querySelector('.actors-list');
  if (!actorList || !Array.isArray(actors)) return;
  actorList.innerHTML = '';

  actors.forEach(actor => {
    const actorCard = document.createElement('div');
    actorCard.classList.add('actor-card');
    actorCard.innerHTML = `
      <div class="actor-image">
        <img src="${actor.image}" alt="${actor.name}" class="actor-img">
      </div>
      <div class="actor-info">
        <h5>${actor.name}</h5>
        <p>${actor.role}</p>
      </div>
    `;
    actorList.appendChild(actorCard);
  });
}
