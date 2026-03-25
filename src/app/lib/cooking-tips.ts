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
    id: 'room-temp',
    trigger: /\broom temperature\b/i,
    title: 'Room temperature matters',
    tip: 'Cold butter or eggs can break emulsions and create uneven textures. About 30–60 minutes on the counter is usually enough.',
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
