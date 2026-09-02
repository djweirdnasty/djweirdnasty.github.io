"""Automate adding a new news article to the DJWEIRDNASTY website.

Replaces the manual multi-file process: creates the article HTML page
(with OG/Twitter meta + NewsArticle JSON-LD), inserts a card into both
news-<category>.html and news.html, adds a sitemap.xml entry, then
regenerates contents.json (+ video-game/contents.json) and rss.xml.

Usage:
    python3 create_article.py path/to/article.json

Example article.json:
{
  "slug": "example-article-slug",
  "category": "national",          // national | music | sports | entertainment
  "subcategory": "Crime",          // optional; omit for "<Category> News"
  "title": "Full Headline Here",
  "description": "One or two sentence meta description / card blurb.",
  "image": "some-existing-image.webp",   // must already exist in site root
  "image_alt": "Alt text for the image",
  "published": "2026-09-02",       // YYYY-MM-DD
  "paragraphs": [
    "First paragraph of the article.",
    {"h2": "A Subheading"},
    "Paragraph under the subheading."
  ]
}
"""
import json
import re
import subprocess
import sys
from datetime import datetime
from html import escape as _esc

SITE_URL = 'https://djweirdnasty.com'

CATEGORY_LABELS = {
    'national': 'National',
    'music': 'Music',
    'sports': 'Sports',
    'entertainment': 'Entertainment',
}


def esc_attr(s):
    return _esc(s, quote=True)


def build_body_html(paragraphs):
    parts = []
    for p in paragraphs:
        if isinstance(p, dict) and 'h2' in p:
            parts.append(f'      <h2>{p["h2"]}</h2>')
        else:
            parts.append(f'      <p>{p}</p>')
    return '\n'.join(parts)


def build_article_html(cfg, published_str):
    title = cfg['title']
    desc = cfg['description']
    image = cfg['image']
    image_alt = cfg.get('image_alt', title)
    category = cfg['category']
    cat_label = CATEGORY_LABELS[category]
    subcat = cfg.get('subcategory')
    strong_line = f'{cat_label} | {subcat}' if subcat else f'{cat_label} News'
    slug = cfg['slug']
    url = f'{SITE_URL}/news-{slug}.html'
    image_url = f'{SITE_URL}/{image}'
    back_href = f'news-{category}.html'
    body_html = build_body_html(cfg['paragraphs'])

    ld = {
        "@context": "https://schema.org",
        "@type": "NewsArticle",
        "headline": title,
        "description": desc,
        "image": [image_url],
        "datePublished": cfg['_date_iso'],
        "dateModified": cfg['_date_iso'],
        "author": {"@type": "Organization", "name": "DJWEIRDNASTY"},
        "publisher": {
            "@type": "Organization",
            "name": "DJWEIRDNASTY",
            "logo": {"@type": "ImageObject", "url": f"{SITE_URL}/djweirdnasty-banner.webp"}
        },
        "mainEntityOfPage": {"@type": "WebPage", "@id": url}
    }
    ld_json = json.dumps(ld, indent=2)

    return f"""<!DOCTYPE html>
<html lang="en">
<head>
  <!-- Google tag (gtag.js) -->
  <script async src="https://www.googletagmanager.com/gtag/js?id=G-50T2Z1K2SP"></script>
  <script>
    window.dataLayer = window.dataLayer || [];
    function gtag(){{dataLayer.push(arguments);}}
    gtag('js', new Date());

    gtag('config', 'G-50T2Z1K2SP');
    gtag('config', 'GT-WB5FW6G6');
  </script>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="referrer" content="strict-origin-when-cross-origin">
  <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://pagead2.googlesyndication.com https://googleads.g.doubleclick.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; frame-src https://www.youtube.com https://audiomack.com https://googleads.g.doubleclick.net https://pagead2.googlesyndication.com; connect-src 'self' https://djweirdnasty-api.kurtisctabb.workers.dev https://www.google-analytics.com https://analytics.google.com; upgrade-insecure-requests">
  <title>{title} | DJWEIRDNASTY News</title>
  <link rel="icon" type="image/x-icon" sizes="16x16" href="/favicon-16x16.png">
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png">
  <link rel="icon" type="image/png" sizes="48x48" href="/favicon-48x48.png">
  <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png">
  <link rel="shortcut icon" href="/favicon.ico">
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png">
  <meta name="description" content="{esc_attr(desc)}">
  <meta property="og:title" content="{esc_attr(title)}">
  <meta property="og:description" content="{esc_attr(desc)}">
  <meta property="og:image" content="{image_url}">
  <meta property="og:url" content="{url}">
  <meta property="og:type" content="article">
  <meta name="twitter:card" content="summary_large_image">
  <meta name="twitter:title" content="{esc_attr(title)}">
  <meta name="twitter:description" content="{esc_attr(desc)}">
  <meta name="twitter:image" content="{image_url}">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Monoton&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="style.css?v=13">
  <link rel="sitemap" type="application/xml" title="Sitemap" href="/sitemap.xml">
  <script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-9518165099685321" crossorigin="anonymous"></script>
  <meta name="google-adsense-account" content="ca-pub-9518165099685321">

  <script type="application/ld+json">
{ld_json}
  </script>
</head>
<body>
  <header>
    <div class="container">
      <div class="site-banner">
        <img src="djweirdnasty-banner.webp" alt="DJ WEIRD NA$TY" />
      </div>
      <nav>
        <a href="index.html">Home</a>
        <a href="index.html#about">About</a>
        <a href="index.html#events">Events</a>
        <a href="news.html">News</a>
        <a href="mixtapes.html">Mixtapes</a>
        <a href="content.html">Content</a>
<a href="sol.html">SOL</a>

        <a href="index.html#newsletter">Newsletter</a>
        <a href="contact.html">Contact</a>
        <a href="privacy-policy.html">Privacy</a>
      </nav>
    </div>
  </header>
  <a href="https://www.awin1.com/cread.php?awinmid=128989&awinaffid=3038027&ued=https%3A%2F%2Fwww.stand4socks.com%2Fcollections%2Fall" target="_blank" rel="sponsored noopener">
    <img loading="lazy" src="top-banner-stand4socks.png" alt="This website is sponsored by Stand4 Socks - Shop Now" style="width: 100%; max-width: 1200px; height: auto; display: block; margin: 1.5rem auto;">
  </a>
  <main class="container">
    <article class="info" style="text-align: left;">
      <p><a href="{back_href}" style="color: #ffd860;">← Back to {cat_label}</a></p>
      <h1>{title}</h1>
      <p><strong>{strong_line}</strong></p>
      <p><em>Published: {published_str}</em></p>
      <img loading="lazy" src="{image}" alt="{esc_attr(image_alt)}" class="event-flyer" style="max-width: 100%;">
{body_html}
      <button class="share-button" data-title="{esc_attr(title)}" data-url="{url}">🔗 Share</button>
    </article>
  </main>
  <footer class="container">
    <a href="https://www.awin1.com/cread.php?awinmid=128989&awinaffid=3038027&ued=https%3A%2F%2Fwww.stand4socks.com%2Fcollections%2Fall" target="_blank" rel="sponsored noopener" style="display: block; max-width: 100%; margin: 0 auto 1.5rem;">
      <img loading="lazy" src="Stand4Socks.png" alt="Shop Stand4 Socks" style="width: 100%; max-width: 960px; height: auto; display: block; margin: 0 auto;">
    </a>
    <div style="max-width: 960px; margin: 1.5rem auto 0; padding: 1.5rem; background: rgba(26,26,26,0.85); border: 1px solid #ff5bd7; border-radius: 16px; text-align: center;">
      <p style="color: #888; font-size: 0.75rem; letter-spacing: 2px; text-transform: uppercase; margin: 0 0 1rem;">Sponsored</p>
      <a href="https://www.awin1.com/cread.php?awinmid=128989&awinaffid=3038027&ued=https%3A%2F%2Fwww.stand4socks.com%2Fcollections%2Fall" target="_blank" rel="sponsored noopener" style="display: inline-block; padding: 14px 28px; background: #ff5bd7; color: #fff; border-radius: 12px; text-decoration: none; font-weight: bold; font-size: 1.1rem; transition: all 0.2s ease;" onmouseover="this.style.background='#ff7ce0'" onmouseout="this.style.background='#ff5bd7'">Shop Stand4 Socks</a>
    </div>

    <img loading="lazy" src="2026djweirdnastyllc.webp" alt="© 2026 Djweirdnastyllc" style="max-width: 300px; display: block; margin: 0 auto;">
  </footer>
<script src="comments.js?v=4"></script>
<script src="site.js?v=10"></script>
</body>
</html>
"""


def build_card_html(cfg, published_str, indent='      '):
    slug = cfg['slug']
    return (
        f'{indent}<article class="event-card">\n'
        f'{indent}  <img loading="lazy" src="{cfg["image"]}" alt="{esc_attr(cfg.get("image_alt", cfg["title"]))}" class="event-flyer">\n'
        f'{indent}  <h3>{cfg["title"]}</h3>\n'
        f'{indent}  <p><em>Published: {published_str}</em></p>\n'
        f'{indent}  <p>{cfg["description"]}</p>\n'
        f'{indent}  <a href="news-{slug}.html" class="playlist-link">Read more</a>\n'
        f'{indent}</article>\n'
    )


def insert_card_into_section(html, category, card_html, path):
    marker = f'{category}-banner'
    idx = html.find(marker)
    if idx == -1:
        print(f'WARNING: could not find "{marker}" marker in {path}; skipping card insert.')
        return html
    article_idx = html.find('<article class="event-card">', idx)
    if article_idx == -1:
        print(f'WARNING: could not find first article card after "{marker}" in {path}; skipping.')
        return html
    return html[:article_idx] + card_html + html[article_idx:]


def update_sitemap(slug, date_str):
    with open('sitemap.xml', 'r', encoding='utf-8') as f:
        xml = f.read()
    url = f'{SITE_URL}/news-{slug}.html'
    if url in xml:
        print('Sitemap already contains this URL, skipping.')
        return
    entry = (
        '  <url>\n'
        f'    <loc>{url}</loc>\n'
        f'    <lastmod>{date_str}</lastmod>\n'
        '    <changefreq>weekly</changefreq>\n'
        '    <priority>0.8</priority>\n'
        '  </url>\n'
    )
    new_xml = xml.replace(
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n',
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entry,
        1
    )
    with open('sitemap.xml', 'w', encoding='utf-8') as f:
        f.write(new_xml)


def main():
    if len(sys.argv) != 2:
        print('Usage: python3 create_article.py path/to/article.json')
        sys.exit(1)

    with open(sys.argv[1], 'r', encoding='utf-8') as f:
        cfg = json.load(f)

    slug = cfg['slug']
    category = cfg['category']
    if category not in CATEGORY_LABELS:
        print(f'ERROR: category must be one of {list(CATEGORY_LABELS)}')
        sys.exit(1)

    pub_dt = datetime.strptime(cfg['published'], '%Y-%m-%d')
    published_str = pub_dt.strftime('%A, %B') + f' {pub_dt.day}, ' + pub_dt.strftime('%Y')
    cfg['_date_iso'] = pub_dt.strftime('%Y-%m-%dT08:00:00-04:00')

    article_path = f'news-{slug}.html'
    article_html = build_article_html(cfg, published_str)
    with open(article_path, 'w', encoding='utf-8') as f:
        f.write(article_html)
    print(f'Wrote {article_path}')

    card_html = build_card_html(cfg, published_str)

    for target_path, section_id in [
        (f'news-{category}.html', category),
        ('news.html', category),
    ]:
        with open(target_path, 'r', encoding='utf-8') as f:
            html = f.read()
        new_html = insert_card_into_section(html, section_id, card_html, target_path)
        if new_html != html:
            with open(target_path, 'w', encoding='utf-8') as f:
                f.write(new_html)
            print(f'Inserted card into {target_path}')

    update_sitemap(slug, cfg['published'])
    print('Updated sitemap.xml')

    subprocess.run([sys.executable, 'generate_carousel.py'], check=True)
    subprocess.run([sys.executable, 'generate_rss.py'], check=True)

    print(f'\nDone. Published day was: {published_str.split(",")[0]}')
    print('Review the changes, then commit and push.')


if __name__ == '__main__':
    main()
