import {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, AlignmentType, LevelFormat, ExternalHyperlink,
  HeadingLevel, BorderStyle, WidthType, ShadingType, PageNumber, PageBreak,
  TabStopType, TabStopPosition
} from 'docx';
import fs from 'fs';

// ===== DESIGN TOKENS =====
const BRAND = "D4603A"  // RecDex accent (warm red-orange)
const DARK = "1A1A1A"
const MID = "555555"
const LIGHT = "888888"
const RULE = "E0E0E0"
const HEADER_BG = "FFF8F5"
const ROW_ALT = "FAFAFA"

const border = { style: BorderStyle.SINGLE, size: 1, color: RULE }
const borders = { top: border, bottom: border, left: border, right: border }
const noBorder = { style: BorderStyle.NONE, size: 0 }
const noBorders = { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder }

// Page dimensions (US Letter)
const PAGE_W = 12240
const MARGIN = 1440
const CONTENT_W = PAGE_W - MARGIN * 2  // 9360

// ===== HELPERS =====
function heading1(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 480, after: 200 },
    children: [new TextRun({ text, bold: true, font: "Georgia", size: 32, color: DARK })]
  })
}

function heading2(text) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 360, after: 160 },
    children: [new TextRun({ text, bold: true, font: "Georgia", size: 26, color: DARK })]
  })
}

function heading3(text) {
  return new Paragraph({
    spacing: { before: 240, after: 120 },
    children: [new TextRun({ text, bold: true, font: "Arial", size: 22, color: DARK })]
  })
}

function body(text, opts = {}) {
  return new Paragraph({
    spacing: { after: opts.noSpaceAfter ? 0 : 160, line: 320 },
    children: [new TextRun({ text, font: "Arial", size: 21, color: opts.color || MID })]
  })
}

function bodyBold(label, text) {
  return new Paragraph({
    spacing: { after: 160, line: 320 },
    children: [
      new TextRun({ text: label, bold: true, font: "Arial", size: 21, color: DARK }),
      new TextRun({ text, font: "Arial", size: 21, color: MID }),
    ]
  })
}

function bullet(text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80, line: 300 },
    children: [new TextRun({ text, font: "Arial", size: 21, color: MID })]
  })
}

function bulletBold(label, text, level = 0) {
  return new Paragraph({
    numbering: { reference: "bullets", level },
    spacing: { after: 80, line: 300 },
    children: [
      new TextRun({ text: label, bold: true, font: "Arial", size: 21, color: DARK }),
      new TextRun({ text, font: "Arial", size: 21, color: MID }),
    ]
  })
}

function spacer(h = 200) {
  return new Paragraph({ spacing: { after: h }, children: [] })
}

function divider() {
  return new Paragraph({
    spacing: { before: 200, after: 200 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 8 } },
    children: []
  })
}

function makeRow(cells, isHeader = false) {
  return new TableRow({
    children: cells.map((text, i) => new TableCell({
      borders,
      width: { size: cells._widths?.[i] || Math.floor(CONTENT_W / cells.length), type: WidthType.DXA },
      shading: isHeader
        ? { fill: HEADER_BG, type: ShadingType.CLEAR }
        : { type: ShadingType.CLEAR },
      margins: { top: 60, bottom: 60, left: 100, right: 100 },
      children: [new Paragraph({
        children: [new TextRun({
          text: String(text),
          bold: isHeader,
          font: "Arial",
          size: 19,
          color: isHeader ? DARK : MID
        })]
      })]
    }))
  })
}

function makeTable(headers, rows, widths) {
  headers._widths = widths
  rows.forEach(r => r._widths = widths)
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    rows: [
      makeRow(headers, true),
      ...rows.map(r => makeRow(r))
    ]
  })
}

// ===== DOCUMENT =====
const doc = new Document({
  numbering: {
    config: [
      {
        reference: "bullets",
        levels: [
          { level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
          { level: 1, format: LevelFormat.BULLET, text: "\u25E6", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 1440, hanging: 360 } } } },
        ]
      },
      {
        reference: "numbers",
        levels: [
          { level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
            style: { paragraph: { indent: { left: 720, hanging: 360 } } } },
        ]
      }
    ]
  },
  styles: {
    default: { document: { run: { font: "Arial", size: 22 } } },
    paragraphStyles: [
      { id: "Heading1", name: "Heading 1", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 32, bold: true, font: "Georgia" },
        paragraph: { spacing: { before: 480, after: 200 }, outlineLevel: 0 } },
      { id: "Heading2", name: "Heading 2", basedOn: "Normal", next: "Normal", quickFormat: true,
        run: { size: 26, bold: true, font: "Georgia" },
        paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 1 } },
    ]
  },
  sections: [
    // ===== COVER PAGE =====
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 }
        }
      },
      children: [
        spacer(2400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "RECDEX", font: "Georgia", size: 56, bold: true, color: DARK, characterSpacing: 200 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 120 },
          children: [new TextRun({ text: "Recipe Index", font: "Georgia", size: 28, color: BRAND })]
        }),
        spacer(400),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 12 },
                    bottom: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 12 } },
          spacing: { before: 200, after: 200 },
          children: [new TextRun({ text: "Business Plan, Monetization Strategy & Operating Budget", font: "Arial", size: 24, color: MID })]
        }),
        spacer(600),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "CONFIDENTIAL", font: "Arial", size: 18, color: LIGHT, characterSpacing: 100 })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 80 },
          children: [new TextRun({ text: "March 2026", font: "Arial", size: 20, color: LIGHT })]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: "www.recipeindex.org", font: "Arial", size: 20, color: BRAND })]
        }),
      ]
    },

    // ===== MAIN CONTENT =====
    {
      properties: {
        page: {
          size: { width: PAGE_W, height: 15840 },
          margin: { top: 1440, right: 1440, bottom: 1200, left: 1440 }
        }
      },
      headers: {
        default: new Header({
          children: [new Paragraph({
            border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: RULE, space: 4 } },
            tabStops: [{ type: TabStopType.RIGHT, position: TabStopPosition.MAX }],
            children: [
              new TextRun({ text: "RecDex Business Plan", font: "Arial", size: 16, color: LIGHT }),
              new TextRun({ text: "\tConfidential", font: "Arial", size: 16, color: LIGHT }),
            ]
          })]
        })
      },
      footers: {
        default: new Footer({
          children: [new Paragraph({
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({ text: "Page ", font: "Arial", size: 16, color: LIGHT }),
              new TextRun({ children: [PageNumber.CURRENT], font: "Arial", size: 16, color: LIGHT }),
            ]
          })]
        })
      },
      children: [
        // ===== 1. EXECUTIVE SUMMARY =====
        heading1("1. Executive Summary"),

        body("RecDex (Recipe Index) is a free, ad-free, community-driven recipe platform built to be the most useful, least annoying recipe site on the internet. The product provides structured, searchable recipes with features purpose-built for actual cooking: ingredient check-off, step-by-step cook mode, automatic servings adjustment, grocery list generation, and AI-powered recipe extraction from cooking videos."),

        body("The platform currently hosts 300+ published recipes across 20+ cuisines, with community features including discussion forums, recipe notes, and a contribution system that lets users extract structured recipes from TikTok, YouTube, and Instagram cooking videos."),

        body("RecDex aspires to become the Letterboxd of food: a community-first platform where people discover, save, organize, and discuss recipes with the same passion and social engagement that Letterboxd brings to film."),

        heading3("Current Status"),
        bullet("302 published recipes, manually curated and structured"),
        bullet("Community forums with upvoting and threaded replies"),
        bullet("AI recipe extraction from video platforms (YouTube, TikTok, Instagram)"),
        bullet("Cook mode, servings adjuster, pantry tracker, grocery lists"),
        bullet("Dark/light theme, mobile-responsive design"),
        bullet("Production domain: recipeindex.org (Vercel + Supabase)"),

        heading3("Key Metrics Target (12-Month)"),
        makeTable(
          ["Metric", "Current", "6-Month Target", "12-Month Target"],
          [
            ["Published recipes", "302", "1,000", "3,000"],
            ["Monthly active users", "~0 (pre-launch)", "5,000", "25,000"],
            ["Community contributions", "1", "200", "1,000"],
            ["Registered accounts", "0", "2,000", "10,000"],
            ["Waitlist signups", "0", "500", "N/A (launched)"],
          ],
          [2340, 2340, 2340, 2340]
        ),

        divider(),

        // ===== 2. THE LETTERBOXD MODEL =====
        heading1("2. The Letterboxd Model: A Blueprint"),

        body("Letterboxd grew from a niche film-logging tool (founded 2011 in New Zealand) to a 17-million-member social platform valued at $50\u201360M. Their trajectory offers a direct blueprint for RecDex."),

        heading2("2.1 What Letterboxd Got Right"),

        bulletBold("Community is the product. ", "The film catalog is the spine, but reviews, lists, and social feeds are why people stay. RecDex must build the same: recipes are the spine, but notes, forks, collections, and discussion keep people coming back."),
        bulletBold("Generous free tier. ", "Every core feature is free. Paid tiers (Pro at $19/yr, Patron at $49/yr) offer power-user features and are framed as supporting the platform, not unlocking essentials."),
        bulletBold("Cultural identity. ", "Letterboxd became a social signal\u2014your profile says something about you. RecDex should aim for the same: your recipe collection reflects your taste, curiosity, and cooking identity."),
        bulletBold("Organic growth. ", "No paid acquisition. Growth came from word-of-mouth, social media sharing, and cultural moments (IMDb forums closing in 2017, pandemic streaming in 2020)."),
        bulletBold("Clean monetization. ", "No sponsored content in feeds. Ads only for free users. Partnerships (film festivals, studios) are non-disruptive."),

        heading2("2.2 Letterboxd Revenue Breakdown"),
        makeTable(
          ["Source", "Description", "Est. Contribution"],
          [
            ["Pro/Patron subscriptions", "Power-user features + platform support", "Primary (~60\u201370%)"],
            ["Advertising", "Display ads for free-tier users", "Secondary (~15\u201320%)"],
            ["HQ accounts", "Studio/distributor business accounts", "Growing (~10%)"],
            ["Video Store", "Digital film rentals (launched late 2025)", "New/experimental"],
          ],
          [2800, 4200, 2360]
        ),
        spacer(100),
        body("Estimated annual revenue: ~$19M. Team of ~93 employees. 17M registered members."),

        heading2("2.3 Translating to Food"),
        makeTable(
          ["Letterboxd Concept", "RecDex Equivalent"],
          [
            ["Film catalog", "Recipe index"],
            ["Watch/log/rate", "Cook/save/rate"],
            ["Reviews", "Community notes + recipe forks"],
            ["Lists (\"Best of 2024\")", "Collections (\"Weeknight Winners\", \"Summer Grilling\")"],
            ["Watchlist", "Want to Cook list"],
            ["Four Favourites", "Signature Dishes (profile feature)"],
            ["Activity feed", "Community feed (cooked, saved, contributed)"],
            ["HQ accounts (studios)", "Brand/creator accounts (food bloggers, restaurants)"],
          ],
          [4680, 4680]
        ),

        divider(),

        // ===== 3. MONETIZATION PATHWAYS =====
        heading1("3. Monetization Pathways"),

        body("Multiple viable paths exist. The recommended approach is a layered strategy that starts with community building (free), adds premium features at scale, and expands into commerce/partnerships later."),

        heading2("3.1 Path A: Freemium Subscriptions (Primary)"),
        body("The Letterboxd model. Every essential feature is free forever. Premium tiers offer power-user features and social signaling."),

        heading3("Free Tier (all users)"),
        bullet("Browse, search, and save unlimited recipes"),
        bullet("Cook mode with step-by-step guidance"),
        bullet("Servings adjuster and grocery list"),
        bullet("Community notes and discussion forums"),
        bullet("Contribute recipes (manual or video extraction)"),
        bullet("Basic profile with saved recipes"),

        heading3("RecDex Pro ($19/year)"),
        bullet("Ad-free experience (if ads are added to free tier)"),
        bullet("Advanced search filters (by ingredient, technique, time, dietary restriction)"),
        bullet("Meal planning calendar with drag-and-drop"),
        bullet("Unlimited recipe collections with custom covers"),
        bullet("Pantry-aware recipe suggestions (\"what can I make?\")"),
        bullet("Detailed cooking stats and history"),
        bullet("Export recipes (PDF, print-optimized)"),
        bullet("Priority recipe extraction from videos"),

        heading3("RecDex Patron ($49/year)"),
        bullet("Everything in Pro"),
        bullet("Custom profile themes and badge"),
        bullet("Early access to new features"),
        bullet("Recipe forking with variation trees"),
        bullet("Patron-exclusive collections and curator tools"),
        bullet("Listed in Patrons directory"),
        bullet("Framed as supporting the platform"),

        heading3("Revenue Projection (Subscriptions)"),
        makeTable(
          ["Scenario", "Users", "Conversion", "Pro Subs", "Patron Subs", "Annual Rev"],
          [
            ["Year 1 (build)", "10K", "3%", "250", "50", "$7,250"],
            ["Year 2 (grow)", "50K", "5%", "2,000", "500", "$62,500"],
            ["Year 3 (scale)", "200K", "6%", "9,000", "3,000", "$318,000"],
            ["Aspirational", "1M", "7%", "50,000", "20,000", "$1,950,000"],
          ],
          [1560, 1560, 1560, 1560, 1560, 1560]
        ),

        heading2("3.2 Path B: Affiliate Commerce"),
        body("Shoppable grocery lists and ingredient links. When a user generates a grocery list from a recipe, offer one-click ordering through Instacart, Amazon Fresh, or Walmart Grocery. Commission rates are typically 3\u20138% on grocery orders."),

        bullet("Low friction: user already has the grocery list"),
        bullet("Non-disruptive: optional integration, not required"),
        bullet("Scales with engagement: more cooking = more orders"),
        bullet("Risk: thin margins, dependency on third-party affiliate programs"),

        heading2("3.3 Path C: Creator/Brand Accounts"),
        body("Equivalent to Letterboxd HQ. Food bloggers, restaurants, cookbook authors, and CPG brands get verified profiles with analytics, promotional tools, and the ability to post stories/updates to followers."),

        bullet("Monthly subscription ($10\u201350/month depending on tier)"),
        bullet("Analytics dashboard: views, saves, cook-throughs"),
        bullet("Verified badge and featured placement"),
        bullet("Cross-promotion: link recipes to cookbooks, products, restaurants"),
        bullet("Deferred: requires meaningful user base first"),

        heading2("3.4 Path D: Tasteful Advertising"),
        body("Display ads for free-tier users only. Must be non-disruptive and contextually relevant (cookware, ingredients, kitchen tools). Never in cook mode, never interrupting the recipe flow."),

        bullet("CPM-based display ads ($5\u201315 CPM for food/cooking vertical)"),
        bullet("Sponsored recipe collections (clearly labeled)"),
        bullet("Only viable at 50K+ monthly active users"),
        bullet("Revenue potential: $2\u20135 per MAU per year"),

        heading2("3.5 Path E: Data & API Licensing"),
        body("Structured recipe data is valuable. A well-tagged, normalized recipe database could be licensed to meal kit companies, grocery platforms, smart kitchen appliances, and health/nutrition apps."),

        bullet("API access for recipe search and nutritional data"),
        bullet("White-label recipe content for partner platforms"),
        bullet("Long-term play: requires 5,000+ high-quality recipes"),

        heading2("3.6 Recommended Sequencing"),
        makeTable(
          ["Phase", "Timeline", "Revenue Source", "Prerequisite"],
          [
            ["1", "Now \u2013 Month 6", "None (build product + community)", "N/A"],
            ["2", "Month 6 \u2013 12", "Early Pro subscriptions", "1,000 recipes, 5K users"],
            ["3", "Month 12 \u2013 18", "Pro + Patron + light ads", "25K users, strong community"],
            ["4", "Month 18 \u2013 24", "Add affiliate commerce", "Grocery list feature at scale"],
            ["5", "Year 2+", "Creator accounts + API licensing", "50K+ users, brand interest"],
          ],
          [1200, 2000, 3200, 2960]
        ),

        divider(),

        // ===== 4. COMPETITIVE LANDSCAPE =====
        heading1("4. Competitive Landscape"),

        makeTable(
          ["Platform", "Model", "Community", "Revenue", "Status"],
          [
            ["Letterboxd (film)", "Freemium", "Very strong", "~$19M/yr", "Growing fast"],
            ["Cookpad", "Freemium", "Strong (Japan)", "~$41M/yr", "Stabilizing"],
            ["Paprika", "One-time purchase", "None", "~$360K/yr", "Stable/niche"],
            ["Samsung Food (Whisk)", "Free (B2B)", "Creator-driven", "Samsung subsidiary", "Active"],
            ["Yummly", "Free + affiliate", "Weak", "Whirlpool subsidiary", "Scaled back"],
            ["AllRecipes", "Ad-supported", "Moderate", "Dotdash Meredith", "Legacy"],
            ["Pinterest (recipes)", "Ad-supported", "Discovery-only", "~$3B/yr total", "Mass market"],
            ["RecDex", "TBD (freemium)", "Building", "$0", "Pre-launch"],
          ],
          [1872, 1872, 1872, 1872, 1872]
        ),

        spacer(200),
        heading3("RecDex Differentiators"),
        bulletBold("Structured-first. ", "Every recipe is normalized: typed ingredients with amounts/units, numbered steps with timers, difficulty, active/total time. No blog posts with recipes buried at the bottom."),
        bulletBold("Video extraction. ", "Unique feature: paste a TikTok/YouTube/Instagram link, AI extracts a structured recipe. Bridges the gap between social media cooking content and usable recipes."),
        bulletBold("Cook mode. ", "Purpose-built for actual cooking, not just browsing. Large text, step-by-step progression, hands-free navigation."),
        bulletBold("No ads, no life stories. ", "The anti-recipe-blog. Clean, fast, focused on the food."),
        bulletBold("Community-owned recipes. ", "Recipe forking, community notes, variation trees. Recipes evolve through collective cooking knowledge."),

        divider(),

        // ===== 5. OPERATING BUDGET =====
        heading1("5. Monthly Operating Budget"),

        heading2("5.1 Current Costs (Pre-Launch)"),
        makeTable(
          ["Item", "Service", "Monthly Cost", "Notes"],
          [
            ["Hosting", "Vercel (Hobby)", "$0", "Free tier sufficient for now"],
            ["Database", "Supabase (Free)", "$0", "500MB storage, 2 GB transfer"],
            ["Domain", "recipeindex.org", "~$1.50", "$18/year"],
            ["AI extraction", "Anthropic API", "~$5\u201310", "Pay-per-use, low volume"],
            ["YouTube API", "Google Cloud", "$0", "Free tier (10K queries/day)"],
            ["Total", "", "~$7\u201312/mo", ""],
          ],
          [2000, 2360, 2000, 3000]
        ),

        heading2("5.2 Growth Phase (1K\u201310K Users)"),
        makeTable(
          ["Item", "Service", "Monthly Cost", "Notes"],
          [
            ["Hosting", "Vercel Pro", "$20", "More bandwidth, analytics"],
            ["Database", "Supabase Pro", "$25", "8GB storage, daily backups"],
            ["AI extraction", "Anthropic API", "$30\u201380", "Moderate extraction volume"],
            ["YouTube API", "Google Cloud", "$0\u201310", "May hit free tier limits"],
            ["Email service", "Resend / Loops", "$0\u201320", "Waitlist, notifications"],
            ["Auth", "Supabase Auth", "$0", "Included in Supabase Pro"],
            ["Error tracking", "Sentry", "$0", "Free tier"],
            ["Domain + DNS", "Cloudflare", "$1.50", ""],
            ["Total", "", "~$77\u2013156/mo", ""],
          ],
          [2000, 2360, 2000, 3000]
        ),

        heading2("5.3 Scale Phase (10K\u201350K Users)"),
        makeTable(
          ["Item", "Service", "Monthly Cost", "Notes"],
          [
            ["Hosting", "Vercel Pro", "$20\u201340", "May need team plan at scale"],
            ["Database", "Supabase Pro", "$25\u201375", "May need compute add-ons"],
            ["AI extraction", "Anthropic API", "$100\u2013300", "High extraction volume"],
            ["Image storage", "Cloudflare R2 / S3", "$5\u201320", "Recipe photos, avatars"],
            ["Email service", "Resend", "$20\u201350", "Transactional + marketing"],
            ["Search", "Algolia / Meilisearch", "$0\u201350", "Advanced recipe search"],
            ["CDN / media", "Cloudflare", "$0\u201320", "Image optimization"],
            ["Monitoring", "Sentry + Vercel Analytics", "$0\u201330", ""],
            ["Total", "", "~$170\u2013585/mo", ""],
          ],
          [2000, 2360, 2000, 3000]
        ),

        heading2("5.4 Time Investment"),
        body("The primary cost is time, not infrastructure. Estimated weekly commitment:"),
        makeTable(
          ["Activity", "Hours/Week", "Phase"],
          [
            ["Recipe curation + quality control", "5\u201310", "Ongoing"],
            ["Feature development", "10\u201320", "Heavy now, decreasing"],
            ["Community moderation", "2\u20135", "Grows with users"],
            ["Content seeding (video extraction)", "3\u20135", "Phase 1\u20132"],
            ["Bug fixes + maintenance", "3\u20135", "Ongoing"],
            ["Marketing + social media", "2\u20135", "Phase 2+"],
            ["Total", "25\u201350 hrs/wk", "Equivalent to half\u2013full-time"],
          ],
          [4000, 2680, 2680]
        ),

        divider(),

        // ===== 6. PRODUCT ROADMAP =====
        heading1("6. Product Roadmap"),

        heading2("6.1 Phase 1: Foundation (Now \u2013 Month 3)"),
        body("Get the product to a state worth sharing. Every feature must feel polished, intuitive, and professional."),
        bullet("Scale recipe library to 1,000+ (fill cuisine gaps, quality audit every recipe)"),
        bullet("Implement Supabase Auth (real user accounts, profiles)"),
        bullet("Build early-access landing page with email capture"),
        bullet("Polish cook mode: larger text, swipe navigation, voice-ready architecture"),
        bullet("Polish recipe extraction: higher success rate, better transcript parsing"),
        bullet("Fix all dead links, loading states, error handling, mobile layout issues"),
        bullet("Add metric/US measurement toggle"),
        bullet("Profile pages: saved recipes, cooking history, contributed recipes"),

        heading2("6.2 Phase 2: Community (Month 3 \u2013 6)"),
        body("Build the social layer that makes people come back."),
        bullet("Recipe forking and variation trees"),
        bullet("Activity feed: see what friends cooked, saved, contributed"),
        bullet("Recipe collections (public and private)"),
        bullet("\"Cooked it\" confirmations with optional photos/notes"),
        bullet("Improved community notes: tips, substitutions, ratings"),
        bullet("Notification system (replies, upvotes, new recipes in saved collections)"),
        bullet("Share cards for social media (auto-generated recipe images)"),

        heading2("6.3 Phase 3: Growth (Month 6 \u2013 12)"),
        body("Expand content, add monetization hooks, grow the user base."),
        bullet("Launch Pro tier ($19/year)"),
        bullet("Meal planning calendar"),
        bullet("Advanced search and filtering"),
        bullet("Pantry-aware recipe suggestions"),
        bullet("Creator/brand account pilots"),
        bullet("SEO optimization for recipe schema markup (Google rich results)"),
        bullet("Social media presence (TikTok, Instagram) featuring extracted recipes"),
        bullet("Press/media outreach"),

        heading2("6.4 Phase 4: Monetization (Month 12+)"),
        bullet("Launch Patron tier ($49/year)"),
        bullet("Affiliate grocery integration"),
        bullet("Light advertising for free tier"),
        bullet("API licensing exploration"),
        bullet("Mobile app (React Native or PWA)"),

        divider(),

        // ===== 7. GO-TO-MARKET =====
        heading1("7. Go-to-Market Strategy"),

        heading2("7.1 Launch Strategy"),
        body("RecDex should launch as a public beta with an emphasis on community feedback and recipe quality. The goal is not viral growth but seeding a core community of engaged users who care about cooking and will provide feedback, contribute recipes, and recruit others organically."),

        heading3("Pre-Launch (Now)"),
        bullet("Early-access landing page with email capture"),
        bullet("Seed 1,000+ high-quality recipes across all major cuisines"),
        bullet("Invite 20\u201350 beta testers (friends, cooking enthusiasts, food content creators)"),
        bullet("Collect feedback, fix friction points, polish the experience"),

        heading3("Soft Launch"),
        bullet("Open to public, share on Hacker News, Product Hunt, Reddit (r/cooking, r/recipes)"),
        bullet("Position as \"Letterboxd for food\" in messaging"),
        bullet("Emphasize the anti-recipe-blog angle: no ads, no life stories, just food"),
        bullet("Share video extraction feature as a hook (\"turn any TikTok recipe into a real recipe\")"),

        heading3("Growth Levers"),
        bulletBold("Social sharing. ", "Make it easy and visually appealing to share recipes and collections on social media."),
        bulletBold("SEO. ", "Structured recipe data with schema.org markup ranks well in Google. Each recipe is a landing page."),
        bulletBold("Video extraction as acquisition. ", "Users discover RecDex by wanting to save a recipe from a video they saw. This is a natural, high-intent entry point."),
        bulletBold("Community flywheel. ", "More users \u2192 more notes/forks \u2192 better recipes \u2192 more users."),

        heading2("7.2 Success Metrics"),
        makeTable(
          ["Metric", "What It Measures", "Target (Month 6)"],
          [
            ["WAU (Weekly Active Users)", "Engagement", "2,000"],
            ["Recipes per user (saved)", "Value perception", "10+"],
            ["Cook mode sessions", "Core feature usage", "500/week"],
            ["Community contributions", "Community health", "20/week"],
            ["Retention (30-day)", "Product-market fit", "40%+"],
            ["NPS", "User satisfaction", "50+"],
          ],
          [3120, 3120, 3120]
        ),

        divider(),

        // ===== 8. RISKS =====
        heading1("8. Risks and Mitigations"),

        makeTable(
          ["Risk", "Severity", "Mitigation"],
          [
            ["Copyright claims on extracted recipes", "Medium", "Factual extraction only, creator attribution, DMCA process, user certification"],
            ["Low user engagement / empty community", "High", "Seed content aggressively, moderate actively, build social features early"],
            ["Recipe quality inconsistency", "Medium", "Validation pipeline, community moderation, quality scoring"],
            ["Competitor launches similar product", "Low", "First-mover in structured recipe + video extraction. Community is the moat."],
            ["Infrastructure costs exceed revenue", "Low", "Serverless architecture scales to zero. Costs are minimal until 50K+ users."],
            ["Solo founder burnout", "High", "Automate what is possible, focus on highest-impact features, consider co-founder"],
          ],
          [2200, 1200, 5960]
        ),

        divider(),

        // ===== 9. WHY NOW =====
        heading1("9. Why Now"),

        body("Three trends converge to make this the right time for RecDex:"),
        spacer(80),

        bodyBold("1. Recipe content is exploding, but recipe usability is stuck. ", "TikTok and YouTube have created more cooking content than ever, but that content lives in ephemeral video form. There is no good way to save, search, and actually cook from a video recipe. RecDex bridges this gap."),

        bodyBold("2. Recipe blogs have alienated their audience. ", "The advertising-driven recipe blog model (long personal stories, aggressive ads, paywalls) has created deep frustration among home cooks. There is pent-up demand for a clean, fast, no-nonsense alternative."),

        bodyBold("3. Community platforms are valued. ", "Letterboxd proved that niche community platforms can reach meaningful scale and revenue without venture capital or aggressive growth tactics. The playbook exists."),

        spacer(400),

        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { before: 200 },
          border: { top: { style: BorderStyle.SINGLE, size: 4, color: RULE, space: 12 } },
          children: [new TextRun({ text: "RecDex \u2014 The recipe site you actually want to use.", font: "Georgia", size: 24, italics: true, color: BRAND })]
        }),
      ]
    }
  ]
})

// ===== WRITE FILE =====
const buffer = await Packer.toBuffer(doc)
fs.writeFileSync('/Users/bxb/recdex/docs/recdex-monetization-and-business-plan.docx', buffer)
console.log('Document written successfully.')
