/**
 * DJWEIRDNASTY Comments & Likes Widget
 * Custom replacement for Disqus — no third-party accounts required
 */

var API_BASE = 'https://djweirdnasty-api.kurtisctabb.workers.dev/api';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

function getToken() {
  try { return localStorage.getItem('djwn_token'); } catch(e) { return null; }
}

function setToken(token) {
  try { localStorage.setItem('djwn_token', token); } catch(e) {}
}

function removeToken() {
  try { localStorage.removeItem('djwn_token'); } catch(e) {}
}

function getUsername() {
  try { return localStorage.getItem('djwn_username'); } catch(e) { return null; }
}

function setUsername(username) {
  try { localStorage.setItem('djwn_username', username); } catch(e) {}
}

function removeUsername() {
  try { localStorage.removeItem('djwn_username'); } catch(e) {}
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiGet(path) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    const res = await fetch(API_BASE + path, { headers });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch(e) { return { error: 'Unexpected response from server.' }; }
  } catch(e) {
    return { error: 'Network error. Please check your connection.' };
  }
}

async function apiPost(path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  try {
    const res = await fetch(API_BASE + path, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    const text = await res.text();
    try { return JSON.parse(text); }
    catch(e) { return { error: 'Unexpected response from server.' }; }
  } catch(e) {
    return { error: 'Network error. Please check your connection.' };
  }
}

// ---------------------------------------------------------------------------
// Get post slug from URL
// ---------------------------------------------------------------------------

function getPostSlug() {
  return window.location.pathname.split('/').pop() || window.location.pathname;
}

// ---------------------------------------------------------------------------
// Time formatting
// ---------------------------------------------------------------------------

function timeAgo(dateStr) {
  var date = new Date(dateStr + (dateStr.endsWith('Z') ? '' : 'Z'));
  var seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return 'just now';
  var minutes = Math.floor(seconds / 60);
  if (minutes < 60) return minutes + 'm ago';
  var hours = Math.floor(minutes / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.floor(hours / 24);
  if (days < 30) return days + 'd ago';
  var months = Math.floor(days / 30);
  if (months < 12) return months + 'mo ago';
  return Math.floor(months / 12) + 'y ago';
}

// ---------------------------------------------------------------------------
// Escape HTML
// ---------------------------------------------------------------------------

function escapeHtml(str) {
  var div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Build the widget
// ---------------------------------------------------------------------------

function injectComments() {
  var article = document.querySelector('article.info, main article');
  if (!article) article = document.querySelector('main');
  if (!article) return;

  var slug = getPostSlug();

  var wrapper = document.createElement('div');
  wrapper.className = 'djwn-widget';
  wrapper.style.cssText = 'margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.15);';

  // Like button row
  var likeRow = document.createElement('div');
  likeRow.style.cssText = 'display:flex;align-items:center;gap:0.5rem;margin-bottom:1.5rem;';
  var likeBtn = document.createElement('button');
  likeBtn.className = 'djwn-like-btn';
  likeBtn.style.cssText = 'background:none;border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:10px 20px;cursor:pointer;font-size:1rem;color:#fff;display:flex;align-items:center;gap:6px;transition:all 0.2s;min-height:44px;-webkit-tap-highlight-color:rgba(79,168,255,0.3);';
  likeBtn.innerHTML = '<span class="djwn-heart">&#9825;</span> <span class="djwn-like-count">0</span>';
  likeRow.appendChild(likeBtn);
  wrapper.appendChild(likeRow);

  // Comments heading
  var heading = document.createElement('h3');
  heading.textContent = 'Comments';
  heading.style.cssText = 'color:#4fa8ff;margin-bottom:1rem;';
  wrapper.appendChild(heading);

  // Auth area
  var authArea = document.createElement('div');
  authArea.className = 'djwn-auth-area';
  wrapper.appendChild(authArea);

  // Comment form (only shown when logged in)
  var formArea = document.createElement('div');
  formArea.className = 'djwn-form-area';
  wrapper.appendChild(formArea);

  // Comments list
  var commentsList = document.createElement('div');
  commentsList.className = 'djwn-comments-list';
  commentsList.style.cssText = 'margin-top:1rem;';
  wrapper.appendChild(commentsList);

  article.appendChild(wrapper);

  // Add styles
  addWidgetStyles();

  // Initialize — each step wrapped so one failure doesn't block the others
  try { renderAuthArea(authArea, formArea); } catch(e) {}
  loadComments(commentsList, slug);
  loadLikes(likeBtn, slug);
  try { setupLikeButton(likeBtn, slug); } catch(e) {}
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

function addWidgetStyles() {
  if (document.getElementById('djwn-styles')) return;
  var style = document.createElement('style');
  style.id = 'djwn-styles';
  style.textContent = [
    '.djwn-widget { font-family: inherit; }',
    '.djwn-widget input { background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:8px 12px;color:#fff;font-size:0.9rem;width:100%;box-sizing:border-box;margin-bottom:8px; }',
    '.djwn-widget input:focus { outline:none;border-color:#4fa8ff; }',
    '.djwn-widget textarea { background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.2);border-radius:6px;padding:8px 12px;color:#fff;font-size:0.9rem;width:100%;box-sizing:border-box;margin-bottom:8px;resize:vertical;min-height:80px;font-family:inherit; }',
    '.djwn-widget textarea:focus { outline:none;border-color:#4fa8ff; }',
    '.djwn-widget .djwn-btn { background:#4fa8ff;border:none;border-radius:6px;padding:8px 20px;color:#000;font-weight:600;cursor:pointer;font-size:0.9rem;transition:background 0.2s; }',
    '.djwn-widget .djwn-btn:hover { background:#3a8de0; }',
    '.djwn-widget .djwn-btn-secondary { background:none;border:1px solid rgba(255,255,255,0.2);color:#fff; }',
    '.djwn-widget .djwn-btn-secondary:hover { background:rgba(255,255,255,0.05); }',
    '.djwn-widget .djwn-comment { background:rgba(255,255,255,0.04);border-radius:8px;padding:12px 16px;margin-bottom:12px; }',
    '.djwn-widget .djwn-comment-header { display:flex;justify-content:space-between;align-items:center;margin-bottom:6px; }',
    '.djwn-widget .djwn-comment-author { font-weight:600;color:#4fa8ff;font-size:0.9rem; }',
    '.djwn-widget .djwn-comment-time { font-size:0.75rem;color:rgba(255,255,255,0.4); }',
    '.djwn-widget .djwn-comment-body { font-size:0.9rem;line-height:1.5;color:rgba(255,255,255,0.85);word-wrap:break-word; }',
    '.djwn-widget .djwn-error { color:#ff6b6b;font-size:0.85rem;margin-bottom:8px; }',
    '.djwn-widget .djwn-success { color:#4fa8ff;font-size:0.85rem;margin-bottom:8px; }',
    '.djwn-widget .djwn-like-btn.liked .djwn-heart { color:#ff4757; }',
    '.djwn-widget .djwn-like-btn:hover { border-color:rgba(255,255,255,0.4); }',
    '.djwn-widget .djwn-auth-tabs { display:flex;gap:1rem;margin-bottom:1rem; }',
    '.djwn-widget .djwn-auth-tab { background:none;border:none;color:rgba(255,255,255,0.5);cursor:pointer;font-size:0.9rem;padding:4px 0;border-bottom:2px solid transparent; }',
    '.djwn-widget .djwn-auth-tab.active { color:#4fa8ff;border-bottom-color:#4fa8ff; }',
    '.djwn-widget .djwn-logged-in-bar { display:flex;justify-content:space-between;align-items:center;margin-bottom:1rem; }',
    '.djwn-widget .djwn-logged-in-bar span { font-size:0.9rem;color:rgba(255,255,255,0.7); }',
    // Mobile: 16px font on inputs prevents iOS auto-zoom, larger touch targets
    '@media (max-width: 600px) {',
    '  .djwn-widget input, .djwn-widget textarea { font-size:16px; }',
    '  .djwn-widget .djwn-btn { padding:12px 24px;font-size:1rem; }',
    '  .djwn-widget .djwn-like-btn { padding:10px 20px;font-size:1rem;min-height:44px; }',
    '  .djwn-widget .djwn-auth-tab { padding:8px 0;font-size:1rem; }',
    '  .djwn-widget .djwn-comment-body { font-size:1rem; }',
    '}',
  ].join('\n');
  document.head.appendChild(style);
}

// ---------------------------------------------------------------------------
// Auth area rendering
// ---------------------------------------------------------------------------

function renderAuthArea(authArea, formArea) {
  var token = getToken();
  var username = getUsername();

  authArea.innerHTML = '';
  formArea.innerHTML = '';

  if (token && username) {
    // Logged in bar
    var bar = document.createElement('div');
    bar.className = 'djwn-logged-in-bar';
    bar.innerHTML = '<span>Signed in as <strong style="color:#4fa8ff;">' + escapeHtml(username) + '</strong></span>';
    var logoutBtn = document.createElement('button');
    logoutBtn.className = 'djwn-btn djwn-btn-secondary';
    logoutBtn.textContent = 'Log out';
    logoutBtn.onclick = function () {
      removeToken();
      removeUsername();
      renderAuthArea(authArea, formArea);
    };
    bar.appendChild(logoutBtn);
    authArea.appendChild(bar);

    // Comment form
    renderCommentForm(formArea);
  } else {
    // Auth tabs
    var tabs = document.createElement('div');
    tabs.className = 'djwn-auth-tabs';
    var loginTab = document.createElement('button');
    loginTab.className = 'djwn-auth-tab active';
    loginTab.textContent = 'Log In';
    var registerTab = document.createElement('button');
    registerTab.className = 'djwn-auth-tab';
    registerTab.textContent = 'Sign Up';
    tabs.appendChild(loginTab);
    tabs.appendChild(registerTab);
    authArea.appendChild(tabs);

    var formHolder = document.createElement('div');
    authArea.appendChild(formHolder);

    function showLogin() {
      loginTab.classList.add('active');
      registerTab.classList.remove('active');
      formHolder.innerHTML = '';
      renderLoginForm(formHolder, authArea, formArea);
    }

    function showRegister() {
      registerTab.classList.add('active');
      loginTab.classList.remove('active');
      formHolder.innerHTML = '';
      renderRegisterForm(formHolder, authArea, formArea);
    }

    loginTab.onclick = showLogin;
    registerTab.onclick = showRegister;
    showLogin();
  }
}

function renderLoginForm(holder, authArea, formArea) {
  var form = document.createElement('div');
  form.innerHTML = [
    '<input type="email" class="djwn-login-email" placeholder="Email" />',
    '<input type="password" class="djwn-login-password" placeholder="Password" />',
    '<div class="djwn-login-error"></div>',
  ].join('');

  var btn = document.createElement('button');
  btn.className = 'djwn-btn';
  btn.textContent = 'Log In';
  btn.style.marginBottom = '0.5rem';

  btn.onclick = async function () {
    var email = form.querySelector('.djwn-login-email').value;
    var password = form.querySelector('.djwn-login-password').value;
    var errEl = form.querySelector('.djwn-login-error');
    errEl.textContent = '';

    btn.disabled = true;
    btn.textContent = 'Logging in...';

    var res = await apiPost('/auth/login', { email: email, password: password });

    btn.disabled = false;
    btn.textContent = 'Log In';

    if (res.error) {
      errEl.textContent = res.error;
      return;
    }

    setToken(res.token);
    setUsername(res.username);
    if (!getToken()) {
      errEl.textContent = 'Your browser is blocking local storage (private browsing mode). Please disable it to log in.';
      return;
    }
    renderAuthArea(authArea, formArea);
  };

  form.appendChild(btn);
  holder.appendChild(form);

  // Enter key submits
  form.querySelector('.djwn-login-password').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') btn.click();
  });
}

function renderRegisterForm(holder, authArea, formArea) {
  var form = document.createElement('div');
  form.innerHTML = [
    '<label style="display:block;color:rgba(255,255,255,0.6);font-size:0.8rem;margin-bottom:4px;">Username</label>',
    '<input type="text" class="djwn-reg-username" placeholder="Choose a username" autocomplete="username" />',
    '<label style="display:block;color:rgba(255,255,255,0.6);font-size:0.8rem;margin-bottom:4px;">Email</label>',
    '<input type="email" class="djwn-reg-email" placeholder="you@example.com" autocomplete="email" />',
    '<label style="display:block;color:rgba(255,255,255,0.6);font-size:0.8rem;margin-bottom:4px;">Password</label>',
    '<input type="password" class="djwn-reg-password" placeholder="At least 6 characters" minlength="6" autocomplete="new-password" />',
    '<div class="djwn-reg-error"></div>',
  ].join('');

  var btn = document.createElement('button');
  btn.className = 'djwn-btn';
  btn.textContent = 'Sign Up';
  btn.style.marginBottom = '0.5rem';

  btn.onclick = async function () {
    var username = form.querySelector('.djwn-reg-username').value.trim();
    var email = form.querySelector('.djwn-reg-email').value.trim();
    var password = form.querySelector('.djwn-reg-password').value;
    var errEl = form.querySelector('.djwn-reg-error');
    errEl.textContent = '';

    // Client-side validation with clearer messages
    if (!username || username.length < 2) {
      errEl.textContent = 'Username must be at least 2 characters.';
      return;
    }
    if (/\s/.test(username)) {
      errEl.textContent = 'Username cannot contain spaces.';
      return;
    }
    if (/@/.test(username)) {
      errEl.textContent = 'Your email should go in the Email field, not the Username field.';
      return;
    }
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Please enter a valid email address.';
      return;
    }
    if (email.indexOf(' ') >= 0) {
      errEl.textContent = 'Email cannot contain spaces.';
      return;
    }
    if (password.length < 6) {
      errEl.textContent = 'Password must be at least 6 characters.';
      return;
    }

    btn.disabled = true;
    btn.textContent = 'Creating account...';

    var res = await apiPost('/auth/register', {
      username: username,
      email: email,
      password: password,
    });

    btn.disabled = false;
    btn.textContent = 'Sign Up';

    if (res.error) {
      errEl.textContent = res.error;
      return;
    }

    setToken(res.token);
    setUsername(res.username);
    if (!getToken()) {
      errEl.textContent = 'Your browser is blocking local storage (private browsing mode). Please disable it to sign up.';
      return;
    }
    renderAuthArea(authArea, formArea);
  };

  form.appendChild(btn);
  holder.appendChild(form);

  form.querySelector('.djwn-reg-password').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') btn.click();
  });
}

function renderCommentForm(formArea) {
  formArea.innerHTML = '';

  var textarea = document.createElement('textarea');
  textarea.className = 'djwn-comment-input';
  textarea.placeholder = 'Write a comment...';
  textarea.maxLength = 2000;

  var btnRow = document.createElement('div');
  btnRow.style.cssText = 'display:flex;justify-content:flex-end;';

  var submitBtn = document.createElement('button');
  submitBtn.className = 'djwn-btn';
  submitBtn.textContent = 'Post Comment';

  btnRow.appendChild(submitBtn);
  formArea.appendChild(textarea);
  formArea.appendChild(btnRow);

  var errEl = document.createElement('div');
  errEl.className = 'djwn-error';
  errEl.style.cssText = 'margin-bottom:8px;';
  formArea.appendChild(errEl);

  submitBtn.onclick = async function () {
    var content = textarea.value.trim();
    if (!content) return;

    errEl.textContent = '';
    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    var slug = getPostSlug();
    var res = await apiPost('/comments', { slug: slug, content: content });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Post Comment';

    if (res.error) {
      errEl.textContent = res.error;
      textarea.style.borderColor = '#ff6b6b';
      setTimeout(function () { textarea.style.borderColor = ''; }, 2000);
      return;
    }

    textarea.value = '';
    var commentsList = document.querySelector('.djwn-comments-list');
    loadComments(commentsList, slug);
  };
}

// ---------------------------------------------------------------------------
// Load comments
// ---------------------------------------------------------------------------

async function loadComments(container, slug) {
  container.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:0.85rem;">Loading comments...</div>';

  var res = await apiGet('/comments?slug=' + encodeURIComponent(slug));

  if (res.error) {
    container.innerHTML = '<div class="djwn-error">' + escapeHtml(res.error) + '</div>';
    return;
  }

  if (!res.comments || res.comments.length === 0) {
    container.innerHTML = '<div style="color:rgba(255,255,255,0.4);font-size:0.85rem;">No comments yet. Be the first to comment!</div>';
    return;
  }

  container.innerHTML = '';
  res.comments.forEach(function (c) {
    var div = document.createElement('div');
    div.className = 'djwn-comment';
    div.innerHTML = [
      '<div class="djwn-comment-header">',
      '<span class="djwn-comment-author">' + escapeHtml(c.username) + '</span>',
      '<span class="djwn-comment-time">' + timeAgo(c.created_at) + '</span>',
      '</div>',
      '<div class="djwn-comment-body">' + escapeHtml(c.content) + '</div>',
    ].join('');
    container.appendChild(div);
  });
}

// ---------------------------------------------------------------------------
// Likes
// ---------------------------------------------------------------------------

async function loadLikes(btn, slug) {
  var res = await apiGet('/likes?slug=' + encodeURIComponent(slug));
  if (res.error) return;

  btn.querySelector('.djwn-like-count').textContent = res.count;
  if (res.liked) {
    btn.classList.add('liked');
    btn.querySelector('.djwn-heart').innerHTML = '&#9829;';
  } else {
    btn.classList.remove('liked');
    btn.querySelector('.djwn-heart').innerHTML = '&#9825;';
  }
}

function setupLikeButton(btn, slug) {
  btn.onclick = async function () {
    if (!getToken()) {
      // Scroll to auth area
      var authArea = document.querySelector('.djwn-auth-area');
      if (authArea) authArea.scrollIntoView({ behavior: 'smooth' });
      return;
    }

    btn.disabled = true;
    var res = await apiPost('/likes', { slug: slug });
    btn.disabled = false;

    if (res.error) {
      var widget = btn.closest('.djwn-widget');
      if (widget) {
        var existing = widget.querySelector('.djwn-like-error');
        if (existing) existing.remove();
        var errEl = document.createElement('div');
        errEl.className = 'djwn-like-error djwn-error';
        errEl.textContent = res.error;
        errEl.style.cssText = 'margin-top:0.5rem;';
        btn.parentNode.appendChild(errEl);
        setTimeout(function () { errEl.remove(); }, 4000);
      }
      return;
    }

    btn.querySelector('.djwn-like-count').textContent = res.count;
    if (res.liked) {
      btn.classList.add('liked');
      btn.querySelector('.djwn-heart').innerHTML = '&#9829;';
    } else {
      btn.classList.remove('liked');
      btn.querySelector('.djwn-heart').innerHTML = '&#9825;';
    }
  };
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    injectComments();
    injectJsonLd();
  });
} else {
  injectComments();
  injectJsonLd();
}

// ---------------------------------------------------------------------------
// JSON-LD Structured Data (NewsArticle)
// ---------------------------------------------------------------------------

function injectJsonLd() {
  if (document.getElementById('djwn-jsonld')) return;

  var article = document.querySelector('article.info, main article');
  if (!article) return;

  var backLink = article.querySelector('a[href^="news-"]');
  if (!backLink) return;

  var categoryPage = backLink.getAttribute('href');
  if (!categoryPage || categoryPage === 'news.html') return;

  var categoryMap = {
    'news-music.html': 'Music News',
    'news-sports.html': 'Sports News',
    'news-entertainment.html': 'Entertainment News',
    'news-national.html': 'National News'
  };
  var sectionName = categoryMap[categoryPage] || 'News';

  var h1 = article.querySelector('h1');
  var headline = h1 ? h1.textContent : document.title;

  var ogTitle = document.querySelector('meta[property="og:title"]');
  if (ogTitle) headline = ogTitle.getAttribute('content');

  var ogDesc = document.querySelector('meta[property="og:description"]');
  var description = ogDesc ? ogDesc.getAttribute('content') : '';
  if (!description) {
    var firstP = article.querySelector('p:not(:first-child)');
    if (firstP) description = firstP.textContent.trim().substring(0, 200);
  }

  var ogImage = document.querySelector('meta[property="og:image"]');
  var image = ogImage ? ogImage.getAttribute('content') : '';
  if (!image) {
    var articleImg = article.querySelector('img.event-flyer');
    if (articleImg) image = 'https://djweirdnasty.com/' + articleImg.getAttribute('src');
  }

  var datePublished = '';
  var dateEl = article.querySelector('p em');
  if (dateEl) {
    var dateText = dateEl.textContent.replace('Published:', '').trim();
    var parsed = new Date(dateText);
    if (!isNaN(parsed.getTime())) {
      datePublished = parsed.toISOString();
    }
  }
  if (!datePublished) datePublished = new Date().toISOString();

  var url = window.location.href;

  var jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    "headline": headline,
    "description": description,
    "image": image,
    "datePublished": datePublished,
    "dateModified": datePublished,
    "author": {
      "@type": "Organization",
      "name": "DJWEIRDNASTY",
      "url": "https://djweirdnasty.com"
    },
    "publisher": {
      "@type": "Organization",
      "name": "DJWEIRDNASTY",
      "logo": {
        "@type": "ImageObject",
        "url": "https://djweirdnasty.com/djweirdnasty-banner.png"
      }
    },
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": url
    },
    "articleSection": sectionName,
    "url": url
  };

  var script = document.createElement('script');
  script.id = 'djwn-jsonld';
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(jsonLd);
  document.head.appendChild(script);
}

// ---------------------------------------------------------------------------
// Related Articles / Read Next
// ---------------------------------------------------------------------------

async function injectRelatedArticles() {
  var article = document.querySelector('article.info, main article');
  if (!article) return;

  var backLink = article.querySelector('a[href^="news-"]');
  if (!backLink) return;

  var categoryPage = backLink.getAttribute('href');
  if (!categoryPage || categoryPage === 'news.html') return;

  var currentSlug = getPostSlug();

  try {
    var res = await fetch(categoryPage);
    if (!res.ok) return;
    var html = await res.text();
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var cards = doc.querySelectorAll('article.event-card');
    if (!cards || cards.length === 0) return;

    var related = [];
    cards.forEach(function(card) {
      var link = card.querySelector('a.playlist-link');
      if (!link) return;
      var href = link.getAttribute('href');
      if (!href || href === currentSlug || href === window.location.pathname.split('/').pop()) return;
      var img = card.querySelector('img.event-flyer');
      var h3 = card.querySelector('h3');
      var p = card.querySelector('p:not(:first-of-type)');
      if (!h3) return;
      related.push({
        href: href,
        img: img ? img.getAttribute('src') : null,
        alt: img ? img.getAttribute('alt') : '',
        title: h3.textContent,
        desc: p ? p.textContent : ''
      });
    });

    if (related.length === 0) return;
    var picks = related.slice(0, 3);
    if (picks.length < 3 && related.length > picks.length) {
      picks = related.slice(0, Math.min(3, related.length));
    }

    var section = document.createElement('div');
    section.className = 'djwn-related';
    section.style.cssText = 'margin-top:2rem;padding-top:1.5rem;border-top:1px solid rgba(255,255,255,0.15);';

    var heading = document.createElement('h3');
    heading.textContent = 'Read Next';
    heading.style.cssText = 'color:#ffd860;margin-bottom:1rem;';
    section.appendChild(heading);

    var grid = document.createElement('div');
    grid.style.cssText = 'display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:1rem;';

    picks.forEach(function(item) {
      var card = document.createElement('article');
      card.className = 'event-card';
      card.style.cssText = 'background:rgba(255,255,255,0.04);border-radius:8px;overflow:hidden;';
      var html_parts = [];
      if (item.img) {
        html_parts.push('<img src="' + escapeHtml(item.img) + '" alt="' + escapeHtml(item.alt) + '" class="event-flyer" style="width:100%;height:auto;border-radius:8px 8px 0 0;">');
      }
      html_parts.push('<div style="padding:0.75rem;">');
      html_parts.push('<h4 style="font-size:0.9rem;margin-bottom:0.5rem;line-height:1.3;">' + escapeHtml(item.title) + '</h4>');
      if (item.desc) {
        var shortDesc = item.desc.length > 80 ? item.desc.substring(0, 77) + '...' : item.desc;
        html_parts.push('<p style="font-size:0.8rem;color:rgba(255,255,255,0.6);margin-bottom:0.5rem;">' + escapeHtml(shortDesc) + '</p>');
      }
      html_parts.push('<a href="' + escapeHtml(item.href) + '" class="playlist-link" style="font-size:0.85rem;">Read more &rarr;</a>');
      html_parts.push('</div>');
      card.innerHTML = html_parts.join('');
      grid.appendChild(card);
    });

    section.appendChild(grid);

    var shareBtn = article.querySelector('.share-button');
    if (shareBtn) {
      shareBtn.parentNode.insertBefore(section, shareBtn);
    } else {
      article.appendChild(section);
    }
  } catch(e) {
    // Silently fail - related articles are a nice-to-have
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', function() {
    setTimeout(injectRelatedArticles, 100);
  });
} else {
  setTimeout(injectRelatedArticles, 100);
}
