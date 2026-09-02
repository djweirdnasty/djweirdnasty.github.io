"""Inject NewsArticle JSON-LD structured data into all news-*.html article pages.

Idempotent: skips files that already contain a JSON-LD <script> block.
Reads title/description/image/url from existing meta tags and the
"Published: <Weekday, Month DD, YYYY>" line already present on every article.

Usage: python3 inject_structured_data.py
"""
import glob
import json
import re
from datetime import datetime

SITE_URL = 'https://djweirdnasty.com'
PUBLISHER_LOGO = f'{SITE_URL}/djweirdnasty-banner.webp'

# Category pages / non-article pages that use the news- prefix but aren't articles
SKIP = {
    'news.html', 'news-national.html', 'news-music.html',
    'news-sports.html', 'news-entertainment.html', 'news-sort.js',
}


def extract(pattern, html, group=1):
    m = re.search(pattern, html)
    return m.group(group) if m else None


def main():
    files = sorted(glob.glob('news-*.html'))
    updated = 0
    skipped_existing = 0
    skipped_no_date = 0

    for path in files:
        if path in SKIP:
            continue
        with open(path, 'r', encoding='utf-8') as f:
            html = f.read()

        if 'application/ld+json' in html:
            skipped_existing += 1
            continue

        title = extract(r'<meta property="og:title" content="([^"]*)"', html)
        desc = extract(r'<meta name="description" content="([^"]*)"', html)
        image = extract(r'<meta property="og:image" content="([^"]*)"', html)
        url = extract(r'<meta property="og:url" content="([^"]*)"', html)
        published_str = extract(r'Published:\s*([A-Za-z]+, [A-Za-z]+ \d{1,2}, \d{4})', html)

        if not (title and url and published_str):
            print(f'SKIP (missing data): {path}')
            skipped_no_date += 1
            continue

        try:
            pub_dt = datetime.strptime(published_str, '%A, %B %d, %Y')
        except ValueError:
            print(f'SKIP (bad date "{published_str}"): {path}')
            skipped_no_date += 1
            continue

        date_iso = pub_dt.strftime('%Y-%m-%dT08:00:00-04:00')

        ld = {
            "@context": "https://schema.org",
            "@type": "NewsArticle",
            "headline": title,
            "description": desc or title,
            "image": [image] if image else [],
            "datePublished": date_iso,
            "dateModified": date_iso,
            "author": {"@type": "Organization", "name": "DJWEIRDNASTY"},
            "publisher": {
                "@type": "Organization",
                "name": "DJWEIRDNASTY",
                "logo": {"@type": "ImageObject", "url": PUBLISHER_LOGO}
            },
            "mainEntityOfPage": {"@type": "WebPage", "@id": url}
        }

        script_tag = (
            '  <script type="application/ld+json">\n'
            + json.dumps(ld, indent=2)
            + '\n  </script>\n'
        )

        new_html = html.replace('</head>', script_tag + '</head>', 1)
        if new_html == html:
            print(f'SKIP (no </head> found): {path}')
            continue

        with open(path, 'w', encoding='utf-8') as f:
            f.write(new_html)
        updated += 1

    print(f'\nUpdated {updated} files, skipped {skipped_existing} (already had JSON-LD), {skipped_no_date} (missing data).')


if __name__ == '__main__':
    main()
