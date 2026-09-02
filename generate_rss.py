"""Generate rss.xml from contents.json.

Run this any time contents.json changes (or just re-run generate_carousel.py
followed by this script). Pulls title/img/published straight from
contents.json and reads the <meta name="description"> from each article
file for the RSS <description> field.

Usage: python3 generate_rss.py
"""
import json
import os
import re
from datetime import datetime, timezone
from xml.sax.saxutils import escape

SITE_URL = 'https://djweirdnasty.com'
FEED_TITLE = 'DJWEIRDNASTY News'
FEED_DESCRIPTION = 'Latest national, entertainment, music, and sports news from DJWEIRDNASTY.'
MAX_ITEMS = 30

EXCLUDE = {
    '/404.html', '/contact.html', '/privacy-policy.html', '/thank-you.html',
    '/newsletter-confirmed.html', '/yandex_cf0ccdb95afad35c.html',
    '/video-game/resident_evil_proto.html', '/video-game/index.html',
    '/index.html', '/news.html', '/news-national.html', '/news-music.html',
    '/news-sports.html', '/news-entertainment.html', '/mixtapes.html',
    '/content.html', '/sol.html', '/admin.html', '/analytics-dashboard.html',
}


def get_description(path):
    file_path = path.lstrip('/')
    if not os.path.exists(file_path):
        return ''
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    m = re.search(r'<meta\s+name="description"\s+content="([^"]*)"', html)
    return m.group(1) if m else ''


def rfc822(ts):
    return datetime.fromtimestamp(ts, tz=timezone.utc).strftime('%a, %d %b %Y %H:%M:%S GMT')


def main():
    with open('contents.json', 'r', encoding='utf-8') as f:
        items = json.load(f)

    news_items = [i for i in items if i['path'] not in EXCLUDE and i['path'].startswith('/news-')]
    news_items.sort(key=lambda i: i.get('published', i.get('updated', 0)), reverse=True)
    news_items = news_items[:MAX_ITEMS]

    now = rfc822(datetime.now(tz=timezone.utc).timestamp())

    rss_items = []
    for item in news_items:
        url = SITE_URL + item['path']
        title = escape(item['title'])
        desc = escape(get_description(item['path']) or item['title'])
        pub = rfc822(item.get('published', item.get('updated', 0)))
        img_url = SITE_URL + item['img'] if item.get('img') else ''
        enclosure = f'\n      <enclosure url="{escape(img_url)}" type="image/{"png" if img_url.endswith("png") else "jpeg" if img_url.endswith((".jpg",".jpeg")) else "webp" if img_url.endswith(".webp") else "avif" if img_url.endswith(".avif") else "octet-stream"}" />' if img_url else ''
        rss_items.append(f"""    <item>
      <title>{title}</title>
      <link>{url}</link>
      <guid isPermaLink="true">{url}</guid>
      <pubDate>{pub}</pubDate>
      <description>{desc}</description>{enclosure}
    </item>""")

    rss = f"""<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>{escape(FEED_TITLE)}</title>
    <link>{SITE_URL}/news.html</link>
    <atom:link href="{SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    <description>{escape(FEED_DESCRIPTION)}</description>
    <language>en-us</language>
    <lastBuildDate>{now}</lastBuildDate>
{chr(10).join(rss_items)}
  </channel>
</rss>
"""

    with open('rss.xml', 'w', encoding='utf-8') as f:
        f.write(rss)
    print(f'Wrote {len(news_items)} items to rss.xml')


if __name__ == '__main__':
    main()
