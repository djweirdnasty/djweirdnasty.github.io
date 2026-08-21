---
description: How to add a new news article to the DJWEIRDNASTY website
---

## Steps for Adding a News Article

1. **Verify the day of the week** before writing any date:
   ```bash
   date -j -f "%Y-%m-%d" "YYYY-MM-DD" "+%A"
   ```
   Never guess the day name — always run this command first.

2. **Create the article HTML file** using the naming convention `news-[slug].html`
   - Copy structure from an existing article (e.g., `news-pop-smoke-murder-convict.html`)
   - Include: GA4 script, meta tags (title, description, OG, Twitter), favicons, share button, comments.js
   - Use the correct day name from step 1 in the publish date
   - Back link should point to the correct category page (e.g., `news-music.html` or `news-national.html`)

3. **Add article card to the category page** (e.g., `news-music.html`, `news-national.html`)
   - Place newest articles at the top
   - Include image, headline, publish date (verified day name), short description, and read more link

4. **Add article card to `news.html`** in the correct category section
   - Place newest articles at the top of the section

5. **Add article to homepage `index.html`** Latest News section
   - Replace oldest card if there are more than 4 cards

6. **Register in `contents.json`**
   - Add entry with path, title, img, updated (unix timestamp), published (unix timestamp)

7. **Add to `sitemap.xml`**
   - Add URL entry with loc, lastmod (YYYY-MM-DD), changefreq=weekly, priority=0.8

8. **Commit the image file** — ensure any new images are `git add`ed along with the HTML files

9. **Commit and push all changes** with a descriptive commit message
