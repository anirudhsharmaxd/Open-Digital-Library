// ============================================================
//  server.js - Express backend for the Open Digital Library
// ============================================================
// Vercel runs this file as a serverless function. Locally,
// `npm start` still opens the app on port 3000.

const express = require('express');
const path = require('path');
require('dotenv').config({ quiet: true });
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

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

async function ensureSeedBooks() {
  if (seedStarted || !supabase) {
    return;
  }

  seedStarted = true;

  const { count, error: countError } = await supabase
    .from('books')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    throw countError;
  }

  if (count === 0) {
    const { error: insertError } = await supabase
      .from('books')
      .insert(seedBooks);

    if (insertError) {
      throw insertError;
    }
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
      .select('id, title, author, category, cover_image_url')
      .order('id', { ascending: false });

    if (error) {
      throw error;
    }

    res.json(data);
  } catch (err) {
    console.error('Error fetching books:', err);
    res.status(500).json({ error: 'Failed to fetch books' });
  }
});

app.post('/api/books', async (req, res) => {
  try {
    if (!requireSupabase(res)) {
      return;
    }

    const { title, author, category, cover_image_url } = req.body;

    if (!title || !author) {
      return res.status(400).json({
        error: 'Title and Author are required fields.'
      });
    }

    const { data, error } = await supabase
      .from('books')
      .insert({
        title,
        author,
        category: category || 'General',
        cover_image_url: cover_image_url || ''
      })
      .select('id, title, author, category, cover_image_url')
      .single();

    if (error) {
      throw error;
    }

    res.status(201).json(data);
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
