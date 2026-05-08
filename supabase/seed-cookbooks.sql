-- Seed list — 10 cookbooks. Replace bookshop_url / amazon_url with your real
-- affiliate-tagged URLs once your Bookshop.org affiliate ID + Amazon Associates
-- tracking ID are set up. (Bookshop affiliate IDs follow the pattern
-- bookshop.org/a/<your-id>/<book-id>; Amazon adds ?tag=<your-tag>-20.)

INSERT INTO cookbooks (title, author, cover_url, blurb, bookshop_url, amazon_url, sort_order, featured) VALUES
  ('Salt, Fat, Acid, Heat',     'Samin Nosrat',
   'https://m.media-amazon.com/images/I/91qxRX0JkfL._SL1500_.jpg',
   'The four-element framework that retrains how you taste while you cook.',
   'https://bookshop.org/p/books/salt-fat-acid-heat-mastering-the-elements-of-good-cooking-samin-nosrat/6553334',
   'https://www.amazon.com/Salt-Fat-Acid-Heat-Mastering/dp/1476753830',
   10, true),

  ('The Food Lab',              'J. Kenji López-Alt',
   'https://m.media-amazon.com/images/I/91p1zEbKtKL._SL1500_.jpg',
   'Why recipes work, by a maniac who tested everything until they did.',
   'https://bookshop.org/p/books/the-food-lab-better-home-cooking-through-science-j-kenji-lopez-alt/9008552',
   'https://www.amazon.com/Food-Lab-Better-Cooking-Through/dp/0393081087',
   20, false),

  ('Plenty',                    'Yotam Ottolenghi',
   'https://m.media-amazon.com/images/I/81lJN0pUgwL._SL1500_.jpg',
   'Vegetables that don''t apologize. Lemon, herbs, more lemon.',
   'https://bookshop.org/p/books/plenty-vibrant-vegetable-recipes-from-london-s-ottolenghi-yotam-ottolenghi/8584344',
   'https://www.amazon.com/Plenty-Vibrant-Vegetable-Recipes-Ottolenghi/dp/0811876993',
   30, false),

  ('Six Seasons',               'Joshua McFadden',
   'https://m.media-amazon.com/images/I/91xcMa-S+pL._SL1500_.jpg',
   'A vegetable-first calendar for cooks who shop at the market.',
   'https://bookshop.org/p/books/six-seasons-a-new-way-with-vegetables-joshua-mcfadden/8584351',
   'https://www.amazon.com/Six-Seasons-New-Way-Vegetables/dp/1579656315',
   40, false),

  ('Madhur Jaffrey''s Indian Cookery', 'Madhur Jaffrey',
   'https://m.media-amazon.com/images/I/81N3rLYbWhL._SL1500_.jpg',
   'The book that put real Indian home cooking into the Western kitchen.',
   'https://bookshop.org/p/books/madhur-jaffrey-s-indian-cookery-madhur-jaffrey/14497998',
   'https://www.amazon.com/Madhur-Jaffreys-Indian-Cookery/dp/0563362626',
   50, false),

  ('Jubilee',                   'Toni Tipton-Martin',
   'https://m.media-amazon.com/images/I/91Yp6t4FE4L._SL1500_.jpg',
   'Two centuries of African American cooking, reframed and made now.',
   'https://bookshop.org/p/books/jubilee-recipes-from-two-centuries-of-african-american-cooking-toni-tipton-martin/9011533',
   'https://www.amazon.com/Jubilee-Recipes-Centuries-African-American/dp/1524761737',
   60, false),

  ('Mastering the Art of French Cooking', 'Julia Child',
   'https://m.media-amazon.com/images/I/81Yz1k6f7TL._SL1500_.jpg',
   'The patron saint. Still the best place to learn technique.',
   'https://bookshop.org/p/books/mastering-the-art-of-french-cooking-volume-1-julia-child/9001245',
   'https://www.amazon.com/Mastering-Art-French-Cooking-Vol/dp/0375413405',
   70, false),

  ('Joy of Cooking',            'Irma S. Rombauer et al.',
   'https://m.media-amazon.com/images/I/91ZxIxV9LWL._SL1500_.jpg',
   'The encyclopedia. When you forget how long to roast something, ask Joy.',
   'https://bookshop.org/p/books/joy-of-cooking-2019-edition-fully-revised-and-updated-irma-s-rombauer/12116068',
   'https://www.amazon.com/Joy-Cooking-2019-Fully-Revised/dp/1501169718',
   80, false),

  ('Home Cooking',              'Laurie Colwin',
   'https://m.media-amazon.com/images/I/71qC7m6HpJL._SL1500_.jpg',
   'Essays about cooking, mostly. The warmest book on this list.',
   'https://bookshop.org/p/books/home-cooking-a-writer-in-the-kitchen-laurie-colwin/8584350',
   'https://www.amazon.com/Home-Cooking-Writer-Kitchen-Vintage/dp/0307474410',
   90, false),

  ('The Zuni Cafe Cookbook',    'Judy Rodgers',
   'https://m.media-amazon.com/images/I/81ZlHvzv1zL._SL1500_.jpg',
   'Salt early, cook slowly, taste constantly. The roast chicken alone.',
   'https://bookshop.org/p/books/the-zuni-cafe-cookbook-a-compendium-of-recipes-and-cooking-lessons-from-san-francisco-s-beloved-restaurant-judy-rodgers/9001540',
   'https://www.amazon.com/Zuni-Cafe-Cookbook-Compendium-Francisco/dp/0393020436',
   100, false);
