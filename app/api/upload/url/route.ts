import * as cheerio from "cheerio";
import { requireDosen } from "@/lib/auth";
import { apiLimiter, getClientIP, rateLimitResponse } from "@/lib/rate-limit";

const FETCH_TIMEOUT = 15_000; // 15 seconds

export async function POST(req: Request) {
  try { await requireDosen(req); } catch (e) { if (e instanceof Response) return e; }

  // Rate limit
  const ip = getClientIP(req);
  const limit = apiLimiter.check(ip);
  if (!limit.allowed) return rateLimitResponse(limit.resetAt);

  const { url } = await req.json();

  if (!url || typeof url !== "string") {
    return Response.json({ error: "URL is required" }, { status: 400 });
  }

  // Block internal/private URLs
  try {
    const parsed = new URL(url);
    if (["localhost", "127.0.0.1", "0.0.0.0", "[::1]"].includes(parsed.hostname)) {
      return Response.json({ error: "URL internal tidak diizinkan" }, { status: 400 });
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return Response.json({ error: "Hanya HTTP/HTTPS URL yang diizinkan" }, { status: 400 });
    }
  } catch {
    return Response.json({ error: "URL tidak valid" }, { status: 400 });
  }

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; ModulGenerator/1.0; +educational-tool)",
      },
      signal: controller.signal,
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return Response.json(
        { error: "Failed to fetch URL" },
        { status: 400 }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Remove non-content elements
    $(
      "script, style, nav, footer, header, aside, .sidebar, .nav, .footer, .header, .ad, .advertisement, .comments"
    ).remove();

    // Try to extract main content
    let text = "";
    const mainSelectors = [
      "article",
      "main",
      ".post-content",
      ".entry-content",
      ".article-body",
      ".content",
      "#content",
    ];

    for (const selector of mainSelectors) {
      const el = $(selector);
      if (el.length > 0) {
        text = el.text();
        break;
      }
    }

    // Fallback to body text
    if (!text) {
      text = $("body").text();
    }

    // Clean up
    text = text
      .replace(/\s+/g, " ")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    const title = $("title").text().trim() || $("h1").first().text().trim();

    return Response.json({
      text,
      title,
      wordCount: text.split(/\s+/).filter(Boolean).length,
      url,
    });
  } catch {
    return Response.json(
      { error: "Gagal mengambil konten URL (timeout atau tidak dapat diakses)" },
      { status: 500 }
    );
  }
}
