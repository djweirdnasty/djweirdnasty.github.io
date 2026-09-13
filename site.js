(function() {
  'use strict';

  // ===== Mobile Header & Drawer =====
  var header = document.querySelector('header');
  var nav = document.querySelector('header nav');
  var searchOverlay, searchInput;

  if (header && nav) {
    // Create mobile header bar
    var mobileHeader = document.createElement('div');
    mobileHeader.className = 'mobile-header-bar';
    mobileHeader.innerHTML =
      '<button class="mobile-menu-btn" aria-label="Open menu" title="Menu">' +
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><rect y="5" width="24" height="2" rx="1" fill="#fff"/><rect y="11" width="24" height="2" rx="1" fill="#fff"/><rect y="17" width="24" height="2" rx="1" fill="#fff"/></svg>' +
      '</button>' +
      '<a href="index.html" class="site-banner mobile-logo" aria-label="DJWEIRDNASTY Home">' +
      '<img src="djweirdnasty-banner.webp" alt="DJWEIRDNASTY" />' +
      '</a>' +
      '<button class="mobile-search-btn" aria-label="Search" title="Search">' +
      '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M10 2a8 8 0 0 1 8 8 8 8 0 0 1-1.6 4.8l5.1 5.1a1 1 0 0 1-1.4 1.4l-5.1-5.1A8 8 0 1 1 10 2zm0 2a6 6 0 1 0 0 12 6 6 0 0 0 0-12z" fill="#fff"/></svg>' +
      '</button>';
    header.querySelector('.container').appendChild(mobileHeader);

    // Create overlay
    var overlay = document.createElement('div');
    overlay.className = 'mobile-nav-overlay';
    document.body.appendChild(overlay);

    // Create drawer
    var drawer = document.createElement('div');
    drawer.className = 'mobile-nav-drawer';
    drawer.setAttribute('aria-label', 'Main navigation');
    drawer.innerHTML =
      '<div class="drawer-top">' +
      '<h2>Menu</h2>' +
      '<button class="drawer-close" aria-label="Close menu">&times;</button>' +
      '</div>' +
      '<div class="drawer-section">' +
      '<p class="drawer-section-title">Sections</p>' +
      '<a href="index.html">Home</a>' +
      '<a href="news.html">News</a>' +
      '<a href="news-music.html">Music</a>' +
      '<a href="news-entertainment.html">Entertainment</a>' +
      '<a href="news-sports.html">Sports</a>' +
      '<a href="news-national.html">National</a>' +
      '</div>' +
      '<div class="drawer-section">' +
      '<p class="drawer-section-title">More</p>' +
      '<a href="mixtapes.html">Mixtapes</a>' +
      '<a href="content.html">Content</a>' +
      '<a href="sol.html">SOL / Booking</a>' +
      '<a href="index.html#newsletter">Newsletter</a>' +
      '<a href="index.html#events">Events</a>' +
      '</div>' +
      '<div class="drawer-section">' +
      '<p class="drawer-section-title">Contact Us</p>' +
      '<a href="submit-tip.html">Got A Tip? Photo? Video?</a>' +
      '<a href="contact.html">General Inquiries</a>' +
      '<a href="contact.html#submit-music">Music Submissions</a>' +
      '</div>' +
      '<div class="drawer-section">' +
      '<p class="drawer-section-title">Other</p>' +
      '<a href="index.html#about">About Us</a>' +
      '<a href="privacy-policy.html">Privacy</a>' +
      '<a href="privacy-policy.html#terms">Terms</a>' +
      '</div>' +
      '<div class="drawer-section">' +
      '<p class="drawer-section-title">Follow</p>' +
      '<div class="drawer-socials">' +
      '<a href="https://www.instagram.com/djweirdnasty/" target="_blank" rel="noopener noreferrer" aria-label="Instagram">' +
      '<svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06.41-2.23.06-1.27.07-1.65.07-4.85s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41 1.28-.06 1.69-.07 4.89-.07M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.35 2.67.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56 1.28.06 1.69.07 4.95.07s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12-.66-.66-1.33-1.08-2.12-1.38-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z"/><path d="M12 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8z"/><circle cx="18.41" cy="5.59" r="1.44"/></svg>' +
      '</a>' +
      '<a href="https://www.tiktok.com/@iamdjweirdnasty" target="_blank" rel="noopener noreferrer" aria-label="TikTok">' +
      '<svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg>' +
      '</a>' +
      '<a href="https://audiomack.com/ayoweird" target="_blank" rel="noopener noreferrer" aria-label="Audiomack">' +
      '<svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg>' +
      '</a>' +
      '<a href="https://www.youtube.com/@djweirdnasty" target="_blank" rel="noopener noreferrer" aria-label="YouTube">' +
      '<svg viewBox="0 0 24 24"><path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg>' +
      '</a>' +
      '</div>' +
      '</div>';
    document.body.appendChild(drawer);

    function openDrawer() {
      drawer.classList.add('open');
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
      drawer.classList.remove('open');
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    }

    mobileHeader.querySelector('.mobile-menu-btn').addEventListener('click', openDrawer);
    overlay.addEventListener('click', closeDrawer);
    drawer.querySelector('.drawer-close').addEventListener('click', closeDrawer);
    drawer.querySelectorAll('a').forEach(function(a) {
      a.addEventListener('click', function() { setTimeout(closeDrawer, 150); });
    });

    // Search button opens search modal
    var searchBtn = mobileHeader.querySelector('.mobile-search-btn');
    searchBtn.addEventListener('click', function() {
      var so = document.querySelector('.site-search-overlay');
      var si = document.querySelector('.site-search-box input');
      if (so) so.classList.add('active');
      if (si) si.focus();
    });
  }

  // ===== Social Media Links in Footer =====
  var footer = document.querySelector('footer');
  if (footer && !footer.querySelector('.footer-social')) {
    var socialDiv = document.createElement('div');
    socialDiv.className = 'footer-social';
    socialDiv.innerHTML =
      '<a href="https://www.instagram.com/djweirdnasty/" target="_blank" rel="noopener noreferrer" aria-label="Instagram" title="Instagram"><svg viewBox="0 0 24 24"><path d="M12 2.16c3.2 0 3.58.01 4.85.07 1.17.05 1.8.25 2.23.41.56.22.96.48 1.38.9.42.42.68.82.9 1.38.16.42.36 1.06.41 2.23.06 1.27.07 1.65.07 4.85s-.01 3.58-.07 4.85c-.05 1.17-.25 1.8-.41 2.23-.22.56-.48.96-.9 1.38-.42.42-.82.68-1.38.9-.42.16-1.06.36-2.23.41-1.27.06-1.65.07-4.85.07s-3.58-.01-4.85-.07c-1.17-.05-1.8-.25-2.23-.41-.56-.22-.96-.48-1.38-.9-.42-.42-.68-.82-.9-1.38-.16-.42-.36-1.06-.41-2.23C2.17 15.58 2.16 15.2 2.16 12s.01-3.58.07-4.85c.05-1.17.25-1.8.41-2.23.22-.56.48-.96.9-1.38.42-.42.82-.68 1.38-.9.42-.16 1.06-.36 2.23-.41C8.42 2.17 8.8 2.16 12 2.16M12 0C8.74 0 8.33.01 7.05.07 5.78.13 4.9.33 4.14.63c-.79.3-1.46.72-2.12 1.38C1.35 2.67.94 3.35.63 4.14.33 4.9.13 5.78.07 7.05.01 8.33 0 8.74 0 12s.01 3.67.07 4.95c.06 1.27.26 2.15.56 2.91.3.79.72 1.46 1.38 2.12.66.66 1.33 1.08 2.12 1.38.76.3 1.64.5 2.91.56C8.33 23.99 8.74 24 12 24s3.67-.01 4.95-.07c1.27-.06 2.15-.26 2.91-.56.79-.3 1.46-.72 2.12-1.38.66-.66 1.08-1.33 1.38-2.12.3-.76.5-1.64.56-2.91.06-1.28.07-1.69.07-4.95s-.01-3.67-.07-4.95c-.06-1.27-.26-2.15-.56-2.91-.3-.79-.72-1.46-1.38-2.12-.66-.66-1.33-1.08-2.12-1.38-.76-.3-1.64-.5-2.91-.56C15.67.01 15.26 0 12 0z"/><path d="M12 5.84A6.16 6.16 0 1 0 12 18.16 6.16 6.16 0 0 0 12 5.84zm0 10.16A4 4 0 1 1 12 8a4 4 0 0 1 0 8z"/><circle cx="18.41" cy="5.59" r="1.44"/></svg></a>' +
      '<a href="https://www.tiktok.com/@iamdjweirdnasty" target="_blank" rel="noopener noreferrer" aria-label="TikTok" title="TikTok"><svg viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5.8 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1.84-.1z"/></svg></a>' +
      '<a href="https://audiomack.com/ayoweird" target="_blank" rel="noopener noreferrer" aria-label="Audiomack" title="Audiomack"><svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5l-4-4 1.41-1.41L10 13.67l6.59-6.59L18 8.5l-8 8z"/></svg></a>' +
      '<a href="https://www.youtube.com/@djweirdnasty" target="_blank" rel="noopener noreferrer" aria-label="YouTube" title="YouTube"><svg viewBox="0 0 24 24"><path d="M23.5 6.2a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.51A3.02 3.02 0 0 0 .5 6.2C0 8.08 0 12 0 12s0 3.92.5 5.8a3.02 3.02 0 0 0 2.12 2.14c1.88.51 9.38.51 9.38.51s7.5 0 9.38-.51a3.02 3.02 0 0 0 2.12-2.14C24 15.92 24 12 24 12s0-3.92-.5-5.8zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/></svg></a>' +
      '<a href="submit-tip.html" aria-label="Submit a Tip" title="Submit a Story Tip" style="font-size:0.8rem;font-weight:600;width:auto;padding:0 14px;border-radius:999px;">TIP</a>';
    footer.insertBefore(socialDiv, footer.firstChild);
  }

  // ===== Dark Mode Toggle =====
  var toggle = document.createElement('button');
  toggle.className = 'theme-toggle';
  toggle.setAttribute('aria-label', 'Toggle light/dark mode');
  toggle.textContent = '\u263C';

  var saved = null;
  try { saved = localStorage.getItem('theme'); } catch(e) {}
  if (saved === 'light') {
    document.body.classList.add('light-mode');
    toggle.textContent = '\u263D';
  }

  toggle.addEventListener('click', function() {
    document.body.classList.toggle('light-mode');
    var isLight = document.body.classList.contains('light-mode');
    toggle.textContent = isLight ? '\u263D' : '\u263C';
    try { localStorage.setItem('theme', isLight ? 'light' : 'dark'); } catch(e) {}
  });

  function initToggle() {
    if (!document.querySelector('.theme-toggle')) {
      document.body.appendChild(toggle);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initToggle);
  } else {
    initToggle();
  }

  // ===== Reading Progress Bar =====
  var article = document.querySelector('article.info');
  if (article) {
    var bar = document.createElement('div');
    bar.className = 'reading-progress';
    document.body.appendChild(bar);

    function updateProgress() {
      var rect = article.getBoundingClientRect();
      var articleTop = rect.top + window.scrollY;
      var articleHeight = rect.height;
      var scrolled = window.scrollY - articleTop;
      var progress = (scrolled / articleHeight) * 100;
      if (progress < 0) progress = 0;
      if (progress > 100) progress = 100;
      bar.style.width = progress + '%';
    }
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  // ===== News Search & Filter =====
  var newsPage = document.querySelector('.news-category');
  if (newsPage && (window.location.pathname === '/news.html' || window.location.pathname.endsWith('/news.html'))) {
    // Only add search/filter on the main news.html page
    var allSections = document.querySelectorAll('.news-category');
    if (allSections.length > 0) {
      var controls = document.createElement('div');
      controls.className = 'news-controls';
      controls.innerHTML = '<input type="text" class="news-search" placeholder="Search articles..." aria-label="Search articles">' +
        '<div class="news-filter-btns">' +
        '<button class="news-filter-btn active" data-cat="all">All</button>' +
        '<button class="news-filter-btn" data-cat="sports">Sports</button>' +
        '<button class="news-filter-btn" data-cat="music">Music</button>' +
        '<button class="news-filter-btn" data-cat="entertainment">Entertainment</button>' +
        '<button class="news-filter-btn" data-cat="national">National</button>' +
        '</div>';

      var mainContainer = document.querySelector('main.container');
      if (mainContainer) {
        var firstSection = mainContainer.querySelector('.news-category');
        if (firstSection) {
          mainContainer.insertBefore(controls, firstSection);
        }
      }

      var noResults = document.createElement('p');
      noResults.className = 'news-no-results';
      noResults.textContent = 'No articles found. Try a different search or filter.';
      var lastSection = document.querySelectorAll('.news-category');
      if (lastSection[lastSection.length - 1]) {
        lastSection[lastSection.length - 1].appendChild(noResults);
      }

      var searchInput = controls.querySelector('.news-search');
      var filterBtns = controls.querySelectorAll('.news-filter-btn');
      var currentCat = 'all';

      function filterArticles() {
        var query = searchInput.value.toLowerCase().trim();
        var anyVisible = false;
        var sections = document.querySelectorAll('.news-category');

        sections.forEach(function(section) {
          var sectionId = section.id || '';
          var catMatch = (currentCat === 'all' || sectionId === currentCat);
          var cards = section.querySelectorAll('.event-card');
          var sectionHasVisible = false;

          cards.forEach(function(card) {
            var title = (card.querySelector('h3') || {}).textContent || '';
            var desc = (card.querySelector('p') || {}).textContent || '';
            var text = (title + ' ' + desc).toLowerCase();
            var matches = (query === '' || text.indexOf(query) !== -1);
            var visible = catMatch && matches;
            card.style.display = visible ? '' : 'none';
            if (visible) sectionHasVisible = true;
          });

          section.style.display = (catMatch && sectionHasVisible) ? '' : 'none';
          if (catMatch && sectionHasVisible) anyVisible = true;
        });

        // Show category banners even when filtering
        if (currentCat !== 'all') {
          sections.forEach(function(section) {
            if (section.id === currentCat) {
              var banner = section.querySelector('img');
              if (banner) banner.style.display = '';
            }
          });
        }

        noResults.style.display = anyVisible ? 'none' : 'block';
      }

      searchInput.addEventListener('input', filterArticles);
      filterBtns.forEach(function(btn) {
        btn.addEventListener('click', function() {
          filterBtns.forEach(function(b) { b.classList.remove('active'); });
          btn.classList.add('active');
          currentCat = btn.getAttribute('data-cat');
          filterArticles();
        });
      });
    }
  }

  // ===== Related Articles =====
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    var backLink = article.querySelector('a[href*="news-"]');
    var categoryUrl = null;
    var categoryName = '';

    // Determine category from back link
    var allLinks = article.querySelectorAll('a');
    for (var i = 0; i < allLinks.length; i++) {
      var href = allLinks[i].getAttribute('href') || '';
      if (href.indexOf('news-music.html') !== -1) {
        categoryUrl = 'news-music.html';
        categoryName = 'music';
        break;
      } else if (href.indexOf('news-sports.html') !== -1) {
        categoryUrl = 'news-sports.html';
        categoryName = 'sports';
        break;
      } else if (href.indexOf('news-entertainment.html') !== -1) {
        categoryUrl = 'news-entertainment.html';
        categoryName = 'entertainment';
        break;
      } else if (href.indexOf('news-national.html') !== -1) {
        categoryUrl = 'news-national.html';
        categoryName = 'national';
        break;
      }
    }

    if (categoryUrl) {
      var currentUrl = window.location.pathname.split('/').pop();

      fetch(categoryUrl).then(function(r) { return r.text(); }).then(function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var cards = doc.querySelectorAll('.event-card');
        var related = [];
        var count = 0;

        cards.forEach(function(card) {
          if (count >= 3) return;
          var link = card.querySelector('a[href*="news-"]');
          if (!link) return;
          var href = link.getAttribute('href');
          if (!href || href === currentUrl || href.indexOf('news-music.html') !== -1 || href.indexOf('news-sports.html') !== -1 || href.indexOf('news-entertainment.html') !== -1 || href.indexOf('news-national.html') !== -1 || href.indexOf('news.html') !== -1) return;

          var img = card.querySelector('img');
          var h3 = card.querySelector('h3');
          var dateP = card.querySelectorAll('p')[0];
          var descP = card.querySelectorAll('p')[1];

          related.push({
            href: href,
            img: img ? img.getAttribute('src') : '',
            alt: img ? img.getAttribute('alt') : '',
            title: h3 ? h3.textContent : '',
            date: dateP ? dateP.textContent : '',
            desc: descP ? descP.textContent : ''
          });
          count++;
        });

        if (related.length > 0) {
          var section = document.createElement('section');
          section.className = 'related-articles';
          var grid = document.createElement('div');
          grid.className = 'related-articles-grid';

          related.forEach(function(r) {
            var card = document.createElement('article');
            card.className = 'event-card';
            card.innerHTML =
              (r.img ? '<img src="' + r.img + '" alt="' + r.alt + '" class="event-flyer">' : '') +
              '<h3>' + r.title + '</h3>' +
              (r.date ? '<p><em>' + r.date + '</em></p>' : '') +
              (r.desc ? '<p>' + r.desc.substring(0, 100) + '...</p>' : '') +
              '<a href="' + r.href + '" class="playlist-link">Read more</a>';
            grid.appendChild(card);
          });

          section.innerHTML = '<h2>Related Articles</h2>';
          section.appendChild(grid);

          var shareBtn = article.querySelector('.share-button');
          if (shareBtn) {
            article.insertBefore(section, shareBtn);
          } else {
            article.appendChild(section);
          }
        }
      }).catch(function() {});
      }
    }

  // ===== More News Link Section (all article pages) =====
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    if (!article.querySelector('.more-news-links')) {
      var moreNews = document.createElement('p');
      moreNews.className = 'more-news-links';
      moreNews.style.cssText = 'margin-top: 2rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);';
      moreNews.innerHTML = '<strong>More from DJWEIRDNASTY News:</strong><br>' +
        '<a href="news.html" style="color: #ffd860;">All News</a> &bull; ' +
        '<a href="news-music.html" style="color: #ffd860;">Music</a> &bull; ' +
        '<a href="news-sports.html" style="color: #ffd860;">Sports</a> &bull; ' +
        '<a href="news-entertainment.html" style="color: #ffd860;">Entertainment</a> &bull; ' +
        '<a href="news-national.html" style="color: #ffd860;">National</a> &bull; ' +
        '<a href="mixtapes.html" style="color: #ffd860;">Mixtapes</a> &bull; ' +
        '<a href="index.html#events" style="color: #ffd860;">Events</a> &bull; ' +
        '<a href="submit-tip.html" style="color: #ffd860;">Got a Tip?</a>';
      var shareBtn = article.querySelector('.share-button, .social-share');
      if (shareBtn) {
        article.insertBefore(moreNews, shareBtn);
      } else {
        article.appendChild(moreNews);
      }
    }
  }

  // ===== Newsletter Signup CTA (all article pages) =====
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    if (!article.querySelector('.article-newsletter-cta')) {
      var nlCta = document.createElement('div');
      nlCta.className = 'article-newsletter-cta';
      nlCta.style.cssText = 'margin-top: 2rem; padding: 1.5rem; background: rgba(255,77,143,0.08); border: 1px solid #ff4d8f; border-radius: 12px; text-align: center;';
      nlCta.innerHTML =
        '<h3 style="color: #ff5bd7; margin-top: 0;">Stay in the Loop</h3>' +
        '<p style="color: #ccc; margin-bottom: 1rem;">Get the latest from DJWEIRDNASTY &mdash; new articles, mixtapes, events, and exclusive content delivered to your inbox.</p>' +
        '<a href="index.html#newsletter" style="display: inline-block; background: #ff4d8f; color: #fff; padding: 0.7rem 2rem; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 1rem; transition: background 0.2s;" onmouseover="this.style.background=\'#e63e7a\'" onmouseout="this.style.background=\'#ff4d8f\'">Subscribe Now</a>';
      article.appendChild(nlCta);
    }
  }

  // ===== Scroll Animations =====
  var animateElements = document.querySelectorAll('.event-card, .mixtape-card, .featured-video-card');
  animateElements.forEach(function(el) {
    el.classList.add('scroll-animate');
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function(entries) {
      entries.forEach(function(entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0, rootMargin: '100px 0px 100px 0px' });

    animateElements.forEach(function(el) {
      var rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight && rect.bottom > 0) {
        el.classList.add('visible');
      } else {
        observer.observe(el);
      }
    });
  } else {
    animateElements.forEach(function(el) {
      el.classList.add('visible');
    });
  }

  // Fallback: ensure everything is visible after 3 seconds
  setTimeout(function() {
    animateElements.forEach(function(el) {
      el.classList.add('visible');
    });
  }, 3000);

  // ===== Book DJWEIRDNASTY CTA =====
  if (!document.getElementById('bookCta') &&
      window.location.pathname.indexOf('sol.html') === -1 &&
      window.location.pathname.indexOf('contact.html') === -1) {
    var bookCta = document.createElement('a');
    bookCta.className = 'book-cta';
    bookCta.id = 'bookCta';
    bookCta.href = 'sol.html';
    bookCta.setAttribute('aria-label', 'Book DJWEIRDNASTY');
    var bookImg = document.createElement('img');
    bookImg.src = 'sol-logo.png';
    bookImg.alt = 'Book DJWEIRDNASTY';
    bookImg.loading = 'lazy';
    bookCta.appendChild(bookImg);
    document.body.appendChild(bookCta);

    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        bookCta.classList.add('visible');
      } else {
        bookCta.classList.remove('visible');
      }
    }, { passive: true });
  }

  // ===== Back to Top Button =====
  var backBtn = document.createElement('button');
  backBtn.className = 'back-to-top';
  backBtn.setAttribute('aria-label', 'Back to top');
  backBtn.innerHTML = '&uarr;';
  document.body.appendChild(backBtn);

  backBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  window.addEventListener('scroll', function() {
    if (window.scrollY > 400) {
      backBtn.classList.add('visible');
    } else {
      backBtn.classList.remove('visible');
    }
  }, { passive: true });

  // ===== Social Share Buttons =====
  var existingShare = document.querySelector('.share-button');
  if (existingShare) {
    var rawUrl = existingShare.getAttribute('data-url') || window.location.href;
    var shareUrl;
    try {
      var u = new URL(rawUrl);
      u.searchParams.set('utm_source', 'share');
      u.searchParams.set('utm_medium', 'social');
      if (!u.searchParams.get('utm_campaign')) {
        u.searchParams.set('utm_campaign', existingShare.getAttribute('data-campaign') || 'latest');
      }
      shareUrl = u.toString();
    } catch (e) {
      var sep = rawUrl.indexOf('?') === -1 ? '?' : '&';
      shareUrl = rawUrl + sep + 'utm_source=share&utm_medium=social&utm_campaign=' + encodeURIComponent(existingShare.getAttribute('data-campaign') || 'latest');
    }
    var shareTitle = existingShare.getAttribute('data-title') || document.title;

    var socialDiv = document.createElement('div');
    socialDiv.className = 'social-share';
    socialDiv.innerHTML =
      '<span class="social-share-label">Share:</span>' +
      '<a class="social-share-btn facebook" href="https://www.facebook.com/sharer/sharer.php?u=' + encodeURIComponent(shareUrl) + '" target="_blank" rel="noopener" aria-label="Share on Facebook">f</a>' +
      '<a class="social-share-btn twitter" href="https://twitter.com/intent/tweet?url=' + encodeURIComponent(shareUrl) + '&text=' + encodeURIComponent(shareTitle) + '" target="_blank" rel="noopener" aria-label="Share on X">X</a>' +
      '<a class="social-share-btn whatsapp" href="https://wa.me/?text=' + encodeURIComponent(shareTitle + ' ' + shareUrl) + '" target="_blank" rel="noopener" aria-label="Share on WhatsApp">W</a>' +
      '<button class="social-share-btn copy" aria-label="Copy link">Copy</button>';

    existingShare.parentNode.replaceChild(socialDiv, existingShare);

    var copyBtn = socialDiv.querySelector('.copy');
    copyBtn.addEventListener('click', function() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(shareUrl).then(function() {
          copyBtn.textContent = 'Copied!';
          setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
        });
      } else {
        var input = document.createElement('input');
        input.value = shareUrl;
        document.body.appendChild(input);
        input.select();
        document.execCommand('copy');
        document.body.removeChild(input);
        copyBtn.textContent = 'Copied!';
        setTimeout(function() { copyBtn.textContent = 'Copy'; }, 2000);
      }
    });
  }

  // ===== Cookie Consent Banner =====
  var cookieConsent = null;
  try { cookieConsent = localStorage.getItem('cookieConsent'); } catch(e) {}

  if (!cookieConsent) {
    var banner = document.createElement('div');
    banner.className = 'cookie-banner';
    banner.innerHTML =
      '<div class="cookie-banner-text">' +
      'We use cookies to improve your experience and serve relevant ads. By continuing, you agree to our use of cookies. ' +
      '<a href="privacy-policy.html">Learn more</a>' +
      '</div>' +
      '<div class="cookie-banner-btns">' +
      '<button class="cookie-banner-btn decline">Decline</button>' +
      '<button class="cookie-banner-btn accept">Accept</button>' +
      '</div>';
    document.body.appendChild(banner);

    requestAnimationFrame(function() {
      banner.classList.add('visible');
    });

    banner.querySelector('.accept').addEventListener('click', function() {
      try { localStorage.setItem('cookieConsent', 'accepted'); } catch(e) {}
      banner.classList.remove('visible');
      setTimeout(function() { banner.remove(); }, 400);
    });

    banner.querySelector('.decline').addEventListener('click', function() {
      try { localStorage.setItem('cookieConsent', 'declined'); } catch(e) {}
      banner.classList.remove('visible');
      setTimeout(function() { banner.remove(); }, 400);
    });
  }

  // ===== Breadcrumbs =====
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    if (!article.querySelector('.breadcrumbs')) {
      var bc = document.createElement('div');
      bc.className = 'breadcrumbs';
      var catName = 'News';
      var catLink = 'news.html';
      var allLinks = article.querySelectorAll('a');
      for (var i = 0; i < allLinks.length; i++) {
        var href = allLinks[i].getAttribute('href') || '';
        if (href.indexOf('news-music.html') !== -1) { catName = 'Music'; catLink = 'news-music.html'; break; }
        if (href.indexOf('news-sports.html') !== -1) { catName = 'Sports'; catLink = 'news-sports.html'; break; }
        if (href.indexOf('news-entertainment.html') !== -1) { catName = 'Entertainment'; catLink = 'news-entertainment.html'; break; }
        if (href.indexOf('news-national.html') !== -1) { catName = 'National'; catLink = 'news-national.html'; break; }
      }
      bc.innerHTML = '<a href="index.html">Home</a><span>&rsaquo;</span><a href="news.html">News</a><span>&rsaquo;</span><a href="' + catLink + '">' + catName + '</a><span>&rsaquo;</span>';
      article.insertBefore(bc, article.firstChild);
    }
  }

  // ===== Reading Time =====
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    var emEl = article.querySelector('em');
    if (emEl && !emEl.querySelector('.reading-time')) {
      var text = article.textContent || '';
      var words = text.trim().split(/\s+/).length;
      var mins = Math.max(1, Math.ceil(words / 200));
      var rt = document.createElement('span');
      rt.className = 'reading-time';
      rt.textContent = ' \u2022 ' + mins + ' min read';
      emEl.appendChild(rt);
    }
  }

  // ===== Load More on News Category Pages =====
  var newsCatPage = document.querySelector('section.info article.event-card');
  if (newsCatPage && (window.location.pathname.indexOf('news-music.html') !== -1 ||
      window.location.pathname.indexOf('news-sports.html') !== -1 ||
      window.location.pathname.indexOf('news-entertainment.html') !== -1 ||
      window.location.pathname.indexOf('news-national.html') !== -1)) {
    var allCards = document.querySelectorAll('section.info article.event-card');
    var INITIAL_SHOW = 12;
    var INCREMENT = 8;
    var shown = INITIAL_SHOW;

    if (allCards.length > INITIAL_SHOW) {
      for (var i = INITIAL_SHOW; i < allCards.length; i++) {
        allCards[i].style.display = 'none';
      }
      var loadBtn = document.createElement('button');
      loadBtn.className = 'load-more-btn';
      loadBtn.textContent = 'Load More (' + (allCards.length - INITIAL_SHOW) + ' more)';
      var lastCard = allCards[allCards.length - 1];
      lastCard.parentNode.appendChild(loadBtn);

      loadBtn.addEventListener('click', function() {
        var revealed = 0;
        for (var j = shown; j < allCards.length && revealed < INCREMENT; j++) {
          allCards[j].style.display = '';
          revealed++;
        }
        shown += revealed;
        if (shown >= allCards.length) {
          loadBtn.style.display = 'none';
        } else {
          loadBtn.textContent = 'Load More (' + (allCards.length - shown) + ' more)';
        }
      });
    }
  }

  // ===== Site-Wide Search =====
  var searchTrigger = document.createElement('button');
  searchTrigger.className = 'site-search-trigger';
  searchTrigger.textContent = '\uD83D\uDD0D Search';
  if (nav) {
    nav.parentNode.appendChild(searchTrigger);
  }

  var searchOverlay = document.createElement('div');
  searchOverlay.className = 'site-search-overlay';
  searchOverlay.innerHTML =
    '<div class="site-search-box">' +
    '<button class="site-search-close" aria-label="Close search">&times;</button>' +
    '<input type="text" placeholder="Search articles, mixtapes, events..." aria-label="Search site">' +
    '<div class="site-search-results"></div>' +
    '</div>';
  document.body.appendChild(searchOverlay);

  var searchInput = searchOverlay.querySelector('input');
  var searchResults = searchOverlay.querySelector('.site-search-results');
  var searchIndex = null;

  searchTrigger.addEventListener('click', function() {
    searchOverlay.classList.add('active');
    searchInput.focus();
  });
  searchOverlay.querySelector('.site-search-close').addEventListener('click', function() {
    searchOverlay.classList.remove('active');
  });
  searchOverlay.addEventListener('click', function(e) {
    if (e.target === searchOverlay) searchOverlay.classList.remove('active');
  });
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') searchOverlay.classList.remove('active');
  });

  function loadSearchIndex() {
    if (searchIndex) return Promise.resolve(searchIndex);
    return fetch('/contents.json').then(function(r) { return r.json(); }).then(function(data) {
      searchIndex = data.map(function(item) {
        return {
          path: item.path,
          title: item.title || '',
          desc: item.desc || '',
          img: item.img || '',
          category: (item.path.match(/news-(music|sports|entertainment|national)/) || [,'News'])[1]
        };
      });
      return searchIndex;
    }).catch(function() { return []; });
  }

  var searchDebounce = null;
  searchInput.addEventListener('input', function() {
    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(function() {
      var q = searchInput.value.toLowerCase().trim();
      if (q.length < 2) { searchResults.innerHTML = ''; return; }
      loadSearchIndex().then(function(idx) {
        var matches = idx.filter(function(item) {
          return (item.title.toLowerCase().indexOf(q) !== -1 || item.desc.toLowerCase().indexOf(q) !== -1);
        }).slice(0, 20);
        if (matches.length === 0) {
          searchResults.innerHTML = '<p style="color:#888;padding:1rem;">No results found.</p>';
        } else {
          searchResults.innerHTML = matches.map(function(m) {
            return '<a href="' + m.path + '">' + m.title + ' <small>(' + m.category + ')</small></a>';
          }).join('');
        }
      });
    }, 200);
  });

  // ===== Floating Share Buttons (mobile article pages) =====
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    var floatShare = document.createElement('div');
    floatShare.className = 'float-share';
    var pageUrl = encodeURIComponent(window.location.href);
    var pageTitle = encodeURIComponent(document.title);
    floatShare.innerHTML =
      '<a class="fs-x" href="https://twitter.com/intent/tweet?url=' + pageUrl + '&text=' + pageTitle + '" target="_blank" rel="noopener" aria-label="Share on X">X</a>' +
      '<a class="fs-fb" href="https://www.facebook.com/sharer/sharer.php?u=' + pageUrl + '" target="_blank" rel="noopener" aria-label="Share on Facebook">f</a>' +
      '<a class="fs-wa" href="https://wa.me/?text=' + pageTitle + '%20' + pageUrl + '" target="_blank" rel="noopener" aria-label="Share on WhatsApp">W</a>' +
      '<button class="fs-copy" aria-label="Copy link">+</button>';
    document.body.appendChild(floatShare);

    floatShare.querySelector('.fs-copy').addEventListener('click', function() {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(function() {
          floatShare.querySelector('.fs-copy').textContent = '\u2713';
          setTimeout(function() { floatShare.querySelector('.fs-copy').textContent = '+'; }, 1500);
        });
      }
    });

    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        floatShare.classList.add('visible');
      } else {
        floatShare.classList.remove('visible');
      }
    }, { passive: true });
  }

  // ===== Event Countdown Widget (homepage) =====
  var eventsSection = document.getElementById('events');
  if (eventsSection && window.location.pathname === '/' || window.location.pathname.endsWith('/index.html')) {
    var countdownSection = document.getElementById('event-countdown');
    if (!countdownSection && eventsSection) {
      // Look for upcoming event data
      fetch('/contents.json').then(function(r) { return r.json(); }).then(function(items) {
        var now = Date.now();
        var upcoming = items.filter(function(i) {
          return i.path && i.path.indexOf('/event-') === 0 && i.date && i.date > now / 1000;
        }).sort(function(a, b) { return a.date - b.date; });

        if (upcoming.length > 0) {
          var ev = upcoming[0];
          var cd = document.createElement('div');
          cd.className = 'event-countdown';
          cd.id = 'event-countdown';
          cd.innerHTML =
            '<h3>Next Event: ' + (ev.title || 'Coming Soon') + '</h3>' +
            '<p style="color:#ccc;">' + (ev.desc || '') + '</p>' +
            '<div class="countdown-timer" id="countdown-display">' +
            '<div class="countdown-unit"><span class="countdown-num" id="cd-days">0</span><span class="countdown-label">Days</span></div>' +
            '<div class="countdown-unit"><span class="countdown-num" id="cd-hours">0</span><span class="countdown-label">Hours</span></div>' +
            '<div class="countdown-unit"><span class="countdown-num" id="cd-mins">0</span><span class="countdown-label">Mins</span></div>' +
            '<div class="countdown-unit"><span class="countdown-num" id="cd-secs">0</span><span class="countdown-label">Secs</span></div>' +
            '</div>' +
            (ev.path ? '<a href="' + ev.path + '" class="playlist-link">View Event</a>' : '');
          eventsSection.insertBefore(cd, eventsSection.firstChild);

          function updateCountdown() {
            var diff = ev.date * 1000 - Date.now();
            if (diff < 0) { cd.style.display = 'none'; return; }
            var d = Math.floor(diff / 86400000);
            var h = Math.floor((diff % 86400000) / 3600000);
            var m = Math.floor((diff % 3600000) / 60000);
            var s = Math.floor((diff % 60000) / 1000);
            var dd = document.getElementById('cd-days');
            var dh = document.getElementById('cd-hours');
            var dm = document.getElementById('cd-mins');
            var ds = document.getElementById('cd-secs');
            if (dd) dd.textContent = d;
            if (dh) dh.textContent = h;
            if (dm) dm.textContent = m;
            if (ds) ds.textContent = s;
          }
          updateCountdown();
          setInterval(updateCountdown, 1000);
        }
      }).catch(function() {});
    }
  }

  // ===== Related Mixtapes on Article Pages =====
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    if (!article.querySelector('.related-mixtapes')) {
      fetch('mixtapes.html').then(function(r) { return r.text(); }).then(function(html) {
        var parser = new DOMParser();
        var doc = parser.parseFromString(html, 'text/html');
        var cards = doc.querySelectorAll('.mixtape-card');
        if (cards.length === 0) return;
        
        // Pick up to 2 random mixtapes
        var shuffled = Array.from(cards).sort(function() { return Math.random() - 0.5; });
        var picks = shuffled.slice(0, 2);
        
        var section = document.createElement('section');
        section.className = 'related-mixtapes';
        section.style.cssText = 'margin-top: 2.5rem; padding-top: 1.5rem; border-top: 1px solid rgba(255,255,255,0.1);';
        section.innerHTML = '<h2 style="color: #ffd860; font-size: 1.3rem; margin-bottom: 1rem;">Mixtapes You Might Like</h2>';
        
        var grid = document.createElement('div');
        grid.className = 'related-articles-grid';
        
        picks.forEach(function(card) {
          var img = card.querySelector('.mixtape-cover');
          var h1 = card.querySelector('h1');
          var link = card.querySelector('.mixtape-link');
          if (!h1 || !link) return;
          var mini = document.createElement('article');
          mini.className = 'event-card';
          mini.innerHTML =
            (img ? '<img src="' + img.getAttribute('src') + '" alt="' + (img.getAttribute('alt') || '') + '" class="event-flyer" style="width:100%;max-height:200px;object-fit:cover;">' : '') +
            '<h3 style="font-size:0.95rem;">' + h1.textContent + '</h3>' +
            '<a href="' + link.getAttribute('href') + '" class="playlist-link" target="_blank" rel="noopener">Listen Now</a>';
          grid.appendChild(mini);
        });
        
        if (grid.children.length > 0) {
          section.appendChild(grid);
          article.appendChild(section);
        }
      }).catch(function() {});
    }
  }

  // ===== Trending Articles =====
  // Track article views and show trending on homepage
  var TRENDING_KEY = 'djwn_views';
  var TRENDING_MAX = 50;

  function getViewCounts() {
    try { return JSON.parse(localStorage.getItem(TRENDING_KEY) || '{}'); } catch(e) { return {}; }
  }

  function saveViewCounts(counts) {
    try {
      var keys = Object.keys(counts);
      if (keys.length > TRENDING_MAX) {
        var sorted = keys.sort(function(a,b) { return counts[b] - counts[a]; });
        var trimmed = {};
        sorted.slice(0, TRENDING_MAX).forEach(function(k) { trimmed[k] = counts[k]; });
        counts = trimmed;
      }
      localStorage.setItem(TRENDING_KEY, JSON.stringify(counts));
    } catch(e) {}
  }

  // Track view on article pages
  if (article && window.location.pathname.indexOf('news-') !== -1 && window.location.pathname.indexOf('news.html') === -1) {
    var slug = window.location.pathname.split('/').pop();
    var counts = getViewCounts();
    counts[slug] = (counts[slug] || 0) + 1;
    saveViewCounts(counts);

    // Also send to API for cross-device trending
    try {
      fetch('https://djweirdnasty-api.kurtisctabb.workers.dev/api/views', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug: slug })
      }).catch(function() {});
    } catch(e) {}
  }

  // Show trending on homepage
  var trendingGrid = document.getElementById('trending-grid');
  if (trendingGrid) {
    fetch('/contents.json?_=' + Date.now())
      .then(function(r) { return r.json(); })
      .then(function(items) {
        var counts = getViewCounts();
        // Score = local views * 2 + recency bonus
        var now = Date.now() / 1000;
        var scored = items.filter(function(i) {
          return i.path && i.path.indexOf('/news-') === 0 && i.path.indexOf('.html') !== -1 &&
                 i.path.indexOf('news-music.html') === -1 && i.path.indexOf('news-sports.html') === -1 &&
                 i.path.indexOf('news-entertainment.html') === -1 && i.path.indexOf('news-national.html') === -1 &&
                 i.path.indexOf('news.html') === -1;
        }).map(function(i) {
          var slug = i.path.split('/').pop();
          var views = counts[slug] || 0;
          var ageDays = Math.max(1, (now - (i.published || i.updated || now)) / 86400);
          var recencyBonus = Math.max(0, 30 - ageDays) * 0.5;
          return { item: i, score: views * 2 + recencyBonus, views: views };
        }).sort(function(a, b) { return b.score - a.score; });

        var top = scored.slice(0, 4);
        if (top.length === 0 || top[0].views === 0) {
          // No views yet - show most recent as fallback
          top = scored.slice(0, 4);
        }

        trendingGrid.innerHTML = top.map(function(s) {
          var i = s.item;
          var t = (i.title || '').replace(/\s*\|\s*DJWEIRDNASTY.*$/i, '');
          var d = i.desc ? i.desc.substring(0, 80) : 'Read the full story.';
          var badge = s.views > 0 ? '<span style="position:absolute;top:6px;right:6px;background:#ff4d8f;color:#fff;font-size:0.65rem;padding:2px 6px;border-radius:999px;font-weight:700;">' + s.views + ' reads</span>' : '';
          return '<article class="event-card" style="position:relative;">' + badge +
            '<img loading="lazy" src="' + (i.thumb || i.img || '') + '" alt="' + t + '" class="event-flyer">' +
            '<h3 style="font-size:0.85rem;line-height:1.25;">' + t + '</h3>' +
            '<p style="font-size:0.8rem;color:#ccc;margin-bottom:0.5rem;">' + d + '...</p>' +
            '<a href="' + i.path + '" class="playlist-link">Read more</a></article>';
        }).join('');
      })
      .catch(function() {
        trendingGrid.innerHTML = '<p style="color:#888;">Unable to load trending articles.</p>';
      });
  }

  // ===== AWIN Publisher MasterTag =====
  var awinTag = document.createElement('script');
  awinTag.async = true;
  awinTag.src = 'https://www.dwin2.com/pub.3038027.min.js';
  document.body.appendChild(awinTag);

  // ===== Service Worker Registration (PWA) =====
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
      navigator.serviceWorker.register('/service-worker.js').catch(function() {});
    });
  }

  // ===== AWIN affiliate promo link =====
  var path = window.location.pathname;
  var isContent = /\/(news-?|event-?|recap-|murrdah-)/.test(path);
  if (isContent) {
    var promo = document.createElement('div');
    promo.className = 'affiliate-promo';
    promo.style.cssText = 'background:#1a1a1a; border:1px solid #ff4d8f; border-radius:12px; padding:1.25rem; margin:1.5rem auto; max-width:600px; text-align:center;';
    promo.innerHTML = '<p style="margin:0 0 0.5rem; color:#888; font-size:0.7rem; text-transform:uppercase; letter-spacing:0.05em;">Sponsored</p><a href="https://www.awin1.com/cread.php?awinmid=128989&awinaffid=3038027&ued=https%3A%2F%2Fwww.stand4socks.com%2Fcollections%2Fall" target="_blank" rel="sponsored noopener" style="display:inline-block; background:#ff4d8f; color:#fff; padding:0.6rem 1.25rem; border-radius:8px; text-decoration:none; font-weight:700;">Shop Stand4 Socks</a>';
    var main = document.querySelector('main');
    if (main) {
      main.appendChild(promo);
    } else {
      document.body.appendChild(promo);
    }
  }

  // ===== Share This Article Bar =====
  if (article) {
    var shareBar = document.createElement('div');
    shareBar.className = 'share-bar';
    shareBar.style.cssText = 'margin-top: 2.5rem; padding-top: 1.25rem; border-top: 1px solid #333; text-align: center;';
    shareBar.innerHTML = '<p style="margin: 0 0 0.75rem; color: #aaa; font-size: 0.75rem; text-transform: uppercase; letter-spacing: 1px;">Share this</p>' +
      '<a href="#" class="share-x" target="_blank" rel="noopener" style="display: inline-block; margin: 0 0.4rem; padding: 0.5rem 1rem; background: #000; color: #fff; border: 1px solid #ff5bd7; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.85rem;">X</a>' +
      '<a href="#" class="share-fb" target="_blank" rel="noopener" style="display: inline-block; margin: 0 0.4rem; padding: 0.5rem 1rem; background: #000; color: #fff; border: 1px solid #ff5bd7; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.85rem;">Facebook</a>' +
      '<a href="#" class="share-copy" style="display: inline-block; margin: 0 0.4rem; padding: 0.5rem 1rem; background: #000; color: #fff; border: 1px solid #ff5bd7; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 0.85rem; cursor: pointer;">Copy Link</a>';

    article.appendChild(shareBar);

    var pageUrl = encodeURIComponent(window.location.href);
    var pageTitle = encodeURIComponent(document.title);
    shareBar.querySelector('.share-x').href = 'https://twitter.com/intent/tweet?url=' + pageUrl + '&text=' + pageTitle;
    shareBar.querySelector('.share-fb').href = 'https://www.facebook.com/sharer/sharer.php?u=' + pageUrl;
    shareBar.querySelector('.share-copy').addEventListener('click', function(e) {
      e.preventDefault();
      if (navigator.clipboard) {
        navigator.clipboard.writeText(window.location.href).then(function() {
          var btn = shareBar.querySelector('.share-copy');
          var original = btn.textContent;
          btn.textContent = 'Copied!';
          setTimeout(function() { btn.textContent = original; }, 1500);
        });
      }
    });
  }

})();
