// ==========================================================
//  app.js — Frontend JavaScript for Open Digital Library
// ==========================================================
// This script does four main things:
//   1. Fetches the list of books from the backend API.
//   2. Renders book cards into the grid on the page.
//   3. Handles the search bar (filters books in real-time).
//   4. Handles the "Add Book" form submission via POST.
// ==========================================================

// ----------------------------------------------------------
//  Global state
// ----------------------------------------------------------
// We keep the full list of books in memory so we can filter
// them on the client side without hitting the server again.
let allBooks = [];

// ----------------------------------------------------------
//  DOM references — grab important elements once
// ----------------------------------------------------------
const bookGrid      = document.getElementById('book-grid');
const searchInput   = document.getElementById('search-input');
const filterPills   = document.getElementById('filter-pills');
const addBookForm   = document.getElementById('add-book-form');
const btnSubmit     = document.getElementById('btn-submit');
const toast         = document.getElementById('toast');
const statTotal     = document.getElementById('stat-total');
const statCategories= document.getElementById('stat-categories');
const statAuthors   = document.getElementById('stat-authors');

// Track current active category filter
let activeCategory = 'all';

// ==========================================================
//  1. FETCH BOOKS FROM THE API
// ==========================================================
// This function calls GET /api/books, stores the result,
// and then renders the book cards on the page.

async function fetchBooks() {
  try {
    const response = await fetch('/api/books');

    // If the server returns an error status, throw
    if (!response.ok) throw new Error('Server error');

    // Parse the JSON array of books
    allBooks = await response.json();

    // Build the category filter pills
    buildCategoryPills();

    // Update the hero statistics
    updateStats();

    // Render the cards
    renderBooks(allBooks);
  } catch (err) {
    console.error('Failed to load books:', err);
    bookGrid.innerHTML = '<p class="no-results">⚠️ Could not load books. Is the server running?</p>';
  }
}

// ==========================================================
//  2. RENDER BOOK CARDS
// ==========================================================
// Takes an array of book objects and injects HTML cards
// into the #book-grid container.

function renderBooks(books) {
  // If the array is empty, show a "no results" message
  if (books.length === 0) {
    bookGrid.innerHTML = '<p class="no-results">No books found matching your search.</p>';
    return;
  }

  // Build all cards as an HTML string, then inject at once
  // (much faster than creating DOM nodes one-by-one)
  bookGrid.innerHTML = books.map((book, index) => `
    <div class="book-card" style="animation-delay: ${index * 0.07}s">
      <div class="book-cover-wrap">
        ${book.cover_image_url
          ? `<img class="book-cover"
                  src="${escapeHtml(book.cover_image_url)}"
                  alt="Cover of ${escapeHtml(book.title)}"
                  onerror="this.parentElement.innerHTML='<span class=book-cover-fallback>📕</span>'" />`
          : '<span class="book-cover-fallback">📕</span>'
        }
      </div>
      <div class="book-info">
        <div class="book-title">${escapeHtml(book.title)}</div>
        <div class="book-author">by ${escapeHtml(book.author)}</div>
        <span class="book-category">${escapeHtml(book.category)}</span>
        <button class="btn-read"
                type="button"
                data-book-id="${escapeHtml(book.id)}"
                ${book.can_read ? '' : 'disabled'}
                title="${book.can_read ? 'Open PDF' : 'PDF file is not uploaded for this book yet'}">
          ${book.can_read ? 'Read Book' : 'PDF Missing'}
        </button>
      </div>
    </div>
  `).join('');
}

bookGrid.addEventListener('click', async (event) => {
  const readButton = event.target.closest('.btn-read');

  if (!readButton || readButton.disabled) {
    return;
  }

  readButton.disabled = true;
  const originalText = readButton.textContent;
  readButton.textContent = 'Opening...';

  try {
    const response = await fetch(`/api/books/${encodeURIComponent(readButton.dataset.bookId)}/read`);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Unable to open book.');
    }

    window.open(data.url, '_blank', 'noopener,noreferrer');
  } catch (err) {
    console.error('Error opening book:', err);
    showToast(err.message || 'Unable to open book.', 'error');
  } finally {
    readButton.disabled = false;
    readButton.textContent = originalText;
  }
});

// ==========================================================
//  3. CATEGORY FILTER PILLS
// ==========================================================
// Dynamically creates filter buttons based on the unique
// categories found in the book list.

function buildCategoryPills() {
  // Get unique categories
  const categories = [...new Set(allBooks.map(b => b.category))];

  // Build pill buttons — "All" is always first
  filterPills.innerHTML = `
    <button class="pill ${activeCategory === 'all' ? 'active' : ''}"
            data-category="all">All</button>
    ${categories.map(cat => `
      <button class="pill ${activeCategory === cat ? 'active' : ''}"
              data-category="${escapeHtml(cat)}">${escapeHtml(cat)}</button>
    `).join('')}
  `;

  // Attach click listeners to each pill
  filterPills.querySelectorAll('.pill').forEach(pill => {
    pill.addEventListener('click', () => {
      activeCategory = pill.dataset.category;

      // Update the active class on pills
      filterPills.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');

      // Re-apply the combined search + category filter
      applyFilters();
    });
  });
}

// ==========================================================
//  4. SEARCH + FILTER LOGIC
// ==========================================================

function applyFilters() {
  const query = searchInput.value.toLowerCase().trim();

  let filtered = allBooks;

  // Filter by category (unless "all")
  if (activeCategory !== 'all') {
    filtered = filtered.filter(b => b.category === activeCategory);
  }

  // Filter by search query (matches title, author, or category)
  if (query) {
    filtered = filtered.filter(book =>
      book.title.toLowerCase().includes(query) ||
      book.author.toLowerCase().includes(query) ||
      book.category.toLowerCase().includes(query)
    );
  }

  renderBooks(filtered);
}

// Listen for keystrokes in the search input
searchInput.addEventListener('input', applyFilters);

// ==========================================================
//  5. UPDATE HERO STATISTICS
// ==========================================================
// Counts total books, unique categories, and unique authors.

function updateStats() {
  statTotal.textContent      = allBooks.length;
  statCategories.textContent = new Set(allBooks.map(b => b.category)).size;
  statAuthors.textContent    = new Set(allBooks.map(b => b.author)).size;
}

// ==========================================================
//  6. ADD BOOK FORM SUBMISSION
// ==========================================================
// When the form is submitted, we POST the new book to the API
// and refresh the book list on success.

addBookForm.addEventListener('submit', async (e) => {
  // Prevent the default browser form-submit (page reload)
  e.preventDefault();

  // Read the form values
  const title           = document.getElementById('input-title').value.trim();
  const author          = document.getElementById('input-author').value.trim();
  const category        = document.getElementById('input-category').value;
  const cover_image_url = document.getElementById('input-cover').value.trim();
  const book_file       = document.getElementById('input-file').files[0];

  // Basic check
  if (!title || !author) {
    showToast('Please fill in Title and Author.', 'error');
    return;
  }

  // Show loading spinner on the button
  btnSubmit.classList.add('loading');
  btnSubmit.disabled = true;

  try {
    const formData = new FormData();
    formData.append('title', title);
    formData.append('author', author);
    formData.append('category', category);
    formData.append('cover_image_url', cover_image_url);

    if (book_file) {
      formData.append('book_file', book_file);
    }

    // Send the POST request with a multipart body so PDFs can be uploaded.
    const response = await fetch('/api/books', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const errData = await response.json();
      throw new Error(errData.error || 'Server error');
    }

    // Success! Show a toast and reset the form
    showToast(`"${title}" added successfully! 🎉`, 'success');
    addBookForm.reset();

    // Refresh the book grid to include the new book
    await fetchBooks();

    // Scroll up to the book grid so the user can see the new book
    document.getElementById('books-section').scrollIntoView({ behavior: 'smooth' });

  } catch (err) {
    console.error('Error adding book:', err);
    showToast(err.message || 'Failed to add book.', 'error');
  } finally {
    // Remove the loading state
    btnSubmit.classList.remove('loading');
    btnSubmit.disabled = false;
  }
});

// ==========================================================
//  7. TOAST NOTIFICATION HELPER
// ==========================================================
// Shows a small success/error message below the form.

function showToast(message, type) {
  toast.textContent = message;
  toast.className   = 'toast show ' + type;

  // Auto-hide after 4 seconds
  clearTimeout(toast._timer);
  toast._timer = setTimeout(() => {
    toast.classList.remove('show');
  }, 4000);
}

// ==========================================================
//  8. HTML ESCAPE HELPER (prevent XSS)
// ==========================================================
// Replaces special characters so user-supplied text is
// rendered as plain text, never as HTML.

function escapeHtml(str) {
  if (!str) return '';
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ==========================================================
//  9. INITIAL LOAD
// ==========================================================
// When the page first loads, fetch the books from the API.
fetchBooks();
