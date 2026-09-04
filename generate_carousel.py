import json
import os
import re
from datetime import datetime, timezone
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse, urldefrag

EXCLUDE = {
    '/404.html','/contact.html','/privacy-policy.html','/thank-you.html',
    '/newsletter-confirmed.html','/yandex_cf0ccdb95afad35c.html',
    '/video-game/resident_evil_proto.html','/video-game/index.html',
    '/submit-tip.html','/newsletter-archive.html'
}

class PageParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.title = ''
        self.og_title = ''
        self.og_desc = ''
        self.meta_desc = ''
        self.og_image = ''
        self.twitter_image = ''
        self.in_title = False
        self.first_img = ''
        self._found_img = False

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'meta':
            prop = attrs.get('property', '').lower()
            name = attrs.get('name', '').lower()
            if prop == 'og:title':
                self.og_title = attrs.get('content', '')
            if prop == 'og:description':
                self.og_desc = attrs.get('content', '')
            if prop == 'og:image':
                self.og_image = attrs.get('content', '')
            if name == 'description':
                self.meta_desc = attrs.get('content', '')
            if name == 'twitter:image':
                self.twitter_image = attrs.get('content', '')
        if tag == 'img' and not self._found_img:
            src = attrs.get('src', '')
            if src and not src.startswith('data:'):
                low = src.lower()
                if any(low.endswith(ext) for ext in ['.jpg','.jpeg','.png','.webp','.avif','.gif']):
                    self.first_img = src
                    self._found_img = True

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data

def parse_published(html):
    m = re.search(r'Published:\s*([^<]+)', html)
    if m:
        try:
            dt = datetime.strptime(m.group(1).strip(), '%A, %B %d, %Y')
            return int(dt.replace(tzinfo=timezone.utc).timestamp())
        except ValueError:
            pass
    return 0

def get_title_img(path):
    file_path = path.lstrip('/')
    if not os.path.exists(file_path):
        return None, None, 0
    with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
        html = f.read()
    parser = PageParser()
    parser.feed(html)
    title = parser.og_title.strip() or parser.title.strip() or path
    desc = parser.og_desc.strip() or parser.meta_desc.strip() or ''
    img = parser.og_image or parser.twitter_image or parser.first_img
    published = parse_published(html)
    return title, img, published, desc

def main():
    with open('sitemap.xml','r',encoding='utf-8') as f:
        xml = f.read()
    urls = re.findall(r'<loc>(.*?)</loc>', xml)
    items = []
    for url in urls:
        if not url.startswith('http'):
            continue
        path = urlparse(urldefrag(url)[0]).path
        if path in EXCLUDE:
            continue
        title, img, published, desc = get_title_img(path)
        if not img:
            continue
        img_path = urlparse(urljoin(url, img)).path
        file_path = path.lstrip('/')
        updated = int(os.path.getmtime(file_path))
        if not published:
            published = updated
        items.append({'path': path, 'title': title, 'img': img_path, 'updated': updated, 'published': published, 'desc': desc})
    with open('contents.json','w',encoding='utf-8') as f:
        json.dump(items, f, indent=2)
    print(f'Wrote {len(items)} items to contents.json')

    out_dir = 'video-game'
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, 'contents.json')
    with open(out_path,'w',encoding='utf-8') as f:
        json.dump(items, f, indent=2)
    print(f'Wrote {len(items)} items to {out_path}')

    html_path = os.path.join(out_dir, 'resident_evil_proto.html')
    if os.path.exists(html_path):
        with open(html_path,'r',encoding='utf-8') as f:
            html = f.read()
        json_data = json.dumps(items, ensure_ascii=True, separators=(',',':'))
        new_html = re.sub(r'const CAROUSEL_CONTENTS = \[.*?\];', lambda m: f'const CAROUSEL_CONTENTS = {json_data};', html, count=1, flags=re.DOTALL)
        if new_html != html:
            with open(html_path,'w',encoding='utf-8') as f:
                f.write(new_html)
            print(f'Inlined carousel data into {html_path}')

if __name__ == '__main__':
    main()
