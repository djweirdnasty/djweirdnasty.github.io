/**
 * DJWEIRDNASTY Comments & Likes Widget
 * Custom replacement for Disqus — no third-party accounts required
 */

var API_BASE = 'https://djweirdnasty-api.kurtisctabb.workers.dev/api';

// ---------------------------------------------------------------------------
// Token management
// ---------------------------------------------------------------------------

function getToken() {
  return localStorage.getItem('djwn_token');
}

function setToken(token) {
  localStorage.setItem('djwn_token', token);
}

function removeToken() {
  localStorage.removeItem('djwn_token');
}

function getUsername() {
  return localStorage.getItem('djwn_username');
}

function setUsername(username) {
  localStorage.setItem('djwn_username', username);
}

function removeUsername() {
  localStorage.removeItem('djwn_username');
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function apiGet(path) {
  const token = getToken();
  const headers = {};
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, { headers });
  return res.json();
}

async function apiPost(path, body) {
  const token = getToken();
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });
  return res.json();
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
  likeBtn.style.cssText = 'background:none;border:1px solid rgba(255,255,255,0.2);border-radius:20px;padding:6px 16px;cursor:pointer;font-size:0.9rem;color:#fff;display:flex;align-items:center;gap:6px;transition:all 0.2s;';
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

  // Initialize
  renderAuthArea(authArea, formArea);
  loadComments(commentsList, slug);
  loadLikes(likeBtn, slug);
  setupLikeButton(likeBtn, slug);
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

  submitBtn.onclick = async function () {
    var content = textarea.value.trim();
    if (!content) return;

    submitBtn.disabled = true;
    submitBtn.textContent = 'Posting...';

    var slug = getPostSlug();
    var res = await apiPost('/comments', { slug: slug, content: content });

    submitBtn.disabled = false;
    submitBtn.textContent = 'Post Comment';

    if (res.error) {
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

    if (res.error) return;

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
  document.addEventListener('DOMContentLoaded', injectComments);
} else {
  injectComments();
}
