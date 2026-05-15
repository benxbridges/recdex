/**
 * Import 50 vegetarian Bon Appétit recipes into Supabase
 * Usage: npx tsx scripts/import-ba-vegetarian.ts
 */

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://zacwsrcdvpglrcvirlng.supabase.co'
const SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY
if (!SERVICE_KEY) {
  console.error('SUPABASE_SERVICE_KEY env var is required. Add it to .env.local before running this script.')
  process.exit(1)
}

interface Ingredient {
  name: string
  amount: string
  unit: string
  notes: string
}

interface Step {
  step: number
  text: string
  timer_minutes: number | null
}

interface Recipe {
  title: string
  slug: string
  description: string
  cuisine: string
  category_id: string
  difficulty: string
  time_total: number
  time_active: number
  time_passive: number | null
  time_passive_label: string | null
  servings: number
  servings_label: string
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
  source_url: string
  source_attribution: string
  image_url: string | null
  source: string
  status: string
}

function makeSteps(texts: string[], timers?: (number | null)[]): Step[] {
  return texts.map((text, i) => ({
    step: i + 1,
    text,
    timer_minutes: timers?.[i] ?? null,
  }))
}

function i(name: string, amount: string, unit: string, notes = ""): Ingredient {
  return { name, amount, unit, notes }
}

function recipe(
  title: string,
  slug: string,
  description: string,
  cuisine: string,
  category_id: string,
  difficulty: string,
  time_active: number,
  time_passive: number | null,
  time_passive_label: string | null,
  servings: number,
  servings_label: string,
  ingredients: Ingredient[],
  stepTexts: string[],
  stepTimers: (number | null)[],
  tags: string[],
  source_url: string,
): Recipe {
  return {
    title,
    slug,
    description,
    cuisine,
    category_id,
    difficulty,
    time_total: time_active + (time_passive ?? 0),
    time_active,
    time_passive,
    time_passive_label,
    servings,
    servings_label,
    ingredients,
    steps: makeSteps(stepTexts, stepTimers),
    tags: ["vegetarian", ...tags],
    source_url,
    source_attribution: "Bon Appétit",
    image_url: null,
    source: "bon_appetit",
    status: "published",
  }
}

const recipes: Recipe[] = [
  // 1. Cacio e Pepe
  recipe(
    "BA's Best Cacio e Pepe", "ba-cacio-e-pepe",
    "The classic Roman pasta with sharp Pecorino Romano and freshly cracked black pepper, creating a creamy sauce with just pasta water and cheese.",
    "Italian", "italian", "medium", 20, null, null, 4, "4 servings",
    [i("spaghetti or tonnarelli","1","lb"), i("Pecorino Romano","2","cups","finely grated"), i("black pepper","1.5","tbsp","freshly cracked"), i("kosher salt","1","tbsp","for pasta water")],
    [
      "Bring a large pot of salted water to a boil. Cook pasta until 2 minutes short of al dente, reserving 2 cups pasta water before draining.",
      "Toast the cracked black pepper in a large dry skillet over medium heat until fragrant, about 1 minute.",
      "Add 1 cup of pasta water to the skillet and bring to a simmer. Add the drained pasta and toss constantly, adding more pasta water as needed.",
      "Remove from heat and gradually add the Pecorino Romano, tossing vigorously to create a creamy emulsion. Add more pasta water if the sauce is too thick.",
      "Serve immediately with extra Pecorino and black pepper on top."
    ],
    [null, 1, null, null, null],
    ["pasta", "italian", "quick", "comfort-food"],
    "https://www.bonappetit.com/recipe/cacio-e-pepe"
  ),

  // 2. Pasta al Limone
  recipe(
    "BA's Pasta al Limone", "ba-pasta-al-limone",
    "A bright and creamy lemon pasta made with butter, Parmesan, and loads of fresh lemon zest and juice.",
    "Italian", "italian", "easy", 25, null, null, 4, "4 servings",
    [i("spaghetti","1","lb"), i("unsalted butter","4","tbsp"), i("Parmesan","1.5","cups","finely grated"), i("lemons","3","","zested and juiced"), i("heavy cream","0.5","cup"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp","freshly ground"), i("fresh basil","0.25","cup","torn, for serving")],
    [
      "Cook spaghetti in well-salted boiling water until 2 minutes short of al dente. Reserve 1.5 cups pasta water.",
      "Melt butter in a large skillet over medium heat. Add the lemon zest and cook 30 seconds until fragrant.",
      "Add cream and 1 cup pasta water, bring to a simmer. Add the drained pasta and toss to coat.",
      "Remove from heat, add lemon juice and Parmesan, tossing until a glossy sauce forms. Add more pasta water as needed.",
      "Season with salt and pepper. Serve topped with torn basil and extra Parmesan."
    ],
    [null, null, null, null, null],
    ["pasta", "italian", "quick", "lemon"],
    "https://www.bonappetit.com/recipe/pasta-al-limone"
  ),

  // 3. Creamy Baked Mushroom Pasta
  recipe(
    "Creamy Baked Pasta with Mushrooms", "ba-creamy-baked-pasta-mushrooms",
    "A rich, cheesy baked pasta loaded with sautéed mushrooms, fresh thyme, and melty Gruyère cheese.",
    "American", "american", "medium", 30, 20, "baking", 6, "6 servings",
    [i("rigatoni","1","lb"), i("mixed mushrooms","1.5","lbs","cremini and shiitake, sliced"), i("Gruyère cheese","2","cups","grated"), i("heavy cream","1.5","cups"), i("unsalted butter","3","tbsp"), i("garlic","4","cloves","minced"), i("fresh thyme","1","tbsp","leaves only"), i("Parmesan","0.5","cup","grated"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp"), i("olive oil","2","tbsp")],
    [
      "Preheat the oven to 400°F. Cook rigatoni until al dente, drain, and set aside.",
      "Heat olive oil and butter in a large oven-safe skillet over medium-high heat. Add mushrooms and cook until golden, about 8 minutes. Add garlic and thyme, cook 1 minute more.",
      "Add cream, 1 cup Gruyère, and Parmesan. Stir until cheese melts. Season with salt and pepper.",
      "Toss pasta into the sauce. Top with remaining Gruyère.",
      "Bake until bubbly and golden on top, about 20 minutes. Let rest 5 minutes before serving."
    ],
    [null, 8, null, null, 20],
    ["pasta", "baked", "mushroom", "comfort-food", "cheese"],
    "https://www.bonappetit.com/recipe/baked-pasta-with-mushrooms"
  ),

  // 4. Penne alla Vodka
  recipe(
    "Penne alla Vodka", "ba-penne-alla-vodka",
    "Silky tomato-cream sauce with a hit of vodka that deepens the flavor, tossed with penne and finished with Parmesan.",
    "Italian", "italian", "easy", 35, null, null, 4, "4 servings",
    [i("penne rigate","1","lb"), i("crushed tomatoes","1","28-oz can"), i("vodka","0.5","cup"), i("heavy cream","0.75","cup"), i("unsalted butter","3","tbsp"), i("garlic","3","cloves","minced"), i("red pepper flakes","0.5","tsp"), i("Parmesan","1","cup","grated"), i("olive oil","2","tbsp"), i("fresh basil","0.25","cup","for garnish"), i("kosher salt","1","tsp")],
    [
      "Heat olive oil and butter in a large skillet over medium heat. Add garlic and red pepper flakes, cook 1 minute.",
      "Add vodka and cook until reduced by half, about 2 minutes. Add crushed tomatoes and simmer 15 minutes.",
      "Meanwhile, cook penne in salted boiling water until al dente. Reserve 1 cup pasta water.",
      "Stir cream into the sauce and simmer 2 minutes. Season with salt.",
      "Add drained pasta and half the Parmesan, toss with pasta water as needed to coat. Serve with remaining Parmesan and fresh basil."
    ],
    [1, 15, null, 2, null],
    ["pasta", "italian", "comfort-food", "tomato"],
    "https://www.bonappetit.com/recipe/penne-alla-vodka"
  ),

  // 5. Lemony Broccoli Pasta
  recipe(
    "Lemony Broccoli Pasta", "ba-lemony-broccoli-pasta",
    "Tender broccoli florets melt into a bright, lemony Parmesan sauce that clings to every strand of pasta.",
    "Italian", "italian", "easy", 30, null, null, 4, "4 servings",
    [i("orecchiette","1","lb"), i("broccoli","2","heads","cut into small florets"), i("garlic","4","cloves","thinly sliced"), i("lemon","2","","zested and juiced"), i("Parmesan","1","cup","finely grated"), i("red pepper flakes","0.5","tsp"), i("olive oil","0.25","cup"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Cook orecchiette in well-salted boiling water, adding broccoli florets in the last 3 minutes. Reserve 1.5 cups pasta water, then drain.",
      "Heat olive oil in a large skillet over medium heat. Add garlic and red pepper flakes, cook until garlic is golden, about 2 minutes.",
      "Add 1 cup pasta water and bring to a simmer. Add pasta and broccoli, toss to combine.",
      "Remove from heat, add lemon zest, lemon juice, and Parmesan. Toss until a creamy sauce forms, adding more pasta water as needed.",
      "Season with salt and pepper. Serve with extra Parmesan and a drizzle of olive oil."
    ],
    [null, 2, null, null, null],
    ["pasta", "broccoli", "quick", "lemon"],
    "https://www.bonappetit.com/recipe/lemony-broccoli-pasta"
  ),

  // 6. Crispy Rice Bowl with Gochujang
  recipe(
    "Crispy Rice Bowl with Gochujang", "ba-crispy-rice-bowl-gochujang",
    "Shatteringly crispy rice topped with marinated vegetables, a fried egg, and a sweet-spicy gochujang sauce.",
    "Korean", "korean", "medium", 45, null, null, 4, "4 servings",
    [i("short-grain rice","2","cups","cooked and cooled"), i("gochujang","3","tbsp"), i("rice vinegar","2","tbsp"), i("sesame oil","2","tbsp"), i("soy sauce","1","tbsp"), i("honey","1","tbsp"), i("Persian cucumbers","3","","thinly sliced"), i("carrots","2","","julienned"), i("avocado","1","","sliced"), i("eggs","4",""), i("vegetable oil","3","tbsp"), i("sesame seeds","1","tbsp"), i("scallions","3","","thinly sliced")],
    [
      "Whisk together gochujang, rice vinegar, 1 tbsp sesame oil, soy sauce, and honey in a small bowl for the sauce.",
      "Toss cucumbers and carrots with a little rice vinegar and sesame oil. Set aside.",
      "Heat vegetable oil in a large nonstick skillet over medium-high heat. Press cooled rice into the pan in an even layer. Cook without stirring until bottom is deeply golden and crispy, about 8 minutes.",
      "Fry eggs in a separate pan with remaining sesame oil until whites are set but yolks are runny.",
      "Divide crispy rice among bowls. Top with marinated vegetables, avocado, fried egg, gochujang sauce, sesame seeds, and scallions."
    ],
    [null, null, 8, null, null],
    ["korean", "rice", "spicy", "grain-bowl"],
    "https://www.bonappetit.com/recipe/crispy-rice-bowl"
  ),

  // 7. Kale Caesar Salad
  recipe(
    "Kale Caesar Salad", "ba-kale-caesar-salad",
    "A hearty twist on the classic Caesar using tender Tuscan kale massaged with a bold, garlicky, anchovy-free dressing.",
    "American", "american", "easy", 25, null, null, 4, "4 servings",
    [i("Tuscan kale","2","bunches","stems removed, leaves torn"), i("Parmesan","1","cup","finely grated, plus shaved for topping"), i("garlic","2","cloves"), i("Dijon mustard","1","tbsp"), i("lemon juice","3","tbsp"), i("capers","1","tbsp","drained"), i("olive oil","0.5","cup"), i("egg yolk","1",""), i("crusty bread","3","cups","torn into crouton-sized pieces"), i("kosher salt","0.5","tsp"), i("black pepper","0.25","tsp")],
    [
      "Preheat the oven to 400°F. Toss bread pieces with 2 tbsp olive oil and a pinch of salt. Bake until golden and crunchy, about 10 minutes.",
      "Blend garlic, egg yolk, lemon juice, Dijon, capers, and a pinch of salt in a food processor. With motor running, slowly drizzle in remaining olive oil until emulsified.",
      "Stir in half the grated Parmesan. Season dressing with salt and pepper.",
      "Massage kale with a small amount of dressing until leaves soften, about 2 minutes. Add remaining dressing and toss.",
      "Top with croutons, shaved Parmesan, and freshly cracked pepper."
    ],
    [10, null, null, null, null],
    ["salad", "kale", "caesar"],
    "https://www.bonappetit.com/recipe/kale-caesar-salad"
  ),

  // 8. Farro Salad with Roasted Vegetables
  recipe(
    "Farro Salad with Roasted Vegetables", "ba-farro-salad-roasted-vegetables",
    "Chewy farro tossed with roasted butternut squash, red onion, dried cranberries, and a tangy apple cider vinaigrette.",
    "Mediterranean", "vegetarian", "easy", 20, 30, "roasting", 6, "6 servings",
    [i("farro","1.5","cups"), i("butternut squash","1","small","peeled and cubed"), i("red onion","1","","cut into wedges"), i("dried cranberries","0.5","cup"), i("pecans","0.5","cup","toasted and roughly chopped"), i("feta cheese","0.5","cup","crumbled"), i("arugula","2","cups"), i("apple cider vinegar","3","tbsp"), i("olive oil","0.33","cup"), i("Dijon mustard","1","tsp"), i("maple syrup","1","tbsp"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Preheat the oven to 425°F. Toss butternut squash and red onion with 2 tbsp olive oil, salt, and pepper. Roast until caramelized, about 30 minutes.",
      "Meanwhile, cook farro in salted boiling water until tender but chewy, about 25 minutes. Drain and let cool slightly.",
      "Whisk together apple cider vinegar, remaining olive oil, Dijon mustard, and maple syrup for the vinaigrette.",
      "Toss farro with roasted vegetables, arugula, cranberries, and vinaigrette.",
      "Top with crumbled feta and toasted pecans. Serve warm or at room temperature."
    ],
    [30, 25, null, null, null],
    ["grain-bowl", "salad", "farro", "fall"],
    "https://www.bonappetit.com/recipe/farro-salad-roasted-vegetables"
  ),

  // 9. Classic Minestrone
  recipe(
    "BA's Classic Minestrone", "ba-classic-minestrone",
    "A hearty Italian vegetable soup loaded with beans, pasta, and fresh vegetables simmered in a tomato-herb broth.",
    "Italian", "italian", "easy", 25, 40, "simmering", 8, "8 servings",
    [i("olive oil","3","tbsp"), i("onion","1","large","diced"), i("celery","3","stalks","diced"), i("carrots","2","","diced"), i("garlic","4","cloves","minced"), i("crushed tomatoes","1","28-oz can"), i("vegetable broth","6","cups"), i("cannellini beans","1","15-oz can","drained and rinsed"), i("ditalini pasta","1","cup"), i("zucchini","1","medium","diced"), i("green beans","1","cup","cut into 1-inch pieces"), i("Parmesan rind","1","piece"), i("dried oregano","1","tsp"), i("red pepper flakes","0.25","tsp"), i("kosher salt","1","tsp"), i("Parmesan","0.5","cup","grated, for serving")],
    [
      "Heat olive oil in a large Dutch oven over medium heat. Add onion, celery, and carrots. Cook until softened, about 8 minutes.",
      "Add garlic, oregano, and red pepper flakes. Cook 1 minute until fragrant.",
      "Add crushed tomatoes, vegetable broth, and Parmesan rind. Bring to a boil, then reduce to a simmer.",
      "Add cannellini beans, zucchini, and green beans. Simmer 20 minutes.",
      "Add ditalini and cook until pasta is tender, about 10 minutes more. Remove Parmesan rind.",
      "Season with salt and pepper. Serve with grated Parmesan and a drizzle of olive oil."
    ],
    [8, 1, null, 20, 10, null],
    ["soup", "italian", "comfort-food", "beans"],
    "https://www.bonappetit.com/recipe/classic-minestrone"
  ),

  // 10. Tortilla Soup
  recipe(
    "Vegetarian Tortilla Soup", "ba-vegetarian-tortilla-soup",
    "A smoky, deeply flavored vegetarian tortilla soup with charred tomatoes, crispy tortilla strips, and all the fixings.",
    "Mexican", "mexican", "medium", 20, 30, "roasting and simmering", 6, "6 servings",
    [i("plum tomatoes","6","","halved"), i("onion","1","large","quartered"), i("garlic","4","cloves"), i("jalapeño","1","","halved and seeded"), i("vegetable broth","6","cups"), i("corn tortillas","8","","cut into strips"), i("black beans","1","15-oz can","drained and rinsed"), i("corn kernels","1","cup"), i("cumin","1","tsp"), i("chili powder","1","tsp"), i("lime","2","","juiced"), i("avocado","1","","diced"), i("sour cream","0.5","cup"), i("fresh cilantro","0.25","cup"), i("vegetable oil","0.25","cup"), i("kosher salt","1","tsp")],
    [
      "Preheat the oven to 450°F. Place tomatoes, onion, garlic, and jalapeño on a baking sheet. Drizzle with oil and roast until charred, about 20 minutes.",
      "Meanwhile, fry half the tortilla strips in oil until crispy. Drain on paper towels and season with salt.",
      "Blend the charred vegetables with 2 cups broth until smooth. Pour into a large pot with remaining broth.",
      "Add cumin, chili powder, remaining tortilla strips (they'll thicken the soup), black beans, and corn. Simmer 15 minutes.",
      "Stir in lime juice. Serve topped with crispy tortilla strips, avocado, sour cream, and cilantro."
    ],
    [20, null, null, 15, null],
    ["soup", "mexican", "spicy", "beans"],
    "https://www.bonappetit.com/recipe/tortilla-soup"
  ),

  // 11. Creamy Tomato Soup
  recipe(
    "Creamy Tomato Soup", "ba-creamy-tomato-soup",
    "Velvety smooth tomato soup made with canned whole tomatoes and a touch of cream. Perfect with grilled cheese.",
    "American", "american", "easy", 15, 25, "simmering", 4, "4 servings",
    [i("canned whole tomatoes","2","28-oz cans"), i("onion","1","large","diced"), i("garlic","4","cloves","smashed"), i("heavy cream","0.5","cup"), i("unsalted butter","3","tbsp"), i("olive oil","2","tbsp"), i("sugar","1","tsp"), i("fresh basil","0.25","cup","plus more for garnish"), i("vegetable broth","1","cup"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Heat olive oil and butter in a large pot over medium heat. Add onion and cook until very soft, about 10 minutes.",
      "Add garlic and cook 1 minute. Add tomatoes with their juices, broth, sugar, and basil.",
      "Bring to a boil, then reduce heat and simmer 25 minutes, stirring occasionally.",
      "Blend soup until completely smooth using an immersion blender.",
      "Stir in cream, season with salt and pepper. Serve with fresh basil and crusty bread."
    ],
    [10, 1, 25, null, null],
    ["soup", "tomato", "comfort-food", "quick"],
    "https://www.bonappetit.com/recipe/creamy-tomato-soup"
  ),

  // 12. Coconut Curry Squash Soup
  recipe(
    "Coconut Curry Squash Soup", "ba-coconut-curry-squash-soup",
    "A warming butternut squash soup enriched with coconut milk, red curry paste, and a squeeze of lime.",
    "Thai", "southeastasian", "easy", 20, 25, "simmering", 6, "6 servings",
    [i("butternut squash","1","large","about 3 lbs, peeled and cubed"), i("coconut milk","1","14-oz can"), i("red curry paste","2","tbsp"), i("vegetable broth","4","cups"), i("onion","1","","diced"), i("ginger","2","inches","peeled and grated"), i("garlic","3","cloves","minced"), i("lime","1","","juiced"), i("coconut oil","2","tbsp"), i("cilantro","0.25","cup","for garnish"), i("pepitas","0.25","cup","toasted, for garnish"), i("kosher salt","1","tsp")],
    [
      "Heat coconut oil in a large pot over medium heat. Add onion and cook until softened, about 5 minutes.",
      "Add ginger, garlic, and curry paste. Cook, stirring, 2 minutes until fragrant.",
      "Add butternut squash and broth. Bring to a boil, then simmer until squash is very tender, about 25 minutes.",
      "Add coconut milk and blend until silky smooth. Stir in lime juice and season with salt.",
      "Serve topped with toasted pepitas, cilantro, and a drizzle of coconut milk."
    ],
    [5, 2, 25, null, null],
    ["soup", "coconut", "curry", "squash", "vegan"],
    "https://www.bonappetit.com/recipe/coconut-curry-squash-soup"
  ),

  // 13. Chana Masala
  recipe(
    "BA's Best Chana Masala", "ba-chana-masala",
    "Spiced chickpeas simmered in a rich tomato sauce with warm spices like cumin, coriander, and garam masala.",
    "Indian", "indian", "easy", 15, 25, "simmering", 4, "4 servings",
    [i("chickpeas","2","15-oz cans","drained and rinsed"), i("onion","1","large","finely diced"), i("tomatoes","1","14-oz can","crushed"), i("garlic","4","cloves","minced"), i("ginger","1","inch","grated"), i("serrano chile","1","","minced"), i("cumin seeds","1","tsp"), i("ground coriander","1","tsp"), i("garam masala","1","tsp"), i("turmeric","0.5","tsp"), i("amchur powder","1","tsp","or lemon juice"), i("vegetable oil","3","tbsp"), i("cilantro","0.25","cup","chopped"), i("kosher salt","1","tsp")],
    [
      "Heat oil in a large skillet over medium heat. Add cumin seeds and cook until they start to pop, about 30 seconds.",
      "Add onion and cook until deeply golden, about 10 minutes. Add garlic, ginger, and serrano chile. Cook 2 minutes.",
      "Add coriander, turmeric, and half the garam masala. Stir 30 seconds until fragrant.",
      "Add crushed tomatoes and chickpeas. Simmer 15 minutes, partially mashing some chickpeas to thicken.",
      "Stir in remaining garam masala and amchur. Season with salt. Garnish with cilantro and serve with rice or naan."
    ],
    [null, 10, null, 15, null],
    ["indian", "chickpeas", "spicy", "vegan"],
    "https://www.bonappetit.com/recipe/chana-masala"
  ),

  // 14. Dal Tadka
  recipe(
    "Dal Tadka", "ba-dal-tadka",
    "Creamy red lentils tempered with sizzling spices, garlic, and dried chiles. A staple Indian comfort dish.",
    "Indian", "indian", "easy", 15, 25, "simmering", 4, "4 servings",
    [i("red lentils (masoor dal)","1.5","cups","rinsed"), i("turmeric","0.5","tsp"), i("ghee or butter","3","tbsp"), i("cumin seeds","1","tsp"), i("mustard seeds","0.5","tsp"), i("dried red chiles","2",""), i("garlic","4","cloves","thinly sliced"), i("onion","1","medium","finely diced"), i("tomato","1","large","diced"), i("ginger","1","inch","grated"), i("cilantro","0.25","cup","chopped"), i("lemon","1","","juiced"), i("kosher salt","1.5","tsp"), i("water","4","cups")],
    [
      "Combine lentils, turmeric, and water in a pot. Bring to a boil, then reduce to a simmer. Cook until lentils are very soft and broken down, about 25 minutes, stirring occasionally.",
      "Season the dal with salt and lemon juice. Keep warm.",
      "For the tadka: Heat ghee in a small pan over medium-high heat. Add cumin seeds, mustard seeds, and dried chiles. Cook until seeds pop, about 30 seconds.",
      "Add sliced garlic and cook until golden. Add onion, ginger, and tomato. Cook until tomato breaks down, about 5 minutes.",
      "Pour the sizzling tadka over the dal. Garnish with cilantro. Serve with steamed rice or roti."
    ],
    [25, null, null, 5, null],
    ["indian", "lentils", "dal", "comfort-food", "vegan"],
    "https://www.bonappetit.com/recipe/dal-tadka"
  ),

  // 15. Saag Paneer
  recipe(
    "BA's Saag Paneer", "ba-saag-paneer",
    "Cubes of golden paneer nestled in a creamy, spiced spinach sauce. A beloved North Indian classic.",
    "Indian", "indian", "medium", 20, 25, "simmering", 4, "4 servings",
    [i("paneer","14","oz","cut into 1-inch cubes"), i("spinach","1.5","lbs","fresh, or 1 lb frozen"), i("onion","1","medium","diced"), i("garlic","4","cloves","minced"), i("ginger","1","inch","grated"), i("serrano chile","1","","minced"), i("cumin seeds","1","tsp"), i("garam masala","1","tsp"), i("heavy cream","0.25","cup"), i("ghee or butter","3","tbsp"), i("kosher salt","1","tsp"), i("lemon juice","1","tbsp")],
    [
      "Blanch spinach in boiling water for 1 minute, then shock in ice water. Squeeze dry and blend into a coarse puree.",
      "Heat 2 tbsp ghee in a large skillet over medium-high heat. Fry paneer cubes until golden on all sides, about 5 minutes. Remove and set aside.",
      "In the same pan, add remaining ghee and cumin seeds. When they pop, add onion and cook until soft, about 5 minutes.",
      "Add garlic, ginger, and serrano chile. Cook 2 minutes. Add spinach puree and garam masala. Simmer 10 minutes.",
      "Stir in cream and lemon juice. Fold in paneer cubes. Season with salt and serve with naan or rice."
    ],
    [null, 5, 5, 10, null],
    ["indian", "paneer", "spinach", "comfort-food"],
    "https://www.bonappetit.com/recipe/saag-paneer"
  ),

  // 16. Vegetable Pad Thai
  recipe(
    "Vegetable Pad Thai", "ba-vegetable-pad-thai",
    "A tangle of rice noodles stir-fried with tofu, bean sprouts, peanuts, and a sweet-sour tamarind sauce.",
    "Thai", "southeastasian", "medium", 35, null, null, 4, "4 servings",
    [i("flat rice noodles","8","oz"), i("extra-firm tofu","14","oz","pressed and cubed"), i("tamarind paste","3","tbsp"), i("sugar","2","tbsp"), i("soy sauce","2","tbsp"), i("rice vinegar","1","tbsp"), i("eggs","2",""), i("bean sprouts","2","cups"), i("scallions","4","","cut into 2-inch pieces"), i("roasted peanuts","0.5","cup","chopped"), i("lime","2","","cut into wedges"), i("vegetable oil","3","tbsp"), i("garlic","3","cloves","minced"), i("chili flakes","0.5","tsp")],
    [
      "Soak rice noodles in warm water until pliable but still firm, about 20 minutes. Drain.",
      "Whisk tamarind paste, sugar, soy sauce, and rice vinegar together for the sauce.",
      "Heat 2 tbsp oil in a wok over high heat. Fry tofu until crispy on all sides, about 5 minutes. Remove.",
      "Add remaining oil, garlic, and chili flakes. Push to one side, crack in eggs, and scramble. Add noodles and sauce, tossing to coat.",
      "Return tofu to wok. Add bean sprouts and scallions, toss 30 seconds. Serve with peanuts and lime wedges."
    ],
    [null, null, 5, null, null],
    ["thai", "noodles", "tofu", "stir-fry"],
    "https://www.bonappetit.com/recipe/vegetable-pad-thai"
  ),

  // 17. Aloo Gobi
  recipe(
    "BA's Aloo Gobi", "ba-aloo-gobi",
    "Golden potatoes and cauliflower dry-roasted with turmeric, cumin, and coriander. A humble dish with tremendous flavor.",
    "Indian", "indian", "easy", 15, 30, "cooking", 4, "4 servings",
    [i("cauliflower","1","large head","cut into florets"), i("Yukon Gold potatoes","1","lb","cut into 1-inch cubes"), i("onion","1","medium","diced"), i("tomatoes","2","medium","diced"), i("garlic","3","cloves","minced"), i("ginger","1","inch","grated"), i("cumin seeds","1","tsp"), i("turmeric","0.75","tsp"), i("ground coriander","1","tsp"), i("garam masala","0.5","tsp"), i("green chile","1","","slit"), i("vegetable oil","3","tbsp"), i("cilantro","0.25","cup","chopped"), i("kosher salt","1","tsp")],
    [
      "Heat oil in a large skillet over medium heat. Add cumin seeds and cook until they crackle, about 30 seconds.",
      "Add onion and cook until golden, about 8 minutes. Add garlic, ginger, and green chile. Cook 1 minute.",
      "Add turmeric, coriander, and tomatoes. Cook until tomatoes break down, about 5 minutes.",
      "Add potatoes and cauliflower, toss to coat with spices. Cover and cook on medium-low, stirring occasionally, until vegetables are tender, about 15 minutes.",
      "Sprinkle with garam masala and cilantro. Serve with roti or rice."
    ],
    [null, 8, 5, 15, null],
    ["indian", "potato", "cauliflower", "vegan"],
    "https://www.bonappetit.com/recipe/aloo-gobi"
  ),

  // 18. Mapo Tofu
  recipe(
    "Vegetarian Mapo Tofu", "ba-vegetarian-mapo-tofu",
    "Silky tofu in a fiery, numbing sauce of doubanjiang, fermented black beans, and Sichuan peppercorns.",
    "Chinese", "asian", "medium", 25, null, null, 4, "4 servings",
    [i("silken tofu","14","oz","cut into 1-inch cubes"), i("doubanjiang (chili bean paste)","2","tbsp"), i("fermented black beans","1","tbsp","rinsed and chopped"), i("Sichuan peppercorns","1","tsp","ground"), i("garlic","3","cloves","minced"), i("ginger","1","inch","minced"), i("scallions","4","","white and green parts separated, sliced"), i("soy sauce","1","tbsp"), i("sesame oil","1","tsp"), i("vegetable oil","2","tbsp"), i("cornstarch","1","tbsp","mixed with 2 tbsp water"), i("vegetable broth","0.75","cup"), i("steamed rice","4","cups","for serving")],
    [
      "Gently simmer tofu cubes in salted water for 3 minutes to warm through and firm up slightly. Drain carefully.",
      "Heat vegetable oil in a wok over medium-high heat. Add doubanjiang and fermented black beans, stir-fry 1 minute.",
      "Add garlic, ginger, and white parts of scallions. Cook 30 seconds.",
      "Add broth and soy sauce. Gently slide in tofu cubes. Simmer 5 minutes without stirring too much.",
      "Add cornstarch slurry and gently fold until sauce thickens. Drizzle with sesame oil, top with ground Sichuan peppercorns and scallion greens. Serve over rice."
    ],
    [3, 1, null, 5, null],
    ["chinese", "sichuan", "tofu", "spicy"],
    "https://www.bonappetit.com/recipe/mapo-tofu"
  ),

  // 19. Black Bean Enchiladas
  recipe(
    "Black Bean Enchiladas", "ba-black-bean-enchiladas",
    "Corn tortillas stuffed with seasoned black beans and cheese, smothered in a smoky red chile sauce.",
    "Mexican", "mexican", "medium", 30, 20, "baking", 4, "4 servings",
    [i("corn tortillas","12",""), i("black beans","2","15-oz cans","drained and rinsed"), i("Monterey Jack cheese","2","cups","grated"), i("dried ancho chiles","4",""), i("onion","1","medium","half for sauce, half diced"), i("garlic","3","cloves"), i("cumin","1","tsp"), i("tomato paste","1","tbsp"), i("vegetable broth","1.5","cups"), i("sour cream","0.5","cup"), i("cilantro","0.25","cup","for garnish"), i("vegetable oil","2","tbsp"), i("kosher salt","1","tsp")],
    [
      "Preheat the oven to 375°F. Toast ancho chiles in a dry skillet until fragrant, about 2 minutes per side. Soak in hot water 15 minutes, then drain.",
      "Blend soaked chiles with half the onion, garlic, cumin, tomato paste, broth, and salt until smooth. Simmer sauce in a pan for 10 minutes.",
      "Mix black beans with diced onion and 1 cup cheese. Season with cumin and salt.",
      "Warm tortillas briefly in oil. Fill each with bean mixture, roll up, and place seam-side down in a baking dish. Pour sauce over top, sprinkle with remaining cheese.",
      "Bake until bubbly and cheese is melted, about 20 minutes. Top with sour cream and cilantro."
    ],
    [null, 10, null, null, 20],
    ["mexican", "enchiladas", "beans", "cheese"],
    "https://www.bonappetit.com/recipe/black-bean-enchiladas"
  ),

  // 20. Vegetarian Tacos al Pastor
  recipe(
    "Cauliflower Tacos al Pastor", "ba-cauliflower-tacos-al-pastor",
    "Smoky, spiced cauliflower and pineapple stand in for pork in this vegetarian riff on the classic taco al pastor.",
    "Mexican", "mexican", "medium", 15, 25, "roasting", 4, "4 servings",
    [i("cauliflower","1","large head","cut into thin steaks/florets"), i("pineapple","2","cups","cut into chunks"), i("guajillo chile powder","2","tbsp"), i("cumin","1","tsp"), i("smoked paprika","1","tsp"), i("achiote paste","1","tbsp","dissolved in 2 tbsp lime juice"), i("corn tortillas","12","small"), i("white onion","0.5","","finely diced"), i("cilantro","0.5","cup","chopped"), i("limes","2","","cut into wedges"), i("salsa verde","0.5","cup"), i("vegetable oil","3","tbsp"), i("kosher salt","1","tsp")],
    [
      "Preheat the oven to 425°F. Toss cauliflower with achiote mixture, chile powder, cumin, paprika, oil, and salt.",
      "Spread cauliflower and pineapple on a baking sheet. Roast until charred and tender, about 25 minutes, flipping halfway.",
      "Chop the roasted cauliflower and pineapple into bite-sized pieces.",
      "Warm tortillas on a dry skillet or over a gas flame.",
      "Fill tortillas with cauliflower-pineapple mixture. Top with diced onion, cilantro, salsa verde, and a squeeze of lime."
    ],
    [null, 25, null, null, null],
    ["mexican", "tacos", "cauliflower", "spicy"],
    "https://www.bonappetit.com/recipe/cauliflower-tacos-al-pastor"
  ),

  // 21. Cheese Quesadillas
  recipe(
    "Cheese Quesadillas with Pickled Jalapeños", "ba-cheese-quesadillas",
    "Crispy flour tortillas filled with melty Oaxacan and Monterey Jack cheese, with tangy pickled jalapeños.",
    "Mexican", "mexican", "easy", 25, null, null, 4, "4 servings",
    [i("flour tortillas","4","large"), i("Oaxacan cheese","1","cup","shredded, or use mozzarella"), i("Monterey Jack cheese","1","cup","shredded"), i("pickled jalapeños","0.5","cup","sliced"), i("butter","2","tbsp"), i("salsa roja","0.5","cup","for serving"), i("sour cream","0.25","cup","for serving"), i("avocado","1","","sliced, for serving")],
    [
      "Mix both cheeses together. Divide among tortillas, spreading over one half of each. Scatter pickled jalapeños over the cheese.",
      "Fold tortillas in half to enclose filling.",
      "Melt butter in a large skillet over medium heat. Cook quesadillas, one or two at a time, until golden and crispy, about 2 minutes per side.",
      "Cut each quesadilla into triangles.",
      "Serve with salsa, sour cream, and sliced avocado."
    ],
    [null, null, 2, null, null],
    ["mexican", "quesadilla", "cheese", "quick"],
    "https://www.bonappetit.com/recipe/cheese-quesadillas"
  ),

  // 22. Chilaquiles Verdes
  recipe(
    "Chilaquiles Verdes", "ba-chilaquiles-verdes",
    "Fried tortilla chips simmered in tangy tomatillo salsa verde, topped with crema, queso fresco, and a fried egg.",
    "Mexican", "mexican", "medium", 30, null, null, 4, "4 servings",
    [i("corn tortillas","10","","cut into triangles"), i("tomatillos","1","lb","husked and halved"), i("serrano chiles","2",""), i("garlic","2","cloves"), i("onion","0.5","","roughly chopped"), i("cilantro","0.5","cup","leaves and stems"), i("vegetable oil","0.5","cup","for frying"), i("eggs","4",""), i("crema or sour cream","0.25","cup"), i("queso fresco","0.5","cup","crumbled"), i("avocado","1","","sliced"), i("kosher salt","1","tsp")],
    [
      "Boil tomatillos, serranos, garlic, and onion until tomatillos are soft, about 10 minutes. Blend with cilantro and salt until smooth.",
      "Fry tortilla triangles in batches in oil until crispy. Drain on paper towels.",
      "Pour salsa verde into a large skillet and bring to a simmer. Add fried tortilla chips and toss to coat. Cook 2 minutes until chips soften slightly but still have some crunch.",
      "Fry eggs sunny-side up in the same oil.",
      "Serve chilaquiles topped with fried eggs, crema, queso fresco, and avocado slices."
    ],
    [10, null, 2, null, null],
    ["mexican", "breakfast", "chilaquiles", "eggs"],
    "https://www.bonappetit.com/recipe/chilaquiles-verdes"
  ),

  // 23. Pizza Margherita
  recipe(
    "BA's Pizza Margherita", "ba-pizza-margherita",
    "The perfect Neapolitan-style pizza with San Marzano tomato sauce, fresh mozzarella, and fragrant basil.",
    "Italian", "italian", "medium", 15, 40, "dough resting and baking", 4, "2 pizzas",
    [i("pizza dough","1","lb","homemade or store-bought"), i("San Marzano tomatoes","1","14-oz can","crushed by hand"), i("fresh mozzarella","8","oz","torn into pieces"), i("fresh basil","10","leaves"), i("olive oil","2","tbsp","plus more for drizzling"), i("garlic","1","clove","finely grated"), i("kosher salt","0.5","tsp"), i("semolina flour","2","tbsp","for dusting")],
    [
      "Preheat the oven to 500°F (or as high as it goes) with a pizza stone or inverted baking sheet on the middle rack for at least 30 minutes.",
      "Mix crushed tomatoes with grated garlic, 1 tbsp olive oil, and salt for the sauce.",
      "Stretch dough on a floured surface into a 12-inch round. Transfer to a semolina-dusted peel or parchment.",
      "Spread a thin layer of sauce over the dough, leaving a 1-inch border. Scatter mozzarella pieces over top.",
      "Slide pizza onto the hot stone. Bake until crust is puffed and charred in spots and cheese is bubbly, 8-12 minutes. Top with fresh basil and a drizzle of olive oil."
    ],
    [30, null, null, null, 12],
    ["pizza", "italian", "classic"],
    "https://www.bonappetit.com/recipe/pizza-margherita"
  ),

  // 24. Mushroom Flatbread
  recipe(
    "Mushroom and Fontina Flatbread", "ba-mushroom-fontina-flatbread",
    "Thin, crispy flatbread topped with sautéed wild mushrooms, melty Fontina cheese, and a shower of fresh herbs.",
    "Italian", "italian", "medium", 25, 12, "baking", 4, "4 servings",
    [i("pizza dough or naan","1","lb"), i("mixed mushrooms","12","oz","sliced (cremini, oyster, shiitake)"), i("Fontina cheese","1.5","cups","grated"), i("garlic","3","cloves","minced"), i("fresh thyme","1","tbsp"), i("truffle oil","1","tsp","optional"), i("olive oil","3","tbsp"), i("arugula","1","cup","for topping"), i("Parmesan","0.25","cup","shaved"), i("kosher salt","0.5","tsp"), i("black pepper","0.25","tsp")],
    [
      "Preheat the oven to 475°F. Heat 2 tbsp olive oil in a skillet over high heat. Add mushrooms and cook until golden, about 6 minutes. Add garlic and thyme, cook 1 minute more. Season with salt and pepper.",
      "Roll or stretch dough into a thin rectangle on a parchment-lined baking sheet. Brush with remaining olive oil.",
      "Scatter Fontina over the dough, then top with sautéed mushrooms.",
      "Bake until crust is golden and cheese is bubbly, about 12 minutes.",
      "Top with arugula, shaved Parmesan, and a drizzle of truffle oil if using. Cut and serve immediately."
    ],
    [6, null, null, 12, null],
    ["pizza", "flatbread", "mushroom", "cheese"],
    "https://www.bonappetit.com/recipe/mushroom-fontina-flatbread"
  ),

  // 25. Shakshuka
  recipe(
    "BA's Best Shakshuka", "ba-shakshuka",
    "Eggs poached in a spiced, simmering tomato and pepper sauce with cumin and paprika. Serve with crusty bread.",
    "Middle Eastern", "middleeastern", "easy", 10, 25, "simmering", 4, "4 servings",
    [i("eggs","6",""), i("canned whole tomatoes","1","28-oz can","crushed by hand"), i("red bell pepper","1","","diced"), i("onion","1","medium","diced"), i("garlic","4","cloves","minced"), i("cumin","1.5","tsp"), i("smoked paprika","1","tsp"), i("cayenne pepper","0.25","tsp"), i("olive oil","3","tbsp"), i("feta cheese","0.5","cup","crumbled"), i("fresh cilantro","0.25","cup","for garnish"), i("crusty bread","1","loaf","for serving"), i("kosher salt","1","tsp")],
    [
      "Heat olive oil in a large, deep skillet over medium heat. Add onion and bell pepper. Cook until soft, about 8 minutes.",
      "Add garlic, cumin, paprika, and cayenne. Cook 1 minute until fragrant.",
      "Add tomatoes and season with salt. Simmer until sauce thickens slightly, about 10 minutes.",
      "Make 6 wells in the sauce and crack an egg into each. Cover and cook until whites are set but yolks are still runny, about 5-7 minutes.",
      "Scatter feta and cilantro over the top. Serve straight from the skillet with crusty bread for dipping."
    ],
    [8, 1, 10, 7, null],
    ["eggs", "middle-eastern", "breakfast", "shakshuka"],
    "https://www.bonappetit.com/recipe/shakshuka"
  ),

  // 26. Herby Vegetable Frittata
  recipe(
    "Herby Vegetable Frittata", "ba-herby-vegetable-frittata",
    "A fluffy, golden frittata loaded with seasonal vegetables, goat cheese, and fresh herbs.",
    "Italian", "italian", "easy", 15, 15, "baking", 6, "6 servings",
    [i("eggs","10",""), i("zucchini","1","medium","diced"), i("red bell pepper","1","","diced"), i("cherry tomatoes","1","cup","halved"), i("scallions","4","","sliced"), i("goat cheese","4","oz","crumbled"), i("fresh dill","2","tbsp","chopped"), i("fresh chives","2","tbsp","chopped"), i("whole milk","0.25","cup"), i("olive oil","2","tbsp"), i("kosher salt","0.75","tsp"), i("black pepper","0.25","tsp")],
    [
      "Preheat the oven to 375°F. Whisk eggs with milk, salt, and pepper.",
      "Heat olive oil in a 10-inch oven-safe skillet over medium heat. Add zucchini and bell pepper. Cook until just tender, about 5 minutes.",
      "Add scallions and cherry tomatoes, cook 1 minute. Spread vegetables evenly in the pan.",
      "Pour egg mixture over the vegetables. Dot with goat cheese. Cook on the stove until edges begin to set, about 3 minutes.",
      "Transfer to oven and bake until puffed and golden, about 15 minutes. Sprinkle with dill and chives. Let cool 5 minutes before slicing."
    ],
    [5, 1, 3, 15, null],
    ["eggs", "frittata", "brunch"],
    "https://www.bonappetit.com/recipe/vegetable-frittata"
  ),

  // 27. Whole Roasted Cauliflower
  recipe(
    "Whole Roasted Cauliflower with Tahini", "ba-whole-roasted-cauliflower-tahini",
    "A show-stopping whole cauliflower roasted until deeply caramelized, drizzled with lemon-tahini sauce and toasted pine nuts.",
    "Mediterranean", "middleeastern", "easy", 15, 60, "roasting", 4, "4 servings",
    [i("cauliflower","1","large head","leaves trimmed"), i("tahini","0.33","cup"), i("lemon","1","","juiced"), i("garlic","2","cloves","grated"), i("olive oil","0.25","cup"), i("cumin","1","tsp"), i("smoked paprika","0.5","tsp"), i("pine nuts","3","tbsp","toasted"), i("pomegranate seeds","0.25","cup"), i("fresh parsley","0.25","cup","chopped"), i("water","2","tbsp"), i("kosher salt","1","tsp")],
    [
      "Preheat the oven to 400°F. Rub cauliflower all over with olive oil, cumin, paprika, and salt.",
      "Place cauliflower in a cast-iron skillet or oven-safe dish. Roast until deeply golden and a knife slides easily into the center, about 55-60 minutes.",
      "Meanwhile, whisk tahini with lemon juice, garlic, water, and a pinch of salt until smooth and pourable.",
      "Transfer cauliflower to a serving platter. Drizzle generously with tahini sauce.",
      "Scatter with toasted pine nuts, pomegranate seeds, and parsley. Serve whole and let guests pull apart florets."
    ],
    [null, 60, null, null, null],
    ["cauliflower", "mediterranean", "tahini", "vegan"],
    "https://www.bonappetit.com/recipe/whole-roasted-cauliflower"
  ),

  // 28. Stuffed Bell Peppers
  recipe(
    "Stuffed Bell Peppers with Rice and Beans", "ba-stuffed-bell-peppers",
    "Colorful bell peppers stuffed with a savory mixture of rice, black beans, corn, and melty cheese.",
    "American", "american", "easy", 20, 35, "baking", 4, "4 servings",
    [i("bell peppers","4","large","tops cut off, seeds removed"), i("cooked rice","2","cups"), i("black beans","1","15-oz can","drained and rinsed"), i("corn kernels","1","cup"), i("cheddar cheese","1.5","cups","shredded"), i("salsa","1","cup"), i("cumin","1","tsp"), i("chili powder","0.5","tsp"), i("scallions","3","","sliced"), i("cilantro","0.25","cup","for garnish"), i("olive oil","1","tbsp"), i("kosher salt","0.5","tsp")],
    [
      "Preheat the oven to 375°F. Lightly oil a baking dish.",
      "Mix rice, black beans, corn, half the salsa, 1 cup cheese, cumin, chili powder, scallions, and salt.",
      "Stuff each pepper with the rice mixture, packing it in firmly. Place in the baking dish.",
      "Spoon remaining salsa over the tops. Cover with foil and bake 25 minutes.",
      "Remove foil, top with remaining cheese, and bake until cheese is melted and peppers are tender, about 10 more minutes. Garnish with cilantro."
    ],
    [null, null, null, 25, 10],
    ["stuffed-peppers", "rice", "beans", "mexican"],
    "https://www.bonappetit.com/recipe/stuffed-bell-peppers"
  ),

  // 29. Ratatouille
  recipe(
    "BA's Ratatouille", "ba-ratatouille",
    "Layers of thinly sliced summer vegetables baked in a fragrant Provençal tomato sauce until tender and caramelized.",
    "French", "french", "medium", 30, 60, "baking", 6, "6 servings",
    [i("eggplant","1","medium","thinly sliced into rounds"), i("zucchini","2","medium","thinly sliced into rounds"), i("yellow squash","2","medium","thinly sliced into rounds"), i("Roma tomatoes","4","","thinly sliced"), i("onion","1","","diced"), i("garlic","4","cloves","minced"), i("crushed tomatoes","1","14-oz can"), i("fresh thyme","1","tbsp"), i("fresh basil","0.25","cup","for garnish"), i("olive oil","0.25","cup"), i("red bell pepper","1","","diced"), i("herbes de Provence","1","tsp"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Preheat the oven to 375°F. Heat 2 tbsp olive oil in a skillet. Cook onion, bell pepper, and garlic until soft, about 8 minutes. Add crushed tomatoes, thyme, and herbes de Provence. Simmer 10 minutes.",
      "Spread the tomato sauce in the bottom of a round baking dish.",
      "Arrange alternating slices of eggplant, zucchini, yellow squash, and tomato in a spiral pattern over the sauce.",
      "Drizzle with remaining olive oil, season with salt and pepper. Cover tightly with foil.",
      "Bake covered 45 minutes, then uncover and bake 15 more minutes until vegetables are tender and edges are lightly caramelized. Garnish with fresh basil."
    ],
    [8, null, null, null, 60],
    ["french", "summer", "vegan"],
    "https://www.bonappetit.com/recipe/ratatouille"
  ),

  // 30. Eggplant Parmesan
  recipe(
    "BA's Eggplant Parmesan", "ba-eggplant-parmesan",
    "Layers of crispy breaded eggplant, tangy marinara, and bubbling mozzarella. A vegetarian Italian-American classic.",
    "Italian-American", "italian", "hard", 40, 30, "baking", 6, "6 servings",
    [i("eggplants","2","large","sliced 1/3-inch thick"), i("marinara sauce","3","cups"), i("mozzarella cheese","1","lb","sliced"), i("Parmesan","1","cup","grated"), i("eggs","3","","beaten"), i("all-purpose flour","1","cup"), i("breadcrumbs","2","cups","Italian-seasoned"), i("olive oil","0.5","cup","for frying"), i("fresh basil","0.25","cup"), i("kosher salt","1","tsp")],
    [
      "Preheat the oven to 375°F. Salt eggplant slices and let drain in a colander for 20 minutes. Pat dry.",
      "Dredge eggplant in flour, dip in beaten egg, then coat in breadcrumbs.",
      "Fry breaded eggplant in olive oil until golden on both sides, about 2 minutes per side. Drain on paper towels.",
      "Spread a thin layer of marinara in a 9x13 baking dish. Layer eggplant, more sauce, mozzarella, and Parmesan. Repeat layers.",
      "Bake until bubbly and golden, about 30 minutes. Let rest 10 minutes, then garnish with fresh basil."
    ],
    [null, null, null, null, 30],
    ["italian", "eggplant", "baked", "comfort-food", "cheese"],
    "https://www.bonappetit.com/recipe/eggplant-parmesan"
  ),

  // 31. Crispy Falafel
  recipe(
    "Crispy Falafel", "ba-crispy-falafel",
    "Shatteringly crispy on the outside, tender and herb-filled on the inside. Made from dried chickpeas for the best texture.",
    "Middle Eastern", "middleeastern", "medium", 30, 60, "soaking (overnight)", 4, "about 20 falafel",
    [i("dried chickpeas","1","lb","soaked overnight, NOT canned"), i("fresh parsley","1","cup","packed"), i("fresh cilantro","0.5","cup","packed"), i("onion","1","medium","quartered"), i("garlic","5","cloves"), i("cumin","2","tsp"), i("coriander","1","tsp"), i("baking powder","1","tsp"), i("all-purpose flour","3","tbsp"), i("kosher salt","1.5","tsp"), i("vegetable oil","3","cups","for frying"), i("pita bread","4",""), i("tahini sauce","0.5","cup")],
    [
      "Drain soaked chickpeas and pat dry. Pulse in a food processor with parsley, cilantro, onion, and garlic until a coarse, textured paste forms. Do not over-process.",
      "Mix in cumin, coriander, baking powder, flour, and salt. Refrigerate mixture 1 hour (or at least 30 minutes).",
      "Shape into 1.5-inch patties, about 2 tablespoons each.",
      "Heat oil to 350°F in a deep pot. Fry falafel in batches until deeply golden and crispy, about 3-4 minutes. Drain on paper towels.",
      "Serve in pita bread with tahini sauce, pickled vegetables, and fresh herbs."
    ],
    [null, null, null, 4, null],
    ["middle-eastern", "falafel", "chickpeas", "vegan"],
    "https://www.bonappetit.com/recipe/falafel"
  ),

  // 32. Fattoush
  recipe(
    "Fattoush Salad", "ba-fattoush-salad",
    "A vibrant Levantine bread salad with crispy pita chips, fresh vegetables, and a tangy sumac-lemon dressing.",
    "Middle Eastern", "middleeastern", "easy", 25, null, null, 4, "4 servings",
    [i("pita bread","2","","torn into pieces"), i("romaine lettuce","1","head","chopped"), i("Persian cucumbers","3","","diced"), i("tomatoes","2","medium","diced"), i("radishes","4","","thinly sliced"), i("fresh mint","0.25","cup","leaves"), i("fresh parsley","0.25","cup","chopped"), i("sumac","1.5","tsp"), i("lemon juice","3","tbsp"), i("olive oil","0.33","cup"), i("pomegranate molasses","1","tbsp"), i("garlic","1","clove","minced"), i("kosher salt","0.5","tsp")],
    [
      "Preheat the oven to 400°F. Toss torn pita with 2 tbsp olive oil and a pinch of salt. Bake until crispy and golden, about 8 minutes.",
      "Whisk together lemon juice, remaining olive oil, sumac, pomegranate molasses, garlic, and salt for the dressing.",
      "Combine lettuce, cucumbers, tomatoes, radishes, mint, and parsley in a large bowl.",
      "Add pita chips and dressing just before serving. Toss to combine.",
      "Serve immediately while pita is still crispy. Sprinkle with extra sumac."
    ],
    [8, null, null, null, null],
    ["salad", "middle-eastern", "fattoush", "vegan"],
    "https://www.bonappetit.com/recipe/fattoush"
  ),

  // 33. Spanakopita
  recipe(
    "BA's Spanakopita", "ba-spanakopita",
    "Flaky phyllo pastry filled with spinach and feta cheese. A beloved Greek savory pie.",
    "Greek", "middleeastern", "medium", 30, 40, "baking", 8, "8 servings",
    [i("phyllo dough","1","package","thawed"), i("fresh spinach","2","lbs","or 1 lb frozen, thawed and squeezed dry"), i("feta cheese","8","oz","crumbled"), i("ricotta cheese","0.5","cup"), i("eggs","3",""), i("scallions","4","","chopped"), i("dill","0.25","cup","chopped"), i("unsalted butter","0.5","cup","melted"), i("olive oil","2","tbsp"), i("nutmeg","0.25","tsp"), i("kosher salt","0.5","tsp"), i("black pepper","0.25","tsp")],
    [
      "Preheat the oven to 375°F. Wilt fresh spinach in olive oil, then squeeze out all moisture.",
      "Mix spinach with feta, ricotta, eggs, scallions, dill, nutmeg, salt, and pepper.",
      "Brush a 9x13 baking dish with melted butter. Layer 8 sheets of phyllo, brushing each with butter.",
      "Spread the spinach-feta filling evenly. Top with 8 more sheets of phyllo, brushing each with butter. Score the top into squares.",
      "Bake until golden and crispy, about 40 minutes. Let cool 10 minutes before cutting."
    ],
    [null, null, null, null, 40],
    ["greek", "mediterranean", "spinach", "feta", "pastry"],
    "https://www.bonappetit.com/recipe/spanakopita"
  ),

  // 34. Stovetop Mac and Cheese
  recipe(
    "BA's Stovetop Mac and Cheese", "ba-stovetop-mac-and-cheese",
    "Ultra-creamy stovetop mac and cheese made with sharp cheddar and Gruyère for maximum flavor.",
    "American", "american", "easy", 25, null, null, 6, "6 servings",
    [i("elbow macaroni","1","lb"), i("sharp cheddar cheese","2","cups","grated"), i("Gruyère cheese","1","cup","grated"), i("whole milk","2.5","cups"), i("unsalted butter","3","tbsp"), i("all-purpose flour","3","tbsp"), i("Dijon mustard","1","tsp"), i("cayenne pepper","0.125","tsp"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Cook macaroni in salted boiling water until al dente. Drain.",
      "In the same pot, melt butter over medium heat. Whisk in flour and cook 1 minute to form a roux.",
      "Gradually whisk in milk, stirring constantly until sauce thickens, about 5 minutes.",
      "Remove from heat. Stir in cheddar, Gruyère, mustard, cayenne, salt, and pepper until smooth.",
      "Fold in cooked macaroni. Serve immediately, extra creamy and piping hot."
    ],
    [null, 1, 5, null, null],
    ["comfort-food", "mac-and-cheese", "cheese", "pasta", "quick"],
    "https://www.bonappetit.com/recipe/stovetop-mac-and-cheese"
  ),

  // 35. Ultimate Grilled Cheese
  recipe(
    "Ultimate Grilled Cheese", "ba-ultimate-grilled-cheese",
    "A perfectly golden, crispy grilled cheese with sharp cheddar and American cheese on sourdough bread.",
    "American", "american", "easy", 13, null, null, 2, "2 sandwiches",
    [i("sourdough bread","4","slices"), i("sharp cheddar cheese","4","oz","sliced"), i("American cheese","2","slices"), i("unsalted butter","3","tbsp","softened"), i("Dijon mustard","1","tsp","optional"), i("mayonnaise","1","tbsp","for exterior of bread")],
    [
      "Spread one side of each bread slice with a thin layer of mayonnaise (this creates the crispiest exterior).",
      "Flip slices over. If using, spread Dijon on the inside. Layer cheddar and American cheese on two slices, top with remaining bread, mayo-side out.",
      "Heat a skillet over medium-low heat. Add sandwiches and cook until deeply golden, about 3-4 minutes per side.",
      "Press gently with a spatula to help the cheese melt evenly. Flip carefully.",
      "When both sides are golden and cheese is melted through, cut in half diagonally and serve immediately."
    ],
    [null, null, 4, null, null],
    ["comfort-food", "grilled-cheese", "sandwich", "quick"],
    "https://www.bonappetit.com/recipe/grilled-cheese"
  ),

  // 36. Crispy Tofu Stir-Fry
  recipe(
    "Crispy Tofu Stir-Fry with Broccoli", "ba-crispy-tofu-stir-fry",
    "Extra-firm tofu fried until golden and tossed with broccoli in a savory garlic-ginger sauce.",
    "Chinese-Inspired", "asian", "easy", 35, null, null, 4, "4 servings",
    [i("extra-firm tofu","14","oz","pressed and cubed"), i("broccoli","1","large head","cut into florets"), i("garlic","4","cloves","minced"), i("ginger","1","inch","grated"), i("soy sauce","3","tbsp"), i("sesame oil","1","tbsp"), i("rice vinegar","1","tbsp"), i("honey or maple syrup","1","tbsp"), i("cornstarch","2","tbsp"), i("vegetable oil","3","tbsp"), i("sesame seeds","1","tbsp"), i("scallions","3","","sliced"), i("steamed rice","4","cups","for serving")],
    [
      "Toss tofu cubes with cornstarch until evenly coated.",
      "Heat 2 tbsp vegetable oil in a wok over high heat. Fry tofu until golden and crispy on all sides, about 6 minutes. Remove.",
      "Add remaining oil. Stir-fry broccoli until bright green and crisp-tender, about 3 minutes. Add garlic and ginger, cook 30 seconds.",
      "Whisk soy sauce, sesame oil, rice vinegar, and honey together. Pour into the wok. Return tofu and toss to coat.",
      "Serve over steamed rice, topped with sesame seeds and scallions."
    ],
    [null, 6, 3, null, null],
    ["stir-fry", "tofu", "broccoli", "asian", "vegan"],
    "https://www.bonappetit.com/recipe/crispy-tofu-stir-fry"
  ),

  // 37. Mushroom Bourguignon
  recipe(
    "Mushroom Bourguignon", "ba-mushroom-bourguignon",
    "A rich, wine-braised vegetarian stew inspired by classic beef bourguignon, with meaty mushrooms, pearl onions, and carrots.",
    "French", "french", "medium", 25, 45, "braising", 6, "6 servings",
    [i("mixed mushrooms","2","lbs","cremini, portobello, and shiitake"), i("pearl onions","1","cup","peeled"), i("carrots","3","","cut into chunks"), i("dry red wine","2","cups"), i("vegetable broth","1","cup"), i("tomato paste","2","tbsp"), i("garlic","4","cloves","minced"), i("fresh thyme","4","sprigs"), i("bay leaves","2",""), i("butter","3","tbsp"), i("all-purpose flour","2","tbsp"), i("olive oil","2","tbsp"), i("fresh parsley","0.25","cup","chopped"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Heat olive oil and 1 tbsp butter in a large Dutch oven over medium-high heat. Sear mushrooms in batches until deeply browned, about 5 minutes per batch. Remove and set aside.",
      "Add remaining butter, pearl onions, and carrots. Cook until lightly browned, about 5 minutes.",
      "Add garlic and tomato paste, cook 1 minute. Sprinkle in flour and stir 1 minute.",
      "Pour in red wine and broth. Add thyme and bay leaves. Bring to a boil, then reduce to a simmer.",
      "Return mushrooms to the pot. Simmer until sauce thickens and vegetables are tender, about 30 minutes. Discard thyme and bay leaves. Season with salt and pepper. Garnish with parsley. Serve over mashed potatoes or egg noodles."
    ],
    [5, 5, 1, null, 30],
    ["french", "mushroom", "stew", "comfort-food", "wine"],
    "https://www.bonappetit.com/recipe/mushroom-bourguignon"
  ),

  // 38. Crispy Sweet Potato Tacos
  recipe(
    "Crispy Sweet Potato Tacos", "ba-crispy-sweet-potato-tacos",
    "Roasted sweet potato wedges with black beans, pickled onions, and a creamy chipotle crema in warm corn tortillas.",
    "Mexican", "mexican", "easy", 15, 30, "roasting", 4, "4 servings",
    [i("sweet potatoes","2","large","cut into wedges"), i("black beans","1","15-oz can","drained"), i("corn tortillas","12","small"), i("chipotle in adobo","2","tbsp","minced"), i("sour cream","0.5","cup"), i("red onion","1","small","thinly sliced"), i("lime","2","","juiced"), i("cumin","1","tsp"), i("smoked paprika","1","tsp"), i("olive oil","3","tbsp"), i("cilantro","0.25","cup"), i("cotija cheese","0.25","cup","crumbled"), i("kosher salt","1","tsp")],
    [
      "Preheat the oven to 425°F. Toss sweet potato wedges with olive oil, cumin, paprika, and salt. Roast until crispy and caramelized, about 25-30 minutes, flipping halfway.",
      "Quick-pickle the red onion by tossing slices with lime juice and a pinch of salt. Let sit at least 15 minutes.",
      "Mix sour cream with chipotle in adobo for the crema.",
      "Warm tortillas on a dry skillet or over a gas flame.",
      "Fill tortillas with sweet potato, black beans, pickled onions, chipotle crema, cotija, and cilantro."
    ],
    [30, null, null, null, null],
    ["tacos", "sweet-potato", "mexican", "beans"],
    "https://www.bonappetit.com/recipe/sweet-potato-tacos"
  ),

  // 39. Vegetable Fried Rice
  recipe(
    "Vegetable Fried Rice", "ba-vegetable-fried-rice",
    "The best vegetable fried rice starts with day-old rice, high heat, and a generous splash of soy sauce.",
    "Chinese", "asian", "easy", 20, null, null, 4, "4 servings",
    [i("day-old cooked rice","4","cups"), i("eggs","3",""), i("garlic","3","cloves","minced"), i("ginger","1","inch","grated"), i("soy sauce","3","tbsp"), i("sesame oil","1","tbsp"), i("frozen peas","1","cup"), i("carrots","2","","diced small"), i("scallions","4","","sliced"), i("vegetable oil","3","tbsp"), i("white pepper","0.25","tsp")],
    [
      "Heat 2 tbsp vegetable oil in a wok over high heat until smoking. Add carrots and stir-fry 2 minutes. Add peas and cook 1 minute.",
      "Push vegetables to one side. Add remaining oil, crack in eggs, and scramble until just set.",
      "Add rice, breaking up any clumps. Stir-fry, pressing rice against the wok for maximum contact, about 3 minutes.",
      "Add garlic, ginger, soy sauce, and sesame oil. Toss everything together.",
      "Season with white pepper. Serve topped with sliced scallions."
    ],
    [2, null, 3, null, null],
    ["rice", "chinese", "stir-fry", "quick"],
    "https://www.bonappetit.com/recipe/vegetable-fried-rice"
  ),

  // 40. Roasted Carrot Ginger Soup
  recipe(
    "Roasted Carrot and Ginger Soup", "ba-roasted-carrot-ginger-soup",
    "Sweet roasted carrots blended with warming ginger and a touch of coconut milk for a velvety, vibrant soup.",
    "American", "american", "easy", 15, 35, "roasting", 4, "4 servings",
    [i("carrots","2","lbs","peeled and cut into chunks"), i("onion","1","large","quartered"), i("ginger","2","inches","peeled and sliced"), i("garlic","4","cloves"), i("vegetable broth","4","cups"), i("coconut milk","0.5","cup"), i("olive oil","3","tbsp"), i("cumin","0.5","tsp"), i("honey","1","tbsp"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp"), i("pepitas","2","tbsp","for garnish")],
    [
      "Preheat the oven to 425°F. Toss carrots, onion, ginger, and garlic with olive oil and cumin. Roast until deeply caramelized, about 35 minutes.",
      "Transfer roasted vegetables to a pot with broth. Bring to a simmer.",
      "Blend until completely smooth. Stir in coconut milk and honey.",
      "Season with salt and pepper. Thin with more broth if desired.",
      "Serve drizzled with coconut milk and topped with toasted pepitas."
    ],
    [35, null, null, null, null],
    ["soup", "carrot", "ginger", "vegan"],
    "https://www.bonappetit.com/recipe/carrot-ginger-soup"
  ),

  // 41. Crispy Smashed Potatoes
  recipe(
    "Crispy Smashed Potatoes", "ba-crispy-smashed-potatoes",
    "Baby potatoes boiled, smashed, and roasted until irresistibly crispy, then topped with sour cream and chives.",
    "American", "american", "easy", 5, 40, "boiling and roasting", 4, "4 servings",
    [i("baby Yukon Gold potatoes","2","lbs"), i("olive oil","0.25","cup"), i("garlic powder","1","tsp"), i("smoked paprika","0.5","tsp"), i("sour cream","0.5","cup"), i("fresh chives","2","tbsp","chopped"), i("flaky sea salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Preheat the oven to 450°F. Boil potatoes in salted water until fork-tender, about 15 minutes. Drain.",
      "Spread potatoes on a baking sheet. Use the bottom of a glass to smash each potato to about 1/2-inch thickness.",
      "Drizzle generously with olive oil. Season with garlic powder, paprika, salt, and pepper.",
      "Roast until deeply golden and crispy on the edges, about 25 minutes.",
      "Serve topped with dollops of sour cream and a shower of fresh chives."
    ],
    [15, null, null, 25, null],
    ["side-dish", "potato", "crispy", "comfort-food"],
    "https://www.bonappetit.com/recipe/crispy-smashed-potatoes"
  ),

  // 42. Mushroom Gruyère Quiche
  recipe(
    "Mushroom and Gruyère Quiche", "ba-mushroom-gruyere-quiche",
    "A buttery, flaky crust filled with a silky custard of sautéed mushrooms, Gruyère cheese, and fresh thyme.",
    "French", "french", "medium", 30, 40, "baking", 8, "8 servings",
    [i("pie crust","1","9-inch","homemade or store-bought"), i("mixed mushrooms","10","oz","sliced"), i("Gruyère cheese","1","cup","grated"), i("eggs","4",""), i("heavy cream","1","cup"), i("whole milk","0.5","cup"), i("shallot","1","","minced"), i("fresh thyme","1","tsp"), i("butter","2","tbsp"), i("kosher salt","0.75","tsp"), i("black pepper","0.25","tsp"), i("nutmeg","0.125","tsp")],
    [
      "Preheat the oven to 375°F. Fit pie crust into a 9-inch tart pan. Prick bottom with a fork, line with parchment and pie weights. Blind bake 15 minutes, remove weights, bake 5 more minutes.",
      "Sauté mushrooms in butter over medium-high heat until golden, about 6 minutes. Add shallot and thyme, cook 2 minutes more.",
      "Whisk eggs, cream, milk, salt, pepper, and nutmeg together.",
      "Scatter mushrooms and Gruyère in the pre-baked crust. Pour custard mixture over top.",
      "Bake until custard is set and top is lightly golden, about 35-40 minutes. Let cool 15 minutes before slicing."
    ],
    [15, 6, null, null, 40],
    ["quiche", "french", "brunch", "mushroom", "cheese"],
    "https://www.bonappetit.com/recipe/mushroom-gruyere-quiche"
  ),

  // 43. Caprese Salad
  recipe(
    "BA's Caprese Salad", "ba-caprese-salad",
    "The simplest summer salad: ripe tomatoes, creamy burrata, fresh basil, and the best olive oil you can find.",
    "Italian", "italian", "easy", 10, null, null, 4, "4 servings",
    [i("heirloom tomatoes","2","lbs","mixed colors, sliced"), i("burrata","8","oz"), i("fresh basil","1","bunch","leaves picked"), i("extra-virgin olive oil","3","tbsp","best quality"), i("flaky sea salt","0.5","tsp"), i("freshly cracked black pepper","0.25","tsp"), i("balsamic glaze","1","tbsp","optional")],
    [
      "Arrange tomato slices on a large platter in a single layer.",
      "Tear burrata open and place in the center of the tomatoes.",
      "Scatter basil leaves over everything.",
      "Drizzle generously with olive oil and balsamic glaze if using.",
      "Season with flaky salt and cracked pepper. Serve immediately at room temperature."
    ],
    [null, null, null, null, null],
    ["salad", "italian", "summer", "no-cook", "tomato"],
    "https://www.bonappetit.com/recipe/caprese-salad"
  ),

  // 44. Green Goddess Grain Bowl
  recipe(
    "Green Goddess Grain Bowl", "ba-green-goddess-grain-bowl",
    "A nourishing bowl of quinoa topped with roasted vegetables and a vibrant green goddess dressing.",
    "American", "vegetarian", "easy", 20, 25, "roasting", 4, "4 servings",
    [i("quinoa","1","cup"), i("sweet potatoes","2","medium","cubed"), i("chickpeas","1","15-oz can","drained"), i("avocado","1",""), i("fresh basil","1","cup","packed"), i("fresh parsley","0.5","cup"), i("lemon juice","3","tbsp"), i("tahini","2","tbsp"), i("garlic","1","clove"), i("kale","2","cups","chopped"), i("olive oil","3","tbsp"), i("pepitas","0.25","cup"), i("kosher salt","1","tsp")],
    [
      "Preheat the oven to 425°F. Toss sweet potatoes and chickpeas with 2 tbsp olive oil and salt. Roast until crispy, about 25 minutes.",
      "Cook quinoa according to package directions. Fluff with a fork.",
      "Blend avocado, basil, parsley, lemon juice, tahini, garlic, remaining olive oil, and 3 tbsp water until smooth for the green goddess dressing.",
      "Massage kale with a pinch of salt until softened.",
      "Assemble bowls: quinoa base, topped with kale, roasted sweet potatoes, chickpeas, pepitas, and a generous drizzle of green goddess dressing."
    ],
    [25, null, null, null, null],
    ["grain-bowl", "healthy", "quinoa", "vegan"],
    "https://www.bonappetit.com/recipe/green-goddess-grain-bowl"
  ),

  // 45. Potato Rosemary Focaccia
  recipe(
    "Crispy Potato and Rosemary Focaccia", "ba-potato-rosemary-focaccia",
    "A dimpled, olive oil-drenched focaccia topped with paper-thin potato slices, rosemary, and flaky salt.",
    "Italian", "bread", "medium", 30, 90, "rising and baking", 8, "8 servings",
    [i("bread flour","3.5","cups"), i("active dry yeast","2.25","tsp"), i("warm water","1.5","cups"), i("olive oil","0.5","cup","plus more for drizzling"), i("Yukon Gold potato","1","large","very thinly sliced on mandoline"), i("fresh rosemary","2","tbsp","leaves"), i("flaky sea salt","1","tsp"), i("sugar","1","tsp"), i("kosher salt","2","tsp")],
    [
      "Dissolve yeast and sugar in warm water. Let sit 5 minutes until foamy. Mix with flour and kosher salt until a shaggy dough forms.",
      "Pour 0.25 cup olive oil into a 9x13 baking pan. Transfer dough to pan, turning to coat in oil. Cover and let rise 1 hour until doubled.",
      "Stretch dough to fill the pan, dimpling with your fingers. Arrange potato slices in overlapping layers on top. Drizzle with remaining olive oil.",
      "Scatter rosemary and flaky salt over the potatoes. Let rest 20 minutes.",
      "Preheat the oven to 450°F. Bake until golden and crispy on top and bottom, about 25-30 minutes. Let cool slightly before cutting."
    ],
    [null, null, null, null, 30],
    ["bread", "focaccia", "italian", "potato", "vegan"],
    "https://www.bonappetit.com/recipe/potato-focaccia"
  ),

  // 46. Thai Red Curry with Tofu
  recipe(
    "Thai Red Curry with Tofu", "ba-thai-red-curry-tofu",
    "A fragrant coconut milk curry simmered with crispy tofu, bell peppers, and Thai basil.",
    "Thai", "southeastasian", "easy", 15, 20, "simmering", 4, "4 servings",
    [i("extra-firm tofu","14","oz","pressed and cubed"), i("coconut milk","1","14-oz can"), i("red curry paste","3","tbsp"), i("red bell pepper","1","","sliced"), i("snap peas","1","cup"), i("bamboo shoots","0.5","cup"), i("soy sauce","1","tbsp"), i("brown sugar","1","tbsp"), i("lime","1","","juiced"), i("Thai basil","0.5","cup","leaves"), i("vegetable oil","2","tbsp"), i("jasmine rice","4","cups","cooked, for serving"), i("kosher salt","0.5","tsp")],
    [
      "Heat oil in a large wok over high heat. Fry tofu until golden on all sides, about 5 minutes. Remove.",
      "In the same pan, cook curry paste in a splash of coconut cream for 1 minute until fragrant.",
      "Add remaining coconut milk, soy sauce, and sugar. Bring to a simmer.",
      "Add bell pepper, snap peas, and bamboo shoots. Cook 5 minutes until crisp-tender. Return tofu.",
      "Stir in lime juice and Thai basil. Serve over jasmine rice."
    ],
    [5, 1, null, 5, null],
    ["thai", "curry", "tofu", "coconut"],
    "https://www.bonappetit.com/recipe/thai-red-curry-tofu"
  ),

  // 47. Miso-Glazed Eggplant
  recipe(
    "Miso-Glazed Eggplant", "ba-miso-glazed-eggplant",
    "Tender eggplant halves roasted until caramelized and brushed with a sweet-savory white miso glaze.",
    "Japanese", "asian", "easy", 10, 30, "roasting", 4, "4 servings",
    [i("Japanese eggplants","4","","halved lengthwise"), i("white miso paste","3","tbsp"), i("mirin","2","tbsp"), i("rice vinegar","1","tbsp"), i("sugar","1","tbsp"), i("sesame oil","1","tbsp"), i("vegetable oil","2","tbsp"), i("sesame seeds","1","tbsp"), i("scallions","2","","thinly sliced"), i("steamed rice","4","cups","for serving")],
    [
      "Preheat the oven to 400°F. Score the flesh of each eggplant half in a crosshatch pattern. Brush with vegetable oil.",
      "Place eggplants cut-side down on a baking sheet. Roast 15 minutes until partially tender.",
      "Whisk together miso, mirin, rice vinegar, sugar, and sesame oil.",
      "Flip eggplants cut-side up. Brush generously with miso glaze. Roast another 15 minutes until caramelized and tender.",
      "Top with sesame seeds and scallions. Serve over steamed rice."
    ],
    [null, 15, null, 15, null],
    ["japanese", "eggplant", "miso", "vegan"],
    "https://www.bonappetit.com/recipe/miso-glazed-eggplant"
  ),

  // 48. Black Bean Soup
  recipe(
    "Black Bean Soup", "ba-black-bean-soup",
    "A smoky, cumin-scented black bean soup topped with lime crema, avocado, and crispy tortilla strips.",
    "Mexican", "mexican", "easy", 15, 30, "simmering", 6, "6 servings",
    [i("black beans","3","15-oz cans","undrained"), i("onion","1","large","diced"), i("garlic","4","cloves","minced"), i("jalapeño","1","","seeded and minced"), i("cumin","2","tsp"), i("smoked paprika","1","tsp"), i("chipotle in adobo","1","tbsp","minced"), i("vegetable broth","2","cups"), i("lime","2","","juiced"), i("olive oil","2","tbsp"), i("sour cream","0.25","cup"), i("avocado","1","","diced"), i("cilantro","0.25","cup"), i("kosher salt","1","tsp")],
    [
      "Heat olive oil in a large pot over medium heat. Cook onion until soft, about 8 minutes. Add garlic, jalapeño, cumin, and paprika. Cook 1 minute.",
      "Add beans with their liquid, broth, and chipotle. Bring to a boil, then simmer 20 minutes.",
      "Blend half the soup until smooth, then return to the pot for a chunky-smooth texture.",
      "Stir in lime juice and season with salt.",
      "Mix sour cream with a squeeze of lime for the crema. Serve soup topped with lime crema, diced avocado, and cilantro."
    ],
    [8, 20, null, null, null],
    ["soup", "black-beans", "mexican", "comfort-food"],
    "https://www.bonappetit.com/recipe/black-bean-soup"
  ),

  // 49. Creamy Polenta with Roasted Mushrooms
  recipe(
    "Creamy Polenta with Roasted Mushrooms", "ba-creamy-polenta-roasted-mushrooms",
    "Silky, buttery polenta topped with deeply caramelized roasted mushrooms, Parmesan, and fresh herbs.",
    "Italian", "italian", "medium", 15, 30, "roasting and cooking", 4, "4 servings",
    [i("polenta (coarse cornmeal)","1","cup"), i("mixed mushrooms","1.5","lbs","torn or sliced"), i("Parmesan","0.75","cup","grated"), i("unsalted butter","4","tbsp"), i("whole milk","1","cup"), i("water","3","cups"), i("garlic","4","cloves","minced"), i("fresh thyme","1","tbsp"), i("olive oil","3","tbsp"), i("balsamic vinegar","1","tbsp"), i("kosher salt","1.5","tsp"), i("black pepper","0.5","tsp"), i("fresh parsley","2","tbsp","chopped")],
    [
      "Preheat the oven to 425°F. Toss mushrooms with olive oil, garlic, thyme, salt, and pepper. Roast until deeply golden, about 25 minutes. Drizzle with balsamic vinegar.",
      "Bring water and milk to a boil in a saucepan. Slowly whisk in polenta in a steady stream.",
      "Reduce heat to low and cook, stirring frequently, until polenta is thick and creamy, about 25 minutes.",
      "Stir in butter and Parmesan. Season with salt and pepper.",
      "Spoon polenta into bowls and top with roasted mushrooms. Garnish with parsley and extra Parmesan."
    ],
    [25, null, 25, null, null],
    ["polenta", "mushroom", "italian", "comfort-food"],
    "https://www.bonappetit.com/recipe/creamy-polenta-mushrooms"
  ),

  // 50. Roasted Vegetable Lasagna
  recipe(
    "Roasted Vegetable Lasagna", "ba-roasted-vegetable-lasagna",
    "Layers of roasted zucchini, eggplant, and bell peppers between sheets of pasta with ricotta and mozzarella.",
    "Italian-American", "italian", "hard", 40, 55, "baking", 8, "8 servings",
    [i("lasagna noodles","12","sheets"), i("zucchini","2","","sliced lengthwise"), i("eggplant","1","medium","sliced"), i("red bell peppers","2","","quartered"), i("ricotta cheese","15","oz"), i("mozzarella cheese","1","lb","shredded"), i("Parmesan","1","cup","grated"), i("marinara sauce","4","cups"), i("eggs","1",""), i("fresh basil","0.25","cup","chopped"), i("olive oil","3","tbsp"), i("kosher salt","1","tsp"), i("black pepper","0.5","tsp")],
    [
      "Preheat the oven to 425°F. Toss zucchini, eggplant, and bell peppers with olive oil, salt, and pepper. Roast until tender and lightly charred, about 25 minutes. Reduce oven to 375°F.",
      "Cook lasagna noodles according to package directions. Drain.",
      "Mix ricotta with egg, half the Parmesan, basil, salt, and pepper.",
      "In a 9x13 dish, spread 1 cup marinara. Layer noodles, ricotta mixture, roasted vegetables, mozzarella, and more sauce. Repeat layers, ending with sauce and mozzarella on top. Sprinkle remaining Parmesan.",
      "Cover with foil and bake 30 minutes. Uncover and bake 15 more minutes until bubbly and golden. Rest 15 minutes before serving."
    ],
    [25, null, null, null, 45],
    ["lasagna", "italian", "baked", "pasta", "comfort-food"],
    "https://www.bonappetit.com/recipe/roasted-vegetable-lasagna"
  ),
]

async function main() {
  // First, get existing slugs to avoid duplicates
  const existingRes = await fetch(
    `${SUPABASE_URL}/rest/v1/recipes?select=slug`,
    {
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
      },
    }
  )
  const existing = await existingRes.json()
  const existingSlugs = new Set((existing as { slug: string }[]).map((r) => r.slug))

  console.log(`Found ${existingSlugs.size} existing recipes`)
  console.log(`Prepared ${recipes.length} recipes to import`)

  // Filter out any duplicates
  const toInsert = recipes.filter((r) => !existingSlugs.has(r.slug))
  console.log(`Will insert ${toInsert.length} new recipes (${recipes.length - toInsert.length} skipped as duplicates)`)

  if (toInsert.length === 0) {
    console.log('No new recipes to insert.')
    return
  }

  // Insert in batches of 10
  const batchSize = 10
  let successCount = 0
  let failCount = 0

  for (let i = 0; i < toInsert.length; i += batchSize) {
    const batch = toInsert.slice(i, i + batchSize)
    console.log(`\nInserting batch ${Math.floor(i / batchSize) + 1} (${batch.length} recipes)...`)

    const res = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify(batch),
    })

    if (res.ok) {
      const inserted = await res.json()
      successCount += inserted.length
      console.log(`  OK - Inserted ${inserted.length} recipes:`)
      for (const r of inserted) {
        console.log(`    - ${r.title} (${r.slug})`)
      }
    } else {
      const error = await res.text()
      console.error(`  BATCH FAILED: ${res.status} ${error}`)

      // Try inserting individually to identify the problem
      for (const recipe of batch) {
        const singleRes = await fetch(`${SUPABASE_URL}/rest/v1/recipes`, {
          method: 'POST',
          headers: {
            apikey: SERVICE_KEY,
            Authorization: `Bearer ${SERVICE_KEY}`,
            'Content-Type': 'application/json',
            Prefer: 'return=representation',
          },
          body: JSON.stringify(recipe),
        })

        if (singleRes.ok) {
          successCount++
          console.log(`    OK: ${recipe.title}`)
        } else {
          failCount++
          const err = await singleRes.text()
          console.error(`    FAIL: ${recipe.title}: ${err}`)
        }
      }
    }
  }

  console.log(`\n=== DONE ===`)
  console.log(`Successfully inserted: ${successCount}`)
  console.log(`Failed: ${failCount}`)
  console.log(`Total recipes: ${recipes.length}`)
}

main().catch(console.error)
