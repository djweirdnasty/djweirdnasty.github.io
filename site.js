(function() {
  'use strict';

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

})();
