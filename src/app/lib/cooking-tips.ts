// ===== COOKING TECHNIQUE TIPS =====
// Keyword-triggered educational tips that appear alongside recipe steps.
// Voice: warm, slightly conversational, educational — the RecDex house voice.

export type CookingTip = {
  id: string
  trigger: RegExp
  title: string
  tip: string
}

const TIPS: CookingTip[] = [
  {
    id: 'salt-water',
    trigger: /\b(boil|boiling)\b.*\bwater\b/i,
    title: 'Salting your water',
    tip: 'Aim for about 1 tablespoon of kosher salt per quart — it should taste noticeably salty, almost like the sea. This is your only chance to season the pasta from the inside.',
  },
  {
    id: 'sear',
    trigger: /\bsear\b/i,
    title: 'Getting a good sear',
    tip: 'Pat the surface completely dry and let the pan get very hot before adding anything. Once it\'s in, resist the urge to move it — a good crust needs uninterrupted contact with the heat.',
  },
  {
    id: 'resting-meat',
    trigger: /\b(let\s+rest|rest\s+for)\b.*\bminute/i,
    title: 'Why resting matters',
    tip: 'Resting lets the juices redistribute evenly through the meat. The internal temperature will also continue climbing 5–10°F, so pull it just before your target.',
  },
  {
    id: 'preheat-oven',
    trigger: /\bpreheat\b.*\boven\b/i,
    title: 'Give it time to preheat',
    tip: 'Most ovens need a good 15–20 minutes to actually reach temperature, even after the indicator says they\'re ready. An oven thermometer is a worthwhile investment.',
  },
  {
    id: 'caramelize',
    trigger: /\bcaramelize\b/i,
    title: 'Caramelization',
    tip: 'The key is patience — resist stirring too often. Sugars need sustained contact with the hot surface to develop deep, complex flavor.',
  },
  {
    id: 'deglaze',
    trigger: /\bdeglaze\b/i,
    title: 'Deglazing the pan',
    tip: 'Those brown bits stuck to the bottom are called fond, and they\'re packed with flavor. A splash of wine, stock, or even water will lift them right off.',
  },
  {
    id: 'al-dente',
    trigger: /\bal dente\b/i,
    title: 'Al dente timing',
    tip: 'Pull your pasta about a minute before the package time. It\'ll finish cooking in the sauce, absorbing more flavor along the way.',
  },
  {
    // Meat-specific tempering — higher priority than the dairy variant so
    // meat recipes don't get the butter/eggs advice by accident.
    id: 'room-temp-meat',
    trigger: /\broom\s+temperature\b[\s\S]{0,200}\b(meat|steak|steaks?|chop|chops?|pork|chicken|lamb|beef|roast|turkey|duck|ribs?)\b|\b(meat|steak|steaks?|chop|chops?|pork|chicken|lamb|beef|roast|turkey|duck|ribs?)\b[\s\S]{0,200}\broom\s+temperature\b/i,
    title: 'Tempering the meat',
    tip: 'Letting meat come up from the fridge helps it brown evenly and keeps the outside from overcooking while the center catches up. 15–30 minutes on the counter is usually enough for chops and steaks; an hour for larger roasts.',
  },
  {
    id: 'room-temp-bake',
    trigger: /\broom\s+temperature\b[\s\S]{0,200}\b(butter|eggs?|dairy|cream\s+cheese|milk|cheese|yogurt|buttermilk|sour\s+cream|cheesecake|batter|dough)\b|\b(butter|eggs?|dairy|cream\s+cheese|cheesecake|batter|dough)\b[\s\S]{0,200}\broom\s+temperature\b/i,
    title: 'Room-temp matters',
    tip: 'Cold butter or eggs can break emulsions and create uneven textures. About 30–60 minutes on the counter is usually enough. In a rush: microwave butter in 5-second pulses, or warm eggs in a bowl of lukewarm water.',
  },
  {
    id: 'folding',
    trigger: /\bfold\b.*\b(in|into|gently|carefully)\b/i,
    title: 'Folding technique',
    tip: 'Cut down the center with a spatula, sweep along the bottom, and fold the mixture over. Rotate the bowl 90° and repeat — the goal is to keep as much air in as possible.',
  },
  {
    id: 'yeast-proofing',
    trigger: /\byeast\b.*\bwarm\b|\bbloom\b.*\byeast\b/i,
    title: 'Proofing yeast',
    tip: 'Your water should be around 105–115°F — warm to the touch but not hot. Water that\'s too hot will kill the yeast before it has a chance to work.',
  },
  {
    id: 'browning-meat',
    trigger: /\bbrown\b.*\b(meat|beef|pork|chicken|lamb)\b|\b(meat|beef|pork|chicken|lamb)\b.*\bbrown/i,
    title: 'Browning meat',
    tip: 'Don\'t crowd the pan — work in batches if needed. Overcrowding drops the temperature and you\'ll steam instead of brown. Make sure each piece has some breathing room.',
  },
  {
    id: 'emulsify',
    trigger: /\bemulsif/i,
    title: 'Building an emulsion',
    tip: 'Add your liquid slowly while whisking constantly. The key to a stable emulsion is gradual incorporation — dump it all in at once and it\'ll likely break.',
  },
  {
    id: 'bloom-spices',
    trigger: /\bbloom\b.*\bspice|\btoast\b.*\bspice|\bspice.*\b(toast|bloom)\b/i,
    title: 'Blooming spices',
    tip: 'Heating ground spices in oil or dry-toasting whole spices wakes up their essential oils. You\'ll know they\'re ready when the aroma hits you — usually 30–60 seconds.',
  },
  {
    id: 'reduce',
    trigger: /\breduce\b.*\b(half|third|sauce|liquid)\b/i,
    title: 'Reducing a sauce',
    tip: 'Keep the heat at a steady simmer and don\'t cover the pot — you want steam to escape. The sauce will concentrate in both flavor and body as the water evaporates.',
  },
  {
    id: 'season-taste',
    trigger: /\bseason\b.*\btaste\b|\btaste\b.*\badjust/i,
    title: 'Seasoning to taste',
    tip: 'Add salt in small increments, tasting after each addition. You\'re looking for the point where the flavors brighten and come alive — not where it tastes salty.',
  },
  {
    id: 'roux',
    trigger: /\broux\b/i,
    title: 'Making a roux',
    tip: 'Equal parts fat and flour, stirred constantly over medium heat. A light roux (2–3 minutes) thickens without much flavor change. A dark roux (15–45 minutes) adds deep, nutty flavor but thickens less.',
  },
  {
    id: 'blanch',
    trigger: /\bblanch\b/i,
    title: 'Blanching',
    tip: 'Have a bowl of ice water ready before you start. The quick plunge from boiling to ice-cold stops the cooking instantly and locks in vibrant color and texture.',
  },
  {
    id: 'knead-dough',
    trigger: /\bknead\b/i,
    title: 'Kneading dough',
    tip: 'Push with the heel of your hand, fold, rotate, repeat. You\'ll know it\'s ready when the dough springs back gently when poked and feels smooth, not sticky.',
  },
  {
    id: 'mise-en-place',
    trigger: /\bprep\b.*\b(all|everything)\b.*\bbefore\b|\bmise en place\b/i,
    title: 'Mise en place',
    tip: 'Get everything measured, chopped, and ready before you turn on the heat. Once cooking starts, things move fast — having everything within reach makes all the difference.',
  },
  {
    id: 'simmer-vs-boil',
    trigger: /\bgentle\s+simmer\b|\bsimmer\b.*\blow\b/i,
    title: 'Gentle simmer',
    tip: 'Look for small, lazy bubbles rising occasionally to the surface — not a rolling boil. Too high and your sauce will reduce too fast or your proteins will toughen.',
  },
  {
    id: 'rest-dough',
    trigger: /\blet\b.*\bdough\b.*\brise\b|\brise\b.*\bdoubled\b/i,
    title: 'Letting dough rise',
    tip: 'Find a warm, draft-free spot — inside the oven with just the light on works great. The dough should roughly double in size, which usually takes 1–1.5 hours at room temperature.',
  },
  {
    id: 'sharp-knife',
    trigger: /\bthinly\s+slice\b|\bfinely\s+(chop|dice|mince)\b/i,
    title: 'Knife work',
    tip: 'A sharp knife is a safe knife — it goes where you want it to instead of slipping. Curl your fingertips under and use your knuckles as a guide for the blade.',
  },
  {
    id: 'pasta-water',
    trigger: /\bpasta\s+water\b.*\b(reserve|save|starchy)\b|\breserve\b.*\bpasta\s+water\b/i,
    title: 'Saving pasta water',
    tip: 'That starchy water is liquid gold for sauces. The starch helps emulsify fat and water into a silky, clingy sauce. Ladle out a cup before you drain.',
  },

  // ─── Garlic & aromatics ───────────────────────────────────────────────

  {
    id: 'mincing-garlic',
    trigger: /\b(mince|minced)\b.*\bgarlic\b|\bgarlic\b.*\b(mince|minced)\b/i,
    title: 'Mincing garlic',
    tip: 'Crush the clove with the flat of your knife first — it breaks the cell walls and makes mincing much easier. The finer the mince, the more garlic flavor you\'ll release.',
  },
  {
    id: 'cooking-garlic',
    trigger: /\b(cook|sauté|saute|fry|stir)\b.*\bgarlic\b|\bgarlic\b.*\b(cook|fragrant|golden)\b/i,
    title: 'Don\'t burn the garlic',
    tip: 'Garlic goes from golden to burnt in seconds. Add it after your onions have softened, stir constantly, and pull the pan off heat the moment it smells fragrant — about 30–60 seconds.',
  },
  {
    id: 'sweat-onions',
    trigger: /\b(sweat|soften|cook)\b.*\bonions?\b.*\b(translucent|soft|clear)\b|\bonions?\b.*\b(translucent|softened|soft)\b/i,
    title: 'Sweating onions',
    tip: 'Keep the heat at medium-low and stir occasionally. You want them to soften and turn translucent without taking on color — this usually takes 5–7 minutes. A pinch of salt speeds things up.',
  },
  {
    id: 'caramelize-onions',
    trigger: /\bcaramelize\b.*\bonions?\b|\bonions?\b.*\bcaramelize/i,
    title: 'Caramelizing onions',
    tip: 'Real caramelized onions take 30–45 minutes over low heat — there\'s no shortcut. Stir every few minutes and add a splash of water if the pan gets too dark. The result is worth every minute.',
  },

  // ─── Oil & heat management ────────────────────────────────────────────

  {
    id: 'hot-oil',
    trigger: /\b(heat|hot)\b.*\boil\b.*\b(shimmer|smoke|ripple)\b|\boil\b.*\b(shimmer|smoking|hot)\b/i,
    title: 'Reading your oil',
    tip: 'Shimmering oil means it\'s ready for cooking. If it\'s smoking, it\'s too hot — pull the pan off the heat for a moment. Different oils have different smoke points: avocado and refined peanut oil handle high heat well.',
  },
  {
    id: 'medium-heat',
    trigger: /\bmedium(-|\s)high\s+heat\b|\bhigh\s+heat\b.*\b(pan|skillet|wok)\b/i,
    title: 'High heat cooking',
    tip: 'Let the pan heat up for a full minute before adding oil, then another 30 seconds before adding food. A properly preheated pan is the difference between a sear and a steam.',
  },

  // ─── Protein techniques ───────────────────────────────────────────────

  {
    id: 'pat-dry',
    trigger: /\bpat\b.*\bdry\b|\bdry\b.*\b(paper\s+towel|towel)\b|\bpat\b.*\b(chicken|meat|fish|steak|pork|tofu)\b/i,
    title: 'Drying the surface',
    tip: 'Moisture is the enemy of browning. Take an extra 30 seconds to really pat things dry — it\'s the single biggest factor in getting a good crust on proteins.',
  },
  {
    id: 'marinate',
    trigger: /\bmarinate\b.*\b(hour|minute|overnight|refrigerat)\b|\bmarinate\s+for\b/i,
    title: 'Marinating',
    tip: 'Acidic marinades (citrus, vinegar) work fast — 30 minutes to 2 hours is usually plenty. Longer than that and the acid can start to break down the texture. Oil-based marinades are more forgiving.',
  },
  {
    id: 'brine',
    trigger: /\b(dry\s+)?brine\b/i,
    title: 'Brining',
    tip: 'Brining seasons meat all the way through, not just the surface. For a dry brine, use about ½ teaspoon of kosher salt per pound and let it sit uncovered in the fridge overnight.',
  },
  {
    id: 'score-meat',
    trigger: /\bscore\b.*\b(skin|fat|meat|duck|pork|chicken|fish)\b|\b(skin|fat)\b.*\bscore\b/i,
    title: 'Scoring',
    tip: 'Cut shallow crosshatch lines through the skin or fat cap — about ¼ inch deep. This helps fat render out evenly and lets marinades and seasoning penetrate deeper.',
  },
  {
    id: 'dont-move-it',
    trigger: /\b(don'?t|do\s+not|without)\b.*\b(move|touch|disturb)\b|\bundisturbed\b|\bwithout\s+(flip|turn)/i,
    title: 'Leave it alone',
    tip: 'When meat releases easily from the pan, it\'s ready to flip. If it\'s sticking, it needs more time. Patience here is what gives you that restaurant-quality crust.',
  },
  {
    id: 'internal-temp',
    trigger: /\binternal\s+temp|\b(thermometer|temp)\b.*\b(read|insert|check)\b|\bdegrees?\b.*\b(internal|center)\b/i,
    title: 'Using a thermometer',
    tip: 'Insert into the thickest part, away from bone. Chicken is done at 165°F, medium-rare steak at 130°F, pork at 145°F. A $15 instant-read thermometer is the most useful tool you can own.',
  },

  // ─── Vegetable prep ───────────────────────────────────────────────────

  {
    id: 'dice-onion',
    trigger: /\b(dice|diced)\b.*\bonion\b|\bonion\b.*\b(dice|diced)\b/i,
    title: 'Dicing an onion',
    tip: 'Cut in half through the root, peel, make horizontal cuts toward the root, then vertical cuts, then slice across. Keep the root end intact — it holds everything together while you cut.',
  },
  {
    id: 'chop-herbs',
    trigger: /\b(chop|chopped|mince|minced)\b.*\b(herbs?|parsley|cilantro|basil|mint|dill|chives)\b/i,
    title: 'Chopping fresh herbs',
    tip: 'Stack the leaves, roll them up like a cigar, then slice across. Don\'t over-chop or you\'ll bruise them and lose flavor. For garnishes, chop just before serving to keep them vibrant.',
  },
  {
    id: 'zest-citrus',
    trigger: /\bzest\b.*\b(lemon|lime|orange|citrus|grapefruit)\b|\b(lemon|lime|orange)\b.*\bzest\b/i,
    title: 'Zesting citrus',
    tip: 'Only take the colorful outer layer — the white pith underneath is bitter. Use light pressure with a microplane and rotate the fruit as you go. One lemon gives you about a tablespoon of zest.',
  },
  {
    id: 'roast-vegetables',
    trigger: /\broast\b.*\b(vegetables?|veggies|broccoli|cauliflower|carrots?|potatoes?|squash)\b/i,
    title: 'Roasting vegetables',
    tip: 'Spread them out in a single layer with space between pieces — crowding leads to steaming. Higher heat (425–450°F) and a bit more oil than you think gives you the best caramelized edges.',
  },
  {
    id: 'salt-eggplant',
    trigger: /\bsalt\b.*\beggplant\b|\beggplant\b.*\bsalt\b|\bsweat\b.*\beggplant\b/i,
    title: 'Salting eggplant',
    tip: 'Salting draws out excess moisture and bitterness. Spread the slices on a sheet, salt generously, and let them sit for 20–30 minutes. Pat dry before cooking — they\'ll absorb less oil and brown better.',
  },

  // ─── Baking & dough ───────────────────────────────────────────────────

  {
    id: 'cream-butter-sugar',
    trigger: /\bcream\b.*\bbutter\b.*\bsugar\b|\bbeat\b.*\bbutter\b.*\bsugar\b/i,
    title: 'Creaming butter and sugar',
    tip: 'Beat until the mixture is pale and fluffy — usually 3–5 minutes on medium-high. This isn\'t just mixing; you\'re aerating the batter, which is what makes your bake light and tender.',
  },
  {
    id: 'sift-flour',
    trigger: /\bsift\b.*\b(flour|cocoa|powder|dry\s+ingredients)\b/i,
    title: 'Sifting',
    tip: 'Sifting breaks up clumps and aerates the flour, which helps it incorporate more evenly. Especially important for cocoa powder, which clumps stubbornly.',
  },
  {
    id: 'egg-whites',
    trigger: /\b(whip|beat|whisk)\b.*\begg\s+whites?\b|\begg\s+whites?\b.*\b(stiff|soft)\s+peaks\b/i,
    title: 'Whipping egg whites',
    tip: 'Make sure your bowl and whisk are completely clean and grease-free — even a trace of fat will prevent the whites from whipping. Room-temperature whites whip faster and to greater volume.',
  },
  {
    id: 'cold-butter-pastry',
    trigger: /\bcold\s+butter\b.*\b(flour|pastry|dough|crust)\b|\b(cut|work)\b.*\bbutter\b.*\bflour\b/i,
    title: 'Cold butter in pastry',
    tip: 'Those little pockets of cold butter are what create flaky layers. If the dough starts feeling warm or greasy, pop it back in the fridge for 15 minutes before continuing.',
  },
  {
    id: 'window-pane',
    trigger: /\bwindow\s*pane\b|\bstretch\b.*\bdough\b.*\bthin\b/i,
    title: 'The windowpane test',
    tip: 'Pinch off a small piece and gently stretch it between your fingers. If you can stretch it thin enough to see light through without it tearing, the gluten is fully developed.',
  },

  // ─── Sauce & liquid techniques ────────────────────────────────────────

  {
    id: 'make-slurry',
    trigger: /\bslurry\b|\bcornstarch\b.*\b(water|cold|mix)\b/i,
    title: 'Making a slurry',
    tip: 'Always mix cornstarch with cold liquid before adding to a hot sauce — adding it directly creates lumps. Once added, bring the sauce to a boil for a minute to activate its thickening power.',
  },
  {
    id: 'mount-butter',
    trigger: /\b(swirl|stir|whisk)\b.*\bbutter\b.*\b(off\s+heat|finish|sauce)\b|\bfinish\b.*\bwith\s+butter\b/i,
    title: 'Finishing with butter',
    tip: 'Swirl in cold butter off the heat, a piece at a time. It adds body, sheen, and richness to any pan sauce. Keep the pan moving — if the butter melts too fast it\'ll separate.',
  },
  {
    id: 'toast-nuts',
    trigger: /\btoast\b.*\b(nuts?|almonds?|pecans?|walnuts?|pine\s+nuts?|cashews?|peanuts?|hazelnuts?|sesame)\b/i,
    title: 'Toasting nuts',
    tip: 'Toast in a dry skillet over medium heat, stirring frequently. They go from perfectly golden to burnt in about 15 seconds, so don\'t walk away. Transfer to a plate immediately — they\'ll keep cooking in a hot pan.',
  },
  {
    id: 'temper-eggs',
    trigger: /\btemper\b.*\begg\b|\begg\b.*\btemper\b|\bslowly\s+(add|pour|whisk)\b.*\b(egg|yolk)\b.*\bhot\b/i,
    title: 'Tempering eggs',
    tip: 'Slowly whisk a ladleful of the hot liquid into the beaten eggs first — this brings them up to temperature gradually. Dump cold eggs straight into a hot mixture and you\'ll get scrambled egg soup.',
  },

  // ─── Rice & grains ────────────────────────────────────────────────────

  {
    id: 'rinse-rice',
    trigger: /\b(rinse|wash)\b.*\brice\b|\brice\b.*\b(rinse|wash)\b.*\b(clear|clean|water)\b/i,
    title: 'Rinsing rice',
    tip: 'Rinse until the water runs mostly clear — usually 3–4 changes. This washes off surface starch that would otherwise make the rice gummy. Don\'t skip this for long-grain and basmati.',
  },
  {
    id: 'rice-steam',
    trigger: /\brice\b.*\b(cover|steam|sit|rest|lid)\b.*\b(minutes?|off\s+heat)\b/i,
    title: 'Letting rice steam',
    tip: 'After cooking, turn off the heat and let the rice sit covered for 10 minutes. This lets the moisture redistribute so every grain is evenly fluffy. Resist lifting the lid.',
  },
  {
    id: 'toast-grains',
    trigger: /\btoast\b.*\b(rice|quinoa|farro|bulgur|grain)\b|\b(rice|quinoa|farro)\b.*\btoast\b/i,
    title: 'Toasting grains',
    tip: 'A quick toast in butter or oil before adding liquid brings out a nutty depth. Stir for a couple minutes until you can smell it — that aroma translates directly into flavor.',
  },

  // ─── Wok & stir-fry ──────────────────────────────────────────────────

  {
    id: 'stir-fry',
    trigger: /\bstir[-\s]?fry\b|\bwok\b.*\b(hot|heat|high)\b/i,
    title: 'Stir-fry technique',
    tip: 'Get your wok screaming hot before adding oil. Cook in small batches so the temperature stays high — overcrowding drops the heat and you\'ll braise instead of fry. Everything should sizzle loudly on contact.',
  },

  // ─── Grilling ─────────────────────────────────────────────────────────

  {
    id: 'grill-preheat',
    trigger: /\b(preheat|heat)\b.*\bgrill\b|\bgrill\b.*\b(preheat|hot|medium|high)\b/i,
    title: 'Preheating the grill',
    tip: 'Give your grill a full 10–15 minutes on high to heat up properly. A hot grill sears on contact and prevents sticking. Clean the grates with a brush right before cooking.',
  },

  // ─── Finishing & plating ──────────────────────────────────────────────

  {
    id: 'flaky-salt-finish',
    trigger: /\bflaky\s+salt\b|\bfinishing\s+salt\b|\bMaldon\b/i,
    title: 'Finishing salt',
    tip: 'A sprinkle of flaky salt right before serving adds crunch and bursts of flavor that regular salt can\'t match. Pinch it from up high for even distribution.',
  },
  {
    id: 'fresh-herbs-finish',
    trigger: /\b(top|finish|garnish|sprinkle)\b.*\b(with\s+)?(fresh\s+)?(parsley|cilantro|basil|dill|mint|chives|scallions?|green\s+onions?)\b/i,
    title: 'Finishing with herbs',
    tip: 'Add fresh herbs at the very end — heat kills their brightness. Tear basil by hand instead of cutting to avoid bruising. A little goes a long way.',
  },
  {
    id: 'acid-finish',
    trigger: /\b(squeeze|finish|drizzle|splash)\b.*\b(lemon|lime|vinegar)\b.*\b(over|on|before|just)\b/i,
    title: 'A hit of acid',
    tip: 'A squeeze of lemon or splash of vinegar at the end can transform a dish. If something tastes flat or heavy, it almost always needs acid — not more salt.',
  },
  {
    id: 'drizzle-oil',
    trigger: /\bdrizzle\b.*\b(olive\s+oil|oil)\b.*\b(over|on|top|finish|serve)\b/i,
    title: 'Finishing oil',
    tip: 'Use your best olive oil here — this is where you\'ll actually taste it. A thin drizzle adds richness and makes everything glisten. Save the cooking-grade stuff for the pan.',
  },

  // ─── Deep-frying ──────────────────────────────────────────────────────

  {
    id: 'deep-fry-temp',
    trigger: /\b(deep\s+)?fr(y|ied)\b.*\b(350|360|375|oil)\b|\boil\b.*\b(350|360|375)\b/i,
    title: 'Frying temperature',
    tip: 'Use a thermometer — guessing leads to greasy food. The oil temperature drops when food goes in, so keep the heat slightly higher than your target. Fry in small batches to maintain temperature.',
  },
  {
    id: 'drain-fried',
    trigger: /\b(drain|transfer)\b.*\b(wire\s+rack|paper\s+towel|rack)\b.*\b(fr|crisp|cook)/i,
    title: 'Draining fried food',
    tip: 'A wire rack over a sheet pan is better than paper towels — towels trap steam underneath and make the bottom soggy. Season immediately while the surface is still oily so the salt sticks.',
  },

  // ─── Pickling & preserving ────────────────────────────────────────────

  {
    id: 'pickle',
    trigger: /\bpickle\b|\bpickling\b|\bquick\s+pickle\b/i,
    title: 'Quick pickling',
    tip: 'Equal parts vinegar and water, plus a tablespoon of sugar and salt — that\'s the base. Pour it hot over thinly sliced vegetables and they\'ll be ready in 30 minutes. They keep for weeks in the fridge.',
  },

  // ─── Eggs ─────────────────────────────────────────────────────────────

  {
    id: 'scrambled-eggs',
    trigger: /\bscramble\b.*\beggs?\b|\beggs?\b.*\bscramble/i,
    title: 'Scrambled eggs',
    tip: 'Low heat and patience make all the difference. Stir constantly with a spatula, pulling curds from the edges to the center. Pull the pan off heat while they\'re still slightly wet — carryover heat finishes the job.',
  },
  {
    id: 'poach-eggs',
    trigger: /\bpoach\b.*\beggs?\b|\beggs?\b.*\bpoach/i,
    title: 'Poaching eggs',
    tip: 'Use the freshest eggs you can find — the whites hold together better. A gentle simmer (not a boil) and a splash of vinegar in the water help the whites set neatly around the yolk.',
  },

  // ─── Misc techniques ──────────────────────────────────────────────────

  {
    id: 'bloom-gelatin',
    trigger: /\b(bloom|soften|sprinkle)\b.*\bgelatin\b|\bgelatin\b.*\b(bloom|cold\s+water|soften)\b/i,
    title: 'Blooming gelatin',
    tip: 'Sprinkle the gelatin over cold liquid and let it sit for 5 minutes until it swells and wrinkles. This step ensures it dissolves evenly when heated — skip it and you\'ll get rubbery clumps.',
  },
  {
    id: 'flambe',
    trigger: /\bflamb[eé]\b|\bignite\b.*\balcohol\b/i,
    title: 'Flambéing',
    tip: 'Tilt the pan toward the flame to ignite, or use a long match. Keep your face back and never pour from the bottle over heat. The flames burn off the raw alcohol and leave behind concentrated flavor.',
  },
  {
    id: 'steam-cook',
    trigger: /\bsteam\b.*\b(minutes?|until|covered|basket|rack)\b|\bsteam\s+(the|for)\b/i,
    title: 'Steaming',
    tip: 'Keep the water at a steady boil and don\'t peek too often — every time you lift the lid, you lose steam and add cooking time. Make sure food is in a single layer so steam circulates evenly.',
  },
  {
    id: 'braise',
    trigger: /\bbraise\b|\b(low\s+and\s+slow|covered)\b.*\b(oven|hours?|simmer)\b.*\b(tender|falling)\b/i,
    title: 'Braising',
    tip: 'The liquid should come about halfway up the meat — not fully submerged. Low and slow is the rule: 300–325°F in the oven, lid on, and check it after a couple hours. It\'s done when a fork slides in with zero resistance.',
  },
  {
    id: 'poach-fish',
    trigger: /\bpoach\b.*\b(fish|salmon|cod|halibut)\b|\b(fish|salmon|cod|halibut)\b.*\bpoach/i,
    title: 'Poaching fish',
    tip: 'The liquid should be barely trembling — no bubbles. A true poach at 160–180°F cooks fish gently and keeps it silky. If you see bubbles, lower the heat immediately.',
  },
]

/**
 * Returns matching cooking tips for a given step text.
 * Usually returns 0-1 tips per step. Returns the first match only
 * to avoid overwhelming the cook.
 */
export function getTipsForStep(text: string): CookingTip | null {
  for (const tip of TIPS) {
    if (tip.trigger.test(text)) {
      return tip
    }
  }
  return null
}
