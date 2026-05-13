// ============================================================
//  server.js — Express backend for the Open Digital Library
// ============================================================
// This file is the ONLY backend file.  It does three things:
//   1.  Creates / opens a SQLite database and seeds it with
//       some starter books the first time it runs.
//   2.  Serves all the static frontend files from the "public"
//       folder (HTML, CSS, JS, images).
//   3.  Provides two API routes:
//         GET  /api/books   → returns all books as JSON
//         POST /api/books   → adds a new book to the database
// ============================================================

// ----------------------------------------------------------
//  1. Import the packages we need
// ----------------------------------------------------------
const express = require('express');           // Web framework
const path    = require('path');              // File-path helper
const Database = require('better-sqlite3');   // SQLite driver

// ----------------------------------------------------------
//  2. Create the Express application
// ----------------------------------------------------------
const app  = express();
const PORT = 3000;   // The server will listen on http://localhost:3000

// ----------------------------------------------------------
//  3. Middleware
// ----------------------------------------------------------

// express.json() lets us read JSON bodies from POST requests.
app.use(express.json());

// express.static() serves every file inside the "public" folder
// automatically.  So public/index.html is served at "/".
app.use(express.static(path.join(__dirname, 'public')));

// ----------------------------------------------------------
//  4. Open (or create) the SQLite database file
// ----------------------------------------------------------
// better-sqlite3 will create "library.db" if it doesn't exist yet.
const db = new Database(path.join(__dirname, 'library.db'));

// Turn on WAL mode for better performance (optional but nice)
db.pragma('journal_mode = WAL');

// ----------------------------------------------------------
//  5. Create the "books" table if it doesn't already exist
// ----------------------------------------------------------
// The table has five columns:
//   id              – auto-incrementing primary key
//   title           – the book's title (required)
//   author          – who wrote it (required)
//   category        – e.g. "Computer Science", "Data Analytics"
//   cover_image_url – a URL pointing to a cover image
db.exec(`
  CREATE TABLE IF NOT EXISTS books (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    title           TEXT    NOT NULL,
    author          TEXT    NOT NULL,
    category        TEXT    DEFAULT 'General',
    cover_image_url TEXT    DEFAULT ''
  );
`);

// ----------------------------------------------------------
//  6. Seed the database with starter books (only if empty)
// ----------------------------------------------------------
// We check whether the table already has rows.  If it's
// completely empty we insert a handful of realistic CS / Data
// books so the homepage isn't blank when you first run it.

const rowCount = db.prepare('SELECT COUNT(*) AS cnt FROM books').get();

if (rowCount.cnt === 0) {
  console.log('📚 Seeding database with starter books…');

  const seedBooks = [
    {
      title: 'Introduction to Algorithms',
      author: 'Thomas H. Cormen',
      category: 'Computer Science',
      cover: 'https://m.media-amazon.com/images/I/41SNoh5ZhOL._SX440_BO1,204,203,200_.jpg'
    },
    {
      title: 'Clean Code',
      author: 'Robert C. Martin',
      category: 'Software Engineering',
      cover: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg'
    },
    {
      title: 'Python Data Science Handbook',
      author: 'Jake VanderPlas',
      category: 'Data Analytics',
      cover: 'https://m.media-amazon.com/images/I/51a0VvGBJwL._SX379_BO1,204,203,200_.jpg'
    },
    {
      title: 'Database System Concepts',
      author: 'Abraham Silberschatz',
      category: 'Computer Science',
      cover: 'https://m.media-amazon.com/images/I/51YgFhknDaL._SX400_BO1,204,203,200_.jpg'
    },
    {
      title: 'The Pragmatic Programmer',
      author: 'David Thomas & Andrew Hunt',
      category: 'Software Engineering',
      cover: 'https://m.media-amazon.com/images/I/51cUVaBWZzL._SX380_BO1,204,203,200_.jpg'
    },
    {
      title: 'Hands-On Machine Learning',
      author: 'Aurélien Géron',
      category: 'Data Analytics',
      cover: 'https://m.media-amazon.com/images/I/51aqYc1QyrL._SX379_BO1,204,203,200_.jpg'
    },
    {
      title: 'Computer Networking: A Top-Down Approach',
      author: 'James Kurose & Keith Ross',
      category: 'Computer Science',
      cover: 'https://m.media-amazon.com/images/I/51xp1+oHURL._SX430_BO1,204,203,200_.jpg'
    },
    {
      title: 'Storytelling with Data',
      author: 'Cole Nussbaumer Knaflic',
      category: 'Data Analytics',
      cover: 'https://m.media-amazon.com/images/I/41bom5v0sQL._SX397_BO1,204,203,200_.jpg'
    }
  ];

  // Prepare a reusable INSERT statement (faster + safer)
  const insert = db.prepare(`
    INSERT INTO books (title, author, category, cover_image_url)
    VALUES (@title, @author, @category, @cover)
  `);

  // Wrap all inserts in a transaction for speed
  const seedAll = db.transaction((books) => {
    for (const book of books) {
      insert.run(book);
    }
  });

  seedAll(seedBooks);
  console.log(`✅ Inserted ${seedBooks.length} books.`);
}

// ----------------------------------------------------------
//  7. API ROUTE — GET /api/books
// ----------------------------------------------------------
// Returns all books from the database as a JSON array.
// The frontend calls this when the page loads and whenever
// the user adds a new book.

app.get('/api/books', (req, res) => {
  try {
    // Fetch every row from the "books" table
    const books = db.prepare('SELECT * FROM books ORDER BY id DESC').all();
    // Send them back as JSON
    res.json(books);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

// ----------------------------------------------------------
//  8. API ROUTE — POST /api/books
// ----------------------------------------------------------
// Accepts a JSON body like:
//   { "title": "...", "author": "...", "category": "...",
//     "cover_image_url": "..." }
// Inserts a new row into the books table and returns
// the newly created book (with its id).

app.post('/api/books', (req, res) => {
  try {
    // Pull values out of the request body
    const { title, author, category, cover_image_url } = req.body;

    // --- Basic validation ---
    if (!title || !author) {
      return res.status(400).json({
        error: 'Title and Author are required fields.'
      });
    }

    // Insert into the database
    const stmt = db.prepare(`
      INSERT INTO books (title, author, category, cover_image_url)
      VALUES (?, ?, ?, ?)
    `);

    const info = stmt.run(
      title,
      author,
      category  || 'General',
      cover_image_url || ''
    );

    // Return the newly created book
    const newBook = db.prepare('SELECT * FROM books WHERE id = ?').get(info.lastInsertRowid);
    res.status(201).json(newBook);
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

// ----------------------------------------------------------
//  9. Start the server
// ----------------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n🚀 Open Digital Library server running at:`);
  console.log(`   http://localhost:${PORT}\n`);
});
