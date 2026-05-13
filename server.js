// ============================================================
//  server.js - Express backend for the Open Digital Library
// ============================================================
// Vercel runs this file as a serverless function. Locally,
// `npm start` still opens the app on port 3000.

const express = require('express');
const path = require('path');
require('dotenv').config({ quiet: true });
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;
const BOOKS_BUCKET = process.env.SUPABASE_BOOKS_BUCKET || 'books';
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 25 * 1024 * 1024
  }
});

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const seedBooks = [
  {
    title: 'Introduction to Algorithms',
    author: 'Thomas H. Cormen',
    category: 'Computer Science',
    cover_image_url: 'https://m.media-amazon.com/images/I/41SNoh5ZhOL._SX440_BO1,204,203,200_.jpg'
  },
  {
    title: 'Clean Code',
    author: 'Robert C. Martin',
    category: 'Software Engineering',
    cover_image_url: 'https://m.media-amazon.com/images/I/41xShlnTZTL._SX376_BO1,204,203,200_.jpg'
  },
  {
    title: 'Python Data Science Handbook',
    author: 'Jake VanderPlas',
    category: 'Data Analytics',
    cover_image_url: 'https://m.media-amazon.com/images/I/51a0VvGBJwL._SX379_BO1,204,203,200_.jpg'
  },
  {
    title: 'Database System Concepts',
    author: 'Abraham Silberschatz',
    category: 'Computer Science',
    cover_image_url: 'https://m.media-amazon.com/images/I/51YgFhknDaL._SX400_BO1,204,203,200_.jpg'
  },
  {
    title: 'The Pragmatic Programmer',
    author: 'David Thomas & Andrew Hunt',
    category: 'Software Engineering',
    cover_image_url: 'https://m.media-amazon.com/images/I/51cUVaBWZzL._SX380_BO1,204,203,200_.jpg'
  },
  {
    title: 'Hands-On Machine Learning',
    author: 'Aurelien Geron',
    category: 'Data Analytics',
    cover_image_url: 'https://m.media-amazon.com/images/I/51aqYc1QyrL._SX379_BO1,204,203,200_.jpg'
  },
  {
    title: 'Computer Networking: A Top-Down Approach',
    author: 'James Kurose & Keith Ross',
    category: 'Computer Science',
    cover_image_url: 'https://m.media-amazon.com/images/I/51xp1+oHURL._SX430_BO1,204,203,200_.jpg'
  },
  {
    title: 'Storytelling with Data',
    author: 'Cole Nussbaumer Knaflic',
    category: 'Data Analytics',
    cover_image_url: 'https://m.media-amazon.com/images/I/41bom5v0sQL._SX397_BO1,204,203,200_.jpg'
  },
  {
    title: 'Think Python, 2nd Edition',
    author: 'Allen B. Downey',
    category: 'Computer Science',
    storage_path: 'https://greenteapress.com/thinkpython2/thinkpython2.pdf',
    file_name: 'Think Python, 2nd Edition.pdf',
    file_size: 1
  },
  {
    title: 'Think Stats, 2nd Edition',
    author: 'Allen B. Downey',
    category: 'Data Analytics',
    storage_path: 'https://greenteapress.com/thinkstats2/thinkstats2.pdf',
    file_name: 'Think Stats, 2nd Edition.pdf',
    file_size: 1
  },
  {
    title: 'Think Bayes, 2nd Edition',
    author: 'Allen B. Downey',
    category: 'Data Analytics',
    storage_path: 'https://allendowney.github.io/ThinkBayes2/',
    file_name: 'Think Bayes, 2nd Edition.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Think DSP',
    author: 'Allen B. Downey',
    category: 'Computer Science',
    storage_path: 'https://greenteapress.com/thinkdsp/thinkdsp.pdf',
    file_name: 'Think DSP.pdf',
    file_size: 1
  },
  {
    title: 'Automate the Boring Stuff with Python',
    author: 'Al Sweigart',
    category: 'Computer Science',
    storage_path: 'https://automatetheboringstuff.com/2e/',
    file_name: 'Automate the Boring Stuff with Python.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Python for Everybody',
    author: 'Charles R. Severance',
    category: 'Computer Science',
    storage_path: 'https://www.py4e.com/book',
    file_name: 'Python for Everybody.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Eloquent JavaScript',
    author: 'Marijn Haverbeke',
    category: 'Computer Science',
    storage_path: 'https://eloquentjavascript.net/',
    file_name: 'Eloquent JavaScript.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Pro Git',
    author: 'Scott Chacon and Ben Straub',
    category: 'Software Engineering',
    storage_path: 'https://git-scm.com/book/en/v2',
    file_name: 'Pro Git.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'The Rust Programming Language',
    author: 'Steve Klabnik and Carol Nichols',
    category: 'Software Engineering',
    storage_path: 'https://doc.rust-lang.org/book/',
    file_name: 'The Rust Programming Language.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Effective Go',
    author: 'The Go Authors',
    category: 'Software Engineering',
    storage_path: 'https://go.dev/doc/effective_go',
    file_name: 'Effective Go.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Crafting Interpreters',
    author: 'Robert Nystrom',
    category: 'Computer Science',
    storage_path: 'https://craftinginterpreters.com/',
    file_name: 'Crafting Interpreters.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Structure and Interpretation of Computer Programs',
    author: 'Harold Abelson, Gerald Jay Sussman, and Julie Sussman',
    category: 'Computer Science',
    storage_path: 'https://web.mit.edu/6.001/6.037/sicp.pdf',
    file_name: 'Structure and Interpretation of Computer Programs.pdf',
    file_size: 1
  },
  {
    title: 'Operating Systems: Three Easy Pieces',
    author: 'Remzi H. Arpaci-Dusseau and Andrea C. Arpaci-Dusseau',
    category: 'Computer Science',
    storage_path: 'https://pages.cs.wisc.edu/~remzi/OSTEP/',
    file_name: 'Operating Systems Three Easy Pieces.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'The Missing Semester of Your CS Education',
    author: 'MIT CSAIL',
    category: 'Computer Science',
    storage_path: 'https://missing.csail.mit.edu/',
    file_name: 'The Missing Semester.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Composing Programs',
    author: 'John DeNero',
    category: 'Computer Science',
    storage_path: 'https://www.composingprograms.com/',
    file_name: 'Composing Programs.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'How to Design Programs',
    author: 'Matthias Felleisen et al.',
    category: 'Computer Science',
    storage_path: 'https://htdp.org/2023-8-14/Book/index.html',
    file_name: 'How to Design Programs.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'OCaml Programming: Correct + Efficient + Beautiful',
    author: 'Michael R. Clarkson et al.',
    category: 'Computer Science',
    storage_path: 'https://cs3110.github.io/textbook/cover.html',
    file_name: 'OCaml Programming.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Python Data Science Handbook',
    author: 'Jake VanderPlas',
    category: 'Data Analytics',
    storage_path: 'https://jakevdp.github.io/PythonDataScienceHandbook/',
    file_name: 'Python Data Science Handbook.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Python for Data Analysis',
    author: 'Wes McKinney',
    category: 'Data Analytics',
    storage_path: 'https://wesmckinney.com/book/',
    file_name: 'Python for Data Analysis.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Computational and Inferential Thinking',
    author: 'Ani Adhikari, John DeNero, and David Wagner',
    category: 'Data Analytics',
    storage_path: 'https://www.inferentialthinking.com/chapters/intro',
    file_name: 'Computational and Inferential Thinking.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Statistical Thinking for the 21st Century',
    author: 'Russell A. Poldrack',
    category: 'Data Analytics',
    storage_path: 'https://statsthinking21.github.io/statsthinking21-core-site/',
    file_name: 'Statistical Thinking for the 21st Century.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'OpenIntro Statistics',
    author: 'David M. Diez, Mine Cetinkaya-Rundel, and Christopher D. Barr',
    category: 'Data Analytics',
    storage_path: 'https://www.openintro.org/book/os/',
    file_name: 'OpenIntro Statistics.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Mining of Massive Datasets',
    author: 'Jure Leskovec, Anand Rajaraman, and Jeff Ullman',
    category: 'Data Analytics',
    storage_path: 'http://infolab.stanford.edu/~ullman/mmds/book.pdf',
    file_name: 'Mining of Massive Datasets.pdf',
    file_size: 1
  },
  {
    title: 'Dive Into Systems',
    author: 'Suzanne J. Matthews, Tia Newhall, and Kevin C. Webb',
    category: 'Computer Science',
    storage_path: 'https://diveintosystems.org/book/',
    file_name: 'Dive Into Systems.html',
    file_mime_type: 'text/html',
    file_size: 1
  },
  {
    title: 'Deep Learning',
    author: 'Ian Goodfellow, Yoshua Bengio, and Aaron Courville',
    category: 'Data Analytics',
    storage_path: 'https://www.deeplearningbook.org/',
    file_name: 'Deep Learning.html',
    file_mime_type: 'text/html',
    file_size: 1
  }
];

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false
      }
    })
  : null;

let seedStarted = false;

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    || 'book';
}

function normalizeBook(book) {
  const fileSize = Number(book.file_size || 0);

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category || book.subject || 'General',
    cover_image_url: book.cover_image_url || book.cover_url || '',
    file_name: book.file_name || '',
    can_read: Boolean(book.storage_path && fileSize > 0)
  };
}

function toSupabaseBook(book) {
  const title = book.title;
  const fileName = book.file_name || `${title}.pdf`;

  return {
    title,
    author: book.author,
    subject: book.category || book.subject || 'General',
    description: book.description || '',
    cover_image_url: book.cover_image_url || book.cover || '',
    storage_path: book.storage_path || `manual/${Date.now()}-${slugify(title)}.pdf`,
    file_name: fileName,
    file_mime_type: book.file_mime_type || 'application/pdf',
    file_size: Number(book.file_size || 0)
  };
}

function isPdfFile(file) {
  return file
    && (file.mimetype === 'application/pdf' || file.originalname.toLowerCase().endsWith('.pdf'));
}

function isMissingColumnError(error) {
  return error?.code === 'PGRST204'
    && error?.message?.includes('Could not find the')
    && error?.message?.includes('column');
}

function isSubjectRequiredError(error) {
  return error?.code === '23502'
    && error?.message?.includes('column "subject"');
}

async function insertBooks(books) {
  const { error } = await supabase
    .from('books')
    .insert(books.map(toSupabaseBook));

  if (!error) {
    return;
  }

  if (!isMissingColumnError(error) && !isSubjectRequiredError(error)) {
    throw error;
  }

  const fallbackBooks = books.map(({ title, author, category, subject }) => ({
    title,
    author,
    subject: category || subject || 'General'
  }));

  let { error: fallbackError } = await supabase
    .from('books')
    .insert(fallbackBooks);

  if (isMissingColumnError(fallbackError)) {
    const minimalBooks = books.map(({ title, author }) => ({
      title,
      author
    }));

    const minimalResponse = await supabase
      .from('books')
      .insert(minimalBooks);

    fallbackError = minimalResponse.error;
  }

  if (fallbackError) {
    throw fallbackError;
  }
}

async function ensureSeedBooks() {
  if (seedStarted || !supabase) {
    return;
  }

  seedStarted = true;

  try {
    const { data: existingBooks, error: fetchError } = await supabase
      .from('books')
      .select('id, title, storage_path, file_size');

    if (fetchError) {
      throw fetchError;
    }

    const existingByTitle = new Map(
      existingBooks.map((book) => [book.title.trim().toLowerCase(), book])
    );
    const missingBooks = seedBooks.filter(
      (book) => !existingByTitle.has(book.title.trim().toLowerCase())
    );

    if (missingBooks.length > 0) {
      await insertBooks(missingBooks);
    }

    for (const book of seedBooks) {
      if (!book.storage_path) {
        continue;
      }

      const existingBook = existingByTitle.get(book.title.trim().toLowerCase());
      const alreadyReadable = existingBook
        && existingBook.storage_path
        && Number(existingBook.file_size || 0) > 0;

      if (existingBook && !alreadyReadable) {
        const { error: updateError } = await supabase
          .from('books')
          .update(toSupabaseBook(book))
          .eq('id', existingBook.id);

        if (updateError) {
          throw updateError;
        }
      }
    }
  } catch (err) {
    seedStarted = false;
    throw err;
  }
}

function requireSupabase(res) {
  if (supabase) {
    return true;
  }

  res.status(500).json({
    error: 'Supabase environment variables are missing. Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in Vercel.'
  });
  return false;
}

app.get('/api/books', async (req, res) => {
  try {
    if (!requireSupabase(res)) {
      return;
    }

    await ensureSeedBooks();

    const { data, error } = await supabase
      .from('books')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data.map(normalizeBook));
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.get('/api/books/:id/read', async (req, res) => {
  try {
    if (!requireSupabase(res)) {
      return;
    }

    const { data: book, error } = await supabase
      .from('books')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (error) {
      throw error;
    }

    if (!book.storage_path || Number(book.file_size || 0) <= 0) {
      return res.status(404).json({
        error: 'PDF file is not uploaded for this book yet.'
      });
    }

    if (/^https?:\/\//i.test(book.storage_path)) {
      return res.json({ url: book.storage_path });
    }

    const { data, error: signedUrlError } = await supabase
      .storage
      .from(BOOKS_BUCKET)
      .createSignedUrl(book.storage_path, 60 * 10);

    if (signedUrlError) {
      throw signedUrlError;
    }

    res.json({ url: data.signedUrl });
  } catch (err) {
    console.error('Error opening book:', err);
    res.status(500).json({ error: 'Failed to open book' });
  }
});

app.delete('/api/books/:id', async (req, res) => {
  try {
    if (!requireSupabase(res)) {
      return;
    }

    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('*')
      .eq('id', req.params.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    const { error: deleteError } = await supabase
      .from('books')
      .delete()
      .eq('id', req.params.id);

    if (deleteError) {
      throw deleteError;
    }

    if (book.storage_path && !/^https?:\/\//i.test(book.storage_path)) {
      const { error: storageError } = await supabase
        .storage
        .from(BOOKS_BUCKET)
        .remove([book.storage_path]);

      if (storageError) {
        console.warn('Book row deleted, but storage cleanup failed:', storageError);
      }
    }

    res.status(204).send();
  } catch (err) {
    console.error('Error deleting book:', err);
    res.status(500).json({ error: 'Failed to delete book' });
  }
});

app.post('/api/books', upload.single('book_file'), async (req, res) => {
  try {
    if (!requireSupabase(res)) {
      return;
    }

    const { title, author, category, cover_image_url } = req.body;
    const file = req.file;

    if (!title || !author) {
      return res.status(400).json({
        error: 'Title and Author are required fields.'
      });
    }

    if (file && !isPdfFile(file)) {
      return res.status(400).json({
        error: 'Please upload a PDF file.'
      });
    }

    let storagePath = '';

    if (file) {
      storagePath = `uploads/${Date.now()}-${slugify(title)}.pdf`;

      const { error: uploadError } = await supabase
        .storage
        .from(BOOKS_BUCKET)
        .upload(storagePath, file.buffer, {
          contentType: file.mimetype || 'application/pdf',
          upsert: false
        });

      if (uploadError) {
        throw uploadError;
      }
    }

    let { data, error } = await supabase
      .from('books')
      .insert(toSupabaseBook({
        title,
        author,
        category: category || 'General',
        cover_image_url: cover_image_url || '',
        storage_path: storagePath,
        file_name: file?.originalname || `${title}.pdf`,
        file_mime_type: file?.mimetype || 'application/pdf',
        file_size: file?.size || 0
      }))
      .select('*')
      .single();

    if (isMissingColumnError(error) || isSubjectRequiredError(error)) {
      const fallbackResponse = await supabase
        .from('books')
        .insert({
          title,
          author,
          subject: category || 'General'
        })
        .select('*')
        .single();

      data = fallbackResponse.data;
      error = fallbackResponse.error;
    }

    if (isMissingColumnError(error)) {
      const minimalResponse = await supabase
        .from('books')
        .insert({ title, author })
        .select('*')
        .single();

      data = minimalResponse.data;
      error = minimalResponse.error;
    }

    if (error) {
      throw error;
    }

    res.status(201).json(normalizeBook(data));
  } catch (err) {
    console.error('Error adding book:', err);
    res.status(500).json({ error: 'Failed to add book' });
  }
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Open Digital Library server running at http://localhost:${PORT}`);
  });
}

module.exports = app;
