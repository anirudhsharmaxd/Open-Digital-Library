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
    "title": "Think Python, 2nd Edition",
    "author": "Allen B. Downey",
    "category": "Computer Science",
    "storage_path": "https://greenteapress.com/thinkpython2/thinkpython2.pdf",
    "file_name": "Think Python.pdf",
    "file_size": 1
  ,
    "cover_image_url": "https://covers.openlibrary.org/b/id/7363360-L.jpg"
  },
  {
    "title": "Think Stats, 2nd Edition",
    "author": "Allen B. Downey",
    "category": "Data Analytics",
    "storage_path": "https://greenteapress.com/thinkstats2/thinkstats2.pdf",
    "file_name": "Think Stats.pdf",
    "file_size": 1
  ,
    "cover_image_url": "https://covers.openlibrary.org/b/id/6956191-L.jpg"
  },
  {
    "title": "Think DSP",
    "author": "Allen B. Downey",
    "category": "Computer Science",
    "storage_path": "https://greenteapress.com/thinkdsp/thinkdsp.pdf",
    "file_name": "Think DSP.pdf",
    "file_size": 1,
    "cover_image_url": "/covers/think_dsp.svg"
  },
  {
    "title": "Automate the Boring Stuff with Python",
    "author": "Al Sweigart",
    "category": "Software Engineering",
    "storage_path": "https://automatetheboringstuff.com/",
    "file_name": "Automate the Boring Stuff.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/7363640-L.jpg"
  },
  {
    "title": "Python for Everybody",
    "author": "Charles R. Severance",
    "category": "Computer Science",
    "storage_path": "https://www.py4e.com/book.pdf",
    "file_name": "Python for Everybody.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/8512502-L.jpg"
  },
  {
    "title": "Eloquent JavaScript",
    "author": "Marijn Haverbeke",
    "category": "Software Engineering",
    "storage_path": "https://eloquentjavascript.net/Eloquent_JavaScript.pdf",
    "file_name": "Eloquent JavaScript.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/7082166-L.jpg"
  },
  {
    "title": "Pro Git",
    "author": "Scott Chacon and Ben Straub",
    "category": "Software Engineering",
    "storage_path": "https://github.com/progit/progit2/releases/download/2.1.373/progit.pdf",
    "file_name": "Pro Git.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/7892827-L.jpg"
  },
  {
    "title": "The Rust Programming Language",
    "author": "Steve Klabnik and Carol Nichols",
    "category": "Software Engineering",
    "storage_path": "https://doc.rust-lang.org/stable/book/",
    "file_name": "Rust Book.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/8508621-L.jpg"
  },
  {
    "title": "Effective Go",
    "author": "The Go Authors",
    "category": "Software Engineering",
    "storage_path": "https://go.dev/doc/effective_go",
    "file_name": "Effective Go.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/13282520-L.jpg"
  },
  {
    "title": "Crafting Interpreters",
    "author": "Robert Nystrom",
    "category": "Computer Science",
    "storage_path": "https://craftinginterpreters.com/",
    "file_name": "Crafting Interpreters.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/12075000-L.jpg"
  },
  {
    "title": "Structure and Interpretation of Computer Programs",
    "author": "Harold Abelson and Gerald Jay Sussman",
    "category": "Computer Science",
    "storage_path": "https://web.mit.edu/alexmv/6.037/sicp.pdf",
    "file_name": "SICP.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/149338-L.jpg"
  },
  {
    "title": "Operating Systems: Three Easy Pieces",
    "author": "Remzi H. Arpaci-Dusseau",
    "category": "Computer Science",
    "storage_path": "https://pages.cs.wisc.edu/~remzi/OSTEP/",
    "file_name": "OSTEP.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "/covers/ostep.svg"
  },
  {
    "title": "The Missing Semester of Your CS Education",
    "author": "MIT CSAIL",
    "category": "Computer Science",
    "storage_path": "https://missing.csail.mit.edu/",
    "file_name": "Missing Semester.html",
    "file_mime_type": "text/html",
    "file_size": 1
  ,
    "cover_image_url": "https://covers.openlibrary.org/b/id/14753550-L.jpg"
  },
  {
    "title": "Composing Programs",
    "author": "John DeNero",
    "category": "Computer Science",
    "storage_path": "https://www.composingprograms.com/",
    "file_name": "Composing Programs.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/10162292-L.jpg"
  },
  {
    "title": "How to Design Programs",
    "author": "Matthias Felleisen",
    "category": "Software Engineering",
    "storage_path": "https://htdp.org/",
    "file_name": "HTDP.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/8126199-L.jpg"
  },
  {
    "title": "OCaml Programming",
    "author": "Michael R. Clarkson",
    "category": "Computer Science",
    "storage_path": "https://cs3110.github.io/textbook/",
    "file_name": "OCaml Book.html",
    "file_mime_type": "text/html",
    "file_size": 1
  ,
    "cover_image_url": "https://covers.openlibrary.org/b/id/7269686-L.jpg"
  },
  {
    "title": "Python Data Science Handbook",
    "author": "Jake VanderPlas",
    "category": "Data Analytics",
    "storage_path": "https://jakevdp.github.io/PythonDataScienceHandbook/",
    "file_name": "Python Data Science Handbook.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/8512092-L.jpg"
  },
  {
    "title": "Python for Data Analysis",
    "author": "Wes McKinney",
    "category": "Data Analytics",
    "storage_path": "https://wesmckinney.com/book/",
    "file_name": "Python for Data Analysis.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/7548132-L.jpg"
  },
  {
    "title": "Computational and Inferential Thinking",
    "author": "Ani Adhikari and John DeNero",
    "category": "Data Analytics",
    "storage_path": "https://inferentialthinking.com/",
    "file_name": "Inferential Thinking.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "/covers/inferential_thinking.svg"
  },
  {
    "title": "Statistical Thinking for the 21st Century",
    "author": "Russell A. Poldrack",
    "category": "Data Analytics",
    "storage_path": "https://statsthinking21.github.io/statsthinking21-core-site/",
    "file_name": "Statistical Thinking.html",
    "file_mime_type": "text/html",
    "file_size": 1
  ,
    "cover_image_url": "https://covers.openlibrary.org/b/id/511582-L.jpg"
  },
  {
    "title": "OpenIntro Statistics",
    "author": "David Diez, Mine Cetinkaya-Rundel",
    "category": "Data Analytics",
    "storage_path": "https://www.openintro.org/book/os/",
    "file_name": "OpenIntro Statistics.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/10793380-L.jpg"
  },
  {
    "title": "Mining of Massive Datasets",
    "author": "Jure Leskovec, Anand Rajaraman, Jeff Ullman",
    "category": "Data Analytics",
    "storage_path": "http://www.mmds.org/mmds/v3.0/mmds-v3.0.pdf",
    "file_name": "MMDS.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/10039901-L.jpg"
  },
  {
    "title": "Dive Into Systems",
    "author": "Suzanne J. Matthews",
    "category": "Computer Science",
    "storage_path": "https://diveintosystems.org/",
    "file_name": "Dive Into Systems.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/13835185-L.jpg"
  },
  {
    "title": "Deep Learning",
    "author": "Ian Goodfellow, Yoshua Bengio",
    "category": "Data Analytics",
    "storage_path": "https://www.deeplearningbook.org/",
    "file_name": "Deep Learning.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/8086288-L.jpg"
  },
  {
    "title": "The Shape of Design",
    "author": "Frank Chimero",
    "category": "Design",
    "storage_path": "https://shapeofdesignbook.com/The-Shape-of-Design.pdf",
    "file_name": "The Shape of Design.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/8719207-L.jpg"
  },
  {
    "title": "Practical Typography",
    "author": "Matthew Butterick",
    "category": "Design",
    "storage_path": "https://practicaltypography.com/",
    "file_name": "Practical Typography.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/12953977-L.jpg"
  },
  {
    "title": "Design's Iron Fist",
    "author": "Jarrod Drysdale",
    "category": "Design",
    "storage_path": "https://bootcamp.com/designs-iron-fist",
    "file_name": "Designs Iron Fist.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/10532990-L.jpg"
  },
  {
    "title": "Pixel Perfect Precision",
    "author": "ustwo",
    "category": "Design",
    "storage_path": "https://ustwo.com/ppp/",
    "file_name": "Pixel Perfect Precision.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/8300234-L.jpg"
  },
  {
    "title": "Web Typography",
    "author": "Richard Rutter",
    "category": "Design",
    "storage_path": "http://webtypography.net/",
    "file_name": "Web Typography.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/12567437-L.jpg"
  },
  {
    "title": "Psychology 2e",
    "author": "OpenStax",
    "category": "Psychology",
    "storage_path": "https://assets.openstax.org/oscms-prodcms/media/documents/Psychology2e-WEB.pdf",
    "file_name": "Psychology 2e.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/10188612-L.jpg"
  },
  {
    "title": "The Principles of Psychology",
    "author": "William James",
    "category": "Psychology",
    "storage_path": "https://www.gutenberg.org/files/57732/57732-h/57732-h.htm",
    "file_name": "Principles of Psychology.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/5815742-L.jpg"
  },
  {
    "title": "Dream Psychology",
    "author": "Sigmund Freud",
    "category": "Psychology",
    "storage_path": "https://www.gutenberg.org/files/15489/15489-h/15489-h.htm",
    "file_name": "Dream Psychology.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/13180633-L.jpg"
  },
  {
    "title": "The Crowd: A Study of the Popular Mind",
    "author": "Gustave Le Bon",
    "category": "Psychology",
    "storage_path": "https://www.gutenberg.org/files/445/445-h/445-h.htm",
    "file_name": "The Crowd.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/526366-L.jpg"
  },
  {
    "title": "Human Nature and Conduct",
    "author": "John Dewey",
    "category": "Psychology",
    "storage_path": "https://www.gutenberg.org/files/41158/41158-h/41158-h.htm",
    "file_name": "Human Nature and Conduct.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/1788756-L.jpg"
  },
  {
    "title": "The Wealth of Nations",
    "author": "Adam Smith",
    "category": "Money",
    "storage_path": "https://www.gutenberg.org/files/3300/3300-h/3300-h.htm",
    "file_name": "Wealth of Nations.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/12816911-L.jpg"
  },
  {
    "title": "Think and Grow Rich",
    "author": "Napoleon Hill",
    "category": "Money",
    "storage_path": "https://www.gutenberg.org/files/32509/32509-h/32509-h.htm",
    "file_name": "Think and Grow Rich.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/14542536-L.jpg"
  },
  {
    "title": "The Richest Man in Babylon",
    "author": "George S. Clason",
    "category": "Money",
    "storage_path": "https://example.com/richest-man-in-babylon.pdf",
    "file_name": "Richest Man in Babylon.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/10491331-L.jpg"
  },
  {
    "title": "The Art of Money Getting",
    "author": "P.T. Barnum",
    "category": "Money",
    "storage_path": "https://www.gutenberg.org/files/8581/8581-h/8581-h.htm",
    "file_name": "Art of Money Getting.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/756095-L.jpg"
  },
  {
    "title": "Economics 3e",
    "author": "OpenStax",
    "category": "Money",
    "storage_path": "https://assets.openstax.org/oscms-prodcms/media/documents/Economics3e-WEB.pdf",
    "file_name": "Economics 3e.pdf",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/10188613-L.jpg"
  },
  {
    "title": "As a Man Thinketh",
    "author": "James Allen",
    "category": "Motivation",
    "storage_path": "https://www.gutenberg.org/files/4507/4507-h/4507-h.htm",
    "file_name": "As a Man Thinketh.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/6268048-L.jpg"
  },
  {
    "title": "Meditations",
    "author": "Marcus Aurelius",
    "category": "Motivation",
    "storage_path": "https://www.gutenberg.org/files/2680/2680-h/2680-h.htm",
    "file_name": "Meditations.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/211529-L.jpg"
  },
  {
    "title": "The Science of Getting Rich",
    "author": "Wallace D. Wattles",
    "category": "Motivation",
    "storage_path": "https://www.gutenberg.org/files/59844/59844-h/59844-h.htm",
    "file_name": "Science of Getting Rich.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/854989-L.jpg"
  },
  {
    "title": "Self-Reliance",
    "author": "Ralph Waldo Emerson",
    "category": "Motivation",
    "storage_path": "https://www.gutenberg.org/files/16643/16643-h/16643-h.htm",
    "file_name": "Self-Reliance.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/14845607-L.jpg"
  },
  {
    "title": "Acres of Diamonds",
    "author": "Russell H. Conwell",
    "category": "Motivation",
    "storage_path": "https://www.gutenberg.org/files/368/368-h/368-h.htm",
    "file_name": "Acres of Diamonds.html",
    "file_mime_type": "text/html",
    "file_size": 1,
    "cover_image_url": "https://covers.openlibrary.org/b/id/5833160-L.jpg"
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

function generatedCover(book) {
  const title = (book.title || 'Open Book').replace(/[<&>"]/g, '');
  const author = (book.author || 'Unknown').replace(/[<&>"]/g, '');
  const category = (book.category || book.subject || 'Library').replace(/[<&>"]/g, '');
  const hue1 = [...title].reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  const hue2 = (hue1 + 60) % 360;
  
  // Basic word wrapping for SVG text
  const words = title.split(' ');
  const lines = [];
  let currentLine = '';
  for (const word of words) {
    if ((currentLine + word).length > 15) {
      if (currentLine) lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine += word + ' ';
    }
  }
  if (currentLine) lines.push(currentLine.trim());
  
  const titleYStart = 450 - ((lines.length - 1) * 35);
  
  const titleTexts = lines.map((line, i) => 
    `<text x="300" y="${titleYStart + (i * 75)}" text-anchor="middle" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="white" style="text-shadow: 2px 4px 10px rgba(0,0,0,0.5);">${line}</text>`
  ).join('');

  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
      <defs>
        <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="hsl(${hue1}, 75%, 40%)"/>
          <stop offset="100%" stop-color="hsl(${hue2}, 80%, 20%)"/>
        </linearGradient>
        <pattern id="dots" x="0" y="0" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="15" cy="15" r="1.5" fill="rgba(255,255,255,0.08)" />
        </pattern>
      </defs>
      <rect width="600" height="900" fill="url(#bg)"/>
      <rect width="600" height="900" fill="url(#dots)"/>
      
      <!-- Top banner -->
      <path d="M 0 0 L 220 0 L 180 55 L 0 55 Z" fill="rgba(255,255,255,0.15)"/>
      <text x="30" y="35" font-family="Arial, sans-serif" font-size="20" font-weight="bold" fill="white" letter-spacing="1" text-transform="uppercase">${category.substring(0, 15)}</text>
      
      <!-- Abstract shapes -->
      <circle cx="300" cy="450" r="220" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="60"/>
      <circle cx="300" cy="450" r="140" fill="rgba(255,255,255,0.05)"/>
      
      ${titleTexts}
      
      <!-- Author Footer -->
      <rect x="0" y="780" width="600" height="120" fill="rgba(0,0,0,0.25)"/>
      <text x="300" y="850" text-anchor="middle" font-family="Arial, sans-serif" font-size="30" font-weight="600" fill="rgba(255,255,255,0.9)" letter-spacing="1.5">${author}</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function normalizeBook(book) {
  const fileSize = Number(book.file_size || 0);
  const coverImageUrl = book.cover_image_url || book.cover_url || '';

  let finalCoverUrl;
  if (coverImageUrl.startsWith('storage:')) {
    finalCoverUrl = `/api/books/${book.id}/cover`;
  } else if (coverImageUrl.startsWith('data:') || coverImageUrl.startsWith('/covers/') || coverImageUrl.includes('openlibrary.org')) {
    finalCoverUrl = coverImageUrl;
  } else {
    // Ignore external URLs (like the Amazon seed ones) so ALL books use the engaging generated cover
    finalCoverUrl = generatedCover(book);
  }

  return {
    id: book.id,
    title: book.title,
    author: book.author,
    category: book.category || book.subject || 'General',
    cover_image_url: finalCoverUrl,
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

function isImageFile(file) {
  return file
    && (file.mimetype?.startsWith('image/') || /\.(png|jpe?g|webp|gif)$/i.test(file.originalname));
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

      if (existingBook) {
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

app.get('/api/books/:id/cover', async (req, res) => {
  try {
    if (!requireSupabase(res)) {
      return;
    }

    const { data: book, error: fetchError } = await supabase
      .from('books')
      .select('cover_image_url')
      .eq('id', req.params.id)
      .single();

    if (fetchError) {
      throw fetchError;
    }

    if (!book.cover_image_url) {
      return res.status(404).send('Cover not found');
    }

    if (/^https?:\/\//i.test(book.cover_image_url)) {
      return res.redirect(book.cover_image_url);
    }

    const storagePath = book.cover_image_url.replace(/^storage:/, '');
    const { data, error } = await supabase
        .storage
        .from(BOOKS_BUCKET)
        .createSignedUrl(storagePath, 60 * 10);

    if (error) {
      throw error;
    }

    res.redirect(data.signedUrl);
  } catch (err) {
    console.error('Error loading cover:', err);
    res.status(500).send('Failed to load cover');
  }
});

app.post('/api/books', upload.fields([
  { name: 'book_file', maxCount: 1 },
  { name: 'cover_file', maxCount: 1 }
]), async (req, res) => {
  try {
    if (!requireSupabase(res)) {
      return;
    }

    const { title, author, category, cover_image_url } = req.body;
    const file = req.files?.book_file?.[0];
    const coverFile = req.files?.cover_file?.[0];

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

    if (coverFile && !isImageFile(coverFile)) {
      return res.status(400).json({
        error: 'Please upload a valid cover image.'
      });
    }

    let storagePath = '';
    let coverImageUrl = cover_image_url || '';

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

    if (coverFile) {
      coverImageUrl = `data:${coverFile.mimetype || 'image/jpeg'};base64,${coverFile.buffer.toString('base64')}`;
    }

    let { data, error } = await supabase
      .from('books')
      .insert(toSupabaseBook({
        title,
        author,
        category: category || 'General',
        cover_image_url: coverImageUrl,
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
