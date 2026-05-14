// ==========================================================
//  app.js — Frontend JavaScript for Open Digital Library
// ==========================================================

let allBooks = [];
let favoriteIds = loadFavorites();

const recommendedGrid = document.getElementById('recommended-grid');
const allBooksGrid = document.getElementById('all-books-grid');
const searchInput = document.getElementById('search-input');
const btnSearch = document.getElementById('btn-search');
const categorySelect = document.getElementById('category-select');
const addBookForm = document.getElementById('add-book-form');
const btnSubmit = document.getElementById('btn-submit');
const toast = document.getElementById('toast');

// Navigation links
const navDiscover = document.getElementById('nav-discover');
const navCategory = document.getElementById('nav-category');
const navLibrary = document.getElementById('nav-library');
const navDownload = document.getElementById('nav-download');
const navFavorite = document.getElementById('nav-favorite');

let activeCategory = 'all';

function loadFavorites() {
  try {
    return new Set(JSON.parse(localStorage.getItem('libraryFavorites') || '[]'));
  } catch (err) {
    return new Set();
  }
}

function saveFavorites() {
  localStorage.setItem('libraryFavorites', JSON.stringify([...favoriteIds]));
}

async function fetchBooks() {
  try {
    const response = await fetch('/api/books');
    if (!response.ok) throw new Error('Server error');
    allBooks = await response.json();
    
    buildCategoryDropdown();
    renderRecommended();
    applyFilters();
  } catch (err) {
    console.error('Failed to load books:', err);
    if (recommendedGrid) recommendedGrid.innerHTML = '<p class="no-results">⚠️ Could not load books.</p>';
  }
}

function generateBookCardHTML(book) {
  const isFav = favoriteIds.has(String(book.id));
  
  let coverHtml = '';
  if (book.cover_image_url) {
    coverHtml = `<img class="book-cover" src="${escapeHtml(book.cover_image_url)}" alt="${escapeHtml(book.title)}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
                 <div class="book-info-fallback" style="display:none;">
                   <div class="book-title-fb">${escapeHtml(book.title)}</div>
                   <div class="book-author-fb">${escapeHtml(book.author)}</div>
                 </div>`;
  } else {
    coverHtml = `<div class="book-info-fallback">
                   <div class="book-title-fb">${escapeHtml(book.title)}</div>
                   <div class="book-author-fb">${escapeHtml(book.author)}</div>
                 </div>`;
  }

  return `
  <div class="book-card">
    ${coverHtml}
    <div class="book-hover-actions">
      <button class="btn-action-hover primary btn-read" data-book-id="${escapeHtml(book.id)}" ${book.can_read ? '' : 'disabled'}>
        ${book.can_read ? 'Read Book' : 'File Missing'}
      </button>
      <button class="btn-action-hover btn-favorite ${isFav ? 'active' : ''}" data-book-id="${escapeHtml(book.id)}">
        ${isFav ? 'Remove Fav' : 'Favorite'}
      </button>
    </div>
  </div>
  `;
}

function renderRecommended() {
  const recommended = allBooks.slice(0, 5); // Show 5 books in landing section
  if (recommendedGrid) {
    recommendedGrid.innerHTML = recommended.map(generateBookCardHTML).join('');
  }
}

function renderAllBooks(books) {
  if (books.length === 0) {
    allBooksGrid.innerHTML = '<p class="no-results">No books found matching your search.</p>';
    return;
  }
  allBooksGrid.innerHTML = books.map(generateBookCardHTML).join('');
}

document.addEventListener('click', async (event) => {
  const readButton = event.target.closest('.btn-read');
  const favButton = event.target.closest('.btn-favorite');

  if (readButton && !readButton.disabled) {
    readButton.disabled = true;
    const originalText = readButton.textContent;
    readButton.textContent = 'Opening...';
    try {
      const response = await fetch(`/api/books/${encodeURIComponent(readButton.dataset.bookId)}/read`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to open book.');
      window.open(data.url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      showToast(err.message || 'Unable to open book.', 'error');
    } finally {
      readButton.disabled = false;
      readButton.textContent = originalText;
    }
  }

  if (favButton) {
    const bookId = String(favButton.dataset.bookId);
    if (favoriteIds.has(bookId)) {
      favoriteIds.delete(bookId);
      showToast('Removed from favourites.', 'success');
    } else {
      favoriteIds.add(bookId);
      showToast('Added to favourites.', 'success');
    }
    saveFavorites();
    renderRecommended(); // re-render to update heart buttons
    applyFilters();
  }
});

function buildCategoryDropdown() {
  const categories = [...new Set(allBooks.map(b => b.category))];
  categorySelect.innerHTML = `
    <option value="all">All Categories</option>
    <option value="favorites">Favourites</option>
    ${categories.map(cat => `<option value="${escapeHtml(cat)}">${escapeHtml(cat)}</option>`).join('')}
  `;
}

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();
  let filtered = allBooks;

  if (activeCategory === 'favorites') {
    filtered = filtered.filter(b => favoriteIds.has(String(b.id)));
  } else if (activeCategory !== 'all') {
    filtered = filtered.filter(b => b.category === activeCategory);
  }

  if (query) {
    filtered = filtered.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query)
    );
  }

  renderAllBooks(filtered);
}

// Side Nav Functional Logic
function setActiveNav(element) {
  document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
  if (element) element.classList.add('active');
}

navDiscover?.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navDiscover);
  activeCategory = 'all';
  categorySelect.value = 'all';
  searchInput.value = '';
  applyFilters();
  window.scrollTo({ top: 0, behavior: 'smooth' });
});

navCategory?.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navCategory);
  document.getElementById('all-books-section').scrollIntoView({ behavior: 'smooth' });
  categorySelect.focus();
});

navLibrary?.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navLibrary);
  activeCategory = 'favorites';
  categorySelect.value = 'favorites';
  applyFilters();
  document.getElementById('all-books-section').scrollIntoView({ behavior: 'smooth' });
});

navFavorite?.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navFavorite);
  activeCategory = 'favorites';
  categorySelect.value = 'favorites';
  applyFilters();
  document.getElementById('all-books-section').scrollIntoView({ behavior: 'smooth' });
});

navDownload?.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navDownload);
  activeCategory = 'all';
  categorySelect.value = 'all';
  applyFilters();
  document.getElementById('all-books-section').scrollIntoView({ behavior: 'smooth' });
});

const navAbout = document.getElementById('nav-about');
navAbout?.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navAbout);
  document.getElementById('about-section').scrollIntoView({ behavior: 'smooth' });
});

// Settings & Theme
const navSettings = document.getElementById('nav-settings');
const settingsModal = document.getElementById('settings-modal');
const closeSettingsBtn = document.getElementById('close-settings');
const themeSelect = document.getElementById('theme-select');

navSettings?.addEventListener('click', (e) => {
  e.preventDefault();
  setActiveNav(navSettings);
  settingsModal.classList.add('active');
});

closeSettingsBtn?.addEventListener('click', () => {
  settingsModal.classList.remove('active');
});

// Load theme
const currentTheme = localStorage.getItem('libraryTheme') || 'light';
document.documentElement.setAttribute('data-theme', currentTheme);
themeSelect.value = currentTheme;

themeSelect.addEventListener('change', (e) => {
  const newTheme = e.target.value;
  document.documentElement.setAttribute('data-theme', newTheme);
  localStorage.setItem('libraryTheme', newTheme);
});

searchInput.addEventListener('input', applyFilters);
btnSearch.addEventListener('click', () => {
  applyFilters();
  document.getElementById('all-books-section').scrollIntoView({ behavior: 'smooth' });
});
categorySelect.addEventListener('change', (e) => {
  activeCategory = e.target.value;
  applyFilters();
  document.getElementById('all-books-section').scrollIntoView({ behavior: 'smooth' });
});

addBookForm.addEventListener('submit', async (e) => {
  e.preventDefault();

  const title = document.getElementById('input-title').value.trim();
  const author = document.getElementById('input-author').value.trim();
  const category = document.getElementById('input-category').value;
  const cover_image_url = document.getElementById('input-cover').value.trim();
  const cover_file = document.getElementById('input-cover-file').files[0];
  const book_file = document.getElementById('input-file').files[0];

  if (!title || !author) {
    showToast('Please fill in Title and Author.', 'error');
    return;
  }

  btnSubmit.disabled = true;
  btnSubmit.textContent = 'Adding...';

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('cover_image_url', cover_image_url);
    if (cover_file) formData.append('cover_file', cover_file);
    if (book_file) formData.append('book_file', book_file);

    const response = await fetch('/api/books', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server error');
    }

    showToast(`"${title}" added successfully! 🎉`, 'success');
    addBookForm.reset();
    await fetchBooks();
  } catch (err) {
    showToast(err.message || 'Failed to add book.', 'error');
  } finally {
    btnSubmit.disabled = false;
    btnSubmit.textContent = 'Add Book';
  }
});

function showToast(message, type) {
  toast.textContent = message;
  toast.className = 'toast show ' + type;
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

fetchBooks();
