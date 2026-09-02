<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:atom="http://www.w3.org/2005/Atom">
<xsl:output method="html" encoding="UTF-8" indent="yes"/>
<xsl:template match="/rss/channel">
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title><xsl:value-of select="title"/></title>
  <style>
    body { background:#0a0a0a; color:#eee; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin:0; padding:0; }
    .container { max-width: 800px; margin: 0 auto; padding: 2rem 1.25rem; }
    header { text-align:center; padding: 2rem 1rem; border-bottom: 1px solid #2a2a2a; margin-bottom: 2rem; }
    header h1 { color:#ffd860; margin:0 0 0.5rem; font-size: 1.8rem; }
    header p { color:#aaa; margin: 0.25rem 0; }
    header .badge { display:inline-block; background:#ff5bd7; color:#fff; font-size:0.75rem; letter-spacing:1px; text-transform:uppercase; padding:4px 10px; border-radius:999px; margin-top:0.75rem; }
    .item { display:flex; gap:1rem; background:#141414; border:1px solid #2a2a2a; border-radius:12px; padding:1rem; margin-bottom:1rem; text-decoration:none; color:inherit; transition: border-color .15s ease; }
    .item:hover { border-color:#ff5bd7; }
    .item img { width:110px; height:110px; object-fit:cover; border-radius:8px; flex-shrink:0; background:#222; }
    .item .meta { flex:1; min-width:0; }
    .item h2 { font-size:1.05rem; margin:0 0 0.4rem; color:#fff; }
    .item .date { color:#ffd860; font-size:0.8rem; margin:0 0 0.4rem; }
    .item .desc { color:#bbb; font-size:0.9rem; margin:0; line-height:1.4; }
    footer { text-align:center; color:#666; font-size:0.8rem; padding: 2rem 1rem; }
    footer a { color:#ffd860; }
    a.home-link { color:#ffd860; text-decoration:none; }
  </style>
</head>
<body>
  <header>
    <h1><xsl:value-of select="title"/></h1>
    <p><xsl:value-of select="description"/></p>
    <p><a class="home-link" href="{link}">Visit DJWEIRDNASTY News →</a></p>
    <span class="badge">RSS Feed</span>
  </header>
  <div class="container">
    <xsl:for-each select="item">
      <a class="item" href="{link}">
        <xsl:if test="enclosure/@url">
          <img src="{enclosure/@url}" alt=""/>
        </xsl:if>
        <div class="meta">
          <h2><xsl:value-of select="title"/></h2>
          <p class="date"><xsl:value-of select="pubDate"/></p>
          <p class="desc"><xsl:value-of select="description"/></p>
        </div>
      </a>
    </xsl:for-each>
  </div>
  <footer>
    Subscribe to this feed in your RSS reader, or <a href="{link}">browse all news</a> on DJWEIRDNASTY.
  </footer>
</body>
</html>
</xsl:template>
</xsl:stylesheet>
