-- One-off rebrand: Acree / ACREE -> Pixel Tavern
-- Updates stored page JSON in drafts, published pages, and revision history.
--
-- Local:
--   npx wrangler d1 execute acree-db --local --file=src/db/migrate-rebrand-to-pixel-tavern.sql
-- Remote:
--   npx wrangler d1 execute acree-db --remote --file=src/db/migrate-rebrand-to-pixel-tavern.sql

UPDATE page_drafts
SET content_json = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(content_json, 'Join the ACREE Guild', 'Join the Pixel Tavern'),
        'ACREE Guild', 'Pixel Tavern'
      ),
      'ACREE', 'Pixel Tavern'
    ),
    'Acree', 'Pixel Tavern'
  ),
  'Join the Pixel Tavern Guild', 'Join the Pixel Tavern'
)
WHERE content_json LIKE '%ACREE%'
   OR content_json LIKE '%Acree%'
   OR content_json LIKE '%ACREE Guild%';

UPDATE page_published
SET content_json = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(content_json, 'Join the ACREE Guild', 'Join the Pixel Tavern'),
        'ACREE Guild', 'Pixel Tavern'
      ),
      'ACREE', 'Pixel Tavern'
    ),
    'Acree', 'Pixel Tavern'
  ),
  'Join the Pixel Tavern Guild', 'Join the Pixel Tavern'
)
WHERE content_json LIKE '%ACREE%'
   OR content_json LIKE '%Acree%'
   OR content_json LIKE '%ACREE Guild%';

UPDATE page_revisions
SET content_json = REPLACE(
  REPLACE(
    REPLACE(
      REPLACE(
        REPLACE(content_json, 'Join the ACREE Guild', 'Join the Pixel Tavern'),
        'ACREE Guild', 'Pixel Tavern'
      ),
      'ACREE', 'Pixel Tavern'
    ),
    'Acree', 'Pixel Tavern'
  ),
  'Join the Pixel Tavern Guild', 'Join the Pixel Tavern'
)
WHERE content_json LIKE '%ACREE%'
   OR content_json LIKE '%Acree%'
   OR content_json LIKE '%ACREE Guild%';
