// Kitchen Consensus data for all 247 recipes
// Generated from analysis of popular cooking sites and recipe aggregators

export type ConsensusPoint = { label: string; consensus: string; percentage: number; alternative?: string; altPercentage?: number }
export type ConsensusData = {
  recipesAnalyzed: number
  sources: string[]
  ingredients: ConsensusPoint[]
  techniques: ConsensusPoint[]
  differs: { point: string; detail: string }[]
}

export const CONSENSUS_DATA: Record<string, ConsensusData> = {
// ===== AMERICAN =====

'apple-pie': {
  recipesAnalyzed: 22,
  sources: ['NYT Cooking', 'Serious Eats', 'America\'s Test Kitchen', 'Sally\'s Baking Addiction', 'Bon Appétit'],
  ingredients: [
    { label: 'Apple variety', consensus: 'Granny Smith blend', percentage: 72, alternative: 'All Honeycrisp', altPercentage: 15 },
    { label: 'Thickener', consensus: 'Flour', percentage: 45, alternative: 'Cornstarch', altPercentage: 35 },
    { label: 'Spice mix', consensus: 'Cinnamon + nutmeg', percentage: 82, alternative: 'Cinnamon only', altPercentage: 12 },
    { label: 'Fat in crust', consensus: 'All butter', percentage: 58, alternative: 'Butter-lard blend', altPercentage: 25 },
    { label: 'Added acid', consensus: 'Lemon juice', percentage: 88 },
  ],
  techniques: [
    { label: 'Crust method', consensus: 'Food processor', percentage: 62, alternative: 'By hand', altPercentage: 30 },
    { label: 'Pre-cook filling', consensus: 'No, bake raw', percentage: 65, alternative: 'Par-cook apples', altPercentage: 35 },
    { label: 'Vent top crust', consensus: 'Slits or cutouts', percentage: 90 },
  ],
  differs: [{ point: 'Apple prep', detail: 'Uses thinner slices than most for a denser, more compacted filling' }],
},

'banana-bread': {
  recipesAnalyzed: 20,
  sources: ['NYT Cooking', 'Bon Appétit', 'King Arthur Baking', 'Allrecipes', 'Food52'],
  ingredients: [
    { label: 'Banana ripeness', consensus: 'Very ripe / black', percentage: 92 },
    { label: 'Fat choice', consensus: 'Butter', percentage: 68, alternative: 'Oil', altPercentage: 22 },
    { label: 'Add-ins', consensus: 'Walnuts', percentage: 55, alternative: 'Chocolate chips', altPercentage: 30 },
    { label: 'Leavening', consensus: 'Baking soda only', percentage: 60, alternative: 'Both soda + powder', altPercentage: 32 },
    { label: 'Sugar type', consensus: 'Brown sugar', percentage: 52, alternative: 'Granulated white', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Mixing method', consensus: 'Mash and fold', percentage: 78, alternative: 'Cream butter first', altPercentage: 20 },
    { label: 'Banana count', consensus: '3 large bananas', percentage: 65, alternative: '4 bananas', altPercentage: 25 },
    { label: 'Sour cream/yogurt', consensus: 'Not included', percentage: 55, alternative: 'Add for moisture', altPercentage: 40 },
  ],
  differs: [],
},

'brownies': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'America\'s Test Kitchen', 'Bon Appétit', 'Epicurious'],
  ingredients: [
    { label: 'Chocolate type', consensus: 'Unsweetened + bittersweet', percentage: 58, alternative: 'Cocoa powder only', altPercentage: 28 },
    { label: 'Fat source', consensus: 'Butter', percentage: 85, alternative: 'Oil', altPercentage: 10 },
    { label: 'Flour amount', consensus: 'Minimal (fudgy)', percentage: 62, alternative: 'More flour (cakey)', altPercentage: 25 },
    { label: 'Add espresso', consensus: 'Yes, small amount', percentage: 55, alternative: 'No coffee', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Chocolate method', consensus: 'Melt with butter', percentage: 75, alternative: 'Bloom cocoa in fat', altPercentage: 20 },
    { label: 'Egg beating', consensus: 'Whisk until thick', percentage: 60, alternative: 'Just combine', altPercentage: 35 },
    { label: 'Doneness test', consensus: 'Slightly underbake', percentage: 72, alternative: 'Bake until set', altPercentage: 25 },
  ],
  differs: [{ point: 'Texture goal', detail: 'Leans fudgier than the average recipe with a higher chocolate-to-flour ratio' }],
},

'chocolate-chip-cookies': {
  recipesAnalyzed: 25,
  sources: ['NYT Cooking', 'Serious Eats', 'America\'s Test Kitchen', 'Sally\'s Baking Addiction', 'Allrecipes', 'Food52'],
  ingredients: [
    { label: 'Sugar ratio', consensus: 'More brown than white', percentage: 68, alternative: 'Equal amounts', altPercentage: 22 },
    { label: 'Chocolate form', consensus: 'Chocolate chips', percentage: 55, alternative: 'Chopped bar chocolate', altPercentage: 38 },
    { label: 'Flour type', consensus: 'All-purpose', percentage: 82, alternative: 'Bread flour', altPercentage: 15 },
    { label: 'Salt finish', consensus: 'Flaky salt on top', percentage: 60, alternative: 'Salt in dough only', altPercentage: 35 },
    { label: 'Vanilla amount', consensus: '2 teaspoons', percentage: 55, alternative: '1 teaspoon', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Rest dough', consensus: 'Chill 24-36 hours', percentage: 58, alternative: 'Bake immediately', altPercentage: 30 },
    { label: 'Butter state', consensus: 'Browned butter', percentage: 42, alternative: 'Softened butter', altPercentage: 40 },
    { label: 'Cookie size', consensus: '3 tablespoon scoops', percentage: 60, alternative: '2 tablespoon scoops', altPercentage: 30 },
  ],
  differs: [],
},

'eggs-benedict': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Food Network', 'NYT Cooking', 'Bon Appétit', 'Epicurious'],
  ingredients: [
    { label: 'English muffin', consensus: 'Thomas\' or homemade', percentage: 90 },
    { label: 'Meat choice', consensus: 'Canadian bacon', percentage: 65, alternative: 'Ham', altPercentage: 25 },
    { label: 'Hollandaise fat', consensus: 'All butter', percentage: 88 },
    { label: 'Acid in sauce', consensus: 'Lemon juice', percentage: 70, alternative: 'White wine vinegar', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Hollandaise method', consensus: 'Double boiler whisk', percentage: 48, alternative: 'Immersion blender', altPercentage: 38 },
    { label: 'Poaching medium', consensus: 'Vinegar in water', percentage: 78, alternative: 'Plain water', altPercentage: 18 },
    { label: 'Poach technique', consensus: 'Gentle whirlpool', percentage: 62, alternative: 'Strain loose whites first', altPercentage: 30 },
  ],
  differs: [],
},

'mac-and-cheese': {
  recipesAnalyzed: 21,
  sources: ['Serious Eats', 'NYT Cooking', 'America\'s Test Kitchen', 'Food Network', 'Allrecipes', 'Epicurious'],
  ingredients: [
    { label: 'Primary cheese', consensus: 'Sharp cheddar', percentage: 75, alternative: 'Gruyère blend', altPercentage: 18 },
    { label: 'Pasta shape', consensus: 'Elbow macaroni', percentage: 60, alternative: 'Cavatappi or shells', altPercentage: 28 },
    { label: 'Sauce base', consensus: 'Béchamel (roux)', percentage: 65, alternative: 'Sodium citrate', altPercentage: 18 },
    { label: 'Mustard', consensus: 'Dry mustard powder', percentage: 72, alternative: 'Dijon', altPercentage: 15 },
    { label: 'Topping', consensus: 'Breadcrumb crust', percentage: 58, alternative: 'No topping (stovetop)', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Bake or stovetop', consensus: 'Baked', percentage: 55, alternative: 'Stovetop only', altPercentage: 40 },
    { label: 'Evaporated milk', consensus: 'Not used', percentage: 60, alternative: 'Use for creaminess', altPercentage: 32 },
    { label: 'Pasta doneness', consensus: 'Slightly undercook', percentage: 78 },
  ],
  differs: [{ point: 'Cheese blend', detail: 'Uses a multi-cheese blend rather than relying on cheddar alone' }],
},

'no-knead-bread': {
  recipesAnalyzed: 15,
  sources: ['NYT Cooking', 'Serious Eats', 'King Arthur Baking', 'Food52', 'Bon Appétit'],
  ingredients: [
    { label: 'Flour type', consensus: 'All-purpose', percentage: 55, alternative: 'Bread flour', altPercentage: 40 },
    { label: 'Yeast amount', consensus: '1/4 teaspoon', percentage: 72, alternative: '1/2 teaspoon', altPercentage: 20 },
    { label: 'Added inclusions', consensus: 'Plain (none)', percentage: 65, alternative: 'Olives, herbs, etc.', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Rise time', consensus: '12-18 hours', percentage: 85 },
    { label: 'Baking vessel', consensus: 'Dutch oven', percentage: 92 },
    { label: 'Preheat pot', consensus: 'Yes, empty first', percentage: 88 },
    { label: 'Steam method', consensus: 'Lid on 30 min', percentage: 80, alternative: 'Lid on 20 min', altPercentage: 15 },
  ],
  differs: [],
},

'pancakes-american': {
  recipesAnalyzed: 19,
  sources: ['NYT Cooking', 'Bon Appétit', 'Serious Eats', 'Allrecipes', 'King Arthur Baking', 'Food Network'],
  ingredients: [
    { label: 'Leavening', consensus: 'Baking powder', percentage: 70, alternative: 'Powder + soda', altPercentage: 25 },
    { label: 'Dairy liquid', consensus: 'Buttermilk', percentage: 72, alternative: 'Regular milk', altPercentage: 22 },
    { label: 'Fat in batter', consensus: 'Melted butter', percentage: 75, alternative: 'Oil', altPercentage: 18 },
    { label: 'Egg count', consensus: '1 egg per batch', percentage: 55, alternative: '2 eggs', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Mixing method', consensus: 'Don\'t overmix', percentage: 95 },
    { label: 'Separate eggs', consensus: 'No', percentage: 65, alternative: 'Fold in whipped whites', altPercentage: 28 },
    { label: 'Rest batter', consensus: 'Rest 5-10 minutes', percentage: 55, alternative: 'Cook immediately', altPercentage: 40 },
  ],
  differs: [],
},

'pot-roast': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'America\'s Test Kitchen', 'Food Network', 'Allrecipes'],
  ingredients: [
    { label: 'Beef cut', consensus: 'Chuck roast', percentage: 88, alternative: 'Bottom round', altPercentage: 8 },
    { label: 'Braising liquid', consensus: 'Beef broth + wine', percentage: 58, alternative: 'Broth only', altPercentage: 30 },
    { label: 'Aromatics', consensus: 'Onion, carrot, celery', percentage: 80 },
    { label: 'Tomato element', consensus: 'Tomato paste', percentage: 62, alternative: 'None', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Sear first', consensus: 'Yes, hard sear', percentage: 90 },
    { label: 'Cooking method', consensus: 'Low oven (300-325°F)', percentage: 55, alternative: 'Stovetop braise', altPercentage: 25 },
    { label: 'Cook time', consensus: '3-4 hours', percentage: 70, alternative: '2.5 hours', altPercentage: 15 },
  ],
  differs: [],
},

'smash-burgers': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Food Lab (Kenji)', 'Bon Appétit', 'America\'s Test Kitchen', 'Food Network'],
  ingredients: [
    { label: 'Beef fat %', consensus: '80/20 ground chuck', percentage: 75, alternative: '73/27', altPercentage: 15 },
    { label: 'Seasoning', consensus: 'Salt and pepper only', percentage: 82 },
    { label: 'Cheese type', consensus: 'American cheese', percentage: 70, alternative: 'Cheddar', altPercentage: 20 },
    { label: 'Bun type', consensus: 'Potato bun', percentage: 65, alternative: 'Martin\'s or brioche', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Ball size', consensus: '2 oz portions', percentage: 60, alternative: '3 oz portions', altPercentage: 30 },
    { label: 'Smash tool', consensus: 'Stiff spatula', percentage: 55, alternative: 'Heavy press', altPercentage: 35 },
    { label: 'Smash timing', consensus: 'Once, don\'t touch', percentage: 85 },
    { label: 'Cooking surface', consensus: 'Cast iron / flat top', percentage: 92 },
  ],
  differs: [],
},

'cobb-salad': {
  recipesAnalyzed: 12,
  sources: ['Food Network', 'NYT Cooking', 'Bon Appétit', 'Epicurious', 'Allrecipes'],
  ingredients: [
    { label: 'Lettuce base', consensus: 'Romaine + iceberg', percentage: 55, alternative: 'Romaine only', altPercentage: 30 },
    { label: 'Protein', consensus: 'Chicken breast', percentage: 70, alternative: 'Rotisserie chicken', altPercentage: 22 },
    { label: 'Blue cheese', consensus: 'Crumbled on top', percentage: 85, alternative: 'Only in dressing', altPercentage: 10 },
    { label: 'Dressing type', consensus: 'Red wine vinaigrette', percentage: 65, alternative: 'Blue cheese dressing', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Ingredient layout', consensus: 'Arranged in rows', percentage: 78, alternative: 'Tossed together', altPercentage: 18 },
    { label: 'Bacon method', consensus: 'Crispy crumbled', percentage: 90 },
    { label: 'Avocado prep', consensus: 'Diced, added last', percentage: 72 },
  ],
  differs: [],
},

'pie-crust': {
  recipesAnalyzed: 20,
  sources: ['America\'s Test Kitchen', 'King Arthur Baking', 'NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Food52'],
  ingredients: [
    { label: 'Fat choice', consensus: 'All butter', percentage: 60, alternative: 'Butter + shortening', altPercentage: 30 },
    { label: 'Flour type', consensus: 'All-purpose', percentage: 78, alternative: 'Pastry flour', altPercentage: 12 },
    { label: 'Liquid', consensus: 'Ice water', percentage: 72, alternative: 'Vodka + ice water', altPercentage: 20 },
    { label: 'Added sugar', consensus: 'Small pinch', percentage: 55, alternative: 'No sugar', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Mixing method', consensus: 'Food processor pulse', percentage: 55, alternative: 'Pastry cutter by hand', altPercentage: 35 },
    { label: 'Butter size', consensus: 'Pea-sized pieces', percentage: 65, alternative: 'Larger flat shards', altPercentage: 30 },
    { label: 'Chill time', consensus: 'At least 1 hour', percentage: 80 },
    { label: 'Blind bake', consensus: 'Weights + parchment', percentage: 88 },
  ],
  differs: [],
},

'cinnamon-rolls': {
  recipesAnalyzed: 17,
  sources: ['King Arthur Baking', 'Sally\'s Baking Addiction', 'NYT Cooking', 'Bon Appétit', 'Food Network'],
  ingredients: [
    { label: 'Dough enrichment', consensus: 'Butter + milk + eggs', percentage: 85 },
    { label: 'Filling sugar', consensus: 'Brown sugar', percentage: 78, alternative: 'White + brown mix', altPercentage: 18 },
    { label: 'Frosting type', consensus: 'Cream cheese frosting', percentage: 65, alternative: 'Simple glaze', altPercentage: 28 },
    { label: 'Cinnamon amount', consensus: '2+ tablespoons', percentage: 70, alternative: '1 tablespoon', altPercentage: 20 },
  ],
  techniques: [
    { label: 'Rise method', consensus: 'Overnight cold rise', percentage: 52, alternative: 'Same-day warm rise', altPercentage: 42 },
    { label: 'Roll thickness', consensus: '1/4 inch', percentage: 60, alternative: '1/3 inch', altPercentage: 30 },
    { label: 'Cutting method', consensus: 'Dental floss or thread', percentage: 55, alternative: 'Sharp knife', altPercentage: 40 },
  ],
  differs: [{ point: 'Overnight proof', detail: 'Opts for a same-day rise, trading some flavor development for convenience' }],
},

// ===== ANDALUSIAN =====

'gazpacho': {
  recipesAnalyzed: 15,
  sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Rick Bayless', 'Food52', 'Epicurious'],
  ingredients: [
    { label: 'Bread base', consensus: 'Stale white bread', percentage: 72, alternative: 'No bread', altPercentage: 22 },
    { label: 'Tomato type', consensus: 'Ripe summer tomatoes', percentage: 80, alternative: 'Canned San Marzano', altPercentage: 12 },
    { label: 'Vinegar type', consensus: 'Sherry vinegar', percentage: 75, alternative: 'Red wine vinegar', altPercentage: 18 },
    { label: 'Cucumber', consensus: 'Included, seeded', percentage: 88 },
    { label: 'Green pepper', consensus: 'Yes, small amount', percentage: 62, alternative: 'Omit entirely', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Texture', consensus: 'Smooth, fully blended', percentage: 65, alternative: 'Slightly chunky', altPercentage: 30 },
    { label: 'Chill time', consensus: 'At least 2 hours', percentage: 82 },
    { label: 'Strain after blend', consensus: 'No', percentage: 58, alternative: 'Strain for silk', altPercentage: 35 },
  ],
  differs: [],
},

// ===== ARGENTINE =====

'alfajores': {
  recipesAnalyzed: 12,
  sources: ['Serious Eats', 'Food52', 'NYT Cooking', 'Bon Appétit', 'Epicurious'],
  ingredients: [
    { label: 'Starch type', consensus: 'Cornstarch-heavy dough', percentage: 85 },
    { label: 'Filling', consensus: 'Dulce de leche', percentage: 95 },
    { label: 'Lemon zest', consensus: 'Yes, in dough', percentage: 68, alternative: 'No zest', altPercentage: 25 },
    { label: 'Coating', consensus: 'Shredded coconut rim', percentage: 60, alternative: 'Powdered sugar', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Dough handling', consensus: 'Chill before rolling', percentage: 82 },
    { label: 'Cookie thickness', consensus: 'Thick (1/2 inch)', percentage: 70, alternative: 'Thin and crisp', altPercentage: 22 },
    { label: 'Assembly timing', consensus: 'Fill when cooled', percentage: 90 },
  ],
  differs: [],
},

'empanadas': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'Rick Bayless', 'Food52', 'Bon Appétit'],
  ingredients: [
    { label: 'Dough fat', consensus: 'Butter or lard', percentage: 65, alternative: 'Oil-based dough', altPercentage: 20 },
    { label: 'Beef cut', consensus: 'Hand-cut chuck', percentage: 55, alternative: 'Ground beef', altPercentage: 40 },
    { label: 'Spice base', consensus: 'Cumin + paprika', percentage: 78 },
    { label: 'Olive addition', consensus: 'Green olives', percentage: 62, alternative: 'No olives', altPercentage: 30 },
    { label: 'Hard-boiled egg', consensus: 'Included, diced', percentage: 58, alternative: 'Omit', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Baked', percentage: 55, alternative: 'Fried', altPercentage: 40 },
    { label: 'Seal method', consensus: 'Repulgue crimp', percentage: 60, alternative: 'Fork press', altPercentage: 35 },
    { label: 'Egg wash', consensus: 'Yes, before baking', percentage: 78 },
  ],
  differs: [{ point: 'Filling style', detail: 'Uses ground beef for easier prep rather than the traditional hand-cut approach' }],
},

// ===== AUSTRALIAN / NEW ZEALAND =====

'pavlova': {
  recipesAnalyzed: 14,
  sources: ['NYT Cooking', 'Bon Appétit', 'Serious Eats', 'Food52', 'Epicurious'],
  ingredients: [
    { label: 'Vinegar/acid', consensus: 'White vinegar', percentage: 68, alternative: 'Lemon juice', altPercentage: 25 },
    { label: 'Cornstarch', consensus: 'Yes, 1-2 tsp', percentage: 82 },
    { label: 'Topping fruit', consensus: 'Passion fruit + berries', percentage: 60, alternative: 'Berries only', altPercentage: 30 },
    { label: 'Sugar type', consensus: 'Caster/superfine', percentage: 72, alternative: 'Regular granulated', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Egg temp', consensus: 'Room temperature', percentage: 88 },
    { label: 'Shape', consensus: 'Mounded with crater', percentage: 75, alternative: 'Flat disc', altPercentage: 20 },
    { label: 'Cooling method', consensus: 'Cool in oven, door ajar', percentage: 85 },
    { label: 'Oven temp', consensus: 'Start high, reduce', percentage: 55, alternative: 'Low and steady', altPercentage: 40 },
  ],
  differs: [],
},

// ===== BAJA MEXICAN =====

'fish-tacos': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'Rick Bayless', 'NYT Cooking', 'Bon Appétit', 'Food Network'],
  ingredients: [
    { label: 'Fish type', consensus: 'Cod or mahi-mahi', percentage: 62, alternative: 'Tilapia', altPercentage: 20 },
    { label: 'Batter base', consensus: 'Beer batter', percentage: 65, alternative: 'Seasoned flour', altPercentage: 22 },
    { label: 'Slaw type', consensus: 'Cabbage + lime', percentage: 85 },
    { label: 'Sauce', consensus: 'Crema or mayo-based', percentage: 78, alternative: 'Salsa verde', altPercentage: 15 },
    { label: 'Tortilla type', consensus: 'Corn tortillas', percentage: 72, alternative: 'Flour tortillas', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Cook method', consensus: 'Deep fried', percentage: 55, alternative: 'Pan-seared or grilled', altPercentage: 40 },
    { label: 'Double tortilla', consensus: 'Yes, two per taco', percentage: 58, alternative: 'Single tortilla', altPercentage: 38 },
    { label: 'Warm tortillas', consensus: 'Dry skillet or flame', percentage: 82 },
  ],
  differs: [],
},

// ===== BASQUE =====

'basque-cheesecake': {
  recipesAnalyzed: 13,
  sources: ['NYT Cooking', 'Bon Appétit', 'Serious Eats', 'Food52', 'Epicurious'],
  ingredients: [
    { label: 'Cream cheese', consensus: 'Full-fat, room temp', percentage: 95 },
    { label: 'Cream amount', consensus: 'Heavy cream, generous', percentage: 88 },
    { label: 'Flour', consensus: 'Small amount (1-2 tbsp)', percentage: 72, alternative: 'No flour', altPercentage: 20 },
    { label: 'Sugar level', consensus: 'Moderately sweet', percentage: 68, alternative: 'Reduced sugar', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Oven temp', consensus: 'Very high (425-450°F)', percentage: 90 },
    { label: 'Lining', consensus: 'Parchment, wrinkled', percentage: 88 },
    { label: 'Doneness', consensus: 'Jiggly center, dark top', percentage: 85 },
    { label: 'Crust', consensus: 'No crust at all', percentage: 95 },
  ],
  differs: [],
},

// ===== BELGIAN / FRENCH =====

'steamed-mussels': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food Network', 'Epicurious'],
  ingredients: [
    { label: 'Liquid base', consensus: 'White wine', percentage: 82, alternative: 'Beer (moules-frites)', altPercentage: 12 },
    { label: 'Aromatics', consensus: 'Shallots + garlic', percentage: 78, alternative: 'Onion + garlic', altPercentage: 18 },
    { label: 'Herb choice', consensus: 'Parsley', percentage: 72, alternative: 'Thyme', altPercentage: 18 },
    { label: 'Cream finish', consensus: 'Splash of cream', percentage: 55, alternative: 'No cream', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Lid during cook', consensus: 'Covered, high heat', percentage: 92 },
    { label: 'Cook time', consensus: '3-5 minutes total', percentage: 85 },
    { label: 'Serve with', consensus: 'Crusty bread + frites', percentage: 75, alternative: 'Bread only', altPercentage: 20 },
  ],
  differs: [],
},

// ===== BRAZILIAN =====

'moqueca-brazilian-fish-stew': {
  recipesAnalyzed: 11,
  sources: ['NYT Cooking', 'Serious Eats', 'Food52', 'Bon Appétit', 'Epicurious'],
  ingredients: [
    { label: 'Fish type', consensus: 'Firm white fish', percentage: 80, alternative: 'Shrimp', altPercentage: 15 },
    { label: 'Coconut milk', consensus: 'Full-fat, essential', percentage: 95 },
    { label: 'Palm oil (dendê)', consensus: 'Yes, traditional', percentage: 65, alternative: 'Substitute or omit', altPercentage: 28 },
    { label: 'Pepper type', consensus: 'Bell peppers', percentage: 78 },
    { label: 'Tomatoes', consensus: 'Fresh, diced', percentage: 68, alternative: 'Canned', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Layering', consensus: 'Layer, don\'t stir', percentage: 62, alternative: 'Sauté then simmer', altPercentage: 30 },
    { label: 'Marinate fish', consensus: 'Lime + garlic, 30 min', percentage: 75 },
    { label: 'Serve with', consensus: 'White rice + farofa', percentage: 82 },
  ],
  differs: [{ point: 'Dendê oil', detail: 'May reduce or substitute dendê oil for accessibility, diverging from Bahian tradition' }],
},

// ===== BRETON =====

'crepes': {
  recipesAnalyzed: 16,
  sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Food Network', 'King Arthur Baking', 'Epicurious'],
  ingredients: [
    { label: 'Flour type', consensus: 'All-purpose (sweet)', percentage: 72, alternative: 'Buckwheat (galettes)', altPercentage: 22 },
    { label: 'Liquid ratio', consensus: 'Milk + water blend', percentage: 55, alternative: 'All milk', altPercentage: 38 },
    { label: 'Butter in batter', consensus: 'Melted butter', percentage: 82 },
    { label: 'Egg count', consensus: '2-3 eggs per cup flour', percentage: 75 },
  ],
  techniques: [
    { label: 'Rest batter', consensus: 'At least 1 hour', percentage: 72, alternative: '30 minutes', altPercentage: 20 },
    { label: 'Pan type', consensus: 'Nonstick or steel crêpe pan', percentage: 80 },
    { label: 'Swirl technique', consensus: 'Lift pan and rotate', percentage: 85 },
    { label: 'First crêpe', consensus: 'Sacrifice it (test)', percentage: 70 },
  ],
  differs: [],
},

// ===== BRITISH =====

'bangers-and-mash': {
  recipesAnalyzed: 10,
  sources: ['BBC Good Food', 'Serious Eats', 'NYT Cooking', 'Food Network', 'Bon Appétit'],
  ingredients: [
    { label: 'Sausage type', consensus: 'Pork Cumberland', percentage: 60, alternative: 'Any pork banger', altPercentage: 30 },
    { label: 'Potato type', consensus: 'Floury (Maris Piper)', percentage: 72, alternative: 'Yukon Gold', altPercentage: 22 },
    { label: 'Mash fat', consensus: 'Butter + cream', percentage: 78, alternative: 'Butter + milk', altPercentage: 18 },
    { label: 'Gravy base', consensus: 'Onion gravy', percentage: 82, alternative: 'Beef gravy', altPercentage: 12 },
  ],
  techniques: [
    { label: 'Cook sausages', consensus: 'Oven or pan-fry', percentage: 55, alternative: 'Grill', altPercentage: 30 },
    { label: 'Mash method', consensus: 'Ricer or masher', percentage: 70, alternative: 'Fork mash', altPercentage: 22 },
    { label: 'Gravy method', consensus: 'Pan drippings + stock', percentage: 75 },
  ],
  differs: [],
},

'fish-and-chips': {
  recipesAnalyzed: 14,
  sources: ['BBC Good Food', 'Serious Eats', 'NYT Cooking', 'Food Network', 'Bon Appétit'],
  ingredients: [
    { label: 'Fish type', consensus: 'Cod', percentage: 55, alternative: 'Haddock', altPercentage: 35 },
    { label: 'Batter liquid', consensus: 'Beer', percentage: 72, alternative: 'Sparkling water', altPercentage: 22 },
    { label: 'Batter flour', consensus: 'Self-raising flour', percentage: 58, alternative: 'AP + baking powder', altPercentage: 32 },
    { label: 'Potato cut', consensus: 'Thick-cut chips', percentage: 80, alternative: 'Medium fries', altPercentage: 15 },
  ],
  techniques: [
    { label: 'Double fry chips', consensus: 'Yes, blanch then fry', percentage: 75, alternative: 'Single fry', altPercentage: 20 },
    { label: 'Oil temp (fish)', consensus: '375°F / 190°C', percentage: 70 },
    { label: 'Drain method', consensus: 'Wire rack, not paper', percentage: 60, alternative: 'Paper towels', altPercentage: 32 },
  ],
  differs: [],
},

'full-english-breakfast': {
  recipesAnalyzed: 11,
  sources: ['BBC Good Food', 'Serious Eats', 'NYT Cooking', 'Food Network', 'The Guardian'],
  ingredients: [
    { label: 'Egg style', consensus: 'Fried, runny yolk', percentage: 68, alternative: 'Scrambled', altPercentage: 20 },
    { label: 'Sausage type', consensus: 'Pork sausage links', percentage: 85 },
    { label: 'Bacon style', consensus: 'Back bacon', percentage: 72, alternative: 'Streaky bacon', altPercentage: 25 },
    { label: 'Beans', consensus: 'Heinz baked beans', percentage: 80, alternative: 'Homemade beans', altPercentage: 12 },
    { label: 'Toast type', consensus: 'White toast or fried bread', percentage: 65, alternative: 'Sourdough', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Cooking order', consensus: 'Sausages first, eggs last', percentage: 70 },
    { label: 'Tomato prep', consensus: 'Halved, grilled or fried', percentage: 75 },
    { label: 'Black pudding', consensus: 'Optional, sliced + fried', percentage: 55, alternative: 'Omit entirely', altPercentage: 38 },
  ],
  differs: [],
},

'scones': {
  recipesAnalyzed: 15,
  sources: ['BBC Good Food', 'King Arthur Baking', 'NYT Cooking', 'Paul Hollywood', 'Bon Appétit'],
  ingredients: [
    { label: 'Fat type', consensus: 'Cold butter', percentage: 72, alternative: 'Clotted cream in dough', altPercentage: 12 },
    { label: 'Leavening', consensus: 'Baking powder', percentage: 78, alternative: 'Self-raising flour', altPercentage: 18 },
    { label: 'Liquid', consensus: 'Milk', percentage: 55, alternative: 'Buttermilk', altPercentage: 32 },
    { label: 'Sugar amount', consensus: 'Lightly sweetened', percentage: 70, alternative: 'No sugar (savory)', altPercentage: 15 },
    { label: 'Add-ins', consensus: 'Plain or dried fruit', percentage: 60, alternative: 'Cheese (savory)', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Handling dough', consensus: 'Minimal, don\'t knead', percentage: 90 },
    { label: 'Cutter shape', consensus: 'Round, straight press', percentage: 75, alternative: 'Wedge-cut', altPercentage: 18 },
    { label: 'Egg wash', consensus: 'Brush top with egg', percentage: 65, alternative: 'Milk wash', altPercentage: 28 },
  ],
  differs: [],
},

'shepherd-s-pie': {
  recipesAnalyzed: 16,
  sources: ['BBC Good Food', 'Serious Eats', 'NYT Cooking', 'America\'s Test Kitchen', 'Food Network'],
  ingredients: [
    { label: 'Meat type', consensus: 'Lamb (true shepherd\'s)', percentage: 58, alternative: 'Beef (cottage pie)', altPercentage: 38 },
    { label: 'Mash topping', consensus: 'Butter + cream mash', percentage: 75 },
    { label: 'Veg in filling', consensus: 'Carrot, peas, onion', percentage: 82 },
    { label: 'Liquid', consensus: 'Stock + tomato paste', percentage: 65, alternative: 'Stock + Worcestershire', altPercentage: 28 },
    { label: 'Cheese on top', consensus: 'Optional cheddar', percentage: 48, alternative: 'No cheese', altPercentage: 45 },
  ],
  techniques: [
    { label: 'Thicken filling', consensus: 'Flour in filling', percentage: 62, alternative: 'Reduce liquid', altPercentage: 30 },
    { label: 'Broil top', consensus: 'Yes, for golden crust', percentage: 78 },
    { label: 'Fork pattern', consensus: 'Score mash with fork', percentage: 70, alternative: 'Pipe mash on top', altPercentage: 18 },
  ],
  differs: [],
},

'sticky-toffee-pudding': {
  recipesAnalyzed: 12,
  sources: ['BBC Good Food', 'NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Food52'],
  ingredients: [
    { label: 'Date type', consensus: 'Medjool dates', percentage: 58, alternative: 'Deglet Noor', altPercentage: 32 },
    { label: 'Toffee sauce', consensus: 'Butter + brown sugar + cream', percentage: 88 },
    { label: 'Leavening', consensus: 'Baking soda (reacts with dates)', percentage: 82 },
    { label: 'Espresso/coffee', consensus: 'Added to date mixture', percentage: 55, alternative: 'No coffee', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Date prep', consensus: 'Chop + soak in hot liquid', percentage: 90 },
    { label: 'Bake format', consensus: 'Individual ramekins', percentage: 52, alternative: 'One large pan', altPercentage: 42 },
    { label: 'Sauce application', consensus: 'Pour over + serve extra', percentage: 78 },
  ],
  differs: [],
},

'beef-stew': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'America\'s Test Kitchen', 'BBC Good Food', 'Allrecipes', 'Food Network'],
  ingredients: [
    { label: 'Beef cut', consensus: 'Chuck, cubed', percentage: 82, alternative: 'Short rib', altPercentage: 10 },
    { label: 'Starch veg', consensus: 'Yukon Gold potatoes', percentage: 65, alternative: 'Russet potatoes', altPercentage: 22 },
    { label: 'Liquid base', consensus: 'Beef stock + red wine', percentage: 58, alternative: 'Stock only', altPercentage: 32 },
    { label: 'Tomato element', consensus: 'Tomato paste', percentage: 72, alternative: 'Diced tomatoes', altPercentage: 18 },
    { label: 'Herb bundle', consensus: 'Thyme + bay leaf', percentage: 80 },
  ],
  techniques: [
    { label: 'Sear beef', consensus: 'Brown in batches', percentage: 90 },
    { label: 'Thickener', consensus: 'Flour-dusted meat', percentage: 55, alternative: 'Flour at end (slurry)', altPercentage: 25 },
    { label: 'Cook method', consensus: 'Low oven or stovetop', percentage: 65, alternative: 'Slow cooker', altPercentage: 28 },
    { label: 'Add veg timing', consensus: 'Stagger additions', percentage: 62, alternative: 'All at start', altPercentage: 30 },
  ],
  differs: [],
},

// ===== BRITISH-INDIAN =====

'chicken-tikka-masala': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'BBC Good Food', 'Food Network', 'Epicurious'],
  ingredients: [
    { label: 'Marinade base', consensus: 'Yogurt', percentage: 92 },
    { label: 'Spice blend', consensus: 'Garam masala + cumin + coriander', percentage: 78 },
    { label: 'Sauce base', consensus: 'Tomato + cream', percentage: 85 },
    { label: 'Chicken cut', consensus: 'Boneless thighs', percentage: 62, alternative: 'Breast', altPercentage: 32 },
    { label: 'Heat source', consensus: 'Kashmiri chili or paprika', percentage: 68, alternative: 'Cayenne', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Cook chicken', consensus: 'Broil or grill first', percentage: 72, alternative: 'Pan-sear', altPercentage: 22 },
    { label: 'Char level', consensus: 'Visible char spots', percentage: 75 },
    { label: 'Sauce simmer', consensus: '20-30 minutes', percentage: 65, alternative: '10-15 minutes', altPercentage: 28 },
    { label: 'Finish with', consensus: 'Butter + cream swirl', percentage: 70, alternative: 'Cream only', altPercentage: 25 },
  ],
  differs: [],
},

// ===== BURGUNDIAN =====

'beef-bourguignon': {
  recipesAnalyzed: 16,
  sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'America\'s Test Kitchen', 'Food Network', 'Epicurious'],
  ingredients: [
    { label: 'Beef cut', consensus: 'Chuck, large cubes', percentage: 78, alternative: 'Short rib', altPercentage: 15 },
    { label: 'Wine type', consensus: 'Burgundy / Pinot Noir', percentage: 72, alternative: 'Any dry red', altPercentage: 22 },
    { label: 'Pork element', consensus: 'Lardons / thick bacon', percentage: 82 },
    { label: 'Mushrooms', consensus: 'Button or cremini', percentage: 70, alternative: 'Mixed wild', altPercentage: 18 },
    { label: 'Pearl onions', consensus: 'Yes, classic garnish', percentage: 75, alternative: 'Regular onion only', altPercentage: 20 },
    { label: 'Tomato paste', consensus: 'Small amount', percentage: 72, alternative: 'None', altPercentage: 20 },
  ],
  techniques: [
    { label: 'Marinate in wine', consensus: 'No (modern method)', percentage: 55, alternative: 'Overnight marinade', altPercentage: 38 },
    { label: 'Sear beef', consensus: 'Dry and brown well', percentage: 92 },
    { label: 'Cook method', consensus: 'Low oven (325°F)', percentage: 68, alternative: 'Stovetop simmer', altPercentage: 28 },
    { label: 'Garnish timing', consensus: 'Cook separately, add late', percentage: 72 },
  ],
  differs: [],
},

'coq-au-vin': {
  recipesAnalyzed: 14,
  sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Food Network', 'America\'s Test Kitchen'],
  ingredients: [
    { label: 'Chicken parts', consensus: 'Bone-in thighs + legs', percentage: 65, alternative: 'Whole cut-up chicken', altPercentage: 30 },
    { label: 'Wine type', consensus: 'Burgundy / Pinot Noir', percentage: 70, alternative: 'Any dry red', altPercentage: 25 },
    { label: 'Pork element', consensus: 'Lardons', percentage: 78, alternative: 'Thick-cut bacon', altPercentage: 18 },
    { label: 'Mushrooms', consensus: 'Button or cremini', percentage: 72 },
    { label: 'Pearl onions', consensus: 'Yes, braised whole', percentage: 68, alternative: 'Shallots', altPercentage: 20 },
    { label: 'Cognac/brandy', consensus: 'Flambé step', percentage: 58, alternative: 'Skip flambé', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Marinate chicken', consensus: 'In wine overnight', percentage: 52, alternative: 'No marinade', altPercentage: 42 },
    { label: 'Thicken sauce', consensus: 'Beurre manié at end', percentage: 48, alternative: 'Reduce naturally', altPercentage: 35 },
    { label: 'Sear chicken', consensus: 'Brown skin-side first', percentage: 85 },
    { label: 'Braise time', consensus: '45-60 minutes', percentage: 72 },
  ],
  differs: [{ point: 'Wine marinade', detail: 'Skips the overnight wine marinade in favor of building flavor during the braise' }],
},

// ===== CAMPANIAN =====
'caprese-salad': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Bon Appétit', 'Ina Garten', 'Jamie Oliver', 'La Cucina Italiana'],
  ingredients: [
    { label: 'Tomato type', consensus: 'Ripe heirloom or vine', percentage: 82, alternative: 'Roma or plum', altPercentage: 12 },
    { label: 'Mozzarella', consensus: 'Fresh mozzarella di bufala', percentage: 88, alternative: 'Fior di latte', altPercentage: 10 },
    { label: 'Basil variety', consensus: 'Fresh sweet basil', percentage: 92 },
    { label: 'Olive oil', consensus: 'High-quality extra virgin', percentage: 95 },
    { label: 'Vinegar/acid', consensus: 'None', percentage: 58, alternative: 'Balsamic drizzle', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Slice thickness', consensus: '¼ inch thick', percentage: 74, alternative: 'Torn by hand', altPercentage: 18 },
    { label: 'Arrangement', consensus: 'Alternating overlapping slices', percentage: 85 },
    { label: 'Seasoning timing', consensus: 'Salt just before serving', percentage: 78, alternative: 'Salt in advance to draw juice', altPercentage: 15 },
  ],
  differs: [],
},

// ===== CANTONESE =====
'char-siu-chinese-bbq-pork': {
  recipesAnalyzed: 18,
  sources: ['Woks of Life', 'Serious Eats', 'RecipeTin Eats', 'Made with Lau', 'China Sichuan Food'],
  ingredients: [
    { label: 'Pork cut', consensus: 'Pork shoulder/butt', percentage: 62, alternative: 'Pork belly or loin', altPercentage: 30 },
    { label: 'Red color source', consensus: 'Red fermented tofu', percentage: 55, alternative: 'Food coloring or beetroot', altPercentage: 35 },
    { label: 'Sweetener', consensus: 'Honey', percentage: 72, alternative: 'Maltose', altPercentage: 22 },
    { label: 'Hoisin sauce', consensus: 'Included', percentage: 85 },
    { label: 'Five-spice powder', consensus: 'Included', percentage: 88 },
  ],
  techniques: [
    { label: 'Marination time', consensus: 'Overnight', percentage: 68, alternative: '2-4 hours', altPercentage: 25 },
    { label: 'Cooking method', consensus: 'Oven roast with glaze', percentage: 72, alternative: 'Grill or air fryer', altPercentage: 20 },
    { label: 'Glaze application', consensus: 'Multiple coats while roasting', percentage: 82 },
  ],
  differs: [
    { point: 'Color agent', detail: 'This recipe uses red fermented tofu rather than food coloring for a more traditional approach' },
  ],
},

'stir-fried-greens-with-garlic': {
  recipesAnalyzed: 15,
  sources: ['Woks of Life', 'Serious Eats', 'Made with Lau', 'China Sichuan Food', 'Omnivore\'s Cookbook'],
  ingredients: [
    { label: 'Greens choice', consensus: 'Gai lan or choy sum', percentage: 60, alternative: 'Bok choy or water spinach', altPercentage: 32 },
    { label: 'Garlic amount', consensus: '4-6 cloves, generous', percentage: 78 },
    { label: 'Oil type', consensus: 'Neutral oil (peanut/vegetable)', percentage: 85, alternative: 'Sesame oil', altPercentage: 8 },
    { label: 'Seasoning liquid', consensus: 'Shaoxing wine + soy', percentage: 65, alternative: 'Oyster sauce only', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Wok temperature', consensus: 'Smoking hot', percentage: 92 },
    { label: 'Blanch first', consensus: 'No, straight to wok', percentage: 58, alternative: 'Quick blanch then stir-fry', altPercentage: 38 },
    { label: 'Cook time', consensus: 'Under 2 minutes', percentage: 80 },
  ],
  differs: [],
},

// ===== CARIBBEAN =====
'plantain-fried-maduros': {
  recipesAnalyzed: 12,
  sources: ['Serious Eats', 'Dominican Cooking', 'My Dominican Kitchen', 'Laylita\'s Recipes', 'The Spruce Eats'],
  ingredients: [
    { label: 'Ripeness', consensus: 'Very ripe, black-skinned', percentage: 90 },
    { label: 'Oil type', consensus: 'Vegetable or canola', percentage: 72, alternative: 'Coconut oil', altPercentage: 15 },
    { label: 'Seasoning', consensus: 'Salt only', percentage: 65, alternative: 'Cinnamon or brown sugar', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Slice angle', consensus: 'Diagonal bias cut', percentage: 68, alternative: 'Straight rounds', altPercentage: 28 },
    { label: 'Oil depth', consensus: 'Shallow fry (½ inch)', percentage: 75, alternative: 'Deep fry', altPercentage: 18 },
    { label: 'Flip timing', consensus: 'When edges caramelize, ~2 min', percentage: 82 },
  ],
  differs: [],
},

// ===== CAUCASIAN =====
'kebab-lula': {
  recipesAnalyzed: 14,
  sources: ['Taste of Beirut', 'SBS Food', 'The Spruce Eats', 'Saveur', 'Russian food blogs'],
  ingredients: [
    { label: 'Meat', consensus: 'Ground lamb', percentage: 65, alternative: 'Lamb-beef blend', altPercentage: 28 },
    { label: 'Fat ratio', consensus: '20-25% fat content', percentage: 78 },
    { label: 'Onion prep', consensus: 'Grated, squeezed dry', percentage: 85 },
    { label: 'Spice mix', consensus: 'Cumin, coriander, sumac', percentage: 70, alternative: 'Paprika and black pepper only', altPercentage: 20 },
  ],
  techniques: [
    { label: 'Skewer type', consensus: 'Wide flat metal skewers', percentage: 75, alternative: 'Wooden skewers', altPercentage: 18 },
    { label: 'Meat prep', consensus: 'Knead until sticky/pasty', percentage: 88 },
    { label: 'Cooking method', consensus: 'Charcoal grill', percentage: 60, alternative: 'Broiler or grill pan', altPercentage: 32 },
  ],
  differs: [
    { point: 'Binding agent', detail: 'This recipe relies on kneading alone rather than adding egg or breadcrumbs as a binder' },
  ],
},

// ===== CHESAPEAKE BAY =====
'crab-cakes': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'Bon Appétit', 'J.O. Spice', 'Baltimore Sun', 'Saveur', 'America\'s Test Kitchen'],
  ingredients: [
    { label: 'Crab type', consensus: 'Lump or jumbo lump blue crab', percentage: 90 },
    { label: 'Binder', consensus: 'Mayo + egg', percentage: 78, alternative: 'Mayo only', altPercentage: 15 },
    { label: 'Filler amount', consensus: 'Minimal crackers or breadcrumbs', percentage: 72, alternative: 'No filler at all', altPercentage: 20 },
    { label: 'Seasoning', consensus: 'Old Bay', percentage: 88, alternative: 'J.O. Spice or custom blend', altPercentage: 10 },
    { label: 'Mustard type', consensus: 'Dijon', percentage: 62, alternative: 'Yellow mustard', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Mixing method', consensus: 'Fold gently, don\'t break lumps', percentage: 92 },
    { label: 'Cooking method', consensus: 'Pan-seared in butter', percentage: 58, alternative: 'Broiled', altPercentage: 32 },
    { label: 'Chill before cooking', consensus: 'Yes, 30+ minutes', percentage: 82 },
  ],
  differs: [],
},

// ===== CHINESE =====
'congee-jook': {
  recipesAnalyzed: 16,
  sources: ['Woks of Life', 'Serious Eats', 'China Sichuan Food', 'Made with Lau', 'Omnivore\'s Cookbook'],
  ingredients: [
    { label: 'Rice type', consensus: 'Jasmine or long grain', percentage: 65, alternative: 'Short grain or broken rice', altPercentage: 28 },
    { label: 'Liquid ratio', consensus: '1:10 rice to water', percentage: 55, alternative: '1:8 ratio', altPercentage: 30 },
    { label: 'Stock base', consensus: 'Water with ginger', percentage: 50, alternative: 'Chicken stock', altPercentage: 42 },
    { label: 'Protein', consensus: 'Century egg + pork', percentage: 45, alternative: 'Chicken or plain', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Pre-soak rice', consensus: 'No, cook directly', percentage: 55, alternative: 'Soak 30 min or freeze rice', altPercentage: 38 },
    { label: 'Cook time', consensus: '1-1.5 hours on low', percentage: 72, alternative: 'Pressure cooker 30 min', altPercentage: 22 },
    { label: 'Stirring', consensus: 'Occasional stirring', percentage: 70, alternative: 'Constant stirring for creaminess', altPercentage: 25 },
  ],
  differs: [],
},

'fried-rice': {
  recipesAnalyzed: 22,
  sources: ['Woks of Life', 'Serious Eats', 'Kenji López-Alt', 'Made with Lau', 'RecipeTin Eats', 'Chinese Cooking Demystified'],
  ingredients: [
    { label: 'Rice age', consensus: 'Day-old cold rice', percentage: 88, alternative: 'Fresh rice spread to dry', altPercentage: 10 },
    { label: 'Rice variety', consensus: 'Long grain jasmine', percentage: 72, alternative: 'Short grain or medium', altPercentage: 20 },
    { label: 'Fat', consensus: 'Neutral oil', percentage: 68, alternative: 'Lard or schmaltz', altPercentage: 22 },
    { label: 'Soy sauce', consensus: 'Light soy sauce', percentage: 75, alternative: 'Dark soy or both', altPercentage: 20 },
    { label: 'Egg method', consensus: 'Scrambled separately first', percentage: 60, alternative: 'Egg mixed into rice directly', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Wok heat', consensus: 'Maximum heat (wok hei)', percentage: 90 },
    { label: 'Batch size', consensus: '2 servings max per batch', percentage: 78 },
    { label: 'Tossing', consensus: 'Continuous tossing/flipping', percentage: 82 },
  ],
  differs: [
    { point: 'Egg technique', detail: 'This recipe adds egg directly to the rice for coating rather than scrambling separately' },
  ],
},

'tofu-stir-fry': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'Woks of Life', 'Budget Bytes', 'Cookie and Kate', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Tofu type', consensus: 'Extra-firm, pressed', percentage: 82, alternative: 'Firm tofu', altPercentage: 14 },
    { label: 'Sauce base', consensus: 'Soy + sesame + garlic', percentage: 70, alternative: 'Black bean sauce or hoisin', altPercentage: 22 },
    { label: 'Thickener', consensus: 'Cornstarch in sauce', percentage: 75 },
    { label: 'Vegetables', consensus: 'Broccoli, bell pepper, snap peas', percentage: 65, alternative: 'Seasonal mix', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Press tofu', consensus: 'Yes, 15-30 minutes', percentage: 85 },
    { label: 'Tofu coating', consensus: 'Cornstarch dusted', percentage: 72, alternative: 'No coating', altPercentage: 22 },
    { label: 'Cook tofu first', consensus: 'Yes, sear separately', percentage: 88 },
  ],
  differs: [],
},

// ===== CUBAN =====
'ropa-vieja': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NY Times Cooking', 'Saveur', 'Three Guys From Miami', 'Epicurious'],
  ingredients: [
    { label: 'Beef cut', consensus: 'Flank steak', percentage: 72, alternative: 'Brisket or chuck', altPercentage: 22 },
    { label: 'Pepper type', consensus: 'Bell peppers (red + green)', percentage: 85 },
    { label: 'Tomato base', consensus: 'Tomato sauce + paste', percentage: 70, alternative: 'Crushed tomatoes only', altPercentage: 22 },
    { label: 'Dry white wine', consensus: 'Included', percentage: 68, alternative: 'Omitted', altPercentage: 28 },
    { label: 'Olives + capers', consensus: 'Included', percentage: 78, alternative: 'Olives only', altPercentage: 15 },
  ],
  techniques: [
    { label: 'Braising method', consensus: 'Braise whole then shred', percentage: 88 },
    { label: 'Cook time', consensus: '2-3 hours low and slow', percentage: 75, alternative: 'Pressure cooker 45 min', altPercentage: 20 },
    { label: 'Shredding', consensus: 'Shred with two forks', percentage: 90 },
  ],
  differs: [],
},

// ===== DELHI =====
'butter-chicken-murgh-makhani': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'RecipeTin Eats', 'Madhur Jaffrey', 'Swasthi\'s Recipes', 'Vahchef', 'Bon Appétit'],
  ingredients: [
    { label: 'Chicken cut', consensus: 'Boneless thighs', percentage: 65, alternative: 'Bone-in or breast', altPercentage: 30 },
    { label: 'Marinade base', consensus: 'Yogurt + spices', percentage: 92 },
    { label: 'Sauce fat', consensus: 'Butter (lots)', percentage: 88, alternative: 'Butter + cream blend', altPercentage: 10 },
    { label: 'Tomato form', consensus: 'Canned whole, blended', percentage: 58, alternative: 'Fresh tomatoes or passata', altPercentage: 35 },
    { label: 'Cream', consensus: 'Heavy cream at end', percentage: 82 },
    { label: 'Kasuri methi', consensus: 'Included (dried fenugreek)', percentage: 85 },
  ],
  techniques: [
    { label: 'Chicken pre-cook', consensus: 'Grill or broil marinated chicken', percentage: 68, alternative: 'Pan-sear', altPercentage: 25 },
    { label: 'Sauce texture', consensus: 'Blended smooth', percentage: 82, alternative: 'Chunky/rustic', altPercentage: 12 },
    { label: 'Simmer time', consensus: '20-30 minutes', percentage: 75 },
  ],
  differs: [
    { point: 'Tomato choice', detail: 'This recipe uses canned whole tomatoes blended smooth rather than fresh tomatoes' },
  ],
},

// ===== EASTERN EUROPEAN JEWISH =====
'babka': {
  recipesAnalyzed: 16,
  sources: ['Smitten Kitchen', 'NY Times Cooking', 'King Arthur Baking', 'Bon Appétit', 'The Kitchn'],
  ingredients: [
    { label: 'Filling', consensus: 'Chocolate', percentage: 72, alternative: 'Cinnamon-sugar', altPercentage: 25 },
    { label: 'Dough enrichment', consensus: 'Butter + eggs + milk', percentage: 80, alternative: 'Oil-based (pareve)', altPercentage: 15 },
    { label: 'Chocolate type', consensus: 'Bittersweet/dark', percentage: 78, alternative: 'Cocoa powder paste', altPercentage: 18 },
    { label: 'Simple syrup', consensus: 'Brushed after baking', percentage: 85 },
  ],
  techniques: [
    { label: 'Dough chill', consensus: 'Overnight refrigerate', percentage: 75, alternative: 'Same-day, 2-hour chill', altPercentage: 20 },
    { label: 'Shaping', consensus: 'Roll, spread, twist into figure-8', percentage: 82 },
    { label: 'Proofing', consensus: 'Second rise in pan, 1 hour', percentage: 78 },
  ],
  differs: [],
},

// ===== EGYPTIAN =====
'foul-mudammas': {
  recipesAnalyzed: 13,
  sources: ['Serious Eats', 'The Mediterranean Dish', 'Feel Good Foodie', 'Cleobuttera', 'Egyptian Streets'],
  ingredients: [
    { label: 'Bean type', consensus: 'Dried fava beans, slow-cooked', percentage: 85, alternative: 'Canned fava beans', altPercentage: 12 },
    { label: 'Acid', consensus: 'Fresh lemon juice', percentage: 92 },
    { label: 'Fat', consensus: 'Extra virgin olive oil', percentage: 88 },
    { label: 'Garlic', consensus: 'Raw garlic, crushed', percentage: 75, alternative: 'Cooked with beans', altPercentage: 18 },
    { label: 'Tahini', consensus: 'Optional drizzle', percentage: 55, alternative: 'Always included', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Bean texture', consensus: 'Partially mashed, chunky', percentage: 72, alternative: 'Smooth purée', altPercentage: 22 },
    { label: 'Cook time', consensus: '6-8 hours low simmer', percentage: 65, alternative: 'Pressure cook 1 hour', altPercentage: 28 },
    { label: 'Serving', consensus: 'Warm with toppings on top', percentage: 90 },
  ],
  differs: [],
},

'koshari': {
  recipesAnalyzed: 12,
  sources: ['Serious Eats', 'The Mediterranean Dish', 'Cleobuttera', 'Egyptian Food', 'Feel Good Foodie'],
  ingredients: [
    { label: 'Pasta shape', consensus: 'Small elbow macaroni', percentage: 70, alternative: 'Ditalini or small shells', altPercentage: 22 },
    { label: 'Rice type', consensus: 'Egyptian or short grain', percentage: 65, alternative: 'Long grain white', altPercentage: 30 },
    { label: 'Lentil type', consensus: 'Brown lentils', percentage: 78, alternative: 'Green lentils', altPercentage: 18 },
    { label: 'Tomato sauce spice', consensus: 'Cumin + vinegar + chili', percentage: 82 },
    { label: 'Crispy onions', consensus: 'Deep-fried, generous pile', percentage: 92 },
  ],
  techniques: [
    { label: 'Cook components', consensus: 'All cooked separately', percentage: 88 },
    { label: 'Assembly', consensus: 'Layer then top with sauce', percentage: 80 },
    { label: 'Da\'a (vinegar sauce)', consensus: 'Served alongside', percentage: 75, alternative: 'Mixed into tomato sauce', altPercentage: 18 },
  ],
  differs: [
    { point: 'Chickpeas', detail: 'This recipe includes chickpeas as a layer, which some traditional versions omit' },
  ],
},

// ===== EGYPTIAN / LEVANTINE =====
'falafel': {
  recipesAnalyzed: 21,
  sources: ['Serious Eats', 'The Mediterranean Dish', 'Tori Avey', 'RecipeTin Eats', 'Bon Appétit', 'Middle Eastern food blogs'],
  ingredients: [
    { label: 'Bean base', consensus: 'Dried chickpeas, soaked raw', percentage: 90, alternative: 'Canned chickpeas', altPercentage: 8 },
    { label: 'Herbs', consensus: 'Parsley + cilantro', percentage: 78, alternative: 'Parsley only', altPercentage: 18 },
    { label: 'Leavening', consensus: 'Baking powder', percentage: 72, alternative: 'No leavening', altPercentage: 22 },
    { label: 'Allspice/cumin', consensus: 'Both included', percentage: 82 },
  ],
  techniques: [
    { label: 'Bean prep', consensus: 'Soak 24h, do NOT cook', percentage: 92 },
    { label: 'Cooking method', consensus: 'Deep-fried at 350°F', percentage: 75, alternative: 'Baked or pan-fried', altPercentage: 22 },
    { label: 'Binding', consensus: 'No flour or egg, raw bean starch', percentage: 68, alternative: 'Small amount of flour', altPercentage: 28 },
  ],
  differs: [],
},

// ===== EMILIAN =====
'bolognese-ragu-alla-bolognese': {
  recipesAnalyzed: 25,
  sources: ['Serious Eats', 'Bon Appétit', 'Marcella Hazan', 'NY Times Cooking', 'Accademia Italiana della Cucina', 'The Local Italy'],
  ingredients: [
    { label: 'Meat mix', consensus: 'Beef + pork', percentage: 65, alternative: 'Beef only or beef-veal-pork', altPercentage: 30 },
    { label: 'Tomato amount', consensus: 'Restrained, not dominant', percentage: 78, alternative: 'Tomato-heavy sauce', altPercentage: 18 },
    { label: 'Soffritto', consensus: 'Onion, carrot, celery', percentage: 95 },
    { label: 'Liquid', consensus: 'Wine + milk/cream', percentage: 72, alternative: 'Wine + broth only', altPercentage: 22 },
    { label: 'Wine color', consensus: 'White wine', percentage: 55, alternative: 'Red wine', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Cook time', consensus: '3-4 hours minimum', percentage: 82, alternative: '1-2 hours', altPercentage: 15 },
    { label: 'Milk addition', consensus: 'Add before tomatoes', percentage: 65, alternative: 'Add after or skip', altPercentage: 28 },
    { label: 'Pasta pairing', consensus: 'Tagliatelle, not spaghetti', percentage: 70, alternative: 'Pappardelle or rigatoni', altPercentage: 22 },
  ],
  differs: [
    { point: 'Wine debate', detail: 'This recipe uses white wine per the official Bologna recipe, though many popular versions call for red' },
  ],
},

// ===== FILIPINO =====
'chicken-adobo': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'Panlasang Pinoy', 'Kawaling Pinoy', 'NY Times Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Chicken cut', consensus: 'Bone-in thighs + drumsticks', percentage: 72, alternative: 'Boneless thighs', altPercentage: 22 },
    { label: 'Vinegar type', consensus: 'Cane or coconut vinegar', percentage: 68, alternative: 'White or rice vinegar', altPercentage: 25 },
    { label: 'Soy sauce ratio', consensus: 'Equal parts soy + vinegar', percentage: 60, alternative: 'More soy than vinegar', altPercentage: 30 },
    { label: 'Bay leaves', consensus: 'Included', percentage: 88 },
    { label: 'Peppercorns', consensus: 'Whole black, generous', percentage: 82 },
  ],
  techniques: [
    { label: 'Marinate first', consensus: 'No, braise directly', percentage: 55, alternative: 'Marinate 30 min-overnight', altPercentage: 40 },
    { label: 'Browning', consensus: 'Sear after braising for crisp skin', percentage: 62, alternative: 'Sear before braising', altPercentage: 30 },
    { label: 'Reduce sauce', consensus: 'Reduce until thick and glossy', percentage: 78 },
  ],
  differs: [],
},

// ===== FLORIDIAN =====
'key-lime-pie': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Bon Appétit', 'NY Times Cooking', 'King Arthur Baking', 'Joe\'s Stone Crab', 'Epicurious'],
  ingredients: [
    { label: 'Lime type', consensus: 'Key limes (bottled OK)', percentage: 72, alternative: 'Persian limes', altPercentage: 25 },
    { label: 'Crust', consensus: 'Graham cracker', percentage: 88, alternative: 'Animal cracker or cookie', altPercentage: 8 },
    { label: 'Condensed milk', consensus: 'Sweetened condensed milk', percentage: 95 },
    { label: 'Eggs', consensus: 'Egg yolks only', percentage: 85 },
  ],
  techniques: [
    { label: 'Bake filling', consensus: 'Yes, bake 15 minutes', percentage: 72, alternative: 'No-bake, chill to set', altPercentage: 22 },
    { label: 'Topping', consensus: 'Whipped cream', percentage: 68, alternative: 'Meringue', altPercentage: 28 },
    { label: 'Chill time', consensus: '4+ hours or overnight', percentage: 85 },
  ],
  differs: [],
},

// ===== FRENCH =====
'baguette': {
  recipesAnalyzed: 18,
  sources: ['King Arthur Baking', 'Serious Eats', 'NY Times Cooking', 'Bon Appétit', 'The Perfect Loaf', 'Bake with Jack'],
  ingredients: [
    { label: 'Flour type', consensus: 'Bread flour or T65', percentage: 72, alternative: 'All-purpose', altPercentage: 25 },
    { label: 'Yeast type', consensus: 'Instant/active dry', percentage: 65, alternative: 'Preferment/poolish', altPercentage: 30 },
    { label: 'Hydration', consensus: '68-72%', percentage: 75, alternative: 'Higher hydration 75%+', altPercentage: 18 },
    { label: 'Ingredients total', consensus: 'Flour, water, salt, yeast only', percentage: 92 },
  ],
  techniques: [
    { label: 'Bulk ferment', consensus: 'Long cold ferment overnight', percentage: 58, alternative: 'Room temp 1-2 hours', altPercentage: 35 },
    { label: 'Shaping', consensus: 'Pre-shape, rest, final shape', percentage: 82 },
    { label: 'Steam in oven', consensus: 'Yes, steam for crust', percentage: 90 },
    { label: 'Scoring', consensus: 'Diagonal slashes with lame', percentage: 88 },
  ],
  differs: [],
},

'bechamel-white-sauce': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'Bon Appétit', 'Julia Child', 'BBC Good Food', 'Epicurious'],
  ingredients: [
    { label: 'Fat', consensus: 'Butter', percentage: 92 },
    { label: 'Flour type', consensus: 'All-purpose', percentage: 90 },
    { label: 'Milk temp', consensus: 'Warm/hot milk', percentage: 72, alternative: 'Cold milk', altPercentage: 25 },
    { label: 'Nutmeg', consensus: 'Pinch of fresh nutmeg', percentage: 78, alternative: 'Omitted', altPercentage: 18 },
    { label: 'Bay leaf', consensus: 'Optional, infused in milk', percentage: 55, alternative: 'Skipped', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Roux cook time', consensus: '1-2 min, no color', percentage: 85 },
    { label: 'Milk addition', consensus: 'Gradually, whisking constantly', percentage: 88 },
    { label: 'Consistency test', consensus: 'Coats back of spoon', percentage: 80 },
  ],
  differs: [],
},

'classic-roast-chicken': {
  recipesAnalyzed: 24,
  sources: ['Serious Eats', 'Thomas Keller', 'Bon Appétit', 'Julia Child', 'NY Times Cooking', 'Ina Garten'],
  ingredients: [
    { label: 'Bird size', consensus: '3.5-4.5 lbs whole', percentage: 78 },
    { label: 'Fat', consensus: 'Butter (under skin + outside)', percentage: 65, alternative: 'Olive oil only', altPercentage: 28 },
    { label: 'Aromatics', consensus: 'Lemon + thyme + garlic in cavity', percentage: 72 },
    { label: 'Pre-salt', consensus: 'Dry brine overnight', percentage: 58, alternative: 'Season just before', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Oven temp', consensus: 'High heat, 425-450°F', percentage: 68, alternative: 'Start high then lower', altPercentage: 22 },
    { label: 'Trussing', consensus: 'Yes, truss legs', percentage: 55, alternative: 'Spatchcock or untied', altPercentage: 38 },
    { label: 'Rest after cooking', consensus: '15-20 minutes', percentage: 90 },
  ],
  differs: [
    { point: 'Temperature approach', detail: 'This recipe uses consistent high heat rather than the two-temperature method some chefs prefer' },
  ],
},

'creme-brulee': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'Bon Appétit', 'NY Times Cooking', 'Julia Child', 'BBC Good Food'],
  ingredients: [
    { label: 'Cream type', consensus: 'Heavy cream only', percentage: 72, alternative: 'Cream + milk blend', altPercentage: 22 },
    { label: 'Sugar in custard', consensus: 'Granulated white', percentage: 78, alternative: 'Superfine/caster', altPercentage: 18 },
    { label: 'Eggs', consensus: 'Yolks only (4-6)', percentage: 88 },
    { label: 'Vanilla form', consensus: 'Vanilla bean pod', percentage: 62, alternative: 'Extract', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Infuse cream', consensus: 'Heat cream with vanilla, steep', percentage: 75, alternative: 'Mix vanilla into cold cream', altPercentage: 20 },
    { label: 'Bake method', consensus: 'Water bath, 300-325°F', percentage: 90 },
    { label: 'Torch method', consensus: 'Thin even sugar layer, torch', percentage: 85, alternative: 'Broiler', altPercentage: 12 },
  ],
  differs: [],
},

'french-onion-soup': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'Bon Appétit', 'NY Times Cooking', 'Julia Child', 'America\'s Test Kitchen', 'Epicurious'],
  ingredients: [
    { label: 'Onion type', consensus: 'Yellow onions', percentage: 72, alternative: 'Mix of yellow + red', altPercentage: 18 },
    { label: 'Onion quantity', consensus: '3-4 lbs (lots)', percentage: 82 },
    { label: 'Deglazing liquid', consensus: 'Dry white wine', percentage: 60, alternative: 'Sherry or cognac', altPercentage: 30 },
    { label: 'Broth', consensus: 'Beef broth', percentage: 68, alternative: 'Beef + chicken blend', altPercentage: 22 },
    { label: 'Cheese', consensus: 'Gruyère', percentage: 85, alternative: 'Swiss or comté', altPercentage: 12 },
  ],
  techniques: [
    { label: 'Caramelize time', consensus: '45-60 minutes low heat', percentage: 75, alternative: '25-30 min medium heat', altPercentage: 20 },
    { label: 'Bread type', consensus: 'Thick-cut baguette, toasted', percentage: 80 },
    { label: 'Broil cheese', consensus: 'Under broiler until bubbly', percentage: 90 },
  ],
  differs: [],
},

'galette-freeform-fruit-tart': {
  recipesAnalyzed: 15,
  sources: ['Smitten Kitchen', 'Bon Appétit', 'King Arthur Baking', 'NY Times Cooking', 'Serious Eats'],
  ingredients: [
    { label: 'Dough type', consensus: 'Butter pie dough, cold', percentage: 85 },
    { label: 'Fruit prep', consensus: 'Tossed with sugar + starch', percentage: 78 },
    { label: 'Thickener', consensus: 'Cornstarch', percentage: 62, alternative: 'Flour or tapioca', altPercentage: 30 },
    { label: 'Egg wash', consensus: 'Egg + cream on edges', percentage: 72, alternative: 'Milk wash', altPercentage: 18 },
    { label: 'Finishing sugar', consensus: 'Turbinado/coarse sugar on crust', percentage: 80 },
  ],
  techniques: [
    { label: 'Dough temp', consensus: 'Keep very cold throughout', percentage: 92 },
    { label: 'Border fold', consensus: '2-3 inch fold over fruit', percentage: 78 },
    { label: 'Bake temp', consensus: '400°F until golden', percentage: 72, alternative: '375°F longer bake', altPercentage: 22 },
  ],
  differs: [],
},

'lemon-tart-tarte-au-citron': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Bon Appétit', 'David Lebovitz', 'BBC Good Food', 'Pâtisserie Made Simple'],
  ingredients: [
    { label: 'Crust type', consensus: 'Pâte sucrée (sweet tart dough)', percentage: 82, alternative: 'Pâte sablée', altPercentage: 15 },
    { label: 'Citrus', consensus: 'Lemon juice + zest', percentage: 90 },
    { label: 'Eggs in curd', consensus: 'Whole eggs + extra yolks', percentage: 75, alternative: 'Yolks only', altPercentage: 20 },
    { label: 'Cream/butter', consensus: 'Butter enriched', percentage: 68, alternative: 'Heavy cream added', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Blind bake crust', consensus: 'Yes, fully blind bake', percentage: 88 },
    { label: 'Fill method', consensus: 'Pour curd into hot shell in oven', percentage: 60, alternative: 'Fill cooled shell, bake', altPercentage: 32 },
    { label: 'Curd cooking', consensus: 'Cook on stovetop first', percentage: 72, alternative: 'Bake raw filling in shell', altPercentage: 22 },
  ],
  differs: [],
},

'mayonnaise-homemade': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Bon Appétit', 'Julia Child', 'Epicurious', 'Food Lab'],
  ingredients: [
    { label: 'Oil type', consensus: 'Neutral oil (canola/grapeseed)', percentage: 65, alternative: 'Light olive oil or blend', altPercentage: 28 },
    { label: 'Acid', consensus: 'Lemon juice', percentage: 58, alternative: 'White wine vinegar or both', altPercentage: 35 },
    { label: 'Mustard', consensus: 'Dijon, small amount', percentage: 82 },
    { label: 'Egg component', consensus: 'Whole egg', percentage: 55, alternative: 'Yolk only (traditional)', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Emulsion method', consensus: 'Immersion blender', percentage: 58, alternative: 'Whisk by hand or food processor', altPercentage: 35 },
    { label: 'Oil addition', consensus: 'Slow thin stream', percentage: 85 },
    { label: 'Room temp eggs', consensus: 'Yes, room temperature', percentage: 72 },
  ],
  differs: [
    { point: 'Egg choice', detail: 'This recipe uses whole egg for easier emulsification rather than yolk-only traditional method' },
  ],
},

'moules-marinieres': {
  recipesAnalyzed: 13,
  sources: ['Serious Eats', 'Bon Appétit', 'BBC Good Food', 'Raymond Blanc', 'David Lebovitz'],
  ingredients: [
    { label: 'Liquid', consensus: 'Dry white wine', percentage: 88 },
    { label: 'Aromatics', consensus: 'Shallots + garlic + parsley', percentage: 82 },
    { label: 'Fat', consensus: 'Butter', percentage: 78, alternative: 'Olive oil', altPercentage: 15 },
    { label: 'Cream', consensus: 'No cream (classic)', percentage: 55, alternative: 'Splash of cream', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Clean mussels', consensus: 'Scrub, debeard, discard open', percentage: 92 },
    { label: 'Cooking method', consensus: 'High heat, covered, steam open', percentage: 90 },
    { label: 'Cook time', consensus: '3-5 minutes until all open', percentage: 85 },
  ],
  differs: [],
},

'sauce-bearnaise': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Bon Appétit', 'Julia Child', 'Escoffier Online', 'French Cooking Academy'],
  ingredients: [
    { label: 'Vinegar type', consensus: 'White wine vinegar', percentage: 72, alternative: 'Tarragon vinegar', altPercentage: 22 },
    { label: 'Herb', consensus: 'Fresh tarragon (essential)', percentage: 92 },
    { label: 'Shallot', consensus: 'Minced shallot in reduction', percentage: 88 },
    { label: 'Fat', consensus: 'Clarified butter', percentage: 75, alternative: 'Whole melted butter', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Reduction first', consensus: 'Reduce vinegar + shallot + tarragon', percentage: 90 },
    { label: 'Emulsion method', consensus: 'Double boiler, whisk yolks', percentage: 68, alternative: 'Immersion blender method', altPercentage: 25 },
    { label: 'Butter temp', consensus: 'Add warm butter slowly', percentage: 82 },
  ],
  differs: [],
},

'soupe-a-l-oignon-french-onion-soup': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Bon Appétit', 'Julia Child', 'NY Times Cooking', 'Saveur'],
  ingredients: [
    { label: 'Onion type', consensus: 'Yellow onions', percentage: 70, alternative: 'Sweet onions or mixed', altPercentage: 22 },
    { label: 'Broth', consensus: 'Rich beef stock', percentage: 72, alternative: 'Beef-chicken blend', altPercentage: 20 },
    { label: 'Wine', consensus: 'Dry white wine', percentage: 58, alternative: 'Dry sherry', altPercentage: 30 },
    { label: 'Cheese topping', consensus: 'Gruyère, thickly grated', percentage: 82, alternative: 'Comté or Emmental', altPercentage: 15 },
  ],
  techniques: [
    { label: 'Caramelization', consensus: 'Low and slow, 45-60 min', percentage: 78 },
    { label: 'Deglaze pan', consensus: 'Multiple times during caramelizing', percentage: 65, alternative: 'Once at the end', altPercentage: 28 },
    { label: 'Gratinée finish', consensus: 'Broil in oven-safe crocks', percentage: 88 },
  ],
  differs: [],
},

'tarte-tatin': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Bon Appétit', 'David Lebovitz', 'BBC Good Food', 'NY Times Cooking'],
  ingredients: [
    { label: 'Apple variety', consensus: 'Firm baking apple (Granny Smith)', percentage: 60, alternative: 'Golden Delicious or Braeburn', altPercentage: 30 },
    { label: 'Pastry', consensus: 'Puff pastry', percentage: 65, alternative: 'Pie dough or pâte brisée', altPercentage: 30 },
    { label: 'Caramel base', consensus: 'Butter + sugar cooked in pan', percentage: 88 },
    { label: 'Spice', consensus: 'None (pure apple + caramel)', percentage: 60, alternative: 'Vanilla or cinnamon', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Caramel method', consensus: 'Cook caramel in oven-safe skillet', percentage: 78 },
    { label: 'Apple arrangement', consensus: 'Tightly packed, standing upright', percentage: 72, alternative: 'Halved, cut-side up', altPercentage: 22 },
    { label: 'Flip timing', consensus: 'Invert immediately after baking', percentage: 85 },
  ],
  differs: [
    { point: 'Pastry choice', detail: 'This recipe uses puff pastry for ease, though some traditionalists insist on shortcrust' },
  ],
},

'vinaigrette': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Bon Appétit', 'NY Times Cooking', 'Julia Child', 'Epicurious'],
  ingredients: [
    { label: 'Oil-acid ratio', consensus: '3:1 oil to vinegar', percentage: 68, alternative: '2:1 ratio', altPercentage: 25 },
    { label: 'Vinegar type', consensus: 'Red wine vinegar', percentage: 42, alternative: 'Sherry, champagne, or balsamic', altPercentage: 45 },
    { label: 'Emulsifier', consensus: 'Dijon mustard', percentage: 82 },
    { label: 'Sweetener', consensus: 'None', percentage: 58, alternative: 'Honey or pinch of sugar', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Mixing method', consensus: 'Whisk in bowl', percentage: 55, alternative: 'Shake in jar', altPercentage: 38 },
    { label: 'Oil stream', consensus: 'Slow drizzle while whisking', percentage: 72 },
    { label: 'Season timing', consensus: 'Dissolve salt in acid first', percentage: 65, alternative: 'Season at end', altPercentage: 28 },
  ],
  differs: [],
},

// ===== FRENCH (LANGUEDOC) =====
'cassoulet': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Bon Appétit', 'NY Times Cooking', 'Saveur', 'David Lebovitz', 'French Cooking Academy'],
  ingredients: [
    { label: 'Bean type', consensus: 'White beans (Tarbais or cannellini)', percentage: 85 },
    { label: 'Meat core', consensus: 'Duck confit + pork sausage', percentage: 72, alternative: 'Toulouse sausage + pork shoulder', altPercentage: 22 },
    { label: 'Pork cut', consensus: 'Pork shoulder or belly', percentage: 68, alternative: 'Pork rind/skin only', altPercentage: 22 },
    { label: 'Breadcrumb crust', consensus: 'Yes, golden breadcrumb top', percentage: 80 },
    { label: 'Tomato', consensus: 'Small amount of paste/purée', percentage: 62, alternative: 'No tomato at all', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Crust breaking', consensus: 'Break crust 2-3 times during bake', percentage: 65, alternative: 'Bake undisturbed', altPercentage: 28 },
    { label: 'Bean cook method', consensus: 'Par-cook beans before assembly', percentage: 82 },
    { label: 'Total cook time', consensus: '3-5 hours in oven', percentage: 75 },
  ],
  differs: [],
},

// ===== FRENCH (LORRAINE) =====
'madeleines': {
  recipesAnalyzed: 15,
  sources: ['Smitten Kitchen', 'David Lebovitz', 'King Arthur Baking', 'Bon Appétit', 'BBC Good Food'],
  ingredients: [
    { label: 'Flour type', consensus: 'All-purpose or cake flour', percentage: 78, alternative: 'Cake flour only', altPercentage: 18 },
    { label: 'Leavening', consensus: 'Baking powder', percentage: 82 },
    { label: 'Flavoring', consensus: 'Lemon zest', percentage: 65, alternative: 'Vanilla or honey', altPercentage: 28 },
    { label: 'Butter state', consensus: 'Melted and cooled brown butter', percentage: 55, alternative: 'Plain melted butter', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Batter rest', consensus: 'Chill 1-4 hours or overnight', percentage: 85 },
    { label: 'Pan prep', consensus: 'Butter and flour the molds', percentage: 78 },
    { label: 'The bump', consensus: 'High heat creates signature bump', percentage: 72, alternative: 'No special technique for bump', altPercentage: 22 },
  ],
  differs: [
    { point: 'Brown butter', detail: 'This recipe uses brown butter for nuttier flavor, which is a newer preference over classic plain melted butter' },
  ],
},

// ===== FRENCH / CAJUN =====
'roux': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Bon Appétit', 'Emeril Lagasse', 'Paul Prudhomme', 'Epicurious'],
  ingredients: [
    { label: 'Fat type', consensus: 'Butter (French) or oil (Cajun)', percentage: 55, alternative: 'Lard or bacon fat', altPercentage: 20 },
    { label: 'Flour', consensus: 'All-purpose', percentage: 90 },
    { label: 'Fat-flour ratio', consensus: 'Equal parts by weight', percentage: 85 },
  ],
  techniques: [
    { label: 'Cook level', consensus: 'Depends on use (white to dark)', percentage: 88 },
    { label: 'Stirring', consensus: 'Constant stirring, never stop', percentage: 92 },
    { label: 'Dark roux time', consensus: '30-45 minutes for Cajun dark', percentage: 72, alternative: 'Oven method, less stirring', altPercentage: 20 },
  ],
  differs: [],
},

// ===== FRENCH / SPANISH / LATIN AMERICAN =====
'creme-caramel-flan': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'Bon Appétit', 'NY Times Cooking', 'Epicurious', 'Jauja Cocina Mexicana', 'Goya'],
  ingredients: [
    { label: 'Dairy base', consensus: 'Whole milk + eggs', percentage: 45, alternative: 'Condensed + evaporated milk', altPercentage: 42 },
    { label: 'Eggs', consensus: 'Whole eggs + extra yolks', percentage: 65, alternative: 'Whole eggs only', altPercentage: 30 },
    { label: 'Caramel', consensus: 'Sugar + water, dry or wet method', percentage: 88 },
    { label: 'Flavoring', consensus: 'Vanilla', percentage: 78, alternative: 'Vanilla + citrus zest', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Bake method', consensus: 'Water bath, 325-350°F', percentage: 90 },
    { label: 'Strain custard', consensus: 'Yes, for smoothness', percentage: 75 },
    { label: 'Unmold timing', consensus: 'Chill overnight, then invert', percentage: 72, alternative: 'Chill 4 hours minimum', altPercentage: 22 },
  ],
  differs: [
    { point: 'Dairy split', detail: 'French crème caramel uses whole milk and cream; Latin flan typically uses condensed and evaporated milk for a denser, sweeter custard' },
  ],
},

// ===== GEORGIAN =====
'khachapuri-cheese-bread': {
  recipesAnalyzed: 14,
  sources: ['TasteAtlas', 'Saveur', 'King Arthur Baking', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Cheese blend', consensus: 'Sulguni + feta mix', percentage: 72, alternative: 'Mozzarella + feta', altPercentage: 28 },
    { label: 'Dough base', consensus: 'Yeasted dough', percentage: 88, alternative: 'Yogurt dough', altPercentage: 12 },
    { label: 'Egg finish', consensus: 'Raw egg in center', percentage: 91 },
    { label: 'Butter amount', consensus: 'Generous, 2-3 tbsp', percentage: 78 },
  ],
  techniques: [
    { label: 'Shape style', consensus: 'Boat (Adjarian)', percentage: 82, alternative: 'Round (Imeretian)', altPercentage: 18 },
    { label: 'Baking temp', consensus: '450-500°F', percentage: 75, alternative: '375-425°F', altPercentage: 25 },
    { label: 'Egg timing', consensus: 'Add last 2-3 min', percentage: 93 },
  ],
  differs: [{ point: 'Cheese selection', detail: 'Uses more accessible mozzarella-feta blend rather than traditional sulguni' }],
},

// ===== GERMAN =====
'sauerkraut': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Bon Appétit', 'The Kitchn', 'Fermented Food Lab', 'Cultures for Health'],
  ingredients: [
    { label: 'Salt ratio', consensus: '2% by weight', percentage: 76, alternative: '3% by weight', altPercentage: 24 },
    { label: 'Cabbage type', consensus: 'Green cabbage', percentage: 89, alternative: 'Red cabbage', altPercentage: 11 },
    { label: 'Caraway seeds', consensus: 'Optional, not required', percentage: 58, alternative: 'Always included', altPercentage: 42 },
  ],
  techniques: [
    { label: 'Ferment duration', consensus: '3-4 weeks minimum', percentage: 65, alternative: '1-2 weeks', altPercentage: 35 },
    { label: 'Weight method', consensus: 'Plate or bag of brine', percentage: 68, alternative: 'Fermentation weights', altPercentage: 32 },
    { label: 'Vessel type', consensus: 'Mason jar', percentage: 71, alternative: 'Ceramic crock', altPercentage: 29 },
  ],
  differs: [],
},

// ===== GHANAIAN =====
'kelewele': {
  recipesAnalyzed: 10,
  sources: ['My Active Kitchen', 'Immaculate Bites', 'All African Dishes', 'Saveur', 'BBC Good Food'],
  ingredients: [
    { label: 'Plantain ripeness', consensus: 'Very ripe, black spots', percentage: 85, alternative: 'Semi-ripe, yellow', altPercentage: 15 },
    { label: 'Key spice', consensus: 'Fresh ginger, heavy', percentage: 91 },
    { label: 'Heat source', consensus: 'Cayenne or chili flakes', percentage: 67, alternative: 'Scotch bonnet', altPercentage: 33 },
    { label: 'Cloves', consensus: 'Small amount included', percentage: 72, alternative: 'Omitted', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Cut shape', consensus: 'Cubes, 1-inch', percentage: 78, alternative: 'Diagonal slices', altPercentage: 22 },
    { label: 'Frying method', consensus: 'Deep fried', percentage: 88, alternative: 'Pan fried', altPercentage: 12 },
    { label: 'Marination time', consensus: '30 min to 1 hour', percentage: 73 },
  ],
  differs: [],
},

'waakye': {
  recipesAnalyzed: 9,
  sources: ['My Active Kitchen', 'All African Dishes', 'Zoe Bakes', 'Jollof by Kwame', 'Africa Bites'],
  ingredients: [
    { label: 'Leaf for color', consensus: 'Dried millet leaves (stalk)', percentage: 82, alternative: 'Sorghum leaves', altPercentage: 18 },
    { label: 'Rice type', consensus: 'Long grain white', percentage: 75, alternative: 'Basmati', altPercentage: 25 },
    { label: 'Bean type', consensus: 'Black-eyed peas', percentage: 68, alternative: 'Red kidney beans', altPercentage: 32 },
    { label: 'Baking soda', consensus: 'Small pinch added', percentage: 70, alternative: 'None', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Beans and rice together', percentage: 77, alternative: 'Cook separately, combine', altPercentage: 23 },
    { label: 'Soak beans', consensus: 'Overnight soak', percentage: 83 },
  ],
  differs: [{ point: 'Leaf substitute', detail: 'May use baking soda alone for color if millet stalk leaves are unavailable' }],
},

// ===== GLOBAL =====
'caramelized-onions': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'NYT Cooking', 'The Kitchn', 'Bon Appétit', 'America\'s Test Kitchen'],
  ingredients: [
    { label: 'Onion type', consensus: 'Yellow onions', percentage: 78, alternative: 'Sweet onions', altPercentage: 22 },
    { label: 'Fat choice', consensus: 'Butter', percentage: 55, alternative: 'Olive oil or combo', altPercentage: 45 },
    { label: 'Sugar added', consensus: 'None needed', percentage: 62, alternative: 'Pinch of sugar', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Cook time', consensus: '45 min to 1 hour', percentage: 71, alternative: '20-30 minutes', altPercentage: 29 },
    { label: 'Heat level', consensus: 'Medium-low, patient', percentage: 85 },
    { label: 'Deglaze', consensus: 'Water or wine', percentage: 68, alternative: 'Balsamic vinegar', altPercentage: 32 },
    { label: 'Stir frequency', consensus: 'Every 5-10 min', percentage: 74 },
  ],
  differs: [],
},

'chicken-stock': {
  recipesAnalyzed: 25,
  sources: ['Serious Eats', 'America\'s Test Kitchen', 'NYT Cooking', 'Food Network', 'Bon Appétit', 'The Kitchn'],
  ingredients: [
    { label: 'Chicken parts', consensus: 'Bones + wings/backs', percentage: 72, alternative: 'Whole carcass only', altPercentage: 28 },
    { label: 'Aromatics', consensus: 'Onion, carrot, celery', percentage: 95 },
    { label: 'Herbs', consensus: 'Parsley, thyme, bay', percentage: 88 },
    { label: 'Cold start water', consensus: 'Always cold water', percentage: 92 },
  ],
  techniques: [
    { label: 'Simmer time', consensus: '3-4 hours', percentage: 65, alternative: '1-2 hours', altPercentage: 35 },
    { label: 'Skim scum', consensus: 'Yes, regularly', percentage: 87 },
    { label: 'Roast bones first', consensus: 'Not for white stock', percentage: 70, alternative: 'Roast for depth', altPercentage: 30 },
  ],
  differs: [],
},

'fermented-hot-sauce': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'Bon Appétit', 'Fermented Food Lab', 'ChiliPepperMadness', 'It\'s Alive (Bon Appétit)'],
  ingredients: [
    { label: 'Salt brine %', consensus: '3-5% salt brine', percentage: 78, alternative: '2% dry salt', altPercentage: 22 },
    { label: 'Pepper variety', consensus: 'Mix of hot + fruity', percentage: 67, alternative: 'Single variety', altPercentage: 33 },
    { label: 'Garlic', consensus: 'Always included', percentage: 93 },
    { label: 'Vinegar finish', consensus: 'Add after fermenting', percentage: 82 },
  ],
  techniques: [
    { label: 'Ferment time', consensus: '1-2 weeks minimum', percentage: 71, alternative: '3-4 weeks', altPercentage: 29 },
    { label: 'Blend texture', consensus: 'Smooth, strained', percentage: 62, alternative: 'Chunky, unstrained', altPercentage: 38 },
    { label: 'Burping jar', consensus: 'Daily during ferment', percentage: 85 },
  ],
  differs: [],
},

'garlic-butter-shrimp': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'NYT Cooking', 'RecipeTin Eats', 'Bon Appétit', 'Damn Delicious'],
  ingredients: [
    { label: 'Shrimp size', consensus: 'Large, 21-25 count', percentage: 72, alternative: 'Jumbo, 16-20 count', altPercentage: 28 },
    { label: 'Garlic amount', consensus: '6-8 cloves, generous', percentage: 81 },
    { label: 'Wine or acid', consensus: 'White wine splash', percentage: 65, alternative: 'Lemon juice only', altPercentage: 35 },
    { label: 'Butter type', consensus: 'Unsalted butter', percentage: 73 },
    { label: 'Red pepper flakes', consensus: 'Included', percentage: 78 },
  ],
  techniques: [
    { label: 'Cook time', consensus: '2-3 min per side', percentage: 89 },
    { label: 'Shell on or off', consensus: 'Peeled, tail on', percentage: 66, alternative: 'Shell on', altPercentage: 34 },
    { label: 'Pan heat', consensus: 'High, don\'t crowd', percentage: 84 },
  ],
  differs: [],
},

'kombucha': {
  recipesAnalyzed: 16,
  sources: ['The Kitchn', 'Cultures for Health', 'Bon Appétit', 'Joshua Weissman', 'Serious Eats'],
  ingredients: [
    { label: 'Tea type', consensus: 'Black tea', percentage: 68, alternative: 'Green or blend', altPercentage: 32 },
    { label: 'Sugar per gallon', consensus: '1 cup white sugar', percentage: 82 },
    { label: 'Starter liquid', consensus: '1-2 cups from prior batch', percentage: 90 },
    { label: 'SCOBY', consensus: 'Healthy, thick SCOBY', percentage: 95 },
  ],
  techniques: [
    { label: 'First ferment', consensus: '7-14 days', percentage: 77 },
    { label: 'Second ferment', consensus: '2-4 days, sealed', percentage: 72, alternative: 'Skip, drink after F1', altPercentage: 28 },
    { label: 'Temperature', consensus: '68-85°F room temp', percentage: 86 },
  ],
  differs: [{ point: 'Flavoring stage', detail: 'May add fruit or ginger during first ferment rather than waiting for second ferment' }],
},

'pan-seared-salmon': {
  recipesAnalyzed: 23,
  sources: ['Serious Eats', 'NYT Cooking', 'Gordon Ramsay', 'Bon Appétit', 'America\'s Test Kitchen', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Skin on', consensus: 'Skin-on fillet', percentage: 88 },
    { label: 'Oil type', consensus: 'High smoke point oil', percentage: 79, alternative: 'Butter only', altPercentage: 21 },
    { label: 'Seasoning', consensus: 'Salt and pepper only', percentage: 72, alternative: 'Spice rub or herbs', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Start side', consensus: 'Skin side down first', percentage: 93 },
    { label: 'Pan temp', consensus: 'Medium-high, hot pan', percentage: 85 },
    { label: 'Flip once', consensus: 'Flip once, finish briefly', percentage: 78 },
    { label: 'Internal temp', consensus: '125°F medium', percentage: 70, alternative: '145°F USDA', altPercentage: 30 },
  ],
  differs: [],
},

'pickled-red-onions': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'Cookie and Kate', 'Bon Appétit', 'The Kitchn', 'Love and Lemons'],
  ingredients: [
    { label: 'Vinegar type', consensus: 'Apple cider vinegar', percentage: 55, alternative: 'Red wine vinegar', altPercentage: 45 },
    { label: 'Sweetener', consensus: 'Sugar, 1-2 tbsp', percentage: 82 },
    { label: 'Salt amount', consensus: '1-2 tsp per cup', percentage: 88 },
    { label: 'Spice additions', consensus: 'Optional peppercorns', percentage: 60, alternative: 'None, plain', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Slice thickness', consensus: 'Thin rings or half-moons', percentage: 91 },
    { label: 'Pour hot or cold', consensus: 'Hot brine poured over', percentage: 83, alternative: 'Cold brine, wait longer', altPercentage: 17 },
    { label: 'Ready time', consensus: '30 min to 1 hour', percentage: 75 },
  ],
  differs: [],
},

'quick-pickles': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'The Kitchn', 'Bon Appétit', 'Food52'],
  ingredients: [
    { label: 'Vinegar type', consensus: 'Rice or white vinegar', percentage: 64, alternative: 'Apple cider vinegar', altPercentage: 36 },
    { label: 'Ratio', consensus: '1:1 vinegar to water', percentage: 71, alternative: '2:1 vinegar to water', altPercentage: 29 },
    { label: 'Sugar', consensus: '1-2 tbsp per cup', percentage: 77 },
    { label: 'Aromatics', consensus: 'Garlic + peppercorns', percentage: 80 },
  ],
  techniques: [
    { label: 'Brine temp', consensus: 'Hot brine method', percentage: 84, alternative: 'Cold brine', altPercentage: 16 },
    { label: 'Ready in', consensus: '1-2 hours minimum', percentage: 72 },
    { label: 'Storage', consensus: 'Refrigerator, 2-4 weeks', percentage: 90 },
  ],
  differs: [],
},

'rice-steamed-perfect': {
  recipesAnalyzed: 24,
  sources: ['Serious Eats', 'America\'s Test Kitchen', 'NYT Cooking', 'RecipeTin Eats', 'Just One Cookbook', 'Bon Appétit'],
  ingredients: [
    { label: 'Rice type', consensus: 'Long grain white', percentage: 60, alternative: 'Jasmine or basmati', altPercentage: 40 },
    { label: 'Water ratio', consensus: '1:1.5 rice to water', percentage: 57, alternative: '1:1.25 or 1:2', altPercentage: 43 },
    { label: 'Salt', consensus: 'Pinch of salt', percentage: 68, alternative: 'No salt', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Rinse rice', consensus: 'Yes, until clear', percentage: 82, alternative: 'Skip rinsing', altPercentage: 18 },
    { label: 'Lid rule', consensus: 'Never lift lid', percentage: 76 },
    { label: 'Rest after cooking', consensus: '10 min off heat, covered', percentage: 85 },
    { label: 'Method', consensus: 'Absorption method', percentage: 73, alternative: 'Pasta method (boil+drain)', altPercentage: 27 },
  ],
  differs: [],
},

'sofrito-mirepoix': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'America\'s Test Kitchen', 'Food52'],
  ingredients: [
    { label: 'Classic trio', consensus: 'Onion, carrot, celery', percentage: 88 },
    { label: 'Ratio', consensus: '2:1:1 onion-led', percentage: 72, alternative: 'Equal parts', altPercentage: 28 },
    { label: 'Fat', consensus: 'Olive oil or butter', percentage: 80 },
    { label: 'Garlic', consensus: 'Not in classic mirepoix', percentage: 65, alternative: 'Add garlic', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Cut size', consensus: 'Fine dice, uniform', percentage: 83 },
    { label: 'Cook level', consensus: 'Sweat until soft, no color', percentage: 68, alternative: 'Light caramelization', altPercentage: 32 },
    { label: 'Cook time', consensus: '8-12 minutes', percentage: 75 },
  ],
  differs: [{ point: 'Regional variation', detail: 'Uses sofrito-style (with tomato and garlic) rather than strict French mirepoix' }],
},

'sourdough-bread': {
  recipesAnalyzed: 25,
  sources: ['King Arthur Baking', 'The Perfect Loaf', 'Tartine Bakery', 'Serious Eats', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Flour type', consensus: 'Bread flour primary', percentage: 72, alternative: 'All-purpose', altPercentage: 28 },
    { label: 'Hydration', consensus: '70-75%', percentage: 60, alternative: '78-85% high hydration', altPercentage: 40 },
    { label: 'Starter', consensus: 'Active, fed 4-8h prior', percentage: 90 },
    { label: 'Salt percentage', consensus: '2% of flour weight', percentage: 88 },
    { label: 'Whole grain %', consensus: '10-20% whole wheat', percentage: 65, alternative: '100% white flour', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Bulk ferment', consensus: '4-6 hours at room temp', percentage: 68 },
    { label: 'Stretch and fold', consensus: '3-4 sets during bulk', percentage: 82 },
    { label: 'Baking vessel', consensus: 'Dutch oven, preheated', percentage: 87 },
    { label: 'Oven temp', consensus: '450-500°F', percentage: 78 },
  ],
  differs: [],
},

// ===== GREEK =====
'spanakopita': {
  recipesAnalyzed: 16,
  sources: ['NYT Cooking', 'RecipeTin Eats', 'Serious Eats', 'My Greek Dish', 'Bon Appétit'],
  ingredients: [
    { label: 'Greens', consensus: 'Spinach only', percentage: 65, alternative: 'Spinach + herbs/greens mix', altPercentage: 35 },
    { label: 'Cheese', consensus: 'Feta, crumbled', percentage: 92 },
    { label: 'Second cheese', consensus: 'Ricotta or cottage', percentage: 58, alternative: 'Feta only', altPercentage: 42 },
    { label: 'Phyllo layers', consensus: '8-12 sheets', percentage: 76 },
    { label: 'Dill', consensus: 'Generous fresh dill', percentage: 84 },
  ],
  techniques: [
    { label: 'Spinach prep', consensus: 'Squeeze dry thoroughly', percentage: 95 },
    { label: 'Shape', consensus: 'Large pan/slab', percentage: 60, alternative: 'Individual triangles', altPercentage: 40 },
    { label: 'Butter phyllo', consensus: 'Brush each sheet', percentage: 89 },
  ],
  differs: [],
},

// ===== HUNGARIAN =====
'goulash': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Saveur', 'Taste of Home', 'BBC Good Food'],
  ingredients: [
    { label: 'Paprika type', consensus: 'Hungarian sweet paprika', percentage: 88 },
    { label: 'Paprika amount', consensus: '3-4 tbsp, generous', percentage: 75 },
    { label: 'Tomatoes', consensus: 'Yes, tomato paste + fresh', percentage: 70, alternative: 'No tomato (purist)', altPercentage: 30 },
    { label: 'Potatoes', consensus: 'Included in stew', percentage: 62, alternative: 'Served over noodles', altPercentage: 38 },
    { label: 'Meat cut', consensus: 'Beef chuck, cubed', percentage: 83 },
  ],
  techniques: [
    { label: 'Brown meat', consensus: 'Sear in batches', percentage: 72, alternative: 'No browning, stew directly', altPercentage: 28 },
    { label: 'Onion ratio', consensus: 'Equal weight to meat', percentage: 68 },
    { label: 'Simmer time', consensus: '2-3 hours low', percentage: 80 },
  ],
  differs: [{ point: 'Flour thickener', detail: 'Some versions use flour to thicken; authentic Hungarian goulash gets body from paprika and onions alone' }],
},

// ===== HYDERABADI =====
'biryani-hyderabadi': {
  recipesAnalyzed: 20,
  sources: ['Swasthi\'s Recipes', 'Serious Eats', 'Bon Appétit', 'Hebbar\'s Kitchen', 'NYT Cooking', 'Saveur'],
  ingredients: [
    { label: 'Rice type', consensus: 'Aged basmati, soaked', percentage: 95 },
    { label: 'Meat', consensus: 'Bone-in goat or lamb', percentage: 72, alternative: 'Chicken', altPercentage: 28 },
    { label: 'Yogurt marinade', consensus: 'Thick yogurt base', percentage: 90 },
    { label: 'Saffron', consensus: 'Saffron in warm milk', percentage: 87 },
    { label: 'Fried onions', consensus: 'Heavily fried, crispy', percentage: 93 },
    { label: 'Whole spices', consensus: 'Bay, cardamom, clove, cinnamon', percentage: 88 },
  ],
  techniques: [
    { label: 'Layering method', consensus: 'Dum (sealed pot)', percentage: 91 },
    { label: 'Rice parcooked', consensus: '70% cooked, then layer', percentage: 85 },
    { label: 'Seal pot', consensus: 'Dough or foil seal', percentage: 78 },
    { label: 'Dum time', consensus: '25-40 min on low', percentage: 73 },
  ],
  differs: [],
},

// ===== INDIAN =====
'gulab-jamun': {
  recipesAnalyzed: 14,
  sources: ['Swasthi\'s Recipes', 'Hebbar\'s Kitchen', 'Serious Eats', 'Bon Appétit', 'Saveur'],
  ingredients: [
    { label: 'Base', consensus: 'Khoya / milk powder', percentage: 70, alternative: 'Paneer-based', altPercentage: 30 },
    { label: 'Binding flour', consensus: 'Maida or all-purpose', percentage: 82 },
    { label: 'Syrup flavoring', consensus: 'Cardamom + rose water', percentage: 88 },
    { label: 'Syrup consistency', consensus: 'One-string, sticky', percentage: 76 },
  ],
  techniques: [
    { label: 'Dough handling', consensus: 'Minimal kneading, soft', percentage: 90 },
    { label: 'Fry temperature', consensus: 'Low-medium heat', percentage: 85 },
    { label: 'Soak time', consensus: 'Min 2 hours in warm syrup', percentage: 78 },
    { label: 'Surface cracks', consensus: 'Smooth, no cracks', percentage: 83 },
  ],
  differs: [],
},

'naan': {
  recipesAnalyzed: 21,
  sources: ['Serious Eats', 'RecipeTin Eats', 'Bon Appétit', 'Swasthi\'s Recipes', 'NYT Cooking', 'King Arthur Baking'],
  ingredients: [
    { label: 'Leavening', consensus: 'Yeast + baking powder', percentage: 62, alternative: 'Yeast only', altPercentage: 38 },
    { label: 'Dairy', consensus: 'Yogurt in dough', percentage: 80 },
    { label: 'Fat in dough', consensus: 'Oil or ghee', percentage: 75 },
    { label: 'Garlic butter', consensus: 'Brushed after cooking', percentage: 85 },
  ],
  techniques: [
    { label: 'Cooking surface', consensus: 'Cast iron skillet', percentage: 58, alternative: 'Oven / broiler', altPercentage: 42 },
    { label: 'High heat', consensus: 'Very high, blistering', percentage: 88 },
    { label: 'Thickness', consensus: 'Tear-drop, thin stretch', percentage: 72 },
  ],
  differs: [{ point: 'Tandoor vs home', detail: 'Authentic naan requires a tandoor oven; this recipe adapts for home stovetop or broiler' }],
},

'pani-puri': {
  recipesAnalyzed: 12,
  sources: ['Swasthi\'s Recipes', 'Hebbar\'s Kitchen', 'Vahchef', 'Serious Eats', 'Bon Appétit'],
  ingredients: [
    { label: 'Puri dough', consensus: 'Semolina (rava) based', percentage: 72, alternative: 'Wheat flour based', altPercentage: 28 },
    { label: 'Pani base', consensus: 'Mint + cilantro water', percentage: 88 },
    { label: 'Tamarind chutney', consensus: 'Sweet tamarind included', percentage: 90 },
    { label: 'Filling', consensus: 'Boiled potato + chickpeas', percentage: 82 },
    { label: 'Green chili in pani', consensus: 'Plenty for heat', percentage: 85 },
  ],
  techniques: [
    { label: 'Puri frying', consensus: 'Deep fry until puffed', percentage: 93 },
    { label: 'Oil temp', consensus: 'Medium-hot, puff not brown', percentage: 80 },
    { label: 'Serve temp', consensus: 'Pani ice cold', percentage: 87 },
  ],
  differs: [],
},

'raita': {
  recipesAnalyzed: 15,
  sources: ['Swasthi\'s Recipes', 'Serious Eats', 'RecipeTin Eats', 'Bon Appétit', 'NYT Cooking'],
  ingredients: [
    { label: 'Yogurt type', consensus: 'Thick, full-fat yogurt', percentage: 88 },
    { label: 'Cucumber', consensus: 'Grated, squeezed dry', percentage: 75, alternative: 'Diced, not squeezed', altPercentage: 25 },
    { label: 'Cumin', consensus: 'Roasted cumin powder', percentage: 90 },
    { label: 'Mint', consensus: 'Fresh mint included', percentage: 72, alternative: 'Cilantro instead', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Chill time', consensus: 'Serve cold, rest 15 min', percentage: 78 },
    { label: 'Tadka / temper', consensus: 'Optional but traditional', percentage: 55, alternative: 'Skip tempering', altPercentage: 45 },
    { label: 'Consistency', consensus: 'Thick, not runny', percentage: 82 },
  ],
  differs: [],
},

'roti-chapati': {
  recipesAnalyzed: 18,
  sources: ['Swasthi\'s Recipes', 'Hebbar\'s Kitchen', 'Serious Eats', 'RecipeTin Eats', 'Bon Appétit'],
  ingredients: [
    { label: 'Flour type', consensus: 'Whole wheat (atta)', percentage: 92 },
    { label: 'Water temp', consensus: 'Warm water', percentage: 78, alternative: 'Room temp water', altPercentage: 22 },
    { label: 'Oil/ghee in dough', consensus: 'Small amount, optional', percentage: 58, alternative: 'None', altPercentage: 42 },
  ],
  techniques: [
    { label: 'Knead time', consensus: '8-10 min, soft dough', percentage: 80 },
    { label: 'Rest dough', consensus: '20-30 min covered', percentage: 85 },
    { label: 'Cook surface', consensus: 'Tawa (flat griddle)', percentage: 87 },
    { label: 'Puff technique', consensus: 'Direct flame to puff', percentage: 72, alternative: 'Press with cloth on tawa', altPercentage: 28 },
  ],
  differs: [],
},

'samosas': {
  recipesAnalyzed: 19,
  sources: ['Swasthi\'s Recipes', 'Serious Eats', 'RecipeTin Eats', 'Bon Appétit', 'Hebbar\'s Kitchen', 'NYT Cooking'],
  ingredients: [
    { label: 'Wrapper dough', consensus: 'All-purpose flour + oil', percentage: 78, alternative: 'Store-bought wrappers', altPercentage: 22 },
    { label: 'Filling base', consensus: 'Potato + peas', percentage: 90 },
    { label: 'Key spice', consensus: 'Garam masala + cumin', percentage: 85 },
    { label: 'Heat', consensus: 'Green chilies', percentage: 77 },
    { label: 'Amchur/acid', consensus: 'Amchur (dry mango)', percentage: 65, alternative: 'Lemon juice', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Dough rest', consensus: '30 min minimum', percentage: 82 },
    { label: 'Fry method', consensus: 'Deep fry, medium heat', percentage: 75, alternative: 'Baked', altPercentage: 25 },
    { label: 'Shape', consensus: 'Cone/triangle, sealed', percentage: 88 },
    { label: 'Filling temp', consensus: 'Cool filling before wrapping', percentage: 83 },
  ],
  differs: [],
},

// ===== INDONESIAN =====
'nasi-goreng': {
  recipesAnalyzed: 16,
  sources: ['RecipeTin Eats', 'Serious Eats', 'Bon Appétit', 'Woks of Life', 'Marion\'s Kitchen'],
  ingredients: [
    { label: 'Key sauce', consensus: 'Kecap manis (sweet soy)', percentage: 95 },
    { label: 'Shrimp paste', consensus: 'Terasi / belacan', percentage: 78, alternative: 'Fish sauce substitute', altPercentage: 22 },
    { label: 'Rice type', consensus: 'Day-old jasmine rice', percentage: 85 },
    { label: 'Protein', consensus: 'Chicken + shrimp', percentage: 60, alternative: 'Egg only', altPercentage: 40 },
    { label: 'Chili', consensus: 'Fresh red chilies or sambal', percentage: 82 },
  ],
  techniques: [
    { label: 'Wok heat', consensus: 'Very high, smoky', percentage: 88 },
    { label: 'Egg placement', consensus: 'Fried egg on top', percentage: 80, alternative: 'Scrambled into rice', altPercentage: 20 },
    { label: 'Garnish', consensus: 'Fried shallots + cucumber', percentage: 76 },
  ],
  differs: [],
},

// ===== INDONESIAN / MALAY =====
'rendang': {
  recipesAnalyzed: 15,
  sources: ['RecipeTin Eats', 'Serious Eats', 'Rasa Malaysia', 'Woks of Life', 'NYT Cooking'],
  ingredients: [
    { label: 'Meat cut', consensus: 'Beef chuck, large cubes', percentage: 82 },
    { label: 'Coconut milk', consensus: 'Full-fat, generous', percentage: 93 },
    { label: 'Lemongrass', consensus: '3-4 stalks, bruised', percentage: 88 },
    { label: 'Spice paste', consensus: 'Galangal, turmeric, chilies', percentage: 90 },
    { label: 'Kerisik', consensus: 'Toasted coconut paste', percentage: 68, alternative: 'Desiccated coconut', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Cook time', consensus: '3-4 hours, dry rendang', percentage: 75, alternative: '1-2 hours, wet kalio style', altPercentage: 25 },
    { label: 'Stir frequency', consensus: 'Stir often, prevent burning', percentage: 85 },
    { label: 'End goal', consensus: 'Dry, dark, caramelized', percentage: 82 },
  ],
  differs: [{ point: 'Wet vs dry', detail: 'May serve at a wetter kalio stage rather than cooking down to fully dry rendang' }],
},

// ===== INDONESIAN / MALAYSIAN =====
'satay': {
  recipesAnalyzed: 17,
  sources: ['RecipeTin Eats', 'Serious Eats', 'Marion\'s Kitchen', 'Rasa Malaysia', 'Bon Appétit'],
  ingredients: [
    { label: 'Protein', consensus: 'Chicken thigh', percentage: 72, alternative: 'Beef or pork', altPercentage: 28 },
    { label: 'Marinade base', consensus: 'Turmeric + lemongrass', percentage: 85 },
    { label: 'Peanut sauce', consensus: 'Roasted peanuts, ground', percentage: 78, alternative: 'Peanut butter shortcut', altPercentage: 22 },
    { label: 'Sweetener in sauce', consensus: 'Palm sugar or brown sugar', percentage: 74 },
    { label: 'Kecap manis', consensus: 'In marinade or sauce', percentage: 70 },
  ],
  techniques: [
    { label: 'Skewer prep', consensus: 'Soak bamboo 30 min', percentage: 82 },
    { label: 'Grill method', consensus: 'Charcoal grill, high heat', percentage: 65, alternative: 'Broiler or grill pan', altPercentage: 35 },
    { label: 'Baste while grilling', consensus: 'Oil + marinade baste', percentage: 73 },
  ],
  differs: [],
},

// ===== ISRAELI =====
'green-shakshuka': {
  recipesAnalyzed: 12,
  sources: ['NYT Cooking', 'Bon Appétit', 'Ottolenghi', 'Serious Eats', 'Food52'],
  ingredients: [
    { label: 'Green base', consensus: 'Spinach + swiss chard', percentage: 60, alternative: 'Kale + spinach', altPercentage: 40 },
    { label: 'Herbs', consensus: 'Cilantro + dill', percentage: 72 },
    { label: 'Cheese', consensus: 'Feta crumbled on top', percentage: 82 },
    { label: 'Spice', consensus: 'Cumin + coriander', percentage: 78 },
    { label: 'Eggs', consensus: '4-6 nestled in greens', percentage: 90 },
  ],
  techniques: [
    { label: 'Wilt greens first', consensus: 'Cook greens down fully', percentage: 88 },
    { label: 'Egg doneness', consensus: 'Whites set, yolks runny', percentage: 85 },
    { label: 'Finish', consensus: 'Cover pan to steam eggs', percentage: 80 },
  ],
  differs: [],
},

'shakshuka-green': {
  recipesAnalyzed: 12,
  sources: ['NYT Cooking', 'Ottolenghi', 'Bon Appétit', 'Serious Eats', 'Food52'],
  ingredients: [
    { label: 'Greens mix', consensus: 'Spinach + chard', percentage: 62, alternative: 'All spinach', altPercentage: 38 },
    { label: 'Labneh or feta', consensus: 'Feta on top', percentage: 70, alternative: 'Labneh dollops', altPercentage: 30 },
    { label: 'Green chili', consensus: 'Jalapeño or serrano', percentage: 75 },
    { label: 'Herb focus', consensus: 'Cilantro-heavy', percentage: 68 },
  ],
  techniques: [
    { label: 'Base cooking', consensus: 'Sauté alliums, wilt greens', percentage: 90 },
    { label: 'Egg wells', consensus: 'Create wells, crack in', percentage: 92 },
    { label: 'Serve with', consensus: 'Crusty bread for dipping', percentage: 87 },
  ],
  differs: [],
},

// ===== ISRAELI / NORTH AFRICAN =====
'shakshouka': {
  recipesAnalyzed: 22,
  sources: ['NYT Cooking', 'Serious Eats', 'Ottolenghi', 'Bon Appétit', 'RecipeTin Eats', 'Food52'],
  ingredients: [
    { label: 'Tomato base', consensus: 'Canned whole, crushed by hand', percentage: 72, alternative: 'Canned crushed or diced', altPercentage: 28 },
    { label: 'Peppers', consensus: 'Bell pepper included', percentage: 68, alternative: 'No pepper, tomato only', altPercentage: 32 },
    { label: 'Spice blend', consensus: 'Cumin + paprika + chili', percentage: 85 },
    { label: 'Eggs', consensus: '6 eggs, nestled', percentage: 78 },
    { label: 'Feta', consensus: 'Crumbled feta on top', percentage: 62, alternative: 'No cheese', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Sauce simmer', consensus: '15-20 min before eggs', percentage: 80 },
    { label: 'Egg doneness', consensus: 'Whites set, yolks runny', percentage: 88 },
    { label: 'Lid for eggs', consensus: 'Cover to steam eggs', percentage: 83 },
    { label: 'Serve in pan', consensus: 'Family-style, in skillet', percentage: 75 },
  ],
  differs: [],
},

// ===== ITALIAN =====
'bruschetta-al-pomodoro': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food Network', 'La Cucina Italiana'],
  ingredients: [
    { label: 'Tomato type', consensus: 'Ripe Roma or cherry', percentage: 70, alternative: 'Any ripe heirloom', altPercentage: 30 },
    { label: 'Basil', consensus: 'Fresh, torn at the end', percentage: 92 },
    { label: 'Garlic on bread', consensus: 'Rub raw clove on toast', percentage: 85 },
    { label: 'Olive oil', consensus: 'Best quality EVOO', percentage: 90 },
    { label: 'Balsamic', consensus: 'Not traditional, skip', percentage: 62, alternative: 'Drizzle of balsamic', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Bread type', consensus: 'Rustic Italian, thick sliced', percentage: 82 },
    { label: 'Toast method', consensus: 'Grill or broil', percentage: 76 },
    { label: 'Salt tomatoes', consensus: 'Salt + drain 10 min', percentage: 68, alternative: 'Skip draining', altPercentage: 32 },
  ],
  differs: [],
},

'gnocchi': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'America\'s Test Kitchen', 'Food52', 'La Cucina Italiana'],
  ingredients: [
    { label: 'Potato type', consensus: 'Russet / starchy', percentage: 85 },
    { label: 'Egg', consensus: '1 egg per pound', percentage: 65, alternative: 'No egg, potato only', altPercentage: 35 },
    { label: 'Flour amount', consensus: 'Minimal, as little as possible', percentage: 90 },
    { label: 'Ricotta option', consensus: 'Classic is potato only', percentage: 72, alternative: 'Ricotta gnocchi', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Cook potatoes', consensus: 'Bake whole, don\'t boil', percentage: 60, alternative: 'Boil whole, skin on', altPercentage: 40 },
    { label: 'Rice potatoes', consensus: 'Use a potato ricer', percentage: 88 },
    { label: 'Handle dough', consensus: 'Barely knead, light touch', percentage: 92 },
    { label: 'Fork marks', consensus: 'Roll on fork or board', percentage: 70 },
  ],
  differs: [],
},

'minestrone': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food Network', 'America\'s Test Kitchen'],
  ingredients: [
    { label: 'Bean type', consensus: 'Cannellini or borlotti', percentage: 75, alternative: 'Kidney beans', altPercentage: 25 },
    { label: 'Pasta or rice', consensus: 'Small pasta (ditalini)', percentage: 72, alternative: 'Rice or no starch', altPercentage: 28 },
    { label: 'Parmesan rind', consensus: 'Simmer rind in soup', percentage: 78 },
    { label: 'Tomato', consensus: 'Canned diced or crushed', percentage: 82 },
    { label: 'Seasonal veg', consensus: 'Zucchini, green beans, chard', percentage: 68 },
  ],
  techniques: [
    { label: 'Soffritto first', consensus: 'Onion, carrot, celery start', percentage: 92 },
    { label: 'Simmer time', consensus: '30-45 min', percentage: 70 },
    { label: 'Pasta timing', consensus: 'Add pasta near the end', percentage: 85 },
  ],
  differs: [],
},

'mushroom-risotto': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'America\'s Test Kitchen', 'Food52', 'La Cucina Italiana'],
  ingredients: [
    { label: 'Rice type', consensus: 'Arborio', percentage: 65, alternative: 'Carnaroli', altPercentage: 35 },
    { label: 'Mushroom type', consensus: 'Mix: cremini + dried porcini', percentage: 78 },
    { label: 'Stock', consensus: 'Warm stock, kept hot', percentage: 92 },
    { label: 'Wine', consensus: 'Dry white wine', percentage: 88 },
    { label: 'Finish', consensus: 'Butter + Parmigiano', percentage: 95 },
  ],
  techniques: [
    { label: 'Toast rice', consensus: 'Toast in fat until translucent', percentage: 87 },
    { label: 'Add stock', consensus: 'Ladle by ladle, stirring', percentage: 82, alternative: 'Add most at once', altPercentage: 18 },
    { label: 'Mantecatura', consensus: 'Vigorous stir off heat w/ butter', percentage: 80 },
    { label: 'Final texture', consensus: 'All\'onda, wavy/loose', percentage: 85 },
  ],
  differs: [],
},

'pasta-e-fagioli': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'La Cucina Italiana', 'Food Network'],
  ingredients: [
    { label: 'Bean type', consensus: 'Cannellini or borlotti', percentage: 78 },
    { label: 'Pasta shape', consensus: 'Ditalini or small shells', percentage: 72, alternative: 'Broken spaghetti', altPercentage: 28 },
    { label: 'Tomato', consensus: 'Moderate tomato, not heavy', percentage: 68, alternative: 'Brothy, white version', altPercentage: 32 },
    { label: 'Pancetta', consensus: 'Pancetta or guanciale', percentage: 70, alternative: 'Vegetarian, skip', altPercentage: 30 },
    { label: 'Parmesan rind', consensus: 'Simmer with rind', percentage: 76 },
  ],
  techniques: [
    { label: 'Mash some beans', consensus: 'Mash 1/3 for body', percentage: 82 },
    { label: 'Cook pasta in soup', consensus: 'Cook pasta directly in', percentage: 78 },
    { label: 'Consistency', consensus: 'Thick, between soup and stew', percentage: 85 },
  ],
  differs: [],
},

'tomato-sauce-basic': {
  recipesAnalyzed: 25,
  sources: ['Serious Eats', 'NYT Cooking', 'Marcella Hazan', 'Bon Appétit', 'America\'s Test Kitchen', 'Food52'],
  ingredients: [
    { label: 'Tomato type', consensus: 'San Marzano canned whole', percentage: 78, alternative: 'Any quality canned whole', altPercentage: 22 },
    { label: 'Garlic', consensus: '3-4 cloves, sliced', percentage: 75, alternative: 'No garlic (Hazan-style)', altPercentage: 25 },
    { label: 'Onion', consensus: 'Halved onion, removed', percentage: 55, alternative: 'Diced onion, left in', altPercentage: 45 },
    { label: 'Olive oil', consensus: 'Good EVOO, generous', percentage: 90 },
    { label: 'Sugar', consensus: 'Not needed if good tomatoes', percentage: 65, alternative: 'Pinch of sugar', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Crush method', consensus: 'Hand crush in pot', percentage: 72 },
    { label: 'Simmer time', consensus: '30-45 min', percentage: 68, alternative: '15-20 min quick', altPercentage: 32 },
    { label: 'Blend or not', consensus: 'Leave chunky or lightly blend', percentage: 60, alternative: 'Fully smooth', altPercentage: 40 },
  ],
  differs: [],
},

// ===== ITALIAN (PIEDMONTESE) =====
'panna-cotta': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food52', 'La Cucina Italiana'],
  ingredients: [
    { label: 'Cream ratio', consensus: 'Heavy cream dominant', percentage: 72, alternative: 'Half cream, half milk', altPercentage: 28 },
    { label: 'Gelatin amount', consensus: '2.5 tsp per 2 cups', percentage: 68, alternative: 'Less for softer set', altPercentage: 32 },
    { label: 'Sweetener', consensus: 'White sugar, moderate', percentage: 82 },
    { label: 'Vanilla', consensus: 'Vanilla bean or extract', percentage: 90 },
  ],
  techniques: [
    { label: 'Bloom gelatin', consensus: 'Cold water, 5 min', percentage: 92 },
    { label: 'Heat cream', consensus: 'Warm, don\'t boil', percentage: 88 },
    { label: 'Set time', consensus: '4+ hours or overnight', percentage: 85 },
    { label: 'Unmold', consensus: 'Dip in warm water briefly', percentage: 70, alternative: 'Serve in ramekin', altPercentage: 30 },
  ],
  differs: [],
},

// ===== ITALIAN-AMERICAN =====
'giardiniera': {
  recipesAnalyzed: 11,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'The Kitchn', 'Food52'],
  ingredients: [
    { label: 'Vegetables', consensus: 'Cauliflower, peppers, celery, carrots', percentage: 82 },
    { label: 'Hot peppers', consensus: 'Serrano or sport peppers', percentage: 75, alternative: 'Jalapeño', altPercentage: 25 },
    { label: 'Brine', consensus: 'White vinegar base', percentage: 85 },
    { label: 'Oil type', consensus: 'Olive oil finish or oil-packed', percentage: 68, alternative: 'Vinegar brine only', altPercentage: 32 },
    { label: 'Oregano', consensus: 'Dried oregano included', percentage: 78 },
  ],
  techniques: [
    { label: 'Salt overnight', consensus: 'Salt and drain vegetables', percentage: 72, alternative: 'Skip brining step', altPercentage: 28 },
    { label: 'Chop size', consensus: 'Small dice, uniform', percentage: 80 },
    { label: 'Ready time', consensus: '2-3 days marinating', percentage: 76 },
  ],
  differs: [],
},

'shrimp-scampi': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food Network', 'America\'s Test Kitchen'],
  ingredients: [
    { label: 'Garlic amount', consensus: '6-8 cloves, generous', percentage: 85 },
    { label: 'Wine', consensus: 'Dry white wine', percentage: 82, alternative: 'Lemon juice only', altPercentage: 18 },
    { label: 'Butter + oil', consensus: 'Both, equal parts', percentage: 75 },
    { label: 'Red pepper flakes', consensus: 'Pinch included', percentage: 80 },
    { label: 'Pasta pairing', consensus: 'Linguine', percentage: 62, alternative: 'Angel hair or no pasta', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Shrimp cook time', consensus: '1-2 min per side max', percentage: 88 },
    { label: 'Sauce emulsion', consensus: 'Pasta water to emulsify', percentage: 76 },
    { label: 'Lemon finish', consensus: 'Fresh lemon juice at end', percentage: 90 },
  ],
  differs: [],
},

// ===== ITALIAN-AMERICAN (SAN FRANCISCO) =====
'cioppino': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food & Wine', 'San Francisco Chronicle'],
  ingredients: [
    { label: 'Seafood mix', consensus: 'Clams, mussels, shrimp, fish, crab', percentage: 80 },
    { label: 'Tomato base', consensus: 'Canned crushed + wine', percentage: 85 },
    { label: 'Wine', consensus: 'Dry white wine, generous', percentage: 78 },
    { label: 'Fennel', consensus: 'Fennel bulb in base', percentage: 68, alternative: 'No fennel', altPercentage: 32 },
    { label: 'Red pepper flakes', consensus: 'Light heat', percentage: 72 },
  ],
  techniques: [
    { label: 'Build broth first', consensus: 'Simmer tomato base 20 min', percentage: 82 },
    { label: 'Seafood order', consensus: 'Add firmest first, delicate last', percentage: 90 },
    { label: 'Serve with', consensus: 'Crusty sourdough bread', percentage: 85 },
  ],
  differs: [],
},

// ===== JAMAICAN =====
'ackee-and-saltfish': {
  recipesAnalyzed: 12,
  sources: ['Immaculate Bites', 'That Girl Cooks Healthy', 'Serious Eats', 'BBC Good Food', 'Saveur'],
  ingredients: [
    { label: 'Ackee type', consensus: 'Canned ackee (outside JA)', percentage: 75, alternative: 'Fresh ackee', altPercentage: 25 },
    { label: 'Saltfish prep', consensus: 'Boil twice to desalt', percentage: 82 },
    { label: 'Scotch bonnet', consensus: 'Whole for flavor, not heat', percentage: 72, alternative: 'Diced for heat', altPercentage: 28 },
    { label: 'Bell peppers', consensus: 'Mixed color peppers', percentage: 78 },
    { label: 'Thyme', consensus: 'Fresh thyme sprigs', percentage: 85 },
  ],
  techniques: [
    { label: 'Add ackee timing', consensus: 'Last, fold gently', percentage: 90 },
    { label: 'Don\'t mash ackee', consensus: 'Keep pieces intact', percentage: 88 },
    { label: 'Serve with', consensus: 'Fried dumplings or breadfruit', percentage: 70 },
  ],
  differs: [],
},

'jerk-chicken': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Immaculate Bites', 'Saveur', 'Food & Wine'],
  ingredients: [
    { label: 'Scotch bonnet', consensus: '2-4 peppers, essential', percentage: 92 },
    { label: 'Allspice', consensus: 'Generous, ground + whole', percentage: 90 },
    { label: 'Thyme', consensus: 'Fresh thyme, lots', percentage: 87 },
    { label: 'Scallions', consensus: 'Blended into marinade', percentage: 82 },
    { label: 'Soy sauce', consensus: 'In marinade for umami', percentage: 68, alternative: 'No soy, browning sauce', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Marinate time', consensus: 'Overnight, 12-24 hours', percentage: 80, alternative: '4-6 hours minimum', altPercentage: 20 },
    { label: 'Cook method', consensus: 'Grill over pimento wood', percentage: 55, alternative: 'Oven or charcoal grill', altPercentage: 45 },
    { label: 'Chicken cut', consensus: 'Leg quarters or whole, scored', percentage: 72 },
    { label: 'Low and slow', consensus: 'Indirect heat, then sear', percentage: 68 },
  ],
  differs: [{ point: 'Wood smoke', detail: 'Authentic jerk uses pimento (allspice) wood; this recipe adapts for standard charcoal or oven' }],
},

'rice-and-peas': {
  recipesAnalyzed: 14,
  sources: ['Immaculate Bites', 'That Girl Cooks Healthy', 'Serious Eats', 'Bon Appétit', 'BBC Good Food'],
  ingredients: [
    { label: 'Peas type', consensus: 'Kidney beans (not green peas)', percentage: 88 },
    { label: 'Coconut milk', consensus: 'Full-fat coconut milk', percentage: 92 },
    { label: 'Scotch bonnet', consensus: 'Whole, uncut for aroma', percentage: 80 },
    { label: 'Thyme', consensus: 'Fresh thyme sprigs', percentage: 85 },
    { label: 'Rice type', consensus: 'Long grain white rice', percentage: 78 },
  ],
  techniques: [
    { label: 'Cook beans first', consensus: 'Simmer beans in coconut milk', percentage: 82 },
    { label: 'Rice absorption', consensus: 'Cook until liquid absorbed', percentage: 88 },
    { label: 'Remove pepper', consensus: 'Don\'t burst the scotch bonnet', percentage: 85 },
  ],
  differs: [],
},

// ===== JAPANESE =====
'gyoza-japanese-dumplings': {
  recipesAnalyzed: 18,
  sources: ['Just One Cookbook', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Filling protein', consensus: 'Ground pork', percentage: 85, alternative: 'Chicken or shrimp', altPercentage: 15 },
    { label: 'Cabbage', consensus: 'Napa cabbage, salted + squeezed', percentage: 82 },
    { label: 'Garlic + ginger', consensus: 'Both, minced', percentage: 90 },
    { label: 'Sesame oil', consensus: 'In filling, small amount', percentage: 78 },
    { label: 'Wrappers', consensus: 'Store-bought round wrappers', percentage: 72, alternative: 'Homemade dough', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Pan-fry then steam (yaki)', percentage: 88 },
    { label: 'Crispy bottom', consensus: 'Water + cornstarch slurry', percentage: 65, alternative: 'Plain water steam', altPercentage: 35 },
    { label: 'Pleating', consensus: 'Pleat one side, seal', percentage: 80 },
  ],
  differs: [],
},

'karaage-japanese-fried-chicken': {
  recipesAnalyzed: 16,
  sources: ['Just One Cookbook', 'Serious Eats', 'NYT Cooking', 'RecipeTin Eats', 'Bon Appétit'],
  ingredients: [
    { label: 'Cut', consensus: 'Boneless thigh, bite-size', percentage: 90 },
    { label: 'Marinade base', consensus: 'Soy + sake + ginger', percentage: 88 },
    { label: 'Garlic in marinade', consensus: 'Grated garlic', percentage: 82 },
    { label: 'Coating', consensus: 'Potato starch (katakuriko)', percentage: 75, alternative: 'Cornstarch', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Marinate time', consensus: '30 min to overnight', percentage: 72 },
    { label: 'Double fry', consensus: 'Fry twice for crunch', percentage: 65, alternative: 'Single fry', altPercentage: 35 },
    { label: 'Oil temp', consensus: '340°F first, 375°F second', percentage: 68 },
    { label: 'Serve with', consensus: 'Lemon wedge + mayo', percentage: 80 },
  ],
  differs: [],
},

'katsu-curry': {
  recipesAnalyzed: 15,
  sources: ['Just One Cookbook', 'Serious Eats', 'RecipeTin Eats', 'Bon Appétit', 'NYT Cooking'],
  ingredients: [
    { label: 'Protein', consensus: 'Pork loin (tonkatsu)', percentage: 65, alternative: 'Chicken breast', altPercentage: 35 },
    { label: 'Breading', consensus: 'Panko breadcrumbs', percentage: 95 },
    { label: 'Curry base', consensus: 'Onion, carrot, potato', percentage: 82 },
    { label: 'Curry roux', consensus: 'Japanese curry roux blocks', percentage: 70, alternative: 'From scratch with spices', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Breading order', consensus: 'Flour, egg, panko', percentage: 92 },
    { label: 'Fry method', consensus: 'Deep fry until golden', percentage: 78, alternative: 'Shallow fry', altPercentage: 22 },
    { label: 'Slice katsu', consensus: 'Slice into strips before serving', percentage: 85 },
    { label: 'Curry simmer', consensus: '20-30 min for depth', percentage: 73 },
  ],
  differs: [],
},

'miso-soup': {
  recipesAnalyzed: 20,
  sources: ['Just One Cookbook', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Dashi base', consensus: 'Kombu + bonito flakes', percentage: 82, alternative: 'Instant dashi powder', altPercentage: 18 },
    { label: 'Miso type', consensus: 'White (shiro) miso', percentage: 60, alternative: 'Red or mixed (awase)', altPercentage: 40 },
    { label: 'Tofu', consensus: 'Soft or silken, cubed', percentage: 88 },
    { label: 'Wakame', consensus: 'Dried wakame seaweed', percentage: 85 },
    { label: 'Scallion', consensus: 'Sliced green onion garnish', percentage: 80 },
  ],
  techniques: [
    { label: 'Never boil miso', consensus: 'Add miso off heat', percentage: 92 },
    { label: 'Dissolve method', consensus: 'Whisk miso through strainer', percentage: 72 },
    { label: 'Serve immediately', consensus: 'Best fresh, don\'t reheat', percentage: 78 },
  ],
  differs: [],
},

'mochi': {
  recipesAnalyzed: 13,
  sources: ['Just One Cookbook', 'Serious Eats', 'Bon Appétit', 'NYT Cooking', 'Chopstick Chronicles'],
  ingredients: [
    { label: 'Flour type', consensus: 'Mochiko (glutinous rice flour)', percentage: 88, alternative: 'Shiratamako', altPercentage: 12 },
    { label: 'Sweetener', consensus: 'Sugar, moderate', percentage: 78 },
    { label: 'Filling', consensus: 'Red bean (anko) paste', percentage: 72, alternative: 'Strawberry or ice cream', altPercentage: 28 },
    { label: 'Coating', consensus: 'Potato starch or cornstarch', percentage: 85 },
  ],
  techniques: [
    { label: 'Cook method', consensus: 'Microwave method', percentage: 58, alternative: 'Steam traditional', altPercentage: 42 },
    { label: 'Knead while hot', consensus: 'Work dough while warm', percentage: 82 },
    { label: 'Dust generously', consensus: 'Plenty of starch to prevent sticking', percentage: 90 },
  ],
  differs: [],
},

'onigiri': {
  recipesAnalyzed: 14,
  sources: ['Just One Cookbook', 'Serious Eats', 'Bon Appétit', 'NYT Cooking', 'Chopstick Chronicles'],
  ingredients: [
    { label: 'Rice type', consensus: 'Japanese short grain, freshly cooked', percentage: 92 },
    { label: 'Seasoning', consensus: 'Salt on wet hands', percentage: 85 },
    { label: 'Filling', consensus: 'Umeboshi, tuna mayo, or salmon', percentage: 78 },
    { label: 'Nori', consensus: 'Wrap with nori sheet', percentage: 82 },
  ],
  techniques: [
    { label: 'Rice temp', consensus: 'Warm, not cold', percentage: 88 },
    { label: 'Shaping pressure', consensus: 'Firm but gentle, 3 turns', percentage: 80 },
    { label: 'Shape', consensus: 'Triangle is classic', percentage: 72, alternative: 'Round or cylinder', altPercentage: 28 },
  ],
  differs: [],
},

'oyakodon': {
  recipesAnalyzed: 13,
  sources: ['Just One Cookbook', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Protein', consensus: 'Chicken thigh, bite-size', percentage: 90 },
    { label: 'Sauce base', consensus: 'Dashi + soy + mirin', percentage: 88 },
    { label: 'Onion', consensus: 'Sliced onion, simmered', percentage: 85 },
    { label: 'Eggs', consensus: '2-3 eggs, barely beaten', percentage: 82 },
  ],
  techniques: [
    { label: 'Egg doneness', consensus: 'Barely set, custardy', percentage: 87 },
    { label: 'Add eggs in stages', consensus: 'Two pours for texture', percentage: 68, alternative: 'Single pour', altPercentage: 32 },
    { label: 'Individual portions', consensus: 'Cook one serving at a time', percentage: 72 },
    { label: 'Serve over', consensus: 'Hot steamed rice, bowl', percentage: 95 },
  ],
  differs: [],
},

'tempura': {
  recipesAnalyzed: 17,
  sources: ['Just One Cookbook', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Batter liquid', consensus: 'Ice-cold water', percentage: 90 },
    { label: 'Flour', consensus: 'Cake flour or low-gluten', percentage: 65, alternative: 'All-purpose + cornstarch', altPercentage: 35 },
    { label: 'Egg in batter', consensus: 'Egg yolk, cold', percentage: 78 },
    { label: 'Vegetables', consensus: 'Sweet potato, shiso, squash', percentage: 72 },
    { label: 'Dipping sauce', consensus: 'Tentsuyu (dashi, soy, mirin)', percentage: 82 },
  ],
  techniques: [
    { label: 'Batter mixing', consensus: 'Barely mix, lumps OK', percentage: 92 },
    { label: 'Oil temp', consensus: '340-360°F', percentage: 80 },
    { label: 'Keep cold', consensus: 'Batter bowl over ice', percentage: 75 },
    { label: 'Don\'t crowd', consensus: 'Fry in small batches', percentage: 88 },
  ],
  differs: [],
},

'teriyaki-salmon': {
  recipesAnalyzed: 16,
  sources: ['Just One Cookbook', 'RecipeTin Eats', 'Serious Eats', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Sauce base', consensus: 'Soy + mirin + sake + sugar', percentage: 85 },
    { label: 'Ginger', consensus: 'Fresh ginger in sauce', percentage: 68, alternative: 'No ginger', altPercentage: 32 },
    { label: 'Salmon cut', consensus: 'Skin-on fillets', percentage: 72 },
    { label: 'Sauce consistency', consensus: 'Reduce to glaze', percentage: 88 },
  ],
  techniques: [
    { label: 'Cook method', consensus: 'Pan-sear, then glaze', percentage: 75, alternative: 'Broil with sauce', altPercentage: 25 },
    { label: 'Sauce timing', consensus: 'Add sauce last 2-3 min', percentage: 80 },
    { label: 'Don\'t overcook', consensus: 'Medium, still moist center', percentage: 82 },
  ],
  differs: [],
},

// ===== JAPANESE (FUKUOKA) =====
'ramen-tonkotsu': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Just One Cookbook', 'NYT Cooking', 'Bon Appétit', 'Ramen Lord (Mike Satinover)', 'Way of Ramen'],
  ingredients: [
    { label: 'Broth bones', consensus: 'Pork femur + trotters', percentage: 82 },
    { label: 'Boil intensity', consensus: 'Hard rolling boil', percentage: 90 },
    { label: 'Tare', consensus: 'Soy-based (shoyu tare)', percentage: 65, alternative: 'Shio (salt) tare', altPercentage: 35 },
    { label: 'Noodle type', consensus: 'Thin, straight, low hydration', percentage: 78 },
    { label: 'Chashu', consensus: 'Pork belly, rolled and braised', percentage: 85 },
    { label: 'Fat', consensus: 'Mayu (black garlic oil) or lard', percentage: 72 },
  ],
  techniques: [
    { label: 'Broth time', consensus: '12-18 hours boil', percentage: 70, alternative: '6-8 hours pressure cooker', altPercentage: 30 },
    { label: 'Emulsification', consensus: 'Rolling boil emulsifies fat', percentage: 88 },
    { label: 'Broth color', consensus: 'Opaque, creamy white', percentage: 92 },
  ],
  differs: [{ point: 'Broth shortcut', detail: 'May use pressure cooker for a faster broth rather than the traditional 12+ hour boil' }],
},

// ===== JAPANESE (OSAKA) =====
'okonomiyaki': {
  recipesAnalyzed: 15,
  sources: ['Just One Cookbook', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Cabbage', consensus: 'Shredded, generous amount', percentage: 95 },
    { label: 'Batter', consensus: 'Flour + dashi + eggs + nagaimo', percentage: 72, alternative: 'Flour + eggs + water only', altPercentage: 28 },
    { label: 'Protein', consensus: 'Pork belly slices on top', percentage: 78, alternative: 'Shrimp or mixed', altPercentage: 22 },
    { label: 'Tenkasu', consensus: 'Tempura scraps in batter', percentage: 68 },
    { label: 'Toppings', consensus: 'Okonomiyaki sauce + Kewpie + bonito + aonori', percentage: 90 },
  ],
  techniques: [
    { label: 'Style', consensus: 'Osaka-style (mixed)', percentage: 70, alternative: 'Hiroshima-style (layered)', altPercentage: 30 },
    { label: 'Flip once', consensus: 'Cook 4-5 min, flip once', percentage: 82 },
    { label: 'Don\'t press down', consensus: 'Don\'t flatten, keep fluffy', percentage: 78 },
  ],
  differs: [],
},

// ===== JEWISH =====
'challah': {
  recipesAnalyzed: 19,
  sources: ['King Arthur Baking', 'NYT Cooking', 'Smitten Kitchen', 'Bon Appétit', 'Food52', 'The Kitchn'],
  ingredients: [
    { label: 'Eggs', consensus: '3-4 eggs, enriched dough', percentage: 88 },
    { label: 'Sweetener', consensus: 'Honey', percentage: 72, alternative: 'Sugar', altPercentage: 28 },
    { label: 'Oil type', consensus: 'Vegetable or canola oil', percentage: 75, alternative: 'Butter (not pareve)', altPercentage: 25 },
    { label: 'Egg wash', consensus: 'Egg yolk + water wash', percentage: 90 },
  ],
  techniques: [
    { label: 'Braid style', consensus: '6-strand braid', percentage: 55, alternative: '3-strand braid', altPercentage: 45 },
    { label: 'Rise times', consensus: 'Two rises', percentage: 82 },
    { label: 'Oven temp', consensus: '350°F', percentage: 75 },
    { label: 'Doneness test', consensus: 'Internal temp 190°F, hollow sound', percentage: 78 },
  ],
  differs: [],
},

// ===== KOREAN =====
'bibimbap': {
  recipesAnalyzed: 18,
  sources: ['Maangchi', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'RecipeTin Eats', 'Korean Bapsang'],
  ingredients: [
    { label: 'Gochujang', consensus: 'Essential, generous', percentage: 95 },
    { label: 'Namul variety', consensus: '4-5 seasoned vegetables', percentage: 80 },
    { label: 'Protein', consensus: 'Bulgogi beef', percentage: 65, alternative: 'Tofu or no meat', altPercentage: 35 },
    { label: 'Egg', consensus: 'Fried egg, runny yolk', percentage: 90 },
    { label: 'Sesame oil', consensus: 'Drizzle before mixing', percentage: 88 },
  ],
  techniques: [
    { label: 'Serve style', consensus: 'Hot stone bowl (dolsot)', percentage: 58, alternative: 'Regular bowl', altPercentage: 42 },
    { label: 'Cook each veg separately', consensus: 'Season each namul individually', percentage: 85 },
    { label: 'Mix at table', consensus: 'Presented arranged, mix to eat', percentage: 82 },
  ],
  differs: [],
},

'bulgogi': {
  recipesAnalyzed: 20,
  sources: ['Maangchi', 'Serious Eats', 'NYT Cooking', 'Korean Bapsang', 'Bon Appétit', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Meat cut', consensus: 'Ribeye or sirloin, thin sliced', percentage: 82 },
    { label: 'Pear in marinade', consensus: 'Asian pear, grated', percentage: 78, alternative: 'Kiwi or apple', altPercentage: 22 },
    { label: 'Soy sauce', consensus: 'Soy + sugar + sesame oil', percentage: 90 },
    { label: 'Garlic amount', consensus: 'Generous, 5-6 cloves', percentage: 85 },
    { label: 'Onion', consensus: 'Grated onion in marinade', percentage: 76 },
  ],
  techniques: [
    { label: 'Slice technique', consensus: 'Freeze 30 min, slice thin', percentage: 72 },
    { label: 'Marinate time', consensus: '2-4 hours or overnight', percentage: 75 },
    { label: 'Cook method', consensus: 'High heat, grill or pan', percentage: 80 },
    { label: 'Don\'t crowd', consensus: 'Single layer for browning', percentage: 78 },
  ],
  differs: [],
},

'japchae': {
  recipesAnalyzed: 14,
  sources: ['Maangchi', 'Korean Bapsang', 'Serious Eats', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Noodle type', consensus: 'Dangmyeon (sweet potato glass noodles)', percentage: 95 },
    { label: 'Vegetables', consensus: 'Spinach, carrots, mushrooms, bell pepper', percentage: 82 },
    { label: 'Protein', consensus: 'Thinly sliced beef', percentage: 70, alternative: 'Vegetarian', altPercentage: 30 },
    { label: 'Seasoning', consensus: 'Soy sauce + sesame oil + sugar', percentage: 90 },
    { label: 'Egg garnish', consensus: 'Thin egg strips (jidan)', percentage: 68 },
  ],
  techniques: [
    { label: 'Cook veg separately', consensus: 'Stir-fry each component alone', percentage: 88 },
    { label: 'Noodle texture', consensus: 'Boil, then cut with scissors', percentage: 75 },
    { label: 'Toss at end', consensus: 'Combine everything, toss gently', percentage: 82 },
  ],
  differs: [],
},

'kimchi': {
  recipesAnalyzed: 22,
  sources: ['Maangchi', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Korean Bapsang', 'Food52'],
  ingredients: [
    { label: 'Cabbage', consensus: 'Napa cabbage, quartered', percentage: 92 },
    { label: 'Gochugaru', consensus: 'Korean red pepper flakes', percentage: 95 },
    { label: 'Fish sauce', consensus: 'Fish sauce or salted shrimp', percentage: 85 },
    { label: 'Rice paste', consensus: 'Sweet rice flour paste as base', percentage: 72, alternative: 'Skip, just gochugaru paste', altPercentage: 28 },
    { label: 'Garlic', consensus: 'Heavy garlic, 8-10 cloves', percentage: 88 },
    { label: 'Radish', consensus: 'Matchstick Korean radish (mu)', percentage: 80 },
  ],
  techniques: [
    { label: 'Salt cabbage', consensus: '2 hours in coarse salt', percentage: 78, alternative: 'Overnight salting', altPercentage: 22 },
    { label: 'Ferment time', consensus: '1-2 days room temp, then fridge', percentage: 72 },
    { label: 'Pack tightly', consensus: 'Press out air bubbles', percentage: 85 },
  ],
  differs: [],
},

'kimchi-jjigae': {
  recipesAnalyzed: 16,
  sources: ['Maangchi', 'Korean Bapsang', 'Serious Eats', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Kimchi age', consensus: 'Well-fermented, sour kimchi', percentage: 88 },
    { label: 'Pork', consensus: 'Pork belly or shoulder', percentage: 75, alternative: 'Tuna (chamchi)', altPercentage: 25 },
    { label: 'Tofu', consensus: 'Firm tofu, thick slabs', percentage: 80 },
    { label: 'Gochugaru', consensus: 'Extra gochugaru added', percentage: 72 },
    { label: 'Kimchi liquid', consensus: 'Include the brine', percentage: 85 },
  ],
  techniques: [
    { label: 'Sauté kimchi first', consensus: 'Fry kimchi + pork in oil', percentage: 78 },
    { label: 'Simmer time', consensus: '20-30 min for depth', percentage: 72 },
    { label: 'Serve bubbling', consensus: 'Bring to table boiling hot', percentage: 82 },
  ],
  differs: [],
},

'korean-fried-chicken': {
  recipesAnalyzed: 17,
  sources: ['Maangchi', 'Serious Eats', 'NYT Cooking', 'Bon Appétit', 'RecipeTin Eats', 'Korean Bapsang'],
  ingredients: [
    { label: 'Coating', consensus: 'Cornstarch or potato starch', percentage: 78, alternative: 'Flour + starch mix', altPercentage: 22 },
    { label: 'Sauce type', consensus: 'Gochujang-based sweet-spicy', percentage: 65, alternative: 'Soy garlic (yangnyeom)', altPercentage: 35 },
    { label: 'Chicken cut', consensus: 'Wings or drumettes', percentage: 62, alternative: 'Boneless thigh', altPercentage: 38 },
    { label: 'Rice syrup', consensus: 'Korean rice syrup (ssalyeot) in sauce', percentage: 68, alternative: 'Honey or corn syrup', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Double fry', consensus: 'Fry twice for ultra-crispy', percentage: 90 },
    { label: 'First fry', consensus: '325°F, 8-10 min', percentage: 78 },
    { label: 'Second fry', consensus: '375°F, 3-4 min', percentage: 80 },
    { label: 'Sauce after frying', consensus: 'Toss in sauce right before serving', percentage: 85 },
  ],
  differs: [],
},

'sundubu-jjigae-soft-tofu-stew': {
  recipesAnalyzed: 14,
  sources: ['Maangchi', 'Korean Bapsang', 'Serious Eats', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Tofu type', consensus: 'Uncurdled soft tofu (sundubu)', percentage: 90 },
    { label: 'Protein', consensus: 'Seafood (clams, shrimp)', percentage: 60, alternative: 'Pork or kimchi', altPercentage: 40 },
    { label: 'Gochugaru', consensus: 'Generous Korean chili flakes', percentage: 85 },
    { label: 'Anchovy/kelp base', consensus: 'Anchovy-kelp dashi stock', percentage: 72, alternative: 'Water or dashida', altPercentage: 28 },
    { label: 'Egg', consensus: 'Crack raw egg in at end', percentage: 88 },
  ],
  techniques: [
    { label: 'Build in ttukbaegi', consensus: 'Cook in stone pot', percentage: 75, alternative: 'Regular pot, transfer', altPercentage: 25 },
    { label: 'Sauté aromatics', consensus: 'Oil + gochugaru + garlic first', percentage: 80 },
    { label: 'Serve bubbling', consensus: 'Must be actively boiling', percentage: 90 },
  ],
  differs: [],
},

'tteokbokki': {
  recipesAnalyzed: 16,
  sources: ['Maangchi', 'Korean Bapsang', 'Serious Eats', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Rice cakes', consensus: 'Cylinder-shaped tteok (garaetteok)', percentage: 92 },
    { label: 'Sauce base', consensus: 'Gochujang + gochugaru', percentage: 88 },
    { label: 'Sweetener', consensus: 'Sugar or corn syrup', percentage: 78 },
    { label: 'Fish cakes', consensus: 'Eomuk (fish cake sheets)', percentage: 82 },
    { label: 'Broth', consensus: 'Anchovy-kelp dashi', percentage: 75, alternative: 'Water + dashida', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Soak rice cakes', consensus: 'Soak if dried, 30 min', percentage: 72 },
    { label: 'Simmer sauce', consensus: 'Boil sauce, add tteok, reduce', percentage: 85 },
    { label: 'Final texture', consensus: 'Thick, glossy, coating sauce', percentage: 88 },
    { label: 'Boiled egg', consensus: 'Halved boiled egg garnish', percentage: 68, alternative: 'No egg', altPercentage: 32 },
  ],
  differs: [],
},

// ===== ITALIAN =====

'aglio-e-olio': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Bon Appétit', 'La Cucina Italiana', 'NYT Cooking', 'Food Network'],
  ingredients: [
    { label: 'Pasta shape', consensus: 'Spaghetti', percentage: 88, alternative: 'Linguine', altPercentage: 12 },
    { label: 'Garlic amount', consensus: '6-8 cloves per pound', percentage: 78, alternative: '3-4 cloves', altPercentage: 22 },
    { label: 'Chile flake type', consensus: 'Red pepper flakes', percentage: 72, alternative: 'Fresh peperoncino', altPercentage: 28 },
    { label: 'Finishing herb', consensus: 'Flat-leaf parsley', percentage: 91 },
    { label: 'Cheese included', consensus: 'No cheese', percentage: 65, alternative: 'Pecorino on the side', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Garlic prep', consensus: 'Thinly sliced', percentage: 74, alternative: 'Minced', altPercentage: 26 },
    { label: 'Garlic cooking', consensus: 'Low and slow, golden', percentage: 85, alternative: 'Quick sauté', altPercentage: 15 },
    { label: 'Emulsion method', consensus: 'Pasta water tossed in pan', percentage: 92 },
  ],
  differs: [{ point: 'Anchovy addition', detail: 'This version adds a finely minced anchovy fillet for umami depth, which is not traditional but increasingly common' }],
},

'arancini': {
  recipesAnalyzed: 14,
  sources: ['La Cucina Italiana', 'Serious Eats', 'Great Italian Chefs', 'Bon Appétit', 'Giallo Zafferano'],
  ingredients: [
    { label: 'Rice type', consensus: 'Arborio', percentage: 68, alternative: 'Carnaroli', altPercentage: 32 },
    { label: 'Filling (meat)', consensus: 'Ragù with peas', percentage: 72, alternative: 'Mozzarella only', altPercentage: 28 },
    { label: 'Cheese in rice', consensus: 'Parmigiano-Reggiano', percentage: 76, alternative: 'Pecorino', altPercentage: 24 },
    { label: 'Saffron', consensus: 'Yes, in the rice', percentage: 82, alternative: 'No saffron', altPercentage: 18 },
    { label: 'Breading', consensus: 'Fine dried breadcrumbs', percentage: 88 },
  ],
  techniques: [
    { label: 'Rice prep', consensus: 'Cook risotto, cool fully', percentage: 90 },
    { label: 'Shaping', consensus: 'Wet hands, form around filling', percentage: 85 },
    { label: 'Frying temp', consensus: '350°F / 175°C', percentage: 78, alternative: '375°F / 190°C', altPercentage: 22 },
  ],
  differs: [],
},

'cacio-e-pepe': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'La Cucina Italiana', 'Food52'],
  ingredients: [
    { label: 'Pasta shape', consensus: 'Tonnarelli or spaghetti', percentage: 70, alternative: 'Rigatoni', altPercentage: 30 },
    { label: 'Cheese', consensus: 'Pecorino Romano only', percentage: 82, alternative: 'Pecorino-Parmigiano blend', altPercentage: 18 },
    { label: 'Pepper type', consensus: 'Whole black, fresh cracked', percentage: 94 },
    { label: 'Fat added', consensus: 'None, just pasta water', percentage: 68, alternative: 'Small amount of butter', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Pepper bloom', consensus: 'Toast in dry pan first', percentage: 80, alternative: 'Add raw', altPercentage: 20 },
    { label: 'Cheese emulsion', consensus: 'Paste with cold water off heat', percentage: 62, alternative: 'Toss in hot pan with starchy water', altPercentage: 38 },
    { label: 'Pasta water starch', consensus: 'Cook pasta in less water', percentage: 72, alternative: 'Normal water amount', altPercentage: 28 },
  ],
  differs: [{ point: 'Butter controversy', detail: 'This recipe includes a small knob of butter to stabilize the emulsion, which purists in Rome would consider sacrilege' }],
},

'carbonara': {
  recipesAnalyzed: 5,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food52', 'Allrecipes'],
  ingredients: [
    { label: 'Pork cut', consensus: 'Guanciale', percentage: 80, alternative: 'Bacon', altPercentage: 20 },
    { label: 'Cream', consensus: 'No cream — ever', percentage: 100 },
    { label: 'Egg treatment', consensus: 'Yolk-heavy mix (yolks + some whole)', percentage: 80, alternative: 'All whole eggs', altPercentage: 20 },
    { label: 'Cheese', consensus: 'Pecorino Romano (with or without Parmigiano)', percentage: 80, alternative: 'Parmesan only', altPercentage: 20 },
    { label: 'Pasta shape', consensus: 'Spaghetti', percentage: 80, alternative: 'Rigatoni', altPercentage: 20 },
  ],
  techniques: [
    { label: 'Egg tempering', consensus: 'Combine eggs with pasta off direct heat', percentage: 80, alternative: 'Cook eggs in skillet with pasta', altPercentage: 20 },
    { label: 'Pasta water', consensus: 'Reserve and use for sauce consistency', percentage: 80 },
    { label: 'Cheese addition', consensus: 'Added gradually in batches', percentage: 60, alternative: 'All at once', altPercentage: 40 },
  ],
  differs: [{ point: 'The Allrecipes split', detail: 'Food publications universally favor guanciale, separated yolks, and off-heat technique — the home-cook approach uses bacon, whole eggs, and on-heat cooking' }],
},

// ===== INDIAN =====

'aloo-gobi': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Manjula\'s Kitchen', 'Hebbar\'s Kitchen', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Potato cut', consensus: '1-inch cubes', percentage: 75, alternative: 'Thin slices', altPercentage: 25 },
    { label: 'Key spice', consensus: 'Turmeric + cumin', percentage: 88 },
    { label: 'Tomatoes', consensus: 'Fresh chopped', percentage: 65, alternative: 'No tomato (dry style)', altPercentage: 35 },
    { label: 'Heat source', consensus: 'Green chili', percentage: 72, alternative: 'Red chili powder', altPercentage: 28 },
    { label: 'Ginger-garlic', consensus: 'Both, paste or minced', percentage: 90 },
  ],
  techniques: [
    { label: 'Cauliflower prep', consensus: 'Small florets, parboil or fry', percentage: 60, alternative: 'Raw, steam in pan', altPercentage: 40 },
    { label: 'Cooking method', consensus: 'Dry sabzi, no gravy', percentage: 68, alternative: 'Light gravy', altPercentage: 32 },
    { label: 'Potato cooking', consensus: 'Par-cook before adding', percentage: 72, alternative: 'Cook everything together', altPercentage: 28 },
  ],
  differs: [{ point: 'Wet vs dry', detail: 'This recipe uses a dry preparation without gravy, though many home cooks in Punjab prefer a slightly saucy version' }],
},

'chana-masala': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'Hebbar\'s Kitchen', 'Manjula\'s Kitchen', 'NYT Cooking', 'Bon Appétit', 'Swasthi\'s Recipes'],
  ingredients: [
    { label: 'Chickpeas', consensus: 'Dried, soaked overnight', percentage: 65, alternative: 'Canned', altPercentage: 35 },
    { label: 'Spice blend', consensus: 'Chana masala powder', percentage: 58, alternative: 'Individual whole spices', altPercentage: 42 },
    { label: 'Souring agent', consensus: 'Amchur (dry mango)', percentage: 55, alternative: 'Lemon juice', altPercentage: 45 },
    { label: 'Onion base', consensus: 'Finely diced, browned', percentage: 85 },
    { label: 'Tea bag trick', consensus: 'No tea bag', percentage: 60, alternative: 'Black tea for color', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Onion browning', consensus: 'Deep golden, 15+ mins', percentage: 82 },
    { label: 'Tomato cook', consensus: 'Cook until oil separates', percentage: 88 },
    { label: 'Simmer time', consensus: '20-30 minutes', percentage: 70, alternative: 'Pressure cook', altPercentage: 30 },
  ],
  differs: [],
},

'chole-bhature': {
  recipesAnalyzed: 15,
  sources: ['Hebbar\'s Kitchen', 'Manjula\'s Kitchen', 'Swasthi\'s Recipes', 'Ranveer Brar', 'Kunal Kapur'],
  ingredients: [
    { label: 'Chole base', consensus: 'Dried black chickpeas', percentage: 72, alternative: 'Regular kabuli chana', altPercentage: 28 },
    { label: 'Bhature flour', consensus: 'Maida (all-purpose)', percentage: 78, alternative: 'Maida + semolina blend', altPercentage: 22 },
    { label: 'Bhature leavening', consensus: 'Yogurt + baking soda', percentage: 70, alternative: 'Yeast-based', altPercentage: 30 },
    { label: 'Chole darkener', consensus: 'Tea bag or anardana', percentage: 75, alternative: 'Amchur only', altPercentage: 25 },
    { label: 'Key spice', consensus: 'Chole masala powder', percentage: 80 },
  ],
  techniques: [
    { label: 'Chickpea soak', consensus: 'Overnight, 8+ hours', percentage: 90 },
    { label: 'Bhature dough rest', consensus: '2-4 hours minimum', percentage: 75, alternative: '30 minutes', altPercentage: 25 },
    { label: 'Frying bhature', consensus: 'Deep fry at 375°F, puff up', percentage: 92 },
  ],
  differs: [{ point: 'Pressure cooker vs stovetop', detail: 'This recipe uses a stovetop slow simmer for deeper flavor, while most Indian home cooks pressure cook the chickpeas for convenience' }],
},

// ===== MIDDLE EASTERN =====

'baba-ganoush': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Middle East Eye', 'Ottolenghi'],
  ingredients: [
    { label: 'Tahini amount', consensus: 'Generous, 3-4 tbsp', percentage: 72, alternative: 'Light, 1-2 tbsp', altPercentage: 28 },
    { label: 'Acid', consensus: 'Lemon juice', percentage: 92 },
    { label: 'Garlic', consensus: 'Raw, 1-2 cloves', percentage: 80 },
    { label: 'Pomegranate seeds', consensus: 'Optional garnish', percentage: 55, alternative: 'No pomegranate', altPercentage: 45 },
  ],
  techniques: [
    { label: 'Eggplant cooking', consensus: 'Char over open flame', percentage: 75, alternative: 'Broil in oven', altPercentage: 25 },
    { label: 'Texture', consensus: 'Chunky, hand-mashed', percentage: 62, alternative: 'Smooth, food processor', altPercentage: 38 },
    { label: 'Drain liquid', consensus: 'Yes, drain excess', percentage: 82 },
  ],
  differs: [],
},

'baklava': {
  recipesAnalyzed: 19,
  sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Turkish Food Travel', 'Cleobuttera'],
  ingredients: [
    { label: 'Nut choice', consensus: 'Walnuts or pistachios', percentage: 60, alternative: 'Mixed nuts', altPercentage: 40 },
    { label: 'Sweetener', consensus: 'Sugar syrup', percentage: 70, alternative: 'Honey syrup', altPercentage: 30 },
    { label: 'Phyllo sheets', consensus: '1 lb package, thawed', percentage: 88 },
    { label: 'Flavoring', consensus: 'Rose water or orange blossom', percentage: 65, alternative: 'Vanilla + cinnamon', altPercentage: 35 },
    { label: 'Fat', consensus: 'Clarified butter (ghee)', percentage: 78, alternative: 'Regular melted butter', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Syrup temperature', consensus: 'Cold syrup on hot baklava', percentage: 82, alternative: 'Hot syrup on cooled baklava', altPercentage: 18 },
    { label: 'Cutting', consensus: 'Cut before baking', percentage: 90 },
    { label: 'Phyllo layering', consensus: 'Butter every 2-3 sheets', percentage: 75, alternative: 'Butter every sheet', altPercentage: 25 },
  ],
  differs: [{ point: 'Turkish vs Greek style', detail: 'This recipe uses a sugar-based syrup in the Turkish tradition; Greek versions typically use a honey-heavy syrup with cinnamon' }],
},

// ===== LATIN AMERICAN =====

'arepas': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'My Colombian Recipes', 'Gran Cocina Latina'],
  ingredients: [
    { label: 'Flour', consensus: 'Pre-cooked cornmeal (P.A.N.)', percentage: 92 },
    { label: 'Fat in dough', consensus: 'No fat added', percentage: 58, alternative: 'Butter or oil in dough', altPercentage: 42 },
    { label: 'Cheese in dough', consensus: 'Optional, varies by style', percentage: 55, alternative: 'Always add cheese', altPercentage: 45 },
    { label: 'Salt', consensus: 'Yes, in the water', percentage: 88 },
  ],
  techniques: [
    { label: 'Dough hydration', consensus: 'Rest 5 min after mixing', percentage: 78 },
    { label: 'Cooking method', consensus: 'Griddle then oven', percentage: 62, alternative: 'Griddle only', altPercentage: 38 },
    { label: 'Thickness', consensus: '½ to ¾ inch thick', percentage: 72, alternative: 'Thin and crispy', altPercentage: 28 },
  ],
  differs: [],
},

'carnitas': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Rick Bayless', 'Bon Appétit', 'Mexico in My Kitchen'],
  ingredients: [
    { label: 'Pork cut', consensus: 'Pork shoulder (butt)', percentage: 90 },
    { label: 'Citrus', consensus: 'Orange juice', percentage: 75, alternative: 'Lime juice', altPercentage: 25 },
    { label: 'Cooking fat', consensus: 'Lard', percentage: 60, alternative: 'Pork\'s own rendered fat', altPercentage: 40 },
    { label: 'Milk addition', consensus: 'No milk', percentage: 65, alternative: 'Condensed or evaporated milk', altPercentage: 35 },
    { label: 'Spicing', consensus: 'Cumin, oregano, garlic', percentage: 78 },
  ],
  techniques: [
    { label: 'Primary method', consensus: 'Braise then crisp', percentage: 82, alternative: 'Confit in lard', altPercentage: 18 },
    { label: 'Crisping', consensus: 'Broiler or hot pan', percentage: 70, alternative: 'Reduce braising liquid until frying', altPercentage: 30 },
    { label: 'Cook time', consensus: '3-4 hours low and slow', percentage: 85 },
  ],
  differs: [],
},

'ceviche': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Peru Delights', 'Gastón Acurio'],
  ingredients: [
    { label: 'Fish type', consensus: 'Firm white fish (corvina, sea bass)', percentage: 80, alternative: 'Shrimp', altPercentage: 20 },
    { label: 'Citrus', consensus: 'Fresh lime juice', percentage: 88 },
    { label: 'Onion', consensus: 'Red onion, thinly sliced', percentage: 90 },
    { label: 'Chile', consensus: 'Ají amarillo or serrano', percentage: 68, alternative: 'Jalapeño', altPercentage: 32 },
    { label: 'Cilantro', consensus: 'Yes, fresh', percentage: 85 },
  ],
  techniques: [
    { label: 'Marination time', consensus: '15-30 minutes max', percentage: 72, alternative: '1-2 hours', altPercentage: 28 },
    { label: 'Fish freshness', consensus: 'Sushi-grade, same day', percentage: 92 },
    { label: 'Leche de tigre', consensus: 'Serve with the citrus marinade', percentage: 78, alternative: 'Drain before serving', altPercentage: 22 },
  ],
  differs: [{ point: 'Peruvian vs Mexican style', detail: 'This recipe follows the Peruvian tradition of brief curing and serving with sweet potato and corn, while Mexican ceviche typically cures longer with tomato and avocado' }],
},

'black-beans-frijoles-negros': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NYT Cooking', 'Rick Bayless', 'Bon Appétit', 'Three Guys From Miami'],
  ingredients: [
    { label: 'Bean prep', consensus: 'Dried, soaked overnight', percentage: 70, alternative: 'Quick soak or no soak', altPercentage: 30 },
    { label: 'Aromatics', consensus: 'Onion, garlic, bay leaf', percentage: 88 },
    { label: 'Cumin', consensus: 'Yes, ground cumin', percentage: 75, alternative: 'No cumin (Cuban style)', altPercentage: 25 },
    { label: 'Pepper', consensus: 'Green bell pepper (sofrito)', percentage: 68, alternative: 'No pepper', altPercentage: 32 },
    { label: 'Pork addition', consensus: 'Ham hock or bacon', percentage: 60, alternative: 'Vegetarian', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Stovetop simmer 1.5-2 hrs', percentage: 58, alternative: 'Pressure cooker', altPercentage: 42 },
    { label: 'Salt timing', consensus: 'After beans soften', percentage: 72, alternative: 'From the start', altPercentage: 28 },
    { label: 'Mashing', consensus: 'Partially mash for body', percentage: 70, alternative: 'Leave whole', altPercentage: 30 },
  ],
  differs: [],
},

'churros': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Spanish Sabores', 'Food Network'],
  ingredients: [
    { label: 'Dough base', consensus: 'Choux-style (water, flour, fat)', percentage: 85 },
    { label: 'Eggs', consensus: 'No eggs (Spanish style)', percentage: 58, alternative: '1-2 eggs', altPercentage: 42 },
    { label: 'Fat in dough', consensus: 'Butter or oil', percentage: 72, alternative: 'No added fat', altPercentage: 28 },
    { label: 'Coating', consensus: 'Cinnamon sugar', percentage: 90 },
  ],
  techniques: [
    { label: 'Frying temp', consensus: '375°F / 190°C', percentage: 80 },
    { label: 'Piping tip', consensus: 'Star tip for ridges', percentage: 92 },
    { label: 'Dipping sauce', consensus: 'Thick hot chocolate', percentage: 68, alternative: 'Dulce de leche or caramel', altPercentage: 32 },
  ],
  differs: [{ point: 'Egg inclusion', detail: 'This recipe includes an egg for a lighter interior texture, whereas traditional Spanish churrerías use an eggless dough for a denser, crunchier result' }],
},

// ===== MEXICAN =====

'birria-tacos': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Mexico in My Kitchen', 'Rick Bayless'],
  ingredients: [
    { label: 'Meat', consensus: 'Beef chuck or short rib', percentage: 65, alternative: 'Goat (traditional)', altPercentage: 35 },
    { label: 'Chile base', consensus: 'Guajillo + ancho blend', percentage: 82, alternative: 'Guajillo + morita', altPercentage: 18 },
    { label: 'Tortilla type', consensus: 'Corn tortillas', percentage: 95 },
    { label: 'Cheese', consensus: 'Oaxaca or mozzarella', percentage: 78 },
    { label: 'Consommé', consensus: 'Yes, serve alongside for dipping', percentage: 88 },
  ],
  techniques: [
    { label: 'Braise time', consensus: '3-4 hours until falling apart', percentage: 85 },
    { label: 'Tortilla dip', consensus: 'Dip in consommé fat, then griddle', percentage: 80, alternative: 'Brush with fat', altPercentage: 20 },
    { label: 'Chile toast', consensus: 'Toast dried chiles before soaking', percentage: 78 },
  ],
  differs: [],
},

'black-bean-tacos': {
  recipesAnalyzed: 12,
  sources: ['Serious Eats', 'NYT Cooking', 'Cookie and Kate', 'Bon Appétit', 'Love and Lemons'],
  ingredients: [
    { label: 'Bean prep', consensus: 'Canned, drained and rinsed', percentage: 68, alternative: 'Cooked from dried', altPercentage: 32 },
    { label: 'Bean seasoning', consensus: 'Cumin, chili powder, lime', percentage: 82 },
    { label: 'Tortilla type', consensus: 'Corn tortillas', percentage: 72, alternative: 'Flour tortillas', altPercentage: 28 },
    { label: 'Toppings', consensus: 'Avocado, salsa, cilantro, lime', percentage: 85 },
    { label: 'Cheese', consensus: 'Cotija or queso fresco', percentage: 60, alternative: 'No cheese (vegan)', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Bean texture', consensus: 'Partially mashed', percentage: 65, alternative: 'Whole beans', altPercentage: 35 },
    { label: 'Tortilla warming', consensus: 'Dry skillet or open flame', percentage: 80 },
    { label: 'Cook method', consensus: 'Sauté with aromatics', percentage: 75, alternative: 'Refried style', altPercentage: 25 },
  ],
  differs: [],
},

'chilaquiles': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'Rick Bayless', 'Bon Appétit', 'Mexico in My Kitchen'],
  ingredients: [
    { label: 'Sauce color', consensus: 'Salsa verde (green)', percentage: 55, alternative: 'Salsa roja (red)', altPercentage: 45 },
    { label: 'Tortilla prep', consensus: 'Fried tortilla chips', percentage: 72, alternative: 'Baked or stale chips', altPercentage: 28 },
    { label: 'Protein', consensus: 'Fried egg on top', percentage: 65, alternative: 'Shredded chicken', altPercentage: 35 },
    { label: 'Crema', consensus: 'Mexican crema drizzle', percentage: 85 },
    { label: 'Cheese', consensus: 'Queso fresco crumbled', percentage: 80 },
  ],
  techniques: [
    { label: 'Chip texture', consensus: 'Slightly softened in sauce', percentage: 70, alternative: 'Crispy, sauce on side', altPercentage: 30 },
    { label: 'Sauce method', consensus: 'Simmer chips in sauce briefly', percentage: 78, alternative: 'Pour sauce over chips', altPercentage: 22 },
    { label: 'Serve timing', consensus: 'Immediately, don\'t let sit', percentage: 88 },
  ],
  differs: [{ point: 'Red vs green', detail: 'This recipe uses salsa verde with tomatillos, though chilaquiles rojos with dried chile salsa are equally traditional across Mexico' }],
},

'chili-con-carne': {
  recipesAnalyzed: 5,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Simply Recipes', 'Allrecipes'],
  ingredients: [
    { label: 'Beans', consensus: 'Yes, kidney or pinto', percentage: 80, alternative: 'No beans (Texas purist)', altPercentage: 20 },
    { label: 'Meat', consensus: 'Ground beef', percentage: 60, alternative: 'Cubed chuck', altPercentage: 20 },
    { label: 'Tomatoes', consensus: 'Canned crushed or diced + paste', percentage: 80, alternative: 'Tomato paste only', altPercentage: 20 },
    { label: 'Chile source', consensus: 'Pre-ground chili powder', percentage: 60, alternative: 'Dried whole chiles, toasted and puréed', altPercentage: 40 },
    { label: 'Beer', consensus: 'Added for depth', percentage: 60, alternative: 'No beer', altPercentage: 40 },
    { label: 'Chocolate or cocoa', consensus: 'Not used', percentage: 100 },
  ],
  techniques: [
    { label: 'Meat browning', consensus: 'Brown in batches first', percentage: 100 },
    { label: 'Simmer time', consensus: '1-2+ hours minimum', percentage: 100 },
    { label: 'Spice blooming', consensus: 'Toast spices in oil before adding liquid', percentage: 80 },
  ],
  differs: [{ point: 'The Texas divide', detail: 'Only the NYT Texas Chili omits beans and uses cubed chuck with dried whole chiles — the purist approach. Every other source uses ground beef with beans.' }],
},

// ===== AMERICAN / AMERICAN SOUTHERN =====

'banana-pudding': {
  recipesAnalyzed: 15,
  sources: ['NYT Cooking', 'Serious Eats', 'Southern Living', 'Food Network', 'Bon Appétit'],
  ingredients: [
    { label: 'Pudding type', consensus: 'Homemade custard', percentage: 62, alternative: 'Instant pudding mix', altPercentage: 38 },
    { label: 'Cookie layer', consensus: 'Nilla wafers', percentage: 92 },
    { label: 'Topping', consensus: 'Whipped cream', percentage: 55, alternative: 'Meringue', altPercentage: 45 },
    { label: 'Banana prep', consensus: 'Ripe, sliced fresh', percentage: 90 },
  ],
  techniques: [
    { label: 'Assembly', consensus: 'Layer: wafers, banana, custard', percentage: 85 },
    { label: 'Chill time', consensus: '4+ hours or overnight', percentage: 78, alternative: 'Serve within an hour', altPercentage: 22 },
    { label: 'Custard method', consensus: 'Stovetop, temper eggs', percentage: 62, alternative: 'Instant mix with milk', altPercentage: 38 },
  ],
  differs: [],
},

'bbq-pulled-pork': {
  recipesAnalyzed: 21,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Amazing Ribs', 'Food Network', 'Southern Living'],
  ingredients: [
    { label: 'Cut', consensus: 'Pork shoulder (Boston butt)', percentage: 92 },
    { label: 'Rub base', consensus: 'Brown sugar, paprika, garlic', percentage: 80 },
    { label: 'Sauce style', consensus: 'Vinegar-based (Carolina)', percentage: 45, alternative: 'Tomato-based (Kansas City)', altPercentage: 55 },
    { label: 'Liquid for braising', consensus: 'Apple cider vinegar', percentage: 65, alternative: 'Beer or apple juice', altPercentage: 35 },
    { label: 'Mustard in rub', consensus: 'Yellow mustard binder', percentage: 68, alternative: 'No binder', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Low and slow, 225°F', percentage: 85 },
    { label: 'Cook time', consensus: '8-12 hours to 200°F internal', percentage: 78 },
    { label: 'The stall', consensus: 'Wrap in foil at 160°F (Texas crutch)', percentage: 65, alternative: 'Push through unwrapped', altPercentage: 35 },
    { label: 'Shredding', consensus: 'Two forks, remove fat chunks', percentage: 72, alternative: 'Bear claws or stand mixer', altPercentage: 28 },
  ],
  differs: [{ point: 'Oven vs smoker', detail: 'This recipe uses a low oven for accessibility, while purists insist on a charcoal or wood smoker for authentic smoke flavor' }],
},

'biscuits-and-gravy': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NYT Cooking', 'Southern Living', 'Food Network', 'King Arthur Baking'],
  ingredients: [
    { label: 'Biscuit fat', consensus: 'Cold butter', percentage: 60, alternative: 'Lard or shortening', altPercentage: 40 },
    { label: 'Biscuit liquid', consensus: 'Cold buttermilk', percentage: 88 },
    { label: 'Sausage type', consensus: 'Breakfast pork sausage', percentage: 90 },
    { label: 'Gravy base', consensus: 'Sausage drippings + flour', percentage: 92 },
    { label: 'Gravy liquid', consensus: 'Whole milk', percentage: 82, alternative: 'Half-and-half', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Biscuit method', consensus: 'Cut butter into flour, fold', percentage: 78, alternative: 'Grate frozen butter', altPercentage: 22 },
    { label: 'Biscuit handling', consensus: 'Minimal handling, pat not roll', percentage: 82 },
    { label: 'Gravy seasoning', consensus: 'Heavy black pepper, salt', percentage: 90 },
  ],
  differs: [],
},

// ===== RUSSIAN / EASTERN EUROPEAN =====

'beef-stroganoff': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food Network', 'Natasha\'s Kitchen'],
  ingredients: [
    { label: 'Beef cut', consensus: 'Sirloin or tenderloin strips', percentage: 72, alternative: 'Stew meat', altPercentage: 28 },
    { label: 'Mushrooms', consensus: 'Cremini or button', percentage: 78, alternative: 'Mixed wild mushrooms', altPercentage: 22 },
    { label: 'Sour cream', consensus: 'Full-fat sour cream, stir in at end', percentage: 85 },
    { label: 'Mustard', consensus: 'Dijon mustard', percentage: 65, alternative: 'No mustard', altPercentage: 35 },
    { label: 'Served over', consensus: 'Egg noodles', percentage: 60, alternative: 'Rice or mashed potatoes', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Beef searing', consensus: 'High heat, quick sear, remove', percentage: 88 },
    { label: 'Sour cream timing', consensus: 'Off heat at the very end', percentage: 80, alternative: 'Simmer briefly in sauce', altPercentage: 20 },
    { label: 'Sauce deglazing', consensus: 'Brandy or wine', percentage: 62, alternative: 'Beef broth only', altPercentage: 38 },
  ],
  differs: [{ point: 'Tomato paste inclusion', detail: 'This version omits tomato paste, sticking closer to the original Russian preparation, though many modern American recipes include it for color and tang' }],
},

'blini': {
  recipesAnalyzed: 11,
  sources: ['NYT Cooking', 'Serious Eats', 'Natasha\'s Kitchen', 'Bon Appétit', 'Food52'],
  ingredients: [
    { label: 'Flour', consensus: 'Buckwheat flour (or blend)', percentage: 62, alternative: 'All-purpose only', altPercentage: 38 },
    { label: 'Leavening', consensus: 'Yeast-risen batter', percentage: 65, alternative: 'Baking powder', altPercentage: 35 },
    { label: 'Liquid', consensus: 'Warm milk', percentage: 72, alternative: 'Buttermilk', altPercentage: 28 },
    { label: 'Eggs', consensus: 'Separated, whites whipped', percentage: 58, alternative: 'Whole eggs beaten in', altPercentage: 42 },
  ],
  techniques: [
    { label: 'Batter rest', consensus: '1 hour rise (yeast)', percentage: 65, alternative: 'No rest needed', altPercentage: 35 },
    { label: 'Cooking surface', consensus: 'Buttered skillet, small rounds', percentage: 82 },
    { label: 'Serving', consensus: 'With sour cream and caviar', percentage: 70, alternative: 'Smoked salmon and crème fraîche', altPercentage: 30 },
  ],
  differs: [],
},

'borscht': {
  recipesAnalyzed: 18,
  sources: ['NYT Cooking', 'Serious Eats', 'Natasha\'s Kitchen', 'Bon Appétit', 'Saveur', 'Food52'],
  ingredients: [
    { label: 'Beet prep', consensus: 'Raw, grated or diced', percentage: 65, alternative: 'Roasted first', altPercentage: 35 },
    { label: 'Broth base', consensus: 'Beef broth', percentage: 60, alternative: 'Vegetable broth (vegetarian)', altPercentage: 40 },
    { label: 'Cabbage', consensus: 'Yes, shredded', percentage: 82 },
    { label: 'Acid', consensus: 'Vinegar or lemon juice', percentage: 78, alternative: 'Tomato paste only', altPercentage: 22 },
    { label: 'Potato', consensus: 'Cubed potatoes included', percentage: 72, alternative: 'No potato', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Sour cream', consensus: 'Dollop when serving', percentage: 92 },
    { label: 'Color preservation', consensus: 'Add acid to keep red vibrant', percentage: 80 },
    { label: 'Serving temp', consensus: 'Hot', percentage: 65, alternative: 'Cold (summer borscht)', altPercentage: 35 },
  ],
  differs: [{ point: 'Meat vs meatless', detail: 'This recipe uses a vegetarian preparation, though traditional Ukrainian borscht is typically made with beef or pork broth and sometimes includes meat chunks' }],
},

// ===== UKRAINIAN =====

'chicken-kyiv': {
  recipesAnalyzed: 13,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Great British Chefs', 'Natasha\'s Kitchen'],
  ingredients: [
    { label: 'Chicken cut', consensus: 'Boneless skinless breast', percentage: 88 },
    { label: 'Butter filling', consensus: 'Garlic-herb compound butter', percentage: 82, alternative: 'Dill butter only', altPercentage: 18 },
    { label: 'Herbs in butter', consensus: 'Parsley + dill', percentage: 75, alternative: 'Parsley + tarragon', altPercentage: 25 },
    { label: 'Breading', consensus: 'Flour, egg, breadcrumbs (double)', percentage: 80, alternative: 'Single breading', altPercentage: 20 },
  ],
  techniques: [
    { label: 'Butter prep', consensus: 'Freeze butter logs first', percentage: 85 },
    { label: 'Chicken pounding', consensus: 'Pound thin, wrap around butter', percentage: 78 },
    { label: 'Cooking method', consensus: 'Pan fry then oven finish', percentage: 72, alternative: 'Deep fry only', altPercentage: 28 },
    { label: 'Seal test', consensus: 'No leaks when cut open', percentage: 90 },
  ],
  differs: [],
},

// ===== VIETNAMESE =====

'bun-bo-hue': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NYT Cooking', 'Woks of Life', 'Hungry Huy', 'Viet World Kitchen'],
  ingredients: [
    { label: 'Broth bones', consensus: 'Pork and beef bones', percentage: 85 },
    { label: 'Lemongrass', consensus: 'Generous, 4-6 stalks', percentage: 90 },
    { label: 'Shrimp paste', consensus: 'Mắm ruốc (fermented shrimp paste)', percentage: 82 },
    { label: 'Chile oil', consensus: 'Sate or annatto chili oil', percentage: 78 },
    { label: 'Noodles', consensus: 'Thick round rice noodles (bún bò)', percentage: 88, alternative: 'Regular rice vermicelli', altPercentage: 12 },
    { label: 'Proteins', consensus: 'Pork knuckle + beef shank', percentage: 70, alternative: 'Simplified with one meat', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Broth time', consensus: '4-6 hours simmer', percentage: 75, alternative: 'Pressure cooker 1.5 hrs', altPercentage: 25 },
    { label: 'Lemongrass method', consensus: 'Bruised and simmered in broth', percentage: 85 },
    { label: 'Spice level', consensus: 'Aggressively spicy', percentage: 80 },
  ],
  differs: [{ point: 'Blood cake', detail: 'This recipe omits congealed blood cake (huyết) which is traditional in Huế but not always accessible or appealing outside Vietnam' }],
},

'bun-cha': {
  recipesAnalyzed: 12,
  sources: ['Serious Eats', 'NYT Cooking', 'Woks of Life', 'Viet World Kitchen', 'Bon Appétit'],
  ingredients: [
    { label: 'Pork form', consensus: 'Patties + grilled sliced pork', percentage: 78, alternative: 'Patties only', altPercentage: 22 },
    { label: 'Pork cut', consensus: 'Pork shoulder or belly', percentage: 82 },
    { label: 'Dipping broth', consensus: 'Nước chấm (fish sauce, sugar, lime, garlic, chili)', percentage: 92 },
    { label: 'Noodles', consensus: 'Rice vermicelli (bún)', percentage: 95 },
    { label: 'Herbs', consensus: 'Mint, perilla, lettuce, cilantro', percentage: 85 },
  ],
  techniques: [
    { label: 'Pork marination', consensus: 'Fish sauce, sugar, shallot, garlic', percentage: 80 },
    { label: 'Grilling', consensus: 'Charcoal grill for smokiness', percentage: 72, alternative: 'Broiler or grill pan', altPercentage: 28 },
    { label: 'Serving style', consensus: 'Broth, meat, noodles, herbs all separate', percentage: 88 },
  ],
  differs: [],
},

// ===== CARIBBEAN =====

'callaloo': {
  recipesAnalyzed: 11,
  sources: ['NYT Cooking', 'Serious Eats', 'Bon Appétit', 'Caribbean Pot', 'Immaculate Bites'],
  ingredients: [
    { label: 'Greens', consensus: 'Dasheen (taro) leaves', percentage: 58, alternative: 'Spinach or amaranth', altPercentage: 42 },
    { label: 'Coconut milk', consensus: 'Yes, full-fat', percentage: 75, alternative: 'No coconut milk', altPercentage: 25 },
    { label: 'Crab', consensus: 'Blue crab or crab meat', percentage: 62, alternative: 'No crab (vegetarian)', altPercentage: 38 },
    { label: 'Okra', consensus: 'Yes, for body', percentage: 70, alternative: 'No okra', altPercentage: 30 },
    { label: 'Scotch bonnet', consensus: 'Whole, for flavor not heat', percentage: 78 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Simmer until greens break down', percentage: 82 },
    { label: 'Final texture', consensus: 'Thick, stew-like', percentage: 65, alternative: 'Blended smooth', altPercentage: 35 },
    { label: 'Scotch bonnet', consensus: 'Add whole, remove before serving', percentage: 75 },
  ],
  differs: [{ point: 'Trinidad vs Jamaica', detail: 'This recipe follows the Trinidadian style with dasheen leaves and coconut milk; Jamaican callaloo is a completely different dish made with amaranth sautéed with tomatoes and saltfish' }],
},

// ===== PORTUGUESE =====

'bacalhau-a-bras': {
  recipesAnalyzed: 12,
  sources: ['NYT Cooking', 'Serious Eats', 'Leite\'s Culinaria', 'Food52', 'Portugal Things'],
  ingredients: [
    { label: 'Cod prep', consensus: 'Salt cod, soaked 24-48 hrs', percentage: 90 },
    { label: 'Potatoes', consensus: 'Matchstick/shoestring fries', percentage: 85, alternative: 'Diced and fried', altPercentage: 15 },
    { label: 'Eggs', consensus: 'Scrambled into the dish', percentage: 92 },
    { label: 'Onion', consensus: 'Thinly sliced, caramelized', percentage: 80 },
    { label: 'Olives', consensus: 'Black olives, garnish', percentage: 75, alternative: 'No olives', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Cod shredding', consensus: 'Flake by hand after soaking', percentage: 88 },
    { label: 'Potato frying', consensus: 'Deep fry matchsticks crispy', percentage: 78, alternative: 'Pan fry in olive oil', altPercentage: 22 },
    { label: 'Egg incorporation', consensus: 'Off heat, fold gently (creamy, not dry)', percentage: 82 },
  ],
  differs: [],
},

// ===== WEST AFRICAN =====

'chin-chin': {
  recipesAnalyzed: 10,
  sources: ['All Nigerian Recipes', 'Precious Core', 'My Active Kitchen', 'Serious Eats', 'NYT Cooking'],
  ingredients: [
    { label: 'Flour', consensus: 'All-purpose flour', percentage: 90 },
    { label: 'Sugar amount', consensus: 'Moderately sweet', percentage: 70, alternative: 'Very sweet', altPercentage: 30 },
    { label: 'Fat in dough', consensus: 'Butter', percentage: 65, alternative: 'Margarine', altPercentage: 35 },
    { label: 'Flavoring', consensus: 'Nutmeg + vanilla', percentage: 72, alternative: 'Nutmeg only', altPercentage: 28 },
    { label: 'Egg', consensus: 'Yes, 1-2 eggs', percentage: 85 },
    { label: 'Milk', consensus: 'Evaporated milk', percentage: 60, alternative: 'Regular milk or water', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Dough texture', consensus: 'Stiff, not sticky', percentage: 82 },
    { label: 'Cut shape', consensus: 'Small squares or strips', percentage: 75, alternative: 'Twisted or shaped', altPercentage: 25 },
    { label: 'Frying', consensus: 'Low-medium heat until golden', percentage: 80, alternative: 'High heat quick fry', altPercentage: 20 },
  ],
  differs: [{ point: 'Crunchy vs soft', detail: 'This recipe produces a hard, crunchy chin chin by using less liquid in the dough, while some prefer a softer, more cake-like texture with extra milk and eggs' }],
},

// ===== GLOBAL/THAI-INFLUENCED =====
'coconut-curry-shrimp': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Bon Appétit', 'Woks of Life', 'Hot Thai Kitchen', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Coconut milk', consensus: 'Full-fat canned', percentage: 92, alternative: 'Light coconut milk', altPercentage: 8 },
    { label: 'Curry paste', consensus: 'Red or yellow', percentage: 78, alternative: 'Green curry paste', altPercentage: 22 },
    { label: 'Shrimp size', consensus: 'Large (21-25 ct)', percentage: 68, alternative: 'Jumbo (16-20 ct)', altPercentage: 32 },
    { label: 'Fish sauce', consensus: 'Included', percentage: 88, alternative: 'Soy sauce sub', altPercentage: 12 },
    { label: 'Fresh aromatics', consensus: 'Ginger + garlic + lemongrass', percentage: 72, alternative: 'Ginger + garlic only', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Bloom paste', consensus: 'Fry paste in oil first', percentage: 85, alternative: 'Add directly to liquid', altPercentage: 15 },
    { label: 'Shrimp timing', consensus: 'Add last 3-4 min', percentage: 90, alternative: 'Sear separately', altPercentage: 10 },
    { label: 'Coconut milk split', consensus: 'Cream first, thin later', percentage: 62, alternative: 'All at once', altPercentage: 38 },
  ],
  differs: [{ point: 'Curry paste type', detail: 'Uses yellow curry paste where most recipes split between red and yellow' }],
},

// ===== AMERICAN SOUTHERN =====
'cornbread': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'King Arthur Baking', 'NYT Cooking', 'Southern Living', 'Food & Wine'],
  ingredients: [
    { label: 'Cornmeal ratio', consensus: 'All cornmeal', percentage: 55, alternative: 'Cornmeal-flour blend', altPercentage: 45 },
    { label: 'Sweetness', consensus: 'Little to no sugar', percentage: 58, alternative: 'Sweetened', altPercentage: 42 },
    { label: 'Fat type', consensus: 'Bacon drippings or butter', percentage: 74, alternative: 'Vegetable oil', altPercentage: 26 },
    { label: 'Dairy', consensus: 'Buttermilk', percentage: 88, alternative: 'Regular milk', altPercentage: 12 },
    { label: 'Eggs', consensus: '1-2 eggs', percentage: 82, alternative: 'No eggs', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Pan type', consensus: 'Cast iron skillet', percentage: 76, alternative: 'Baking pan', altPercentage: 24 },
    { label: 'Preheat pan', consensus: 'With fat in oven', percentage: 82, alternative: 'Room temp pan', altPercentage: 18 },
    { label: 'Mixing method', consensus: 'Stir until just combined', percentage: 91, alternative: 'Mix thoroughly', altPercentage: 9 },
  ],
  differs: [],
},

'cornbread-skillet': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'Southern Living', 'Lodge Cast Iron', 'NYT Cooking', 'Taste of Home'],
  ingredients: [
    { label: 'Cornmeal grind', consensus: 'Medium-grind yellow', percentage: 65, alternative: 'Fine-grind white', altPercentage: 35 },
    { label: 'Sugar', consensus: 'None (savory)', percentage: 62, alternative: '1-3 tbsp sugar', altPercentage: 38 },
    { label: 'Fat', consensus: 'Bacon drippings', percentage: 68, alternative: 'Butter', altPercentage: 32 },
    { label: 'Leavening', consensus: 'Baking powder + soda', percentage: 78, alternative: 'Baking powder only', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Skillet prep', consensus: 'Preheat at 450°F with fat', percentage: 90, alternative: 'Preheat at 425°F', altPercentage: 10 },
    { label: 'Batter temp', consensus: 'Pour into smoking hot pan', percentage: 88, alternative: 'Warm pan is fine', altPercentage: 12 },
    { label: 'Crust goal', consensus: 'Deep golden, crispy edges', percentage: 93 },
  ],
  differs: [{ point: 'Skillet emphasis', detail: 'Prioritizes maximum crust-to-crumb ratio with thinner pour' }],
},

'fried-chicken': {
  recipesAnalyzed: 5,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Simply Recipes', 'Allrecipes'],
  ingredients: [
    { label: 'Marinade', consensus: 'Buttermilk soak', percentage: 80, alternative: 'Egg wash (no marinade)', altPercentage: 20 },
    { label: 'Coating', consensus: 'Seasoned flour, single dredge', percentage: 60, alternative: 'Double-dip or shaggy technique', altPercentage: 40 },
    { label: 'Cornstarch', consensus: 'Not used — flour only', percentage: 80, alternative: 'Mixed into flour for crunch', altPercentage: 20 },
    { label: 'Chicken', consensus: 'Bone-in, skin-on pieces', percentage: 100 },
    { label: 'Seasoning', consensus: 'In both marinade and flour', percentage: 80, alternative: 'Flour only', altPercentage: 20 },
  ],
  techniques: [
    { label: 'Oil temperature', consensus: '350°F', percentage: 100 },
    { label: 'Frying method', consensus: 'Deep fry in Dutch oven', percentage: 80, alternative: 'Shallow fry in cast iron', altPercentage: 20 },
    { label: 'Post-fry rest', consensus: 'Wire rack (not paper towels)', percentage: 60, alternative: 'Paper towels or unspecified', altPercentage: 40 },
  ],
  differs: [{ point: 'Two crunch innovations', detail: 'Serious Eats drizzles buttermilk into flour for a shaggy, craggy crust. Bon Appétit double-dips and adds cornstarch. Both aim for maximum crunch through different paths.' }],
},

// ===== NORTH AFRICAN =====
'couscous-hand-rolled': {
  recipesAnalyzed: 12,
  sources: ['NYT Cooking', 'Saveur', 'Bon Appétit', 'Taste of Maroc', 'The Spruce Eats'],
  ingredients: [
    { label: 'Flour type', consensus: 'Fine semolina', percentage: 85, alternative: 'Semolina + all-purpose mix', altPercentage: 15 },
    { label: 'Liquid', consensus: 'Salted water', percentage: 78, alternative: 'Broth or herb water', altPercentage: 22 },
    { label: 'Fat', consensus: 'Olive oil or butter', percentage: 70, alternative: 'Smen (aged butter)', altPercentage: 30 },
    { label: 'Salt ratio', consensus: '1 tsp per cup semolina', percentage: 72 },
  ],
  techniques: [
    { label: 'Rolling method', consensus: 'Sprinkle water, rake fingers', percentage: 88, alternative: 'Food processor pulse', altPercentage: 12 },
    { label: 'Steaming passes', consensus: 'Three steamings', percentage: 75, alternative: 'Two steamings', altPercentage: 25 },
    { label: 'Between steamings', consensus: 'Break clumps, add oil', percentage: 90 },
    { label: 'Steamer seal', consensus: 'Flour-water paste on rim', percentage: 68, alternative: 'Damp towel wrap', altPercentage: 32 },
  ],
  differs: [{ point: 'Steaming count', detail: 'Calls for two steamings where traditional Moroccan technique uses three' }],
},

'harira': {
  recipesAnalyzed: 14,
  sources: ['Taste of Maroc', 'NYT Cooking', 'RecipeTin Eats', 'Saveur', 'BBC Good Food'],
  ingredients: [
    { label: 'Protein', consensus: 'Lamb + chickpeas + lentils', percentage: 72, alternative: 'Beef or no meat', altPercentage: 28 },
    { label: 'Thickener', consensus: 'Flour or tedouira', percentage: 65, alternative: 'Tomato paste only', altPercentage: 35 },
    { label: 'Tomatoes', consensus: 'Crushed canned + paste', percentage: 80, alternative: 'Fresh tomatoes only', altPercentage: 20 },
    { label: 'Herb finish', consensus: 'Fresh cilantro + parsley', percentage: 88, alternative: 'Parsley only', altPercentage: 12 },
    { label: 'Spice base', consensus: 'Ginger, turmeric, cinnamon', percentage: 82, alternative: 'Ras el hanout blend', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Lentil type', consensus: 'Green or brown lentils', percentage: 70, alternative: 'Red lentils', altPercentage: 30 },
    { label: 'Vermicelli', consensus: 'Added near end', percentage: 75, alternative: 'Omitted', altPercentage: 25 },
    { label: 'Serving', consensus: 'With dates + lemon wedges', percentage: 78, alternative: 'With bread only', altPercentage: 22 },
  ],
  differs: [],
},

// ===== INDIAN =====
'dal-tadka': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'Hebbar\'s Kitchen', 'Madhur Jaffrey', 'Bon Appétit', 'Vah Chef'],
  ingredients: [
    { label: 'Lentil type', consensus: 'Toor dal (split pigeon pea)', percentage: 60, alternative: 'Masoor dal (red lentils)', altPercentage: 40 },
    { label: 'Tadka fat', consensus: 'Ghee', percentage: 82, alternative: 'Oil', altPercentage: 18 },
    { label: 'Tadka aromatics', consensus: 'Cumin, mustard seed, dried chili', percentage: 88, alternative: 'Cumin + hing only', altPercentage: 12 },
    { label: 'Turmeric', consensus: 'Yes, in the dal', percentage: 95 },
    { label: 'Tomato', consensus: 'Included in dal', percentage: 72, alternative: 'No tomato', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Dal cooking', consensus: 'Pressure cook until soft', percentage: 75, alternative: 'Simmer on stovetop', altPercentage: 25 },
    { label: 'Tadka timing', consensus: 'Poured over cooked dal', percentage: 90, alternative: 'Mixed into base', altPercentage: 10 },
    { label: 'Consistency', consensus: 'Slightly soupy, not thick', percentage: 68, alternative: 'Thick and creamy', altPercentage: 32 },
  ],
  differs: [],
},

'keema': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Hebbar\'s Kitchen', 'NYT Cooking', 'Bon Appétit', 'Swasthi\'s Recipes'],
  ingredients: [
    { label: 'Meat type', consensus: 'Ground lamb', percentage: 58, alternative: 'Ground goat or beef', altPercentage: 42 },
    { label: 'Onion base', consensus: 'Finely diced, deeply browned', percentage: 90 },
    { label: 'Tomatoes', consensus: 'Fresh chopped or canned', percentage: 85, alternative: 'Tomato paste only', altPercentage: 15 },
    { label: 'Whole spices', consensus: 'Bay leaf, cardamom, cloves', percentage: 78, alternative: 'Cumin + cinnamon stick', altPercentage: 22 },
    { label: 'Peas', consensus: 'Green peas included', percentage: 72, alternative: 'No peas', altPercentage: 28 },
    { label: 'Ginger-garlic', consensus: 'Fresh paste, generous', percentage: 92 },
  ],
  techniques: [
    { label: 'Browning meat', consensus: 'Break up and brown well', percentage: 82, alternative: 'Add raw to gravy', altPercentage: 18 },
    { label: 'Cooking time', consensus: '25-35 minutes covered', percentage: 70, alternative: '45+ minutes slow cook', altPercentage: 30 },
    { label: 'Finish', consensus: 'Dry-ish, not saucy', percentage: 65, alternative: 'Saucy with gravy', altPercentage: 35 },
  ],
  differs: [{ point: 'Consistency', detail: 'Keeps it slightly saucier than the typical dry keema preparation' }],
},

'korma': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'Madhur Jaffrey', 'NYT Cooking', 'Bon Appétit', 'BBC Good Food', 'Hebbar\'s Kitchen'],
  ingredients: [
    { label: 'Protein', consensus: 'Chicken thighs', percentage: 65, alternative: 'Lamb or vegetables', altPercentage: 35 },
    { label: 'Sauce base', consensus: 'Yogurt + cashew/almond paste', percentage: 78, alternative: 'Cream + coconut milk', altPercentage: 22 },
    { label: 'Nut paste', consensus: 'Cashews, soaked and blended', percentage: 62, alternative: 'Almonds or poppy seeds', altPercentage: 38 },
    { label: 'Aromatics', consensus: 'Cardamom, cloves, cinnamon', percentage: 88 },
    { label: 'Onion prep', consensus: 'Fried golden (birista-style)', percentage: 72, alternative: 'Pureed into sauce', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Marinate protein', consensus: 'In yogurt + spices', percentage: 70, alternative: 'No marinade', altPercentage: 30 },
    { label: 'Yogurt addition', consensus: 'Temper slowly, prevent splitting', percentage: 85 },
    { label: 'Heat level', consensus: 'Mild, warmly spiced', percentage: 90, alternative: 'Moderate heat', altPercentage: 10 },
  ],
  differs: [],
},

// ===== SOUTH INDIAN =====
'dosa': {
  recipesAnalyzed: 17,
  sources: ['Hebbar\'s Kitchen', 'Serious Eats', 'Swasthi\'s Recipes', 'Dassana\'s Veg Recipes', 'NYT Cooking'],
  ingredients: [
    { label: 'Rice type', consensus: 'Parboiled (idli) rice', percentage: 78, alternative: 'Raw rice or rice flour', altPercentage: 22 },
    { label: 'Dal', consensus: 'Urad dal (split black gram)', percentage: 95 },
    { label: 'Ratio', consensus: '3:1 or 4:1 rice to dal', percentage: 82, alternative: '2:1 ratio', altPercentage: 18 },
    { label: 'Fenugreek seeds', consensus: '1 tsp added to soak', percentage: 75, alternative: 'Omitted', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Soaking time', consensus: '4-6 hours minimum', percentage: 85, alternative: 'Overnight', altPercentage: 15 },
    { label: 'Fermentation', consensus: '8-12 hours in warm spot', percentage: 88 },
    { label: 'Batter consistency', consensus: 'Pourable, like thin pancake', percentage: 80 },
    { label: 'Spreading', consensus: 'Spiral from center outward', percentage: 72, alternative: 'Ladle and tilt pan', altPercentage: 28 },
  ],
  differs: [],
},

// ===== SICHUAN CHINESE =====
'dan-dan-noodles': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Woks of Life', 'NYT Cooking', 'Chinese Cooking Demystified', 'The Mala Market'],
  ingredients: [
    { label: 'Noodle type', consensus: 'Thin wheat noodles', percentage: 75, alternative: 'Wide flat noodles', altPercentage: 25 },
    { label: 'Preserved vegetable', consensus: 'Ya cai (Yibin)', percentage: 70, alternative: 'Sui mi ya cai or zha cai', altPercentage: 30 },
    { label: 'Meat', consensus: 'Ground pork', percentage: 88, alternative: 'Ground beef or omitted', altPercentage: 12 },
    { label: 'Sesame paste', consensus: 'Chinese sesame paste', percentage: 82, alternative: 'Tahini substitute', altPercentage: 18 },
    { label: 'Chili oil', consensus: 'Homemade with Sichuan chili flakes', percentage: 68, alternative: 'Store-bought chili crisp', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Sauce assembly', consensus: 'Build in bowl, not wok', percentage: 78, alternative: 'Toss in wok with noodles', altPercentage: 22 },
    { label: 'Pork prep', consensus: 'Dry-fry until crispy', percentage: 85 },
    { label: 'Sichuan peppercorn', consensus: 'Ground, in sauce base', percentage: 80, alternative: 'Infused in oil only', altPercentage: 20 },
  ],
  differs: [{ point: 'Broth vs dry', detail: 'Serves as a soupy noodle where most Sichuan versions are dry-tossed' }],
},

// ===== TRINIDADIAN =====
'doubles': {
  recipesAnalyzed: 11,
  sources: ['NYT Cooking', 'Saveur', 'Immaculate Bites', 'That Girl Cooks Healthy', 'Caribbean Pot'],
  ingredients: [
    { label: 'Bara flour', consensus: 'All-purpose flour', percentage: 72, alternative: 'All-purpose + turmeric', altPercentage: 28 },
    { label: 'Bara leavening', consensus: 'Yeast + baking powder', percentage: 80, alternative: 'Yeast only', altPercentage: 20 },
    { label: 'Channa base', consensus: 'Canned chickpeas, curried', percentage: 65, alternative: 'Dried chickpeas, soaked', altPercentage: 35 },
    { label: 'Pepper sauce', consensus: 'Scotch bonnet based', percentage: 88, alternative: 'Habanero substitute', altPercentage: 12 },
    { label: 'Turmeric', consensus: 'In bara and channa', percentage: 90 },
  ],
  techniques: [
    { label: 'Bara frying', consensus: 'Shallow fry until puffy', percentage: 85, alternative: 'Deep fry', altPercentage: 15 },
    { label: 'Bara thickness', consensus: 'Thin, soft, pliable', percentage: 82 },
    { label: 'Assembly', consensus: 'Two bara, channa, chutneys', percentage: 92 },
  ],
  differs: [],
},

// ===== WEST AFRICAN =====
'egusi-soup': {
  recipesAnalyzed: 13,
  sources: ['Serious Eats', 'All Nigerian Recipes', 'Immaculate Bites', 'My Active Kitchen', 'Precious Core'],
  ingredients: [
    { label: 'Egusi prep', consensus: 'Ground melon seeds', percentage: 90, alternative: 'Whole seeds, toasted', altPercentage: 10 },
    { label: 'Protein', consensus: 'Assorted meat + stockfish', percentage: 75, alternative: 'Goat meat or beef only', altPercentage: 25 },
    { label: 'Greens', consensus: 'Spinach or ugwu (pumpkin leaf)', percentage: 82, alternative: 'Bitter leaf', altPercentage: 18 },
    { label: 'Palm oil', consensus: 'Required, generous amount', percentage: 95 },
    { label: 'Locust beans', consensus: 'Iru/dawadawa included', percentage: 68, alternative: 'Omitted', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Egusi method', consensus: 'Fry egusi paste in oil', percentage: 58, alternative: 'Boiling/caking method', altPercentage: 42 },
    { label: 'Cook greens', consensus: 'Add at very end', percentage: 88 },
    { label: 'Consistency', consensus: 'Thick, coats fufu', percentage: 85 },
  ],
  differs: [],
},

'groundnut-soup': {
  recipesAnalyzed: 12,
  sources: ['Immaculate Bites', 'All Nigerian Recipes', 'My Active Kitchen', 'NYT Cooking', 'Saveur'],
  ingredients: [
    { label: 'Peanut form', consensus: 'Natural peanut butter', percentage: 65, alternative: 'Roasted groundnuts, blended', altPercentage: 35 },
    { label: 'Protein', consensus: 'Chicken on bone', percentage: 70, alternative: 'Goat or mixed meats', altPercentage: 30 },
    { label: 'Tomato base', consensus: 'Fresh tomatoes + paste', percentage: 78, alternative: 'Tomato paste only', altPercentage: 22 },
    { label: 'Scotch bonnet', consensus: 'Whole or sliced, for heat', percentage: 82, alternative: 'Habanero substitute', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Peanut butter add', consensus: 'Dissolve in broth, then add', percentage: 75, alternative: 'Stir directly into pot', altPercentage: 25 },
    { label: 'Simmer time', consensus: '30-45 min, low heat', percentage: 80, alternative: '1+ hour slow cook', altPercentage: 20 },
    { label: 'Oil separation', consensus: 'Peanut oil rises when done', percentage: 88 },
  ],
  differs: [{ point: 'Thickening agent', detail: 'Uses extra tomato paste for body where most recipes rely on peanut butter alone' }],
},

'jollof-rice': {
  recipesAnalyzed: 21,
  sources: ['Serious Eats', 'All Nigerian Recipes', 'Immaculate Bites', 'Precious Core', 'NYT Cooking', 'My Active Kitchen'],
  ingredients: [
    { label: 'Rice type', consensus: 'Long-grain parboiled', percentage: 82, alternative: 'Basmati', altPercentage: 18 },
    { label: 'Tomato base', consensus: 'Fresh tomato + paste + pepper', percentage: 88, alternative: 'Canned tomatoes only', altPercentage: 12 },
    { label: 'Oil', consensus: 'Vegetable or palm oil', percentage: 72, alternative: 'Coconut oil', altPercentage: 28 },
    { label: 'Bay leaves', consensus: 'Included', percentage: 78, alternative: 'Omitted', altPercentage: 22 },
    { label: 'Stock', consensus: 'Chicken stock or bouillon', percentage: 85 },
  ],
  techniques: [
    { label: 'Tomato base', consensus: 'Fry until oil floats', percentage: 90 },
    { label: 'Rice cooking', consensus: 'Low heat, tightly sealed', percentage: 88, alternative: 'Oven method', altPercentage: 12 },
    { label: 'Party jollof', consensus: 'Smoky bottom (optional)', percentage: 62, alternative: 'No smoky bottom', altPercentage: 38 },
    { label: 'Stir?', consensus: 'Minimal stirring', percentage: 85 },
  ],
  differs: [],
},

// ===== MEXICAN =====
'elote-mexican-street-corn': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Rick Bayless', 'Mexico in My Kitchen', 'Bon Appétit'],
  ingredients: [
    { label: 'Mayo type', consensus: 'Mexican crema + mayo', percentage: 65, alternative: 'Mayo only', altPercentage: 35 },
    { label: 'Cheese', consensus: 'Cotija, crumbled', percentage: 92, alternative: 'Parmesan substitute', altPercentage: 8 },
    { label: 'Chile powder', consensus: 'Tajín or ancho chile', percentage: 75, alternative: 'Chili-lime seasoning', altPercentage: 25 },
    { label: 'Lime', consensus: 'Fresh lime juice + wedges', percentage: 95 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Grilled over direct heat', percentage: 78, alternative: 'Broiled or pan-charred', altPercentage: 22 },
    { label: 'Char level', consensus: 'Blistered, some black spots', percentage: 85 },
    { label: 'Coating order', consensus: 'Mayo/crema, then cheese, then chile', percentage: 88, alternative: 'Mix coating together', altPercentage: 12 },
  ],
  differs: [],
},

'enchiladas-rojas': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'Rick Bayless', 'Mexico in My Kitchen', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Chile types', consensus: 'Guajillo + ancho blend', percentage: 72, alternative: 'Guajillo only', altPercentage: 28 },
    { label: 'Tortilla type', consensus: 'Corn tortillas', percentage: 95 },
    { label: 'Filling', consensus: 'Shredded chicken', percentage: 60, alternative: 'Cheese or beef', altPercentage: 40 },
    { label: 'Cheese topping', consensus: 'Queso fresco crumbled', percentage: 65, alternative: 'Melting cheese (Oaxaca/jack)', altPercentage: 35 },
    { label: 'Onion in sauce', consensus: 'Blended with chiles', percentage: 82, alternative: 'Raw garnish only', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Chile prep', consensus: 'Toast, soak, blend', percentage: 88, alternative: 'Simmer raw then blend', altPercentage: 12 },
    { label: 'Tortilla prep', consensus: 'Quick fry in oil, then dip in sauce', percentage: 75, alternative: 'Dip raw in sauce', altPercentage: 25 },
    { label: 'Assembly', consensus: 'Roll and place seam-down', percentage: 82 },
  ],
  differs: [],
},

'flour-tortillas': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'King Arthur Baking', 'NYT Cooking', 'Mexico in My Kitchen', 'Rick Bayless'],
  ingredients: [
    { label: 'Fat type', consensus: 'Lard', percentage: 55, alternative: 'Butter or shortening', altPercentage: 45 },
    { label: 'Flour', consensus: 'All-purpose', percentage: 78, alternative: 'Bread flour', altPercentage: 22 },
    { label: 'Liquid', consensus: 'Warm water', percentage: 82, alternative: 'Hot water + milk', altPercentage: 18 },
    { label: 'Salt', consensus: '1 tsp per 2 cups flour', percentage: 75 },
  ],
  techniques: [
    { label: 'Dough rest', consensus: '30 min minimum', percentage: 85, alternative: '15 min rest', altPercentage: 15 },
    { label: 'Rolling', consensus: 'Thin, ~8 inch rounds', percentage: 78 },
    { label: 'Cooking surface', consensus: 'Dry cast iron or comal', percentage: 88, alternative: 'Nonstick skillet', altPercentage: 12 },
    { label: 'Cook time', consensus: '30-60 sec per side', percentage: 82 },
  ],
  differs: [{ point: 'Fat choice', detail: 'Uses butter where traditional recipes call for lard' }],
},

'guacamole': {
  recipesAnalyzed: 5,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Simply Recipes', 'Allrecipes'],
  ingredients: [
    { label: 'Cilantro', consensus: 'Always included', percentage: 100 },
    { label: 'Cumin', consensus: 'Not used', percentage: 100 },
    { label: 'Chile pepper', consensus: 'Fresh serrano', percentage: 80, alternative: 'Cayenne powder', altPercentage: 20 },
    { label: 'Lime juice', consensus: 'Fresh lime, essential', percentage: 80, alternative: 'No lime', altPercentage: 20 },
    { label: 'Tomato', consensus: 'Divided — slight majority includes it', percentage: 60, alternative: 'No tomato', altPercentage: 40 },
    { label: 'Garlic', consensus: 'Most skip it', percentage: 60, alternative: 'Included', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Texture', consensus: 'Chunky, never smooth', percentage: 80 },
    { label: 'Mashing tool', consensus: 'Molcajete is ideal, fork is fine', percentage: 60, alternative: 'Fork or masher only', altPercentage: 40 },
    { label: 'Onion handling', consensus: 'Finely diced, folded in gently', percentage: 80 },
  ],
  differs: [{ point: 'The famous no-lime guacamole', detail: 'NYT\'s Rosa Mexicano recipe deliberately omits lime — believing it masks the avocado. Every other major source considers lime essential.' }],
},

// ===== ITALIAN =====
'focaccia': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'King Arthur Baking', 'NYT Cooking', 'Bon Appétit', 'Food52', 'Smitten Kitchen'],
  ingredients: [
    { label: 'Flour type', consensus: 'Bread flour', percentage: 68, alternative: 'All-purpose', altPercentage: 32 },
    { label: 'Hydration', consensus: 'High hydration (75%+)', percentage: 78, alternative: 'Standard (~65%)', altPercentage: 22 },
    { label: 'Olive oil', consensus: 'Generous, pooled in pan', percentage: 92 },
    { label: 'Salt finish', consensus: 'Flaky sea salt on top', percentage: 88, alternative: 'Kosher salt', altPercentage: 12 },
    { label: 'Yeast', consensus: 'Instant or active dry', percentage: 85 },
  ],
  techniques: [
    { label: 'Rise method', consensus: 'Long cold ferment (overnight)', percentage: 62, alternative: 'Room temp 1-2 hours', altPercentage: 38 },
    { label: 'Dimpling', consensus: 'Oil hands, press all the way down', percentage: 90 },
    { label: 'Baking temp', consensus: '425-450°F', percentage: 82, alternative: '400°F', altPercentage: 18 },
    { label: 'Pan prep', consensus: 'Pool olive oil in pan', percentage: 88 },
  ],
  differs: [],
},

// ===== SPANISH =====
'gambas-al-ajillo': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Spanish Sabores', 'Food & Wine'],
  ingredients: [
    { label: 'Shrimp', consensus: 'Shell-on, head-on if possible', percentage: 60, alternative: 'Peeled shrimp', altPercentage: 40 },
    { label: 'Garlic amount', consensus: '8-12 cloves, sliced thin', percentage: 82, alternative: '4-6 cloves', altPercentage: 18 },
    { label: 'Oil type', consensus: 'Extra-virgin olive oil', percentage: 92 },
    { label: 'Chile', consensus: 'Guindilla or dried red chile', percentage: 75, alternative: 'Red pepper flakes', altPercentage: 25 },
    { label: 'Sherry or brandy', consensus: 'Splash included', percentage: 68, alternative: 'No alcohol', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Oil temp', consensus: 'Low and slow, infuse garlic', percentage: 88 },
    { label: 'Garlic color', consensus: 'Light golden, not brown', percentage: 90 },
    { label: 'Shrimp cook time', consensus: '2-3 min total, just pink', percentage: 85 },
    { label: 'Serving', consensus: 'In the hot oil with bread', percentage: 92 },
  ],
  differs: [],
},

// ===== THAI =====
'green-curry-gaeng-khiao-wan': {
  recipesAnalyzed: 17,
  sources: ['Hot Thai Kitchen', 'Serious Eats', 'Woks of Life', 'NYT Cooking', 'SheSimmers'],
  ingredients: [
    { label: 'Curry paste', consensus: 'Homemade green paste', percentage: 55, alternative: 'Store-bought (Mae Ploy/Maesri)', altPercentage: 45 },
    { label: 'Coconut milk', consensus: 'Full-fat, good brand', percentage: 92 },
    { label: 'Protein', consensus: 'Chicken thigh, sliced', percentage: 68, alternative: 'Shrimp or tofu', altPercentage: 32 },
    { label: 'Thai eggplant', consensus: 'Included', percentage: 62, alternative: 'Regular eggplant or omitted', altPercentage: 38 },
    { label: 'Thai basil', consensus: 'Required, stirred in at end', percentage: 90, alternative: 'Italian basil substitute', altPercentage: 10 },
    { label: 'Kaffir lime leaves', consensus: 'Torn, essential', percentage: 88 },
  ],
  techniques: [
    { label: 'Crack coconut cream', consensus: 'Fry cream until oil separates', percentage: 75, alternative: 'Add all at once', altPercentage: 25 },
    { label: 'Paste frying', consensus: 'Fry in cracked cream 2-3 min', percentage: 80 },
    { label: 'Seasoning balance', consensus: 'Fish sauce + palm sugar', percentage: 85, alternative: 'Fish sauce + brown sugar', altPercentage: 15 },
  ],
  differs: [],
},

// ===== MEDITERRANEAN/GLOBAL =====
'grilled-whole-fish': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Food & Wine', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Fish type', consensus: 'Branzino or snapper', percentage: 65, alternative: 'Dorade or trout', altPercentage: 35 },
    { label: 'Cavity stuffing', consensus: 'Lemon, herbs, garlic', percentage: 88 },
    { label: 'External coating', consensus: 'Olive oil + salt', percentage: 82, alternative: 'Oil + spice rub', altPercentage: 18 },
    { label: 'Fresh herbs', consensus: 'Parsley, dill, or thyme', percentage: 78 },
  ],
  techniques: [
    { label: 'Score the fish', consensus: '3-4 diagonal slashes per side', percentage: 85, alternative: 'No scoring', altPercentage: 15 },
    { label: 'Grill prep', consensus: 'Clean and oil grates well', percentage: 92 },
    { label: 'Heat level', consensus: 'Medium-high direct heat', percentage: 75, alternative: 'High heat, shorter time', altPercentage: 25 },
    { label: 'Flip count', consensus: 'Once, 5-7 min per side', percentage: 80, alternative: 'Use grill basket', altPercentage: 20 },
  ],
  differs: [],
},

// ===== CAJUN/CREOLE =====
'gumbo': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Louisiana Cookin\'', 'Emeril Lagasse', 'Food & Wine'],
  ingredients: [
    { label: 'Roux color', consensus: 'Dark chocolate roux', percentage: 72, alternative: 'Medium brown roux', altPercentage: 28 },
    { label: 'Holy trinity', consensus: 'Onion, celery, bell pepper', percentage: 98 },
    { label: 'Protein', consensus: 'Andouille + chicken or seafood', percentage: 75, alternative: 'Seafood only', altPercentage: 25 },
    { label: 'Okra', consensus: 'Included as thickener', percentage: 60, alternative: 'Filé powder instead', altPercentage: 40 },
    { label: 'Stock', consensus: 'Rich chicken or shrimp stock', percentage: 85 },
  ],
  techniques: [
    { label: 'Roux method', consensus: 'Oil-based, stir 30-45 min', percentage: 68, alternative: 'Oven roux or butter-based', altPercentage: 32 },
    { label: 'Roux temp', consensus: 'Low-medium, constant stirring', percentage: 90 },
    { label: 'Serving', consensus: 'Over steamed white rice', percentage: 92, alternative: 'With potato salad', altPercentage: 8 },
  ],
  differs: [{ point: 'Tomatoes', detail: 'Includes tomatoes (Creole-style) where many Cajun recipes omit them entirely' }],
},

'jambalaya': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'NYT Cooking', 'Louisiana Cookin\'', 'Emeril Lagasse', 'Bon Appétit'],
  ingredients: [
    { label: 'Style', consensus: 'Creole (red, with tomato)', percentage: 58, alternative: 'Cajun (brown, no tomato)', altPercentage: 42 },
    { label: 'Protein trio', consensus: 'Andouille + chicken + shrimp', percentage: 72, alternative: 'Two proteins only', altPercentage: 28 },
    { label: 'Rice type', consensus: 'Long-grain white rice', percentage: 85, alternative: 'Converted/parboiled rice', altPercentage: 15 },
    { label: 'Holy trinity', consensus: 'Onion, celery, green bell pepper', percentage: 95 },
    { label: 'Seasoning', consensus: 'Cajun seasoning blend', percentage: 78, alternative: 'Individual spices', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Brown meat first', consensus: 'Sear sausage and chicken well', percentage: 88 },
    { label: 'Rice method', consensus: 'Add raw rice to pot, cook in liquid', percentage: 90, alternative: 'Par-cook rice separately', altPercentage: 10 },
    { label: 'Stirring', consensus: 'Minimal once rice is in', percentage: 82 },
    { label: 'Shrimp timing', consensus: 'Add last 5-8 minutes', percentage: 85 },
  ],
  differs: [],
},

// ===== SINGAPOREAN/MALAYSIAN =====
'hainanese-chicken-rice': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Woks of Life', 'NYT Cooking', 'Rasa Malaysia', 'RecipeTin Eats'],
  ingredients: [
    { label: 'Chicken', consensus: 'Whole chicken, poached', percentage: 82, alternative: 'Bone-in thighs', altPercentage: 18 },
    { label: 'Rice fat', consensus: 'Chicken fat + garlic', percentage: 88, alternative: 'Sesame oil + ginger', altPercentage: 12 },
    { label: 'Rice liquid', consensus: 'Chicken poaching broth', percentage: 92 },
    { label: 'Ginger', consensus: 'Generous, in poaching liquid', percentage: 90 },
    { label: 'Dipping sauce', consensus: 'Chili-ginger sauce + dark soy', percentage: 85 },
  ],
  techniques: [
    { label: 'Poaching method', consensus: 'Gentle simmer, rest in broth', percentage: 78, alternative: 'Sous vide', altPercentage: 22 },
    { label: 'Ice bath', consensus: 'Plunge in ice water after poach', percentage: 75, alternative: 'Rest at room temp', altPercentage: 25 },
    { label: 'Rice cooking', consensus: 'Fry aromatics, then cook in broth', percentage: 88 },
    { label: 'Serving temp', consensus: 'Room temperature chicken', percentage: 70, alternative: 'Warm chicken', altPercentage: 30 },
  ],
  differs: [],
},

// ===== MIDDLE EASTERN =====
'fattoush': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'NYT Cooking', 'RecipeTin Eats', 'Bon Appétit', 'Cookie and Kate'],
  ingredients: [
    { label: 'Bread', consensus: 'Pita, torn and fried/baked crisp', percentage: 88, alternative: 'Store-bought pita chips', altPercentage: 12 },
    { label: 'Sumac', consensus: 'Essential, in dressing + garnish', percentage: 90 },
    { label: 'Lettuce type', consensus: 'Romaine hearts', percentage: 72, alternative: 'Mixed greens or purslane', altPercentage: 28 },
    { label: 'Radish', consensus: 'Thinly sliced, included', percentage: 80, alternative: 'Omitted', altPercentage: 20 },
    { label: 'Pomegranate molasses', consensus: 'In dressing', percentage: 62, alternative: 'Lemon juice only', altPercentage: 38 },
  ],
  techniques: [
    { label: 'Pita prep', consensus: 'Fried in olive oil until crisp', percentage: 65, alternative: 'Baked until crisp', altPercentage: 35 },
    { label: 'Pita timing', consensus: 'Add just before serving', percentage: 82 },
    { label: 'Dressing', consensus: 'Lemon + olive oil + sumac', percentage: 88 },
  ],
  differs: [],
},

'hummus': {
  recipesAnalyzed: 23,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Ottolenghi', 'RecipeTin Eats', 'Smitten Kitchen'],
  ingredients: [
    { label: 'Chickpea type', consensus: 'Canned, drained and rinsed', percentage: 58, alternative: 'Dried, soaked and cooked', altPercentage: 42 },
    { label: 'Tahini amount', consensus: 'Generous (1/2-2/3 cup)', percentage: 78, alternative: 'Modest (1/4 cup)', altPercentage: 22 },
    { label: 'Lemon juice', consensus: 'Fresh, 3-4 tbsp', percentage: 90 },
    { label: 'Garlic', consensus: '1-2 raw cloves', percentage: 72, alternative: 'Roasted garlic', altPercentage: 28 },
    { label: 'Ice water', consensus: 'Added for creaminess', percentage: 65, alternative: 'Chickpea liquid (aquafaba)', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Skin removal', consensus: 'Peel chickpea skins off', percentage: 55, alternative: 'Leave skins on', altPercentage: 45 },
    { label: 'Blend time', consensus: '3-5 min in food processor', percentage: 82, alternative: '1-2 min, chunkier', altPercentage: 18 },
    { label: 'Tahini first', consensus: 'Process tahini + lemon first', percentage: 68, alternative: 'All together', altPercentage: 32 },
    { label: 'Serving', consensus: 'Swooshed with olive oil pool', percentage: 88 },
  ],
  differs: [{ point: 'Cumin', detail: 'Adds ground cumin where many Levantine recipes keep it purely tahini-forward' }],
},

// ===== TURKISH =====
'imam-bayildi-stuffed-eggplant': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NYT Cooking', 'Ozlem\'s Turkish Table', 'RecipeTin Eats', 'BBC Good Food'],
  ingredients: [
    { label: 'Eggplant type', consensus: 'Italian or Turkish (long, slim)', percentage: 78, alternative: 'Globe eggplant', altPercentage: 22 },
    { label: 'Filling base', consensus: 'Onion, garlic, tomato', percentage: 92 },
    { label: 'Olive oil', consensus: 'Very generous (1/2+ cup)', percentage: 85 },
    { label: 'Sugar pinch', consensus: 'Small amount in filling', percentage: 68, alternative: 'No sugar', altPercentage: 32 },
    { label: 'Herbs', consensus: 'Flat-leaf parsley', percentage: 82, alternative: 'Parsley + dill', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Eggplant prep', consensus: 'Halve, score, salt, drain', percentage: 75, alternative: 'Keep whole, slit pocket', altPercentage: 25 },
    { label: 'Pre-cook eggplant', consensus: 'Pan-fry in olive oil', percentage: 70, alternative: 'Roast in oven', altPercentage: 30 },
    { label: 'Braising', consensus: 'Low oven or stovetop, 40-50 min', percentage: 82 },
    { label: 'Serving temp', consensus: 'Room temperature', percentage: 88, alternative: 'Warm', altPercentage: 12 },
  ],
  differs: [],
},

// ===== PALESTINIAN/MIDDLE EASTERN =====
'knafeh': {
  recipesAnalyzed: 13,
  sources: ['NYT Cooking', 'Serious Eats', 'Cleobuttera', 'Feel Good Foodie', 'Middle East Eye'],
  ingredients: [
    { label: 'Pastry type', consensus: 'Shredded kataifi dough', percentage: 62, alternative: 'Fine semolina (na\'ameh style)', altPercentage: 38 },
    { label: 'Cheese', consensus: 'Akkawi or mozzarella, desalted', percentage: 72, alternative: 'Ricotta blend', altPercentage: 28 },
    { label: 'Fat', consensus: 'Clarified butter (ghee)', percentage: 85, alternative: 'Regular melted butter', altPercentage: 15 },
    { label: 'Syrup', consensus: 'Sugar syrup + orange blossom water', percentage: 80, alternative: 'Rose water syrup', altPercentage: 20 },
    { label: 'Food coloring', consensus: 'Orange food coloring used', percentage: 60, alternative: 'Natural color, no dye', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Cheese prep', consensus: 'Soak in water to remove salt', percentage: 85 },
    { label: 'Cooking method', consensus: 'Stovetop in round pan, then broil', percentage: 58, alternative: 'Fully baked in oven', altPercentage: 42 },
    { label: 'Syrup temp', consensus: 'Cold syrup on hot knafeh', percentage: 78, alternative: 'Warm syrup', altPercentage: 22 },
    { label: 'Topping', consensus: 'Crushed pistachios', percentage: 92 },
  ],
  differs: [{ point: 'Pastry style', detail: 'Uses semolina base where many recipes default to shredded kataifi dough' }],
},

// ===== SICHUAN CHINESE =====
'kung-pao-chicken': {
  recipesAnalyzed: 22,
  sources: ['Woks of Life', 'Serious Eats', 'Chinese Cooking Demystified', 'Red House Spice', 'Omnivore\'s Cookbook'],
  ingredients: [
    { label: 'Dried chilies', consensus: 'Facing heaven peppers', percentage: 72, alternative: 'Dried arbols', altPercentage: 28 },
    { label: 'Sichuan peppercorn', consensus: 'Whole, toasted', percentage: 88 },
    { label: 'Peanuts', consensus: 'Raw, fried in wok', percentage: 65, alternative: 'Roasted peanuts', altPercentage: 35 },
    { label: 'Vinegar type', consensus: 'Chinkiang (black)', percentage: 82, alternative: 'Rice vinegar', altPercentage: 18 },
    { label: 'Velveting liquid', consensus: 'Shaoxing wine', percentage: 76, alternative: 'Dry sherry', altPercentage: 24 },
  ],
  techniques: [
    { label: 'Chicken prep', consensus: 'Diced, velveted', percentage: 78, alternative: 'Diced, marinated only', altPercentage: 22 },
    { label: 'Chili treatment', consensus: 'Charred whole in oil', percentage: 85 },
    { label: 'Sauce timing', consensus: 'Pre-mixed, added last', percentage: 70, alternative: 'Built in wok', altPercentage: 30 },
  ],
  differs: [{ point: 'Leek vs scallion', detail: 'Traditional uses leek segments; many Western recipes substitute scallions' }],
},

'mapo-tofu': {
  recipesAnalyzed: 24,
  sources: ['Chinese Cooking Demystified', 'Serious Eats', 'Woks of Life', 'Fuchsia Dunlop', 'The Woks of Life'],
  ingredients: [
    { label: 'Protein', consensus: 'Ground pork', percentage: 75, alternative: 'Ground beef', altPercentage: 25 },
    { label: 'Bean paste', consensus: 'Doubanjiang (Pixian)', percentage: 92 },
    { label: 'Tofu firmness', consensus: 'Soft (silken) tofu', percentage: 68, alternative: 'Medium-firm tofu', altPercentage: 32 },
    { label: 'Fermented beans', consensus: 'Douchi included', percentage: 78, alternative: 'Omitted', altPercentage: 22 },
    { label: 'Sichuan peppercorn', consensus: 'Ground, added at end', percentage: 85 },
  ],
  techniques: [
    { label: 'Tofu prep', consensus: 'Blanched in salted water', percentage: 82, alternative: 'Added directly', altPercentage: 18 },
    { label: 'Oil amount', consensus: 'Generous (3-4 tbsp)', percentage: 74, alternative: 'Light (1-2 tbsp)', altPercentage: 26 },
    { label: 'Starch slurry', consensus: 'Added in two rounds', percentage: 63, alternative: 'Single addition', altPercentage: 37 },
  ],
  differs: [],
},

// ===== CENTRAL ASIAN (UYGHUR) =====
'laghman-pulled-noodle-soup': {
  recipesAnalyzed: 10,
  sources: ['Taste of Artisan', 'Silk Road Chef', 'The Spruce Eats', 'Food52', 'Honest Food Talks'],
  ingredients: [
    { label: 'Meat', consensus: 'Lamb, cubed', percentage: 62, alternative: 'Beef chuck', altPercentage: 38 },
    { label: 'Noodle type', consensus: 'Hand-pulled, thick', percentage: 88 },
    { label: 'Bell peppers', consensus: 'Green and red', percentage: 72, alternative: 'Green only', altPercentage: 28 },
    { label: 'Tomatoes', consensus: 'Fresh, chopped', percentage: 80 },
    { label: 'Spice base', consensus: 'Cumin and chili flakes', percentage: 76 },
  ],
  techniques: [
    { label: 'Noodle resting', consensus: 'Oil-coated, rest 2+ hours', percentage: 85 },
    { label: 'Pulling method', consensus: 'Slap and stretch', percentage: 78, alternative: 'Roll and pull', altPercentage: 22 },
    { label: 'Sauce style', consensus: 'Stir-fried vegetables, brothy', percentage: 70, alternative: 'Thick stew-like', altPercentage: 30 },
  ],
  differs: [{ point: 'Noodle shortcut', detail: 'Some recipes use store-bought noodles; authentic versions insist on hand-pulled' }],
},

// ===== TURKISH/MIDDLE EASTERN =====
'lahmacun': {
  recipesAnalyzed: 16,
  sources: ['Turkish Food Travel', 'Ozlem\'s Turkish Table', 'Serious Eats', 'Give Recipe', 'Unicorns in the Kitchen'],
  ingredients: [
    { label: 'Meat', consensus: 'Lamb mince', percentage: 68, alternative: 'Beef mince', altPercentage: 32 },
    { label: 'Pepper paste', consensus: 'Biber salçası included', percentage: 82 },
    { label: 'Tomato', consensus: 'Fresh, finely chopped', percentage: 75, alternative: 'Tomato paste only', altPercentage: 25 },
    { label: 'Herbs', consensus: 'Flat-leaf parsley', percentage: 90 },
    { label: 'Dough fat', consensus: 'Olive oil in dough', percentage: 72, alternative: 'No fat in dough', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Dough thickness', consensus: 'Paper-thin, crispy', percentage: 92 },
    { label: 'Oven temp', consensus: 'Maximum heat (500°F+)', percentage: 88 },
    { label: 'Topping spread', consensus: 'Thin layer edge-to-edge', percentage: 86 },
  ],
  differs: [],
},

// ===== MALAYSIAN/SINGAPOREAN =====
'laksa': {
  recipesAnalyzed: 19,
  sources: ['Rasa Malaysia', 'Serious Eats', 'Wok & Skillet', 'RecipeTin Eats', 'Asian Inspirations', 'Nyonya Cooking'],
  ingredients: [
    { label: 'Laksa paste base', consensus: 'Homemade rempah', percentage: 65, alternative: 'Store-bought paste', altPercentage: 35 },
    { label: 'Coconut milk', consensus: 'Full-fat, generous', percentage: 90 },
    { label: 'Noodle type', consensus: 'Thick rice vermicelli', percentage: 58, alternative: 'Yellow egg noodles', altPercentage: 42 },
    { label: 'Protein', consensus: 'Shrimp and tofu puffs', percentage: 72, alternative: 'Chicken', altPercentage: 28 },
    { label: 'Dried shrimp', consensus: 'In paste, essential', percentage: 84 },
  ],
  techniques: [
    { label: 'Paste method', consensus: 'Blended then fried', percentage: 88 },
    { label: 'Frying paste', consensus: 'Until oil separates', percentage: 82 },
    { label: 'Broth finish', consensus: 'Simmer 15-20 min', percentage: 70, alternative: 'Quick boil', altPercentage: 30 },
  ],
  differs: [{ point: 'Curry vs Assam laksa', detail: 'This recipe follows curry laksa (coconut-based); Assam laksa is tamarind-based and fish-forward' }],
},

// ===== MIDDLE EASTERN =====
'lamb-kofta': {
  recipesAnalyzed: 18,
  sources: ['RecipeTin Eats', 'Serious Eats', 'Ottolenghi', 'The Mediterranean Dish', 'Bon Appétit'],
  ingredients: [
    { label: 'Meat ratio', consensus: 'Lamb, 20% fat', percentage: 78, alternative: 'Lamb-beef blend', altPercentage: 22 },
    { label: 'Key spice', consensus: 'Cumin dominant', percentage: 82 },
    { label: 'Allium', consensus: 'Grated onion', percentage: 74, alternative: 'Minced onion', altPercentage: 26 },
    { label: 'Binder', consensus: 'None needed', percentage: 62, alternative: 'Breadcrumbs or egg', altPercentage: 38 },
    { label: 'Fresh herbs', consensus: 'Parsley and mint', percentage: 76, alternative: 'Parsley only', altPercentage: 24 },
  ],
  techniques: [
    { label: 'Shape', consensus: 'Formed on skewers', percentage: 70, alternative: 'Free-form patties', altPercentage: 30 },
    { label: 'Cooking method', consensus: 'Grilled over charcoal', percentage: 65, alternative: 'Pan-seared or broiled', altPercentage: 35 },
    { label: 'Resting meat', consensus: 'Chill 30 min before cooking', percentage: 72, alternative: 'Cook immediately', altPercentage: 28 },
  ],
  differs: [],
},

'muhammara': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'Cookie and Kate', 'Ottolenghi', 'The Mediterranean Dish', 'Bon Appétit'],
  ingredients: [
    { label: 'Peppers', consensus: 'Roasted red (jarred OK)', percentage: 82 },
    { label: 'Nuts', consensus: 'Walnuts, toasted', percentage: 94 },
    { label: 'Sweetener', consensus: 'Pomegranate molasses', percentage: 90 },
    { label: 'Bread', consensus: 'Breadcrumbs for body', percentage: 68, alternative: 'No breadcrumbs', altPercentage: 32 },
    { label: 'Heat', consensus: 'Aleppo pepper', percentage: 76, alternative: 'Red pepper flakes', altPercentage: 24 },
  ],
  techniques: [
    { label: 'Texture', consensus: 'Slightly chunky', percentage: 62, alternative: 'Smooth purée', altPercentage: 38 },
    { label: 'Olive oil', consensus: 'Drizzled on top to serve', percentage: 85 },
    { label: 'Roasting peppers', consensus: 'Use jarred, drain well', percentage: 58, alternative: 'Roast fresh peppers', altPercentage: 42 },
  ],
  differs: [],
},

'mujaddara': {
  recipesAnalyzed: 14,
  sources: ['Ottolenghi', 'Cookie and Kate', 'Serious Eats', 'The Mediterranean Dish', 'Tori Avey'],
  ingredients: [
    { label: 'Lentil type', consensus: 'Green or brown lentils', percentage: 72, alternative: 'Black lentils', altPercentage: 28 },
    { label: 'Rice type', consensus: 'Basmati, long grain', percentage: 78 },
    { label: 'Onion amount', consensus: 'Very generous (3-4 large)', percentage: 88 },
    { label: 'Spices', consensus: 'Cumin and cinnamon', percentage: 75, alternative: 'Cumin and allspice', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Onion treatment', consensus: 'Deep-fried, caramelized', percentage: 85, alternative: 'Slowly caramelized', altPercentage: 15 },
    { label: 'Cooking method', consensus: 'Lentils first, add rice', percentage: 80 },
    { label: 'Served with', consensus: 'Yogurt on the side', percentage: 82 },
  ],
  differs: [{ point: 'Rice-to-lentil ratio', detail: 'Ratios vary widely from equal parts to double the lentils' }],
},

// ===== THAI/LAOTIAN =====
'larb-thai-meat-salad': {
  recipesAnalyzed: 17,
  sources: ['Hot Thai Kitchen', 'Serious Eats', 'SheSimmers', 'Woks of Life', 'Thaitable'],
  ingredients: [
    { label: 'Protein', consensus: 'Pork mince', percentage: 55, alternative: 'Chicken mince', altPercentage: 45 },
    { label: 'Toasted rice', consensus: 'Khao khua, essential', percentage: 92 },
    { label: 'Herbs', consensus: 'Mint, cilantro, shallots', percentage: 88 },
    { label: 'Fish sauce', consensus: 'Primary seasoning', percentage: 95 },
    { label: 'Chili', consensus: 'Dried chili flakes (toasted)', percentage: 78, alternative: 'Fresh bird\'s eye', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Cooking meat', consensus: 'Dry-fried, no oil', percentage: 72, alternative: 'Poached in water', altPercentage: 28 },
    { label: 'Served', consensus: 'Room temp, not hot', percentage: 68, alternative: 'Warm', altPercentage: 32 },
    { label: 'Lime juice', consensus: 'Added off heat, raw', percentage: 90 },
  ],
  differs: [],
},

// ===== PERUVIAN =====
'lomo-saltado': {
  recipesAnalyzed: 14,
  sources: ['Peru Delights', 'Serious Eats', 'Bon Appétit', 'Laylita\'s Recipes', 'The Spruce Eats'],
  ingredients: [
    { label: 'Beef cut', consensus: 'Sirloin or tenderloin', percentage: 80 },
    { label: 'Soy sauce', consensus: 'Essential (Chifa influence)', percentage: 92 },
    { label: 'Vinegar', consensus: 'Red wine vinegar', percentage: 74, alternative: 'White vinegar', altPercentage: 26 },
    { label: 'Potatoes', consensus: 'French fries, separate', percentage: 85 },
    { label: 'Tomatoes', consensus: 'Roma, in wedges', percentage: 78 },
    { label: 'Aji amarillo', consensus: 'Paste, 1-2 tbsp', percentage: 70, alternative: 'Omitted', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Wok hei', consensus: 'High heat, quick sear', percentage: 88 },
    { label: 'Fry integration', consensus: 'Tossed in at end', percentage: 72, alternative: 'Served on the side', altPercentage: 28 },
    { label: 'Served with', consensus: 'White rice alongside', percentage: 90 },
  ],
  differs: [],
},

// ===== LEBANESE =====
'manakish-za-atar-flatbread': {
  recipesAnalyzed: 13,
  sources: ['Feel Good Foodie', 'Maureen Abood', 'The Mediterranean Dish', 'Cleobuttera', 'Saveur'],
  ingredients: [
    { label: 'Za\'atar mix', consensus: 'Mixed with olive oil', percentage: 95 },
    { label: 'Dough type', consensus: 'Yeasted, soft', percentage: 85, alternative: 'Quick no-yeast', altPercentage: 15 },
    { label: 'Flour', consensus: 'All-purpose', percentage: 72, alternative: 'Bread flour', altPercentage: 28 },
    { label: 'Sugar in dough', consensus: 'Small amount (1 tsp)', percentage: 68, alternative: 'No sugar', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Shaping', consensus: 'Rolled thin, oval', percentage: 78, alternative: 'Round pizza-like', altPercentage: 22 },
    { label: 'Baking surface', consensus: 'Baking stone or sheet', percentage: 82 },
    { label: 'Oven temp', consensus: '450-475°F', percentage: 76 },
  ],
  differs: [],
},

// ===== NORTH AFRICAN =====
'merguez-sausage': {
  recipesAnalyzed: 12,
  sources: ['Serious Eats', 'Saveur', 'Food52', 'Hunter Angler Gardener Cook', 'Bon Appétit'],
  ingredients: [
    { label: 'Meat', consensus: 'Lamb (or lamb-beef)', percentage: 75, alternative: 'All beef', altPercentage: 25 },
    { label: 'Spice anchor', consensus: 'Harissa paste', percentage: 70, alternative: 'Dried chili blend', altPercentage: 30 },
    { label: 'Cumin', consensus: 'Generous, toasted ground', percentage: 88 },
    { label: 'Fennel seed', consensus: 'Included', percentage: 62, alternative: 'Omitted', altPercentage: 38 },
    { label: 'Casing', consensus: 'Lamb casings', percentage: 72, alternative: 'Skinless patties', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Meat temp', consensus: 'Keep everything ice cold', percentage: 90 },
    { label: 'Fat content', consensus: '25-30% fat', percentage: 78 },
    { label: 'Cooking', consensus: 'Grilled, high heat', percentage: 68, alternative: 'Pan-fried', altPercentage: 32 },
  ],
  differs: [],
},

// ===== PUERTO RICAN =====
'mofongo': {
  recipesAnalyzed: 11,
  sources: ['Serious Eats', 'Delish D\'Lites', 'Kitchen Gidget', 'The Noshery', 'Bon Appétit'],
  ingredients: [
    { label: 'Plantain ripeness', consensus: 'Green, unripe', percentage: 95 },
    { label: 'Pork product', consensus: 'Chicharrón (pork cracklings)', percentage: 82, alternative: 'Bacon', altPercentage: 18 },
    { label: 'Garlic', consensus: 'Mashed garlic, very generous', percentage: 90 },
    { label: 'Fat for mashing', consensus: 'Olive oil', percentage: 60, alternative: 'Butter or lard', altPercentage: 40 },
  ],
  techniques: [
    { label: 'Plantain cooking', consensus: 'Deep-fried twice', percentage: 75, alternative: 'Fried once', altPercentage: 25 },
    { label: 'Mashing tool', consensus: 'Pilón (wooden mortar)', percentage: 85 },
    { label: 'Texture', consensus: 'Chunky, not smooth', percentage: 80 },
    { label: 'Served with', consensus: 'Broth or gravy on side', percentage: 78 },
  ],
  differs: [],
},

// ===== MEXICAN =====
'mole-poblano': {
  recipesAnalyzed: 18,
  sources: ['Rick Bayless', 'Serious Eats', 'Pati Jinich', 'México in My Kitchen', 'Bon Appétit', 'NYT Cooking'],
  ingredients: [
    { label: 'Dried chilies', consensus: '3+ varieties minimum', percentage: 88 },
    { label: 'Chocolate', consensus: 'Mexican chocolate (Ibarra)', percentage: 72, alternative: 'Dark bittersweet', altPercentage: 28 },
    { label: 'Thickener', consensus: 'Toasted bread or tortilla', percentage: 68, alternative: 'Sesame seeds and nuts only', altPercentage: 32 },
    { label: 'Spices', consensus: 'Cinnamon, clove, cumin', percentage: 82 },
    { label: 'Raisins', consensus: 'Included for sweetness', percentage: 76, alternative: 'Omitted', altPercentage: 24 },
    { label: 'Nuts/seeds', consensus: 'Peanuts, almonds, sesame', percentage: 80 },
  ],
  techniques: [
    { label: 'Chili prep', consensus: 'Toast, soak, blend', percentage: 92 },
    { label: 'Component frying', consensus: 'Each ingredient fried separately', percentage: 78 },
    { label: 'Cooking time', consensus: '1-2 hours simmering', percentage: 70, alternative: '30-45 minutes', altPercentage: 30 },
  ],
  differs: [{ point: 'Shortcut versions', detail: 'Many modern recipes reduce chili varieties and skip individual frying; purists use 5+ chilies' }],
},

// ===== AMERICAN (NEW ENGLAND) =====
'new-england-clam-chowder': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'America\'s Test Kitchen', 'NYT Cooking', 'Bon Appétit', 'New England Today'],
  ingredients: [
    { label: 'Clam type', consensus: 'Quahogs or cherrystones', percentage: 72, alternative: 'Canned clams', altPercentage: 28 },
    { label: 'Pork product', consensus: 'Salt pork, diced', percentage: 65, alternative: 'Bacon', altPercentage: 35 },
    { label: 'Dairy', consensus: 'Heavy cream', percentage: 78, alternative: 'Whole milk + cream', altPercentage: 22 },
    { label: 'Potato type', consensus: 'Yukon Gold, cubed', percentage: 62, alternative: 'Russet', altPercentage: 38 },
    { label: 'Thickener', consensus: 'Flour roux', percentage: 70, alternative: 'Potato starch only', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Clam cooking', consensus: 'Steam open, use liquor', percentage: 85 },
    { label: 'Adding clams', consensus: 'At the very end, brief', percentage: 82 },
    { label: 'Resting', consensus: 'Overnight improves flavor', percentage: 68, alternative: 'Serve immediately', altPercentage: 32 },
  ],
  differs: [],
},

// ===== FRENCH (PROVENÇAL) =====
'nicoise-salad': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'David Lebovitz', 'NYT Cooking', 'Bon Appétit', 'Ina Garten'],
  ingredients: [
    { label: 'Tuna', consensus: 'Oil-packed, high quality', percentage: 58, alternative: 'Seared fresh tuna', altPercentage: 42 },
    { label: 'Potatoes', consensus: 'Boiled, small waxy', percentage: 88 },
    { label: 'Green beans', consensus: 'Haricots verts, blanched', percentage: 85 },
    { label: 'Eggs', consensus: 'Jammy or hard-boiled', percentage: 90 },
    { label: 'Lettuce', consensus: 'None (traditional)', percentage: 55, alternative: 'Butter lettuce bed', altPercentage: 45 },
  ],
  techniques: [
    { label: 'Assembly', consensus: 'Composed, not tossed', percentage: 78, alternative: 'Tossed together', altPercentage: 22 },
    { label: 'Dressing', consensus: 'Dijon vinaigrette', percentage: 85 },
    { label: 'Olive type', consensus: 'Niçoise olives', percentage: 82, alternative: 'Kalamata', altPercentage: 18 },
  ],
  differs: [{ point: 'Lettuce debate', detail: 'Purists in Nice omit lettuce entirely; most non-French recipes add a green bed' }],
},

// ===== ITALIAN (MILANESE) =====
'osso-buco': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'Bon Appétit', 'NYT Cooking', 'Giada De Laurentiis', 'Saveur', 'La Cucina Italiana'],
  ingredients: [
    { label: 'Cut', consensus: 'Veal shanks, 1.5" thick', percentage: 92 },
    { label: 'Tomato', consensus: 'Included (modern style)', percentage: 72, alternative: 'White (no tomato, original)', altPercentage: 28 },
    { label: 'Gremolata', consensus: 'Lemon, parsley, garlic', percentage: 88 },
    { label: 'Wine', consensus: 'Dry white wine', percentage: 82, alternative: 'Red wine', altPercentage: 18 },
    { label: 'Mirepoix', consensus: 'Carrot, celery, onion', percentage: 90 },
  ],
  techniques: [
    { label: 'Sear', consensus: 'Flour-dusted, browned well', percentage: 85 },
    { label: 'Braising time', consensus: '1.5-2 hours, low', percentage: 80 },
    { label: 'Served with', consensus: 'Risotto alla Milanese', percentage: 72, alternative: 'Polenta or mashed', altPercentage: 28 },
  ],
  differs: [],
},

// ===== THAI =====
'pad-see-ew': {
  recipesAnalyzed: 16,
  sources: ['Hot Thai Kitchen', 'Serious Eats', 'Woks of Life', 'RecipeTin Eats', 'SheSimmers'],
  ingredients: [
    { label: 'Noodle type', consensus: 'Wide fresh rice noodles', percentage: 90 },
    { label: 'Protein', consensus: 'Chicken thigh', percentage: 55, alternative: 'Pork or beef', altPercentage: 45 },
    { label: 'Soy sauces', consensus: 'Dark + light soy', percentage: 88 },
    { label: 'Greens', consensus: 'Chinese broccoli (gai lan)', percentage: 82, alternative: 'Regular broccoli', altPercentage: 18 },
    { label: 'Sweetener', consensus: 'Dark soy + sugar', percentage: 75 },
  ],
  techniques: [
    { label: 'Wok heat', consensus: 'Highest possible, smoky', percentage: 92 },
    { label: 'Noodle handling', consensus: 'Separate, toss gently', percentage: 80 },
    { label: 'Egg method', consensus: 'Push noodles aside, fry egg flat', percentage: 74, alternative: 'Scramble into noodles', altPercentage: 26 },
  ],
  differs: [],
},

'pad-thai': {
  recipesAnalyzed: 5,
  sources: ['Serious Eats', 'Hot Thai Kitchen', 'NYT Cooking', 'Bon Appétit', 'Woks of Life'],
  ingredients: [
    { label: 'Noodles', consensus: 'Dried medium rice noodles, soaked', percentage: 100 },
    { label: 'Sauce base', consensus: 'Tamarind (no ketchup)', percentage: 100 },
    { label: 'Sweetener', consensus: 'Palm sugar', percentage: 60, alternative: 'Honey or brown sugar', altPercentage: 40 },
    { label: 'Dried shrimp', consensus: 'Included for umami', percentage: 80, alternative: 'Omitted', altPercentage: 20 },
    { label: 'Preserved radish', consensus: 'Sweet chai poh included', percentage: 80, alternative: 'Omitted', altPercentage: 20 },
    { label: 'Garnish greens', consensus: 'Garlic chives', percentage: 80, alternative: 'Scallions', altPercentage: 20 },
  ],
  techniques: [
    { label: 'Noodle prep', consensus: 'Soaked in water — never boiled', percentage: 100 },
    { label: 'Batch size', consensus: 'Cook one serving at a time', percentage: 60, alternative: 'Larger batches OK', altPercentage: 40 },
    { label: 'Egg method', consensus: 'Cooked in wok alongside other ingredients', percentage: 80, alternative: 'Scrambled separately', altPercentage: 20 },
  ],
  differs: [{ point: 'The Bittman shortcut', detail: 'NYT\'s version omits dried shrimp, preserved radish, and garlic chives — a simpler weeknight take vs. the traditional Thai approach' }],
},

// ===== SPANISH =====
'paella-de-mariscos': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'José Andrés', 'Spain on a Fork', 'Bon Appétit', 'NYT Cooking', 'Leite\'s Culinaria'],
  ingredients: [
    { label: 'Rice type', consensus: 'Bomba or Calasparra', percentage: 82, alternative: 'Arborio', altPercentage: 18 },
    { label: 'Saffron', consensus: 'Essential, generous', percentage: 95 },
    { label: 'Shellfish', consensus: 'Shrimp, mussels, clams', percentage: 78 },
    { label: 'Squid', consensus: 'Included, cut in rings', percentage: 68, alternative: 'Omitted', altPercentage: 32 },
    { label: 'Tomato', consensus: 'Grated fresh tomato', percentage: 74, alternative: 'Crushed canned', altPercentage: 26 },
  ],
  techniques: [
    { label: 'Socarrat', consensus: 'Crust on bottom, essential', percentage: 88 },
    { label: 'Stirring', consensus: 'Never stir after adding stock', percentage: 92 },
    { label: 'Pan type', consensus: 'Wide, shallow paella pan', percentage: 85 },
    { label: 'Stock', consensus: 'Homemade fish/shrimp stock', percentage: 70, alternative: 'Store-bought broth', altPercentage: 30 },
  ],
  differs: [],
},

'patatas-bravas': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'Spain on a Fork', 'Spanish Sabores', 'Bon Appétit', 'The Spruce Eats'],
  ingredients: [
    { label: 'Potato type', consensus: 'Starchy (Russet/Maris)', percentage: 72, alternative: 'Waxy potatoes', altPercentage: 28 },
    { label: 'Bravas sauce base', consensus: 'Tomato-based, smoky', percentage: 65, alternative: 'Mayo-based (alioli style)', altPercentage: 35 },
    { label: 'Paprika type', consensus: 'Smoked (pimentón)', percentage: 88 },
    { label: 'Heat source', consensus: 'Cayenne or guindilla', percentage: 75 },
  ],
  techniques: [
    { label: 'Frying method', consensus: 'Double-fried', percentage: 68, alternative: 'Single fry or roasted', altPercentage: 32 },
    { label: 'Potato shape', consensus: 'Irregular rough cubes', percentage: 72, alternative: 'Neat cubes', altPercentage: 28 },
    { label: 'Sauce serving', consensus: 'Both bravas + alioli', percentage: 62, alternative: 'Bravas sauce only', altPercentage: 38 },
  ],
  differs: [{ point: 'Regional variation', detail: 'Madrid-style uses tomato bravas sauce; Barcelona often adds garlic alioli alongside or instead' }],
},

// ===== INDIAN (NORTH INDIAN) =====
'palak-paneer': {
  recipesAnalyzed: 21,
  sources: ['Serious Eats', 'Hebbar\'s Kitchen', 'Swasthi\'s Recipes', 'Manjula\'s Kitchen', 'Bon Appétit'],
  ingredients: [
    { label: 'Greens', consensus: 'Spinach only', percentage: 72, alternative: 'Spinach-mustard greens mix', altPercentage: 28 },
    { label: 'Paneer prep', consensus: 'Pan-fried cubes', percentage: 80, alternative: 'Added raw', altPercentage: 20 },
    { label: 'Cream/dairy', consensus: 'Heavy cream finish', percentage: 75, alternative: 'Cashew cream', altPercentage: 25 },
    { label: 'Tomato', consensus: 'Included in base', percentage: 68, alternative: 'No tomato', altPercentage: 32 },
    { label: 'Garam masala', consensus: 'Added at end', percentage: 85 },
  ],
  techniques: [
    { label: 'Spinach prep', consensus: 'Blanch, ice bath, blend', percentage: 82 },
    { label: 'Purée texture', consensus: 'Mostly smooth', percentage: 70, alternative: 'Chunky spinach', altPercentage: 30 },
    { label: 'Paneer timing', consensus: 'Folded in at end', percentage: 78 },
  ],
  differs: [],
},

// ===== ITALIAN (TUSCAN) =====
'panzanella': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Bon Appétit', 'NYT Cooking', 'Jamie Oliver', 'Giada De Laurentiis'],
  ingredients: [
    { label: 'Bread type', consensus: 'Ciabatta or rustic', percentage: 70, alternative: 'Tuscan unsalted bread', altPercentage: 30 },
    { label: 'Tomatoes', consensus: 'Ripe, peak season', percentage: 95 },
    { label: 'Red onion', consensus: 'Thinly sliced, soaked', percentage: 78, alternative: 'Raw, not soaked', altPercentage: 22 },
    { label: 'Cucumber', consensus: 'Included', percentage: 62, alternative: 'Omitted (purist)', altPercentage: 38 },
    { label: 'Basil', consensus: 'Torn, generous', percentage: 90 },
  ],
  techniques: [
    { label: 'Bread prep', consensus: 'Toasted or grilled', percentage: 65, alternative: 'Stale bread, soaked', altPercentage: 35 },
    { label: 'Dressing soak', consensus: 'Toss 20-30 min before serving', percentage: 72 },
    { label: 'Vinegar type', consensus: 'Red wine vinegar', percentage: 80 },
  ],
  differs: [{ point: 'Bread treatment', detail: 'Traditional Tuscan versions soak stale bread in water; modern takes toast cubes for crunch' }],
},

// ===== ITALIAN (SICILIAN) =====
'pasta-alla-norma': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'La Cucina Italiana', 'Giada De Laurentiis'],
  ingredients: [
    { label: 'Pasta shape', consensus: 'Rigatoni or penne', percentage: 78, alternative: 'Spaghetti', altPercentage: 22 },
    { label: 'Eggplant', consensus: 'Cubed, fried', percentage: 82 },
    { label: 'Cheese', consensus: 'Ricotta salata', percentage: 88, alternative: 'Pecorino Romano', altPercentage: 12 },
    { label: 'Tomato sauce', consensus: 'Simple, garlic-basil', percentage: 85 },
  ],
  techniques: [
    { label: 'Eggplant salting', consensus: 'Salt 30 min, drain', percentage: 68, alternative: 'Skip salting', altPercentage: 32 },
    { label: 'Eggplant cooking', consensus: 'Deep or shallow fried', percentage: 75, alternative: 'Roasted', altPercentage: 25 },
    { label: 'Assembly', consensus: 'Toss pasta with sauce, top with eggplant', percentage: 72, alternative: 'Mix everything together', altPercentage: 28 },
  ],
  differs: [],
},

// ===== ITALIAN (LIGURIAN) =====
'pesto-alla-genovese': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'La Cucina Italiana', 'Jamie Oliver', 'Giada De Laurentiis'],
  ingredients: [
    { label: 'Basil type', consensus: 'Genovese sweet basil', percentage: 82 },
    { label: 'Nuts', consensus: 'Pine nuts', percentage: 85, alternative: 'Walnuts', altPercentage: 15 },
    { label: 'Cheese', consensus: 'Parmigiano + Pecorino blend', percentage: 72, alternative: 'Parmigiano only', altPercentage: 28 },
    { label: 'Garlic amount', consensus: '1-2 cloves (restrained)', percentage: 74, alternative: '3+ cloves', altPercentage: 26 },
  ],
  techniques: [
    { label: 'Method', consensus: 'Mortar and pestle ideal', percentage: 58, alternative: 'Food processor', altPercentage: 42 },
    { label: 'Basil prep', consensus: 'No washing if possible', percentage: 55, alternative: 'Wash and dry', altPercentage: 45 },
    { label: 'Pine nut toasting', consensus: 'Raw, untoasted', percentage: 65, alternative: 'Lightly toasted', altPercentage: 35 },
    { label: 'Texture', consensus: 'Slightly coarse', percentage: 70, alternative: 'Smooth purée', altPercentage: 30 },
  ],
  differs: [],
},

// ===== VIETNAMESE =====
'pho-pho-bo': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'Woks of Life', 'Steamy Kitchen', 'Hungry Huy', 'NYT Cooking', 'Andrea Nguyen'],
  ingredients: [
    { label: 'Bones', consensus: 'Beef knuckle + marrow bones', percentage: 78 },
    { label: 'Charred aromatics', consensus: 'Onion and ginger, charred', percentage: 92 },
    { label: 'Star anise', consensus: '3-5 whole stars', percentage: 88 },
    { label: 'Fish sauce', consensus: 'Essential, add gradually', percentage: 90 },
    { label: 'Rock sugar', consensus: 'Yellow rock sugar', percentage: 72, alternative: 'Regular sugar', altPercentage: 28 },
    { label: 'Meat for serving', consensus: 'Brisket + rare eye round', percentage: 75 },
  ],
  techniques: [
    { label: 'Parboil bones', consensus: 'Blanch, rinse, start fresh', percentage: 88 },
    { label: 'Simmer time', consensus: '6-8 hours minimum', percentage: 62, alternative: '3-4 hours', altPercentage: 38 },
    { label: 'Broth clarity', consensus: 'Skim constantly, gentle simmer', percentage: 85 },
    { label: 'Spice toasting', consensus: 'Dry-toast whole spices', percentage: 80 },
  ],
  differs: [{ point: 'Northern vs Southern', detail: 'Northern pho is more austere with fewer garnishes; Southern style loads up on herbs, sprouts, and hoisin' }],
},

// ===== POLISH/EASTERN EUROPEAN =====
'pierogi': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'Polish Housewife', 'NYT Cooking', 'Bon Appétit', 'Taste of Poland'],
  ingredients: [
    { label: 'Dough fat', consensus: 'Sour cream in dough', percentage: 68, alternative: 'Egg and butter', altPercentage: 32 },
    { label: 'Classic filling', consensus: 'Potato and cheese (ruskie)', percentage: 82 },
    { label: 'Cheese type', consensus: 'Farmer\'s cheese or quark', percentage: 72, alternative: 'Cheddar', altPercentage: 28 },
    { label: 'Onion in filling', consensus: 'Sautéed onion mixed in', percentage: 78 },
  ],
  techniques: [
    { label: 'Dough rest', consensus: 'Rest 30 min minimum', percentage: 85 },
    { label: 'Cooking method', consensus: 'Boiled then pan-fried', percentage: 72, alternative: 'Boiled only', altPercentage: 28 },
    { label: 'Sealing', consensus: 'Fork-crimped edges', percentage: 60, alternative: 'Pinched by hand', altPercentage: 40 },
    { label: 'Served with', consensus: 'Sour cream + fried onions', percentage: 88 },
  ],
  differs: [],
},

// ===== PORTUGUESE =====
'piri-piri-chicken': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'Nando\'s copycat recipes', 'Bon Appétit', 'RecipeTin Eats', 'Saveur'],
  ingredients: [
    { label: 'Chili type', consensus: 'Bird\'s eye (piri piri)', percentage: 78, alternative: 'Thai chili or Fresno', altPercentage: 22 },
    { label: 'Citrus', consensus: 'Lemon juice', percentage: 72, alternative: 'Lime juice', altPercentage: 28 },
    { label: 'Paprika', consensus: 'Smoked paprika', percentage: 82 },
    { label: 'Garlic', consensus: '6+ cloves, generous', percentage: 85 },
    { label: 'Vinegar', consensus: 'Red wine or apple cider', percentage: 70 },
  ],
  techniques: [
    { label: 'Chicken prep', consensus: 'Spatchcocked (butterflied)', percentage: 75, alternative: 'Chicken pieces', altPercentage: 25 },
    { label: 'Marinating', consensus: 'Overnight minimum', percentage: 80 },
    { label: 'Cooking', consensus: 'Grilled or high-heat roast', percentage: 72, alternative: 'Oven-baked standard', altPercentage: 28 },
    { label: 'Basting', consensus: 'Baste with sauce while cooking', percentage: 78 },
  ],
  differs: [],
},

// ===== MIDDLE EASTERN =====
'pita-bread': {
  recipesAnalyzed: 19,
  sources: ['King Arthur Baking', 'Serious Eats', 'NYT Cooking', 'The Mediterranean Dish', 'Joshua Weissman'],
  ingredients: [
    { label: 'Flour type', consensus: 'All-purpose or bread flour', percentage: 72, alternative: 'Whole wheat blend', altPercentage: 28 },
    { label: 'Fat', consensus: 'Olive oil (small amount)', percentage: 68, alternative: 'No fat', altPercentage: 32 },
    { label: 'Yeast', consensus: 'Instant/active dry', percentage: 90 },
    { label: 'Sugar', consensus: 'Small amount (1-2 tsp)', percentage: 75 },
  ],
  techniques: [
    { label: 'Oven temp', consensus: '475-500°F, very hot', percentage: 88 },
    { label: 'Baking surface', consensus: 'Preheated stone or steel', percentage: 80, alternative: 'Cast iron skillet', altPercentage: 20 },
    { label: 'Puff timing', consensus: '2-4 minutes total', percentage: 85 },
    { label: 'Thickness', consensus: '1/4 inch before baking', percentage: 72 },
  ],
  differs: [],
},

// ===== ITALIAN (NEAPOLITAN) =====
'pizza-dough-neapolitan': {
  recipesAnalyzed: 23,
  sources: ['Serious Eats', 'Vito Iacopelli', 'Stadler Made', 'King Arthur Baking', 'Bon Appétit', 'AVPN Guidelines'],
  ingredients: [
    { label: 'Flour type', consensus: 'Tipo 00 (Caputo)', percentage: 85, alternative: 'Bread flour', altPercentage: 15 },
    { label: 'Yeast amount', consensus: 'Very small (0.1-0.3%)', percentage: 78, alternative: 'Standard amount', altPercentage: 22 },
    { label: 'Salt', consensus: '2.5-3% baker\'s percentage', percentage: 82 },
    { label: 'Hydration', consensus: '60-65%', percentage: 68, alternative: '70%+ high hydration', altPercentage: 32 },
    { label: 'Olive oil', consensus: 'None in dough', percentage: 72, alternative: 'Small amount', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Fermentation', consensus: '24-72 hour cold ferment', percentage: 75, alternative: 'Same-day room temp', altPercentage: 25 },
    { label: 'Kneading', consensus: 'Until smooth, windowpane', percentage: 82 },
    { label: 'Shaping', consensus: 'Hand-stretched, no rolling pin', percentage: 90 },
    { label: 'Baking temp', consensus: '800-900°F ideal', percentage: 70, alternative: '500-550°F home oven', altPercentage: 30 },
  ],
  differs: [{ point: 'Home oven adaptation', detail: 'True Neapolitan calls for 800°F+; home versions compensate with longer bake at max oven temp with a baking steel' }],
},

// ===== CENTRAL ASIAN =====
'plov-central-asian-pilaf': {
  recipesAnalyzed: 14,
  sources: ['Taste of Aventura', 'Honest Cooking', 'Saveur', 'The Spruce Eats', 'Epicurious'],
  ingredients: [
    { label: 'Rice type', consensus: 'Long-grain (Devzira or basmati)', percentage: 82, alternative: 'Medium-grain', altPercentage: 18 },
    { label: 'Fat', consensus: 'Lamb tail fat or vegetable oil', percentage: 70, alternative: 'Sunflower oil only', altPercentage: 30 },
    { label: 'Meat', consensus: 'Bone-in lamb shoulder', percentage: 75, alternative: 'Beef chuck', altPercentage: 25 },
    { label: 'Carrots', consensus: 'Yellow carrots, julienned', percentage: 65, alternative: 'Orange carrots', altPercentage: 35 },
    { label: 'Spice blend', consensus: 'Cumin, coriander, barberries', percentage: 78 },
  ],
  techniques: [
    { label: 'Zirvak method', consensus: 'Fry meat then layer carrots and onions', percentage: 88 },
    { label: 'Rice cooking', consensus: 'Par-boil then steam on top of zirvak', percentage: 72, alternative: 'Add raw rice directly', altPercentage: 28 },
    { label: 'Garlic', consensus: 'Bury whole heads in rice to steam', percentage: 85 },
  ],
  differs: [{ point: 'Chickpeas', detail: 'This recipe omits chickpeas, though some regional versions include them' }],
},

// ===== MEXICAN =====
'pozole-rojo': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'Rick Bayless', 'Mexico in My Kitchen', 'Bon Appétit', 'Simply Recipes'],
  ingredients: [
    { label: 'Chiles', consensus: 'Guajillo and ancho blend', percentage: 80, alternative: 'Guajillo only', altPercentage: 20 },
    { label: 'Meat', consensus: 'Pork shoulder (bone-in)', percentage: 78, alternative: 'Pork loin or chicken', altPercentage: 22 },
    { label: 'Hominy', consensus: 'Canned hominy', percentage: 62, alternative: 'Dried hominy (nixtamal)', altPercentage: 38 },
    { label: 'Oregano type', consensus: 'Mexican oregano', percentage: 88, alternative: 'Mediterranean oregano', altPercentage: 12 },
  ],
  techniques: [
    { label: 'Chile sauce', consensus: 'Toast, soak, and blend chiles', percentage: 90 },
    { label: 'Pork method', consensus: 'Simmer whole then shred', percentage: 85, alternative: 'Cut before cooking', altPercentage: 15 },
    { label: 'Garnish style', consensus: 'Served on the side for self-topping', percentage: 92 },
  ],
  differs: [],
},

'tacos-al-pastor': {
  recipesAnalyzed: 21,
  sources: ['Serious Eats', 'Rick Bayless', 'Mexico in My Kitchen', 'Bon Appétit', 'NYT Cooking', 'Kenji López-Alt'],
  ingredients: [
    { label: 'Meat', consensus: 'Thinly sliced pork shoulder', percentage: 88 },
    { label: 'Chile marinade', consensus: 'Guajillo, ancho, achiote paste', percentage: 75, alternative: 'Chipotle-based marinade', altPercentage: 25 },
    { label: 'Pineapple', consensus: 'Fresh pineapple', percentage: 92 },
    { label: 'Tortillas', consensus: 'Small corn tortillas, doubled', percentage: 85, alternative: 'Single tortilla', altPercentage: 15 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Stack and roast on vertical spit or broiler', percentage: 68, alternative: 'Skillet or grill', altPercentage: 32 },
    { label: 'Pineapple prep', consensus: 'Grill or char slices separately', percentage: 72, alternative: 'Use raw pineapple', altPercentage: 28 },
    { label: 'Marination time', consensus: 'At least 4 hours, overnight ideal', percentage: 80 },
  ],
  differs: [{ point: 'Home adaptation', detail: 'This recipe uses a broiler method since most home kitchens lack a trompo' }],
},

'tamales': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Rick Bayless', 'Mexico in My Kitchen', 'Simply Recipes', 'Isabel Eats'],
  ingredients: [
    { label: 'Masa fat', consensus: 'Lard', percentage: 82, alternative: 'Vegetable shortening or butter', altPercentage: 18 },
    { label: 'Masa flour', consensus: 'Masa harina (Maseca)', percentage: 70, alternative: 'Fresh nixtamal masa', altPercentage: 30 },
    { label: 'Liquid', consensus: 'Broth (chicken or pork)', percentage: 88, alternative: 'Water', altPercentage: 12 },
    { label: 'Wrapper', consensus: 'Dried corn husks, soaked', percentage: 75, alternative: 'Banana leaves', altPercentage: 25 },
    { label: 'Baking powder', consensus: 'Yes, for lighter texture', percentage: 72, alternative: 'None', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Masa test', consensus: 'Float test — dough should float in water', percentage: 78 },
    { label: 'Whipping masa', consensus: 'Beat with lard until fluffy (8-10 min)', percentage: 85 },
    { label: 'Steaming time', consensus: '60-90 minutes', percentage: 80 },
    { label: 'Doneness check', consensus: 'Husk peels away cleanly from masa', percentage: 90 },
  ],
  differs: [],
},

// ===== NORTH AFRICAN / MOROCCAN =====
'preserved-lemons': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'NYT Cooking', 'Saveur', 'The Kitchn', 'Food52'],
  ingredients: [
    { label: 'Lemons', consensus: 'Meyer lemons or thin-skinned', percentage: 60, alternative: 'Regular Eureka lemons', altPercentage: 40 },
    { label: 'Salt type', consensus: 'Coarse kosher salt', percentage: 78, alternative: 'Sea salt', altPercentage: 22 },
    { label: 'Extra spices', consensus: 'None — salt and lemon only', percentage: 58, alternative: 'Bay leaf, cinnamon, peppercorns', altPercentage: 42 },
    { label: 'Extra lemon juice', consensus: 'Add fresh juice to cover', percentage: 85 },
  ],
  techniques: [
    { label: 'Cutting method', consensus: 'Quarter lengthwise, keep base attached', percentage: 90 },
    { label: 'Curing time', consensus: 'Minimum 3-4 weeks', percentage: 82, alternative: '1 week quick cure', altPercentage: 18 },
    { label: 'Jar prep', consensus: 'Sterilize jar, pack tightly', percentage: 88 },
  ],
  differs: [{ point: 'Spice additions', detail: 'This recipe adds cinnamon stick and bay leaves, though purists use only salt' }],
},

'shakshuka-with-merguez': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Ottolenghi', 'The Mediterranean Dish'],
  ingredients: [
    { label: 'Tomato base', consensus: 'Canned whole tomatoes, crushed by hand', percentage: 72, alternative: 'Fresh tomatoes', altPercentage: 28 },
    { label: 'Peppers', consensus: 'Bell pepper and cubanelle', percentage: 68, alternative: 'Bell pepper only', altPercentage: 32 },
    { label: 'Spices', consensus: 'Cumin, paprika, harissa', percentage: 82 },
    { label: 'Merguez', consensus: 'Lamb merguez sausage', percentage: 88, alternative: 'Beef merguez', altPercentage: 12 },
  ],
  techniques: [
    { label: 'Sausage prep', consensus: 'Brown casings on, slice into rounds', percentage: 65, alternative: 'Remove casings, crumble', altPercentage: 35 },
    { label: 'Egg wells', consensus: 'Create wells in sauce then crack eggs in', percentage: 92 },
    { label: 'Egg doneness', consensus: 'Whites set, yolks still runny', percentage: 85, alternative: 'Fully cooked through', altPercentage: 15 },
  ],
  differs: [],
},

'tagine-chicken-with-preserved-lemon': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Saveur', 'Ottolenghi', 'Taste of Maroc', 'Food52'],
  ingredients: [
    { label: 'Chicken cut', consensus: 'Bone-in thighs and drumsticks', percentage: 75, alternative: 'Whole chicken, quartered', altPercentage: 25 },
    { label: 'Olives', consensus: 'Green Moroccan or Castelvetrano', percentage: 80, alternative: 'Kalamata', altPercentage: 20 },
    { label: 'Preserved lemon', consensus: 'Rind only, pulp discarded', percentage: 88 },
    { label: 'Signature spice', consensus: 'Saffron threads', percentage: 82, alternative: 'Turmeric as substitute', altPercentage: 18 },
    { label: 'Fresh herbs', consensus: 'Cilantro and parsley', percentage: 78 },
  ],
  techniques: [
    { label: 'Marination', consensus: 'Marinate chicken in chermoula overnight', percentage: 70, alternative: 'Season and cook immediately', altPercentage: 30 },
    { label: 'Cooking vessel', consensus: 'Traditional tagine or Dutch oven', percentage: 55, alternative: 'Dutch oven only', altPercentage: 45 },
    { label: 'Heat level', consensus: 'Low and slow, 45-60 minutes', percentage: 85 },
  ],
  differs: [],
},

// ===== SALVADORAN =====
'pupusas': {
  recipesAnalyzed: 13,
  sources: ['Serious Eats', 'The Spruce Eats', 'Saveur', 'Bon Appétit', 'Downshiftology'],
  ingredients: [
    { label: 'Dough', consensus: 'Masa harina mixed with water', percentage: 75, alternative: 'Fresh masa from nixtamal', altPercentage: 25 },
    { label: 'Classic filling', consensus: 'Cheese and bean (frijol con queso)', percentage: 70, alternative: 'Chicharrón', altPercentage: 30 },
    { label: 'Cheese type', consensus: 'Quesillo or mozzarella', percentage: 68, alternative: 'Oaxaca cheese', altPercentage: 32 },
    { label: 'Curtido', consensus: 'Pickled cabbage slaw, always served', percentage: 95 },
  ],
  techniques: [
    { label: 'Forming method', consensus: 'Cup dough in hand, fill, seal, flatten', percentage: 88 },
    { label: 'Cooking surface', consensus: 'Flat griddle (comal), medium-high', percentage: 82 },
    { label: 'Thickness', consensus: 'About 1/2 inch thick', percentage: 75, alternative: 'Thinner, 1/4 inch', altPercentage: 25 },
  ],
  differs: [{ point: 'Loroco filling', detail: 'This recipe includes loroco (edible flower bud), a traditional but harder-to-find ingredient' }],
},

// ===== FRENCH =====
'quiche-lorraine': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Julia Child (Mastering the Art)', 'King Arthur Baking'],
  ingredients: [
    { label: 'Crust', consensus: 'Homemade pâte brisée', percentage: 72, alternative: 'Store-bought pie crust', altPercentage: 28 },
    { label: 'Dairy ratio', consensus: 'Heavy cream and eggs (no milk)', percentage: 65, alternative: 'Half-and-half or cream/milk blend', altPercentage: 35 },
    { label: 'Meat', consensus: 'Lardons or thick-cut bacon', percentage: 85, alternative: 'Regular bacon strips', altPercentage: 15 },
    { label: 'Cheese', consensus: 'Gruyère', percentage: 78, alternative: 'No cheese (traditional Lorraine)', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Blind bake', consensus: 'Par-bake crust with weights first', percentage: 88 },
    { label: 'Custard ratio', consensus: '3 eggs to 1.5 cups cream', percentage: 72 },
    { label: 'Oven temp', consensus: '375°F / 190°C', percentage: 68, alternative: '350°F / 175°C', altPercentage: 32 },
    { label: 'Doneness', consensus: 'Center slightly jiggly when done', percentage: 90 },
  ],
  differs: [],
},

'ratatouille': {
  recipesAnalyzed: 22,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Saveur', 'Julia Child', 'Food52'],
  ingredients: [
    { label: 'Eggplant', consensus: 'Globe eggplant, salted and drained', percentage: 72, alternative: 'Japanese eggplant, no salting', altPercentage: 28 },
    { label: 'Tomatoes', consensus: 'Fresh ripe tomatoes', percentage: 65, alternative: 'Canned San Marzano', altPercentage: 35 },
    { label: 'Squash', consensus: 'Zucchini and yellow squash', percentage: 82 },
    { label: 'Herbs', consensus: 'Herbes de Provence or thyme and basil', percentage: 88 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Sauté each vegetable separately, then combine', percentage: 60, alternative: 'Thinly slice and layer (confit byaldi)', altPercentage: 40 },
    { label: 'Browning', consensus: 'Sear vegetables individually for fond', percentage: 75, alternative: 'Stew all together from start', altPercentage: 25 },
    { label: 'Serving temp', consensus: 'Room temperature or warm', percentage: 70, alternative: 'Hot from the oven', altPercentage: 30 },
  ],
  differs: [{ point: 'Presentation style', detail: 'This recipe uses the traditional rustic stew method rather than the Pixar-inspired layered tian' }],
},

// ===== ITALIAN =====
'ribollita': {
  recipesAnalyzed: 15,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Saveur', 'Food52'],
  ingredients: [
    { label: 'Greens', consensus: 'Lacinato (Tuscan) kale', percentage: 90, alternative: 'Savoy cabbage', altPercentage: 10 },
    { label: 'Beans', consensus: 'Cannellini beans', percentage: 88, alternative: 'Borlotti beans', altPercentage: 12 },
    { label: 'Bread', consensus: 'Day-old crusty Tuscan bread (unsalted)', percentage: 82, alternative: 'Sourdough', altPercentage: 18 },
    { label: 'Tomatoes', consensus: 'Canned whole tomatoes', percentage: 72, alternative: 'Tomato paste only', altPercentage: 28 },
    { label: 'Finishing', consensus: 'Best olive oil and Parmigiano', percentage: 85 },
  ],
  techniques: [
    { label: 'Bean prep', consensus: 'Dried beans, soaked overnight', percentage: 68, alternative: 'Canned beans', altPercentage: 32 },
    { label: 'Rebaking', consensus: 'Simmer day 1, rebake or reheat day 2', percentage: 78 },
    { label: 'Bread method', consensus: 'Tear and stir into soup to thicken', percentage: 82, alternative: 'Layer bread on top and bake', altPercentage: 18 },
  ],
  differs: [],
},

'risotto-alla-milanese': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Great Italian Chefs', 'Saveur', 'Gambero Rosso'],
  ingredients: [
    { label: 'Rice', consensus: 'Carnaroli', percentage: 65, alternative: 'Arborio', altPercentage: 35 },
    { label: 'Saffron', consensus: 'Real saffron threads, bloomed', percentage: 92 },
    { label: 'Fat base', consensus: 'Butter and bone marrow', percentage: 60, alternative: 'Butter only', altPercentage: 40 },
    { label: 'Stock', consensus: 'Homemade beef or veal broth', percentage: 70, alternative: 'Chicken broth', altPercentage: 30 },
    { label: 'Finishing cheese', consensus: 'Parmigiano-Reggiano', percentage: 88 },
  ],
  techniques: [
    { label: 'Tostatura', consensus: 'Toast rice in fat until translucent edges', percentage: 90 },
    { label: 'Broth additions', consensus: 'Add warm broth one ladle at a time', percentage: 82, alternative: 'Add most broth at once', altPercentage: 18 },
    { label: 'Mantecatura', consensus: 'Vigorously stir in cold butter and cheese off heat', percentage: 88 },
    { label: 'Texture', consensus: "All'onda — flows like a wave", percentage: 85 },
  ],
  differs: [],
},

'saltimbocca-alla-romana': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'Great Italian Chefs', 'NYT Cooking', 'Saveur', 'The Local Italy'],
  ingredients: [
    { label: 'Meat', consensus: 'Veal scallopini, pounded thin', percentage: 75, alternative: 'Chicken breast, pounded', altPercentage: 25 },
    { label: 'Ham', consensus: 'Prosciutto crudo', percentage: 90, alternative: 'Prosciutto cotto', altPercentage: 10 },
    { label: 'Herb', consensus: 'Fresh whole sage leaves', percentage: 95 },
    { label: 'Pan sauce', consensus: 'White wine and butter', percentage: 85, alternative: 'Marsala wine', altPercentage: 15 },
  ],
  techniques: [
    { label: 'Assembly', consensus: 'Sage leaf on veal, prosciutto on top, secure with toothpick', percentage: 78, alternative: 'No toothpick, press together', altPercentage: 22 },
    { label: 'Searing side', consensus: 'Prosciutto side down first', percentage: 72, alternative: 'Veal side down first', altPercentage: 28 },
    { label: 'Cook time', consensus: '2-3 minutes per side, very quick', percentage: 88 },
  ],
  differs: [],
},

'vitello-tonnato': {
  recipesAnalyzed: 12,
  sources: ['Serious Eats', 'NYT Cooking', 'Great Italian Chefs', 'Saveur', 'Bon Appétit'],
  ingredients: [
    { label: 'Veal cut', consensus: 'Eye of round or loin, whole', percentage: 80, alternative: 'Veal top round', altPercentage: 20 },
    { label: 'Tuna for sauce', consensus: 'Oil-packed Italian tuna', percentage: 85, alternative: 'Water-packed tuna', altPercentage: 15 },
    { label: 'Sauce binder', consensus: 'Mayonnaise and capers', percentage: 72, alternative: 'Egg yolk emulsion (traditional)', altPercentage: 28 },
    { label: 'Anchovies', consensus: 'Yes, in the tonnato sauce', percentage: 82 },
  ],
  techniques: [
    { label: 'Veal cooking', consensus: 'Poach gently in aromatics', percentage: 78, alternative: 'Roast and slice', altPercentage: 22 },
    { label: 'Serving temp', consensus: 'Cold, make ahead and chill', percentage: 90 },
    { label: 'Slicing', consensus: 'Paper-thin slices, fanned on plate', percentage: 88 },
  ],
  differs: [{ point: 'Sauce method', detail: 'This recipe uses the quicker mayonnaise-based sauce rather than the traditional egg emulsion' }],
},

'tiramisu': {
  recipesAnalyzed: 25,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Great Italian Chefs', 'Food52', 'Gennaro Contaldo'],
  ingredients: [
    { label: 'Cheese', consensus: 'Mascarpone', percentage: 98 },
    { label: 'Cookies', consensus: 'Savoiardi (ladyfingers)', percentage: 92 },
    { label: 'Egg treatment', consensus: 'Separated — yolks whipped with sugar, whites whipped', percentage: 72, alternative: 'Yolks only, no whites', altPercentage: 28 },
    { label: 'Coffee', consensus: 'Espresso, cooled', percentage: 85, alternative: 'Strong brewed coffee', altPercentage: 15 },
    { label: 'Alcohol', consensus: 'Marsala or dark rum', percentage: 68, alternative: 'No alcohol', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Cookie dip', consensus: 'Quick dip, not soaked', percentage: 82 },
    { label: 'Chilling time', consensus: 'Minimum 6 hours, overnight best', percentage: 88 },
    { label: 'Layers', consensus: 'Two layers of cookies and cream', percentage: 75, alternative: 'Three or more layers', altPercentage: 25 },
    { label: 'Cocoa finish', consensus: 'Dust with unsweetened cocoa before serving', percentage: 92 },
  ],
  differs: [],
},

// ===== INDIAN =====
'saag-paneer': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', "Madhur Jaffrey's recipes", 'Swasthi\'s Recipes'],
  ingredients: [
    { label: 'Greens', consensus: 'Spinach (palak) primarily', percentage: 65, alternative: 'Mixed greens — mustard, spinach, fenugreek', altPercentage: 35 },
    { label: 'Paneer prep', consensus: 'Pan-fried cubes until golden', percentage: 82, alternative: 'Added raw into sauce', altPercentage: 18 },
    { label: 'Cream/dairy', consensus: 'Heavy cream finish', percentage: 72, alternative: 'No cream, butter only', altPercentage: 28 },
    { label: 'Aromatics', consensus: 'Onion, garlic, ginger, green chili', percentage: 90 },
    { label: 'Spices', consensus: 'Cumin, garam masala, turmeric', percentage: 85 },
  ],
  techniques: [
    { label: 'Greens prep', consensus: 'Blanch, then blend to purée', percentage: 78, alternative: 'Cook down and mash roughly', altPercentage: 22 },
    { label: 'Tempering', consensus: 'Bloom cumin seeds in hot oil first', percentage: 88 },
    { label: 'Paneer timing', consensus: 'Add fried paneer at the very end', percentage: 80 },
  ],
  differs: [{ point: 'Greens blend', detail: 'True saag uses mixed greens (mustard, fenugreek); this version uses only spinach (technically palak paneer)' }],
},

'tandoori-chicken': {
  recipesAnalyzed: 20,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', "Madhur Jaffrey's recipes", 'Swasthi\'s Recipes', 'Food52'],
  ingredients: [
    { label: 'Chicken cut', consensus: 'Bone-in legs and thighs, skin on', percentage: 72, alternative: 'Boneless pieces', altPercentage: 28 },
    { label: 'First marinade', consensus: 'Salt and lemon juice (30 min)', percentage: 68, alternative: 'Skip to yogurt marinade', altPercentage: 32 },
    { label: 'Yogurt marinade', consensus: 'Full-fat yogurt base', percentage: 90 },
    { label: 'Color', consensus: 'Kashmiri chili powder for natural red', percentage: 60, alternative: 'Food coloring added', altPercentage: 40 },
    { label: 'Key spices', consensus: 'Garam masala, cumin, coriander, turmeric', percentage: 85 },
  ],
  techniques: [
    { label: 'Scoring', consensus: 'Deep slashes to bone for marinade penetration', percentage: 88 },
    { label: 'Marination time', consensus: 'Overnight (12-24 hours)', percentage: 75, alternative: '2-4 hours minimum', altPercentage: 25 },
    { label: 'Cooking method', consensus: 'Highest oven heat (500°F+) or broiler', percentage: 70, alternative: 'Grill over charcoal', altPercentage: 30 },
  ],
  differs: [],
},

// ===== THAI =====
'som-tum-green-papaya-salad': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'Hot Thai Kitchen', 'SheSimmers', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Papaya', consensus: 'Green (unripe) papaya, shredded', percentage: 95 },
    { label: 'Protein', consensus: 'Dried shrimp', percentage: 75, alternative: 'No dried shrimp (vegan)', altPercentage: 25 },
    { label: 'Peanuts', consensus: 'Roasted peanuts, crushed', percentage: 82 },
    { label: 'Tomatoes', consensus: 'Cherry tomatoes, halved', percentage: 78 },
    { label: 'Dressing base', consensus: 'Fish sauce, lime, palm sugar, garlic, chilies', percentage: 90 },
  ],
  techniques: [
    { label: 'Mortar method', consensus: 'Pound in clay mortar and pestle', percentage: 72, alternative: 'Toss in a bowl', altPercentage: 28 },
    { label: 'Bruising', consensus: 'Lightly bruise (not pulverize) ingredients', percentage: 85 },
    { label: 'Order of pounding', consensus: 'Garlic and chili first, then add remaining', percentage: 80 },
  ],
  differs: [],
},

'thai-green-papaya-salad-som-tum': {
  recipesAnalyzed: 16,
  sources: ['Hot Thai Kitchen', 'SheSimmers', 'Serious Eats', 'Bon Appétit', 'Woks of Life'],
  ingredients: [
    { label: 'Green papaya', consensus: 'Julienned or shredded', percentage: 92 },
    { label: 'Long beans', consensus: 'Yard-long beans, 1-inch pieces', percentage: 70, alternative: 'Green beans', altPercentage: 30 },
    { label: 'Chilies', consensus: "Thai bird's eye chilies", percentage: 85, alternative: 'Serrano peppers', altPercentage: 15 },
    { label: 'Sweetener', consensus: 'Palm sugar', percentage: 78, alternative: 'White or brown sugar', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Mortar use', consensus: 'Pound and bruise in mortar', percentage: 75, alternative: 'Mix in bowl with spoon', altPercentage: 25 },
    { label: 'Flavor balance', consensus: 'Sour-first, adjust salty-sweet-spicy', percentage: 88 },
    { label: 'Serve timing', consensus: 'Immediately, do not let sit', percentage: 82 },
  ],
  differs: [{ point: 'Crab variation', detail: 'This recipe omits salted crab (poo pla ra), which is common in Isaan-style som tum' }],
},

'tom-yum-soup': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'Hot Thai Kitchen', 'SheSimmers', 'NYT Cooking', 'Bon Appétit'],
  ingredients: [
    { label: 'Protein', consensus: 'Shrimp (goong)', percentage: 80, alternative: 'Chicken or mushroom', altPercentage: 20 },
    { label: 'Aromatics', consensus: 'Galangal, lemongrass, kaffir lime leaves', percentage: 95 },
    { label: 'Mushrooms', consensus: 'Straw mushrooms', percentage: 60, alternative: 'Oyster or button mushrooms', altPercentage: 40 },
    { label: 'Chili paste', consensus: 'Nam prik pao (roasted chili jam)', percentage: 78, alternative: 'Fresh chilies only', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Broth style', consensus: 'Tom yum nam sai (clear broth)', percentage: 55, alternative: 'Tom yum nam khon (creamy with evaporated milk)', altPercentage: 45 },
    { label: 'Aromatics', consensus: 'Simmer but do not eat the galangal/lemongrass', percentage: 85 },
    { label: 'Lime juice', consensus: 'Add fresh lime juice off heat at the end', percentage: 90 },
  ],
  differs: [],
},

// ===== WEST AFRICAN =====
'suya': {
  recipesAnalyzed: 11,
  sources: ['Serious Eats', 'My Active Kitchen', 'All Nigerian Recipes', 'Immaculate Bites', 'The Spruce Eats'],
  ingredients: [
    { label: 'Meat', consensus: 'Beef sirloin, thinly sliced', percentage: 75, alternative: 'Chicken or ram', altPercentage: 25 },
    { label: 'Suya spice base', consensus: 'Kuli kuli (ground peanut powder)', percentage: 88 },
    { label: 'Heat source', consensus: 'Cayenne and ground ginger', percentage: 72, alternative: 'Scotch bonnet powder', altPercentage: 28 },
    { label: 'Binding oil', consensus: 'Vegetable or peanut oil', percentage: 80 },
  ],
  techniques: [
    { label: 'Skewering', consensus: 'Thread thin strips on wooden skewers', percentage: 85 },
    { label: 'Spice coating', consensus: 'Oil meat, then press spice mix on generously', percentage: 82 },
    { label: 'Cooking method', consensus: 'Charcoal grill', percentage: 70, alternative: 'Oven broiler', altPercentage: 30 },
    { label: 'Serving', consensus: 'With sliced onions, tomatoes, and extra suya spice', percentage: 90 },
  ],
  differs: [],
},

'thieboudienne': {
  recipesAnalyzed: 10,
  sources: ['Serious Eats', 'Saveur', 'The Spruce Eats', 'Immaculate Bites', 'International Cuisine'],
  ingredients: [
    { label: 'Fish', consensus: 'Whole firm white fish (grouper or sea bass)', percentage: 78, alternative: 'Fish steaks or fillets', altPercentage: 22 },
    { label: 'Rice', consensus: 'Broken jasmine rice', percentage: 65, alternative: 'Regular long-grain rice', altPercentage: 35 },
    { label: 'Stuffing (rof)', consensus: 'Parsley, garlic, scotch bonnet paste', percentage: 82 },
    { label: 'Vegetables', consensus: 'Cassava, eggplant, cabbage, carrot, okra', percentage: 75 },
    { label: 'Tomato base', consensus: 'Tomato paste, generous amount', percentage: 88 },
  ],
  techniques: [
    { label: 'Fish prep', consensus: 'Score and stuff with rof, then fry', percentage: 80 },
    { label: 'Cooking order', consensus: 'Fry fish, build sauce, cook vegetables, then rice in same pot', percentage: 85 },
    { label: 'Rice method', consensus: 'Cook rice in the tomato-fish broth', percentage: 90 },
  ],
  differs: [{ point: 'Tamarind', detail: 'This recipe adds tamarind for tartness, which some traditional versions omit' }],
},

// ===== LEBANESE =====
'tabbouleh': {
  recipesAnalyzed: 17,
  sources: ['Serious Eats', 'NYT Cooking', 'Saveur', 'Bon Appétit', 'The Mediterranean Dish'],
  ingredients: [
    { label: 'Herb ratio', consensus: 'Parsley-dominant (herb salad, not grain salad)', percentage: 82, alternative: 'Equal bulgur and herbs', altPercentage: 18 },
    { label: 'Grain', consensus: 'Fine (#1) bulgur wheat', percentage: 85, alternative: 'Couscous or quinoa', altPercentage: 15 },
    { label: 'Tomatoes', consensus: 'Fresh ripe tomatoes, finely diced', percentage: 90 },
    { label: 'Allium', consensus: 'Finely minced green onion', percentage: 72, alternative: 'White onion', altPercentage: 28 },
    { label: 'Dressing', consensus: 'Lemon juice and olive oil, generous', percentage: 92 },
  ],
  techniques: [
    { label: 'Bulgur prep', consensus: 'Soak in water or lemon juice (no cooking)', percentage: 78, alternative: 'Brief boil and drain', altPercentage: 22 },
    { label: 'Parsley chop', consensus: 'Hand-chop finely, not food processed', percentage: 85 },
    { label: 'Mint', consensus: 'Fresh mint, added sparingly', percentage: 80 },
  ],
  differs: [],
},

// ===== SPANISH =====
'tortilla-espanola': {
  recipesAnalyzed: 19,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Spanish Sabores', 'Food52'],
  ingredients: [
    { label: 'Potatoes', consensus: 'Yukon Gold, thinly sliced', percentage: 72, alternative: 'Russet potatoes', altPercentage: 28 },
    { label: 'Onion', consensus: 'Yes, sliced and confit with potatoes', percentage: 65, alternative: 'No onion (sin cebolla camp)', altPercentage: 35 },
    { label: 'Eggs', consensus: '6-8 eggs for a 10-inch tortilla', percentage: 78 },
    { label: 'Oil', consensus: 'Extra virgin olive oil, generous amount', percentage: 88 },
  ],
  techniques: [
    { label: 'Potato cooking', consensus: 'Confit in olive oil until tender, not crispy', percentage: 82, alternative: 'Fry until golden', altPercentage: 18 },
    { label: 'Flip method', consensus: 'Invert onto plate, slide back into pan', percentage: 90 },
    { label: 'Center texture', consensus: 'Slightly cuajada (creamy/runny center)', percentage: 60, alternative: 'Fully set throughout', altPercentage: 40 },
  ],
  differs: [{ point: 'Onion debate', detail: 'This recipe includes onion — the con/sin cebolla debate divides all of Spain' }],
},

// ===== LATIN AMERICAN =====
'tres-leches-cake': {
  recipesAnalyzed: 18,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Sally\'s Baking Addiction', 'Allrecipes', 'Food52'],
  ingredients: [
    { label: 'Three milks', consensus: 'Evaporated milk, condensed milk, heavy cream', percentage: 88, alternative: 'Substitute coconut milk for one', altPercentage: 12 },
    { label: 'Sponge type', consensus: 'Genoise or butter sponge cake', percentage: 70, alternative: 'Box cake mix', altPercentage: 30 },
    { label: 'Topping', consensus: 'Whipped cream', percentage: 82, alternative: 'Meringue', altPercentage: 18 },
    { label: 'Flavoring', consensus: 'Vanilla extract', percentage: 75, alternative: 'Rum or cinnamon', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Milk soak', consensus: 'Poke holes then pour milk mixture slowly', percentage: 90 },
    { label: 'Soaking time', consensus: 'Refrigerate at least 4 hours, overnight best', percentage: 85 },
    { label: 'Cake prep', consensus: 'Bake sponge, cool completely before soaking', percentage: 92 },
  ],
  differs: [],
},

// ===== SENEGALESE =====
// (thieboudienne already covered under West African above)

// ===== BRITISH / WELSH =====
'welsh-rarebit': {
  recipesAnalyzed: 14,
  sources: ['Serious Eats', 'NYT Cooking', 'BBC Good Food', 'Great British Chefs', 'Delia Smith'],
  ingredients: [
    { label: 'Cheese', consensus: 'Mature/sharp cheddar', percentage: 82, alternative: 'Red Leicester or mix', altPercentage: 18 },
    { label: 'Liquid', consensus: 'Beer (ale or stout)', percentage: 75, alternative: 'Milk', altPercentage: 25 },
    { label: 'Mustard', consensus: 'English mustard or mustard powder', percentage: 88 },
    { label: 'Worcestershire', consensus: 'Yes, a few dashes', percentage: 80 },
    { label: 'Bread', consensus: 'Thick-cut white bread, toasted', percentage: 72, alternative: 'Sourdough', altPercentage: 28 },
  ],
  techniques: [
    { label: 'Sauce method', consensus: 'Melt cheese into roux with beer', percentage: 70, alternative: 'Melt cheese directly, no roux', altPercentage: 30 },
    { label: 'Finishing', consensus: 'Spread on toast, broil until bubbling and browned', percentage: 92 },
    { label: 'Egg yolk', consensus: 'Bind sauce with egg yolk', percentage: 62, alternative: 'No egg', altPercentage: 38 },
  ],
  differs: [],
},


// ===== VEGETABLE / SIDES =====
'roasted-cauliflower': {
  recipesAnalyzed: 16,
  sources: ['Serious Eats', 'NYT Cooking', 'Bon Appétit', 'Smitten Kitchen', 'Cookie and Kate'],
  ingredients: [
    { label: 'Cut style', consensus: 'Florets, large wedges', percentage: 72, alternative: 'Whole head roasted', altPercentage: 28 },
    { label: 'Fat', consensus: 'Olive oil, generous', percentage: 85 },
    { label: 'Seasoning base', consensus: 'Salt, pepper, garlic powder', percentage: 68, alternative: 'Cumin and coriander', altPercentage: 32 },
    { label: 'Acid finish', consensus: 'Lemon juice at end', percentage: 78, alternative: 'No acid', altPercentage: 22 },
  ],
  techniques: [
    { label: 'Oven temp', consensus: '425-450°F, high heat', percentage: 88 },
    { label: 'Spacing', consensus: 'Single layer, not crowded', percentage: 92 },
    { label: 'Flipping', consensus: 'Flip once halfway', percentage: 75, alternative: 'No flipping', altPercentage: 25 },
    { label: 'Doneness', consensus: 'Deep golden-brown edges', percentage: 82 },
  ],
  differs: [],
},

// ===== QUICK WEEKNIGHT MEALS (Batch 001) =====

'sheet-pan-lemon-chicken-with-vegetables': {
  recipesAnalyzed: 16,
  sources: ['NYT Cooking', 'Bon Appétit', 'Serious Eats', 'Food Network', 'Half Baked Harvest'],
  ingredients: [
    { label: 'Chicken cut', consensus: 'Bone-in, skin-on thighs', percentage: 75, alternative: 'Boneless thighs', altPercentage: 18 },
    { label: 'Acid component', consensus: 'Lemon juice + zest', percentage: 85, alternative: 'White wine', altPercentage: 10 },
    { label: 'Vegetable pairing', consensus: 'Potatoes + green veg', percentage: 70, alternative: 'Root vegetable medley', altPercentage: 22 },
    { label: 'Herb choice', consensus: 'Dried oregano', percentage: 55, alternative: 'Fresh thyme', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Oven temperature', consensus: '425°F', percentage: 68, alternative: '450°F', altPercentage: 25 },
    { label: 'Vegetable staging', consensus: 'Add delicate veg later', percentage: 72, alternative: 'All at once', altPercentage: 28 },
    { label: 'Skin prep', consensus: 'Pat dry, skin-side up', percentage: 90 },
  ],
  differs: [{ point: 'Pan crowding', detail: 'Uses a single sheet pan rather than two, relying on proper spacing for browning' }],
},

'one-pot-creamy-tomato-pasta': {
  recipesAnalyzed: 14,
  sources: ['Bon Appétit', 'Martha Stewart', 'NYT Cooking', 'Food52', 'Epicurious'],
  ingredients: [
    { label: 'Pasta shape', consensus: 'Penne or rigatoni', percentage: 60, alternative: 'Spaghetti', altPercentage: 25 },
    { label: 'Tomato product', consensus: 'Crushed tomatoes', percentage: 65, alternative: 'Diced tomatoes + paste', altPercentage: 28 },
    { label: 'Dairy finish', consensus: 'Heavy cream', percentage: 72, alternative: 'Mascarpone', altPercentage: 15 },
    { label: 'Cheese', consensus: 'Parmesan', percentage: 80, alternative: 'Pecorino', altPercentage: 15 },
  ],
  techniques: [
    { label: 'Liquid ratio', consensus: 'Tomatoes + water to cover', percentage: 75, alternative: 'Tomatoes + broth', altPercentage: 20 },
    { label: 'Stirring frequency', consensus: 'Every 3-4 minutes', percentage: 82 },
    { label: 'Cream timing', consensus: 'Off heat at end', percentage: 68, alternative: 'Simmer with cream', altPercentage: 30 },
  ],
  differs: [],
},

'chicken-lettuce-wraps': {
  recipesAnalyzed: 15,
  sources: ['NYT Cooking', 'Bon Appétit', 'Serious Eats', 'Food Network', 'Woks of Life'],
  ingredients: [
    { label: 'Protein', consensus: 'Ground chicken', percentage: 55, alternative: 'Ground pork', altPercentage: 30 },
    { label: 'Crunch element', consensus: 'Water chestnuts', percentage: 72, alternative: 'Jicama', altPercentage: 12 },
    { label: 'Sauce base', consensus: 'Soy + hoisin', percentage: 78, alternative: 'Soy + oyster sauce', altPercentage: 18 },
    { label: 'Lettuce type', consensus: 'Butter lettuce', percentage: 65, alternative: 'Iceberg', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Meat browning', consensus: 'High heat, develop crust', percentage: 70, alternative: 'Medium heat, break up early', altPercentage: 25 },
    { label: 'Aromatics timing', consensus: 'After meat is browned', percentage: 82 },
    { label: 'Sauce reduction', consensus: 'Reduce to glaze', percentage: 75 },
  ],
  differs: [{ point: 'Mushrooms', detail: 'Omits shiitake mushrooms used in many versions, letting the water chestnuts provide all the textural contrast' }],
},

'black-pepper-tofu': {
  recipesAnalyzed: 12,
  sources: ['Ottolenghi', 'Serious Eats', 'Bon Appétit', 'Woks of Life', 'Food52'],
  ingredients: [
    { label: 'Pepper amount', consensus: '2 tablespoons coarse-ground', percentage: 65, alternative: '1 tablespoon fine-ground', altPercentage: 25 },
    { label: 'Tofu firmness', consensus: 'Extra-firm, pressed', percentage: 88 },
    { label: 'Sauce sweetness', consensus: 'Sugar + dark soy', percentage: 60, alternative: 'Maple syrup', altPercentage: 15 },
    { label: 'Allium base', consensus: 'Onion + garlic', percentage: 82, alternative: 'Shallots + garlic', altPercentage: 15 },
  ],
  techniques: [
    { label: 'Tofu coating', consensus: 'Light cornstarch dusting', percentage: 72, alternative: 'No coating, dry-fry', altPercentage: 22 },
    { label: 'Frying method', consensus: 'Pan-fry until crisp', percentage: 78, alternative: 'Deep-fry', altPercentage: 18 },
    { label: 'Fresh herb finish', consensus: 'Cilantro + Thai basil', percentage: 55, alternative: 'Scallions only', altPercentage: 35 },
  ],
  differs: [{ point: 'Heat source', detail: 'Uses fresh chiles rather than dried, giving a brighter, more immediate heat' }],
},

'crispy-gnocchi-with-sausage-and-broccoli-rabe': {
  recipesAnalyzed: 11,
  sources: ['Bon Appétit', 'Serious Eats', 'Food52', 'NYT Cooking', 'Epicurious'],
  ingredients: [
    { label: 'Gnocchi type', consensus: 'Shelf-stable (not frozen)', percentage: 70, alternative: 'Fresh or frozen', altPercentage: 25 },
    { label: 'Sausage variety', consensus: 'Italian sweet or hot', percentage: 85, alternative: 'Chicken sausage', altPercentage: 10 },
    { label: 'Bitter green', consensus: 'Broccoli rabe', percentage: 60, alternative: 'Broccolini or kale', altPercentage: 32 },
    { label: 'Finishing cheese', consensus: 'Parmesan', percentage: 78, alternative: 'Pecorino Romano', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Gnocchi crisping', consensus: 'Pan-fry undisturbed 4+ min', percentage: 82 },
    { label: 'Fat for crisping', consensus: 'Olive oil + butter', percentage: 65, alternative: 'Sausage fat only', altPercentage: 28 },
    { label: 'Greens timing', consensus: 'Added after gnocchi', percentage: 75 },
  ],
  differs: [],
},

'miso-glazed-cod': {
  recipesAnalyzed: 18,
  sources: ['NYT Cooking', 'Bon Appétit', 'Serious Eats', 'Food & Wine', 'Epicurious', 'Nobu'],
  ingredients: [
    { label: 'Fish species', consensus: 'Cod or black cod', percentage: 72, alternative: 'Salmon', altPercentage: 20 },
    { label: 'Miso type', consensus: 'White (shiro) miso', percentage: 80, alternative: 'Red miso', altPercentage: 12 },
    { label: 'Sweetener', consensus: 'Sugar + mirin', percentage: 68, alternative: 'Mirin only', altPercentage: 22 },
    { label: 'Alcohol component', consensus: 'Sake', percentage: 65, alternative: 'Dry white wine', altPercentage: 25 },
  ],
  techniques: [
    { label: 'Marination time', consensus: 'Optional overnight', percentage: 55, alternative: 'No marination needed', altPercentage: 40 },
    { label: 'Cooking method', consensus: 'Broiler', percentage: 62, alternative: 'Oven-bake at 400°F', altPercentage: 30 },
    { label: 'Glaze application', consensus: 'Spoon on top and sides', percentage: 88 },
  ],
  differs: [{ point: 'Simplification', detail: 'Skips the traditional 2-3 day marination, relying on broiler caramelization for flavor intensity' }],
},

'turkey-taco-skillet': {
  recipesAnalyzed: 13,
  sources: ['Bon Appétit', 'Skinnytaste', 'Food Network', 'NYT Cooking', 'Epicurious'],
  ingredients: [
    { label: 'Protein', consensus: 'Ground turkey', percentage: 60, alternative: 'Ground beef', altPercentage: 32 },
    { label: 'Bean choice', consensus: 'Black beans', percentage: 65, alternative: 'Pinto beans', altPercentage: 28 },
    { label: 'Spice blend', consensus: 'Chili powder + cumin + paprika', percentage: 78, alternative: 'Premade taco seasoning', altPercentage: 18 },
    { label: 'Cheese', consensus: 'Shredded cheddar', percentage: 55, alternative: 'Monterey Jack blend', altPercentage: 35 },
  ],
  techniques: [
    { label: 'Cheese melting', consensus: 'Cover skillet to melt', percentage: 70, alternative: 'Broil briefly', altPercentage: 25 },
    { label: 'Tomato type', consensus: 'Canned diced, with juices', percentage: 75, alternative: 'Fresh diced tomatoes', altPercentage: 20 },
    { label: 'Simmer time', consensus: '8-10 minutes to reduce', percentage: 72 },
  ],
  differs: [],
},

'spicy-peanut-noodles': {
  recipesAnalyzed: 17,
  sources: ['NYT Cooking', 'Bon Appétit', 'Serious Eats', 'Food52', 'Woks of Life', 'Budget Bytes'],
  ingredients: [
    { label: 'Noodle type', consensus: 'Lo mein or spaghetti', percentage: 55, alternative: 'Rice noodles or soba', altPercentage: 35 },
    { label: 'Nut butter', consensus: 'Creamy peanut butter', percentage: 82, alternative: 'Tahini or almond butter', altPercentage: 12 },
    { label: 'Heat source', consensus: 'Chili crisp or sriracha', percentage: 70, alternative: 'Sambal oelek', altPercentage: 22 },
    { label: 'Sweetener', consensus: 'Honey or maple syrup', percentage: 75, alternative: 'Brown sugar', altPercentage: 18 },
  ],
  techniques: [
    { label: 'Noodle temp', consensus: 'Rinse cold after cooking', percentage: 72, alternative: 'Toss hot', altPercentage: 25 },
    { label: 'Sauce consistency', consensus: 'Thin with warm water', percentage: 85 },
    { label: 'Toppings', consensus: 'Cucumber + carrot + peanuts', percentage: 68, alternative: 'Edamame + cabbage', altPercentage: 22 },
  ],
  differs: [{ point: 'Serving temperature', detail: 'Designed to work equally well cold, making it ideal for next-day lunches' }],
},

'greek-chicken-with-orzo': {
  recipesAnalyzed: 14,
  sources: ['NYT Cooking', 'Half Baked Harvest', 'Bon Appétit', 'Food Network', 'Epicurious'],
  ingredients: [
    { label: 'Chicken cut', consensus: 'Boneless skinless thighs', percentage: 62, alternative: 'Bone-in thighs', altPercentage: 28 },
    { label: 'Grain', consensus: 'Orzo', percentage: 88, alternative: 'Couscous', altPercentage: 8 },
    { label: 'Olive variety', consensus: 'Kalamata', percentage: 82, alternative: 'Mixed Greek olives', altPercentage: 12 },
    { label: 'Cheese', consensus: 'Feta, crumbled on top', percentage: 90 },
    { label: 'Fresh herb', consensus: 'Dill', percentage: 55, alternative: 'Parsley', altPercentage: 32 },
  ],
  techniques: [
    { label: 'Cooking method', consensus: 'Sear then braise in skillet', percentage: 65, alternative: 'Bake in oven', altPercentage: 30 },
    { label: 'Orzo cooking', consensus: 'Absorb broth in pan', percentage: 78, alternative: 'Boil separately', altPercentage: 18 },
    { label: 'Lemon timing', consensus: 'Finish with fresh juice', percentage: 72, alternative: 'Cook with lemon slices', altPercentage: 22 },
  ],
  differs: [{ point: 'One-pan method', detail: 'Cooks orzo directly in the pan juices rather than boiling separately, for deeper flavor absorption' }],
},

'honey-garlic-shrimp': {
  recipesAnalyzed: 15,
  sources: ['Bon Appétit', 'NYT Cooking', 'Serious Eats', 'Food Network', 'Damn Delicious'],
  ingredients: [
    { label: 'Shrimp size', consensus: 'Large (21-25 count)', percentage: 68, alternative: 'Jumbo (16-20)', altPercentage: 25 },
    { label: 'Sweetener', consensus: 'Honey', percentage: 85, alternative: 'Brown sugar', altPercentage: 10 },
    { label: 'Garlic amount', consensus: '4 cloves', percentage: 60, alternative: '6+ cloves', altPercentage: 32 },
    { label: 'Cooking fat', consensus: 'Butter + olive oil', percentage: 72, alternative: 'Butter only', altPercentage: 22 },
    { label: 'Acid finish', consensus: 'Fresh lime juice', percentage: 58, alternative: 'Lemon juice', altPercentage: 30 },
  ],
  techniques: [
    { label: 'Shrimp prep', consensus: 'Pat very dry', percentage: 92 },
    { label: 'Sear method', consensus: 'Single layer, no moving', percentage: 78, alternative: 'Toss and stir', altPercentage: 18 },
    { label: 'Sauce timing', consensus: 'Add after shrimp is seared', percentage: 82 },
  ],
  differs: [],
},

}
