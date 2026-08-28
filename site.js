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
        '<a href="index.html#events" style="color: #ffd860;">Events</a>';
      var shareBtn = article.querySelector('.share-button, .social-share');
      if (shareBtn) {
        article.insertBefore(moreNews, shareBtn);
      } else {
        article.appendChild(moreNews);
      }
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
  if (window.location.pathname.indexOf('sol.html') === -1 &&
      window.location.pathname.indexOf('contact.html') === -1) {
    var bookCta = document.createElement('a');
    bookCta.className = 'book-cta';
    bookCta.href = 'sol.html';
    bookCta.innerHTML = '\u266B Book DJWEIRDNASTY';
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
    var shareUrl = existingShare.getAttribute('data-url') || window.location.href;
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

  // ===== AWIN Publisher MasterTag =====
  var awinTag = document.createElement('script');
  awinTag.async = true;
  awinTag.src = 'https://www.dwin2.com/pub.3038027.min.js';
  document.body.appendChild(awinTag);

  // ===== AWIN affiliate promo link =====
  var path = window.location.pathname;
  var isContent = /\/(news-?|event-?|recap-|murrdah-)/.test(path);
  if (isContent) {
    var promo = document.createElement('div');
    promo.className = 'affiliate-promo';
    promo.style.cssText = 'text-align:center; padding:1rem; font-size:0.9rem;';
    promo.innerHTML = '<a href="https://www.awin1.com/cread.php?awinmid=128989&awinaffid=3038027&ued=https%3A%2F%2Fwww.stand4socks.com%2Fcollections%2Fall" target="_blank" rel="sponsored noopener" style="color:#ff4d8f; text-decoration:underline;">Shop Stand4 Socks</a>';
    var main = document.querySelector('main');
    if (main) {
      main.appendChild(promo);
    } else {
      document.body.appendChild(promo);
    }
  }

})();
