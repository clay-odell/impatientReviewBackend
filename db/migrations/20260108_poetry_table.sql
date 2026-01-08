CREATE TABLE poems (
  id SERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  body TEXT NOT NULL,
  citations TEXT, -- optional citations or notes
  status TEXT NOT NULL DEFAULT 'draft', -- 'draft' or 'published'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
