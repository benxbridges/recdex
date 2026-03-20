#!/usr/bin/env bun

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

// ---------- Supabase ----------
const SUPABASE_URL = "https://zacwsrcdvpglrcvirlng.supabase.co";
const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InphY3dzcmNkdnBnbHJjdmlybG5nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE4NzYwNTMsImV4cCI6MjA4NzQ1MjA1M30.ShCsMBs1mvIK-_3r3GhOTkStmUAUagGQvil5q763D9c";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// ---------- MCP Server ----------
const server = new McpServer({
  name: "recdex",
  version: "0.1.0",
});

// ---------- Tools ----------

// 1. Search / browse recipes
server.tool(
  "search_recipes",
  "Search and filter published recipes. Returns a list of matching recipes with key metadata.",
  {
    query: z.string().optional().describe("Free-text search term for title or description"),
    cuisine: z.string().optional().describe("Filter by cuisine (e.g. Italian, Thai, Mexican)"),
    difficulty: z.enum(["easy", "medium", "advanced"]).optional().describe("Filter by difficulty level"),
    max_time: z.number().optional().describe("Maximum total time in minutes"),
    limit: z.number().min(1).max(50).default(10).describe("Number of results to return"),
    offset: z.number().min(0).default(0).describe("Offset for pagination"),
  },
  async ({ query, cuisine, difficulty, max_time, limit, offset }) => {
    let q = supabase
      .from("recipes")
      .select("id, slug, title, description, cuisine, difficulty, time_total, time_active, servings, image_url, tags")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (query) q = q.or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    if (cuisine) q = q.ilike("cuisine", `%${cuisine}%`);
    if (difficulty) q = q.eq("difficulty", difficulty);
    if (max_time) q = q.lte("time_total", max_time);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// 2. Get recipe details
server.tool(
  "get_recipe",
  "Get full details for a single recipe by slug, including ingredients and steps.",
  {
    slug: z.string().describe("The recipe slug (URL-friendly identifier)"),
  },
  async ({ slug }) => {
    const { data, error } = await supabase
      .from("recipes")
      .select("*")
      .eq("slug", slug)
      .single();

    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// 3. List trending viral videos
server.tool(
  "list_viral_videos",
  "List trending cooking videos from YouTube, TikTok, and Instagram.",
  {
    platform: z.enum(["youtube", "tiktok", "instagram"]).optional().describe("Filter by platform"),
    featured_only: z.boolean().default(false).describe("Only return featured/curated videos"),
    limit: z.number().min(1).max(30).default(10).describe("Number of results"),
  },
  async ({ platform, featured_only, limit }) => {
    let q = supabase
      .from("viral_videos")
      .select("id, platform, dish_name, title, author_name, video_url, thumbnail_url, view_count, like_count, is_featured, linked_recipe_slug, curator_notes")
      .eq("is_active", true)
      .order("view_count", { ascending: false })
      .limit(limit);

    if (platform) q = q.eq("platform", platform);
    if (featured_only) q = q.eq("is_featured", true);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// 4. List discussion threads
server.tool(
  "list_threads",
  "List community discussion threads, optionally filtered by tag.",
  {
    tag: z.string().optional().describe("Filter by tag (e.g. question, tip, discussion)"),
    limit: z.number().min(1).max(30).default(10).describe("Number of results"),
  },
  async ({ tag, limit }) => {
    let q = supabase
      .from("threads")
      .select("id, title, body, tag, author_display_name, upvote_count, reply_count, created_at")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (tag) q = q.eq("tag", tag);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// 5. Get thread with replies
server.tool(
  "get_thread",
  "Get a discussion thread and its replies.",
  {
    thread_id: z.string().describe("The thread UUID"),
  },
  async ({ thread_id }) => {
    const [threadResult, repliesResult] = await Promise.all([
      supabase.from("threads").select("*").eq("id", thread_id).single(),
      supabase.from("thread_replies").select("*").eq("thread_id", thread_id).order("created_at", { ascending: true }),
    ]);

    if (threadResult.error)
      return { content: [{ type: "text" as const, text: `Error: ${threadResult.error.message}` }] };

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({ thread: threadResult.data, replies: repliesResult.data ?? [] }, null, 2),
        },
      ],
    };
  }
);

// 6. List external recipes
server.tool(
  "list_external_recipes",
  "List curated external recipe links from sites like NYT Cooking, Bon Appetit, Serious Eats, etc.",
  {
    cuisine: z.string().optional().describe("Filter by cuisine"),
    source_name: z.string().optional().describe("Filter by source site (e.g. 'NYT Cooking', 'Bon Appétit')"),
    limit: z.number().min(1).max(30).default(10).describe("Number of results"),
  },
  async ({ cuisine, source_name, limit }) => {
    let q = supabase
      .from("external_recipes")
      .select("id, title, source_name, source_url, description, cuisine, time_estimate, matched_recipe_slug")
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (cuisine) q = q.ilike("cuisine", `%${cuisine}%`);
    if (source_name) q = q.ilike("source_name", `%${source_name}%`);

    const { data, error } = await q;
    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data, null, 2) }],
    };
  }
);

// 7. Get comments for an item
server.tool(
  "get_comments",
  "Get comments for a specific item (recipe, external recipe, thread, etc.).",
  {
    item_type: z.string().describe("The item type (e.g. 'external', 'community', 'recipe')"),
    item_id: z.string().describe("The item identifier"),
  },
  async ({ item_type, item_id }) => {
    const { data, error } = await supabase
      .from("item_comments")
      .select("*")
      .eq("item_type", item_type)
      .eq("item_id", item_id)
      .order("created_at", { ascending: false });

    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(data ?? [], null, 2) }],
    };
  }
);

// 8. Get recipe stats / overview
server.tool(
  "get_recipe_stats",
  "Get aggregate statistics about the recipe catalog — total counts by cuisine, difficulty, etc.",
  {},
  async () => {
    const { data, error } = await supabase
      .from("recipes")
      .select("cuisine, difficulty, status")
      .eq("status", "published");

    if (error) return { content: [{ type: "text" as const, text: `Error: ${error.message}` }] };

    const recipes = data ?? [];
    const cuisineCounts: Record<string, number> = {};
    const difficultyCounts: Record<string, number> = {};

    for (const r of recipes) {
      const c = r.cuisine?.split(/[,/]/)[0]?.trim() || "Other";
      cuisineCounts[c] = (cuisineCounts[c] || 0) + 1;
      const d = r.difficulty || "unknown";
      difficultyCounts[d] = (difficultyCounts[d] || 0) + 1;
    }

    const stats = {
      total_published: recipes.length,
      by_cuisine: Object.entries(cuisineCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([cuisine, count]) => ({ cuisine, count })),
      by_difficulty: Object.entries(difficultyCounts)
        .sort((a, b) => b[1] - a[1])
        .map(([difficulty, count]) => ({ difficulty, count })),
    };

    return {
      content: [{ type: "text" as const, text: JSON.stringify(stats, null, 2) }],
    };
  }
);

// ---------- Resources ----------

server.resource(
  "pipeline-config",
  "recdex://pipeline/config",
  "Recipe pipeline configuration: confidence weights, thresholds, and brand voice guidelines.",
  async (uri) => {
    const configPath = new URL("../scripts/recipe-pipeline/config.mjs", import.meta.url).pathname;
    const content = await Bun.file(configPath).text();
    return {
      contents: [{ uri: uri.href, mimeType: "text/javascript", text: content }],
    };
  }
);

// ---------- Start ----------
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("RecDex MCP server running on stdio");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
