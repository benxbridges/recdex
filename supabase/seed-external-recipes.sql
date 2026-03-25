-- ===== SEED EXTERNAL RECIPES =====
-- Add description column if it doesn't exist yet
ALTER TABLE external_recipes ADD COLUMN IF NOT EXISTS description TEXT;

-- Clear existing external recipes (safe for seed data)
DELETE FROM external_recipes;

INSERT INTO external_recipes (title, source_name, source_url, description, cuisine, time_estimate, matched_recipe_slug, status) VALUES

-- ===== EXISTING 4 (with descriptions added) =====
('Crispy Salt and Pepper Chicken Thighs', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1017161-crispy-salt-and-pepper-chicken-thighs', 'Bone-in thighs roasted until the skin shatters, with a heavy hand of black pepper and flaky salt.', 'American', '45 min', 'chicken-tikka-masala', 'active'),

('BA''s Best Bolognese', 'Bon Appétit', 'https://www.bonappetit.com/recipe/best-bolognese', 'A rich, slow-simmered meat sauce with milk and white wine that rewards patience.', 'Italian', '3 hr', 'classic-ragu', 'active'),

('Halal Cart-Style Chicken and Rice', 'Serious Eats', 'https://www.seriouseats.com/halal-cart-style-chicken-and-rice-white-sauce-recipe', 'A home version of the iconic NYC street cart platter, complete with the legendary white sauce.', 'American', '1 hr', NULL, 'active'),

('Tangy Pomegranate Chicken', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1017062-tangy-pomegranate-chicken', 'Braised chicken thighs in a glossy pomegranate molasses sauce with warm spices.', 'Middle Eastern', '50 min', 'chicken-shawarma', 'active'),

-- ===== NEW RECIPES =====

-- 5. Bon Appétit
('Cacio e Pepe', 'Bon Appétit', 'https://www.bonappetit.com/recipe/cacio-e-pepe', 'Just pasta, pecorino, and black pepper — deceptively simple, endlessly debated.', 'Italian', '25 min', NULL, 'active'),

-- 6. Serious Eats
('The Best Smash Burgers', 'Serious Eats', 'https://www.seriouseats.com/smash-burger-recipe', 'Thin patties pressed hard on a screaming-hot griddle for maximum crust.', 'American', '20 min', NULL, 'active'),

-- 7. NYT Cooking
('Sheet-Pan Chicken Tikka', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1020093-sheet-pan-chicken-tikka', 'Yogurt-marinated chicken thighs roasted on a sheet pan with charred, spiced edges.', 'Indian', '40 min', 'chicken-tikka-masala', 'active'),

-- 8. Bon Appétit
('Crispy Rice Salad (Nam Khao)', 'Bon Appétit', 'https://www.bonappetit.com/recipe/crispy-rice-salad-nam-khao', 'Crunchy fried rice tossed with herbs, lime, peanuts, and fermented sausage.', 'Thai', '45 min', NULL, 'active'),

-- 9. Serious Eats
('Chili Verde', 'Serious Eats', 'https://www.seriouseats.com/chili-verde-recipe', 'A tangy, deeply green pork stew built on roasted tomatillos and poblanos.', 'Mexican', '2 hr', NULL, 'active'),

-- 10. NYT Cooking
('Caramelized Shallot Pasta', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1022733-caramelized-shallot-pasta', 'Sweet, jammy shallots melted down with butter and tossed with parmesan and pasta.', 'Italian', '30 min', NULL, 'active'),

-- 11. Epicurious
('Marcella Hazan''s Tomato Sauce', 'Epicurious', 'https://www.epicurious.com/recipes/food/views/marcella-hazans-tomato-sauce', 'Three ingredients — canned tomatoes, butter, and an onion — that changed how a generation cooks.', 'Italian', '45 min', NULL, 'active'),

-- 12. Food52
('Shakshuka', 'Food52', 'https://food52.com/recipes/84498-best-shakshuka-recipe', 'Eggs poached in a spiced, garlicky tomato sauce — the ultimate one-pan brunch.', 'Middle Eastern', '30 min', NULL, 'active'),

-- 13. Bon Appétit
('Grilled Short Ribs with Ssam Sauce', 'Bon Appétit', 'https://www.bonappetit.com/recipe/grilled-short-ribs-with-ssam-sauce', 'Thin-cut flanken ribs glazed with a sweet-spicy-funky sauce you''ll want on everything.', 'Korean', '1 hr', NULL, 'active'),

-- 14. Serious Eats
('Thai Green Curry', 'Serious Eats', 'https://www.seriouseats.com/thai-green-curry-recipe', 'A bright, coconut-rich curry that comes together fast once the paste is made.', 'Thai', '45 min', NULL, 'active'),

-- 15. NYT Cooking
('Roasted Salmon with Miso Glaze', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1016693-miso-glazed-salmon', 'White miso, mirin, and a hot broiler give salmon a sweet, caramelized crust.', 'Japanese', '25 min', NULL, 'active'),

-- 16. Food52
('Ottolenghi''s Cauliflower Cake', 'Food52', 'https://food52.com/recipes/20553-yotam-ottolenghi-s-cauliflower-cake', 'A golden, custardy cauliflower cake loaded with herbs — part frittata, part side dish, all good.', 'Mediterranean', '1 hr', NULL, 'active'),

-- 17. Epicurious
('Classic Chicken Parm', 'Epicurious', 'https://www.epicurious.com/recipes/food/views/chicken-parmesan', 'Crispy breaded cutlets smothered in marinara and melted mozzarella. The one everyone loves.', 'Italian-American', '45 min', NULL, 'active'),

-- 18. Serious Eats
('Mapo Tofu', 'Serious Eats', 'https://www.seriouseats.com/real-deal-mapo-tofu-recipe', 'Silky tofu in a fiery, mouth-numbing sauce of doubanjiang, Sichuan peppercorn, and ground pork.', 'Chinese', '30 min', NULL, 'active'),

-- 19. NYT Cooking
('Spicy Lamb Meatballs with Raisins and Pine Nuts', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1017750-spicy-lamb-meatballs-with-raisins-and-pine-nuts', 'Warmly spiced lamb meatballs with a sweet-savory twist from golden raisins and toasted pine nuts.', 'Mediterranean', '40 min', NULL, 'active'),

-- 20. Bon Appétit
('Coconut Rice with Chicken and Ginger', 'Bon Appétit', 'https://www.bonappetit.com/recipe/coconut-rice-chicken-ginger', 'A one-pot rice dish simmered in coconut milk with chicken thighs and plenty of fresh ginger.', 'Southeast Asian', '45 min', NULL, 'active'),

-- 21. Epicurious
('Skillet Charred Green Beans', 'Epicurious', 'https://www.epicurious.com/recipes/food/views/skillet-charred-green-beans', 'Green beans blistered in a ripping-hot skillet with garlic and a splash of soy sauce.', 'American', '15 min', NULL, 'active'),

-- 22. Food52
('Genius Lemon Chicken', 'Food52', 'https://food52.com/recipes/19682-genius-lemon-chicken', 'Bone-in pieces slow-roasted with sliced lemons until golden and impossibly tender.', 'Italian', '1 hr 15 min', NULL, 'active'),

-- 23. Serious Eats
('Detroit-Style Pizza', 'Serious Eats', 'https://www.seriouseats.com/detroit-style-pizza-recipe', 'A thick, airy crust baked in an oiled pan with cheese pushed to the edges for crispy, caramelized corners.', 'American', '2 hr', NULL, 'active'),

-- 24. NYT Cooking
('Gochujang Buttered Noodles', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1024136-gochujang-buttered-noodles', 'A 15-minute weeknight noodle toss with butter, gochujang, and a hit of lime.', 'Korean-Inspired', '15 min', NULL, 'active'),

-- ===== FRENCH CUISINE (added 2026-03-25) =====

-- 25. NYT Cooking
('Coq au Vin', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1017085-coq-au-vin', 'Chicken braised in red wine with bacon, mushrooms, and pearl onions until the sauce turns glossy and deeply flavored.', 'French', '1 hr 30 min', 'coq-au-vin', 'active'),

-- 26. Bon Appétit
('Beef Bourguignon', 'Bon Appétit', 'https://www.bonappetit.com/recipe/beef-bourguignon', 'Beef chuck braised low and slow in a full bottle of red wine with bacon, mushrooms, and pearl onions.', 'French', '3 hr', 'beef-bourguignon', 'active'),

-- 27. NYT Cooking
('Ratatouille', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1014721-ratatouille', 'A Provençal vegetable stew where eggplant, zucchini, and peppers keep their identity in a garlicky tomato base.', 'French', '1 hr', 'ratatouille', 'active'),

-- 28. Serious Eats
('Duck Confit', 'Serious Eats', 'https://www.seriouseats.com/duck-confit-recipe', 'Duck legs cured in salt and herbs, then slowly submerged in their own fat until impossibly tender.', 'French', '1 hr active + overnight cure', 'duck-confit', 'active'),

-- 29. NYT Cooking
('Cassoulet', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1018529-cassoulet', 'A slow-baked casserole of white beans, pork sausage, and duck confit from southwestern France.', 'French', '4 hr', 'cassoulet', 'active'),

-- 30. Bon Appétit
('Croque Monsieur', 'Bon Appétit', 'https://www.bonappetit.com/recipe/croque-monsieur', 'A French ham and cheese sandwich blanketed in béchamel and broiled until bubbling and golden.', 'French', '30 min', 'croque-monsieur', 'active'),

-- 31. Bon Appétit
('Niçoise Salad', 'Bon Appétit', 'https://www.bonappetit.com/recipe/nicoise-salad', 'A composed salad from Nice with seared tuna, tender potatoes, green beans, and a sharp Dijon vinaigrette.', 'French', '40 min', 'nicoise-salad', 'active'),

-- 32. NYT Cooking
('Tarte Tatin', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1013264-tarte-tatin', 'An upside-down apple tart where fruit caramelizes in butter and sugar before being topped with pastry.', 'French', '1 hr 15 min', 'tarte-tatin', 'active'),

-- 33. NYT Cooking
('Gougères', 'NYT Cooking', 'https://cooking.nytimes.com/recipes/1012748-gougeres', 'Airy French cheese puffs made from choux pastry and gruyère — crisp shell, hollow cheesy center.', 'French', '50 min', 'gougeres', 'active'),

-- 34. Bon Appétit
('Madeleines', 'Bon Appétit', 'https://www.bonappetit.com/recipe/madeleines', 'Buttery French tea cakes with a lemon perfume and the signature bump on top.', 'French', '30 min + 1 hr chill', 'madeleines', 'active');
