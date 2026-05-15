import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/app/lib/supabase'
import { isAdminAuthenticated } from '@/app/lib/security'

const SEED_THREADS = [
  {
    title: 'Best chef\'s knife under $80 — what are you using?',
    body: 'I\'ve been using the same dull Walmart knife for years and it\'s time to upgrade. Budget is around $80. I mostly do vegetables and boneless proteins. What do you all recommend?\n\nI\'ve been looking at the Victorinox Fibrox Pro and the Tojiro DP series but would love to hear from people who actually own them.',
    tag: 'Cookware',
    author_display_name: 'sarah_m',
    replies: [
      { body: 'Victorinox Fibrox Pro 8". It\'s $35 and outperforms knives 3x its price. Every professional chef I know has one as a beater knife. The edge retention is surprisingly good for the price.', author_display_name: 'marco_r' },
      { body: 'Tojiro DP Gyuto 210mm. It\'s Japanese steel so it\'s harder and holds an edge longer, but it\'s also more brittle — don\'t use it on bones. For vegetables and proteins it\'s perfect. Around $55 on Amazon.', author_display_name: 'jake_w' },
      { body: 'Hot take: get the MAC MTH-80. It\'s right at $80 and it\'s the knife that made me stop wanting a more expensive one. Great balance, thin grind, comfortable handle.', author_display_name: 'nina_k' },
    ],
  },
  {
    title: 'How do you actually get a good sear without setting off the smoke alarm?',
    body: 'Every time I try to get a proper sear on a steak, my kitchen fills with smoke and the alarm goes off. I have an electric stove (can\'t change it, renting). Am I doomed or is there a technique I\'m missing?',
    tag: 'Technique',
    author_display_name: 'jake_w',
    replies: [
      { body: 'Avocado oil + make sure the steak is BONE DRY. Pat it like you mean it. I use paper towels, then leave it uncovered in the fridge for an hour. The drier the surface, the less smoke and the better the crust.', author_display_name: 'priya_s' },
      { body: 'Try the reverse sear method. Bake at 250°F until 10-15° below target temp, then a quick 60-second sear per side in a ripping hot cast iron. Way less smoke because the surface is already dry from the oven.', author_display_name: 'ben_c' },
      { body: 'Open a window, put a fan pointing out, and commit. Some smoke is unavoidable for a great sear. But yes, avocado oil (high smoke point) and a dry steak are the two biggest factors.', author_display_name: 'foodie_j' },
    ],
  },
  {
    title: 'What\'s a dish you were afraid to try making but turned out easy?',
    body: 'I finally tried making fresh pasta last weekend and I couldn\'t believe how simple it was — literally flour and eggs. I was so intimidated for years. What dishes did you overthink before trying?',
    tag: 'Discussion',
    author_display_name: 'nina_k',
    replies: [
      { body: 'Croissants. Yes, they take 2 days but 90% of that is waiting. The actual hands-on work is maybe 45 minutes total. And homemade croissants are in a completely different league.', author_display_name: 'alex_r' },
      { body: 'Risotto. Every recipe makes it sound like you need to stand there stirring for 45 minutes straight. In reality, you stir occasionally and it\'s very forgiving. The "constant stirring" thing is a myth.', author_display_name: 'sarah_m' },
      { body: 'Sourdough bread. The starter takes a week but once it\'s alive, a loaf is literally: mix, wait, fold, wait, shape, bake. Active time is maybe 20 minutes.', author_display_name: 'marco_r' },
    ],
  },
  {
    title: 'Cast iron vs carbon steel — which do you actually reach for more?',
    body: 'I have both a Lodge cast iron and a de Buyer carbon steel pan. I find myself reaching for the carbon steel way more often because it\'s lighter and heats faster. Am I weird? What do you all prefer for everyday cooking?',
    tag: 'Cookware',
    author_display_name: 'ben_c',
    replies: [
      { body: 'Carbon steel 100%. Same seasoning benefits as cast iron but half the weight. My cast iron only comes out for cornbread and deep frying now.', author_display_name: 'priya_s' },
      { body: 'Cast iron for low-and-slow things (braising, baking), carbon steel for high-heat searing and stir fry. They complement each other, not compete.', author_display_name: 'nina_k' },
    ],
  },
  {
    title: 'Weeknight dinner that impresses guests but takes under 45 min?',
    body: 'Having friends over Thursday after work. Need something that looks and tastes impressive but I can realistically pull off in under 45 minutes including prep. Bonus points if I can prep anything in advance.',
    tag: 'Rec me',
    author_display_name: 'foodie_j',
    replies: [
      { body: 'Miso salmon + quick pickled cucumbers + rice. Looks restaurant-level, takes 25 minutes. Marinate the salmon in white miso + mirin + sake while the rice cooks, then broil 8 minutes. Done.', author_display_name: 'ben_c' },
      { body: 'Cacio e pepe. 20 minutes, 4 ingredients, and people lose their minds every time. The trick is pasta water — save a full cup and add it gradually.', author_display_name: 'marco_r' },
      { body: 'Sheet pan chicken thighs with whatever vegetables you have. Season generously, roast at 425°F for 30 min. Prep the night before and just pop it in when you get home.', author_display_name: 'sarah_m' },
    ],
  },
  {
    title: 'The most underrated spice in your pantry?',
    body: 'I\'ll go first: white pepper. It\'s not just "less spicy black pepper" — it has this earthy, fermented quality that works incredible in cream sauces, mashed potatoes, and Chinese food. What\'s yours?',
    tag: 'Discussion',
    author_display_name: 'priya_s',
    replies: [
      { body: 'Sumac. It adds this bright, lemony tartness to everything. Sprinkle it on hummus, roasted vegetables, grilled meat, even fruit. It\'s like citrus in powder form.', author_display_name: 'nina_k' },
      { body: 'MSG. I know it\'s not technically a spice, but a tiny pinch makes everything taste more "complete." The stigma around it is completely unfounded.', author_display_name: 'jake_w' },
      { body: 'Urfa biber (Turkish chili flakes). Smoky, slightly sweet, raisin-like heat. It goes on everything — eggs, pasta, pizza, roasted veggies. Way more complex than regular red pepper flakes.', author_display_name: 'alex_r' },
    ],
  },
]

export async function POST(req: NextRequest) {
  // One-time seed: admin only.
  if (!isAdminAuthenticated(req)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  }

  // Check if threads already exist
  const { data: existing } = await supabase.from('threads').select('id').limit(1)
  if (existing && existing.length > 0) {
    return NextResponse.json({ message: 'Threads already seeded', count: existing.length })
  }

  const results = []
  for (const thread of SEED_THREADS) {
    // Insert thread
    const { data: threadData, error: threadError } = await supabase.from('threads').insert({
      title: thread.title,
      body: thread.body,
      tag: thread.tag,
      author_display_name: thread.author_display_name,
      upvote_count: Math.floor(Math.random() * 60) + 15,
      reply_count: thread.replies.length,
    }).select().single()

    if (threadError || !threadData) {
      results.push({ title: thread.title, error: threadError?.message })
      continue
    }

    // Insert replies
    for (const reply of thread.replies) {
      await supabase.from('thread_replies').insert({
        thread_id: threadData.id,
        body: reply.body,
        author_display_name: reply.author_display_name,
      })
    }

    results.push({ title: thread.title, id: threadData.id, replies: thread.replies.length })
  }

  return NextResponse.json({ message: 'Seeded discussions', results })
}
