// ===== SMART INGREDIENT SUBSTITUTIONS =====
// Local database of common substitutions — covers the 80% case with zero latency.
// Falls back to Claude API for unusual/complex ingredients.

export type SubOption = {
  name: string
  ratio: string
  notes?: string
  tags?: ('vegan' | 'dairy-free' | 'gluten-free' | 'nut-free' | 'lower-cal')[]
}

export type Substitution = {
  id: string
  original: string
  aliases: string[]
  subs: SubOption[]
}

// Words to strip when normalizing ingredient names for matching
const STRIP_PREFIXES = [
  'fresh', 'dried', 'frozen', 'canned', 'unsalted', 'salted', 'whole',
  'ground', 'minced', 'chopped', 'diced', 'sliced', 'grated', 'shredded',
  'melted', 'softened', 'cold', 'warm', 'hot', 'room temperature',
  'extra-virgin', 'extra virgin', 'light', 'dark', 'raw', 'cooked',
  'large', 'medium', 'small', 'thin', 'thick', 'fine', 'coarse',
  'packed', 'loosely packed', 'firmly packed', 'sifted',
]

/**
 * Normalize an ingredient name for matching.
 * Strips amounts, prefixes, and common modifiers.
 */
export function normalizeIngredient(name: string): string {
  let n = name.toLowerCase().trim()
  // Strip parenthetical notes
  n = n.replace(/\([^)]*\)/g, '').trim()
  // Strip leading prefixes
  for (const prefix of STRIP_PREFIXES) {
    if (n.startsWith(prefix + ' ')) {
      n = n.slice(prefix.length).trim()
    }
  }
  return n.trim()
}

// ─── THE DATABASE ────────────────────────────────────────────────────────

const SUBSTITUTIONS: Substitution[] = [
  // ── DAIRY ──────────────────────────────────────────────────────────
  {
    id: 'butter',
    original: 'butter',
    aliases: ['unsalted butter', 'salted butter', 'cold butter', 'melted butter'],
    subs: [
      { name: 'Coconut oil', ratio: '1:1', notes: 'Best for baking. Adds slight coconut flavor.', tags: ['vegan', 'dairy-free'] },
      { name: 'Olive oil', ratio: '3/4 cup per 1 cup butter', notes: 'Good for savory dishes. Not ideal for baking.', tags: ['vegan', 'dairy-free'] },
      { name: 'Margarine', ratio: '1:1', notes: 'Closest match for baking and spreading.', tags: ['dairy-free'] },
      { name: 'Applesauce', ratio: '1/2 cup per 1 cup butter', notes: 'For baking only. Reduces fat, adds moisture.', tags: ['vegan', 'dairy-free', 'lower-cal'] },
      { name: 'Ghee', ratio: '1:1', notes: 'Clarified butter — works anywhere butter does. Still dairy.' },
    ],
  },
  {
    id: 'milk',
    original: 'milk',
    aliases: ['whole milk', 'cow milk', "cow's milk", '2% milk', 'skim milk'],
    subs: [
      { name: 'Oat milk', ratio: '1:1', notes: 'Creamiest plant milk. Great for baking and sauces.', tags: ['vegan', 'dairy-free', 'nut-free'] },
      { name: 'Almond milk', ratio: '1:1', notes: 'Lighter flavor, works well in most recipes.', tags: ['vegan', 'dairy-free'] },
      { name: 'Coconut milk (carton)', ratio: '1:1', notes: 'Use the carton kind, not canned. Slight coconut flavor.', tags: ['vegan', 'dairy-free', 'nut-free'] },
      { name: 'Soy milk', ratio: '1:1', notes: 'Highest protein of the plant milks. Neutral flavor.', tags: ['vegan', 'dairy-free', 'nut-free'] },
    ],
  },
  {
    id: 'heavy-cream',
    original: 'heavy cream',
    aliases: ['heavy whipping cream', 'whipping cream', 'double cream'],
    subs: [
      { name: 'Coconut cream', ratio: '1:1', notes: 'The thick part from a chilled can. Whips well.', tags: ['vegan', 'dairy-free'] },
      { name: 'Cashew cream', ratio: '1:1', notes: 'Blend soaked cashews with water until smooth.', tags: ['vegan', 'dairy-free'] },
      { name: 'Milk + butter', ratio: '3/4 cup milk + 1/4 cup melted butter', notes: 'Won\'t whip, but works for sauces and soups.' },
      { name: 'Evaporated milk', ratio: '1:1', notes: 'Creamier than regular milk. Good for soups and sauces.' },
    ],
  },
  {
    id: 'sour-cream',
    original: 'sour cream',
    aliases: ['soured cream'],
    subs: [
      { name: 'Greek yogurt', ratio: '1:1', notes: 'Best substitute. Slightly tangier.', tags: ['lower-cal'] },
      { name: 'Coconut cream + lemon juice', ratio: '1 cup + 1 tbsp lemon juice', notes: 'Let sit 10 min to thicken.', tags: ['vegan', 'dairy-free'] },
      { name: 'Cottage cheese (blended)', ratio: '1:1', notes: 'Blend until smooth for dips and baking.', tags: ['lower-cal'] },
    ],
  },
  {
    id: 'cream-cheese',
    original: 'cream cheese',
    aliases: ['philadelphia', 'neufchatel'],
    subs: [
      { name: 'Cashew cream cheese', ratio: '1:1', notes: 'Blend soaked cashews + lemon + salt.', tags: ['vegan', 'dairy-free'] },
      { name: 'Mascarpone', ratio: '1:1', notes: 'Richer and creamier. Great for desserts.' },
      { name: 'Ricotta (strained)', ratio: '1:1', notes: 'Strain through cheesecloth for best texture.' },
    ],
  },
  {
    id: 'buttermilk',
    original: 'buttermilk',
    aliases: [],
    subs: [
      { name: 'Milk + vinegar', ratio: '1 cup milk + 1 tbsp white vinegar', notes: 'Let sit 5-10 min until it curdles. Works perfectly.' },
      { name: 'Milk + lemon juice', ratio: '1 cup milk + 1 tbsp lemon juice', notes: 'Same method as vinegar. Slightly brighter flavor.' },
      { name: 'Plain yogurt + milk', ratio: '3/4 cup yogurt + 1/4 cup milk', notes: 'Thin yogurt to buttermilk consistency.' },
      { name: 'Oat milk + vinegar', ratio: '1 cup + 1 tbsp vinegar', notes: 'Vegan buttermilk. Let sit 5 min.', tags: ['vegan', 'dairy-free'] },
    ],
  },
  {
    id: 'yogurt',
    original: 'yogurt',
    aliases: ['plain yogurt', 'greek yogurt', 'natural yogurt'],
    subs: [
      { name: 'Sour cream', ratio: '1:1', notes: 'Higher fat but very similar tang and texture.' },
      { name: 'Coconut yogurt', ratio: '1:1', notes: 'Most brands work well.', tags: ['vegan', 'dairy-free'] },
      { name: 'Silken tofu (blended)', ratio: '1:1', notes: 'Blend until smooth. Add lemon for tang.', tags: ['vegan', 'dairy-free'] },
    ],
  },
  {
    id: 'parmesan',
    original: 'parmesan',
    aliases: ['parmesan cheese', 'parmigiano', 'parmigiano-reggiano', 'parm'],
    subs: [
      { name: 'Pecorino Romano', ratio: '1:1', notes: 'Sharper and saltier — use slightly less. Traditional in many Roman pastas.' },
      { name: 'Nutritional yeast', ratio: '2 tbsp per 1/4 cup parmesan', notes: 'Cheesy umami flavor. Great on pasta.', tags: ['vegan', 'dairy-free'] },
      { name: 'Grana Padano', ratio: '1:1', notes: 'Very similar to parmesan, slightly milder. Usually cheaper.' },
    ],
  },
  {
    id: 'mozzarella',
    original: 'mozzarella',
    aliases: ['mozzarella cheese', 'fresh mozzarella'],
    subs: [
      { name: 'Provolone', ratio: '1:1', notes: 'Melts similarly. Slightly sharper flavor.' },
      { name: 'Monterey Jack', ratio: '1:1', notes: 'Mild and melty. Good all-purpose sub.' },
      { name: 'Burrata', ratio: '1:1', notes: 'Richer and creamier. Upgrade, not a compromise.' },
    ],
  },

  // ── EGGS ───────────────────────────────────────────────────────────
  {
    id: 'egg',
    original: 'egg',
    aliases: ['eggs', 'large egg', 'large eggs', 'whole egg', 'whole eggs'],
    subs: [
      { name: 'Flax egg', ratio: '1 tbsp ground flax + 3 tbsp water per egg', notes: 'Mix and let sit 5 min. Best for baking (cookies, muffins).', tags: ['vegan'] },
      { name: 'Chia egg', ratio: '1 tbsp chia seeds + 3 tbsp water per egg', notes: 'Similar to flax egg. Slightly more visible texture.', tags: ['vegan'] },
      { name: 'Applesauce', ratio: '1/4 cup per egg', notes: 'Adds moisture. Best for cakes and quick breads.', tags: ['vegan'] },
      { name: 'Mashed banana', ratio: '1/4 cup (half a banana) per egg', notes: 'Adds banana flavor. Good for pancakes and muffins.', tags: ['vegan'] },
      { name: 'Silken tofu', ratio: '1/4 cup blended per egg', notes: 'Neutral flavor. Great for dense baked goods.', tags: ['vegan'] },
      { name: 'Commercial egg replacer', ratio: 'Follow package directions', notes: 'Bob\'s Red Mill or JUST Egg work well.', tags: ['vegan'] },
    ],
  },
  {
    id: 'egg-white',
    original: 'egg white',
    aliases: ['egg whites'],
    subs: [
      { name: 'Aquafaba', ratio: '3 tbsp per egg white', notes: 'Chickpea brine. Whips into peaks like real egg whites!', tags: ['vegan'] },
    ],
  },

  // ── FLOURS & STARCHES ──────────────────────────────────────────────
  {
    id: 'all-purpose-flour',
    original: 'all-purpose flour',
    aliases: ['ap flour', 'plain flour', 'flour', 'white flour'],
    subs: [
      { name: 'Whole wheat flour', ratio: '1:1 (or 3/4 cup per 1 cup)', notes: 'Denser result. Use 3/4 cup for lighter texture.' },
      { name: 'Almond flour', ratio: '1:1', notes: 'Grain-free. More moist. May need less liquid.', tags: ['gluten-free'] },
      { name: 'Oat flour', ratio: '1:1', notes: 'Blend rolled oats until fine. Slightly nutty.', tags: ['gluten-free'] },
      { name: 'GF flour blend (1:1)', ratio: '1:1', notes: 'Bob\'s Red Mill or King Arthur 1:1 blends work well.', tags: ['gluten-free'] },
    ],
  },
  {
    id: 'cornstarch',
    original: 'cornstarch',
    aliases: ['corn starch', 'cornflour'],
    subs: [
      { name: 'Arrowroot powder', ratio: '1:1', notes: 'Clearer finish. Best for sauces.', tags: ['gluten-free'] },
      { name: 'Tapioca starch', ratio: '1:1', notes: 'Slightly chewier texture. Good for thickening.', tags: ['gluten-free'] },
      { name: 'All-purpose flour', ratio: '2 tbsp flour per 1 tbsp cornstarch', notes: 'Needs longer cooking to remove raw taste.' },
    ],
  },
  {
    id: 'baking-powder',
    original: 'baking powder',
    aliases: [],
    subs: [
      { name: 'Baking soda + cream of tartar', ratio: '1/4 tsp baking soda + 1/2 tsp cream of tartar per 1 tsp baking powder', notes: 'This IS what baking powder is.' },
    ],
  },
  {
    id: 'breadcrumbs',
    original: 'breadcrumbs',
    aliases: ['bread crumbs', 'panko', 'panko breadcrumbs'],
    subs: [
      { name: 'Crushed crackers', ratio: '1:1', notes: 'Saltines, Ritz, or water crackers.' },
      { name: 'Crushed cornflakes', ratio: '1:1', notes: 'Extra crispy coating.', tags: ['dairy-free'] },
      { name: 'Almond meal', ratio: '1:1', notes: 'Low-carb option.', tags: ['gluten-free'] },
      { name: 'Rolled oats (pulsed)', ratio: '1:1', notes: 'Pulse in blender. Heartier texture.', tags: ['gluten-free'] },
    ],
  },

  // ── OILS & FATS ────────────────────────────────────────────────────
  {
    id: 'vegetable-oil',
    original: 'vegetable oil',
    aliases: ['canola oil', 'neutral oil', 'cooking oil'],
    subs: [
      { name: 'Avocado oil', ratio: '1:1', notes: 'Higher smoke point. Neutral flavor.', tags: ['vegan'] },
      { name: 'Coconut oil (refined)', ratio: '1:1', notes: 'Refined has no coconut flavor.', tags: ['vegan'] },
      { name: 'Grapeseed oil', ratio: '1:1', notes: 'Very neutral. Good for high-heat.', tags: ['vegan'] },
      { name: 'Melted butter', ratio: '1:1', notes: 'Adds richness. Not for high-heat frying.' },
    ],
  },
  {
    id: 'olive-oil',
    original: 'olive oil',
    aliases: ['extra virgin olive oil', 'evoo', 'extra-virgin olive oil'],
    subs: [
      { name: 'Avocado oil', ratio: '1:1', notes: 'Best all-purpose substitute. Neutral flavor.', tags: ['vegan'] },
      { name: 'Grapeseed oil', ratio: '1:1', notes: 'Neutral and light.', tags: ['vegan'] },
      { name: 'Melted butter', ratio: '1:1', notes: 'Different flavor profile but works for sauteing.' },
    ],
  },

  // ── SWEETENERS ─────────────────────────────────────────────────────
  {
    id: 'white-sugar',
    original: 'sugar',
    aliases: ['white sugar', 'granulated sugar', 'caster sugar', 'superfine sugar'],
    subs: [
      { name: 'Coconut sugar', ratio: '1:1', notes: 'Deeper caramel flavor. Slightly less sweet.', tags: ['vegan'] },
      { name: 'Honey', ratio: '3/4 cup per 1 cup sugar', notes: 'Reduce liquid by 2 tbsp. Not vegan.' },
      { name: 'Maple syrup', ratio: '3/4 cup per 1 cup sugar', notes: 'Reduce liquid by 3 tbsp. Distinct flavor.', tags: ['vegan'] },
      { name: 'Brown sugar', ratio: '1:1', notes: 'Adds moisture and molasses flavor.' },
    ],
  },
  {
    id: 'brown-sugar',
    original: 'brown sugar',
    aliases: ['light brown sugar', 'dark brown sugar', 'packed brown sugar'],
    subs: [
      { name: 'White sugar + molasses', ratio: '1 cup sugar + 1 tbsp molasses (light) or 2 tbsp (dark)', notes: 'This IS brown sugar. Mix well.' },
      { name: 'Coconut sugar', ratio: '1:1', notes: 'Similar depth of flavor.', tags: ['vegan'] },
      { name: 'Maple syrup', ratio: '3/4 cup per 1 cup', notes: 'Reduce other liquids slightly.', tags: ['vegan'] },
    ],
  },
  {
    id: 'honey',
    original: 'honey',
    aliases: [],
    subs: [
      { name: 'Maple syrup', ratio: '1:1', notes: 'Best swap. Different flavor but works everywhere.', tags: ['vegan'] },
      { name: 'Agave nectar', ratio: '1:1', notes: 'Thinner and more neutral.', tags: ['vegan'] },
      { name: 'Corn syrup', ratio: '1:1', notes: 'For texture/binding purposes only.' },
    ],
  },

  // ── CONDIMENTS & SAUCES ────────────────────────────────────────────
  {
    id: 'soy-sauce',
    original: 'soy sauce',
    aliases: ['shoyu', 'light soy sauce', 'dark soy sauce'],
    subs: [
      { name: 'Tamari', ratio: '1:1', notes: 'Very similar flavor. Most are gluten-free.', tags: ['gluten-free'] },
      { name: 'Coconut aminos', ratio: '1:1 (add a pinch of salt)', notes: 'Sweeter and milder. Soy-free.', tags: ['gluten-free', 'vegan'] },
      { name: 'Worcestershire sauce', ratio: '1:1', notes: 'Different flavor but provides similar umami.' },
    ],
  },
  {
    id: 'fish-sauce',
    original: 'fish sauce',
    aliases: ['nam pla', 'nuoc mam'],
    subs: [
      { name: 'Soy sauce + lime juice', ratio: '1 tbsp soy + 1 tsp lime per tbsp fish sauce', notes: 'Missing the funk but gets the salt and umami.' },
      { name: 'Mushroom sauce', ratio: '1:1', notes: 'Vegetarian fish sauce. Several brands available.', tags: ['vegan'] },
      { name: 'Worcestershire + soy', ratio: '1/2 tbsp each per tbsp fish sauce', notes: 'Closer to the fermented depth.' },
    ],
  },
  {
    id: 'worcestershire',
    original: 'worcestershire sauce',
    aliases: ['worcestershire'],
    subs: [
      { name: 'Soy sauce + vinegar + sugar', ratio: '1 tbsp soy + 1 tsp vinegar + pinch sugar', notes: 'Quick approximation.' },
      { name: 'Coconut aminos + vinegar', ratio: '1 tbsp + 1 tsp', notes: 'Soy-free option.', tags: ['vegan', 'gluten-free'] },
    ],
  },
  {
    id: 'tomato-paste',
    original: 'tomato paste',
    aliases: [],
    subs: [
      { name: 'Tomato sauce (reduced)', ratio: '3 tbsp sauce per 1 tbsp paste', notes: 'Simmer sauce to reduce by 2/3.' },
      { name: 'Ketchup', ratio: '1:1', notes: 'Sweeter. Works in a pinch for stews and braises.' },
      { name: 'Sun-dried tomatoes (blended)', ratio: '1:1', notes: 'Blend with a little water. Intense flavor.', tags: ['vegan'] },
    ],
  },
  {
    id: 'vinegar',
    original: 'vinegar',
    aliases: ['white vinegar', 'distilled vinegar'],
    subs: [
      { name: 'Lemon juice', ratio: '1:1', notes: 'Adds brightness similarly.' },
      { name: 'Apple cider vinegar', ratio: '1:1', notes: 'Slightly sweeter. Good all-purpose swap.' },
    ],
  },
  {
    id: 'rice-vinegar',
    original: 'rice vinegar',
    aliases: ['rice wine vinegar'],
    subs: [
      { name: 'Apple cider vinegar + sugar', ratio: '1 tbsp ACV + 1/4 tsp sugar per tbsp', notes: 'Approximates the mild sweetness.' },
      { name: 'White wine vinegar', ratio: '1:1', notes: 'Slightly sharper but works.' },
      { name: 'Lemon juice', ratio: '1:1', notes: 'Different character but provides the acid.' },
    ],
  },
  {
    id: 'mustard',
    original: 'dijon mustard',
    aliases: ['mustard', 'dijon', 'prepared mustard'],
    subs: [
      { name: 'Yellow mustard', ratio: '1:1', notes: 'Milder flavor but works in dressings and sauces.' },
      { name: 'Whole grain mustard', ratio: '1:1', notes: 'More texture, similar flavor profile.' },
      { name: 'Mustard powder + vinegar', ratio: '1 tsp powder + 1 tsp vinegar per tbsp dijon', notes: 'Make your own.' },
    ],
  },

  // ── HERBS & AROMATICS ──────────────────────────────────────────────
  {
    id: 'garlic',
    original: 'garlic',
    aliases: ['garlic cloves', 'cloves garlic', 'fresh garlic', 'minced garlic'],
    subs: [
      { name: 'Garlic powder', ratio: '1/4 tsp per clove', notes: 'Less pungent. Add later in cooking.' },
      { name: 'Garlic paste', ratio: '1/2 tsp per clove', notes: 'From a tube — convenient and close to fresh.' },
      { name: 'Shallot', ratio: '1 shallot per 3-4 cloves', notes: 'Different but provides aromatic depth.' },
    ],
  },
  {
    id: 'onion',
    original: 'onion',
    aliases: ['yellow onion', 'white onion', 'sweet onion', 'brown onion'],
    subs: [
      { name: 'Shallot', ratio: '3 shallots per 1 onion', notes: 'More delicate and slightly sweet.' },
      { name: 'Leek (white part)', ratio: '1 leek per 1 onion', notes: 'Milder. Great for soups and braises.' },
      { name: 'Onion powder', ratio: '1 tbsp per medium onion', notes: 'No texture, but adds the flavor.' },
    ],
  },
  {
    id: 'shallot',
    original: 'shallot',
    aliases: ['shallots'],
    subs: [
      { name: 'Red onion (small dice)', ratio: '1/3 cup per shallot', notes: 'Slightly stronger. Use less.' },
      { name: 'Green onion (white parts)', ratio: '3-4 per shallot', notes: 'Milder but works in vinaigrettes.' },
    ],
  },
  {
    id: 'ginger',
    original: 'ginger',
    aliases: ['fresh ginger', 'ginger root', 'grated ginger'],
    subs: [
      { name: 'Ground ginger', ratio: '1/4 tsp per tbsp fresh', notes: 'Less bright, more warming. Add early.' },
      { name: 'Ginger paste', ratio: '1:1', notes: 'From a tube. Closest to fresh.' },
    ],
  },
  {
    id: 'fresh-herbs',
    original: 'fresh basil',
    aliases: ['fresh basil', 'fresh parsley', 'fresh cilantro', 'fresh thyme', 'fresh rosemary', 'fresh oregano', 'fresh sage', 'fresh dill', 'fresh mint', 'basil', 'parsley', 'cilantro', 'thyme', 'rosemary', 'oregano', 'sage', 'dill', 'mint'],
    subs: [
      { name: 'Dried equivalent', ratio: '1 tsp dried per 1 tbsp fresh', notes: 'General rule: use 1/3 the amount. Add earlier in cooking.' },
      { name: 'Different fresh herb', ratio: '1:1', notes: 'Parsley ↔ cilantro, thyme ↔ oregano, basil ↔ mint work in many contexts.' },
    ],
  },

  // ── STOCK & WINE ───────────────────────────────────────────────────
  {
    id: 'chicken-stock',
    original: 'chicken stock',
    aliases: ['chicken broth', 'chicken stock/broth', 'stock', 'broth'],
    subs: [
      { name: 'Vegetable broth', ratio: '1:1', notes: 'Works in almost everything.', tags: ['vegan'] },
      { name: 'Bouillon cube + water', ratio: '1 cube per cup water', notes: 'Saltier — reduce added salt.' },
      { name: 'Mushroom broth', ratio: '1:1', notes: 'Deep umami. Great for risotto and soups.', tags: ['vegan'] },
      { name: 'Water + soy sauce', ratio: '1 cup water + 1 tsp soy sauce', notes: 'In a real pinch.', tags: ['vegan'] },
    ],
  },
  {
    id: 'white-wine',
    original: 'white wine',
    aliases: ['dry white wine', 'cooking wine'],
    subs: [
      { name: 'Chicken/vegetable broth + lemon', ratio: '1 cup broth + 1 tbsp lemon juice', notes: 'Provides acidity without alcohol.' },
      { name: 'White wine vinegar + water', ratio: '1 tbsp vinegar + remaining water', notes: 'For deglazing and sauces.' },
      { name: 'Dry vermouth', ratio: '1:1', notes: 'Actually preferred by some chefs. Keeps longer.' },
    ],
  },
  {
    id: 'red-wine',
    original: 'red wine',
    aliases: ['dry red wine'],
    subs: [
      { name: 'Beef broth + red wine vinegar', ratio: '1 cup broth + 1 tbsp vinegar', notes: 'Provides depth and acidity.' },
      { name: 'Grape juice + vinegar', ratio: '3/4 cup juice + 1 tbsp vinegar', notes: 'Sweeter but captures the fruitiness.' },
      { name: 'Pomegranate juice', ratio: '1:1', notes: 'Deep color and tartness.', tags: ['vegan'] },
    ],
  },

  // ── SPECIALTY INGREDIENTS ──────────────────────────────────────────
  {
    id: 'coconut-milk',
    original: 'coconut milk',
    aliases: ['full-fat coconut milk', 'canned coconut milk', 'coconut cream'],
    subs: [
      { name: 'Heavy cream', ratio: '1:1', notes: 'Similar richness. Different flavor.' },
      { name: 'Cashew cream', ratio: '1:1', notes: 'Blend 1 cup soaked cashews with 1 cup water.', tags: ['vegan', 'dairy-free'] },
      { name: 'Oat milk (full fat)', ratio: '1:1', notes: 'Less rich but works in curries.', tags: ['vegan', 'dairy-free', 'nut-free'] },
    ],
  },
  {
    id: 'tahini',
    original: 'tahini',
    aliases: ['sesame paste'],
    subs: [
      { name: 'Peanut butter (unsweetened)', ratio: '1:1', notes: 'Different flavor but similar texture.', tags: ['vegan'] },
      { name: 'Sunflower seed butter', ratio: '1:1', notes: 'Nut-free option. Slightly bitter.', tags: ['vegan', 'nut-free'] },
      { name: 'Cashew butter', ratio: '1:1', notes: 'Milder flavor, very creamy.', tags: ['vegan'] },
    ],
  },
  {
    id: 'miso',
    original: 'miso',
    aliases: ['miso paste', 'white miso', 'red miso', 'yellow miso'],
    subs: [
      { name: 'Soy sauce', ratio: '1/2 tbsp per tbsp miso', notes: 'Thinner, but provides similar umami and salt.' },
      { name: 'Tahini + soy sauce', ratio: '1 tsp tahini + 1/2 tbsp soy per tbsp miso', notes: 'Closer to the body and umami of miso.', tags: ['vegan'] },
    ],
  },
  {
    id: 'lemongrass',
    original: 'lemongrass',
    aliases: ['lemon grass'],
    subs: [
      { name: 'Lemon zest + ginger', ratio: '1 tsp zest + 1 tsp ginger per stalk', notes: 'Captures citrus and spice notes.' },
      { name: 'Lemongrass paste', ratio: '1 tbsp per stalk', notes: 'From a tube or jar. Much more convenient.' },
    ],
  },
  {
    id: 'sriracha',
    original: 'sriracha',
    aliases: ['sriracha sauce'],
    subs: [
      { name: 'Sambal oelek', ratio: '1:1', notes: 'More pure chili flavor, less sweet.' },
      { name: 'Gochujang', ratio: '1:1', notes: 'Korean chili paste. Slightly sweet and more complex.' },
      { name: 'Hot sauce + garlic', ratio: '1 tbsp hot sauce + pinch garlic powder', notes: 'Any hot sauce works.' },
    ],
  },
  {
    id: 'tamarind',
    original: 'tamarind paste',
    aliases: ['tamarind', 'tamarind concentrate'],
    subs: [
      { name: 'Lime juice + brown sugar', ratio: '2 tbsp lime + 1 tbsp brown sugar per tbsp tamarind', notes: 'Captures sour-sweet balance.' },
      { name: 'Pomegranate molasses', ratio: '1:1', notes: 'Similar tartness and depth.' },
      { name: 'Worcestershire + lime', ratio: '1 tbsp Worcestershire + 1 tsp lime', notes: 'Worcestershire actually contains tamarind.' },
    ],
  },

  // ── MISC PANTRY ────────────────────────────────────────────────────
  {
    id: 'vanilla-extract',
    original: 'vanilla extract',
    aliases: ['vanilla', 'pure vanilla extract'],
    subs: [
      { name: 'Vanilla bean paste', ratio: '1:1', notes: 'Even better — visible vanilla seeds.' },
      { name: 'Maple syrup', ratio: '1:1', notes: 'Adds sweetness. Good for baking.', tags: ['vegan'] },
      { name: 'Almond extract', ratio: '1/2 tsp per 1 tsp vanilla', notes: 'Stronger — use less. Different but pleasant.' },
    ],
  },
  {
    id: 'lemon-juice',
    original: 'lemon juice',
    aliases: ['fresh lemon juice', 'juice of lemon'],
    subs: [
      { name: 'Lime juice', ratio: '1:1', notes: 'Slightly different citrus profile but works.' },
      { name: 'White wine vinegar', ratio: '1/2 tsp per tsp lemon juice', notes: 'For acidity in cooking, not for drinks.' },
      { name: 'Orange juice + vinegar', ratio: '2 tsp OJ + 1 tsp vinegar per tbsp lemon', notes: 'When you need citrus character.' },
    ],
  },
  {
    id: 'rice',
    original: 'arborio rice',
    aliases: ['arborio', 'risotto rice', 'carnaroli rice'],
    subs: [
      { name: 'Carnaroli rice', ratio: '1:1', notes: 'Actually preferred for risotto — holds shape better.' },
      { name: 'Short-grain sushi rice', ratio: '1:1', notes: 'Starchy enough for risotto. Different texture but works.' },
    ],
  },
  {
    id: 'pasta',
    original: 'spaghetti',
    aliases: ['spaghetti', 'linguine', 'fettuccine', 'penne', 'rigatoni', 'pasta'],
    subs: [
      { name: 'Any other pasta shape', ratio: '1:1 by weight', notes: 'Shape matters for sauce adhesion but flavor is the same.' },
      { name: 'GF pasta', ratio: '1:1', notes: 'Brown rice or lentil pasta work well.', tags: ['gluten-free'] },
      { name: 'Zucchini noodles', ratio: '2 medium zucchini per 8oz pasta', notes: 'Spiralize. Much lighter.', tags: ['gluten-free', 'vegan', 'lower-cal'] },
    ],
  },
  {
    id: 'salt',
    original: 'kosher salt',
    aliases: ['salt', 'kosher salt', 'sea salt', 'fine salt', 'table salt'],
    subs: [
      { name: 'Table salt', ratio: 'Use 3/4 the amount', notes: 'Table salt is denser. Diamond Crystal kosher → use 1/2 as much table.' },
      { name: 'Sea salt', ratio: '1:1', notes: 'Fine sea salt = 1:1 with kosher. Flaky sea salt varies.' },
    ],
  },
]

/**
 * Find substitutions for a given ingredient name.
 * Normalizes the input and checks against original + aliases.
 * Returns null if no match found (signals caller to try API fallback).
 */
export function findSubstitutions(ingredientName: string): Substitution | null {
  const normalized = normalizeIngredient(ingredientName)

  for (const sub of SUBSTITUTIONS) {
    if (sub.original === normalized) return sub
    if (sub.aliases.some(a => a === normalized)) return sub
    // Partial match: "unsalted butter" contains "butter"
    if (normalized.includes(sub.original)) return sub
    if (sub.aliases.some(a => normalized.includes(a) || a.includes(normalized))) return sub
  }

  return null
}

/**
 * Get all available substitution categories for browsing.
 */
export function getAllSubstitutions(): Substitution[] {
  return SUBSTITUTIONS
}
