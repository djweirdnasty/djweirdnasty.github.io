// ============================================================
// Cloudflare Worker: per-DJ social-preview (Open Graph) pages
// ============================================================
// What this does:
//   Serves djweirdnasty.com/dj/<slug> with OG meta tags built
//   from the DJ's real profile (name, photo, city) so link
//   previews on Instagram/iMessage/etc. show e.g.
//   "Ayo Weird's Profile | Sounds of Logan" + their photo.
//   Human visitors are redirected to the full profile at
//   djweirdnasty.com/dj.html?dj=<slug>.
//
// How to deploy (one-time, ~5 min, free tier):
//   1. dash.cloudflare.com → Workers & Pages → Create Worker →
//      name it e.g. "sol-dj-og" → Deploy.
//   2. Click "Edit code", paste this entire file, Deploy.
//   3. Worker → Settings → Triggers → Routes → Add route:
//        Route:  djweirdnasty.com/dj/*
//        Zone:   djweirdnasty.com
//   4. Share URLs like: https://djweirdnasty.com/dj/ayo-weird
// ============================================================

const PROFILE_FN =
  "https://us-central1-studio-3475382917-e5aaa.cloudfunctions.net/getPublicDjProfile";
const SITE = "https://djweirdnasty.com";

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const slug = decodeURIComponent(url.pathname.replace(/^\/dj\/?/, "")).replace(/\/+$/, "");
    if (!slug) {
      return Response.redirect(SITE + "/sol.html", 302);
    }

    let dj = null;
    try {
      const res = await fetch(PROFILE_FN, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data: { name: slug } }),
      });
      const json = await res.json();
      dj = json && json.result ? json.result : null;
    } catch (e) {
      dj = null;
    }

    // Unknown DJ → send visitors to the main page.
    if (!dj || !dj.uid) {
      return Response.redirect(SITE + "/sol.html", 302);
    }

    const dest = SITE + "/dj.html?dj=" + encodeURIComponent(dj.slug || slug);
    const title = esc(dj.name) + "'s Profile | Sounds of Logan";
    const desc =
      esc(
        (dj.city && dj.state ? "DJ in " + dj.city + ", " + dj.state + ". " : "") +
          "Book " + dj.name + " on SOL — verified DJ" +
          (dj.hourlyRate ? ", $" + dj.hourlyRate + "/hr" : "") + "."
      );
    const image = dj.avatar || SITE + "/sol-logo.png";

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>${title}</title>
<meta name="description" content="${desc}">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${desc}">
<meta property="og:type" content="profile">
<meta property="og:url" content="${esc(url.toString())}">
<meta property="og:image" content="${esc(image)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${desc}">
<meta name="twitter:image" content="${esc(image)}">
<meta http-equiv="refresh" content="0; url=${esc(dest)}">
<link rel="canonical" href="${esc(dest)}">
</head>
<body style="background:#000;color:#fff;font-family:sans-serif;text-align:center;padding:3rem 1rem;">
<p>Opening ${esc(dj.name)}'s profile…</p>
<script>window.location.replace(${JSON.stringify(dest)});</script>
</body>
</html>`;

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        // Scrapers re-fetch anyway; keep this short so profile edits
        // (new photo, name change) reach previews quickly.
        "Cache-Control": "public, max-age=300",
      },
    });
  },
};

function esc(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
  });
}
