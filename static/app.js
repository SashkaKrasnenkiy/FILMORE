// Получение DOM-элементов
const elements = {
  leftBtn: document.getElementById('left'),
  rightBtn: document.getElementById('right'),
  cards: document.getElementById('cards'),
  search: document.getElementById('search'),
  searchInput: document.getElementById('search_input'),
  buttons: {
    series: document.getElementById('Series'),
    movies: document.getElementById('Movies'),
    kids: document.getElementById('Kids'),
    anime: document.getElementById('Anime'),
    all: document.getElementById('HOME')
  },
  profileImg: document.getElementById('userPhoto'),
  profileMenu: document.querySelector('.proifil')
};

// Константы
const JSON_URL = "static/movie.json";
const SCROLL_OFFSET = 354;

// Глобальные данные
let allData = [];

// Создание карточки
const createCard = ({ name, imdb, genre, date, sposter, bposter, url }, isSearch = false) => {
  const card = document.createElement('a');
  card.classList.add("card");
  card.href = url;
  card.innerHTML = isSearch ? `
    <img src="${sposter}" alt="${name}">
    <div class="cont">
      <h3>${name}</h3>
      <p>${genre}, ${date} <span>IMDB</span> <i class="bi bi-star-fill"></i> ${imdb}</p>
    </div>
  ` : `
    <img src="${sposter}" alt="${name}" class="poster">
    <div class="rest_card">
      <img src="${bposter}" alt="">
      <div class="cont">
        <h4>${name}</h4>
        <div class="sub">
          <p>${genre}, ${date}</p>
          <h3><span>IMDB</span> <i class="bi bi-star-fill"></i> ${imdb}</h3>
        </div>
      </div>
    </div>
  `;
  return card;
};

// Рендеринг карточек
const renderCards = (data, container = elements.cards) => {
  container.innerHTML = '';
  data.forEach(item => container.appendChild(createCard(item)));
};

// Обновление главного контента
const updateMainContent = ({ mainIMGMB, mainIMGDESCK, url, name, description, genre, date, imdb, product }) => {
  document.getElementById('ImgMB').src = mainIMGMB;
  document.getElementById('ImgDesck').src = mainIMGDESCK;
  document.getElementById('play').href = url;
  document.getElementById('title').innerText = name;
  document.getElementById('description').innerText = description;
  document.getElementById('gen').innerText = genre;
  document.getElementById('date').innerText = date;
  document.getElementById('rate').innerHTML = `<span>IMDB</span> <i class="bi bi-star-fill"></i>${imdb}`;
  document.getElementById('product').innerText = product;
};


// Инициализация поиска
const initSearch = () => {
  elements.search.innerHTML = '';
  allData.forEach(item => elements.search.appendChild(createCard(item, true)));
};

// Фильтрация поиска
const filterSearch = () => {
  const filter = elements.searchInput.value.toUpperCase();
  const cards = elements.search.getElementsByTagName('a');
  let hasVisibleCards = false;

  Array.from(cards).forEach(card => {
    const text = card.querySelector('.cont').textContent.toUpperCase();
    const isVisible = text.includes(filter);
    card.style.display = isVisible ? 'flex' : 'none';
    if (isVisible) hasVisibleCards = true;
  });

  elements.search.style.visibility = filter && hasVisibleCards ? 'visible' : 'hidden';
  elements.search.style.opacity = filter && hasVisibleCards ? 1 : 0;
};

// Обработчики событий
const setupEventListeners = () => {
  // Прокрутка
  elements.leftBtn.addEventListener('click', () => elements.cards.scrollLeft -= SCROLL_OFFSET);
  elements.rightBtn.addEventListener('click', () => elements.cards.scrollLeft += SCROLL_OFFSET);

  // Поиск
  elements.searchInput.addEventListener('keyup', filterSearch);

  // Фильтры контента
  const filters = {
    series: () => allData.filter(item => item.type === 'series'),
    movies: () => allData.filter(item => item.type === 'movie'),
    kids: () => allData.filter(item => item.kidsM === 'Kids'),
    anime: () => allData.filter(item => item.genre === 'Anime'),
    all: () => allData
  };

  Object.entries(elements.buttons).forEach(([key, btn]) => {
    if (btn) {
      btn.addEventListener('click', () => {
        const filteredData = filters[key]();
        renderCards(filteredData);
        if (filteredData.length > 0) updateMainContent(filteredData[0]);
      });
    }
  });

  // Профиль
  elements.profileImg.addEventListener('click', e => {
    e.preventDefault();
    elements.profileMenu.style.display = elements.profileMenu.style.display === 'block' ? 'none' : 'block';
  });

  document.addEventListener('click', e => {
    if (!elements.profileMenu.contains(e.target) && !elements.profileImg.contains(e.target)) {
      elements.profileMenu.style.display = 'none';
    }
  });
};

// Загрузка данных
fetch(JSON_URL)
  .then(response => response.json())
  .then(data => {
    allData = data;
    renderCards(allData);
    if (allData.length > 0) updateMainContent(allData[0]);
    initSearch();
    setupEventListeners();
  })
  .catch(error => console.error('Ошибка при загрузке данных:', error));