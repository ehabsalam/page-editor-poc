-- Database Schema for ACREE CMS

-- Admin Users (Simple credentials storage)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Pages Core Metadata
CREATE TABLE IF NOT EXISTS pages (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Page Draft Content (Working version)
CREATE TABLE IF NOT EXISTS page_drafts (
  page_id TEXT PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
  content_json TEXT NOT NULL,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Page Published Content (Production version)
CREATE TABLE IF NOT EXISTS page_published (
  page_id TEXT PRIMARY KEY REFERENCES pages(id) ON DELETE CASCADE,
  content_json TEXT NOT NULL,
  published_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Page Revision History (Snapshots)
CREATE TABLE IF NOT EXISTS page_revisions (
  id TEXT PRIMARY KEY,
  page_id TEXT NOT NULL REFERENCES pages(id) ON DELETE CASCADE,
  revision_number INTEGER NOT NULL,
  content_json TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  created_by TEXT REFERENCES users(id)
);

-- Media Assets Metadata (URLs link to Cloudflare R2 bucket)
CREATE TABLE IF NOT EXISTS media_assets (
  id TEXT PRIMARY KEY,
  filename TEXT NOT NULL,
  r2_key TEXT NOT NULL UNIQUE,
  mime_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  url TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Mock Products Table (To power the featured products widget realistically)
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price REAL NOT NULL,
  image_url TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL
);
