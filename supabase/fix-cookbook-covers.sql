-- Cookbook covers were originally seeded with m.media-amazon.com URLs,
-- but Amazon blocks hotlinks from non-amazon.com domains, so the images
-- 404 on the live preview. Swap to OpenLibrary covers (free, hotlinkable,
-- no API key) keyed by ISBN.
--
-- Pattern: https://covers.openlibrary.org/b/isbn/{isbn}-L.jpg
-- ?default=false makes OpenLibrary 404 if there's no cover (so our
-- onError fallback hides cleanly instead of showing a placeholder image).

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9781476753836-L.jpg?default=false'
  WHERE title = 'Salt, Fat, Acid, Heat';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9780393081084-L.jpg?default=false'
  WHERE title = 'The Food Lab';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9780811876995-L.jpg?default=false'
  WHERE title = 'Plenty';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9781579656317-L.jpg?default=false'
  WHERE title = 'Six Seasons';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9780563362623-L.jpg?default=false'
  WHERE title = 'Madhur Jaffrey''s Indian Cookery';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9781524761738-L.jpg?default=false'
  WHERE title = 'Jubilee';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9780375413407-L.jpg?default=false'
  WHERE title = 'Mastering the Art of French Cooking';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9781501169717-L.jpg?default=false'
  WHERE title = 'Joy of Cooking';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9780307474414-L.jpg?default=false'
  WHERE title = 'Home Cooking';

UPDATE cookbooks SET cover_url = 'https://covers.openlibrary.org/b/isbn/9780393020434-L.jpg?default=false'
  WHERE title = 'The Zuni Cafe Cookbook';

-- Verify
SELECT title, cover_url FROM cookbooks ORDER BY sort_order;
