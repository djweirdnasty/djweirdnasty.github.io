    console.log('[SOL APP] loaded v7');

    // Back-compat: old "Share Profile" links were sol.html?dj=<name> with no
    // handler. Redirect them to the dedicated public DJ profile page.
    (function() {
      var djParam = new URLSearchParams(window.location.search).get('dj');
      if (djParam) {
        window.location.replace('dj.html?dj=' + encodeURIComponent(djParam));
      }
    })();

    // Brand SVG icons for website/social link buttons.
    var SOCIAL_ICONS = {
      website: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:14px;height:14px;vertical-align:-2px;"><circle cx="12" cy="12" r="10"/><ellipse cx="12" cy="12" rx="4.5" ry="10"/><line x1="2" y1="12" x2="22" y2="12"/></svg>',
      instagram: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;vertical-align:-2px;"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zm0 10.162a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>',
      tiktok: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;vertical-align:-2px;"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/></svg>',
      youtube: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;vertical-align:-2px;"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>',
      facebook: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;vertical-align:-2px;"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>',
      twitter: '<svg viewBox="0 0 24 24" style="width:14px;height:14px;fill:currentColor;vertical-align:-2px;"><path d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/></svg>'
    };

    const API_BASE = 'https://rork-dj-booking-payment-app.onrender.com';
    const BOOKING_URL = API_BASE + '/api/bookings/request';
    const SEARCH_URL = API_BASE + '/api/djs/search';

    const firebaseConfig = {
      apiKey: 'AIzaSyDWU2qcKFA3cxK6ofT0IOrO9ss8bj29ttU',
      authDomain: 'studio-3475382917-e5aaa.firebaseapp.com',
      projectId: 'studio-3475382917-e5aaa',
      storageBucket: 'studio-3475382917-e5aaa.firebasestorage.app',
      messagingSenderId: '268860816836',
      appId: '1:268860816836:web:8073ff3c8327ef12a97891'
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const auth = firebase.auth();
    const functions = firebase.functions();
    const storage = firebase.storage();

    // ---------- SOL Analytics ----------
    function trackSolEvent(name, params) {
      if (typeof gtag !== 'function') return;
      try {
        var safeParams = {};
        var piiKeys = ['uid', 'userId', 'email', 'stage_name', 'city', 'hourly_rate', 'phone', 'paypal', 'address', 'dj_id', 'client_id'];
        var allowedKeys = ['method', 'online', 'status', 'action', 'rating', 'code', 'discount', 'type', 'date', 'booking_id', 'event_type', 'amount', 'conversation_id'];
        if (params) {
          for (var k in params) {
            if (params.hasOwnProperty(k) && piiKeys.indexOf(k) === -1) {
              if (allowedKeys.indexOf(k) !== -1) {
                safeParams[k] = params[k];
              }
            }
          }
        }
        gtag('event', name, safeParams);
      } catch (e) {}
    }

    // ---------- Output encoding helper (prevents XSS in innerHTML) ----------
    function escapeHtml(str) {
      if (str == null) return '';
      var s = String(str);
      return s.replace(/[&<>"']/g, function(m) {
        return m === '&' ? '&amp;' : m === '<' ? '&lt;' : m === '>' ? '&gt;' : m === '"' ? '&quot;' : '&#39;';
      });
    }

    function escapeAttr(str) {
      return escapeHtml(str).replace(/=/g, '&#61;').replace(/`/g, '&#96;');
    }

    function escapeCsvCell(str) {
      var s = String(str == null ? '' : str);
      // Neutralize CSV formula injection by prefixing formula-triggering characters.
      if (/^[-=+\@\t\r\n]/.test(s)) {
        s = "'" + s;
      }
      // RFC 4180 quoting for fields containing commas, quotes, or line breaks.
      if (/[",\r\n]/.test(s)) {
        s = s.replace(/"/g, '""');
        s = '"' + s + '"';
      }
      return s;
    }

    // Normalize a website URL: prepend https:// if missing.
    function normalizeWebUrl(input) {
      var s = String(input || '').trim();
      if (!s) return '';
      if (!/^https?:\/\//i.test(s)) s = 'https://' + s;
      return s;
    }

    // URL-safe DJ profile slug: "DJ Weird Nasty" → "dj-weird-nasty"
    function djSlugify(name) {
      return String(name || '').toLowerCase().trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
    }

    // Normalize a social entry: full URL passthrough, "@handle"/"handle" → domain URL.
    function normalizeSocialUrl(input, domain) {
      var s = String(input || '').trim();
      if (!s) return '';
      if (/^https?:\/\//i.test(s)) return s;
      s = s.replace(/^@/, '');
      return 'https://' + domain + '/' + s;
    }

    // Parse a date-only string (YYYY-MM-DD or similar) as local to avoid UTC off-by-one.
    function parseLocalDate(input) {
      var s = String(input || '').trim();
      var parts = s.split(/[-/]/);
      if (parts.length === 3) {
        var y = parseInt(parts[0], 10);
        var m = parseInt(parts[1], 10) - 1;
        var d = parseInt(parts[2], 10);
        return new Date(y, m, d);
      }
      return new Date(s);
    }
    function parseLocalTimestamp(input) {
      var d = parseLocalDate(input);
      if (isNaN(d.getTime())) return null;
      return d.getTime();
    }
    let authMode = 'signin';
    const authStatus = document.getElementById('sol-auth-status');
    const authNameInput = document.getElementById('sol-auth-name');
    const authEmailInput = document.getElementById('sol-auth-email');
    const authPasswordInput = document.getElementById('sol-auth-password');
    const authSubmitBtn = document.getElementById('sol-auth-submit');
    const solGate = document.getElementById('sol-gate');
    const solAppContent = document.getElementById('sol-app-content');
    const accountEmailEl = document.getElementById('sol-account-email');

    const authToggleModeLink = document.getElementById('sol-auth-toggle-mode');
    authToggleModeLink.addEventListener('click', function(e) {
      e.preventDefault();
      if (authMode === 'signin') {
        authMode = 'signup';
        authNameInput.style.display = 'block';
        authSubmitBtn.textContent = 'Create Account';
        authToggleModeLink.textContent = 'Already have an account? Sign in';
      } else {
        authMode = 'signin';
        authNameInput.style.display = 'none';
        authSubmitBtn.textContent = 'Sign In';
        authToggleModeLink.textContent = 'Need an account? Create one';
      }
      authStatus.textContent = '';
    });

    authSubmitBtn.addEventListener('click', function() {
      const email = authEmailInput.value.trim();
      const password = authPasswordInput.value;
      if (!email || !password) {
        authStatus.textContent = 'Enter an email and password.';
        authStatus.style.color = '#ff1111';
        return;
      }
      authSubmitBtn.disabled = true;
      authStatus.textContent = 'Signing in...';
      authStatus.style.color = '#ffd860';
      console.log('[AUTH] Attempting sign in for:', email);

      const done = function() { authSubmitBtn.disabled = false; };
      if (authMode === 'signup') {
        const name = authNameInput.value.trim();
        auth.createUserWithEmailAndPassword(email, password)
          .then(function(cred) {
            console.log('[AUTH] Sign up successful:', cred.user.uid);
            trackSolEvent('sign_up', { method: 'email' });
            authStatus.textContent = 'Account created! Check your email to verify before booking.';
            authStatus.style.color = '#22c55e';
            var promises = [cred.user.sendEmailVerification()];
            if (name) promises.push(cred.user.updateProfile({ displayName: name }));
            return Promise.all(promises);
          })
          .catch(function(err) {
            console.error('[AUTH] Sign up error:', err.code, err.message);
            authStatus.textContent = 'Unable to create account. Please try again.';
            authStatus.style.color = '#ff1111';
          })
          .finally(done);
      } else {
        auth.signInWithEmailAndPassword(email, password)
          .then(function(cred) {
            console.log('[AUTH] Sign in successful:', cred.user.uid);
            trackSolEvent('login', { method: 'email' });
            authStatus.textContent = '';
          })
          .catch(function(err) {
            console.error('[AUTH] Sign in error:', err.code, err.message);
            authStatus.textContent = 'Sign in failed (' + (err.code || 'unknown') + '): ' + (err.message || 'Check your email and password.');
            authStatus.style.color = '#ff1111';
          })
          .finally(done);
      }
    });

    document.getElementById('sol-auth-forgot').addEventListener('click', function(e) {
      e.preventDefault();
      const email = authEmailInput.value.trim();
      if (!email) {
        authStatus.textContent = 'Enter your email above first, then click "Forgot password?" again.';
        authStatus.style.color = '#ffd860';
        return;
      }
      auth.sendPasswordResetEmail(email, {
        url: 'https://djweirdnasty.com/reset-password.html',
        handleCodeInApp: true
      })
        .then(function() {
          trackSolEvent('password_reset', { method: 'email' });
          authStatus.textContent = 'If an account exists, a reset email has been sent.';
          authStatus.style.color = '#22c55e';
        })
        .catch(function(err) {
          console.error('[AUTH] Password reset error:', err.code, err.message);
          authStatus.textContent = 'If an account exists, a reset email has been sent.';
          authStatus.style.color = '#22c55e';
        });
    });

    document.getElementById('sol-account-signout').addEventListener('click', function() {
      trackSolEvent('sign_out', {});
      auth.signOut();
    });

    let solAppInitialized = false;
    let isVerifiedDJ = false;
    let djModeActive = false;
    let djStatusUnsubscribe = null;
    let djConversationsUnsubscribe = null;
    let userDocUnsubscribe = null;

    const djModeToggleBtn = document.getElementById('sol-dj-mode-toggle');
    const djConsole = document.getElementById('sol-dj-console');
    const clientView = document.getElementById('sol-client-view');
    const djOnlineToggle = document.getElementById('sol-dj-online-toggle');
    const djToggleTrack = document.getElementById('sol-dj-toggle-track');
    const djToggleKnob = document.getElementById('sol-dj-toggle-knob');
    const djStatusLabel = document.getElementById('sol-dj-status-label');
    const djConsoleStatus = document.getElementById('sol-dj-console-status');
    const djConversationsBox = document.getElementById('sol-dj-conversations');

    function updateDjToggleLabel() {
      djModeToggleBtn.textContent = djModeActive ? 'Client Mode' : (isVerifiedDJ ? 'DJ Mode' : 'Apply as DJ');
    }

    function checkDJVerification(user) {
      // Always show the toggle so clients can access the DJ application form
      djModeToggleBtn.style.display = 'inline-block';
      updateDjToggleLabel();
      db.collection('dj-verifications').doc(user.uid).get()
        .then(function(doc) {
          if (doc.exists && doc.data().status === 'approved') {
            isVerifiedDJ = true;
            updateDjToggleLabel();
            loadDJProfile(user, doc.data());
            db.collection('dj-status').doc(user.uid).set({ isVerified: true }, { merge: true }).catch(function() {});
          } else {
            return db.collection('users').doc(user.uid).get();
          }
        })
        .then(function(userDoc) {
          if (userDoc && userDoc.exists && userDoc.data().isVerifiedDJ === true) {
            isVerifiedDJ = true;
            updateDjToggleLabel();
            loadDJProfile(user, userDoc.data());
            db.collection('dj-status').doc(user.uid).set({ isVerified: true }, { merge: true }).catch(function() {});
          }
        })
        .catch(function(err) {
          console.log('DJ verification check skipped:', err.message);
        });
    }

    function loadDJProfile(user, profileData) {
      const p = (profileData && profileData.djProfile) || profileData || {};
      const name = p.stageName || p.displayName || p.djName || user.displayName || user.email || 'DJ';
      const avatar = p.photoURL || p.avatar || '';
      const city = p.city || (p.location && p.location.city) || '';
      const state = p.state || (p.location && p.location.state) || '';
      const rating = p.rating || p.djRating || null;

      document.getElementById('sol-dj-name').textContent = name;
      document.getElementById('sol-dj-location').textContent = city ? city + (state ? ', ' + state : '') : '';
      document.getElementById('sol-dj-verified-badge').style.display = isVerifiedDJ ? 'inline-block' : 'none';
      document.getElementById('sol-dj-share-profile').style.display = isVerifiedDJ ? 'inline-block' : 'none';

      if (avatar) {
        const avatarEl = document.getElementById('sol-dj-avatar');
        avatarEl.src = avatar;
        avatarEl.style.display = 'block';
        document.getElementById('sol-dj-avatar-fallback').style.display = 'none';
      } else {
        document.getElementById('sol-dj-avatar-fallback').textContent = (name.charAt(0) || 'D').toUpperCase();
      }

      if (rating) {
        document.getElementById('sol-dj-stat-rating').textContent = Number(rating).toFixed(1);
      }
    }

    var currentDjVerificationStatus = null;
    function loadDJSetupForm(user) {
      db.collection('dj-verifications').doc(user.uid).get()
        .then(function(doc) {
          var d = doc.exists ? doc.data() : {};
          var p = d.djProfile || {};
          currentDjVerificationStatus = d.status || null;
          document.getElementById('sol-dj-stage-name').value = p.stageName || user.displayName || '';
          var avatarUrl = p.photoURL || p.avatar || '';
          document.getElementById('sol-dj-avatar-url').value = avatarUrl;
          var preview = document.getElementById('sol-dj-avatar-preview');
          if (avatarUrl && preview) {
            preview.src = avatarUrl;
            preview.style.display = 'block';
          } else if (preview) {
            preview.style.display = 'none';
          }
          document.getElementById('sol-dj-phone').value = p.phone || '';
          document.getElementById('sol-dj-notify-email').value = p.notificationEmail || user.email || '';
          document.getElementById('sol-dj-sms-optin').checked = p.smsOptIn !== false;
          document.getElementById('sol-dj-paypal').value = p.paypal || '';
          document.getElementById('sol-dj-city').value = p.city || (p.location && p.location.city) || '';
          document.getElementById('sol-dj-state').value = p.state || (p.location && p.location.state) || '';
          document.getElementById('sol-dj-genres').value = (p.genres || []).join(', ');
          document.getElementById('sol-dj-specialties').value = (p.specialties || []).join(', ');
          document.getElementById('sol-dj-equipment').value = (p.equipment || []).join(', ');
          document.getElementById('sol-dj-hourly-rate').value = p.hourlyRate || '';
          document.getElementById('sol-dj-experience').value = p.experience || '';
          document.getElementById('sol-dj-bio').value = p.bio || '';
          document.getElementById('sol-dj-website').value = p.website || '';
          var socials = p.socialLinks || {};
          document.getElementById('sol-dj-instagram').value = socials.instagram || '';
          document.getElementById('sol-dj-tiktok').value = socials.tiktok || '';
          document.getElementById('sol-dj-youtube-social').value = socials.youtube || '';
          document.getElementById('sol-dj-facebook').value = socials.facebook || '';
          document.getElementById('sol-dj-twitter').value = socials.twitter || '';
          if (d.licenseUrl) {
            var licStatusEl = document.getElementById('sol-dj-license-status');
            licStatusEl.textContent = 'License on file — upload a new file to replace it.';
            licStatusEl.style.color = '#888';
          }

          var statusEl = document.getElementById('sol-dj-verify-status');
          var submitBtn = document.getElementById('sol-dj-submit-btn');
          submitBtn.textContent = 'Save Profile & Submit for Verification';
          if (d.status === 'approved') {
            statusEl.textContent = '✅ Verified DJ — Profile is live';
            statusEl.style.background = '#22c55e33';
            statusEl.style.color = '#22c55e';
            submitBtn.textContent = 'Save Profile Changes';
          } else if (d.status === 'pending') {
            statusEl.textContent = '⏳ Verification pending — Admin will review soon';
            statusEl.style.background = '#ffd86033';
            statusEl.style.color = '#ffd860';
          } else if (d.status === 'rejected') {
            statusEl.textContent = '❌ Verification rejected — Update and resubmit';
            statusEl.style.background = '#ff3b3033';
            statusEl.style.color = '#ff3b30';
          } else {
            statusEl.textContent = '📝 Submit your profile for verification';
            statusEl.style.background = '#ff555533';
            statusEl.style.color = '#ff5555';
          }
        });
    }

    document.getElementById('sol-dj-setup-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var user = auth.currentUser;
      if (!user) return;
      var statusEl = document.getElementById('sol-dj-setup-status');
      statusEl.textContent = 'Saving...';
      statusEl.style.color = '#ffd860';

      var genres = document.getElementById('sol-dj-genres').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      var specialties = document.getElementById('sol-dj-specialties').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      var equipment = document.getElementById('sol-dj-equipment').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);

      var stageNameVal = document.getElementById('sol-dj-stage-name').value.trim();
      var profileData = {
        stageName: stageNameVal,
        profileSlug: djSlugify(stageNameVal),
        photoURL: document.getElementById('sol-dj-avatar-url').value.trim(),
        avatar: document.getElementById('sol-dj-avatar-url').value.trim(),
        phone: document.getElementById('sol-dj-phone').value.trim(),
        notificationEmail: document.getElementById('sol-dj-notify-email').value.trim(),
        smsOptIn: document.getElementById('sol-dj-sms-optin').checked,
        paypal: document.getElementById('sol-dj-paypal').value.trim(),
        city: document.getElementById('sol-dj-city').value.trim(),
        state: document.getElementById('sol-dj-state').value.trim(),
        genres: genres,
        specialties: specialties,
        equipment: equipment,
        hourlyRate: parseFloat(document.getElementById('sol-dj-hourly-rate').value) || 0,
        experience: parseInt(document.getElementById('sol-dj-experience').value) || 0,
        bio: document.getElementById('sol-dj-bio').value.trim(),
        website: normalizeWebUrl(document.getElementById('sol-dj-website').value),
        socialLinks: {
          instagram: normalizeSocialUrl(document.getElementById('sol-dj-instagram').value, 'instagram.com'),
          tiktok: normalizeSocialUrl(document.getElementById('sol-dj-tiktok').value, 'tiktok.com'),
          youtube: normalizeWebUrl(document.getElementById('sol-dj-youtube-social').value),
          facebook: normalizeSocialUrl(document.getElementById('sol-dj-facebook').value, 'facebook.com'),
          twitter: normalizeSocialUrl(document.getElementById('sol-dj-twitter').value, 'x.com')
        },
        email: user.email,
        displayName: user.displayName || user.email
      };

      var keepApproved = currentDjVerificationStatus === 'approved';
      var verData = {
        status: keepApproved ? 'approved' : 'pending',
        djProfile: profileData
      };
      if (!keepApproved) {
        verData.submittedAt = firebase.firestore.FieldValue.serverTimestamp();
      }
      var licenseUrl = document.getElementById('sol-dj-license-url').value;
      if (licenseUrl) {
        verData.licenseUrl = licenseUrl;
        verData.licenseSubmittedAt = firebase.firestore.FieldValue.serverTimestamp();
        verData.licenseStatus = 'pending';
      }

      db.collection('dj-verifications').doc(user.uid).set(verData, { merge: true })
        .then(function() {
          db.collection('djs').doc(user.uid).set(profileData, { merge: true });
          db.collection('users').doc(user.uid).set({ isDJ: true, role: 'dj' }, { merge: true });
          // dj-status is world-readable and carries only presence/location —
          // scrub any identity fields written by older versions.
          db.collection('dj-status').doc(user.uid).set({
            djName: firebase.firestore.FieldValue.delete(),
            djAvatar: firebase.firestore.FieldValue.delete()
          }, { merge: true });
          statusEl.textContent = keepApproved ? 'Profile updated!' : 'Profile saved & submitted for verification!';
          statusEl.style.color = '#22c55e';
          trackSolEvent(keepApproved ? 'dj_profile_updated' : 'dj_verification_submitted', {
            uid: user.uid,
            stage_name: profileData.stageName,
            city: profileData.city,
            hourly_rate: profileData.hourlyRate
          });
          if (!keepApproved) {
            trackSolEvent('dj_registration', {
              uid: user.uid,
              stage_name: profileData.stageName,
              city: profileData.city,
              hourly_rate: profileData.hourlyRate
            });
          }
          loadDJSetupForm(user);
          setTimeout(function() { statusEl.textContent = ''; }, 4000);
        })
        .catch(function(err) {
          statusEl.textContent = 'Error: ' + err.message;
          statusEl.style.color = '#ff1111';
        });
    });

    // ---------- DJ Profile Picture Upload ----------
    document.getElementById('sol-dj-avatar-file').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      if (!file.type.match('image.*')) {
        document.getElementById('sol-dj-avatar-upload-status').textContent = 'Please select an image file.';
        document.getElementById('sol-dj-avatar-upload-status').style.color = '#ff1111';
        return;
      }
      var user = auth.currentUser;
      if (!user) return;
      var statusEl = document.getElementById('sol-dj-avatar-upload-status');
      var preview = document.getElementById('sol-dj-avatar-preview');
      statusEl.textContent = 'Uploading...';
      statusEl.style.color = '#ffd860';
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var path = 'public/' + user.uid + '/dj-avatars/' + Date.now() + '.' + ext;
      var ref = storage.ref(path);
      var upload = ref.put(file);
      upload.on('state_changed', function() {}, function(err) {
        statusEl.textContent = 'Upload failed: ' + err.message;
        statusEl.style.color = '#ff1111';
      }, function() {
        ref.getDownloadURL().then(function(url) {
          document.getElementById('sol-dj-avatar-url').value = url;
          if (preview) { preview.src = url; preview.style.display = 'block'; }
          statusEl.textContent = 'Upload complete.';
          statusEl.style.color = '#22c55e';
          trackSolEvent('dj_profile_photo_uploaded', { uid: user.uid });
        }).catch(function(err) {
          statusEl.textContent = 'Upload failed: ' + err.message;
          statusEl.style.color = '#ff1111';
        });
      });
    });

    // ---------- DJ Driver's License Upload ----------
    document.getElementById('sol-dj-license-file').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var statusEl = document.getElementById('sol-dj-license-status');
      var isImage = !!file.type.match('image.*');
      if (!isImage && file.type !== 'application/pdf') {
        statusEl.textContent = 'Please select an image or PDF file.';
        statusEl.style.color = '#ff1111';
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        statusEl.textContent = 'File must be under 5 MB.';
        statusEl.style.color = '#ff1111';
        return;
      }
      var user = auth.currentUser;
      if (!user) return;
      statusEl.textContent = 'Uploading...';
      statusEl.style.color = '#ffd860';
      var ext = (file.name.split('.').pop() || (isImage ? 'jpg' : 'pdf')).toLowerCase();
      var ref = storage.ref('licenses/' + user.uid + '/' + Date.now() + '.' + ext);
      ref.put(file).then(function() {
        return ref.getDownloadURL();
      }).then(function(url) {
        document.getElementById('sol-dj-license-url').value = url;
        statusEl.textContent = 'License uploaded — only you and admins can view it.';
        statusEl.style.color = '#22c55e';
        trackSolEvent('dj_license_uploaded', { uid: user.uid });
      }).catch(function(err) {
        statusEl.textContent = 'Upload failed: ' + err.message;
        statusEl.style.color = '#ff1111';
      });
    });

    // ---------- DJ Availability Calendar ----------
    document.getElementById('sol-dj-block-add').addEventListener('click', function() {
      var date = document.getElementById('sol-dj-block-date').value;
      var user = auth.currentUser;
      if (!date || !user) return;
      db.collection('dj-availability').doc(user.uid).set({
        blockedDates: firebase.firestore.FieldValue.arrayUnion(date)
      }, { merge: true }).then(function() {
        document.getElementById('sol-dj-block-date').value = '';
        trackSolEvent('dj_blocked_date_added', { uid: user.uid, date: date });
        loadBlockedDates(user.uid);
      });
    });

    function loadBlockedDates(uid) {
      db.collection('dj-availability').doc(uid).get().then(function(doc) {
        var box = document.getElementById('sol-dj-blocked-dates');
        box.innerHTML = '';
        if (!doc.exists || !doc.data().blockedDates) return;
        var dates = doc.data().blockedDates;
        dates.sort();
        dates.forEach(function(d) {
          var chip = document.createElement('div');
          chip.style.cssText = 'background:#ff3b30; color:#fff; padding:0.3rem 0.6rem; border-radius:6px; font-size:0.85rem; display:flex; align-items:center; gap:0.3rem;';
          chip.innerHTML = parseLocalDate(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) +
            ' <button type="button" style="background:none;border:none;color:#fff;cursor:pointer;font-size:1rem;" data-unblock="' + d + '">&times;</button>';
          box.appendChild(chip);
        });
        box.querySelectorAll('button[data-unblock]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            db.collection('dj-availability').doc(uid).set({
              blockedDates: firebase.firestore.FieldValue.arrayRemove(btn.getAttribute('data-unblock'))
            }, { merge: true }).then(function() {
              trackSolEvent('dj_blocked_date_removed', { uid: uid, date: btn.getAttribute('data-unblock') });
              loadBlockedDates(uid);
            });
          });
        });
      });
    }

    // ---------- DJ Photo Gallery ----------
    document.getElementById('sol-dj-gallery-file').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      if (!file.type.match('image.*')) {
        document.getElementById('sol-dj-gallery-status').textContent = 'Please select an image file.';
        document.getElementById('sol-dj-gallery-status').style.color = '#ff1111';
        return;
      }
      var user = auth.currentUser;
      if (!user) return;
      var statusEl = document.getElementById('sol-dj-gallery-status');
      statusEl.textContent = 'Uploading...';
      statusEl.style.color = '#ffd860';
      var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
      var path = 'public/' + user.uid + '/dj-galleries/' + Date.now() + '.' + ext;
      var ref = storage.ref(path);
      var upload = ref.put(file);
      upload.on('state_changed', function() {}, function(err) {
        statusEl.textContent = 'Upload failed: ' + err.message;
        statusEl.style.color = '#ff1111';
      }, function() {
        ref.getDownloadURL().then(function(url) {
          db.collection('dj-galleries').doc(user.uid).set({
            photos: firebase.firestore.FieldValue.arrayUnion(url)
          }, { merge: true }).then(function() {
            statusEl.textContent = 'Added.';
            statusEl.style.color = '#22c55e';
            trackSolEvent('dj_gallery_photo_uploaded', { uid: user.uid });
            loadDjGallery(user.uid);
          }).catch(function(err) {
            statusEl.textContent = 'Save failed: ' + err.message;
            statusEl.style.color = '#ff1111';
          });
        }).catch(function(err) {
          statusEl.textContent = 'Upload failed: ' + err.message;
          statusEl.style.color = '#ff1111';
        });
      });
    });

    var djGalleryPhotos = [];
    var djGalleryIndex = 0;
    var djGalleryAutoTimer = null;

    function djGalleryPerPage() {
      return window.innerWidth <= 640 ? 2 : 3;
    }

    function djGalleryUpdate() {
      var track = document.getElementById('sol-dj-gallery-track');
      if (!track) return;
      var perPage = djGalleryPerPage();
      var total = djGalleryPhotos.length;
      var maxStart = Math.max(0, total - perPage);
      if (djGalleryIndex > maxStart) djGalleryIndex = maxStart;
      if (djGalleryIndex < 0) djGalleryIndex = 0;
      track.style.transform = 'translateX(-' + (djGalleryIndex * (100 / perPage)) + '%)';
      track.querySelectorAll('img').forEach(function(img) {
        img.style.flex = '0 0 ' + (100 / perPage) + '%';
        img.style.width = (100 / perPage) + '%';
      });
      var counter = document.getElementById('sol-dj-gallery-counter');
      if (counter) {
        counter.textContent = total === 0 ? '' :
          (djGalleryIndex + 1) + ' \u2013 ' + Math.min(djGalleryIndex + perPage, total) + ' / ' + total;
      }
      document.querySelectorAll('#sol-dj-gallery .sol-gallery-thumb img').forEach(function(t) {
        t.classList.remove('active');
      });
      var active = document.querySelector('#sol-dj-gallery .sol-gallery-thumb img[data-index="' + djGalleryIndex + '"]');
      if (active) active.classList.add('active');
    }

    function djGalleryNav(dir) {
      var maxStart = Math.max(0, djGalleryPhotos.length - djGalleryPerPage());
      djGalleryIndex += dir;
      if (djGalleryIndex > maxStart) djGalleryIndex = 0;
      if (djGalleryIndex < 0) djGalleryIndex = maxStart;
      djGalleryUpdate();
    }

    function djGalleryStopAuto() {
      if (djGalleryAutoTimer) { clearInterval(djGalleryAutoTimer); djGalleryAutoTimer = null; }
    }

    function djGalleryStartAuto() {
      djGalleryStopAuto();
      if (djGalleryPhotos.length <= djGalleryPerPage()) return;
      djGalleryAutoTimer = setInterval(function() { djGalleryNav(1); }, 4000);
    }

    function loadDjGallery(uid) {
      db.collection('dj-galleries').doc(uid).get().then(function(doc) {
        var box = document.getElementById('sol-dj-gallery');
        var track = document.getElementById('sol-dj-gallery-track');
        var carousel = document.getElementById('sol-dj-gallery-carousel');
        if (!box || !track || !carousel) return;

        djGalleryPhotos = (doc.exists && doc.data().photos) || [];
        box.innerHTML = '';
        track.innerHTML = '';
        carousel.style.display = djGalleryPhotos.length ? 'block' : 'none';

        djGalleryPhotos.forEach(function(url, idx) {
          var img = document.createElement('img');
          img.loading = 'lazy';
          img.src = url;
          img.alt = 'Gallery photo ' + (idx + 1);
          img.addEventListener('click', function() {
            var lb = document.getElementById('sol-gallery-lightbox');
            document.getElementById('sol-gallery-lightbox-img').src = url;
            lb.classList.add('active');
          });
          track.appendChild(img);

          var thumb = document.createElement('div');
          thumb.className = 'sol-gallery-thumb';
          thumb.innerHTML = '<img loading="lazy" src="' + escapeAttr(url) + '" data-index="' + idx + '" alt="Thumbnail ' + (idx + 1) + '">' +
            '<button type="button" class="sol-gallery-del" data-del-photo="' + escapeAttr(url) + '" aria-label="Delete photo">&times;</button>';
          thumb.querySelector('img').addEventListener('click', function() {
            djGalleryIndex = idx;
            djGalleryUpdate();
            djGalleryStopAuto();
          });
          box.appendChild(thumb);
        });

        box.querySelectorAll('button[data-del-photo]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            db.collection('dj-galleries').doc(uid).set({
              photos: firebase.firestore.FieldValue.arrayRemove(btn.getAttribute('data-del-photo'))
            }, { merge: true }).then(function() { loadDjGallery(uid); });
          });
        });

        djGalleryUpdate();
        djGalleryStartAuto();
      });
    }

    document.getElementById('sol-dj-gallery-prev').addEventListener('click', function() {
      djGalleryNav(-1);
      djGalleryStopAuto();
    });
    document.getElementById('sol-dj-gallery-next').addEventListener('click', function() {
      djGalleryNav(1);
      djGalleryStopAuto();
    });
    document.getElementById('sol-dj-gallery-carousel').addEventListener('mouseenter', djGalleryStopAuto);
    document.getElementById('sol-dj-gallery-carousel').addEventListener('mouseleave', djGalleryStartAuto);
    document.getElementById('sol-gallery-lightbox').addEventListener('click', function() {
      this.classList.remove('active');
    });
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        document.getElementById('sol-gallery-lightbox').classList.remove('active');
      }
    });
    window.addEventListener('resize', djGalleryUpdate);

    // ---------- DJ Videos (upload or YouTube link) ----------
    function loadDjVideos(uid) {
      db.collection('dj-videos').doc(uid).get().then(function(doc) {
        var box = document.getElementById('sol-dj-videos-list');
        if (!box) return;
        box.innerHTML = '';
        var videos = (doc.exists && doc.data().videos) || [];
        videos.forEach(function(url) {
          var isYT = url.indexOf('youtube') !== -1 || url.indexOf('youtu.be') !== -1;
          var row = document.createElement('div');
          row.style.cssText = 'display:flex; align-items:center; gap:0.5rem; background:#1a1a1a; border:1px solid #333; border-radius:8px; padding:0.5rem 0.75rem;';
          row.innerHTML = '<span style="font-size:1rem;">' + (isYT ? '▶️' : '🎬') + '</span>' +
            '<span style="flex:1; color:#ccc; font-size:0.85rem; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">' + escapeHtml(url) + '</span>' +
            '<button type="button" style="background:none; border:none; color:#ff3b30; cursor:pointer; font-size:1.1rem;" data-del-video="' + escapeAttr(url) + '">&times;</button>';
          box.appendChild(row);
        });
        box.querySelectorAll('button[data-del-video]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            db.collection('dj-videos').doc(uid).set({
              videos: firebase.firestore.FieldValue.arrayRemove(btn.getAttribute('data-del-video'))
            }, { merge: true }).then(function() { loadDjVideos(uid); });
          });
        });
      }).catch(function() {});
    }

    document.getElementById('sol-dj-video-file').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      var statusEl = document.getElementById('sol-dj-video-status');
      if (!file.type.match('video.*')) {
        statusEl.textContent = 'Please select a video file.';
        statusEl.style.color = '#ff1111';
        return;
      }
      if (file.size > 100 * 1024 * 1024) {
        statusEl.textContent = 'Video too large — max 100 MB. For bigger files, upload to YouTube and paste the link.';
        statusEl.style.color = '#ff1111';
        return;
      }
      var user = auth.currentUser;
      if (!user) return;
      statusEl.textContent = 'Uploading video...';
      statusEl.style.color = '#ffd860';
      var ext = (file.name.split('.').pop() || 'mp4').toLowerCase();
      var ref = storage.ref('public/' + user.uid + '/dj-videos/' + Date.now() + '.' + ext);
      var upload = ref.put(file);
      upload.on('state_changed', function(snap) {
        if (snap.totalBytes > 0) {
          statusEl.textContent = 'Uploading video... ' + Math.round(snap.bytesTransferred / snap.totalBytes * 100) + '%';
        }
      }, function(err) {
        statusEl.textContent = 'Upload failed: ' + err.message;
        statusEl.style.color = '#ff1111';
      }, function() {
        ref.getDownloadURL().then(function(url) {
          db.collection('dj-videos').doc(user.uid).set({
            videos: firebase.firestore.FieldValue.arrayUnion(url)
          }, { merge: true }).then(function() {
            statusEl.textContent = 'Video added.';
            statusEl.style.color = '#22c55e';
            e.target.value = '';
            loadDjVideos(user.uid);
          });
        }).catch(function(err) {
          statusEl.textContent = 'Upload failed: ' + err.message;
          statusEl.style.color = '#ff1111';
        });
      });
    });

    document.getElementById('sol-dj-video-add').addEventListener('click', function() {
      var user = auth.currentUser;
      if (!user) return;
      var input = document.getElementById('sol-dj-video-url');
      var statusEl = document.getElementById('sol-dj-video-status');
      var url = input.value.trim();
      if (!url) return;
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;
      if (!/youtube\.com|youtu\.be|vimeo\.com/i.test(url)) {
        statusEl.textContent = 'Please paste a YouTube (or Vimeo) link. Use Upload Video for video files.';
        statusEl.style.color = '#ff1111';
        return;
      }
      db.collection('dj-videos').doc(user.uid).set({
        videos: firebase.firestore.FieldValue.arrayUnion(url)
      }, { merge: true }).then(function() {
        input.value = '';
        statusEl.textContent = 'Video link added.';
        statusEl.style.color = '#22c55e';
        loadDjVideos(user.uid);
      }).catch(function(err) {
        statusEl.textContent = 'Save failed: ' + err.message;
        statusEl.style.color = '#ff1111';
      });
    });

    // ---------- DJ public profile share ----------
    document.getElementById('sol-dj-share-profile').addEventListener('click', function() {
      var user = auth.currentUser;
      if (!user) return;
      var name = document.getElementById('sol-dj-name').textContent || 'DJ';
      var slug = djSlugify(name);
      var url = slug
        ? window.location.origin + '/dj/' + encodeURIComponent(slug)
        : window.location.origin + '/dj.html?uid=' + encodeURIComponent(user.uid);
      if (navigator.share) {
        navigator.share({ title: name + ' — SOL DJ', text: 'Check out my DJ profile on Sounds of Logan!', url: url });
      } else {
        navigator.clipboard.writeText(url).then(function() {
          var btn = document.getElementById('sol-dj-share-profile');
          btn.textContent = '✅ Link Copied!';
          setTimeout(function() { btn.textContent = '🔗 Share My Public Profile'; }, 2000);
        });
      }
    });

    // ---------- DJ Earnings + CSV Export ----------
    var djEarningsBookings = [];
    var djEarningsPeriod = 'month';

    function renderDJEarningsPeriod() {
      var now = new Date();
      var start;
      if (djEarningsPeriod === 'week') start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
      else if (djEarningsPeriod === 'year') start = new Date(now.getFullYear(), 0, 1);
      else start = new Date(now.getFullYear(), now.getMonth(), 1);

      var periodTotal = 0;
      djEarningsBookings.forEach(function(b) {
        var d = new Date(b.date || b.eventDate || 0);
        if (d >= start) periodTotal += Math.round((b.totalAmount || b.total_cost || 0) * 0.85);
      });
      var labelEl = document.getElementById('sol-dj-earnings-period-label');
      var amountEl = document.getElementById('sol-dj-earnings-period-amount');
      if (labelEl) labelEl.textContent = djEarningsPeriod === 'week' ? 'Last 7 Days' : djEarningsPeriod === 'year' ? 'This Year' : 'This Month';
      if (amountEl) amountEl.textContent = '$' + periodTotal.toLocaleString();

      document.querySelectorAll('.sol-earnings-period').forEach(function(btn) {
        btn.style.background = btn.getAttribute('data-period') === djEarningsPeriod ? '#ff1111' : '#333';
      });

      var currentYear = now.getFullYear();
      var monthly = Array.from({ length: 12 }, function() { return 0; });
      djEarningsBookings.forEach(function(b) {
        var d = new Date(b.date || b.eventDate || 0);
        if (d.getFullYear() === currentYear) {
          monthly[d.getMonth()] += Math.round((b.totalAmount || b.total_cost || 0) * 0.85);
        }
      });
      var maxVal = Math.max.apply(null, monthly.concat([1]));
      var monthNames = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      var chartEl = document.getElementById('sol-dj-earnings-chart');
      if (chartEl) {
        chartEl.innerHTML = monthly.map(function(val, i) {
          var h = Math.max(4, Math.round((val / maxVal) * 90));
          return '<div style="flex:1; display:flex; flex-direction:column; align-items:center; justify-content:flex-end; height:100%;">' +
            '<div title="$' + val.toLocaleString() + '" style="width:100%; background:#ff1111; border-radius:3px 3px 0 0; height:' + h + 'px;"></div>' +
            '<span style="font-size:0.6rem; color:#888; margin-top:2px;">' + monthNames[i] + '</span>' +
            '</div>';
        }).join('');
      }
    }

    document.querySelectorAll('.sol-earnings-period').forEach(function(btn) {
      btn.addEventListener('click', function() {
        djEarningsPeriod = btn.getAttribute('data-period');
        renderDJEarningsPeriod();
      });
    });

    function loadDJEarnings(uid) {
      db.collection('bookings').where('djId', '==', uid).where('status', '==', 'completed').get()
        .then(function(snapshot) {
          var total = 0, gigs = 0;
          var rows = [['Date','Event','Client','Amount','Platform Fee','DJ Payout']];
          djEarningsBookings = [];
          snapshot.forEach(function(doc) {
            var b = doc.data();
            djEarningsBookings.push(b);
            var amount = b.totalAmount || b.total_cost || 0;
            total += amount;
            gigs++;
            rows.push([
              b.date || b.eventDate || '',
              b.eventType || b.event_type || '',
              b.clientName || b.client_name || '',
              '$' + amount,
              '$' + Math.round(amount * 0.15),
              '$' + Math.round(amount * 0.85)
            ]);
          });
          document.getElementById('sol-dj-earnings-total').textContent = '$' + Math.round(total * 0.85).toLocaleString();
          document.getElementById('sol-dj-earnings-gigs').textContent = gigs;
          document.getElementById('sol-dj-earnings-fees').textContent = '$' + Math.round(total * 0.15).toLocaleString();

          // Pending vs paid split + per-booking payout status (Uber/Lyft-style breakdown).
          var pendingAmt = 0, paidAmt = 0;
          var listHtml = '';
          djEarningsBookings.forEach(function(b) {
            var amount = Number(b.totalAmount || b.total_cost || 0);
            var djShare = Math.round(amount * 0.85);
            var fee = Math.round(amount * 0.15);
            var paidOut = !!(b.payoutSent || b.finalPayoutSent || b.stripeTransferId);
            if (paidOut) paidAmt += djShare; else pendingAmt += djShare;
            var awaitingSetup = b.payoutStatus === 'awaiting_stripe_setup' || b.payoutStatus === 'awaiting_paypal_setup';
            var pStatus = paidOut ? 'Paid ✓' : (awaitingSetup ? 'Awaiting payout setup' : (b.payoutStatus === 'insufficient_funds' ? 'Payout retrying (funds settling)' : 'Pending'));
            var pColor = paidOut ? '#22c55e' : (awaitingSetup ? '#ff5555' : '#ffd860');
            listHtml += '<div style="background:#0a0a0a; border:1px solid #333; border-radius:8px; padding:0.6rem;">' +
              '<div style="display:flex; justify-content:space-between; font-size:0.8rem;">' +
              '<strong>' + escapeHtml(b.eventType || b.event_type || 'Event') + '</strong>' +
              '<span style="color:' + pColor + '; font-size:0.75rem;">' + pStatus + '</span></div>' +
              '<div style="font-size:0.75rem; color:#888; margin-top:0.2rem;">' + escapeHtml(b.date || b.eventDate || '') + ' · ' + escapeHtml(b.clientName || b.client_name || 'Client') + '</div>' +
              '<div style="display:flex; justify-content:space-between; font-size:0.75rem; color:#aaa; margin-top:0.3rem;">' +
              '<span>Client paid $' + Math.round(amount).toLocaleString() + ' · SOL fee -$' + fee.toLocaleString() + '</span>' +
              '<strong style="color:#22c55e;">$' + djShare.toLocaleString() + '</strong></div></div>';
          });
          var pendEl = document.getElementById('sol-dj-earnings-pending');
          var paidEl = document.getElementById('sol-dj-earnings-paid');
          var listEl = document.getElementById('sol-dj-earnings-list');
          if (pendEl) pendEl.textContent = '$' + Math.round(pendingAmt).toLocaleString();
          if (paidEl) paidEl.textContent = '$' + Math.round(paidAmt).toLocaleString();
          if (listEl) listEl.innerHTML = listHtml || '<p style="color:#666; font-size:0.8rem; margin:0;">No completed gigs yet.</p>';

          renderDJEarningsPeriod();

          document.getElementById('sol-dj-export-csv').onclick = function() {
            var csv = rows.map(function(r) { return r.map(function(c) { return escapeCsvCell(c); }).join(','); }).join('\n');
            var blob = new Blob([csv], { type: 'text/csv' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'dj-earnings.csv';
            a.click();
          };
        });
    }

    // ---------- Automatic Stripe payouts (fires when a gig is marked complete) ----------
    function initDjPayoutSetup(user) {
      var statusEl = document.getElementById('sol-dj-payout-status');
      var btnEl = document.getElementById('sol-dj-stripe-connect');
      if (!statusEl) return;

      function renderPayoutStatus(d) {
        var acct = (d.stripeAccountId || '').trim();
        if (acct && d.stripePayoutsEnabled) {
          statusEl.innerHTML = '<span style="color:#22c55e;">✓ Automatic payouts active — Stripe connected</span>';
          if (btnEl) btnEl.style.display = 'none';
        } else if (acct) {
          statusEl.innerHTML = '<span style="color:#ffd860;">Stripe account created — finish the setup to get paid automatically.</span>';
          if (btnEl) { btnEl.style.display = 'inline-block'; btnEl.textContent = 'Finish Stripe Setup'; }
        } else {
          statusEl.innerHTML = '<span style="color:#ffd860;">Connect Stripe to get paid automatically after each gig.</span>';
          if (btnEl) { btnEl.style.display = 'inline-block'; btnEl.textContent = 'Connect Stripe'; }
        }
      }

      function refreshStatus() {
        db.collection('djs').doc(user.uid).get()
          .then(function(doc) { renderPayoutStatus(doc.exists ? doc.data() : {}); })
          .catch(function() { statusEl.textContent = 'Automatic payouts: status unavailable.'; });
      }

      // Returning from Stripe hosted onboarding — sync the account status first.
      if (/[?&]stripe=(return|refresh)/.test(location.search)) {
        statusEl.innerHTML = '<span style="color:#888;">Checking Stripe setup…</span>';
        firebase.functions().httpsCallable('getDjStripeStatus')({})
            .then(refreshStatus)
            .catch(refreshStatus);
      } else {
        refreshStatus();
      }

      if (btnEl && !btnEl.dataset.bound) {
        btnEl.dataset.bound = '1';
        btnEl.addEventListener('click', function() {
          btnEl.disabled = true;
          btnEl.textContent = 'Connecting…';
          firebase.functions().httpsCallable('createDjConnectAccount')({})
            .then(function(res) {
              if (res.data && res.data.url) {
                window.location.href = res.data.url;
              } else {
                btnEl.disabled = false;
                refreshStatus();
              }
            })
            .catch(function(err) {
              btnEl.disabled = false;
              btnEl.textContent = 'Connect Stripe';
              statusEl.innerHTML = '<span style="color:#ff5555;">' + escapeHtml(err.message || 'Stripe setup failed.') + '</span>';
            });
        });
      }
    }

    // ---------- DJ Custom Gigs (public/private events on schedule + profile) ----------
    function subscribeDJGigs(uid) {
      db.collection('dj-events').doc(uid).onSnapshot(function(doc) {
        var events = doc.exists ? (doc.data().events || []) : [];
        var listEl = document.getElementById('sol-dj-gigs-list');
        if (!listEl) return;
        listEl.innerHTML = '';
        if (events.length === 0) {
          listEl.innerHTML = '<p style="color:#888; text-align:center;">No upcoming gigs posted yet.</p>';
          return;
        }
        events.slice().sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); }).forEach(function(ev) {
          var card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:10px; padding:0.75rem 1rem;';
          card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:flex-start;">' +
            '<div>' +
            '<strong>' + escapeHtml(ev.title || 'Event') + '</strong> ' +
            '<span style="font-size:0.75rem; color:' + (ev.isPublic ? '#22c55e' : '#888') + ';">' + (ev.isPublic ? 'PUBLIC' : 'PRIVATE') + '</span>' +
            '<div style="color:#aaa; font-size:0.85rem; margin-top:0.25rem;">📍 ' + escapeHtml(ev.venue || '') + '</div>' +
            '<div style="color:#aaa; font-size:0.85rem;">📅 ' + escapeHtml(ev.date || '') + (ev.startTime ? ' ' + escapeHtml(ev.startTime) + (ev.endTime ? '–' + escapeHtml(ev.endTime) : '') : '') + '</div>' +
            '</div>' +
            '<button type="button" style="background:none; border:none; color:#ff3b30; cursor:pointer; font-size:1.1rem;" data-del-gig="' + escapeAttr(ev.id) + '">&times;</button>' +
            '</div>';
          listEl.appendChild(card);
        });
        listEl.querySelectorAll('button[data-del-gig]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            db.collection('dj-events').doc(uid).set({
              events: events.filter(function(e) { return e.id !== btn.getAttribute('data-del-gig'); })
            }).then(function() { subscribeDJGigs(uid); });
          });
        });
      }, function(err) {
        console.error('DJ gigs listener error:', err);
      });
    }

    var solGigAddBtn = document.getElementById('sol-gig-add');
    if (solGigAddBtn) {
      solGigAddBtn.addEventListener('click', function() {
        var user = auth.currentUser;
        if (!user) return;
        var title = document.getElementById('sol-gig-title').value.trim();
        var venue = document.getElementById('sol-gig-venue').value.trim();
        var date = document.getElementById('sol-gig-date').value;
        var startTime = document.getElementById('sol-gig-start').value;
        var endTime = document.getElementById('sol-gig-end').value;
        var isPublic = document.getElementById('sol-gig-public').checked;
        if (!title || !date) {
          alert('Please enter at least a title and date.');
          return;
        }
        var event = {
          id: 'gig_' + Date.now(),
          title: title,
          venue: venue,
          date: date,
          startTime: startTime,
          endTime: endTime,
          isPublic: isPublic
        };
        var ref = db.collection('dj-events').doc(user.uid);
        ref.get().then(function(doc) {
          var events = doc.exists ? (doc.data().events || []) : [];
          events.push(event);
          return ref.set({ events: events }, { merge: true });
        }).then(function() {
          document.getElementById('sol-gig-title').value = '';
          document.getElementById('sol-gig-venue').value = '';
          document.getElementById('sol-gig-date').value = '';
          document.getElementById('sol-gig-start').value = '';
          document.getElementById('sol-gig-end').value = '';
          trackSolEvent('dj_gig_posted', { uid: user.uid, is_public: isPublic });
        }).catch(function(err) {
          alert('Could not save gig: ' + err.message);
        });
      });
    }

    // ---------- DJ Waitlist ----------
    function loadDJWaitlist(uid) {
      db.collection('waitlist').where('djId', '==', uid).where('status', '==', 'waiting').get()
        .then(function(snapshot) {
          var box = document.getElementById('sol-dj-waitlist');
          box.innerHTML = '';
          if (snapshot.empty) { box.innerHTML = '<p style="color:#888;">No waitlist entries.</p>'; return; }
          snapshot.forEach(function(doc) {
            var w = doc.data();
            var card = document.createElement('div');
            card.style.cssText = 'background:#111; border:1px solid #ffd860; border-radius:8px; padding:0.75rem; display:flex; justify-content:space-between; align-items:center;';
            card.innerHTML = '<span><strong>' + escapeHtml(w.clientName || 'Client') + '</strong><br><span style="font-size:0.8rem; color:#aaa;">' + escapeHtml(w.eventType || 'Event') + ' — ' + escapeHtml(w.date || 'TBD') + '</span></span>' +
              '<button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:#22c55e;" data-waitlist-accept="' + escapeAttr(doc.id) + '">Accept</button>';
            box.appendChild(card);
          });
          box.querySelectorAll('button[data-waitlist-accept]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              db.collection('waitlist').doc(btn.getAttribute('data-waitlist-accept')).set({
                status: 'accepted',
                acceptedAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true }).then(function() { loadDJWaitlist(uid); });
            });
          });
        });
    }

    let djBookingsUnsubscribe = null;
    let knownBookingIds = new Set();

    function subscribeDJBookings(user) {
      if (djBookingsUnsubscribe) djBookingsUnsubscribe();
      djBookingsUnsubscribe = db.collection('bookings')
        .where('djId', '==', user.uid)
        .onSnapshot(function(snapshot) {
          // Check for new pending bookings to notify
          snapshot.docChanges().forEach(function(change) {
            if (change.type === 'added') {
              var b = change.doc.data();
              if (b.status === 'pending' && !knownBookingIds.has(change.doc.id)) {
                knownBookingIds.add(change.doc.id);
                if ('Notification' in window && Notification.permission === 'granted') {
                  var clientName = b.clientName || b.client_name || 'A client';
                  var eventType = b.eventType || b.event_type || 'an event';
                  new Notification('New Booking Request!', {
                    body: clientName + ' requested you for ' + eventType,
                    icon: '/favicon-192x192.png',
                    tag: 'booking-' + change.doc.id,
                    data: { url: '/sol.html' }
                  });
                }
              } else {
                knownBookingIds.add(change.doc.id);
              }
            }
          });
          renderDJBookings(snapshot, user);
        }, function(err) {
          console.error('DJ bookings listener error:', err);
        });
    }

    function renderDJBookings(snapshot, user) {
      const bookings = [];
      snapshot.forEach(function(doc) {
        bookings.push({ id: doc.id, ...doc.data() });
      });

      const pending = bookings.filter(function(b) { return b.status === 'pending'; });
      const confirmed = bookings.filter(function(b) { return b.status === 'confirmed'; });
      const completed = bookings.filter(function(b) { return b.status === 'completed'; });

      const now = new Date();
      const upcoming = confirmed.filter(function(b) {
        try {
          const d = parseLocalDate(b.date || b.eventDate);
          d.setHours(23, 59, 59);
          return d >= now;
        } catch { return false; }
      }).sort(function(a, b) {
        return (parseLocalTimestamp(a.date || a.eventDate) || 0) - (parseLocalTimestamp(b.date || b.eventDate) || 0);
      });

      const earnings = completed.reduce(function(sum, b) {
        return sum + (b.djEarnings || (b.totalAmount || b.total_cost || 0) * 0.85);
      }, 0);

      document.getElementById('sol-dj-stat-pending').textContent = pending.length;
      document.getElementById('sol-dj-stat-upcoming').textContent = upcoming.length;
      document.getElementById('sol-dj-stat-earnings').textContent = '$' + Math.round(earnings).toLocaleString();

      const requestsBox = document.getElementById('sol-dj-booking-requests');
      requestsBox.innerHTML = '';
      if (pending.length === 0) {
        requestsBox.innerHTML = '<p style="color:#888; text-align:center;">No pending booking requests</p>';
      } else {
        pending.forEach(function(b) {
          const card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem;';
          const clientName = b.clientName || b.client_name || 'Client';
          const eventType = b.eventType || b.event_type || 'Event';
          const date = b.date || b.eventDate || '';
          const startTime = b.startTime || b.event_time || '';
          const location = (b.locationData && b.locationData.address) || b.location || b.event_location || '';
          const amount = b.totalAmount || b.total_cost || 0;
          const special = b.specialRequests || b.special_requests || '';

          card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
            '<strong>' + escapeHtml(clientName) + '</strong>' +
            '<span style="background:#ff1111; color:#fff; padding:0.15rem 0.5rem; border-radius:8px; font-size:0.75rem;">NEW</span>' +
            '</div>' +
            '<div style="color:#ccc; font-size:0.9rem; line-height:1.6;">' +
            '<div>📅 ' + (date ? parseLocalDate(date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) : 'TBD') + (startTime ? ' at ' + escapeHtml(startTime) : '') + '</div>' +
            '<div>🎉 ' + escapeHtml(eventType) + '</div>' +
            (location ? '<div>📍 ' + escapeHtml(location) + '</div>' : '') +
            '<div>💰 $' + Number(amount).toLocaleString() + '</div>' +
            (special ? '<div style="margin-top:0.5rem; color:#ffd860;">📝 ' + escapeHtml(special).replace(/\n/g, '<br>') + '</div>' : '') +
            '</div>' +
            '<div style="display:flex; gap:0.5rem; margin-top:0.75rem;">' +
            '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-action="reject" data-booking-id="' + escapeAttr(b.id) + '">Reject</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#9333ea;" data-counter-offer="' + escapeAttr(b.id) + '" data-amount="' + amount + '" data-duration="' + (b.duration || b.event_duration || 4) + '" data-client="' + escapeAttr(clientName) + '" data-event="' + escapeAttr(eventType) + '">Counter</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#22c55e;" data-action="accept" data-booking-id="' + escapeAttr(b.id) + '">Accept</button>' +
            '</div>';

          requestsBox.appendChild(card);
        });

        requestsBox.querySelectorAll('button[data-action]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            const action = btn.getAttribute('data-action');
            const bookingId = btn.getAttribute('data-booking-id');
            handleBookingAction(bookingId, action, user);
          });
        });

        requestsBox.querySelectorAll('button[data-counter-offer]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            openCounterOffer(
              btn.getAttribute('data-counter-offer'),
              parseFloat(btn.getAttribute('data-amount')) || 0,
              parseFloat(btn.getAttribute('data-duration')) || 4,
              btn.getAttribute('data-client') || 'Client',
              btn.getAttribute('data-event') || 'Event'
            );
          });
        });
      }

      const upcomingBox = document.getElementById('sol-dj-upcoming-events');
      upcomingBox.innerHTML = '';
      if (upcoming.length === 0) {
        upcomingBox.innerHTML = '<p style="color:#888; text-align:center;">No upcoming events</p>';
      } else {
        upcoming.forEach(function(b) {
          const card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem;';
          const clientName = b.clientName || b.client_name || 'Client';
          const eventType = b.eventType || b.event_type || 'Event';
          const date = b.date || b.eventDate || '';
          const startTime = b.startTime || b.event_time || '';
          var locData = b.locationData || b.event_location || {};
          if (typeof locData === 'string') locData = { address: locData };
          const location = locData.address || b.location || b.event_location || '';
          var evtLat = locData.latitude || (locData.location && locData.location.latitude) || null;
          var evtLng = locData.longitude || (locData.location && locData.location.longitude) || null;
          const amount = b.totalAmount || b.total_cost || 0;
          const special = b.specialRequests || b.special_requests || '';
          const clientEmail = b.clientEmail || b.client_email || '';
          const clientPhone = b.clientPhone || b.client_phone || '';
          const duration = b.duration || b.event_duration || '';
          const equipment = b.equipment || b.equipmentList || '';
          var eqStr = '';
          if (equipment && typeof equipment === 'object') {
            var parts = [];
            for (var k in equipment) { if (equipment[k]) parts.push(k); }
            eqStr = parts.join(', ');
          } else if (equipment) {
            eqStr = String(equipment);
          }
          var arrived = b.djArrived === true;
          var arrivalStatus = b.arrivalStatus || '';
          var hasCoords = evtLat !== null && evtLng !== null;

          var countdownId = 'sol-countdown-' + b.id;
          var detailsId = 'sol-details-' + b.id;

          card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:start; margin-bottom:0.5rem;">' +
            '<div><strong>' + escapeHtml(eventType) + '</strong><br><span style="color:#aaa; font-size:0.85rem;">' + escapeHtml(clientName) + '</span></div>' +
            '<div style="text-align:right; color:#aaa; font-size:0.85rem;">' + (date ? parseLocalDate(date).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : '') + (startTime ? '<br>' + escapeHtml(startTime) : '') + '</div>' +
            '</div>' +
            '<div id="' + escapeAttr(countdownId) + '" style="background:#1a1a1a; border-radius:8px; padding:0.5rem 0.75rem; margin-bottom:0.5rem; text-align:center; font-size:0.9rem; color:#ff5555; font-weight:600;"></div>' +
            (location ? '<div style="color:#ccc; font-size:0.9rem;">📍 ' + escapeHtml(location) + '</div>' : '') +
            '<div style="color:#22c55e; font-size:0.9rem; margin-top:0.25rem;">💰 $' + Number(amount).toLocaleString() + '</div>' +
            (arrived ? '<div style="color:#22c55e; font-size:0.85rem; margin-top:0.5rem;">✅ Arrived' + (arrivalStatus ? ' — ' + escapeHtml(arrivalStatus) : '') + '</div>' : '') +
            '<div style="display:flex; gap:0.5rem; margin-top:0.75rem; flex-wrap:wrap;">' +
            (arrived ? '' : '<button type="button" class="submit-btn" style="flex:1; background:#ff5555; color:#000;" data-im-here="' + escapeAttr(b.id) + '">I\'m Here</button>') +
            (hasCoords ? '<button type="button" class="submit-btn" style="flex:1; background:#ff1111;" data-show-map="' + escapeAttr(b.id) + '" data-lat="' + evtLat + '" data-lng="' + evtLng + '" data-addr="' + escapeAttr(location || '') + '">Show on Map</button>' : '') +
            '<button type="button" class="submit-btn" style="flex:1; background:#333;" data-expand="' + escapeAttr(detailsId) + '">Details</button>' +
            '</div>' +
            '<div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">' +
            '<button type="button" class="submit-btn" style="flex:1; background:#1a1a1a; border:1px solid #ff5555; color:#ff5555;" data-track-status="' + escapeAttr(b.id) + '">📊 Track Status</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#1a1a1a; border:1px solid #9333ea; color:#c084fc;" data-song-suggestions="' + escapeAttr(b.id) + '" data-dj-id="' + escapeAttr(user.uid) + '" data-dj-name="' + escapeAttr(b.djName || user.displayName || user.email || 'DJ') + '" data-event-type="' + escapeAttr(eventType) + '">🎵 Song Suggestions</button>' +
            '</div>' +
            '<div id="' + escapeAttr(detailsId) + '" style="display:none; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid #333; color:#ccc; font-size:0.85rem; line-height:1.8;">' +
            (duration ? '<div>⏱️ Duration: ' + escapeHtml(duration) + ' hrs</div>' : '') +
            (clientEmail ? '<div>📧 <a href="mailto:' + escapeAttr(clientEmail) + '" style="color:#ff5555;">' + escapeHtml(clientEmail) + '</a></div>' : '') +
            (clientPhone ? '<div>📱 <a href="tel:' + escapeAttr(clientPhone) + '" style="color:#ff5555;">' + escapeHtml(clientPhone) + '</a></div>' : '') +
            (eqStr ? '<div>🎛️ Equipment: ' + escapeHtml(eqStr) + '</div>' : '') +
            (special ? '<div style="color:#ffd860;">📝 ' + escapeHtml(special).replace(/\n/g, '<br>') + '</div>' : '') +
            '</div>';

          upcomingBox.appendChild(card);

          (function(bId, dateStr, timeStr) {
            var el = document.getElementById('sol-countdown-' + bId);
            if (!el || !dateStr) return;
            function tick() {
              var target = parseLocalDate(dateStr);
              if (timeStr) {
                var parts = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
                if (parts) {
                  var h = parseInt(parts[1]);
                  var m = parseInt(parts[2]);
                  if (parts[3] && parts[3].toUpperCase() === 'PM' && h < 12) h += 12;
                  if (parts[3] && parts[3].toUpperCase() === 'AM' && h === 12) h = 0;
                  target.setHours(h, m, 0, 0);
                }
              } else {
                target.setHours(20, 0, 0, 0);
              }
              var diff = target.getTime() - Date.now();
              if (diff <= 0) {
                el.textContent = 'Event time!';
                el.style.color = '#22c55e';
                return;
              }
              var days = Math.floor(diff / 86400000);
              var hrs = Math.floor((diff % 86400000) / 3600000);
              var mins = Math.floor((diff % 3600000) / 60000);
              var secs = Math.floor((diff % 60000) / 1000);
              if (days > 0) el.textContent = 'Starts in ' + days + 'd ' + hrs + 'h ' + mins + 'm';
              else if (hrs > 0) el.textContent = 'Starts in ' + hrs + 'h ' + mins + 'm ' + secs + 's';
              else el.textContent = 'Starts in ' + mins + 'm ' + secs + 's';

              if (diff <= 20 * 60 * 1000 && diff > 0) {
                el.style.color = '#ffd860';
                el.style.background = '#ffd86022';
                if (!autoShareTriggered.has(bId)) {
                  autoShareTriggered.add(bId);
                  autoStartLocationShare();
                }
              }

              setTimeout(tick, 1000);
            }
            tick();
          })(b.id, date, startTime);
        });

        upcomingBox.querySelectorAll('button[data-show-map]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var lat = parseFloat(btn.getAttribute('data-lat'));
            var lng = parseFloat(btn.getAttribute('data-lng'));
            var addr = btn.getAttribute('data-addr') || 'Event location';
            showEventOnDJMap(lat, lng, addr);
          });
        });

        upcomingBox.querySelectorAll('button[data-im-here]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var bookingId = btn.getAttribute('data-im-here');
            db.collection('bookings').doc(bookingId).set({
              djArrived: true,
              arrivalStatus: 'On site',
              arrivedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(function() {
              btn.textContent = 'Arrived!';
              btn.style.background = '#22c55e';
              btn.disabled = true;
              djConsoleStatus.textContent = 'Arrival marked! Client notified.';
              djConsoleStatus.style.color = '#22c55e';
              setTimeout(function() { djConsoleStatus.textContent = ''; }, 3000);
            }).catch(function(err) {
              djConsoleStatus.textContent = 'Error: ' + err.message;
              djConsoleStatus.style.color = '#ff1111';
            });
          });
        });

        upcomingBox.querySelectorAll('button[data-expand]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var details = document.getElementById(btn.getAttribute('data-expand'));
            if (details) {
              details.style.display = details.style.display === 'none' ? 'block' : 'none';
              btn.textContent = details.style.display === 'none' ? 'Details' : 'Hide';
            }
          });
        });

        upcomingBox.querySelectorAll('button[data-track-status]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            openBookingStatusTracker(btn.getAttribute('data-track-status'));
          });
        });

        upcomingBox.querySelectorAll('button[data-song-suggestions]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            openSongSuggestions(
              btn.getAttribute('data-song-suggestions'),
              btn.getAttribute('data-dj-id'),
              btn.getAttribute('data-dj-name'),
              btn.getAttribute('data-event-type')
            );
          });
        });
      }

      var autoCompleted = 0;
      confirmed.forEach(function(b) {
        try {
          var d = parseLocalDate(b.date || b.eventDate);
          d.setHours(23, 59, 59);
          if (d < now) {
            db.collection('bookings').doc(b.id).set({
              status: 'completed',
              completedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
            autoCompleted++;
          }
        } catch(e) {}
      });
      if (autoCompleted > 0) {
        console.log('[DJ] Auto-completed ' + autoCompleted + ' past events');
      }
    }

    function handleBookingAction(bookingId, action, user) {
      const newStatus = action === 'accept' ? 'confirmed' : 'cancelled';
      const bookingRef = db.collection('bookings').doc(bookingId);
      var updateData = { status: newStatus, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), djId: user.uid };
      if (action === 'accept') {
        bookingRef.get().then(function(doc) {
          if (doc.exists) {
            var b = doc.data();
            var created = b.createdAt || b.created_at;
            if (created && created.toMillis) {
              updateData.responseTimeMs = Date.now() - created.toMillis();
            }
          }
          // Identity reveal: acceptance is the moment the client learns
          // which DJ took the booking — attach the approved profile fields.
          db.collection('djs').doc(user.uid).get().then(function(djDoc) {
            var d = djDoc.exists ? (djDoc.data() || {}) : {};
            updateData.djName = d.stageName || d.displayName || d.name || user.displayName || 'DJ';
            updateData.djAvatar = d.photoURL || d.avatar || '';
            updateData.djEmail = user.email || '';
            bookingRef.set(updateData, { merge: true })
            .then(function() {
              djConsoleStatus.textContent = 'Booking accepted! Client notified.';
              djConsoleStatus.style.color = '#22c55e';
              setTimeout(function() { djConsoleStatus.textContent = ''; }, 3000);
            })
            .catch(function(err) {
              djConsoleStatus.textContent = 'Failed: ' + err.message;
              djConsoleStatus.style.color = '#ff1111';
            });
          }).catch(function() {
            // Profile lookup failed — still accept with auth-profile identity
            updateData.djName = updateData.djName || user.displayName || 'DJ';
            bookingRef.set(updateData, { merge: true }).catch(function() {});
          });
        });
      } else {
        bookingRef.set(updateData, { merge: true })
          .then(function() {
            djConsoleStatus.textContent = 'Booking rejected.';
            djConsoleStatus.style.color = '#ff1111';
            setTimeout(function() { djConsoleStatus.textContent = ''; }, 3000);
          })
          .catch(function(err) {
            djConsoleStatus.textContent = 'Failed: ' + err.message;
            djConsoleStatus.style.color = '#ff1111';
          });
      }
    }

    function updateOnlineToggleUI(online) {
      djOnlineToggle.checked = online;
      djToggleTrack.style.background = online ? '#22c55e' : '#444';
      djToggleKnob.style.transform = online ? 'translateX(24px)' : 'translateX(0)';
      djStatusLabel.innerHTML = 'You are <strong>' + (online ? 'Online' : 'Offline') + '</strong>';
    }

    djOnlineToggle.addEventListener('change', function() {
      const user = auth.currentUser;
      if (!user) return;
      const online = djOnlineToggle.checked;
      updateOnlineToggleUI(online);
      trackSolEvent('dj_online_toggled', { online: online, uid: user.uid });
      const statusRef = db.collection('dj-status').doc(user.uid);
      statusRef.set({
        isOnline: online,
        isVerified: isVerifiedDJ,
        lastUpdated: firebase.firestore.FieldValue.serverTimestamp(),
        djId: user.uid,
        // dj-status must never carry identity — scrub legacy fields.
        djName: firebase.firestore.FieldValue.delete(),
        djAvatar: firebase.firestore.FieldValue.delete()
      }, { merge: true }).catch(function(err) {
        djConsoleStatus.textContent = 'Failed to update status: ' + err.message;
        djConsoleStatus.style.color = '#ff1111';
      });
    });

    // DJ live location tracking
    let djLocWatchId = null;
    let djWakeLock = null;
    const djShareLocBtn = document.getElementById('sol-dj-share-loc');
    const djLocStatus = document.getElementById('sol-dj-loc-status');

    // Keep the searchable DJ location (djs/{uid}.location) in sync with live
    // GPS — publicSearchDjs reads djs, not dj-status. Throttled to the first
    // fix plus moves of ~2km+ so watchPosition ticks don't spam writes.
    var lastSearchLoc = null;
    function maybeUpdateDjSearchLocation(lat, lng) {
      if (!auth.currentUser) return;
      if (lastSearchLoc &&
          Math.abs(lastSearchLoc.lat - lat) < 0.02 &&
          Math.abs(lastSearchLoc.lng - lng) < 0.02) return;
      lastSearchLoc = { lat: lat, lng: lng };
      db.collection('djs').doc(auth.currentUser.uid).set({
        location: { latitude: lat, longitude: lng }
      }, { merge: true }).catch(function() {});
    }

    djShareLocBtn.addEventListener('click', function() {
      if (djLocWatchId !== null) {
        navigator.geolocation.clearWatch(djLocWatchId);
        djLocWatchId = null;
        if (djWakeLock) { djWakeLock.release().catch(function() {}); djWakeLock = null; }
        djShareLocBtn.textContent = 'Start';
        djShareLocBtn.style.background = '#333';
        djLocStatus.textContent = 'Stopped';
        djLocStatus.style.color = '#888';
        trackSolEvent('dj_location_sharing_stopped', { uid: auth.currentUser ? auth.currentUser.uid : '' });
        if (auth.currentUser) {
          db.collection('dj-status').doc(auth.currentUser.uid).set({
            sharingLocation: false
          }, { merge: true });
          db.collection('bookings').where('djId', '==', auth.currentUser.uid)
            .where('djSharingLocation', '==', true).get().then(function(snap) {
              snap.forEach(function(doc) {
                doc.ref.set({ djSharingLocation: false }, { merge: true });
              });
            }).catch(function() {});
        }
        return;
      }
      if (!navigator.geolocation) {
        djLocStatus.textContent = 'Geolocation not supported on this device';
        djLocStatus.style.color = '#ff1111';
        return;
      }
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        djLocStatus.textContent = 'HTTPS required for location';
        djLocStatus.style.color = '#ff1111';
        return;
      }
      if (!confirm('This will share your approximate live location with clients and the map. Continue?')) {
        djLocStatus.textContent = 'Location sharing cancelled.';
        djLocStatus.style.color = '#ff1111';
        return;
      }
      djShareLocBtn.textContent = 'Stop';
      djShareLocBtn.style.background = '#ff3b30';
      djLocStatus.textContent = 'Getting location...';
      djLocStatus.style.color = '#ffd860';
      trackSolEvent('dj_location_sharing_started', { uid: auth.currentUser ? auth.currentUser.uid : '' });
      var instructions = document.getElementById('sol-dj-loc-instructions');
      if (instructions) instructions.style.display = 'none';
      if ('wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(function(lock) {
          if (djWakeLock) { djWakeLock.release().catch(function() {}); }
          djWakeLock = lock;
        }).catch(function() {});
      }

      function onPos(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        djLocStatus.textContent = 'Live (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
        djLocStatus.style.color = '#22c55e';
        var instructions = document.getElementById('sol-dj-loc-instructions');
        if (instructions) instructions.style.display = 'none';
        if (auth.currentUser) {
          db.collection('dj-status').doc(auth.currentUser.uid).set({
            sharingLocation: true,
            location: {
              latitude: lat,
              longitude: lng,
              accuracy: pos.coords.accuracy,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
          }, { merge: true });
          maybeUpdateDjSearchLocation(lat, lng);
          // Mark confirmed bookings as sharing
          db.collection('bookings').where('djId', '==', auth.currentUser.uid)
            .where('status', '==', 'confirmed').get().then(function(snap) {
              snap.forEach(function(doc) {
                doc.ref.set({ djSharingLocation: true }, { merge: true });
              });
            }).catch(function() {});
        }
      }

      function onErr(err, isRetry) {
        var msg = 'Error: ' + err.message;
        if (err.code === 1) {
          var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          var isAndroid = /Android/.test(navigator.userAgent);
          if (isIOS) {
            msg = 'Permission denied. iPhone: Settings → Safari → Location → Allow. Then reload.';
          } else if (isAndroid) {
            msg = 'Permission denied. Android: Chrome ⋮ → Settings → Site settings → Location → Allow. Then reload.';
          } else {
            msg = 'Permission denied. Enable location in your browser/site settings, then reload.';
          }
        }
        else if (err.code === 2) msg = 'Location unavailable. Check your GPS/network.';
        else if (err.code === 3) msg = 'Location request timed out. Try again.';

        if (!isRetry && (err.code === 2 || err.code === 3)) {
          djLocStatus.textContent = 'Retrying with lower accuracy...';
          djLocStatus.style.color = '#ffd860';
          navigator.geolocation.getCurrentPosition(function(pos) {
            onPos(pos);
            djLocWatchId = navigator.geolocation.watchPosition(onPos, function(e2) {
              onErr(e2, true);
            }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 });
          }, function(e2) {
            onErr(e2, true);
          }, { enableHighAccuracy: false, maximumAge: 60000, timeout: 30000 });
          return;
        }

        var instructions = document.getElementById('sol-dj-loc-instructions');
        if (instructions) instructions.style.display = 'none';
        if (err.code === 1) {
          djLocStatus.textContent = 'Permission denied';
          if (instructions) {
            var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
            var isAndroid = /Android/.test(navigator.userAgent);
            var steps = 'Enable location in your browser or site settings, then reload.';
            if (isIOS) steps = 'iPhone: tap aA in the address bar → Website Settings → Location → Allow. Then reload. If not, go to Settings → Safari → Location → Allow.';
            else if (isAndroid) steps = 'Android: Chrome ⋮ → Settings → Site settings → Location → Allow. Then reload.';
            instructions.innerHTML = steps;
            instructions.style.display = 'block';
          }
        } else {
          djLocStatus.textContent = msg;
        }
        djLocStatus.style.color = '#ff1111';
        djShareLocBtn.textContent = 'Start';
        djShareLocBtn.style.background = '#333';
        if (djWakeLock) { djWakeLock.release().catch(function() {}); djWakeLock = null; }
        if (djLocWatchId !== null) {
          navigator.geolocation.clearWatch(djLocWatchId);
          djLocWatchId = null;
        }
      }

      navigator.geolocation.getCurrentPosition(function(pos) {
        onPos(pos);
        djLocWatchId = navigator.geolocation.watchPosition(onPos, function(err) {
          onErr(err, false);
        }, { enableHighAccuracy: false, maximumAge: 0, timeout: 15000 });
      }, function(err) {
        onErr(err, false);
      }, { enableHighAccuracy: false, maximumAge: 0, timeout: 15000 });
    });

    document.addEventListener('visibilitychange', function() {
      if (document.visibilityState === 'visible' && djLocWatchId !== null && 'wakeLock' in navigator) {
        navigator.wakeLock.request('screen').then(function(lock) {
          if (djWakeLock) { djWakeLock.release().catch(function() {}); }
          djWakeLock = lock;
        }).catch(function() {});
      }
    });

    // Manual location fallback
    document.getElementById('sol-dj-set-location').addEventListener('click', function() {
      var user = auth.currentUser;
      if (!user) return;
      var input = document.getElementById('sol-dj-manual-address');
      var address = input.value.trim();
      if (!address) return;
      djLocStatus.textContent = 'Finding location...';
      djLocStatus.style.color = '#ffd860';
      var url = 'https://nominatim.openstreetmap.org/search?format=json&limit=1&q=' + encodeURIComponent(address);
      fetch(url, { headers: { 'Accept-Language': 'en' } })
        .then(function(r) { return r.json(); })
        .then(function(data) {
          if (!data || data.length === 0) {
            djLocStatus.textContent = 'Address not found.';
            djLocStatus.style.color = '#ff1111';
            return;
          }
          var lat = parseFloat(data[0].lat);
          var lon = parseFloat(data[0].lon);
          db.collection('dj-status').doc(user.uid).set({
            sharingLocation: true,
            location: { latitude: lat, longitude: lon, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }
          }, { merge: true });
          db.collection('djs').doc(user.uid).set({
            location: { latitude: lat, longitude: lon, address: address }
          }, { merge: true });
          djLocStatus.textContent = 'Manual: ' + lat.toFixed(4) + ', ' + lon.toFixed(4);
          djLocStatus.style.color = '#22c55e';
        })
        .catch(function() {
          djLocStatus.textContent = 'Location lookup failed.';
          djLocStatus.style.color = '#ff1111';
        });
    });

    // ---------- Auto-share location 20 min before gig ----------
    const autoShareTriggered = new Set();
    let djEventMap = null;
    let djEventMarker = null;
    let djLiveMarker = null;

    function autoStartLocationShare() {
      if (djLocWatchId !== null) return;
      if (!navigator.geolocation) return;
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') return;

      djShareLocBtn.textContent = 'Stop';
      djShareLocBtn.style.background = '#ff3b30';
      djLocStatus.textContent = 'Auto-sharing (gig starting soon)';
      djLocStatus.style.color = '#ffd860';

      function onAutoPos(pos) {
        var lat = pos.coords.latitude;
        var lng = pos.coords.longitude;
        djLocStatus.textContent = 'Live (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
        djLocStatus.style.color = '#22c55e';
        if (auth.currentUser) {
          db.collection('dj-status').doc(auth.currentUser.uid).set({
            sharingLocation: true,
            isOnline: true,
            autoShared: true,
            location: {
              latitude: lat,
              longitude: lng,
              accuracy: pos.coords.accuracy,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }
          }, { merge: true });
          maybeUpdateDjSearchLocation(lat, lng);
        }
      }

      function onAutoErr(err) {
        djLocStatus.textContent = 'Auto-share error: ' + err.message;
        djLocStatus.style.color = '#ff1111';
      }

      navigator.geolocation.getCurrentPosition(function(pos) {
        onAutoPos(pos);
        djLocWatchId = navigator.geolocation.watchPosition(onAutoPos, onAutoErr, {
          enableHighAccuracy: false, maximumAge: 10000, timeout: 20000
        });
        // Mark all confirmed bookings for this DJ as sharing location
        if (auth.currentUser) {
          db.collection('bookings').where('djId', '==', auth.currentUser.uid)
            .where('status', '==', 'confirmed').get().then(function(snap) {
              snap.forEach(function(doc) {
                doc.ref.set({ djSharingLocation: true }, { merge: true });
              });
            }).catch(function() {});
        }
      }, onAutoErr, { enableHighAccuracy: false, maximumAge: 10000, timeout: 20000 });
    }

    function showEventOnDJMap(lat, lng, address) {
      var section = document.getElementById('sol-dj-event-map-section');
      var mapContainer = document.getElementById('sol-dj-event-map');
      var label = document.getElementById('sol-dj-event-map-label');
      section.style.display = 'block';
      label.textContent = address || 'Event location';

      if (!djEventMap) {
        mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;
        var opts = {
          container: 'sol-dj-event-map',
          style: window.MAPBOX_STYLE_URL,
          center: [lng, lat],
          zoom: 14,
          attributionControl: false
        };
        try {
          djEventMap = new mapboxgl.Map(opts);
        } catch(e) {
          opts.style = 'mapbox://styles/mapbox/dark-v11';
          djEventMap = new mapboxgl.Map(opts);
        }
        djEventMap.addControl(new mapboxgl.NavigationControl(), 'top-right');
        djEventMap.addControl(new mapboxgl.AttributionControl({ compact: true, customAttribution: 'SOL' }), 'bottom-right');
      } else {
        djEventMap.flyTo({ center: [lng, lat], zoom: 14, essential: true });
      }

      if (djEventMarker) djEventMarker.remove();
      var el = createSolPin('#ff1111', 16);
      djEventMarker = new mapboxgl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(new mapboxgl.Popup().setHTML('<strong>Event Location</strong><br>' + (address || '')))
        .addTo(djEventMap)
        .togglePopup();

      // If DJ is sharing location, show live marker too
      if (djLocWatchId !== null && auth.currentUser) {
        db.collection('dj-status').doc(auth.currentUser.uid).get().then(function(doc) {
          if (doc.exists && doc.data().location) {
            var loc = doc.data().location;
            var dLat = loc.latitude || (loc._latitude) || null;
            var dLng = loc.longitude || (loc._longitude) || null;
            if (dLat !== null && dLng !== null) {
              if (djLiveMarker) djLiveMarker.remove();
              var liveEl = createSolPin('#22c55e', 14);
              djLiveMarker = new mapboxgl.Marker({ element: liveEl })
                .setLngLat([dLng, dLat])
                .setPopup(new mapboxgl.Popup().setText('Your live location'))
                .addTo(djEventMap);
            }
          }
        });
      }

      // Subscribe to DJ's own location updates while map is open
      if (auth.currentUser && !djEventMap._djLocUnsub) {
        djEventMap._djLocUnsub = db.collection('dj-status').doc(auth.currentUser.uid)
          .onSnapshot(function(doc) {
            if (doc.exists && doc.data().location) {
              var loc = doc.data().location;
              var dLat = loc.latitude || loc._latitude || null;
              var dLng = loc.longitude || loc._longitude || null;
              if (dLat !== null && dLng !== null) {
                if (djLiveMarker) {
                  djLiveMarker.setLngLat([dLng, dLat]);
                } else {
                  var liveEl = createSolPin('#22c55e', 14);
                  djLiveMarker = new mapboxgl.Marker({ element: liveEl })
                    .setLngLat([dLng, dLat])
                    .setPopup(new mapboxgl.Popup().setText('Your live location'))
                    .addTo(djEventMap);
                }
              }
            }
          });
      }
    }

    function subscribeDJStatus(user) {
      if (djStatusUnsubscribe) djStatusUnsubscribe();
      djStatusUnsubscribe = db.collection('dj-status').doc(user.uid)
        .onSnapshot(function(doc) {
          const online = doc.exists && doc.data().isOnline === true;
          updateOnlineToggleUI(online);
        }, function(err) {
          console.error('DJ status listener error:', err);
        });
    }

    function subscribeDJConversations(user) {
      if (djConversationsUnsubscribe) djConversationsUnsubscribe();
      djConversationsUnsubscribe = db.collection('conversations')
        .where('djId', '==', user.uid)
        .onSnapshot(function(snapshot) {
          djConversationsBox.innerHTML = '';
          var totalUnread = 0;
          if (snapshot.empty) {
            djConversationsBox.innerHTML = '<p style="color:#888; text-align:center;">No client conversations yet.</p>';
            updateDjModeBadge(0);
            return;
          }
          snapshot.forEach(function(doc) {
            const c = doc.data();
            if (c.unreadCount) totalUnread += c.unreadCount;
            const item = document.createElement('div');
            item.style.cssText = 'background:#111; border:1px solid #333; border-radius:10px; padding:0.75rem 1rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center;';
            var clientLetter = escapeHtml((c.clientName || 'C').charAt(0).toUpperCase());
            var clientAv = '<span style="position:relative; width:34px; height:34px; border-radius:50%; background:#ff1111; display:inline-flex; align-items:center; justify-content:center; font-weight:700; flex-shrink:0; overflow:hidden;">' + clientLetter +
              (c.clientAvatar ? '<img src="' + escapeAttr(c.clientAvatar) + '" alt="" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" onerror="this.remove()">' : '') + '</span>';
            item.innerHTML = '<span style="display:flex; align-items:center; gap:0.6rem; min-width:0;">' + clientAv + '<span style="min-width:0;"><strong>' + escapeHtml(c.clientName || 'Client') + '</strong><br><span style="font-size:0.85rem; color:#888;">' + escapeHtml(c.lastMessage || 'No messages yet') + '</span></span></span><span style="font-size:0.75rem; color:#ff1111; flex-shrink:0;">' + (c.unreadCount ? c.unreadCount + ' unread' : '') + '</span>';
            item.addEventListener('click', function() {
              openChat(doc.id);
            });
            djConversationsBox.appendChild(item);
          });
          updateDjModeBadge(totalUnread);
        }, function(err) {
          console.error('DJ conversations listener error:', err);
          djConversationsBox.innerHTML = '<p style="color:#ff1111;">Could not load conversations: ' + escapeHtml(err.message) + '</p>';
        });
    }

    function updateDjModeBadge(count) {
      var existing = djModeToggleBtn.querySelector('.sol-badge');
      if (existing) existing.remove();
      if (count > 0) {
        var badge = document.createElement('span');
        badge.className = 'sol-badge';
        badge.textContent = count;
        badge.style.cssText = 'position:absolute; top:-6px; right:-6px; background:#ff3b30; color:#fff; font-size:0.7rem; font-weight:700; min-width:18px; height:18px; border-radius:9px; display:flex; align-items:center; justify-content:center; padding:0 4px;';
        djModeToggleBtn.style.position = 'relative';
        djModeToggleBtn.appendChild(badge);
      }
    }

    djModeToggleBtn.addEventListener('click', function() {
      if (!isVerifiedDJ) {
        window.location.href = 'dj-apply.html';
        return;
      }
      djModeActive = !djModeActive;
      if (djModeActive) {
        djConsole.style.display = 'block';
        clientView.style.display = 'none';
        djModeToggleBtn.textContent = 'Client Mode';
        buildDjDashboard();
        const user = auth.currentUser;
        if (user) {
          subscribeDJStatus(user);
          subscribeDJConversations(user);
          subscribeDJBookings(user);
          loadDJSetupForm(user);
          loadBlockedDates(user.uid);
          loadDjGallery(user.uid);
          loadDjVideos(user.uid);
          loadDJEarnings(user.uid);
          initDjPayoutSetup(user);
          subscribeDJGigs(user.uid);
          loadDJWaitlist(user.uid);
          loadDJCalendarData(user.uid);
          loadDJAnalytics(user.uid);
        }
      } else {
        djConsole.style.display = 'none';
        clientView.style.display = 'block';
        updateDjToggleLabel();
        if (djStatusUnsubscribe) { djStatusUnsubscribe(); djStatusUnsubscribe = null; }
        if (djConversationsUnsubscribe) { djConversationsUnsubscribe(); djConversationsUnsubscribe = null; }
        if (djBookingsUnsubscribe) { djBookingsUnsubscribe(); djBookingsUnsubscribe = null; }
      }
    });

    // ---------- Admin Console ----------
    let isAdmin = false;
    let adminModeActive = false;
    let adminDjsUnsubscribe = null;
    let adminBookingsUnsubscribe = null;
    let adminVerificationsUnsubscribe = null;
    let adminOnlineUnsubscribe = null;

    const adminToggleBtn = document.getElementById('sol-admin-toggle');
    const adminConsole = document.getElementById('sol-admin-console');
    const adminStatus = document.getElementById('sol-admin-status');

    function checkAdminStatus(user) {
      firebase.functions().httpsCallable('isAdmin')()
        .then(function(result) {
          if (result.data && result.data.admin) {
            isAdmin = true;
            adminToggleBtn.style.display = 'inline-block';
          }
        })
        .catch(function(err) {
          console.log('Admin check skipped:', err.message);
        });
      // Fall back to document flag for legacy users without calling the function.
      db.collection('users').doc(user.uid).get()
        .then(function(doc) {
          if (doc.exists && doc.data().isAdmin === true) {
            isAdmin = true;
            adminToggleBtn.style.display = 'inline-block';
          }
        })
        .catch(function(err) {
          console.log('Admin check skipped:', err.message);
        });
    }

    adminToggleBtn.addEventListener('click', function() {
      adminModeActive = !adminModeActive;
      if (adminModeActive) {
        adminConsole.style.display = 'block';
        clientView.style.display = 'none';
        djConsole.style.display = 'none';
        djModeActive = false;
        updateDjToggleLabel();
        adminToggleBtn.textContent = 'Exit Admin';
        loadAdminData();
      } else {
        adminConsole.style.display = 'none';
        clientView.style.display = 'block';
        adminToggleBtn.textContent = 'Admin Console';
        if (adminDjsUnsubscribe) { adminDjsUnsubscribe(); adminDjsUnsubscribe = null; }
        if (adminBookingsUnsubscribe) { adminBookingsUnsubscribe(); adminBookingsUnsubscribe = null; }
        if (adminVerificationsUnsubscribe) { adminVerificationsUnsubscribe(); adminVerificationsUnsubscribe = null; }
        if (adminOnlineUnsubscribe) { adminOnlineUnsubscribe(); adminOnlineUnsubscribe = null; }
      }
    });

    function loadAdminData() {
      loadAdminDJs();
      loadAdminBookings();
      loadAdminVerifications();
      loadAdminOnlineCount();
      loadAdminDisputes();
      loadAdminUsers();
      loadAdminEarnings();
      scrubDjStatusIdentities();
    }

    // One-time-per-session cleanup: older builds wrote djName/djAvatar/etc.
    // into dj-status, which is world-readable. Strip identity fields so the
    // collection carries only presence + location.
    var djStatusScrubbed = false;
    function scrubDjStatusIdentities() {
      if (djStatusScrubbed || isAdmin !== true) return;
      djStatusScrubbed = true;
      db.collection('dj-status').get().then(function(snap) {
        var del = firebase.firestore.FieldValue.delete();
        snap.forEach(function(doc) {
          var d = doc.data() || {};
          if (d.djName === undefined && d.djAvatar === undefined &&
              d.name === undefined && d.displayName === undefined &&
              d.email === undefined) return;
          doc.ref.set({
            djName: del, djAvatar: del, name: del, displayName: del, email: del
          }, { merge: true }).catch(function() {});
        });
      }).catch(function(err) {
        console.warn('dj-status scrub skipped:', err && err.message);
      });
    }

    function loadAdminDJs() {
      var djsList = document.getElementById('sol-admin-djs-list');
      djsList.innerHTML = '<p style="color:#888;">Loading DJs...</p>';
      db.collection('dj-verifications').get()
        .then(function(snapshot) {
          var verDocs = [];
          snapshot.forEach(function(doc) { verDocs.push({ id: doc.id, data: doc.data() }); });
          var uids = verDocs.map(function(v) { return v.id; });
          var userMap = {};
          var promises = uids.map(function(uid) {
            return db.collection('users').doc(uid).get().then(function(doc) {
              if (doc.exists) userMap[uid] = doc.data();
            }).catch(function() {});
          });
          return Promise.all(promises).then(function() {
            djsList.innerHTML = '';
            var count = 0;
            if (verDocs.length === 0) {
              djsList.innerHTML = '<p style="color:#888; text-align:center;">No DJ profiles found.</p>';
              return;
            }
            verDocs.forEach(function(v) {
              count++;
              var d = v.data;
              var p = d.djProfile || {};
              var u = userMap[v.id] || {};
              var djName = p.djName || p.stageName || p.displayName || d.displayName || d.stageName || d.name || d.realName || d.djName || u.displayName || u.stageName || u.djName || u.name || 'Unknown DJ';
              var djEmail = d.email || p.email || u.email || '';
              var djAvatar = p.photoURL || p.avatar || d.photoURL || d.avatar || u.photoURL || u.avatar || '';
              var djCity = p.city || (d.location && d.location.city) || (u.location && u.location.city) || u.city || '';
              var djState = p.state || (d.location && d.location.state) || (u.location && u.location.state) || u.state || '';
              var djGenres = p.genres || p.specializations || d.genres || u.genres || [];
              var genresStr = Array.isArray(djGenres) ? djGenres.join(', ') : (djGenres || '');
              var djRate = p.hourlyRate || d.hourlyRate || u.hourlyRate || 0;
              var djExp = p.yearsOfExperience || d.experience || u.experience || 0;
              var uidShort = v.id.substring(0, 10) + '...';

              var card = document.createElement('div');
              card.className = 'sol-admin-dj-card';
              card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem; display:flex; align-items:center; gap:1rem;';
              var statusColor = d.status === 'approved' ? '#22c55e' : d.status === 'pending' ? '#ffd860' : '#ff3b30';
              var safeDjName = escapeHtml(djName);
              var safeAvatar = escapeAttr(djAvatar);
              var safeInitial = escapeHtml((djName.charAt(0) || 'D').toUpperCase());
              var avatarHtml = djAvatar
                ? '<img loading="lazy" src="' + safeAvatar + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"><div style="width:48px;height:48px;border-radius:50%;background:#ff5555;display:none;align-items:center;justify-content:center;font-weight:700;color:#000;flex-shrink:0;">' + safeInitial + '</div>'
                : '<div style="width:48px;height:48px;border-radius:50%;background:#ff5555;display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;flex-shrink:0;">' + safeInitial + '</div>';
              card.innerHTML = avatarHtml +
                '<div style="flex:1;"><strong>' + safeDjName + '</strong>' +
                (djEmail ? '<br><span style="font-size:0.85rem; color:#aaa;">' + escapeHtml(djEmail) + '</span>' : '<br><span style="font-size:0.8rem; color:#666;">UID: ' + escapeHtml(uidShort) + '</span>') +
                (djCity ? '<br><span style="font-size:0.8rem; color:#666;">' + escapeHtml(djCity) + (djState ? ', ' + escapeHtml(djState) : '') + '</span>' : '') +
                (genresStr ? '<br><span style="font-size:0.8rem; color:#666;">' + escapeHtml(genresStr) + '</span>' : '') +
                (djRate ? '<br><span style="font-size:0.8rem; color:#22c55e;">$' + escapeHtml(djRate) + '/hr</span>' : '') +
                '</div>' +
                '<span style="color:' + statusColor + '; font-size:0.85rem; font-weight:600;">' + escapeHtml(d.status || 'unknown') + '</span>' +
                '<div class="sol-admin-dj-btns" style="display:flex; flex-wrap:wrap; gap:0.35rem; justify-content:flex-end; max-width:220px;">' +
                '<button type="button" class="submit-btn" style="background:#1a1a1a; border:1px solid #22c55e; color:#22c55e; padding:0.35rem 0.6rem; font-size:0.75rem;" data-view-dj-admin="' + escapeAttr(v.id) + '" data-view-dj-name="' + escapeAttr(djName) + '">View</button>' +
                '<button type="button" class="submit-btn" style="background:#1a1a1a; border:1px solid #ffd860; color:#ffd860; padding:0.35rem 0.6rem; font-size:0.75rem;" data-edit-dj-admin="' + escapeAttr(v.id) + '">Edit</button>' +
                '<button type="button" class="submit-btn" style="background:#1a1a1a; border:1px solid #ff5555; color:#ff5555; padding:0.35rem 0.6rem; font-size:0.75rem;" data-message-dj-admin="' + escapeAttr(v.id) + '" data-message-dj-admin-target="' + escapeAttr(djEmail || v.id) + '">Message</button>' +
                '<button type="button" class="submit-btn" style="background:#1a1a1a; border:1px solid #ff9d5c; color:#ff9d5c; padding:0.35rem 0.6rem; font-size:0.75rem;" data-login-dj-admin="' + escapeAttr(v.id) + '" data-login-dj-name="' + escapeAttr(djName) + '">Log In</button>' +
                '<button type="button" class="submit-btn" style="background:#1a1a1a; border:1px solid #ff3b30; color:#ff3b30; padding:0.35rem 0.6rem; font-size:0.75rem;" data-signout-dj-admin="' + escapeAttr(v.id) + '" data-signout-dj-name="' + escapeAttr(djName) + '">Log Out</button>' +
                '<button type="button" class="submit-btn" style="background:#ff3b30; padding:0.35rem 0.6rem; font-size:0.75rem;" data-delete-dj="' + escapeAttr(v.id) + '">Delete</button>' +
                '</div>';
              djsList.appendChild(card);
            });
            document.getElementById('sol-admin-stat-djs').textContent = count;
            djsList.querySelectorAll('button[data-message-dj-admin]').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var recipientSel = document.getElementById('sol-admin-message-recipient');
                var targetInput = document.getElementById('sol-admin-message-target');
                var targetWrap = document.getElementById('sol-admin-message-specific-wrap');
                if (recipientSel) recipientSel.value = 'specific';
                if (targetWrap) targetWrap.style.display = 'block';
                if (targetInput) targetInput.value = btn.getAttribute('data-message-dj-admin-target');
                adminSwitchTab('messages');
                var messagesPanel = document.getElementById('sol-admin-panel-messages');
                if (messagesPanel) messagesPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
                var subjectInput = document.getElementById('sol-admin-message-subject');
                if (subjectInput) subjectInput.focus();
              });
            });
            djsList.querySelectorAll('button[data-view-dj-admin]').forEach(function(btn) {
              btn.addEventListener('click', function() {
                window.open('dj.html?uid=' + encodeURIComponent(btn.getAttribute('data-view-dj-admin')), '_blank');
              });
            });
            djsList.querySelectorAll('button[data-edit-dj-admin]').forEach(function(btn) {
              btn.addEventListener('click', function() {
                openAdminDjEditModal(btn.getAttribute('data-edit-dj-admin'));
              });
            });
            djsList.querySelectorAll('button[data-login-dj-admin]').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var uid = btn.getAttribute('data-login-dj-admin');
                var name = btn.getAttribute('data-login-dj-name') || 'this DJ';
                if (!confirm('Sign in as ' + name + '?\n\nYou will be logged into SOL as them (DJ console, their data). To get back to your admin account you will need to sign in again with your own email/password.')) return;
                btn.disabled = true;
                firebase.functions().httpsCallable('adminGetDjToken')({ uid: uid })
                  .then(function(res) {
                    return auth.signInWithCustomToken(res.data.token);
                  })
                  .catch(function(err) {
                    btn.disabled = false;
                    alert('Could not sign in as DJ: ' + err.message);
                  });
              });
            });
            djsList.querySelectorAll('button[data-signout-dj-admin]').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var uid = btn.getAttribute('data-signout-dj-admin');
                var name = btn.getAttribute('data-signout-dj-name') || 'this DJ';
                if (!confirm('Sign ' + name + ' out of all sessions? They will be logged out on every device and marked offline. (This does not ban or delete their account.)')) return;
                firebase.functions().httpsCallable('adminSignOutUser')({ uid: uid })
                  .then(function() {
                    adminStatus.textContent = name + ' signed out.';
                    adminStatus.style.color = '#22c55e';
                    setTimeout(function() { adminStatus.textContent = ''; }, 3000);
                  })
                  .catch(function(err) { alert('Error: ' + err.message); });
              });
            });
          });
        })
        .catch(function(err) {
          djsList.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
        });
    }

    function loadAdminBookings() {
      var bookingsList = document.getElementById('sol-admin-bookings-list');
      bookingsList.innerHTML = '<p style="color:#888;">Loading bookings...</p>';
      db.collection('bookings').limit(50).onSnapshot(function(snapshot) {
        bookingsList.innerHTML = '';
        var count = 0;
        if (snapshot.empty) {
          bookingsList.innerHTML = '<p style="color:#888; text-align:center;">No bookings found.</p>';
          document.getElementById('sol-admin-stat-bookings').textContent = '0';
          return;
        }
        snapshot.forEach(function(doc) {
          count++;
          var b = doc.data();
          var card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem;';
          var statusColor = b.status === 'confirmed' ? '#22c55e' : b.status === 'pending' ? '#ffd860' : b.status === 'completed' ? '#ff5555' : '#ff3b30';
          card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
            '<strong>' + escapeHtml(b.eventType || b.event_type || 'Event') + '</strong>' +
            '<span style="color:' + statusColor + '; font-size:0.85rem;">' + escapeHtml(b.status || 'unknown') + '</span>' +
            '</div>' +
            '<div style="color:#ccc; font-size:0.85rem; line-height:1.6;">' +
            '<div>👤 Client: ' + escapeHtml(b.clientName || b.client_name || 'Unknown') + '</div>' +
            '<div>🎧 DJ: ' + escapeHtml(b.djName || 'Unknown') + '</div>' +
            '<div>📅 ' + escapeHtml(b.date || b.eventDate || 'TBD') + (b.startTime ? ' at ' + escapeHtml(b.startTime) : '') + '</div>' +
            '<div>💰 $' + Number(b.totalAmount || b.total_cost || 0).toLocaleString() + '</div>' +
            '</div>' +
            (b.status !== 'cancelled' && b.status !== 'completed' ? '<button type="button" class="submit-btn" style="background:#ff3b30; padding:0.4rem 0.7rem; font-size:0.8rem; margin-top:0.5rem;" data-cancel-admin-booking="' + escapeAttr(doc.id) + '">Cancel Booking</button>' : '') +
            '<button type="button" class="submit-btn" style="background:#1a1a1a; border:1px solid #ff5555; color:#ff5555; padding:0.4rem 0.7rem; font-size:0.8rem; margin-top:0.5rem;" data-track-status="' + escapeAttr(doc.id) + '">📊 Track Status</button>';
          bookingsList.appendChild(card);
        });
        document.getElementById('sol-admin-stat-bookings').textContent = count;
      }, function(err) {
        bookingsList.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
      });
    }

    document.getElementById('sol-admin-djs-list').addEventListener('click', function(e) {
      if (e.target && e.target.hasAttribute('data-delete-dj')) {
        var uid = e.target.getAttribute('data-delete-dj');
        if (!confirm('Delete this DJ profile? This cannot be undone.')) return;
        db.collection('dj-verifications').doc(uid).delete()
          .then(function() {
            db.collection('djs').doc(uid).delete();
            db.collection('dj-status').doc(uid).delete();
            adminStatus.textContent = 'DJ deleted.';
            adminStatus.style.color = '#ff3b30';
            setTimeout(function() { adminStatus.textContent = ''; }, 3000);
          })
          .catch(function(err) { alert('Error: ' + err.message); });
      }
    });

    document.getElementById('sol-admin-bookings-list').addEventListener('click', function(e) {
      if (e.target && e.target.hasAttribute('data-cancel-admin-booking')) {
        var bid = e.target.getAttribute('data-cancel-admin-booking');
        if (!confirm('Cancel this booking?')) return;
        db.collection('bookings').doc(bid).set({
          status: 'cancelled',
          cancelledBy: 'admin',
          cancelledAt: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true })
          .then(function() {
            adminStatus.textContent = 'Booking cancelled.';
            adminStatus.style.color = '#ff3b30';
            setTimeout(function() { adminStatus.textContent = ''; }, 3000);
          })
          .catch(function(err) { alert('Error: ' + err.message); });
      }
      if (e.target && e.target.hasAttribute('data-track-status')) {
        openBookingStatusTracker(e.target.getAttribute('data-track-status'));
      }
    });

    function loadAdminVerifications() {
      var verificationsList = document.getElementById('sol-admin-verifications-list');
      verificationsList.innerHTML = '<p style="color:#888;">Loading verifications...</p>';
      db.collection('dj-verifications').onSnapshot(function(snapshot) {
        verificationsList.innerHTML = '';
        if (snapshot.empty) {
          verificationsList.innerHTML = '<p style="color:#888; text-align:center;">No verification requests.</p>';
          return;
        }
        snapshot.forEach(function(doc) {
          var d = doc.data();
          if (d.status === 'approved') return;
          var p = d.djProfile || {};
          var djName = p.djName || p.stageName || p.displayName || d.displayName || d.stageName || d.name || d.realName || d.djName || 'Unknown';
          var djEmail = d.email || p.email || '';
          var djBio = p.bio || d.bio || '';
          var djGenres = p.genres || p.specializations || d.genres || [];
          var genresStr = Array.isArray(djGenres) ? djGenres.join(', ') : (djGenres || '');
          var djRate = p.hourlyRate || d.hourlyRate || 0;
          var djCity = p.city || (d.location && d.location.city) || '';
          var djState = p.state || (d.location && d.location.state) || '';
          var djExp = p.yearsOfExperience || d.experience || 0;

          var card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem;';
          var statusColor = d.status === 'pending' ? '#ffd860' : '#ff3b30';
          card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
            '<strong>' + escapeHtml(djName) + '</strong>' +
            '<span style="color:' + statusColor + '; font-size:0.85rem;">' + escapeHtml(d.status || 'unknown') + '</span>' +
            '</div>' +
            '<div style="color:#ccc; font-size:0.85rem; margin-bottom:0.75rem;">' +
            (djEmail ? '<div>📧 ' + escapeHtml(djEmail) + '</div>' : '') +
            (djCity ? '<div>📍 ' + escapeHtml(djCity) + (djState ? ', ' + escapeHtml(djState) : '') + '</div>' : '') +
            (djBio ? '<div>📝 ' + escapeHtml(djBio).replace(/\n/g, '<br>') + '</div>' : '') +
            (genresStr ? '<div>🎵 ' + escapeHtml(genresStr) + '</div>' : '') +
            (djRate ? '<div>💰 $' + escapeHtml(djRate) + '/hr</div>' : '') +
            (djExp ? '<div>⏱️ ' + escapeHtml(djExp) + ' years experience</div>' : '') +
            (d.licenseUrl ? '<div>🪪 Driver\'s license ' + (d.licenseStatus ? '(' + escapeHtml(d.licenseStatus) + ') ' : '') + '— <a href="' + escapeAttr(d.licenseUrl) + '" target="_blank" rel="noopener" style="color:#ff5555;">view document</a> <span style="color:#888;">— eligible for premium out-of-area gigs if approved</span></div>' : '') +
            '</div>' +
            '<div style="display:flex; gap:0.5rem;">' +
            '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-action="reject" data-uid="' + escapeAttr(doc.id) + '">Reject</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#22c55e;" data-action="approve" data-uid="' + escapeAttr(doc.id) + '">Approve</button>' +
            '</div>';
          verificationsList.appendChild(card);
        });
        verificationsList.querySelectorAll('button[data-action]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var action = btn.getAttribute('data-action');
            var uid = btn.getAttribute('data-uid');
            var newStatus = action === 'approve' ? 'approved' : 'rejected';
            var verUpdate = {
              status: newStatus,
              reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
            };
            if (d.licenseUrl) {
              verUpdate.licenseStatus = action === 'approve' ? 'verified' : 'rejected';
            }
            var promises = [db.collection('dj-verifications').doc(uid).set(verUpdate, { merge: true })];

            var statusData = {
              isVerified: action === 'approve'
            };
            if (action === 'approve') {
              statusData.verifiedAt = firebase.firestore.FieldValue.serverTimestamp();
            } else {
              statusData.revokedAt = firebase.firestore.FieldValue.serverTimestamp();
            }
            promises.push(db.collection('dj-status').doc(uid).set(statusData, { merge: true }));

            if (action === 'approve') {
              promises.push(db.collection('users').doc(uid).set({
                isVerifiedDJ: true,
                verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true }));
              trackSolEvent('dj_verification_approved', { uid: uid, method: 'admin_panel' });
              trackSolEvent('dj_registration', { uid: uid, method: 'admin_panel_verification' });
            } else {
              trackSolEvent('dj_verification_rejected', { uid: uid });
            }

            Promise.all(promises).then(function() {
              adminStatus.textContent = 'DJ ' + newStatus + ' successfully.';
              adminStatus.style.color = action === 'approve' ? '#22c55e' : '#ff1111';
              setTimeout(function() { adminStatus.textContent = ''; }, 3000);
            }).catch(function(err) {
              adminStatus.textContent = 'Error: ' + err.message;
              adminStatus.style.color = '#ff1111';
            });
          });
        });
      }, function(err) {
        verificationsList.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
      });
    }

    function loadAdminOnlineCount() {
      db.collection('dj-status').where('isOnline', '==', true).onSnapshot(function(snapshot) {
        document.getElementById('sol-admin-stat-online').textContent = snapshot.size;
      }, function(err) {
        console.error('Admin online count error:', err);
      });
    }

    function adminSwitchTab(activeId) {
      var tabs = ['djs','bookings','verifications','users','messages','earnings','songs','add-dj','disputes','settings'];
      tabs.forEach(function(t) {
        var panel = document.getElementById('sol-admin-panel-' + t);
        var btn = document.getElementById('sol-admin-tab-' + t);
        if (panel) panel.style.display = (t === activeId) ? 'block' : 'none';
        if (btn) {
          if (btn.classList && btn.classList.contains('sol-nav-item')) {
            btn.classList.toggle('active', t === activeId);
          } else if (t === activeId) { btn.style.background = '#ff5555'; btn.style.color = '#000'; }
          else { btn.style.background = ''; btn.style.color = ''; }
        }
      });
    }

    document.getElementById('sol-admin-tab-djs').addEventListener('click', function() { adminSwitchTab('djs'); });
    document.getElementById('sol-admin-sync-dj-flags').addEventListener('click', function() {
      var statusEl = document.getElementById('sol-admin-sync-dj-flags-status');
      statusEl.textContent = 'Syncing…';
      statusEl.style.color = '#ffd860';
      // Backfill isDJ/role on users docs for DJs who signed up via the
      // website — the app filters DJ queries on those flags.
      db.collection('dj-verifications').get().then(function(snap) {
        var uids = snap.docs.map(function(d) { return d.id; });
        var updated = 0;
        return Promise.all(uids.map(function(uid) {
          return db.collection('users').doc(uid).get().then(function(udoc) {
            var u = udoc.exists ? (udoc.data() || {}) : {};
            var update = { isDJ: true };
            // Never downgrade an existing role (e.g. admin)
            if (u.role !== 'admin') update.role = 'dj';
            return db.collection('users').doc(uid).set(update, { merge: true })
              .then(function() { updated++; });
          });
        })).then(function() {
          statusEl.textContent = 'Done — ' + updated + ' users docs flagged (' + uids.length + ' verifications).';
          statusEl.style.color = '#22c55e';
          trackSolEvent('admin_dj_flags_synced', { updated: updated, total: uids.length });
        });
      }).catch(function(err) {
        statusEl.textContent = 'Sync failed: ' + err.message;
        statusEl.style.color = '#ff1111';
      });
    });
    document.getElementById('sol-admin-tab-bookings').addEventListener('click', function() { adminSwitchTab('bookings'); });
    document.getElementById('sol-admin-tab-verifications').addEventListener('click', function() { adminSwitchTab('verifications'); });
    document.getElementById('sol-admin-tab-users').addEventListener('click', function() { adminSwitchTab('users'); loadAdminUsers(); });
    document.getElementById('sol-admin-tab-messages').addEventListener('click', function() { adminSwitchTab('messages'); loadAdminMessageHistory(); });
    document.getElementById('sol-admin-tab-earnings').addEventListener('click', function() { adminSwitchTab('earnings'); loadAdminEarnings(); });
    document.getElementById('sol-admin-tab-songs').addEventListener('click', function() { adminSwitchTab('songs'); loadAdminSongs(); });
    document.getElementById('sol-admin-tab-add-dj').addEventListener('click', function() { adminSwitchTab('add-dj'); });
    document.getElementById('sol-admin-tab-disputes').addEventListener('click', function() { adminSwitchTab('disputes'); loadAdminDisputes(); });
    document.getElementById('sol-admin-tab-settings').addEventListener('click', function() { adminSwitchTab('settings'); loadAdminSettings(); });

    var syncUsersBtn = document.getElementById('sol-admin-sync-users');
    if (syncUsersBtn) {
      syncUsersBtn.addEventListener('click', function() {
        var btn = this;
        btn.textContent = 'Syncing...';
        btn.disabled = true;
        var syncFn = firebase.functions().httpsCallable('syncAllAuthUsers');
        syncFn({})
          .then(function(result) {
            var r = result.data || {};
            btn.textContent = 'Sync All Auth Users';
            btn.disabled = false;
            alert('Synced! Created ' + (r.created || 0) + ' missing user docs out of ' + (r.totalAuthUsers || 0) + ' auth accounts.');
            loadAdminUsers();
          })
          .catch(function(err) {
            btn.textContent = 'Sync All Auth Users';
            btn.disabled = false;
            alert('Sync failed: ' + err.message);
          });
      });
    }

    function loadAdminUsers() {
      var usersList = document.getElementById('sol-admin-users-list');
      usersList.innerHTML = '<p style="color:#888;">Loading users...</p>';
      console.log('[ADMIN USERS] Fetching users collection...');
      db.collection('users').get()
        .then(function(snapshot) {
          var users = [];
          snapshot.forEach(function(doc) { users.push({ id: doc.id, data: doc.data() }); });
          users.sort(function(a, b) {
            var ta = a.data.createdAt && typeof a.data.createdAt.toMillis === 'function' ? a.data.createdAt.toMillis() : 0;
            var tb = b.data.createdAt && typeof b.data.createdAt.toMillis === 'function' ? b.data.createdAt.toMillis() : 0;
            return tb - ta;
          });
          console.log('[ADMIN USERS] Found', users.length, 'users');
          document.getElementById('sol-admin-stat-users').textContent = users.length;
          renderAdminUsers(users);
          var searchEl = document.getElementById('sol-admin-user-search');
          searchEl.oninput = function() {
            var q = this.value.toLowerCase();
            var filtered = users.filter(function(u) {
              var name = (u.data.displayName || u.data.name || u.data.email || '').toLowerCase();
              var email = (u.data.email || '').toLowerCase();
              return name.indexOf(q) >= 0 || email.indexOf(q) >= 0;
            });
            renderAdminUsers(filtered);
          };
        })
        .catch(function(err) {
          usersList.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
        });
    }

    function renderAdminUsers(users) {
      var usersList = document.getElementById('sol-admin-users-list');
      usersList.innerHTML = '';
      if (users.length === 0) {
        usersList.innerHTML = '<p style="color:#888; text-align:center;">No users found.</p>';
        return;
      }
      users.forEach(function(u) {
        var d = u.data;
        var name = d.displayName || d.name || d.email || 'Unknown';
        var email = d.email || '';
        var isDJ = d.isVerifiedDJ === true;
        var isAdmin = d.isAdmin === true;
        var banned = d.banned === true;
        var avatar = d.photoURL || d.avatar || '';
        var card = document.createElement('div');
        card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem; display:flex; align-items:center; gap:1rem;';
        var safeName = escapeHtml(name);
        var safeInitial = escapeHtml((name.charAt(0) || 'U').toUpperCase());
        var avatarHtml = avatar
          ? '<img loading="lazy" src="' + escapeAttr(avatar) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"><div style="width:40px;height:40px;border-radius:50%;background:#ff1111;display:none;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;">' + safeInitial + '</div>'
          : '<div style="width:40px;height:40px;border-radius:50%;background:#ff1111;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;">' + safeInitial + '</div>';
        var isProtected = d.protected === true;
        var badges = '';
        var now = Date.now();
        var created = d.createdAt && typeof d.createdAt.toMillis === 'function' ? d.createdAt.toMillis() : 0;
        var isNew = (now - created) < 24 * 60 * 60 * 1000;
        if (isNew) badges += '<span style="background:#ffd860; color:#000; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">NEW</span> ';
        if (isAdmin) badges += '<span style="background:#ff5555; color:#000; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">ADMIN</span> ';
        if (isDJ) badges += '<span style="background:#22c55e; color:#fff; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">DJ</span> ';
        if (banned) badges += '<span style="background:#ff3b30; color:#fff; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">BANNED</span> ';
        if (isProtected) badges += '<span style="background:#22c55e; color:#fff; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">FOUNDER</span> ';
        card.innerHTML = avatarHtml +
          '<div style="flex:1; cursor:pointer;" data-view-user="' + escapeAttr(u.id) + '"><strong>' + safeName + '</strong>' +
          (email ? '<br><span style="font-size:0.85rem; color:#aaa;">' + escapeHtml(email) + '</span>' : '') +
          '<br><span style="font-size:0.8rem; color:#666;">UID: ' + escapeHtml(u.id.substring(0, 12)) + '...</span></div>' +
          '<div style="display:flex; flex-direction:column; gap:0.25rem; align-items:flex-end;">' +
          '<div>' + badges + '</div>' +
          '<button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#ff5555; color:#000;" data-view-user="' + escapeAttr(u.id) + '">View</button>' +
          '<button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:' + (banned ? '#22c55e' : '#ff3b30') + ';" data-ban-user="' + escapeAttr(u.id) + '" data-banned="' + (banned ? '1' : '0') + '" data-protected="' + (isProtected ? '1' : '0') + '">' + (banned ? 'Unban' : 'Ban') + '</button>' +
          '<button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#ff1111;" data-force-logout="' + escapeAttr(u.id) + '" data-protected="' + (isProtected ? '1' : '0') + '">Log Out</button>' +
          '</div>';
        usersList.appendChild(card);
      });
      usersList.querySelectorAll('[data-view-user]').forEach(function(el) {
        el.addEventListener('click', function(e) {
          if (e.target.getAttribute('data-ban-user')) return;
          var uid = el.getAttribute('data-view-user');
          if (uid) openAdminUserModal(uid);
        });
      });
      usersList.querySelectorAll('button[data-ban-user]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var uid = btn.getAttribute('data-ban-user');
          var isBanned = btn.getAttribute('data-banned') === '1';
          var isProtected = btn.getAttribute('data-protected') === '1';
          if (isProtected) {
            alert('This account is the site owner and cannot be banned or removed from admin.');
            return;
          }
          db.collection('users').doc(uid).set({
            banned: !isBanned
          }, { merge: true }).then(function() {
            adminStatus.textContent = isBanned ? 'User unbanned.' : 'User banned.';
            adminStatus.style.color = isBanned ? '#22c55e' : '#ff3b30';
            setTimeout(function() { adminStatus.textContent = ''; }, 3000);
            loadAdminUsers();
          }).catch(function(err) { alert('Error: ' + err.message); });
        });
      });
      usersList.querySelectorAll('button[data-force-logout]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var uid = btn.getAttribute('data-force-logout');
          var isProtected = btn.getAttribute('data-protected') === '1';
          if (isProtected) {
            alert('This account is the site owner and cannot be force logged out.');
            return;
          }
          if (!confirm('Force log out this user? This will revoke their session and disable their account.')) return;
          firebase.functions().httpsCallable('forceLogoutUser')({ uid: uid })
            .then(function() {
              adminStatus.textContent = 'User force logged out and disabled.';
              adminStatus.style.color = '#22c55e';
              setTimeout(function() { adminStatus.textContent = ''; }, 3000);
              loadAdminUsers();
            }).catch(function(err) { alert('Error: ' + err.message); });
        });
      });
    }

    // ---------- Admin User Profile Modal ----------
    function createAdminUserModal() {
      if (document.getElementById('sol-user-modal')) return;
      var modal = document.createElement('div');
      modal.id = 'sol-user-modal';
      modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10000; align-items:center; justify-content:center; padding:1rem; box-sizing:border-box;';
      modal.innerHTML =
        '<div style="background:#111; border:1px solid #ff1111; border-radius:16px; max-width:700px; width:100%; max-height:90vh; overflow-y:auto; padding:1.5rem; position:relative;">' +
        '<button type="button" id="sol-user-modal-close" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">&times;</button>' +
        '<h3 style="margin-top:0; color:#ff1111;">User Profile</h3>' +
        '<div id="sol-user-modal-content" style="color:#ccc; font-size:0.9rem; line-height:1.5;">Loading...</div>' +
        '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) {
        if (e.target === modal) closeAdminUserModal();
      });
      document.getElementById('sol-user-modal-close').addEventListener('click', closeAdminUserModal);
    }

    function closeAdminUserModal() {
      var modal = document.getElementById('sol-user-modal');
      if (modal) { modal.style.display = 'none'; }
    }

    // ---------- Admin DJ Edit Modal ----------
    // Lets admin edit DJ profile fields directly — including admin-only
    // fields DJs can't touch themselves (verification status, verified flag,
    // featured flag).
    function openAdminDjEditModal(uid) {
      var existing = document.getElementById('sol-dj-edit-modal');
      if (existing) existing.remove();
      var modal = document.createElement('div');
      modal.id = 'sol-dj-edit-modal';
      modal.style.cssText = 'display:flex; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10000; align-items:center; justify-content:center; padding:1rem; box-sizing:border-box;';
      modal.innerHTML =
        '<div style="background:#111; border:1px solid #ffd860; border-radius:16px; max-width:640px; width:100%; max-height:90vh; overflow-y:auto; padding:1.5rem; position:relative;">' +
        '<button type="button" id="sol-dj-edit-close" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">&times;</button>' +
        '<h3 style="margin-top:0; color:#ffd860;">Edit DJ (Admin)</h3>' +
        '<div id="sol-dj-edit-content" style="color:#ccc; font-size:0.9rem;">Loading...</div>' +
        '</div>';
      document.body.appendChild(modal);
      modal.addEventListener('click', function(e) { if (e.target === modal) modal.style.display = 'none'; });
      document.getElementById('sol-dj-edit-close').addEventListener('click', function() { modal.style.display = 'none'; });

      var content = document.getElementById('sol-dj-edit-content');
      Promise.all([
        db.collection('djs').doc(uid).get(),
        db.collection('dj-verifications').doc(uid).get(),
        db.collection('users').doc(uid).get()
      ]).then(function(res) {
        var djDoc = res[0].exists ? res[0].data() : {};
        var verDoc = res[1].exists ? res[1].data() : {};
        var userDoc = res[2].exists ? res[2].data() : {};
        var p = verDoc.djProfile || {};
        var val = function() {
          for (var i = 0; i < arguments.length; i++) {
            if (arguments[i] !== undefined && arguments[i] !== null && arguments[i] !== '') return arguments[i];
          }
          return '';
        };
        var arrJoin = function(a) { return Array.isArray(a) ? a.join(', ') : (a || ''); };
        var currentAvatar = val(djDoc.photoURL, djDoc.avatar, p.photoURL, p.avatar, verDoc.photoURL, verDoc.avatar, userDoc.photoURL, userDoc.avatar);

        var field = function(id, label, v, placeholder) {
          return '<label style="display:block; margin-bottom:0.75rem;">' +
            '<span style="color:#888; font-size:0.8rem;">' + label + '</span>' +
            '<input type="text" id="' + id + '" value="' + escapeAttr(v) + '" placeholder="' + (placeholder || '') + '" style="width:100%; margin-top:0.25rem; padding:0.5rem; background:#1a1a1a; border:1px solid #444; border-radius:8px; color:#fff; box-sizing:border-box;">' +
            '</label>';
        };

        content.innerHTML =
          '<div style="margin-bottom:0.75rem;"><span style="color:#888; font-size:0.8rem;">Profile Picture</span>' +
          '<div style="display:flex; align-items:center; gap:0.75rem; margin-top:0.35rem;">' +
          '<img id="admde-avatar-img" src="' + escapeAttr(currentAvatar) + '" alt="" style="width:64px;height:64px;border-radius:50%;object-fit:cover;flex-shrink:0;border:2px solid #444;' + (currentAvatar ? '' : 'display:none;') + '" onerror="this.onerror=null;this.style.display=\'none\';">' +
          '<div style="flex:1;">' +
          '<input type="file" id="admde-avatar-file" accept="image/*" style="font-size:0.8rem; color:#ccc; margin-bottom:0.4rem; width:100%;">' +
          '<input type="text" id="admde-avatar-url" value="' + escapeAttr(currentAvatar) + '" placeholder="https://… or choose a file above" style="width:100%; padding:0.5rem; background:#1a1a1a; border:1px solid #444; border-radius:8px; color:#fff; box-sizing:border-box; font-size:0.8rem;">' +
          '<div id="admde-avatar-status" style="font-size:0.75rem; margin-top:0.3rem; min-height:1em;"></div>' +
          '</div></div></div>' +
          field('admde-stage', 'Stage Name', val(djDoc.stageName, p.stageName, p.djName, verDoc.stageName, userDoc.displayName)) +
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">' +
          field('admde-city', 'City', val(djDoc.city, p.city, userDoc.city)) +
          field('admde-state', 'State', val(djDoc.state, p.state, userDoc.state)) +
          field('admde-rate', 'Hourly Rate ($)', val(djDoc.hourlyRate, p.hourlyRate, userDoc.hourlyRate)) +
          field('admde-exp', 'Years Experience', val(djDoc.experience, p.yearsOfExperience, userDoc.experience)) +
          '</div>' +
          '<label style="display:block; margin-bottom:0.75rem;"><span style="color:#888; font-size:0.8rem;">Bio</span>' +
          '<textarea id="admde-bio" rows="3" style="width:100%; margin-top:0.25rem; padding:0.5rem; background:#1a1a1a; border:1px solid #444; border-radius:8px; color:#fff; box-sizing:border-box;">' + escapeHtml(val(djDoc.bio, p.bio)) + '</textarea></label>' +
          field('admde-genres', 'Genres (comma separated)', arrJoin(val(djDoc.genres, p.genres))) +
          field('admde-specialties', 'Specialties (comma separated)', arrJoin(val(djDoc.specialties, p.specializations))) +
          field('admde-equipment', 'Equipment (comma separated)', arrJoin(val(djDoc.equipment, p.equipment))) +
          '<div style="display:grid; grid-template-columns:1fr 1fr; gap:0.75rem;">' +
          field('admde-phone', 'Phone', val(djDoc.phone, p.phone, verDoc.phone)) +
          field('admde-notifyemail', 'Notification Email', val(djDoc.notificationEmail, verDoc.notificationEmail)) +
          field('admde-paypal', 'PayPal', val(djDoc.paypal, p.paypal)) +
          field('admde-website', 'Website', val(djDoc.website, p.website)) +
          '</div>' +
          '<div style="border-top:1px solid #333; margin:0.75rem 0; padding-top:0.75rem;">' +
          '<span style="color:#ffd860; font-size:0.8rem; font-weight:600;">ADMIN-ONLY CONTROLS</span>' +
          '<label style="display:block; margin-top:0.5rem;"><span style="color:#888; font-size:0.8rem;">Verification Status</span>' +
          '<select id="admde-status" style="width:100%; margin-top:0.25rem; padding:0.5rem; background:#1a1a1a; border:1px solid #444; border-radius:8px; color:#fff;">' +
          ['pending', 'approved', 'rejected', 'suspended'].map(function(s) {
            var cur = verDoc.status || 'pending';
            return '<option value="' + s + '"' + (s === cur ? ' selected' : '') + '>' + s + '</option>';
          }).join('') +
          '</select></label>' +
          '<label style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;"><input type="checkbox" id="admde-verified"' + (userDoc.isVerifiedDJ === true || djDoc.isVerifiedDJ === true ? ' checked' : '') + '> Verified DJ (shows in search)</label>' +
          '<label style="display:flex; align-items:center; gap:0.5rem; margin-top:0.5rem;"><input type="checkbox" id="admde-featured"' + (djDoc.featured === true ? ' checked' : '') + '> Featured DJ</label>' +
          '</div>' +
          '<button type="button" id="admde-save" class="submit-btn" style="width:100%; margin-top:1rem; padding:0.75rem; background:#ffd860; color:#000; font-weight:700;">Save Changes</button>' +
          '<p id="admde-msg" style="font-size:0.8rem; margin-top:0.5rem;"></p>';

        var avatarUrlInput = document.getElementById('admde-avatar-url');
        var avatarImg = document.getElementById('admde-avatar-img');
        var avatarStatus = document.getElementById('admde-avatar-status');
        avatarUrlInput.addEventListener('input', function() {
          var u = avatarUrlInput.value.trim();
          if (u) { avatarImg.src = u; avatarImg.style.display = 'block'; }
        });
        document.getElementById('admde-avatar-file').addEventListener('change', function(e) {
          var file = e.target.files && e.target.files[0];
          if (!file) return;
          var adminUser = auth.currentUser;
          if (!adminUser) {
            avatarStatus.textContent = 'You must be signed in to upload.';
            avatarStatus.style.color = '#ff3b30';
            return;
          }
          if (!file.type.match('image.*')) {
            avatarStatus.textContent = 'Please select an image file.';
            avatarStatus.style.color = '#ff3b30';
            return;
          }
          if (file.size > 5 * 1024 * 1024) {
            avatarStatus.textContent = 'Image must be under 5 MB.';
            avatarStatus.style.color = '#ff3b30';
            return;
          }
          avatarStatus.textContent = 'Uploading...';
          avatarStatus.style.color = '#ffd860';
          var ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
          var ref = storage.ref('public/' + adminUser.uid + '/dj-avatars/' + uid + '-' + Date.now() + '.' + ext);
          ref.put(file).then(function() {
            return ref.getDownloadURL();
          }).then(function(url) {
            avatarUrlInput.value = url;
            avatarImg.src = url;
            avatarImg.style.display = 'block';
            avatarStatus.textContent = 'Upload complete — click Save Changes.';
            avatarStatus.style.color = '#22c55e';
          }).catch(function(err) {
            avatarStatus.textContent = 'Upload failed: ' + err.message;
            avatarStatus.style.color = '#ff3b30';
          });
        });

        document.getElementById('admde-save').addEventListener('click', function() {
          var msg = document.getElementById('admde-msg');
          var splitCsv = function(id) {
            return document.getElementById(id).value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
          };
          var stageName = document.getElementById('admde-stage').value.trim();
          var newStatus = document.getElementById('admde-status').value;
          var isVerified = document.getElementById('admde-verified').checked;
          var avatarUrl = document.getElementById('admde-avatar-url').value.trim();
          var djUpdate = {
            stageName: stageName,
            photoURL: avatarUrl,
            avatar: avatarUrl,
            profileSlug: djSlugify(stageName),
            city: document.getElementById('admde-city').value.trim(),
            state: document.getElementById('admde-state').value.trim(),
            hourlyRate: parseFloat(document.getElementById('admde-rate').value) || 0,
            experience: parseFloat(document.getElementById('admde-exp').value) || 0,
            bio: document.getElementById('admde-bio').value.trim(),
            genres: splitCsv('admde-genres'),
            specialties: splitCsv('admde-specialties'),
            equipment: splitCsv('admde-equipment'),
            phone: document.getElementById('admde-phone').value.trim(),
            notificationEmail: document.getElementById('admde-notifyemail').value.trim(),
            paypal: document.getElementById('admde-paypal').value.trim(),
            website: document.getElementById('admde-website').value.trim(),
            isVerifiedDJ: isVerified,
            featured: document.getElementById('admde-featured').checked,
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          var btn = this;
          btn.disabled = true;
          btn.textContent = 'Saving...';
          Promise.all([
            db.collection('djs').doc(uid).set(djUpdate, { merge: true }),
            db.collection('dj-verifications').doc(uid).set({
              status: newStatus,
              photoURL: avatarUrl,
              avatar: avatarUrl,
              djProfile: {
                stageName: stageName,
                djName: stageName,
                city: djUpdate.city,
                state: djUpdate.state,
                hourlyRate: djUpdate.hourlyRate,
                photoURL: avatarUrl,
                avatar: avatarUrl
              }
            }, { merge: true }),
            db.collection('users').doc(uid).set({ isVerifiedDJ: isVerified, photoURL: avatarUrl, avatar: avatarUrl }, { merge: true })
          ]).then(function() {
            msg.textContent = 'Saved.';
            msg.style.color = '#22c55e';
            btn.disabled = false;
            btn.textContent = 'Save Changes';
            loadAdminDJs();
          }).catch(function(err) {
            msg.textContent = 'Error: ' + err.message;
            msg.style.color = '#ff3b30';
            btn.disabled = false;
            btn.textContent = 'Save Changes';
          });
        });
      }).catch(function(err) {
        content.innerHTML = '<p style="color:#ff1111;">Error loading DJ: ' + escapeHtml(err.message) + '</p>';
      });
    }

    function openAdminUserModal(uid) {
      createAdminUserModal();
      var modal = document.getElementById('sol-user-modal');
      var content = document.getElementById('sol-user-modal-content');
      modal.style.display = 'flex';
      content.innerHTML = '<p style="color:#888;">Loading user data...</p>';

      Promise.all([
        db.collection('users').doc(uid).get(),
        db.collection('bookings').where('clientId', '==', uid).orderBy('createdAt', 'desc').limit(20).get().catch(function() { return { empty: true, docs: [] }; }),
        db.collection('bookings').where('djId', '==', uid).orderBy('createdAt', 'desc').limit(20).get().catch(function() { return { empty: true, docs: [] }; }),
        db.collection('conversations').where('participants', 'array-contains', uid).orderBy('lastMessageAt', 'desc').limit(20).get().catch(function() { return { empty: true, docs: [] }; }),
        db.collection('saved-djs').where('clientId', '==', uid).get().catch(function() { return { empty: true, docs: [] }; }),
        db.collection('client-verifications').doc(uid).get().catch(function() { return { exists: false }; }),
        db.collection('dj-verifications').doc(uid).get().catch(function() { return { exists: false }; })
      ]).then(function(results) {
        var userDoc = results[0];
        var clientBookings = results[1];
        var djBookings = results[2];
        var conversations = results[3];
        var savedDjs = results[4];
        var clientVerify = results[5];
        var djVerify = results[6];

        if (!userDoc.exists) {
          content.innerHTML = '<p style="color:#ff1111;">User not found.</p>';
          return;
        }

        var d = userDoc.data();
        var name = d.displayName || d.name || d.email || 'Unknown';
        var email = d.email || '';
        var phone = d.phone || '';
        var photo = d.photoURL || d.avatar || '';
        var created = d.createdAt ? (d.createdAt.toDate ? d.createdAt.toDate().toLocaleString() : d.createdAt) : 'N/A';
        var lastLogin = d.lastLoginAt ? (d.lastLoginAt.toDate ? d.lastLoginAt.toDate().toLocaleString() : d.lastLoginAt) : 'N/A';
        var banned = d.banned === true;
        var isAdmin = d.isAdmin === true;
        var isDJ = d.isVerifiedDJ === true;
        var isVerifiedClient = d.isVerifiedClient === true;
        var cvStatus = clientVerify.exists ? (clientVerify.data().status || 'pending') : 'none';
        var dvStatus = djVerify.exists ? (djVerify.data().status || 'pending') : 'none';

        var bookingsHtml = '';
        if (!clientBookings.empty) {
          clientBookings.forEach(function(doc) {
            var b = doc.data();
            bookingsHtml += '<div style="background:#1a1a1a; border-radius:8px; padding:0.5rem; margin-bottom:0.25rem;">' +
              '<strong>' + (b.eventType || 'Booking') + '</strong> — ' + (b.date || b.eventDate || 'No date') + '<br>' +
              'Status: <span style="color:#ffd860;">' + (b.status || 'requested') + '</span> — $' + (b.totalAmount || b.total_cost || 0) + '</div>';
          });
        }
        if (bookingsHtml === '') bookingsHtml = '<p style="color:#888;">No bookings found.</p>';

        var djBookingsHtml = '';
        if (!djBookings.empty) {
          djBookings.forEach(function(doc) {
            var b = doc.data();
            djBookingsHtml += '<div style="background:#1a1a1a; border-radius:8px; padding:0.5rem; margin-bottom:0.25rem;">' +
              '<strong>' + (b.eventType || 'Booking') + '</strong> — ' + (b.date || b.eventDate || 'No date') + '<br>' +
              'Status: <span style="color:#ffd860;">' + (b.status || 'requested') + '</span> — $' + (b.totalAmount || b.total_cost || 0) + '</div>';
          });
        }
        if (djBookingsHtml === '') djBookingsHtml = '<p style="color:#888;">No DJ bookings found.</p>';

        var convosHtml = '';
        if (!conversations.empty) {
          conversations.forEach(function(doc) {
            var c = doc.data();
            convosHtml += '<div style="background:#1a1a1a; border-radius:8px; padding:0.5rem; margin-bottom:0.25rem;">' +
              (c.djName || 'DJ') + ' — ' + (c.lastMessage || 'No message') + '<br>' +
              'Participants: ' + (c.participants ? c.participants.join(', ') : 'N/A') + '</div>';
          });
        }
        if (convosHtml === '') convosHtml = '<p style="color:#888;">No conversations found.</p>';

        var savedHtml = '';
        if (!savedDjs.empty) {
          savedDjs.forEach(function(doc) {
            var s = doc.data();
            savedHtml += '<div style="background:#1a1a1a; border-radius:8px; padding:0.5rem; margin-bottom:0.25rem;">' + (s.djName || s.djId || 'DJ') + '</div>';
          });
        }
        if (savedHtml === '') savedHtml = '<p style="color:#888;">No saved DJs.</p>';

        var isProtected = d.protected === true;
        var founderBadge = isProtected ? '<span style="background:#22c55e; color:#fff; padding:0.4rem 0.8rem; border-radius:8px; font-size:0.85rem; font-weight:600; margin-bottom:0.5rem; display:inline-block;">Founder / Developer — protected</span>' : '';
        var adminActionsHtml = isProtected ?
          ('<div style="display:flex; flex-wrap:wrap; gap:0.5rem;">' + founderBadge + '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#ff1111;" data-admin-action="resetPassword" data-uid="' + uid + '" data-email="' + email + '" data-protected="true">Reset Password</button></div>') :
          ('<div style="display:flex; flex-wrap:wrap; gap:0.5rem;">' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:' + (banned ? '#22c55e' : '#ff3b30') + ';" data-admin-action="ban" data-uid="' + uid + '" data-banned="' + banned + '">' + (banned ? (isDJ ? 'Unsuspend DJ' : 'Unban User') : (isDJ ? 'Suspend DJ' : 'Ban User')) + '</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#ff5555; color:#000;" data-admin-action="admin" data-uid="' + uid + '">' + (isAdmin ? 'Remove Admin' : 'Promote to Admin') + '</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#22c55e;" data-admin-action="verifyClient" data-uid="' + uid + '">Verify Client (Bypass)</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#ffd860; color:#000;" data-admin-action="promoteDj" data-uid="' + uid + '">' + (isDJ ? 'Revoke DJ' : 'Promote to DJ (Bypass)') + '</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#ff1111;" data-admin-action="resetPassword" data-uid="' + uid + '" data-email="' + email + '">Reset Password</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#333;" data-admin-action="delete" data-uid="' + uid + '">Delete Account</button>' +
          '</div>');

        content.innerHTML =
          '<div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">' +
          (photo ? '<img src="' + photo + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">' : '<div style="width:64px;height:64px;border-radius:50%;background:#ff1111;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:#fff;">' + (name.charAt(0) || 'U').toUpperCase() + '</div>') +
          '<div>' +
          '<strong style="color:#fff; font-size:1.1rem;">' + name + '</strong><br>' +
          '<span style="color:#aaa;">' + email + '</span>' + (phone ? '<br><span style="color:#888;">' + phone + '</span>' : '') + '</div>' +
          '</div>' +
          '<div style="background:#1a1a1a; border-radius:12px; padding:1rem; margin-bottom:1rem;">' +
          '<p style="margin:0.25rem 0;"><strong>UID:</strong> <span style="color:#888;">' + uid + '</span></p>' +
          '<p style="margin:0.25rem 0;"><strong>Created:</strong> ' + created + '</p>' +
          '<p style="margin:0.25rem 0;"><strong>Last Login:</strong> ' + lastLogin + '</p>' +
          '<p style="margin:0.25rem 0;"><strong>Admin:</strong> ' + (isAdmin ? 'Yes' : 'No') + '</p>' +
          '<p style="margin:0.25rem 0;"><strong>Verified DJ:</strong> ' + (isDJ ? 'Yes' : 'No') + ' (' + dvStatus + ')</p>' +
          '<p style="margin:0.25rem 0;"><strong>Client Verification:</strong> ' + (isVerifiedClient ? 'Yes' : 'No') + ' (' + cvStatus + ')</p>' +
          '<p style="margin:0.25rem 0;"><strong>Banned:</strong> ' + (banned ? 'Yes' : 'No') + '</p>' +
          '</div>' +
          '<h4 style="color:#ffd860; margin:1rem 0 0.5rem;">Client Bookings</h4>' + bookingsHtml +
          '<h4 style="color:#ffd860; margin:1rem 0 0.5rem;">DJ Bookings</h4>' + djBookingsHtml +
          '<h4 style="color:#ffd860; margin:1rem 0 0.5rem;">Conversations</h4>' + convosHtml +
          '<h4 style="color:#ffd860; margin:1rem 0 0.5rem;">Saved DJs</h4>' + savedHtml +
          '<h4 style="color:#ffd860; margin:1rem 0 0.5rem;">Admin Actions</h4>' + adminActionsHtml +
          '<p id="sol-user-modal-status" class="form-status" aria-live="polite" style="margin-top:0.5rem; min-height:1.2em;"></p>';

        content.querySelectorAll('button[data-admin-action]').forEach(function(btn) {
          btn.addEventListener('click', function() { runAdminUserAction(btn); });
        });
      }).catch(function(err) {
        content.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
      });
    }

    function runAdminUserAction(btn) {
      var action = btn.getAttribute('data-admin-action');
      var uid = btn.getAttribute('data-uid');
      var statusEl = document.getElementById('sol-user-modal-status');
      if (!statusEl) return;
      statusEl.style.color = '#ffd860';
      statusEl.textContent = 'Working...';

      if (btn.getAttribute('data-protected') === 'true' && action !== 'resetPassword') {
        statusEl.style.color = '#ff1111';
        statusEl.textContent = 'This founder account is protected.';
        return;
      }

      if (action === 'ban') {
        var isBanned = btn.getAttribute('data-banned') === 'true';
        db.collection('users').doc(uid).set({ banned: !isBanned }, { merge: true }).then(function() {
          statusEl.style.color = '#22c55e';
          statusEl.textContent = isBanned ? 'User unbanned.' : 'User banned.';
          openAdminUserModal(uid);
          loadAdminUsers();
        }).catch(function(err) { statusEl.style.color = '#ff1111'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'admin') {
        var isAdmin = btn.textContent === 'Remove Admin';
        db.collection('users').doc(uid).set({ isAdmin: !isAdmin }, { merge: true }).then(function() {
          statusEl.style.color = '#22c55e';
          statusEl.textContent = isAdmin ? 'Admin removed.' : 'User is now admin.';
          openAdminUserModal(uid);
          loadAdminUsers();
        }).catch(function(err) { statusEl.style.color = '#ff1111'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'verifyClient') {
        Promise.all([
          db.collection('client-verifications').doc(uid).set({
            status: 'approved',
            bypassedByAdmin: true,
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true }),
          db.collection('users').doc(uid).set({
            isVerifiedClient: true,
            verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
          }, { merge: true })
        ]).then(function() {
          statusEl.style.color = '#22c55e';
          statusEl.textContent = 'Client verified (bypassed by admin).';
          trackSolEvent('client_verification_approved', { uid: uid, method: 'admin_bypass' });
          openAdminUserModal(uid);
        }).catch(function(err) { statusEl.style.color = '#ff1111'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'promoteDj') {
        var isRevoke = btn.textContent === 'Revoke DJ';
        var name;
        if (isRevoke) {
          var batch = db.batch();
          batch.set(db.collection('users').doc(uid), { isVerifiedDJ: false, revokedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
          batch.set(db.collection('dj-verifications').doc(uid), { status: 'revoked', revokedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
          batch.set(db.collection('dj-status').doc(uid), { isVerified: false, revokedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
          batch.set(db.collection('djs').doc(uid), { isVerified: false, status: 'revoked' }, { merge: true });
          batch.commit().then(function() {
            statusEl.style.color = '#22c55e';
            statusEl.textContent = 'DJ status revoked.';
            trackSolEvent('dj_revoked', { uid: uid });
            openAdminUserModal(uid);
            loadAdminUsers();
          }).catch(function(err) { statusEl.style.color = '#ff1111'; statusEl.textContent = err.message; });
          return;
        }
        db.collection('users').doc(uid).get().then(function(userDoc) {
          var u = userDoc.data() || {};
          name = u.displayName || u.name || u.email || 'DJ';
          var profile = {
            email: u.email || '',
            stageName: name,
            djName: name,
            status: 'approved',
            bypassedByAdmin: true,
            reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          return Promise.all([
            db.collection('dj-verifications').doc(uid).set({ status: 'approved', djProfile: profile, ...profile }, { merge: true }),
            db.collection('djs').doc(uid).set({
              uid: uid,
              name: name,
              email: u.email || '',
              isVerified: true,
              hourly_rate: 100,
              rating: 0,
              total_bookings: 0
            }, { merge: true }),
            db.collection('users').doc(uid).set({ isVerifiedDJ: true, verifiedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true })
          ]);
        }).then(function() {
          statusEl.style.color = '#22c55e';
          statusEl.textContent = 'User promoted to verified DJ (bypassed by admin).';
          trackSolEvent('dj_verification_approved', { uid: uid, method: 'admin_bypass', stage_name: name });
          trackSolEvent('dj_registration', { uid: uid, stage_name: name, method: 'admin_bypass' });
          openAdminUserModal(uid);
          loadAdminUsers();
        }).catch(function(err) { statusEl.style.color = '#ff1111'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'resetPassword') {
        var email = btn.getAttribute('data-email');
        if (!email) {
          statusEl.style.color = '#ff1111';
          statusEl.textContent = 'No email on file.';
          return;
        }
        auth.sendPasswordResetEmail(email, {
          url: 'https://djweirdnasty.com/reset-password.html',
          handleCodeInApp: true
        }).then(function() {
          statusEl.style.color = '#22c55e';
          statusEl.textContent = 'Password reset email sent.';
        }).catch(function(err) { statusEl.style.color = '#ff1111'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'delete') {
        if (!confirm('Delete this user account and all related data? This cannot be undone.')) {
          statusEl.textContent = '';
          return;
        }
        Promise.all([
          db.collection('users').doc(uid).delete(),
          db.collection('client-verifications').doc(uid).delete(),
          db.collection('dj-verifications').doc(uid).delete(),
          db.collection('dj-status').doc(uid).delete(),
          db.collection('djs').doc(uid).delete()
        ]).then(function() {
          closeAdminUserModal();
          loadAdminUsers();
        }).catch(function(err) { statusEl.style.color = '#ff1111'; statusEl.textContent = err.message; });
      }
    }

    function buildPaypalPayoutUrl(paypalInfo, amount) {
      if (!paypalInfo) return null;
      var val = paypalInfo.trim();
      var amt = amount.toFixed(2);
      if (val.indexOf('@') !== -1) {
        return 'https://www.paypal.com/myaccount/transfer/homepage/pay?recipient=' + encodeURIComponent(val) + '&amount=' + amt;
      }
      var username = val.replace(/^https?:\/\/(www\.)?paypal\.me\//i, '').replace(/^paypal\.me\//i, '').replace(/^@/, '');
      return 'https://paypal.me/' + encodeURIComponent(username) + '/' + amt;
    }

    function isPaypalEmail(paypalInfo) {
      return !!paypalInfo && paypalInfo.indexOf('@') !== -1;
    }

    // Mirrors the server-side computeBookingPayout in functions/index.js, for display only.
    // Deposit share is payable once a DJ accepts (confirmed); remaining balance share once completed.
    // NOTE: keep this formula in sync with computeBookingPayout() in
    // functions/index.js and the deposit-info display near sol-deposit-toggle below.
    function computeBookingPayoutClient(b) {
      var total = Number(b.totalAmount || b.total_cost || 0);
      var depositOnly = !!b.deposit_only;
      var depositAmount = depositOnly ? Math.max(50, Math.round(total * 0.5 * 100) / 100) : 0;
      var djDepositShare = Math.round(depositAmount * 0.85 * 100) / 100;
      var djFinalShare = Math.round((total - depositAmount) * 0.85 * 100) / 100;

      var depositEligible = depositOnly && (b.status === 'confirmed' || b.status === 'completed');
      var finalEligible = b.status === 'completed';

      var legacyPaid = !!b.payoutSent;
      var depositPaid = legacyPaid || !!b.depositPayoutSent;
      var finalPaid = legacyPaid || !!b.finalPayoutSent;

      var owedDeposit = depositEligible && !depositPaid ? djDepositShare : 0;
      var owedFinal = finalEligible && !finalPaid ? djFinalShare : 0;
      var earnedTotal = (depositEligible ? djDepositShare : 0) + (finalEligible ? djFinalShare : 0);

      return { owed: owedDeposit + owedFinal, earned: earnedTotal };
    }

    function loadAdminEarnings() {
      var earningsList = document.getElementById('sol-admin-earnings-list');
      earningsList.innerHTML = '<p style="color:#888;">Loading earnings...</p>';
      loadAdminMergeDjs();
      db.collection('bookings').where('status', 'in', ['confirmed', 'completed']).get()
        .then(function(snapshot) {
          var gross = 0;
          var djEarnings = {};
          snapshot.forEach(function(doc) {
            var b = doc.data();
            var djId = b.djId;
            if (!djId) return;
            var djName = b.djName || 'Unknown DJ';
            var payout = computeBookingPayoutClient(b);

            if (!djEarnings[djId]) djEarnings[djId] = { name: djName, total: 0, gigs: 0, unpaidTotal: 0 };
            djEarnings[djId].total += payout.earned;
            djEarnings[djId].unpaidTotal += payout.owed;
            if (b.status === 'completed') djEarnings[djId].gigs++;

            if (b.status === 'completed') gross += Number(b.totalAmount || b.total_cost || 0);
          });
          var platformFee = gross * 0.15;
          var djPayouts = gross * 0.85;
          document.getElementById('sol-admin-gross').textContent = '$' + Math.round(gross).toLocaleString();
          document.getElementById('sol-admin-platform-fee').textContent = '$' + Math.round(platformFee).toLocaleString();
          document.getElementById('sol-admin-dj-payouts').textContent = '$' + Math.round(djPayouts).toLocaleString();
          document.getElementById('sol-admin-stat-revenue').textContent = '$' + Math.round(gross).toLocaleString();
          earningsList.innerHTML = '';
          var entries = Object.keys(djEarnings).map(function(k) { return { id: k, ...djEarnings[k] }; });
          entries.sort(function(a, b) { return b.total - a.total; });
          if (entries.length === 0) {
            earningsList.innerHTML = '<p style="color:#888; text-align:center;">No confirmed or completed bookings yet.</p>';
            return;
          }

          var djIds = entries.map(function(e) { return e.id; });
          var djLookups = djIds.map(function(id) {
            return db.collection('djs').doc(id).get().then(function(doc) {
              var d = doc.exists ? doc.data() : {};
              return { id: id, paypal: d.paypal || '', stripeAccountId: d.stripeAccountId || '' };
            }).catch(function() { return { id: id, paypal: '', stripeAccountId: '' }; });
          });

          Promise.all(djLookups).then(function(results) {
            var djPayoutMap = {};
            results.forEach(function(r) { djPayoutMap[r.id] = r; });

            entries.forEach(function(e) {
              var card = document.createElement('div');
              card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;';
              var djPayout = djPayoutMap[e.id] || {};
              var paypalInfo = djPayout.paypal || '';
              var hasStripe = !!(djPayout.stripeAccountId || '').trim();

              var payBtnHtml;
              if (e.unpaidTotal <= 0) {
                payBtnHtml = '<span style="display:inline-block; margin-top:0.4rem; font-size:0.75rem; color:#22c55e;">✅ All paid</span>';
              } else if (hasStripe) {
                payBtnHtml = '<button type="button" class="submit-btn sol-auto-payout-btn" data-dj-id="' + e.id + '" style="display:inline-block; margin-top:0.4rem; background:#635bff; color:#fff; padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:8px;">Pay $' + e.unpaidTotal.toFixed(2) + ' via Stripe</button>';
              } else if (paypalInfo) {
                var payoutUrl = buildPaypalPayoutUrl(paypalInfo, e.unpaidTotal);
                payBtnHtml = '<a href="' + payoutUrl + '" target="_blank" rel="noopener" class="submit-btn" style="display:inline-block; margin-top:0.4rem; background:#0070ba; color:#fff; text-decoration:none; padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:8px;">Pay via PayPal (manual)</a>';
              } else {
                payBtnHtml = '<span style="display:inline-block; margin-top:0.4rem; font-size:0.75rem; color:#ffd860;" title="This DJ has not connected Stripe yet.">🔒 $' + e.unpaidTotal.toFixed(2) + ' held in platform account until DJ connects Stripe</span>';
              }

              var manualBtnHtml = e.unpaidTotal > 0
                ? ' <button type="button" class="sol-manual-paid-btn" data-dj-id="' + e.id + '" title="You already sent this money yourself (Send Money, cash, Zelle...) — mark it paid so it can\'t double-pay." style="display:inline-block; margin-top:0.4rem; background:transparent; color:#aaa; border:1px solid #555; padding:0.4rem 0.8rem; font-size:0.75rem; border-radius:8px; cursor:pointer;">Mark manual paid</button>'
                : '';

              card.innerHTML = '<div><strong>' + escapeHtml(e.name) + '</strong><br><span style="font-size:0.85rem; color:#aaa;">' + e.gigs + ' gigs completed</span></div>' +
                '<div style="text-align:right;"><span style="font-size:1.2rem; font-weight:700; color:#ffd860;">$' + e.total.toFixed(2) + '</span><br><span style="font-size:0.8rem; color:#666;">earnings (85%)</span><br>' + payBtnHtml + manualBtnHtml + '</div>';
              earningsList.appendChild(card);
            });

            earningsList.querySelectorAll('.sol-auto-payout-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var djId = btn.getAttribute('data-dj-id');
                if (!confirm('Send the outstanding Stripe payout to this DJ now? This cannot be undone.')) return;

                var original = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Sending...';

                var sendDjPayout = functions.httpsCallable('sendDjPayout');
                sendDjPayout({ djId: djId })
                  .then(function(result) {
                    btn.textContent = '✅ Sent $' + (result.data && result.data.amount ? result.data.amount.toFixed(2) : '');
                    btn.style.background = '#22c55e';
                    setTimeout(function() { loadAdminEarnings(); }, 1500);
                  })
                  .catch(function(err) {
                    btn.disabled = false;
                    btn.textContent = original;
                    alert('Payout failed: ' + (err.message || 'Unknown error'));
                  });
              });
            });

            earningsList.querySelectorAll('.sol-manual-paid-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var djId = btn.getAttribute('data-dj-id');
                var note = prompt('Record an offline payout for this DJ (you already sent the money yourself — e.g. PayPal Send Money, cash, Zelle). Optional note:');
                if (note === null) return;
                if (!confirm('Mark ALL outstanding earnings for this DJ as PAID? Only do this after the money actually reached them.')) return;

                btn.disabled = true;
                btn.textContent = 'Recording...';

                var markPaid = functions.httpsCallable('markDjPayoutManual');
                markPaid({ djId: djId, note: note })
                  .then(function() {
                    setTimeout(function() { loadAdminEarnings(); }, 800);
                  })
                  .catch(function(err) {
                    btn.disabled = false;
                    btn.textContent = 'Mark manual paid';
                    alert('Failed: ' + (err.message || 'Unknown error'));
                  });
              });
            });
          });
        })
        .catch(function(err) {
          earningsList.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
        });
    }

    // ===== Admin: push suggested songs to DJs via Apple Music links =====
    function parseAppleMusicTrackId(url) {
      var m = url.match(/[?&]i=(\d+)/);              // album link with track param
      if (m) return m[1];
      m = url.match(/music\.apple\.com\/[^/]+\/song\/[^/]*?(\d{6,})/);  // song page
      if (m) return m[1];
      m = url.match(/\/(\d{6,})(?:[/?#]|$)/);        // any trailing numeric id
      return m ? m[1] : null;
    }

    function loadAdminSongs() {
      var list = document.getElementById('sol-admin-song-list');
      if (!list) return;
      list.innerHTML = '<p style="color:#888;">Loading...</p>';
      db.collection('songSuggestions').orderBy('createdAt', 'desc').get()
        .then(function(snap) {
          list.innerHTML = '';
          if (snap.empty) {
            list.innerHTML = '<p style="color:#888;">No suggested songs yet — add one with an Apple Music link above.</p>';
            return;
          }
          snap.forEach(function(doc) {
            var s = doc.data();
            var row = document.createElement('div');
            row.style.cssText = 'display:flex; align-items:center; gap:0.75rem; background:#111; border:1px solid #333; border-radius:10px; padding:0.6rem 0.75rem;';
            var art = s.artworkUrl
              ? '<img src="' + escapeAttr(s.artworkUrl) + '" alt="" style="width:44px; height:44px; border-radius:8px; object-fit:cover;">'
              : '<div style="width:44px; height:44px; border-radius:8px; background:#222; display:flex; align-items:center; justify-content:center;">🎵</div>';
            row.innerHTML = art +
              '<div style="flex:1; min-width:0;"><strong style="font-size:0.9rem;">' + escapeHtml(s.title || 'Untitled') + '</strong>' +
              '<div style="font-size:0.8rem; color:#aaa;">' + escapeHtml(s.artist || '') + '</div>' +
              (s.note ? '<div style="font-size:0.75rem; color:#888; font-style:italic;">' + escapeHtml(s.note) + '</div>' : '') + '</div>' +
              '<button type="button" class="sol-admin-song-del" data-id="' + escapeAttr(doc.id) + '" style="background:transparent; border:1px solid #ff5555; color:#ff5555; border-radius:8px; padding:0.3rem 0.6rem; font-size:0.75rem; cursor:pointer;">Remove</button>';
            list.appendChild(row);
          });
          list.querySelectorAll('.sol-admin-song-del').forEach(function(btn) {
            btn.addEventListener('click', function() {
              if (!confirm('Remove this song from every DJ\'s suggestion queue?')) return;
              db.collection('songSuggestions').doc(btn.getAttribute('data-id')).delete()
                .then(loadAdminSongs)
                .catch(function(err) { alert('Remove failed: ' + err.message); });
            });
          });
        })
        .catch(function(err) {
          list.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
        });
    }

    var addSongBtn = document.getElementById('sol-admin-song-add');
    if (addSongBtn) {
      addSongBtn.addEventListener('click', function() {
        var urlEl = document.getElementById('sol-admin-song-url');
        var noteEl = document.getElementById('sol-admin-song-note');
        var st = document.getElementById('sol-admin-song-status');
        var url = (urlEl.value || '').trim();
        var trackId = parseAppleMusicTrackId(url);
        if (!trackId) {
          st.style.color = '#ff5555';
          st.textContent = 'That does not look like an Apple Music song link. Copy the link from Apple Music (Share → Copy Link on the song).';
          return;
        }
        addSongBtn.disabled = true;
        st.style.color = '#888';
        st.textContent = 'Looking up track...';
        var note = (noteEl.value || '').trim() || null;
        var uid = auth.currentUser ? auth.currentUser.uid : 'admin';
        fetch('https://itunes.apple.com/lookup?id=' + trackId)
          .then(function(r) { return r.json(); })
          .then(function(d) {
            var t = d.results && d.results[0];
            if (!t) throw new Error('Nothing found for that link.');
            if (t.wrapperType === 'track') return [t];
            // Album/single link — resolve its tracks.
            if (t.wrapperType === 'collection' || t.collectionId) {
              st.textContent = 'Album found — loading its songs...';
              return fetch('https://itunes.apple.com/lookup?id=' + trackId + '&entity=song&limit=15')
                .then(function(r) { return r.json(); })
                .then(function(d2) {
                  var tracks = (d2.results || []).filter(function(x) { return x.wrapperType === 'track'; });
                  if (!tracks.length) throw new Error('That album has no playable songs.');
                  return tracks;
                });
            }
            throw new Error('No song found for that link.');
          })
          .then(function(tracks) {
            return db.collection('songSuggestions').where('itunesTrackId', 'in', tracks.slice(0, 10).map(function(t) { return String(t.trackId); })).get()
              .then(function(existing) {
                var seen = {};
                existing.forEach(function(doc) { seen[doc.data().itunesTrackId] = true; });
                var adds = tracks.filter(function(t) { return !seen[String(t.trackId)]; });
                if (!adds.length) throw new Error('Already added — those songs are in the queue.');
                return Promise.all(adds.map(function(t) {
                  return db.collection('songSuggestions').add({
                    title: t.trackName || 'Untitled',
                    artist: t.artistName || '',
                    appleMusicUrl: url,
                    itunesTrackId: String(t.trackId),
                    previewUrl: t.previewUrl || null,
                    artworkUrl: t.artworkUrl100 || null,
                    note: note,
                    createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                    createdBy: uid
                  });
                })).then(function() { return adds; });
              });
          })
          .then(function(adds) {
            st.style.color = '#22c55e';
            st.textContent = '✅ Added ' + adds.length + ' song' + (adds.length > 1 ? 's' : '') + ' — DJs will see it in their console queue.';
            urlEl.value = '';
            noteEl.value = '';
            addSongBtn.disabled = false;
            loadAdminSongs();
          })
          .catch(function(err) {
            st.style.color = '#ff5555';
            st.textContent = 'Failed: ' + err.message;
            addSongBtn.disabled = false;
          });
      });
    }

    var testPayoutBtn = document.getElementById('sol-admin-test-payout');
    if (testPayoutBtn) {
      testPayoutBtn.addEventListener('click', function() {
        var st = document.getElementById('sol-admin-test-payout-status');
        if (!confirm('Create a $1 test booking for YOUR DJ profile, mark it completed, and fire the real auto-payout? This pays out ALL unpaid earnings for that DJ (to its Stripe account).')) return;
        testPayoutBtn.disabled = true;
        testPayoutBtn.textContent = 'Testing…';
        if (st) { st.style.color = '#ffd860'; st.textContent = 'Creating test booking and completing it…'; }
        firebase.functions().httpsCallable('adminTestPayout')({})
          .then(function(res) {
            if (st) { st.style.color = '#22c55e'; st.textContent = '✓ Test booking ' + (res.data && res.data.bookingId) + ' completed — check Stripe for the payout (may take a few seconds).'; }
          })
          .catch(function(err) {
            if (st) { st.style.color = '#ff1111'; st.textContent = 'Failed: ' + (err.message || 'Unknown error'); }
          })
          .finally(function() {
            testPayoutBtn.disabled = false;
            testPayoutBtn.textContent = '🧪 Test Auto-Payout ($1 booking → $0.85 to my Stripe)';
          });
      });
    }

    function loadAdminMergeDjs() {
      var fromSel = document.getElementById('sol-merge-from');
      var toSel = document.getElementById('sol-merge-to');
      if (!fromSel || !toSel) return;
      fromSel.innerHTML = '<option value="">Select duplicate DJ</option>';
      toSel.innerHTML = '<option value="">Select main DJ</option>';
      db.collection('djs').orderBy('name').get().then(function(snapshot) {
        snapshot.forEach(function(doc) {
          var d = doc.data();
          var name = d.name || d.stageName || 'Unknown DJ';
          var option = document.createElement('option');
          option.value = doc.id;
          option.textContent = name + ' (' + doc.id + ')';
          fromSel.appendChild(option);
          toSel.appendChild(option.cloneNode(true));
        });
      }).catch(function() {});
    }

    function mergeDjs() {
      if (!isAdmin) { alert('Admin only.'); return; }
      var fromSel = document.getElementById('sol-merge-from');
      var toSel = document.getElementById('sol-merge-to');
      var fromUid = fromSel ? fromSel.value : '';
      var toUid = toSel ? toSel.value : '';
      if (!fromUid || !toUid || fromUid === toUid) { alert('Select two different DJs.'); return; }
      var fromName = fromSel.options[fromSel.selectedIndex].text.split(' (')[0];
      var toName = toSel.options[toSel.selectedIndex].text.split(' (')[0];
      if (!confirm('Merge ALL data from ' + fromName + ' into ' + toName + '? This permanently deletes the duplicate DJ account.')) return;
      var typed = window.prompt('Type MERGE to confirm:');
      if (typed !== 'MERGE') { alert('Cancelled.'); return; }
      var statusEl = document.getElementById('sol-merge-status');
      statusEl.textContent = 'Merging...';
      statusEl.style.color = '#ffd860';

      function commitOps(ops) {
        var BATCH = 400;
        var chunks = [];
        for (var i = 0; i < ops.length; i += BATCH) {
          chunks.push(ops.slice(i, i + BATCH));
        }
        var results = chunks.map(function(chunk) {
          var batch = db.batch();
          chunk.forEach(function(op) {
            if (op.type === 'set') batch.set(op.ref, op.data, op.options || { merge: true });
            else if (op.type === 'update') batch.update(op.ref, op.data);
            else if (op.type === 'delete') batch.delete(op.ref);
          });
          return batch.commit();
        });
        return Promise.all(results);
      }

      Promise.all([
        db.collection('djs').doc(fromUid).get(),
        db.collection('djs').doc(toUid).get(),
        db.collection('dj-verifications').doc(fromUid).get(),
        db.collection('dj-verifications').doc(toUid).get(),
        db.collection('dj-availability').doc(fromUid).get(),
        db.collection('dj-availability').doc(toUid).get(),
        db.collection('dj-galleries').doc(fromUid).get(),
        db.collection('dj-galleries').doc(toUid).get(),
        db.collection('dj-status').doc(fromUid).get(),
        db.collection('dj-status').doc(toUid).get(),
        db.collection('users').doc(fromUid).get(),
        db.collection('users').doc(toUid).get()
      ]).then(function(results) {
        var sourceDjs = results[0].exists ? results[0].data() : {};
        var targetDjs = results[1].exists ? results[1].data() : {};
        var sourceVerify = results[2].exists ? results[2].data() : {};
        var targetVerify = results[3].exists ? results[3].data() : {};
        var sourceAvail = results[4].exists ? results[4].data() : {};
        var targetAvail = results[5].exists ? results[5].data() : {};
        var sourceGallery = results[6].exists ? results[6].data() : {};
        var targetGallery = results[7].exists ? results[7].data() : {};
        var sourceStatus = results[8].exists ? results[8].data() : {};
        var targetStatus = results[9].exists ? results[9].data() : {};
        var sourceUser = results[10].exists ? results[10].data() : {};
        var targetUser = results[11].exists ? results[11].data() : {};

        var ops = [];
        ops.push({ type: 'set', ref: db.collection('djs').doc(toUid), data: Object.assign({}, sourceDjs, targetDjs), options: { merge: true } });

        var mergedUser = Object.assign({}, sourceUser, targetUser);
        mergedUser.isVerifiedDJ = mergedUser.isVerifiedDJ || sourceUser.isVerifiedDJ;
        if (sourceUser.roles && Array.isArray(sourceUser.roles)) {
          mergedUser.roles = Array.from(new Set((mergedUser.roles || []).concat(sourceUser.roles)));
        }
        if (sourceUser.role && !mergedUser.role) mergedUser.role = sourceUser.role;
        ops.push({ type: 'set', ref: db.collection('users').doc(toUid), data: mergedUser, options: { merge: true } });

        if (sourceVerify.status === 'approved' && targetVerify.status !== 'approved') {
          ops.push({ type: 'set', ref: db.collection('dj-verifications').doc(toUid), data: { status: 'approved', approvedAt: sourceVerify.approvedAt || new Date() }, options: { merge: true } });
        } else if (sourceVerify.status && !targetVerify.status) {
          ops.push({ type: 'set', ref: db.collection('dj-verifications').doc(toUid), data: sourceVerify, options: { merge: true } });
        }
        ops.push({ type: 'delete', ref: db.collection('dj-verifications').doc(fromUid) });

        var mergedBlocked = Array.from(new Set((targetAvail.blockedDates || []).concat(sourceAvail.blockedDates || [])));
        ops.push({ type: 'set', ref: db.collection('dj-availability').doc(toUid), data: { blockedDates: mergedBlocked }, options: { merge: true } });
        ops.push({ type: 'delete', ref: db.collection('dj-availability').doc(fromUid) });

        var mergedPhotos = Array.from(new Set((targetGallery.photos || []).concat(sourceGallery.photos || [])));
        ops.push({ type: 'set', ref: db.collection('dj-galleries').doc(toUid), data: { photos: mergedPhotos }, options: { merge: true } });
        ops.push({ type: 'delete', ref: db.collection('dj-galleries').doc(fromUid) });

        ops.push({ type: 'set', ref: db.collection('dj-status').doc(toUid), data: Object.assign({}, sourceStatus, targetStatus), options: { merge: true } });
        ops.push({ type: 'delete', ref: db.collection('dj-status').doc(fromUid) });

        return db.collection('bookings').where('djId', '==', fromUid).get().then(function(bookingsSnap) {
          bookingsSnap.forEach(function(doc) {
            ops.push({ type: 'update', ref: doc.ref, data: { djId: toUid, djName: targetDjs.name || targetDjs.stageName || toName } });
          });
          return Promise.all([
            db.collection('tips').where('djId', '==', fromUid).get(),
            db.collection('disputes').where('djId', '==', fromUid).get(),
            db.collection('feedback').where('djId', '==', fromUid).get(),
            db.collection('saved-djs').where('djId', '==', fromUid).get()
          ]);
        }).then(function(snaps) {
          snaps[0].forEach(function(doc) { ops.push({ type: 'update', ref: doc.ref, data: { djId: toUid } }); });
          snaps[1].forEach(function(doc) { ops.push({ type: 'update', ref: doc.ref, data: { djId: toUid } }); });
          snaps[2].forEach(function(doc) { ops.push({ type: 'update', ref: doc.ref, data: { djId: toUid } }); });
          snaps[3].forEach(function(doc) { ops.push({ type: 'update', ref: doc.ref, data: { djId: toUid, djName: targetDjs.name || targetDjs.stageName || toName } }); });
          ops.push({ type: 'delete', ref: db.collection('djs').doc(fromUid) });
          ops.push({ type: 'delete', ref: db.collection('users').doc(fromUid) });
          return commitOps(ops);
        });
      }).then(function() {
        statusEl.textContent = 'Merged successfully. Refresh to see changes.';
        statusEl.style.color = '#22c55e';
        loadAdminEarnings();
        loadAdminUsers();
      }).catch(function(err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.style.color = '#ff3b30';
      });
    }

    document.getElementById('sol-merge-djs').addEventListener('click', mergeDjs);

    document.getElementById('sol-admin-add-dj-form').addEventListener('submit', function(e) {
      e.preventDefault();
      var statusEl = document.getElementById('sol-admin-status');
      statusEl.textContent = 'Adding DJ...';
      statusEl.style.color = '#ffd860';
      var genres = document.getElementById('sol-add-dj-genres').value.split(',').map(function(s) { return s.trim(); }).filter(Boolean);
      var djData = {
        stageName: document.getElementById('sol-add-dj-name').value.trim(),
        email: document.getElementById('sol-add-dj-email').value.trim(),
        phone: document.getElementById('sol-add-dj-phone').value.trim(),
        paypal: document.getElementById('sol-add-dj-paypal').value.trim(),
        city: document.getElementById('sol-add-dj-city').value.trim(),
        state: document.getElementById('sol-add-dj-state').value.trim(),
        genres: genres,
        hourlyRate: parseFloat(document.getElementById('sol-add-dj-rate').value) || 0,
        bio: document.getElementById('sol-add-dj-bio').value.trim(),
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      var newId = db.collection('djs').doc().id;
      db.collection('dj-verifications').doc(newId).set({
        status: 'approved',
        djProfile: djData,
        email: djData.email,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        db.collection('djs').doc(newId).set(djData, { merge: true });
        statusEl.textContent = 'DJ added successfully!';
        statusEl.style.color = '#22c55e';
        document.getElementById('sol-admin-add-dj-form').reset();
        loadAdminDJs();
        setTimeout(function() { statusEl.textContent = ''; }, 4000);
      }).catch(function(err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.style.color = '#ff1111';
      });
    });

    function loadAdminDisputes() {
      var list = document.getElementById('sol-admin-disputes-list');
      list.innerHTML = '<p style="color:#888;">Loading disputes...</p>';
      db.collection('disputes').orderBy('createdAt', 'desc').limit(50).onSnapshot(function(snapshot) {
        list.innerHTML = '';
        if (snapshot.empty) {
          list.innerHTML = '<p style="color:#888; text-align:center;">No disputes filed.</p>';
          return;
        }
        snapshot.forEach(function(doc) {
          var d = doc.data();
          var statusColor = d.status === 'open' ? '#ff3b30' : d.status === 'resolved' ? '#22c55e' : '#ffd860';
          var typeLabels = {
            no_show: "DJ didn't show up", late: 'DJ was late',
            equipment: 'Equipment issues', unprofessional: 'Unprofessional behavior',
            refund: 'Refund request', other: 'Other'
          };
          var card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem;';
          card.innerHTML = '<div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">' +
            '<strong>' + escapeHtml(typeLabels[d.type] || d.type || 'Unknown') + '</strong>' +
            '<span style="color:' + statusColor + '; font-size:0.85rem;">' + escapeHtml(d.status || 'open') + '</span></div>' +
            '<div style="color:#ccc; font-size:0.85rem; margin-bottom:0.5rem;">' +
            '<div>From: ' + escapeHtml(d.clientEmail || 'Unknown') + '</div>' +
            '<div>Booking: ' + escapeHtml((d.bookingId || '').substring(0, 12)) + '...</div></div>' +
            '<p style="color:#aaa; font-size:0.85rem; margin-bottom:0.75rem;">' + escapeHtml(d.description || '').replace(/\n/g, '<br>') + '</p>' +
            (d.status === 'open' ?
              '<div style="display:flex; gap:0.5rem;">' +
              '<button type="button" class="submit-btn" style="flex:1; background:#22c55e;" data-resolve-dispute="' + escapeAttr(doc.id) + '" data-resolution="resolved">Resolve</button>' +
              '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-resolve-dispute="' + escapeAttr(doc.id) + '" data-resolution="rejected">Reject</button>' +
              '</div>' : '');
          list.appendChild(card);
        });
        list.querySelectorAll('button[data-resolve-dispute]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var did = btn.getAttribute('data-resolve-dispute');
            var resolution = btn.getAttribute('data-resolution');
            db.collection('disputes').doc(did).set({
              status: resolution,
              resolvedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(function() {
              adminStatus.textContent = 'Dispute ' + resolution + '.';
              adminStatus.style.color = resolution === 'resolved' ? '#22c55e' : '#ff3b30';
              setTimeout(function() { adminStatus.textContent = ''; }, 3000);
            });
          });
        });
      }, function(err) {
        list.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
      });
    }

    // ---------- DJ Dashboard Layout ----------
    // Reorganizes the DJ console's existing sections into the sidebar/panel
    // dashboard design. Runs once — every existing element keeps its id and
    // wiring, it only gets re-parented into a .dash-panel card.
    var dashMsgBadgeUnsub = null;

    function buildDjDashboard() {
      var grid = document.getElementById('sol-dash-grid');
      if (!grid || grid.dataset.built) return;
      grid.dataset.built = '1';

      var rail = document.getElementById('sol-dash-rail');
      var TITLE_MAP = {
        'booking requests': 'BOOKING REQUESTS',
        'upcoming events': 'UPCOMING GIGS',
        'client conversations': 'LIVE CHAT',
        'dj profile & verification': 'EDIT PROFILE',
        'availability calendar': 'AVAILABILITY',
        'photo gallery': 'MEDIA GALLERY',
        'videos': 'VIDEOS',
        'my earnings': 'MY EARNINGS',
        'waitlist': 'WAITLIST',
        'booking calendar': 'BOOKING CALENDAR',
        'my upcoming gigs': 'MY GIGS',
        'setlist & timeline builder': 'SETLIST & TIMELINE',
        'analytics dashboard': 'PERFORMANCE',
        'review a client': 'REVIEW A CLIENT'
      };

      function makePanel(title, beforeEl) {
        var p = document.createElement('section');
        p.className = 'dash-panel';
        var header = document.createElement('div');
        header.className = 'panel-header';
        var h = document.createElement('h3');
        h.className = 'panel-title';
        h.textContent = title;
        header.appendChild(h);
        p.appendChild(header);
        grid.insertBefore(p, beforeEl);
        return p;
      }

      var kids = Array.prototype.slice.call(grid.children);
      var panel = null;
      var railPanels = [];

      kids.forEach(function(el) {
        // Stats block -> rail "AT A GLANCE"
        if (el.querySelector && el.querySelector('#sol-dj-stat-pending')) {
          var glance = makePanel('AT A GLANCE', el);
          el.classList.add('sol-kpi-cards');
          glance.appendChild(el);
          railPanels.push({ key: '#sol-dj-stat-pending', panel: glance });
          panel = null;
          return;
        }
        // Event map -> its own panel in the main grid
        if (el.id === 'sol-dj-event-map-section') {
          var mapPanel = makePanel('EVENT LOCATION', el);
          mapPanel.appendChild(el);
          panel = null;
          return;
        }
        // DJ profile card -> rail "PROFILE & VERIFICATION"
        if (el.id === 'sol-dj-profile') {
          var profPanel = makePanel('PROFILE & VERIFICATION', el);
          profPanel.appendChild(el);
          railPanels.push({ key: '#sol-dj-profile', panel: profPanel });
          panel = null;
          return;
        }
        var isH3 = el.tagName === 'H3';
        if (isH3 || !panel) {
          var title = isH3 ? (TITLE_MAP[el.textContent.trim().toLowerCase()] || el.textContent.trim()) : 'STATUS & LOCATION';
          panel = makePanel(title, el);
          if (isH3 && /my earnings|analytics/i.test(el.textContent)) {
            railPanels.push({ key: /earnings/i.test(el.textContent) ? '#sol-dj-earnings' : '#sol-dj-analytics', panel: panel });
          }
          if (isH3) el.remove();
        }
        if (!isH3) panel.appendChild(el);
      });

      // Move rail panels into the right rail, ordered to match the design.
      if (rail) {
        var order = ['#sol-dj-stat-pending', '#sol-dj-earnings', '#sol-dj-analytics', '#sol-dj-profile'];
        order.forEach(function(key) {
          railPanels.forEach(function(rp) {
            if (rp.key === key) rail.appendChild(rp.panel);
          });
        });
        var quick = document.createElement('section');
        quick.className = 'dash-panel';
        quick.innerHTML = '<div class="panel-header"><h3 class="panel-title">QUICK LINKS</h3></div>' +
          '<div class="sol-quick-links">' +
          '<a href="javascript:void(0)" data-dash-link="sol-dj-setup">♙ My Profile</a>' +
          '<a href="javascript:void(0)" data-dash-link="sol-dj-payout-box">$ Payouts (Stripe)</a>' +
          '<a href="javascript:void(0)" data-dash-link="sol-dj-instagram">▧ Socials</a>' +
          '<a href="javascript:void(0)" data-dash-link="sol-dj-verify-status">✓ Verification</a>' +
          '</div>';
        rail.appendChild(quick);
      }

      // Wrap each panel's content in a scrollable body + add an expand button.
      document.querySelectorAll('#sol-dj-console .dash-panel').forEach(function(p) {
        var header = p.querySelector('.panel-header');
        var body = document.createElement('div');
        body.className = 'dash-panel-body';
        Array.prototype.slice.call(p.children).forEach(function(ch) {
          if (ch !== header) body.appendChild(ch);
        });
        p.appendChild(body);
        if (header && !header.querySelector('.panel-expand')) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'panel-expand';
          btn.title = 'Enlarge';
          btn.textContent = '⤢';
          btn.addEventListener('click', function(e) { e.stopPropagation(); openDashWindow(p); });
          header.appendChild(btn);
        }
      });

      // Capture main panels in order, then distribute into independent
      // columns so each column packs tightly (masonry-style).
      grid._panels = Array.prototype.slice.call(grid.querySelectorAll(':scope > .dash-panel'));
      layoutDashCols();
      if (!grid.dataset.colWired) {
        grid.dataset.colWired = '1';
        var rzT;
        window.addEventListener('resize', function() { clearTimeout(rzT); rzT = setTimeout(layoutDashCols, 200); });
      }

      wireDashChrome();
      syncDashIdentity();
      updateDashBadges();
    }

    function layoutDashCols() {
      var grid = document.getElementById('sol-dash-grid');
      if (!grid || !grid._panels) return;
      var w = grid.offsetWidth;
      var n = w >= 1100 ? 3 : w >= 640 ? 2 : 1;
      if (grid._colCount === n) return;
      grid._colCount = n;
      grid.innerHTML = '';
      var cols = [];
      for (var i = 0; i < n; i++) {
        var c = document.createElement('div');
        c.className = 'sol-dash-col';
        grid.appendChild(c);
        cols.push(c);
      }
      grid._panels.forEach(function(p, i) { cols[i % n].appendChild(p); });
    }

    function dashBackdrop() {
      var bd = document.getElementById('sol-dash-backdrop');
      if (!bd) {
        bd = document.createElement('div');
        bd.id = 'sol-dash-backdrop';
        bd.className = 'dash-backdrop';
        bd.addEventListener('click', closeDashWindow);
        document.body.appendChild(bd);
      }
      return bd;
    }

    function openDashWindow(panel) {
      closeDashWindow();
      panel.classList.add('dash-window-open');
      dashBackdrop().style.display = 'block';
      var header = panel.querySelector('.panel-header');
      if (header && !header.querySelector('.panel-close')) {
        var c = document.createElement('button');
        c.type = 'button';
        c.className = 'panel-close';
        c.title = 'Close';
        c.textContent = '✕';
        c.addEventListener('click', function(e) { e.stopPropagation(); closeDashWindow(); });
        header.appendChild(c);
      }
    }

    function closeDashWindow() {
      document.querySelectorAll('.dash-window-open').forEach(function(p) { p.classList.remove('dash-window-open'); });
      var bd = document.getElementById('sol-dash-backdrop');
      if (bd) bd.style.display = 'none';
    }

    function wireDashChrome() {
      // Sidebar nav — scroll to the panel containing the target element.
      var nav = document.getElementById('sol-dash-nav');
      if (nav && !nav.dataset.wired) {
        nav.dataset.wired = '1';
        nav.addEventListener('click', function(e) {
          var item = e.target.closest('.sol-nav-item');
          if (!item) return;
          nav.querySelectorAll('.sol-nav-item').forEach(function(n) { n.classList.remove('active'); });
          item.classList.add('active');
          var targetId = item.getAttribute('data-target');
          if (targetId === 'sol-dj-conversations') { openMessenger(); return; }
          if (targetId === 'dash-top') { closeDashWindow(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
          var target = document.getElementById(targetId);
          if (!target) return;
          var panel = target.closest('.dash-panel');
          if (panel) openDashWindow(panel);
          else target.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });
      }

      // Availability toggle in the header drives the real online checkbox.
      var availBtn = document.getElementById('sol-avail-toggle');
      var realToggle = document.getElementById('sol-dj-online-toggle');
      if (availBtn && realToggle && !availBtn.dataset.wired) {
        availBtn.dataset.wired = '1';
        availBtn.addEventListener('click', function() {
          realToggle.click();
        });
      }
      if (realToggle && !realToggle.dataset.availWired) {
        realToggle.dataset.availWired = '1';
        realToggle.addEventListener('change', syncAvailUI);
      }
      var notif = document.getElementById('sol-dash-notif');
      if (notif && !notif.dataset.wired) {
        notif.dataset.wired = '1';
        notif.style.cursor = 'pointer';
        notif.addEventListener('click', function() { openMessenger(); });
      }
      var statusLabel = document.getElementById('sol-dj-status-label');
      if (statusLabel && !statusLabel.dataset.availWired) {
        statusLabel.dataset.availWired = '1';
        new MutationObserver(syncAvailUI).observe(statusLabel, { childList: true, characterData: true, subtree: true });
      }
      syncAvailUI();

      // Quick links — scroll to the target field/section.
      document.querySelectorAll('.sol-quick-links a').forEach(function(a) {
        if (a.dataset.wired) return;
        a.dataset.wired = '1';
        a.addEventListener('click', function() {
          var t = document.getElementById(a.dataset.dashLink);
          if (t) {
            var p = t.closest('.dash-panel') || t;
            p.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        });
      });

      // ESC closes any open dashboard window.
      if (!wireDashChrome.escWired) {
        wireDashChrome.escWired = true;
        document.addEventListener('keydown', function(e) { if (e.key === 'Escape') closeDashWindow(); });
      }

      initDjPlayer();
    }

    // ===== Hero suggestion-queue player (30s previews via iTunes Search API) =====
    var djPlayer = { queue: [], idx: -1, playing: false, feedback: {}, audio: null, previewCache: {} };

    function buildDjQueue() {
      function shuffle(a) { return a.slice().sort(function() { return Math.random() - 0.5; }); }
      var pop = shuffle(POPULAR_SONGS), indie = shuffle(INDIE_SONGS.concat(ADMIN_SONGS)), q = [];
      var pi = 0, ii = 0;
      while (pi < pop.length || ii < indie.length) {
        if (pi < pop.length) q.push(pop[pi++]);
        if (pi < pop.length) q.push(pop[pi++]);
        if (ii < indie.length) q.push(indie[ii++]);
      }
      return q;
    }

    function currentDjTrack() { return djPlayer.queue[djPlayer.idx]; }

    function findPreview(s) {
      if (djPlayer.previewCache[s.id] !== undefined) return Promise.resolve(djPlayer.previewCache[s.id]);
      return fetch('https://itunes.apple.com/search?term=' + encodeURIComponent(s.artist + ' ' + s.title) + '&media=music&entity=song&limit=1')
        .then(function(r) { return r.json(); })
        .then(function(d) {
          var url = (d.results && d.results[0] && d.results[0].previewUrl) || null;
          djPlayer.previewCache[s.id] = url;
          return url;
        })
        .catch(function() { djPlayer.previewCache[s.id] = null; return null; });
    }

    function ensureAudio() {
      if (!djPlayer.audio) {
        djPlayer.audio = new Audio();
        djPlayer.audio.addEventListener('ended', function() { djQueueStep(1); });
        djPlayer.audio.addEventListener('error', function() { djPlayer.playing = false; syncPlayerUI(); });
      }
      return djPlayer.audio;
    }

    function syncPlayerUI() {
      var s = currentDjTrack();
      var playBtn = document.getElementById('sol-dash-play');
      var vinyl = document.getElementById('sol-dash-vinyl');
      var st = document.getElementById('sol-pl-status');
      if (playBtn) playBtn.textContent = djPlayer.playing ? 'Ⅱ' : '▶';
      if (vinyl) vinyl.classList.toggle('spinning', djPlayer.playing);
      if (st && s) st.innerHTML = (djPlayer.playing ? '▶ NOW PLAYING' : 'Ⅱ PAUSED') + (s.isIndie ? ' · ⚡ INDIE ROTATION' : '');
      var fb = s && djPlayer.feedback[s.id];
      var like = document.getElementById('sol-pl-like');
      var dis = document.getElementById('sol-pl-dislike');
      if (like) { like.classList.toggle('pl-active', fb === 'like'); like.style.opacity = fb === 'like' ? '1' : '0.7'; }
      if (dis) { dis.classList.toggle('pl-active', fb === 'dislike'); dis.style.opacity = fb === 'dislike' ? '1' : '0.7'; }
    }

    function loadDjTrack(autoplay) {
      var s = currentDjTrack();
      if (!s) return;
      var t = document.getElementById('sol-pl-title');
      var a = document.getElementById('sol-pl-artist');
      var bpm = document.getElementById('sol-pl-bpm');
      var st = document.getElementById('sol-pl-status');
      if (t) t.textContent = s.title;
      if (a) a.textContent = s.artist + ' · ' + (s.genre || '') + (s.bpm ? ' · ' + s.bpm + ' BPM' : '');
      if (bpm) bpm.textContent = s.bpm || '--';
      var audio = ensureAudio();
      audio.pause();
      audio.removeAttribute('src');
      djPlayer.playing = false;
      if (st) st.innerHTML = '⌛ LOADING PREVIEW' + (s.isIndie ? ' · ⚡ INDIE ROTATION' : '');
      syncPlayerUI();
      findPreview(s).then(function(url) {
        if (currentDjTrack() !== s) return;
        if (!url) {
          if (st) st.innerHTML = '✕ NO PREVIEW FOUND' + (s.isIndie ? ' · ⚡ INDIE ROTATION' : '');
          return;
        }
        audio.src = url;
        if (autoplay) {
          var p = audio.play();
          if (p) p.catch(function() { djPlayer.playing = false; syncPlayerUI(); });
          djPlayer.playing = true;
        }
        syncPlayerUI();
      });
    }

    function djQueueStep(step) {
      if (!djPlayer.queue.length) djPlayer.queue = buildDjQueue();
      var wasPlaying = djPlayer.playing;
      djPlayer.idx = (djPlayer.idx + step + djPlayer.queue.length) % djPlayer.queue.length;
      loadDjTrack(wasPlaying);
    }

    function sendSongFeedback(liked) {
      var s = currentDjTrack();
      var user = auth.currentUser;
      if (!s || !user) return;
      djPlayer.feedback[s.id] = liked ? 'like' : 'dislike';
      syncPlayerUI();
      db.collection('songFeedback').add({
        djId: user.uid,
        djName: user.displayName || user.email || '',
        songId: s.id,
        title: s.title,
        artist: s.artist,
        genre: s.genre || '',
        bpm: s.bpm || null,
        isIndie: !!s.isIndie,
        liked: liked,
        disliked: !liked,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).catch(function(err) { console.warn('songFeedback write failed:', err); });
    }

    function initDjPlayer() {
      if (initDjPlayer.wired) return;
      initDjPlayer.wired = true;
      djPlayer.queue = buildDjQueue();
      djPlayer.idx = 0;
      loadDjTrack(false);
      var playBtn = document.getElementById('sol-dash-play');
      var skipBtn = document.getElementById('sol-pl-skip');
      var replayBtn = document.getElementById('sol-pl-replay');
      var likeBtn = document.getElementById('sol-pl-like');
      var disBtn = document.getElementById('sol-pl-dislike');
      if (playBtn) playBtn.addEventListener('click', function() {
        var s = currentDjTrack();
        var audio = ensureAudio();
        if (!s) return;
        if (!audio.getAttribute('src')) { loadDjTrack(true); return; }
        if (audio.paused) {
          var p = audio.play();
          if (p) p.catch(function() { djPlayer.playing = false; syncPlayerUI(); });
          djPlayer.playing = true;
        } else {
          audio.pause();
          djPlayer.playing = false;
        }
        syncPlayerUI();
      });
      if (skipBtn) skipBtn.addEventListener('click', function() { djQueueStep(1); });
      if (replayBtn) replayBtn.addEventListener('click', function() {
        var audio = ensureAudio();
        if (audio.getAttribute('src')) {
          audio.currentTime = 0;
          var p = audio.play();
          if (p) p.catch(function() { djPlayer.playing = false; syncPlayerUI(); });
          djPlayer.playing = true;
          syncPlayerUI();
        } else loadDjTrack(true);
      });
      if (likeBtn) likeBtn.addEventListener('click', function() { sendSongFeedback(true); });
      if (disBtn) disBtn.addEventListener('click', function() { sendSongFeedback(false); });

      loadAdminSuggestedSongs();
    }

    // Pull admin-curated songs and splice them into the remaining queue as
    // indie picks — already-played/currently-playing tracks stay untouched.
    function loadAdminSuggestedSongs() {
      return db.collection('songSuggestions').orderBy('createdAt', 'desc').get()
        .then(function(snap) {
          ADMIN_SONGS.length = 0;
          snap.forEach(function(doc) {
            var s = doc.data();
            var song = {
              id: 'adm-' + doc.id,
              title: s.title || 'Untitled',
              artist: s.artist || '',
              genre: 'SOL Pick',
              isIndie: true,
              isAdminPick: true,
              note: s.note || null
            };
            if (s.previewUrl) djPlayer.previewCache[song.id] = s.previewUrl;
            ADMIN_SONGS.push(song);
          });

          var seen = {};
          djPlayer.queue.forEach(function(t) { seen[t.id] = true; });
          var fresh = ADMIN_SONGS.slice().sort(function() { return Math.random() - 0.5; }).filter(function(t) { return !seen[t.id]; });
          if (!fresh.length) return;
          var head = Math.max(djPlayer.idx, 0) + 1;
          var rest = djPlayer.queue.slice(head);
          fresh.forEach(function(t, i) {
            rest.splice(Math.min(rest.length, 2 + i * 3), 0, t);
          });
          djPlayer.queue = djPlayer.queue.slice(0, head).concat(rest);
        })
        .catch(function() {});
    }

    function syncAvailUI() {
      var realToggle = document.getElementById('sol-dj-online-toggle');
      var on = !!(realToggle && realToggle.checked);
      var dot = document.getElementById('sol-avail-dot');
      var txt = document.getElementById('sol-avail-text');
      var btn = document.getElementById('sol-avail-toggle');
      if (dot) dot.className = on ? 'sol-green-dot' : 'sol-gray-dot';
      if (txt) txt.textContent = on ? 'Available' : 'Offline';
      if (btn) btn.classList.toggle('on', on);
    }

    function syncDashIdentity() {
      var name = (document.getElementById('sol-dj-name') || {}).textContent || '';
      name = name.trim() || (auth.currentUser && (auth.currentUser.displayName || auth.currentUser.email)) || 'DJ';
      var avatarImg = document.getElementById('sol-dj-avatar');
      var avatarUrl = (avatarImg && avatarImg.src && avatarImg.style.display !== 'none') ? avatarImg.src : '';
      var initial = name.charAt(0).toUpperCase();
      var verified = document.getElementById('sol-dj-verified-badge');
      var isVerified = verified && verified.style.display !== 'none';

      ['sol-dash-side-name', 'sol-dash-chip-name'].forEach(function(id) {
        var el = document.getElementById(id);
        if (el) el.textContent = name;
      });
      ['sol-dash-side-avatar', 'sol-dash-chip-avatar'].forEach(function(id) {
        var el = document.getElementById(id);
        if (!el) return;
        el.innerHTML = avatarUrl
          ? initial + '<img src="' + escapeAttr(avatarUrl) + '" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" onerror="this.remove()">'
          : initial;
      });
      var v = document.getElementById('sol-dash-side-verified');
      if (v) v.style.display = isVerified ? '' : 'none';

      // Re-sync when the DJ profile finishes loading async.
      if (!syncDashIdentity.wired) {
        syncDashIdentity.wired = true;
        var mo = new MutationObserver(function() { syncDashIdentity(); });
        ['sol-dj-name', 'sol-dj-avatar', 'sol-dj-verified-badge', 'sol-dj-avatar-fallback'].forEach(function(id) {
          var el = document.getElementById(id);
          if (el) mo.observe(el, { attributes: true, childList: true, characterData: true, subtree: true });
        });
      }
    }

    function updateDashBadges() {
      var user = auth.currentUser;
      if (!user) return;
      // Bookings badge mirrors the pending-requests stat.
      var pendingEl = document.getElementById('sol-dj-stat-pending');
      if (pendingEl && !pendingEl.dataset.badgeWired) {
        pendingEl.dataset.badgeWired = '1';
        var syncPending = function() {
          var n = parseInt(pendingEl.textContent, 10) || 0;
          var b = document.getElementById('sol-nav-badge-bookings');
          if (b) { b.textContent = n; b.style.display = n ? '' : 'none'; }
        };
        new MutationObserver(syncPending).observe(pendingEl, { childList: true, characterData: true, subtree: true });
        syncPending();
      }
      // Messages badge = sum of unreadFor[uid] across the DJ's conversations.
      if (!dashMsgBadgeUnsub) {
        dashMsgBadgeUnsub = db.collection('conversations').where('djId', '==', user.uid)
          .onSnapshot(function(snap) {
            var total = 0;
            snap.forEach(function(doc) {
              var uf = doc.data().unreadFor;
              if (uf && uf[user.uid]) total += uf[user.uid];
            });
            ['sol-nav-badge-msgs', 'sol-dash-notif-badge'].forEach(function(id) {
              var el = document.getElementById(id);
              if (el) { el.textContent = total; el.style.display = total ? '' : 'none'; }
            });
          }, function() {});
      }
    }

    // ---------- Client Messages ----------
    let clientConversationsUnsubscribe = null;

    function subscribeClientConversations(user) {
      if (clientConversationsUnsubscribe) clientConversationsUnsubscribe();
      var wrap = document.getElementById('sol-client-messages-wrap');
      var box = document.getElementById('sol-client-conversations');
      if (!wrap || !box) return;
      clientConversationsUnsubscribe = db.collection('conversations')
        .where('clientId', '==', user.uid)
        .onSnapshot(function(snapshot) {
          if (snapshot.empty) {
            wrap.style.display = 'none';
            return;
          }
          wrap.style.display = '';
          box.innerHTML = '';
          var convos = [];
          snapshot.forEach(function(doc) { convos.push({ id: doc.id, data: doc.data() }); });
          convos.sort(function(a, b) { return (b.data.lastMessageTime || 0) - (a.data.lastMessageTime || 0); });
          convos.forEach(function(c) {
            var d = c.data;
            var item = document.createElement('div');
            item.style.cssText = 'background:#111; border:1px solid #333; border-radius:10px; padding:0.75rem 1rem; cursor:pointer; display:flex; justify-content:space-between; align-items:center;';
            item.innerHTML = '<span><strong>' + escapeHtml(d.djName || 'DJ') + '</strong><br><span style="font-size:0.85rem; color:#888;">' + escapeHtml(d.lastMessage || 'No messages yet') + '</span></span>' +
              (d.unreadCount ? '<span style="font-size:0.75rem; color:#ff1111;">' + d.unreadCount + ' unread</span>' : '');
            item.addEventListener('click', function() { openChat(c.id); });
            box.appendChild(item);
          });
        }, function(err) {
          console.error('Client conversations listener error:', err);
        });
    }

    // ---------- Client Bookings ----------
    let clientBookingsUnsubscribe = null;
    let rateBookingId = null;
    let rateDjId = null;
    let selectedRating = 0;

    function subscribeClientBookings(user) {
      if (clientBookingsUnsubscribe) clientBookingsUnsubscribe();
      clientBookingsUnsubscribe = db.collection('bookings')
        .where('clientId', '==', user.uid)
        .onSnapshot(function(snapshot) {
          renderClientBookings(snapshot, user);
        }, function(err) {
          console.error('Client bookings error:', err);
        });
    }

    function renderClientBookings(snapshot, user) {
      var box = document.getElementById('sol-my-bookings');
      box.innerHTML = '';
      if (snapshot.empty) {
        box.innerHTML = '<p style="color:#888; text-align:center;">No bookings yet. Book a DJ above!</p>';
        populateBookingDropdowns([]);
        return;
      }
      var bookings = [];
      snapshot.forEach(function(doc) { bookings.push({ id: doc.id, ...doc.data() }); });
      bookings.sort(function(a, b) {
        var da = parseLocalTimestamp(a.date || a.eventDate) || 0;
        var db = parseLocalTimestamp(b.date || b.eventDate) || 0;
        return db - da;
      });
      populateBookingDropdowns(bookings);
      populateAllBookingDropdowns(bookings);
      bookings.forEach(function(b) {
        var card = document.createElement('div');
        card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem;';
        var eventType = b.eventType || b.event_type || 'Event';
        var date = b.date || b.eventDate || '';
        var startTime = b.startTime || b.event_time || '';
        // DJ identity is revealed only after a DJ accepts (djId is assigned).
        // Broadcast/pending bookings show a generic label instead.
        var djName = b.djId ? (b.djName || 'DJ') : 'Awaiting DJ acceptance';
        var amount = b.totalAmount || b.total_cost || 0;
        var status = b.status || 'unknown';
        var statusColor = status === 'confirmed' ? '#22c55e' : status === 'pending' ? '#ffd860' : status === 'completed' ? '#ff5555' : '#ff3b30';
        var canCancel = status === 'pending' || status === 'confirmed';
        var canRate = status === 'completed' && !b.clientRated;
        var canMessage = status !== 'cancelled' && status !== 'pending' && b.djId;
        var djArrived = b.djArrived === true;
        var djSharing = b.djSharingLocation === true || (b.djStatus && b.djStatus.sharingLocation === true);

        // Build progress bar
        var steps = ['Requested', 'Confirmed', 'En Route', 'Arrived', 'Completed'];
        var currentStep = 0;
        if (status === 'pending') currentStep = 0;
        else if (status === 'confirmed') currentStep = djSharing ? 1 : 1;
        else if (status === 'confirmed' && djSharing) currentStep = 2;
        else if (djArrived) currentStep = 3;
        else if (status === 'completed') currentStep = 4;
        else if (status === 'cancelled') currentStep = -1;

        var progressBar = '';
        if (currentStep >= 0) {
          var dots = steps.map(function(label, i) {
            var isActive = i <= currentStep;
            var isCurrent = i === currentStep;
            var color = isActive ? (i === 4 ? '#ff5555' : i === 3 ? '#22c55e' : i === 2 ? '#ffd860' : '#ff1111') : '#333';
            var size = isCurrent ? '12px' : '10px';
            return '<div style="display:flex; flex-direction:column; align-items:center; flex:1;">' +
              '<div style="width:' + size + '; height:' + size + '; border-radius:50%; background:' + color + ';' + (isCurrent ? 'box-shadow:0 0 8px ' + color + ';' : '') + ' transition:all 0.3s;"></div>' +
              '<span style="font-size:0.65rem; color:' + (isActive ? '#ccc' : '#555') + '; margin-top:4px; text-align:center;">' + label + '</span>' +
              '</div>';
          }).join('');
          var connectors = steps.slice(0, -1).map(function(_, i) {
            var isDone = i < currentStep;
            return '<div style="flex:0.5; height:2px; background:' + (isDone ? '#ff1111' : '#333') + '; margin-top:5px; transition:background 0.3s;"></div>';
          }).join('');
          var dotsRow = '';
          for (var si = 0; si < steps.length; si++) {
            dotsRow += dots[si] ? '' : '';
          }
          // Interleave dots and connectors
          var barHtml = '<div style="display:flex; align-items:flex-start; margin:0.75rem 0;">';
          for (var si2 = 0; si2 < steps.length; si2++) {
            barHtml += '<div style="display:flex; flex-direction:column; align-items:center; flex:1;">' +
              '<div style="width:' + (si2 === currentStep ? '12px' : '10px') + '; height:' + (si2 === currentStep ? '12px' : '10px') + '; border-radius:50%; background:' + (si2 <= currentStep ? (si2 === 4 ? '#ff5555' : si2 === 3 ? '#22c55e' : si2 === 2 ? '#ffd860' : '#ff1111') : '#333') + ';' + (si2 === currentStep ? 'box-shadow:0 0 8px ' + (si2 === 4 ? '#ff5555' : si2 === 3 ? '#22c55e' : si2 === 2 ? '#ffd860' : '#ff1111') + ';' : '') + ' transition:all 0.3s;"></div>' +
              '<span style="font-size:0.65rem; color:' + (si2 <= currentStep ? '#ccc' : '#555') + '; margin-top:4px; text-align:center;">' + steps[si2] + '</span>' +
              '</div>';
            if (si2 < steps.length - 1) {
              barHtml += '<div style="flex:0.5; height:2px; background:' + (si2 < currentStep ? '#ff1111' : '#333') + '; margin-top:5px; transition:background 0.3s;"></div>';
            }
          }
          barHtml += '</div>';
          progressBar = barHtml;
        }

        var djLiveLink = '';
        if (djSharing && status === 'confirmed' && b.djId) {
          djLiveLink = '<div style="margin-top:0.5rem;"><button type="button" class="submit-btn" style="background:#22c55e; padding:0.4rem 0.8rem; font-size:0.8rem;" data-track-dj="' + escapeAttr(b.djId) + '">Track DJ Live Location</button></div>';
        }

        var dateDisplay = 'TBD';
        if (date) {
          var parts = date.split(/[-/]/);
          if (parts.length === 3) {
            dateDisplay = new Date(parseInt(parts[0],10), parseInt(parts[1],10)-1, parseInt(parts[2],10)).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
          } else {
            dateDisplay = parseLocalDate(date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' });
          }
        }

        card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
          '<strong>' + escapeHtml(eventType) + '</strong>' +
          '<span style="color:' + statusColor + '; font-size:0.85rem; font-weight:600; text-transform:capitalize;">' + escapeHtml(status) + '</span>' +
          '</div>' +
          '<div style="color:#ccc; font-size:0.9rem; line-height:1.6;">' +
          '<div>🎧 ' + escapeHtml(djName) + '</div>' +
          '<div>📅 ' + dateDisplay + (startTime ? ' at ' + escapeHtml(startTime) : '') + '</div>' +
          '<div>💰 $' + Number(amount).toLocaleString() + '</div>' +
          '</div>' +
          progressBar +
          djLiveLink +
          '<div style="display:flex; gap:0.5rem; margin-top:0.75rem;">' +
          (canMessage ? '<button type="button" class="submit-btn" style="flex:1; background:#1a1a1a; border:1px solid #ff1111; color:#ff1111;" data-message-dj="' + escapeAttr(b.id) + '" data-message-dj-id="' + escapeAttr(b.djId) + '" data-message-dj-name="' + escapeAttr(djName) + '">💬 Message DJ</button>' : '') +
          (canCancel ? '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-cancel-booking="' + escapeAttr(b.id) + '" data-booking-date="' + escapeAttr(date || '') + '">Cancel</button>' : '') +
          (canRate ? '<button type="button" class="submit-btn" style="flex:1; background:#ffd860; color:#000;" data-rate-booking="' + escapeAttr(b.id) + '" data-rate-dj="' + escapeAttr(b.djId || '') + '">Rate DJ</button>' : '') +
          '</div>';
        box.appendChild(card);
      });

      box.querySelectorAll('button[data-message-dj]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          createOrOpenConversation(
            btn.getAttribute('data-message-dj'),
            btn.getAttribute('data-message-dj-id'),
            btn.getAttribute('data-message-dj-name')
          );
        });
      });

      box.querySelectorAll('button[data-rate-booking]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          rateBookingId = btn.getAttribute('data-rate-booking');
          rateDjId = btn.getAttribute('data-rate-dj');
          selectedRating = 0;
          document.querySelectorAll('.sol-star').forEach(function(s) { s.style.color = '#444'; });
          document.getElementById('sol-rate-text').value = '';
          document.getElementById('sol-rate-modal').style.display = 'flex';
        });
      });

      box.querySelectorAll('button[data-track-dj]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var djId = btn.getAttribute('data-track-dj');
          db.collection('dj-status').doc(djId).get().then(function(doc) {
            if (doc.exists && doc.data().location) {
              var loc = doc.data().location;
              var lat = loc.latitude || loc._latitude || null;
              var lng = loc.longitude || loc._longitude || null;
              if (lat !== null && lng !== null && map) {
                map.flyTo({ center: [lng, lat], zoom: 14, essential: true });
                if (djMarkers[djId]) {
                  djMarkers[djId].togglePopup();
                } else {
                  var el = createSolPin('#22c55e', 14);
                  var m = new mapboxgl.Marker({ element: el })
                    .setLngLat([lng, lat])
                    .setPopup(new mapboxgl.Popup().setHTML('<strong>Your DJ is on the way!</strong><br>Live location tracking'))
                    .addTo(map)
                    .togglePopup();
                  djMarkers[djId] = m;
                }
                document.getElementById('sol-map').scrollIntoView({ behavior: 'smooth', block: 'center' });
              } else {
                alert('DJ location not available.');
              }
            } else {
              alert('DJ is not currently sharing their location.');
            }
          }).catch(function() {
            alert('Unable to track DJ at this time.');
          });
        });
      });
    }

    document.querySelectorAll('.sol-star').forEach(function(star) {
      star.addEventListener('click', function() {
        selectedRating = parseInt(this.getAttribute('data-val'));
        document.querySelectorAll('.sol-star').forEach(function(s) {
          s.style.color = parseInt(s.getAttribute('data-val')) <= selectedRating ? '#ffd860' : '#444';
        });
      });
    });

    document.getElementById('sol-rate-close').addEventListener('click', function() {
      document.getElementById('sol-rate-modal').style.display = 'none';
    });

    document.getElementById('sol-rate-modal').addEventListener('click', function(e) {
      if (e.target === this) this.style.display = 'none';
    });

    document.getElementById('sol-rate-submit').addEventListener('click', function() {
      if (selectedRating === 0) { alert('Please select a star rating.'); return; }
      var reviewText = document.getElementById('sol-rate-text').value.trim();
      var user = auth.currentUser;
      db.collection('feedback').add({
        fromUserId: user.uid,
        fromName: user.displayName || user.email,
        toUserId: rateDjId,
        bookingId: rateBookingId,
        type: 'dj',
        rating: selectedRating,
        review: reviewText,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        db.collection('bookings').doc(rateBookingId).set({
          clientRated: true
        }, { merge: true });
        document.getElementById('sol-rate-modal').style.display = 'none';
        var status = document.getElementById('sol-quick-status');
        status.textContent = 'Review submitted! Thank you.';
        status.style.color = '#22c55e';
        trackSolEvent('dj_review_submitted', { booking_id: rateBookingId, dj_id: rateDjId, rating: selectedRating });
        setTimeout(function() { status.textContent = ''; }, 3000);
      }).catch(function(err) {
        alert('Error: ' + err.message);
      });
    });

    // ---------- Promo Codes ----------
    var activePromo = null;
    document.getElementById('sol-promo-apply').addEventListener('click', function() {
      var code = document.getElementById('sol-promo-code').value.trim().toUpperCase();
      var statusEl = document.getElementById('sol-promo-status');
      if (!code) { statusEl.textContent = 'Enter a code.'; statusEl.style.color = '#ff1111'; return; }
      if (!auth.currentUser) { statusEl.textContent = 'Sign in to apply a promo code.'; statusEl.style.color = '#ff1111'; return; }
      var redeemPromo = firebase.functions().httpsCallable('redeemPromo');
      redeemPromo({ code: code }).then(function(result) {
        var p = result.data;
        if (!p.valid) { statusEl.textContent = 'Invalid promo code.'; statusEl.style.color = '#ff1111'; activePromo = null; return; }
        activePromo = { code: code, discount: p.discount || 0, type: p.type || 'percent' };
        var msg = p.type === 'flat' ? '$' + p.discount + ' off!' : p.discount + '% off!';
        statusEl.textContent = '✅ Code applied: ' + msg;
        statusEl.style.color = '#22c55e';
        trackSolEvent('promo_code_applied', { code: code });
        calculatePrice();
      }).catch(function(err) {
        statusEl.textContent = 'Could not verify code.';
        statusEl.style.color = '#ff1111';
        activePromo = null;
      });
    });

    // ---------- Song Requests ----------
    document.getElementById('sol-song-add').addEventListener('click', function() {
      var song = document.getElementById('sol-song-input').value.trim();
      var bookingId = document.getElementById('sol-playlist-booking').value;
      if (!song || !bookingId) { alert('Select a booking and enter a song.'); return; }
      var user = auth.currentUser;
      db.collection('playlists').add({
        bookingId: bookingId,
        song: song,
        clientId: user.uid,
        addedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        document.getElementById('sol-song-input').value = '';
        trackSolEvent('song_request_added', { booking_id: bookingId, song: song });
        loadPlaylist(bookingId);
      });
    });

    document.getElementById('sol-playlist-booking').addEventListener('change', function() {
      loadPlaylist(this.value);
    });

    function loadPlaylist(bookingId) {
      var list = document.getElementById('sol-song-list');
      if (!bookingId) { list.innerHTML = ''; return; }
      db.collection('playlists').where('bookingId', '==', bookingId).orderBy('addedAt').get()
        .then(function(snapshot) {
          list.innerHTML = '';
          if (snapshot.empty) { list.innerHTML = '<p style="color:#888;">No songs added yet.</p>'; return; }
          snapshot.forEach(function(doc) {
            var s = doc.data();
            var item = document.createElement('div');
            item.style.cssText = 'display:flex; justify-content:space-between; align-items:center; background:#000; border-radius:6px; padding:0.5rem 0.75rem;';
            item.innerHTML = '<span style="color:#ccc; font-size:0.9rem;">🎵 ' + escapeHtml(s.song) + '</span><button type="button" style="background:none; border:none; color:#ff3b30; cursor:pointer; font-size:1.2rem;" data-del-song="' + doc.id + '">&times;</button>';
            list.appendChild(item);
          });
          list.querySelectorAll('button[data-del-song]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              db.collection('playlists').doc(btn.getAttribute('data-del-song')).delete().then(function() {
                trackSolEvent('song_request_deleted', {});
                loadPlaylist(bookingId);
              });
            });
          });
        }).catch(function() { list.innerHTML = ''; });
    }

    // ---------- Disputes ----------
    document.getElementById('sol-dispute-submit').addEventListener('click', function() {
      var bookingId = document.getElementById('sol-dispute-booking').value;
      var type = document.getElementById('sol-dispute-type').value;
      var text = document.getElementById('sol-dispute-text').value.trim();
      var statusEl = document.getElementById('sol-dispute-status');
      if (!bookingId || !type || !text) { statusEl.textContent = 'Fill all fields.'; statusEl.style.color = '#ff1111'; return; }
      var user = auth.currentUser;
      statusEl.textContent = 'Submitting...';
      statusEl.style.color = '#ffd860';
      db.collection('disputes').add({
        bookingId: bookingId,
        clientId: user.uid,
        clientEmail: user.email,
        type: type,
        description: text,
        status: 'open',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        statusEl.textContent = 'Dispute submitted. Admin will review shortly.';
        statusEl.style.color = '#22c55e';
        trackSolEvent('dispute_filed', { booking_id: bookingId, dispute_type: type });
        document.getElementById('sol-dispute-text').value = '';
        document.getElementById('sol-dispute-type').value = '';
        document.getElementById('sol-dispute-booking').value = '';
        setTimeout(function() { statusEl.textContent = ''; }, 4000);
      }).catch(function(err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.style.color = '#ff1111';
      });
    });

    // ---------- Populate booking dropdowns ----------
    function populateBookingDropdowns(bookings) {
      var selects = ['sol-playlist-booking', 'sol-dispute-booking'];
      selects.forEach(function(id) {
        var sel = document.getElementById(id);
        var current = sel.value;
        sel.innerHTML = '<option value="">Select a booking...</option>';
        bookings.forEach(function(b) {
          if (b.status === 'cancelled') return;
          var label = (b.eventType || b.event_type || 'Event') + ' — ' + (b.date || b.eventDate || 'TBD');
          var opt = document.createElement('option');
          opt.value = b.id;
          opt.textContent = label;
          sel.appendChild(opt);
        });
        sel.value = current;
      });
      var hasActive = bookings.some(function(b) { return b.status !== 'cancelled'; });
      var playlistWrap = document.getElementById('sol-playlist-wrap');
      if (playlistWrap) playlistWrap.style.display = hasActive ? '' : 'none';
      var hasConfirmed = bookings.some(function(b) { return b.status !== 'cancelled' && b.status !== 'pending'; });
      var disputeWrap = document.getElementById('sol-dispute-wrap');
      if (disputeWrap) disputeWrap.style.display = hasConfirmed ? '' : 'none';
    }

    function syncUserDoc(user) {
      if (!user) return;
      var uid = user.uid;
      console.log('[USER DOC SYNC] Starting for', uid, user.email);
      db.collection('users').doc(uid).get().then(function(doc) {
        console.log('[USER DOC SYNC] Got doc, exists=', doc.exists);
        var data = {
          email: user.email || '',
          displayName: user.displayName || '',
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        if (!doc.exists) {
          data.createdAt = firebase.firestore.FieldValue.serverTimestamp();
          data.isAdmin = false;
          data.isVerifiedDJ = false;
          data.banned = false;
        }
        console.log('[USER DOC SYNC] Setting data', data);
        return db.collection('users').doc(uid).set(data, { merge: true }).then(function() {
          console.log('[USER DOC SYNC] Success for', uid);
        });
      }).catch(function(err) {
        console.error('[USER DOC SYNC] Error for', uid, err);
      });
    }

    auth.onAuthStateChanged(function(user) {
      console.log('[AUTH] onAuthStateChanged fired, user:', user ? user.uid : 'null');
      if (user) {
        solGate.style.display = 'none';
        solAppContent.style.display = 'block';
        accountEmailEl.textContent = user.displayName || user.email;
        const nameField = document.getElementById('sol-quick-name');
        const emailField = document.getElementById('sol-quick-email');
        if (nameField && !nameField.value) nameField.value = user.displayName || '';
        if (emailField && !emailField.value) emailField.value = user.email || '';

        syncUserDoc(user);

        // Deep link: sol.html?message=<djUid>&djname=<name> opens a DM thread.
        var dmParams = new URLSearchParams(window.location.search);
        var dmUid = dmParams.get('message');
        if (dmUid) {
          if (dmUid === user.uid) {
            alert("That's your own DJ profile — sign in with a client account to test messaging.");
          } else {
            createOrOpenDirectConversation(dmUid, dmParams.get('djname') || '', dmParams.get('djavatar') || '');
          }
          history.replaceState(null, '', window.location.pathname);
        }

        if (userDocUnsubscribe) { userDocUnsubscribe(); userDocUnsubscribe = null; }
        userDocUnsubscribe = db.collection('users').doc(user.uid).onSnapshot(function(doc) {
          if (doc.exists && doc.data().banned === true) {
            console.warn('[AUTH] User doc marked banned, signing out.');
            auth.signOut();
            if (authStatus) {
              authStatus.textContent = 'Your account has been disabled.';
              authStatus.style.color = '#ff1111';
            }
            return;
          }
          var ud = doc.exists ? doc.data() : {};
          if (ud.forceLogoutAt) {
            var floMs = ud.forceLogoutAt.toMillis ? ud.forceLogoutAt.toMillis() : 0;
            var lastSignInMs = Date.parse(user.metadata.lastSignInTime || '') || 0;
            if (floMs > lastSignInMs) {
              console.warn('[AUTH] Admin signed this account out.');
              auth.signOut();
              if (authStatus) {
                authStatus.textContent = 'You were signed out by an administrator.';
                authStatus.style.color = '#ff1111';
              }
            }
          }
        });

        isVerifiedDJ = false;
        djModeToggleBtn.style.display = 'none';
        djModeActive = false;
        djConsole.style.display = 'none';
        clientView.style.display = 'block';
        updateDjToggleLabel();
        checkDJVerification(user);
        isAdmin = false;
        adminToggleBtn.style.display = 'none';
        adminModeActive = false;
        adminConsole.style.display = 'none';
        adminToggleBtn.textContent = 'Admin Console';
        checkAdminStatus(user);

        if (!solAppInitialized) {
          solAppInitialized = true;
          initMap();
          subscribeToDJs();
          findDjs();
          handlePaymentReturn();
        }
        subscribeClientBookings(user);
        subscribeClientConversations(user);
        loadSavedDjs(user.uid);
        loadLoyalty(user.uid);
        loadClientVerifyStatus(user.uid);
        requestNotificationPermission();
      } else {
        solGate.style.display = 'block';
        solAppContent.style.display = 'none';
        djModeToggleBtn.style.display = 'none';
        adminToggleBtn.style.display = 'none';
        adminConsole.style.display = 'none';
        adminModeActive = false;
        isAdmin = false;
        if (djStatusUnsubscribe) { djStatusUnsubscribe(); djStatusUnsubscribe = null; }
        if (djConversationsUnsubscribe) { djConversationsUnsubscribe(); djConversationsUnsubscribe = null; }
        if (djBookingsUnsubscribe) { djBookingsUnsubscribe(); djBookingsUnsubscribe = null; }
        if (clientBookingsUnsubscribe) { clientBookingsUnsubscribe(); clientBookingsUnsubscribe = null; }
        if (userDocUnsubscribe) { userDocUnsubscribe(); userDocUnsubscribe = null; }
      }
    });

    // Default to Philadelphia, PA (where the real DJs are)
    let selectedLocation = {
      latitude: 39.9526,
      longitude: -75.1652,
      address: 'Philadelphia, PA',
      city: 'Philadelphia',
      state: 'PA'
    };
    let closestDjDistance = 0;
    let estimateTimeout = null;

    let map, selectedMarker, userMarker;
    const djMarkers = {};
    const onlineDJs = {};
    const mapStatus = document.getElementById('sol-map-status');

    function getNumber() {
      for (var i = 0; i < arguments.length; i++) {
        if (typeof arguments[i] === 'number') return arguments[i];
      }
      return null;
    }

    function createSolPin(color, size) {
      var el = document.createElement('div');
      el.style.width = size + 'px';
      el.style.height = size + 'px';
      el.style.background = color;
      el.style.border = '3px solid #fff';
      el.style.borderRadius = '50%';
      el.style.boxShadow = '0 2px 6px rgba(0,0,0,0.4)';
      return el;
    }

    function createDJMarkerEl(avatar, initial) {
      var el = document.createElement('div');
      el.style.position = 'relative';
      var inner = document.createElement('div');
      inner.style.cssText = 'width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid #22c55e;background:#ff1111;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;';
      var safeInitial = escapeHtml(initial);
      if (avatar) {
        inner.innerHTML = '<img loading="lazy" src="' + escapeAttr(avatar) + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'" />';
      } else {
        inner.textContent = safeInitial;
      }
      el.appendChild(inner);
      var dot = document.createElement('div');
      dot.style.cssText = 'position:absolute;bottom:-2px;right:-2px;width:12px;height:12px;background:#22c55e;border:2px solid #fff;border-radius:50%;';
      el.appendChild(dot);
      return el;
    }

    function initMap() {
      mapboxgl.accessToken = window.MAPBOX_ACCESS_TOKEN;

      var mapOptions = {
        container: 'sol-map',
        style: window.MAPBOX_STYLE_URL,
        center: [selectedLocation.longitude, selectedLocation.latitude],
        zoom: 12,
        pitch: 45,
        bearing: -12.8,
        attributionControl: false
      };

      try {
        map = new mapboxgl.Map(mapOptions);
      } catch(e) {
        console.error('Mapbox custom style failed, falling back:', e);
        mapOptions.style = 'mapbox://styles/mapbox/dark-v11';
        mapOptions.pitch = 0;
        mapOptions.bearing = 0;
        map = new mapboxgl.Map(mapOptions);
      }

      map.on('error', function(e) {
        console.error('Mapbox map error:', e);
      });

      map.addControl(new mapboxgl.NavigationControl(), 'top-right');
      map.addControl(new mapboxgl.AttributionControl({ compact: true, customAttribution: 'SOL' }), 'bottom-right');

      map.on('load', function() {
        var selEl = createSolPin('#ff1111', 16);
        selectedMarker = new mapboxgl.Marker({ element: selEl, draggable: true })
          .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
          .setPopup(new mapboxgl.Popup().setText('Event location'))
          .addTo(map)
          .togglePopup();

        selectedMarker.on('dragend', function() {
          var lngLat = selectedMarker.getLngLat();
          updateLocation(lngLat.lat, lngLat.lng);
        });

        map.on('click', function(e) {
          selectedMarker.setLngLat(e.lngLat);
          updateLocation(e.lngLat.lat, e.lngLat.lng);
        });
      });
    }

    function updateLocation(lat, lng, address) {
      selectedLocation = {
        latitude: lat,
        longitude: lng,
        address: address || 'Selected location',
        city: 'Unknown',
        state: 'Unknown'
      };
      selectedMarker.setLngLat([lng, lat]);
      selectedMarker.setPopup(new mapboxgl.Popup().setText('Event location: ' + lat.toFixed(4) + ', ' + lng.toFixed(4)));
      updateEventNav();
      findDjs(true);
    }

    let lastReverseGeocode = 0;

    function reverseGeocode(lat, lng) {
      const now = Date.now();
      if (now - lastReverseGeocode < 5000) return;
      lastReverseGeocode = now;
      fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=' + lat + '&lon=' + lng + '&zoom=18&addressdetails=1')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          const addr = data.display_name || 'Unknown address';
          document.getElementById('sol-my-location-address').textContent = addr;
          document.getElementById('sol-my-location-coords').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
        })
        .catch(function() {
          document.getElementById('sol-my-location-address').textContent = 'Unknown address';
          document.getElementById('sol-my-location-coords').textContent = lat.toFixed(5) + ', ' + lng.toFixed(5);
        });
    }

    function updateUserLocation(lat, lng) {
      if (!userMarker) {
        var el = createSolPin('#22c55e', 14);
        userMarker = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setText('You are here'))
          .addTo(map);
      } else {
        userMarker.setLngLat([lng, lat]);
      }
      map.flyTo({ center: [lng, lat], zoom: 13, essential: true });
      selectedMarker.setLngLat([lng, lat]);
      reverseGeocode(lat, lng);
      updateLocation(lat, lng);
    }

    function processDJ(doc) {
      const data = doc.data();
      if (!data.isOnline) {
        removeDJ(doc.id);
        return;
      }
      if (!data.isVerified) {
        removeDJ(doc.id);
        return;
      }

      const loc = data.location || {};
      const lat = getNumber(loc.latitude, loc._latitude, loc.lat);
      const lng = getNumber(loc.longitude, loc._longitude, loc.lng);

      if (lat === null || lng === null) {
        removeDJ(doc.id);
        return;
      }

      onlineDJs[doc.id] = { data, lat, lng };
      renderDJMarker(doc.id, data, lat, lng);
    }

    // dj-status is world-readable and carries no identity. Admins resolve
    // name/avatar from the profile collections and cache them per session.
    var djIdentities = {};
    function getDjIdentity(djId) {
      if (djIdentities[djId] !== undefined && djIdentities[djId] !== null) {
        return djIdentities[djId];
      }
      var pub = allDjs.find(function(dj) {
        return (dj.id || dj.uid || dj.dj_id) === djId;
      });
      if (pub) {
        djIdentities[djId] = {
          name: pub.name || pub.stageName || pub.displayName || 'DJ',
          avatar: pub.avatar || pub.photoURL || ''
        };
        return djIdentities[djId];
      }
      return null;
    }

    function fetchDjIdentity(djId) {
      if (djIdentities[djId] !== undefined) return;
      djIdentities[djId] = null; // in-flight sentinel
      var done = function(identity) {
        djIdentities[djId] = identity || { name: 'DJ', avatar: '' };
        var dj = onlineDJs[djId];
        if (dj) renderDJMarker(djId, dj.data, dj.lat, dj.lng);
        renderAdminOnlineDjs();
      };
      db.collection('djs').doc(djId).get().then(function(doc) {
        if (doc.exists) {
          var d = doc.data() || {};
          done({
            name: d.stageName || d.displayName || d.name || d.djName || 'DJ',
            avatar: d.photoURL || d.avatar || ''
          });
          return null;
        }
        return db.collection('dj-verifications').doc(djId).get().then(function(vdoc) {
          if (vdoc.exists) {
            var v = vdoc.data() || {};
            var p = v.djProfile || v;
            done({
              name: p.stageName || p.djName || p.displayName || 'DJ',
              avatar: p.photoURL || p.avatar || v.photoURL || v.avatar || ''
            });
          } else {
            done(null);
          }
        });
      }).catch(function() { done(null); });
    }

    function renderDJMarker(djId, data, lat, lng) {
      // DJ safety: clients see identical anonymous blue markers — no name,
      // photo, genre, rating, or any identifying info. Only admins see
      // the real identity behind each marker.
      var showIdentity = isAdmin === true;
      var identity = showIdentity ? getDjIdentity(djId) : null;
      if (showIdentity && !identity) fetchDjIdentity(djId);
      var djName = (identity && identity.name) || 'DJ';
      var initial = djName.charAt(0).toUpperCase();
      var avatar = identity ? (identity.avatar || '') : '';
      var popupHtml;
      if (showIdentity) {
        var popupAvatar = avatar
          ? '<img loading="lazy" src="' + avatar + '" style="width:40px;height:40px;border-radius:50%;display:block;margin:0 auto 6px;object-fit:cover;" onerror="this.style.display=\'none\'" />'
          : '<div style="width:40px;height:40px;border-radius:50%;background:#ff1111;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;margin:0 auto 6px;">' + initial + '</div>';
        popupHtml = '<div style="text-align:center;">' + popupAvatar +
                    '<strong>' + djName + '</strong><br>' +
                    '<span style="color:#22c55e;font-size:12px;">Online</span>' +
                    '</div>';
      } else {
        popupHtml = '<div style="text-align:center;"><strong>DJ available nearby</strong><br>' +
                    '<span style="color:#22c55e;font-size:12px;">Online</span></div>';
      }

      if (djMarkers[djId]) {
        djMarkers[djId].setLngLat([lng, lat]);
        djMarkers[djId].setPopup(new mapboxgl.Popup().setHTML(popupHtml));
      } else {
        var el = showIdentity ? createDJMarkerEl(avatar, initial) : createSolPin('#3b82f6', 16);
        djMarkers[djId] = new mapboxgl.Marker({ element: el })
          .setLngLat([lng, lat])
          .setPopup(new mapboxgl.Popup().setHTML(popupHtml))
          .addTo(map);
      }
    }

    function removeDJ(djId) {
      delete onlineDJs[djId];
      if (djMarkers[djId]) {
        djMarkers[djId].remove();
        delete djMarkers[djId];
      }
    }

    function renderAdminOnlineDjs() {
      var box = document.getElementById('sol-admin-online-djs-list');
      if (!box) return;
      var ids = Object.keys(onlineDJs);
      if (ids.length === 0) {
        box.innerHTML = '<p style="color:#888; text-align:center;">No DJs online.</p>';
        return;
      }
      box.innerHTML = '';
      ids.forEach(function(uid) {
        var dj = onlineDJs[uid] || {};
        var identity = getDjIdentity(uid);
        if (!identity) fetchDjIdentity(uid);
        var name = escapeHtml((identity && identity.name) || 'DJ');
        var lat = Number(dj.lat);
        var lng = Number(dj.lng);
        var coordStr = (!isNaN(lat) && !isNaN(lng)) ? (lat.toFixed(4) + ', ' + lng.toFixed(4)) : 'Location unavailable';
        var div = document.createElement('div');
        div.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:0.75rem; display:flex; justify-content:space-between; align-items:center;';
        div.innerHTML = '<div><strong>' + escapeHtml(name) + '</strong><br><span style="color:#888; font-size:0.8rem;">' + escapeHtml(coordStr) + '</span></div>';
        box.appendChild(div);
      });
    }

    function updateDJCount() {
      const count = Object.keys(onlineDJs).length;
      mapStatus.textContent = count === 0 ? 'No DJs currently online.' : count + ' DJ' + (count === 1 ? '' : 's') + ' online now';
      mapStatus.style.color = count === 0 ? '#ffd860' : '#22c55e';
      renderAdminOnlineDjs();
    }

    function subscribeToDJs() {
      db.collection('dj-status').where('isOnline', '==', true).where('isVerified', '==', true)
        .onSnapshot(function(snapshot) {
          snapshot.docChanges().forEach(function(change) {
            if (change.type === 'removed') {
              removeDJ(change.doc.id);
            } else {
              processDJ(change.doc);
            }
          });
          updateDJCount();
        }, function(err) {
          // Fallback: composite index may not exist yet, query online only and filter client-side
          console.warn('[MAP] Composite query failed, falling back to single filter:', err.message);
          db.collection('dj-status').where('isOnline', '==', true)
            .onSnapshot(function(snapshot) {
              snapshot.docChanges().forEach(function(change) {
                if (change.type === 'removed') {
                  removeDJ(change.doc.id);
                } else {
                  processDJ(change.doc);
                }
              });
              updateDJCount();
            }, function(err2) {
              mapStatus.textContent = 'Live map error: ' + err2.message;
              mapStatus.style.color = '#ff1111';
              console.error(err2);
            });
        });
    }

    function useMyLocation() {
      if (!navigator.geolocation) {
        mapStatus.textContent = 'Geolocation is not supported by your browser.';
        mapStatus.style.color = '#ff1111';
        return;
      }
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        mapStatus.textContent = 'HTTPS required for location access.';
        mapStatus.style.color = '#ff1111';
        return;
      }
      if (!confirm('This will use your approximate location to center the map. Continue?')) {
        mapStatus.textContent = 'Location access cancelled.';
        mapStatus.style.color = '#ff1111';
        return;
      }
      mapStatus.textContent = 'Locating you...';
      mapStatus.style.color = '#ffd860';

      navigator.geolocation.getCurrentPosition(function(position) {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        updateUserLocation(lat, lng);
        mapStatus.textContent = 'Located: ' + lat.toFixed(4) + ', ' + lng.toFixed(4);
        mapStatus.style.color = '#22c55e';
      }, function(err) {
        var msg = 'Could not get location: ' + err.message;
        if (err.code === 1) {
          var isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
          var isAndroid = /Android/.test(navigator.userAgent);
          if (isIOS) {
            msg = 'Permission denied. iPhone: Settings → Safari → Location → Allow. Then reload.';
          } else if (isAndroid) {
            msg = 'Permission denied. Android: Chrome ⋮ → Settings → Site settings → Location → Allow. Then reload.';
          } else {
            msg = 'Permission denied. Enable location in your browser/site settings, then reload.';
          }
        }
        else if (err.code === 2) msg = 'Location unavailable. Check your GPS or network connection.';
        else if (err.code === 3) msg = 'Location request timed out. Try again.';
        mapStatus.textContent = msg;
        mapStatus.style.color = '#ff1111';
      }, { enableHighAccuracy: false, timeout: 20000, maximumAge: 10000 });
    }

    function centerOnMe() {
      if (userMarker) {
        var ll = userMarker.getLngLat();
        map.flyTo({ center: [ll.lng, ll.lat], zoom: 15, essential: true });
      } else {
        useMyLocation();
      }
    }

    function showAllDJs() {
      var coords = Object.values(onlineDJs).map(function(dj) { return [dj.lng, dj.lat]; });
      if (coords.length > 0) {
        var bounds = coords.reduce(function(b, c) { return b.extend(c); }, new mapboxgl.LngLatBounds(coords[0], coords[0]));
        map.fitBounds(bounds, { padding: 60 });
      } else {
        mapStatus.textContent = 'No DJs to show yet.';
        mapStatus.style.color = '#ff1111';
      }
    }

    document.getElementById('sol-use-location').addEventListener('click', useMyLocation);
    document.getElementById('sol-refresh-djs').addEventListener('click', showAllDJs);
    document.getElementById('sol-center-me').addEventListener('click', centerOnMe);
    document.getElementById('sol-event-nav').addEventListener('click', getEventRoute);

    // Multi-DJ toggle
    document.getElementById('sol-multi-dj-toggle').addEventListener('change', function() {
      document.getElementById('sol-multi-dj-count-wrap').style.display = this.checked ? 'block' : 'none';
    });

    document.getElementById('sol-quick-form').addEventListener('submit', function(e) {
      e.preventDefault();
      const status = document.getElementById('sol-quick-status');
      const btn = e.target.querySelector('button[type="submit"]');
      const original = btn.textContent;
      status.textContent = '';

      if (!auth.currentUser) {
        status.textContent = 'Please sign in or create an account above before booking.';
        status.style.color = '#ff1111';
        document.getElementById('sol-account-box').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      if (!auth.currentUser.emailVerified) {
        auth.currentUser.sendEmailVerification().catch(function() {});
        status.textContent = 'Please verify your email before booking. A new verification email has been sent.';
        status.style.color = '#ff1111';
        document.getElementById('sol-account-box').scrollIntoView({ behavior: 'smooth' });
        return;
      }

      btn.textContent = 'Sending...';
      btn.disabled = true;

      const form = e.target;
      const clientId = auth.currentUser.uid;

      const equipment = getEquipment();
      var recurring = document.getElementById('sol-quick-recurring').value;
      var promoDiscount = 0;
      if (activePromo) {
        if (activePromo.type === 'flat') promoDiscount = activePromo.discount;
        else promoDiscount = Math.round((parseInt(form.duration.value) * 25 + equipment.total) * activePromo.discount / 100);
      }
      const payload = {
        client_id: clientId,
        client_email: form.email.value,
        client_name: form.name.value,
        client_phone: form.phone.value.trim(),
        event_location: selectedLocation,
        event_date: form.date.value,
        event_time: '08:00 PM',
        duration: parseInt(form.duration.value) || 4,
        equipment: equipment,
        special_requests: form.notes.value.trim(),
        event_type: form.event.value,
        age_bracket: 'All Ages',
        recurring: recurring,
        promo_code: activePromo ? activePromo.code : '',
        promo_discount: promoDiscount,
        dj_count: document.getElementById('sol-multi-dj-toggle').checked ? parseInt(document.getElementById('sol-multi-dj-count').value) || 2 : 1,
        deposit_only: document.getElementById('sol-deposit-toggle').checked,
        agreed_terms: document.getElementById('sol-agree-terms').checked,
        agreed_waiver: document.getElementById('sol-agree-waiver').checked,
        signature: document.getElementById('sol-signature').value || ''
      };

      fetch(BOOKING_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      .then(function(res) {
        return res.json().then(function(data) {
          return { ok: res.ok, status: res.status, data: data };
        });
      })
      .then(function(result) {
        if (!result.ok) {
          const detail = result.data.detail || result.data.message || 'Error ' + result.status;
          status.textContent = 'SOL quick booking error: ' + detail;
          status.style.color = '#ff1111';
          btn.textContent = original;
          btn.disabled = false;
          return;
        }

        const bookingId = result.data.booking_id;
        const topMatch = (result.data.top_matches || [])[0] || {};
        localStorage.setItem('sol_pending_booking', JSON.stringify({
          bookingId: bookingId,
          djId: topMatch.dj_id || '',
          djName: topMatch.dj_name || 'DJ'
        }));

        status.textContent = 'Booking created. Redirecting to payment...';
        status.style.color = '#ffd860';
        if (typeof gtag === 'function') {
          gtag('event', 'booking_created', {
            'event_category': 'engagement',
            'event_label': payload.event_type,
            'booking_id': bookingId
          });
        }

        return fetch(API_BASE + '/api/payments/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            booking_id: bookingId,
            success_url: window.location.origin + window.location.pathname + '?booking_id=' + bookingId + '&paid=1',
            cancel_url: window.location.origin + window.location.pathname + '?booking_id=' + bookingId + '&paid=0'
          })
        })
        .then(function(res) { return res.json().then(function(data) { return { ok: res.ok, status: res.status, data: data }; }); })
        .then(function(payResult) {
          if (payResult.ok && payResult.data.url) {
            window.location.href = payResult.data.url;
          } else {
            status.textContent = 'Booking created, but payment could not start: ' + (payResult.data.detail || 'Unknown error') + '. Matched ' + (result.data.matched_djs || '0') + ' DJs — they will still be notified.';
            status.style.color = '#ffd860';
            btn.textContent = original;
            btn.disabled = false;
          }
        });
      })
      .catch(function(err) {
        status.textContent = 'Network error: ' + err.message;
        status.style.color = '#ff1111';
        btn.textContent = original;
        btn.disabled = false;
      });
    });

    function getEquipment() {
      const securityNeeded = document.getElementById('sol-security').checked;
      const securityArmed = securityNeeded && document.getElementById('sol-security-armed').checked;
      return {
        speakers: parseInt(document.getElementById('sol-speakers').value) || 0,
        microphones: parseInt(document.getElementById('sol-microphones').value) || 0,
        strobe_lights: parseInt(document.getElementById('sol-strobes').value) || 0,
        projector: document.getElementById('sol-projector').checked,
        photographer: document.getElementById('sol-photographer').checked,
        security_needed: securityNeeded,
        security_armed: securityArmed,
        mc_services: document.getElementById('sol-mc').checked
      };
    }

    function calculatePrice() {
      const duration = parseInt(document.getElementById('sol-quick-duration').value) || 4;
      const equipment = getEquipment();

      const base = 25 * duration;
      let equipmentCost = 0;
      equipmentCost += equipment.speakers * 50;
      equipmentCost += equipment.microphones * 25;
      equipmentCost += equipment.strobe_lights * 50;
      equipmentCost += equipment.projector ? 50 : 0;
      equipmentCost += equipment.photographer ? 200 : 0;
      equipmentCost += equipment.security_needed ? (equipment.security_armed ? 600 : 300) : 0;
      equipmentCost += equipment.mc_services ? 50 : 0;

      document.getElementById('price-duration').textContent = duration;
      document.getElementById('price-base').textContent = base;
      document.getElementById('price-equipment').textContent = equipmentCost;
      document.getElementById('price-travel').textContent = '...';

      updateTravelFee(base, equipmentCost);
    }

    function updateTravelFee(base, equipmentCost) {
      clearTimeout(estimateTimeout);
      estimateTimeout = setTimeout(function() {
        const payload = {
          event_location: selectedLocation,
          duration: parseInt(document.getElementById('sol-quick-duration').value) || 4,
          equipment: getEquipment(),
          event_date: document.getElementById('sol-quick-date').value || '',
          event_type: document.getElementById('sol-quick-event').value || ''
        };

        fetch(API_BASE + '/api/pricing/estimate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        .then(function(res) { return res.json(); })
        .then(function(data) {
          const travelFee = data.dj_found ? parseFloat(data.travel_fee) : 0;
          document.getElementById('price-travel').textContent = travelFee.toFixed(2);
          var subtotal = base + equipmentCost + travelFee;
          var discount = 0;
          if (activePromo) {
            if (activePromo.type === 'flat') discount = activePromo.discount;
            else discount = Math.round(subtotal * activePromo.discount / 100);
          }
          var total = Math.max(0, subtotal - discount);
          document.getElementById('price-total').textContent = total.toFixed(2);
          var breakdown = document.getElementById('sol-price-breakdown');
          var promoLine = document.getElementById('sol-price-promo');
          if (discount > 0) {
            if (!promoLine) {
              promoLine = document.createElement('p');
              promoLine.id = 'sol-price-promo';
              promoLine.style.color = '#22c55e';
              breakdown.insertBefore(promoLine, breakdown.lastElementChild);
            }
            promoLine.innerHTML = '<strong>Promo Discount:</strong> -$' + discount.toFixed(2);
          } else if (promoLine) {
            promoLine.remove();
          }
        })
        .catch(function() {
          document.getElementById('price-travel').textContent = '0.00';
          document.getElementById('price-total').textContent = (base + equipmentCost).toFixed(2);
        });
      }, 400);
    }

    function updateEventNav() {
      const link = document.getElementById('sol-event-nav');
      if (link) {
        link.style.display = 'inline-block';
      }
    }

    function getEventRoute() {
      if (!userMarker) {
        mapStatus.textContent = 'Set your location first (use "My Location").';
        mapStatus.style.color = '#ff1111';
        return;
      }
      var userLL = userMarker.getLngLat();
      var origin = [userLL.lng, userLL.lat];
      var dest = [selectedLocation.longitude, selectedLocation.latitude];

      mapStatus.textContent = 'Calculating route...';
      mapStatus.style.color = '#ffd860';

      var coords = origin[0] + ',' + origin[1] + ';' + dest[0] + ',' + dest[1];
      fetch('https://router.project-osrm.org/route/v1/driving/' + coords + '?overview=full&geometries=geojson')
        .then(function(res) { return res.json(); })
        .then(function(data) {
          if (!data.routes || !data.routes.length) {
            mapStatus.textContent = 'No route found.';
            mapStatus.style.color = '#ff1111';
            return;
          }
          var route = data.routes[0];
          var routeGeoJSON = {
            type: 'Feature',
            geometry: { type: 'LineString', coordinates: route.geometry.coordinates }
          };

          if (map.getSource('sol-route')) {
            map.getSource('sol-route').setData(routeGeoJSON);
          } else {
            map.addSource('sol-route', { type: 'geojson', data: routeGeoJSON });
            map.addLayer({
              id: 'sol-route-line',
              type: 'line',
              source: 'sol-route',
              layout: { 'line-join': 'round', 'line-cap': 'round' },
              paint: {
                'line-color': '#ff5555',
                'line-width': 6,
                'line-opacity': 0.9,
                'line-emissive-strength': 1
              }
            });
          }

          var bounds = route.geometry.coordinates.reduce(function(b, c) {
            return b.extend(c);
          }, new mapboxgl.LngLatBounds(route.geometry.coordinates[0], route.geometry.coordinates[0]));
          map.fitBounds(bounds, { padding: 60 });

          var distanceMi = (route.distance / 1609.34).toFixed(1);
          var durationMin = Math.round(route.duration / 60);
          document.getElementById('sol-eta-text').textContent = durationMin + ' min';
          document.getElementById('sol-distance-text').textContent = distanceMi + ' mi';
          document.getElementById('sol-eta-panel').style.display = 'flex';

          mapStatus.textContent = 'Route ready — ' + durationMin + ' min (' + distanceMi + ' mi)';
          mapStatus.style.color = '#22c55e';
        })
        .catch(function(err) {
          mapStatus.textContent = 'Routing failed: ' + err.message;
          mapStatus.style.color = '#ff1111';
        });
    }

    function searchLocation() {
      const input = document.getElementById('sol-location-search');
      const query = input.value.trim();
      if (!query) return;

      mapStatus.textContent = 'Finding location...';
      mapStatus.style.color = '#ffd860';

      fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query), {
        headers: { 'Accept-Language': 'en-US' }
      })
      .then(function(res) { return res.json(); })
      .then(function(results) {
        if (results && results.length > 0) {
          const r = results[0];
          const lat = parseFloat(r.lat);
          const lng = parseFloat(r.lon);
          const address = r.display_name;
          map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
          selectedMarker.setLngLat([lng, lat]);
          updateLocation(lat, lng, address);
          input.value = '';
        } else {
          mapStatus.textContent = 'Location not found.';
          mapStatus.style.color = '#ff1111';
        }
      })
      .catch(function(err) {
        mapStatus.textContent = 'Search error: ' + err.message;
        mapStatus.style.color = '#ff1111';
      });
    }

    let suggestionTimer;
    function fetchSuggestions(query) {
      const box = document.getElementById('sol-location-suggestions');
      if (!query) {
        box.style.display = 'none';
        return;
      }

      fetch('https://nominatim.openstreetmap.org/search?format=json&q=' + encodeURIComponent(query) + '&limit=5&addressdetails=1', {
        headers: { 'Accept-Language': 'en-US' }
      })
      .then(function(res) { return res.json(); })
      .then(function(results) {
        if (!results || results.length === 0) {
          box.style.display = 'none';
          return;
        }

        box.innerHTML = '';
        results.forEach(function(r) {
          const item = document.createElement('div');
          item.style.cssText = 'padding:0.75rem; border-bottom:1px solid #333; cursor:pointer; color:#fff;';
          item.textContent = r.display_name;
          item.addEventListener('click', function() {
            const lat = parseFloat(r.lat);
            const lng = parseFloat(r.lon);
            map.flyTo({ center: [lng, lat], zoom: 15, essential: true });
            selectedMarker.setLngLat([lng, lat]);
            updateLocation(lat, lng, r.display_name);
            document.getElementById('sol-location-search').value = r.display_name;
            box.style.display = 'none';
          });
          box.appendChild(item);
        });
        box.style.display = 'block';
      })
      .catch(function() {
        box.style.display = 'none';
      });
    }

    let allDjs = [];
    let clientSearched = false;

    function findDjs(isClientSearch) {
      if (isClientSearch) clientSearched = true;
      const track = document.getElementById('sol-dj-track');
      const dots = document.getElementById('sol-dj-dots');
      track.innerHTML = '';
      dots.innerHTML = '';

      firebase.functions().httpsCallable('publicSearchDjs')({ selectedLocation: selectedLocation })
        .then(function(result) {
          var data = result.data;
          if (data.djs && data.djs.length > 0) {
            closestDjDistance = data.djs[0].distance || 0;
            allDjs = data.djs;
            applyDjFilters();
            calculatePrice();
            mapStatus.textContent = data.djs.length + ' DJ(s) available near ' + (selectedLocation.city || selectedLocation.address);
            mapStatus.style.color = '#22c55e';
          } else {
            allDjs = [];
            track.innerHTML = '<p style="width:100%; text-align:center;">No verified DJs found near this location.</p>';
            mapStatus.textContent = 'No DJs found near this location.';
            mapStatus.style.color = '#ff1111';
          }
        }).catch(function(err) {
          allDjs = [];
          track.innerHTML = '<p style="width:100%; text-align:center;">Error searching DJs.</p>';
          mapStatus.textContent = err.message || 'Unable to search DJs.';
          mapStatus.style.color = '#ff1111';
          console.error('[PUBLIC SEARCH]', err);
        });
    }

    function applyDjFilters() {
      var nameQ = (document.getElementById('sol-dj-filter-name').value || '').toLowerCase();
      var genreQ = document.getElementById('sol-dj-filter-genre').value;
      var maxPrice = parseInt(document.getElementById('sol-dj-filter-price').value) || 0;
      var sortBy = document.getElementById('sol-dj-filter-sort').value;

      var filtered = allDjs.filter(function(dj) {
        // Never show unverified DJs
        if (!dj.is_verified) return false;
        // By default only show online DJs; show all verified if client actively searched
        if (!clientSearched) {
          var djId = dj.id || dj.uid || dj.dj_id || null;
          var isOnline = djId && onlineDJs[djId] ? true : false;
          if (!isOnline) return false;
        }
        if (nameQ && (dj.name || '').toLowerCase().indexOf(nameQ) < 0) return false;
        if (genreQ) {
          var genres = (dj.genres || []).map(function(g) { return g.toLowerCase(); });
          if (genres.indexOf(genreQ.toLowerCase()) < 0) return false;
        }
        if (maxPrice && (dj.hourly_rate || 0) > maxPrice) return false;
        return true;
      });

      filtered.sort(function(a, b) {
        if (sortBy === 'price-low') return (a.hourly_rate || 0) - (b.hourly_rate || 0);
        if (sortBy === 'price-high') return (b.hourly_rate || 0) - (a.hourly_rate || 0);
        if (sortBy === 'name') return (a.name || '').localeCompare(b.name || '');
        return (b.rating || 0) - (a.rating || 0);
      });

      if (filtered.length === 0) {
        document.getElementById('sol-dj-track').innerHTML = '<p style="width:100%; text-align:center;">No DJs match your filters.</p>';
        document.getElementById('sol-dj-dots').innerHTML = '';
      } else {
        renderDjCarousel(filtered);
      }
    }

    ['sol-dj-filter-name', 'sol-dj-filter-genre', 'sol-dj-filter-price', 'sol-dj-filter-sort'].forEach(function(id) {
      var el = document.getElementById(id);
      if (el) {
        el.addEventListener('input', applyDjFilters);
        el.addEventListener('change', applyDjFilters);
      }
    });

    function renderDjCarousel(djs) {
      const track = document.getElementById('sol-dj-track');
      const dots = document.getElementById('sol-dj-dots');
      track.innerHTML = '';
      dots.innerHTML = '';
      lastDjList = djs;

      djs.forEach(function(dj, index) {
        const div = document.createElement('div');
        div.style.cssText = 'flex:0 0 260px; min-width:260px; scroll-snap-align:start; background:#111; border:1px solid #ff1111; border-radius:12px; padding:1rem; text-align:center;';

        var avatarUrl = escapeAttr(dj.avatar || dj.photoURL || '');
        var avatarHtml;
        var initial = escapeHtml((dj.name || 'D').charAt(0).toUpperCase());
        if (avatarUrl) {
          avatarHtml = '<div style="width:100px;height:100px;border-radius:50%;overflow:hidden;border:3px solid #22c55e;margin:0 auto; background:#ff1111;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#fff;position:relative;">' +
            initial + '<img loading="lazy" src="' + avatarUrl + '" style="width:100%;height:100%;object-fit:cover;position:absolute;" onerror="this.remove()">' +
            '</div>';
        } else {
          avatarHtml = '<div style="width:100px;height:100px;border-radius:50%;background:#ff1111;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#fff;margin:0 auto;border:3px solid #22c55e;">' + initial + '</div>';
        }
        const verified = dj.is_verified ? '✅ Verified' : '⏳ Unverified';
        const genres = escapeHtml((dj.genres || []).slice(0, 3).join(', '));
        var navUrl = '';
        if (dj.location && typeof dj.location.latitude === 'number' && typeof dj.location.longitude === 'number') {
          navUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + dj.location.latitude + ',' + dj.location.longitude;
        }
        var djId = dj.id || dj.uid || dj.dj_id || null;
        var isOnline = djId && onlineDJs[djId] ? true : false;
        var statusDot = isOnline
          ? '<div style="position:absolute; bottom:6px; right:calc(50% - 56px); width:14px; height:14px; background:#22c55e; border:2px solid #111; border-radius:50%;"></div>'
          : '<div style="position:absolute; bottom:6px; right:calc(50% - 56px); width:14px; height:14px; background:#666; border:2px solid #111; border-radius:50%;"></div>';
        var onlineLabel = isOnline
          ? '<p style="margin:0.25rem 0; color:#22c55e; font-size:0.8rem;">● Online Now</p>'
          : '<p style="margin:0.25rem 0; color:#888; font-size:0.8rem;">○ Offline</p>';

        div.innerHTML =
          '<div style="margin-bottom:0.75rem; position:relative;">' + avatarHtml +
          statusDot +
          '</div>' +
          '<h3 style="margin:0 0 0.25rem; font-size:1.1rem;">' + escapeHtml(dj.name || 'DJ') + '</h3>' +
          '<p style="margin:0.25rem 0; color:#ffd860; font-size:0.9rem;">⭐ ' + escapeHtml(dj.rating) + ' (' + escapeHtml(dj.review_count) + ') · $' + escapeHtml(dj.hourly_rate) + '/hr</p>' +
          onlineLabel +
          '<p style="margin:0.5rem 0; font-size:0.85rem; color:#aaa;">' + genres + '</p>' +
          '<button type="button" class="submit-btn" style="font-size:0.9rem; width:100%;" data-dj-index="' + index + '">View Profile</button>';

        track.appendChild(div);

        const dot = document.createElement('span');
        dot.style.cssText = 'width:8px;height:8px;border-radius:50%;background:#444;cursor:pointer;';
        dot.addEventListener('click', function() {
          const cardWidth = 276;
          track.scrollTo({ left: index * cardWidth, behavior: 'smooth' });
        });
        dots.appendChild(dot);
      });

      track.addEventListener('scroll', function() {
        const cardWidth = 276;
        const idx = Math.round(track.scrollLeft / cardWidth);
        Array.from(dots.children).forEach(function(d, i) {
          d.style.background = (i === idx) ? '#ff1111' : '#444';
          d.style.width = (i === idx) ? '24px' : '8px';
          d.style.borderRadius = (i === idx) ? '4px' : '50%';
        });
      });
    }

    let lastDjList = [];

    function showDJProfile(dj) {
      var modal = document.getElementById('sol-dj-profile-modal');
      var content = document.getElementById('sol-dj-profile-content');
      var safeName = escapeHtml(dj.name || 'DJ');
      var initial = escapeHtml((dj.name || 'D').charAt(0).toUpperCase());
      var avatar = escapeAttr(dj.avatar || dj.photoURL || '');
      var avatarHtml = avatar
        ? '<img loading="lazy" src="' + avatar + '" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid #22c55e;margin:0 auto 1rem;display:block;" onerror="this.onerror=null;this.style.display=\'none\';this.nextElementSibling.style.display=\'flex\';"><div style="width:120px;height:120px;border-radius:50%;background:#ff1111;display:none;align-items:center;justify-content:center;font-size:48px;font-weight:700;color:#fff;margin:0 auto 1rem;border:4px solid #22c55e;">' + initial + '</div>'
        : '<div style="width:120px;height:120px;border-radius:50%;background:#ff1111;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:700;color:#fff;margin:0 auto 1rem;border:4px solid #22c55e;">' + initial + '</div>';

      var genres = escapeHtml((dj.genres || []).join(', ')) || 'Not specified';
      var specialties = escapeHtml((dj.specialties || []).join(', ')) || 'Not specified';
      var equipment = escapeHtml((dj.equipment || []).join(', ')) || 'Not specified';
      var verified = dj.is_verified ? '✅ Verified DJ' : '⏳ Unverified';
      var locationStr = '';
      if (dj.location) {
        if (dj.location.address) locationStr = escapeHtml(dj.location.address);
        else if (dj.location.city) locationStr = escapeHtml(dj.location.city + (dj.location.state ? ', ' + dj.location.state : ''));
      }
      var navUrl = '';
      if (dj.location && typeof dj.location.latitude === 'number' && typeof dj.location.longitude === 'number') {
        navUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + dj.location.latitude + ',' + dj.location.longitude;
      }
      var djUid = escapeAttr(dj.firebaseUid || dj.id || '');

      content.innerHTML =
        avatarHtml +
        '<h2 style="margin:0 0 0.5rem;">' + safeName + '</h2>' +
        '<p style="color:#ffd860; margin:0.25rem 0;">⭐ ' + escapeHtml(dj.rating) + ' (' + escapeHtml(dj.review_count) + ' reviews)</p>' +
        '<p style="color:#22c55e; margin:0.25rem 0; font-size:0.9rem;">' + escapeHtml(verified) + '</p>' +
        '<p style="color:#aaa; margin:0.25rem 0; font-size:0.9rem;">📍 ' + (locationStr || 'Location not set') + '</p>' +
        '<div style="text-align:left; margin:1.5rem 0; display:flex; flex-direction:column; gap:0.75rem;">' +
        '<div><strong style="color:#ff1111;">Genres:</strong> <span style="color:#ccc;">' + genres + '</span></div>' +
        '<div><strong style="color:#ff1111;">Specialties:</strong> <span style="color:#ccc;">' + specialties + '</span></div>' +
        '<div><strong style="color:#ff1111;">Equipment:</strong> <span style="color:#ccc;">' + equipment + '</span></div>' +
        '<div><strong style="color:#ff1111;">Experience:</strong> <span style="color:#ccc;">' + escapeHtml(dj.experience || 0) + ' years</span></div>' +
        '<div><strong style="color:#ff1111;">Hourly Rate:</strong> <span style="color:#22c55e;">$' + escapeHtml(dj.hourly_rate) + '/hr</span></div>' +
        '<div><strong style="color:#ff1111;">Bookings Completed:</strong> <span style="color:#ccc;">' + escapeHtml(dj.total_bookings_completed || 0) + '</span></div>' +
        '<div><strong style="color:#ff1111;">Match Score:</strong> <span style="color:#ff5555;" id="sol-dj-match-score">Calculating...</span></div>' +
        '</div>' +
        (function() {
          var links = '';
          var soc = dj.socialLinks || {};
          var ic = function(k) { return (typeof SOCIAL_ICONS !== 'undefined' && SOCIAL_ICONS[k]) || ''; };
          if (dj.website) links += '<a href="' + escapeAttr(dj.website) + '" target="_blank" rel="noopener" class="playlist-link" style="margin-right:0.75rem;">' + ic('website') + 'Website</a>';
          if (soc.instagram) links += '<a href="' + escapeAttr(soc.instagram) + '" target="_blank" rel="noopener" class="playlist-link" style="margin-right:0.75rem;">' + ic('instagram') + 'Instagram</a>';
          if (soc.tiktok) links += '<a href="' + escapeAttr(soc.tiktok) + '" target="_blank" rel="noopener" class="playlist-link" style="margin-right:0.75rem;">' + ic('tiktok') + 'TikTok</a>';
          if (soc.youtube) links += '<a href="' + escapeAttr(soc.youtube) + '" target="_blank" rel="noopener" class="playlist-link" style="margin-right:0.75rem;">' + ic('youtube') + 'YouTube</a>';
          if (soc.facebook) links += '<a href="' + escapeAttr(soc.facebook) + '" target="_blank" rel="noopener" class="playlist-link" style="margin-right:0.75rem;">' + ic('facebook') + 'Facebook</a>';
          if (soc.twitter) links += '<a href="' + escapeAttr(soc.twitter) + '" target="_blank" rel="noopener" class="playlist-link" style="margin-right:0.75rem;">' + ic('twitter') + 'X/Twitter</a>';
          return links ? '<div style="margin:0.5rem 0;">' + links + '</div>' : '';
        })() +
        '<div id="sol-dj-sound-samples" style="text-align:left; margin:1rem 0;"><p style="color:#888;">Loading sound samples...</p></div>' +
        '<div id="sol-dj-video-reel" style="text-align:left; margin:1rem 0;"></div>' +
        '<div id="sol-dj-upcoming-events" style="text-align:left; margin:1rem 0;"></div>' +
        '<div id="sol-dj-public-gigs" style="text-align:left; margin:1rem 0;"></div>' +
        '<div id="sol-dj-reviews" style="text-align:left; margin:1rem 0;"><p style="color:#888;">Loading reviews...</p></div>' +
        '<div style="display:flex; gap:0.5rem; margin-top:1rem; flex-wrap:wrap;">' +
        (navUrl ? '<a href="' + escapeAttr(navUrl) + '" target="_blank" class="playlist-link" style="flex:1;">Get Directions</a>' : '') +
        (auth.currentUser && djUid && auth.currentUser.uid !== djUid
          ? '<button type="button" class="submit-btn" style="flex:1; background:#1a1a1a; border:1px solid #ff1111; color:#ff1111;" data-dm-dj="' + escapeAttr(djUid) + '" data-dm-dj-name="' + encodeURIComponent(dj.name || '') + '" data-dm-dj-avatar="' + encodeURIComponent(dj.avatar || dj.photoURL || '') + '">💬 Message</button>'
          : '') +
        '<button type="button" class="submit-btn" style="flex:1;" data-share-dj="' + encodeURIComponent(dj.name || '') + '" data-share-dj-uid="' + djUid + '">Share Profile</button>' +
        '<button type="button" class="submit-btn" style="flex:1; background:#333;" data-save-dj="' + (djUid || '') + '" data-save-dj-name="' + encodeURIComponent(dj.name || '') + '" data-save-dj-avatar="' + encodeURIComponent(dj.avatar || dj.photoURL || '') + '">♥ Save DJ</button>' +
        '</div>';

      modal.style.display = 'flex';

      if (djUid) {
        // Fetch sound samples
        db.collection('dj-samples').doc(djUid).get().then(function(doc) {
          var samplesEl = document.getElementById('sol-dj-sound-samples');
          if (!samplesEl) return;
          if (doc.exists && doc.data().samples && doc.data().samples.length > 0) {
            var html = '<h3 style="color:#ff1111; margin:0 0 0.5rem;">Sound Samples</h3>';
            doc.data().samples.forEach(function(url) {
              html += '<audio controls src="' + url + '" style="width:100%; margin-bottom:0.5rem; height:36px;"></audio>';
            });
            samplesEl.innerHTML = html;
          } else {
            samplesEl.innerHTML = '';
          }
        }).catch(function() {
          var el = document.getElementById('sol-dj-sound-samples');
          if (el) el.innerHTML = '';
        });

        // Fetch video reel
        db.collection('dj-videos').doc(djUid).get().then(function(doc) {
          var videoEl = document.getElementById('sol-dj-video-reel');
          if (!videoEl) return;
          if (doc.exists && doc.data().videos && doc.data().videos.length > 0) {
            var html = '<h3 style="color:#ff1111; margin:0 0 0.5rem;">Video Reel</h3>';
            doc.data().videos.forEach(function(url) {
              if (url.includes('youtube') || url.includes('youtu.be')) {
                var ytId = url.split('v=')[1] || url.split('youtu.be/')[1] || '';
                if (ytId) html += '<iframe width="100%" height="180" src="https://www.youtube.com/embed/' + ytId + '" frameborder="0" allowfullscreen style="border-radius:8px; margin-bottom:0.5rem;"></iframe>';
              } else {
                html += '<video controls src="' + url + '" style="width:100%; border-radius:8px; margin-bottom:0.5rem;"></video>';
              }
            });
            videoEl.innerHTML = html;
          }
        }).catch(function() {});

        // Upcoming events for DJ Weird Nasty (verified server-side)
        var eventsEl = document.getElementById('sol-dj-upcoming-events');
        if (eventsEl && djUid) {
          firebase.functions().httpsCallable('isAdminDj')({ djId: djUid }).then(function(result) {
            if (!result.data || !result.data.admin) {
              eventsEl.innerHTML = '';
              return;
            }
            var djEvents = [
              { title: 'MURRDAH SEASON MONDAY', date: 'Every Monday', time: '3:00 PM – 4:00 PM EST', location: 'Glocawear Radio (Live Stream)', img: 'murrdahseasonmonday.webp', url: 'event-murrdah-season.html', recurring: true },
              { title: 'Ghetto House Party', date: 'Saturday, August 29, 2026', time: '9:00 PM – 3:00 AM EDT', location: '476 Riverly Avenue, Collingdale, PA 19023', img: 'Ghetto-house-party.webp', url: 'event-ghetto-house-party.html', recurring: false, endDate: '2026-08-30' },
              { title: 'Halloween Hibachi on Elm Street', date: 'Saturday, October 31, 2026', time: '12:00 PM – 6:00 PM EDT', location: 'Delink Social Club, 4172 Germantown Ave, Philadelphia, PA 19140', img: 'halloween-habachi-on-elm-street.JPG', url: 'event-halloween-hibachi-elm-street.html', recurring: false, endDate: '2026-11-01' },
              { title: 'Philly Skate Plex Family Session', date: 'Recurring Sessions', time: 'Various times', location: 'Philly Skate Plex, Philadelphia, PA', img: 'Philly-skate-logo.webp', url: 'event-philly-skate-plex.html', recurring: true },
              { title: 'Welcome 2 Muggatime', date: 'Saturday, August 22, 2026', time: '8:00 PM', location: "Crafty's, 35 Baltimore Pike, Springfield, PA 19064", img: 'muggatime.webp', url: 'event-muggatime.html', recurring: false, endDate: '2026-08-23' }
            ];
            var now = new Date();
            var upcoming = djEvents.filter(function(e) {
              if (e.recurring) return true;
              if (!e.endDate) return true;
              return new Date(e.endDate + 'T23:59:59') >= now;
            });

            if (upcoming.length > 0) {
              var eventsHtml = '<h3 style="color:#ff1111; margin:0 0 0.75rem;">📅 Upcoming Events</h3>';
              upcoming.forEach(function(e) {
                eventsHtml += '<a href="' + e.url + '" style="display:block; text-decoration:none; color:inherit; background:#111; border:1px solid #333; border-radius:12px; padding:0.75rem; margin-bottom:0.75rem; transition:border-color 0.2s;" onmouseover="this.style.borderColor=\'#ff1111\'" onmouseout="this.style.borderColor=\'#333\'">' +
                  '<div style="display:flex; gap:0.75rem; align-items:flex-start;">' +
                  '<img loading="lazy" src="' + e.img + '" style="width:60px; height:60px; border-radius:8px; object-fit:cover; flex-shrink:0;" onerror="this.style.display=\'none\'">' +
                  '<div style="flex:1; min-width:0;">' +
                  '<strong style="color:#fff; font-size:0.9rem; display:block; margin-bottom:0.25rem;">' + e.title + '</strong>' +
                  '<div style="color:#ffd860; font-size:0.8rem; margin-bottom:0.15rem;">📆 ' + e.date + '</div>' +
                  '<div style="color:#aaa; font-size:0.8rem; margin-bottom:0.15rem;">🕐 ' + e.time + '</div>' +
                  '<div style="color:#aaa; font-size:0.8rem;">📍 ' + e.location + '</div>' +
                  '</div>' +
                  '</div>' +
                  '<div style="text-align:right; margin-top:0.5rem; color:#ff5555; font-size:0.8rem; font-weight:600;">View Event Details →</div>' +
                  '</a>';
              });
              eventsEl.innerHTML = eventsHtml;
            } else {
              eventsEl.innerHTML = '<h3 style="color:#ff1111; margin:0 0 0.5rem;">📅 Upcoming Events</h3><p style="color:#888;">No upcoming events at this time.</p>';
            }
          }).catch(function() {
            if (eventsEl) eventsEl.innerHTML = '';
          });
        } else if (eventsEl) {
          eventsEl.innerHTML = '';
        }

        // Public gigs posted by this DJ (any verified DJ)
        var gigsEl = document.getElementById('sol-dj-public-gigs');
        if (gigsEl && djUid) {
          db.collection('dj-events').doc(djUid).get().then(function(gigDoc) {
            var events = gigDoc.exists ? (gigDoc.data().events || []) : [];
            var today = new Date().toISOString().slice(0, 10);
            var upcomingGigs = events.filter(function(e) { return e.isPublic && e.date >= today; })
              .sort(function(a, b) { return (a.date || '').localeCompare(b.date || ''); });
            if (upcomingGigs.length === 0) {
              gigsEl.innerHTML = '';
              return;
            }
            var html = '<h3 style="color:#ff1111; margin:0 0 0.5rem;">🎤 Upcoming Gigs</h3>';
            upcomingGigs.forEach(function(e) {
              html += '<div style="background:#111; border:1px solid #333; border-radius:10px; padding:0.75rem; margin-bottom:0.5rem;">' +
                '<strong style="color:#fff; font-size:0.9rem;">' + escapeHtml(e.title || 'Event') + '</strong>' +
                '<div style="color:#aaa; font-size:0.8rem; margin-top:0.25rem;">📍 ' + escapeHtml(e.venue || '') + '</div>' +
                '<div style="color:#aaa; font-size:0.8rem;">📅 ' + escapeHtml(e.date || '') + (e.startTime ? ' ' + escapeHtml(e.startTime) + (e.endTime ? '–' + escapeHtml(e.endTime) : '') : '') + '</div>' +
                '</div>';
            });
            gigsEl.innerHTML = html;
          }).catch(function() {
            gigsEl.innerHTML = '';
          });
        } else if (gigsEl) {
          gigsEl.innerHTML = '';
        }

        // Calculate match score
        var scoreEl = document.getElementById('sol-dj-match-score');
        if (scoreEl) {
          var score = 50;
          if (dj.rating && dj.rating >= 4.5) score += 20;
          else if (dj.rating && dj.rating >= 4) score += 10;
          if (dj.total_bookings_completed && dj.total_bookings_completed > 50) score += 15;
          else if (dj.total_bookings_completed && dj.total_bookings_completed > 20) score += 8;
          if (dj.is_verified) score += 10;
          if (dj.experience && dj.experience >= 5) score += 5;
          score = Math.min(100, score);
          scoreEl.textContent = score + '%';
          scoreEl.style.color = score >= 80 ? '#22c55e' : score >= 60 ? '#ffd860' : '#ff1111';
        }

        db.collection('feedback').where('toUserId', '==', djUid).orderBy('createdAt', 'desc').limit(20).get()
          .then(function(snapshot) {
            var reviewsEl = document.getElementById('sol-dj-reviews');
            if (snapshot.empty) {
              reviewsEl.innerHTML = '<h3 style="color:#ff1111; margin:0 0 0.5rem;">Reviews</h3><p style="color:#888;">No reviews yet. Be the first to review after your event!</p>';
              return;
            }
            var reviews = [];
            var totalRating = 0;
            snapshot.forEach(function(doc) {
              var r = doc.data();
              reviews.push(r);
              totalRating += (r.rating || 0);
            });
            var avgRating = (totalRating / reviews.length).toFixed(1);
            var avgStars = '';
            for (var i = 1; i <= 5; i++) avgStars += i <= Math.round(parseFloat(avgRating)) ? '★' : '☆';

            var html = '<h3 style="color:#ff1111; margin:0 0 0.5rem;">Reviews</h3>' +
              '<div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.75rem;">' +
              '<span style="font-size:1.5rem; color:#ffd860;">' + avgStars + '</span>' +
              '<span style="color:#ccc; font-size:0.9rem;">' + avgRating + ' out of 5 (' + reviews.length + ' review' + (reviews.length === 1 ? '' : 's') + ')</span>' +
              '</div>';
            reviews.forEach(function(r) {
              var stars = '';
              for (var i = 1; i <= 5; i++) stars += i <= (r.rating || 0) ? '★' : '☆';
              var dateStr = '';
              if (r.createdAt && r.createdAt.toDate) {
                dateStr = r.createdAt.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
              }
              html += '<div style="background:#111; border:1px solid #333; border-radius:8px; padding:0.75rem; margin-bottom:0.5rem;">' +
                '<div style="display:flex; justify-content:space-between;"><strong>' + escapeHtml(r.fromName || 'Anonymous') + '</strong><span style="color:#ffd860;">' + stars + '</span></div>' +
                (dateStr ? '<div style="color:#666; font-size:0.75rem; margin-top:2px;">' + escapeHtml(dateStr) + '</div>' : '') +
                (r.review ? '<p style="color:#ccc; font-size:0.85rem; margin:0.25rem 0 0;">' + escapeHtml(r.review).replace(/\n/g, '<br>') + '</p>' : '') +
                '</div>';
            });
            reviewsEl.innerHTML = html;
          })
          .catch(function() {
            var reviewsEl = document.getElementById('sol-dj-reviews');
            if (reviewsEl) reviewsEl.innerHTML = '';
          });
      } else {
        document.getElementById('sol-dj-reviews').innerHTML = '';
      }
    }

    document.getElementById('sol-dj-profile-close').addEventListener('click', function() {
      document.getElementById('sol-dj-profile-modal').style.display = 'none';
    });

    document.getElementById('sol-dj-profile-modal').addEventListener('click', function(e) {
      if (e.target === this) this.style.display = 'none';
      if (e.target && e.target.hasAttribute('data-share-dj')) {
        var djName = decodeURIComponent(e.target.getAttribute('data-share-dj'));
        var djShareUid = e.target.getAttribute('data-share-dj-uid') || '';
        var djShareSlug = djSlugify(djName);
        var shareUrl = djShareSlug
          ? window.location.origin + '/dj/' + encodeURIComponent(djShareSlug)
          : window.location.origin + '/dj.html?uid=' + encodeURIComponent(djShareUid);
        var shareText = 'Check out ' + djName + ' on SOL DJ Booking!';
        if (navigator.share) {
          navigator.share({ title: djName + ' — SOL DJ', text: shareText, url: shareUrl });
        } else {
          navigator.clipboard.writeText(shareUrl).then(function() {
            e.target.textContent = 'Link Copied!';
            setTimeout(function() { e.target.textContent = 'Share Profile'; }, 2000);
          });
        }
      }
      if (e.target && e.target.hasAttribute('data-dm-dj')) {
        createOrOpenDirectConversation(
          e.target.getAttribute('data-dm-dj'),
          decodeURIComponent(e.target.getAttribute('data-dm-dj-name') || ''),
          decodeURIComponent(e.target.getAttribute('data-dm-dj-avatar') || '')
        );
        this.style.display = 'none';
      }
    });

    document.getElementById('sol-dj-track').addEventListener('click', function(e) {
      if (e.target && e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-dj-index')) {
        var idx = parseInt(e.target.getAttribute('data-dj-index'));
        var dj = lastDjList[idx];
        if (!dj) return;
        var uid = dj.firebaseUid || dj.id || dj.uid || dj.dj_id || '';
        if (uid) {
          window.open('dj.html?uid=' + encodeURIComponent(uid), '_blank');
        } else {
          showDJProfile(dj);
        }
      }
    });

    document.getElementById('sol-dj-prev').addEventListener('click', function() {
      const track = document.getElementById('sol-dj-track');
      const cardWidth = 276;
      track.scrollBy({ left: -cardWidth, behavior: 'smooth' });
    });

    document.getElementById('sol-dj-next').addEventListener('click', function() {
      const track = document.getElementById('sol-dj-track');
      const cardWidth = 276;
      track.scrollBy({ left: cardWidth, behavior: 'smooth' });
    });

    document.getElementById('sol-search-location').addEventListener('click', searchLocation);
    document.getElementById('sol-refresh-djs').addEventListener('click', function() { findDjs(true); });

    document.getElementById('sol-location-search').addEventListener('input', function(e) {
      clearTimeout(suggestionTimer);
      const query = e.target.value.trim();
      if (!query) {
        document.getElementById('sol-location-suggestions').style.display = 'none';
        return;
      }
      suggestionTimer = setTimeout(function() { fetchSuggestions(query); }, 300);
    });

    document.addEventListener('click', function(e) {
      const box = document.getElementById('sol-location-suggestions');
      const input = document.getElementById('sol-location-search');
      if (box && !box.contains(e.target) && e.target !== input) {
        box.style.display = 'none';
      }
    });

    ['sol-quick-duration','sol-speakers','sol-microphones','sol-strobes','sol-projector','sol-photographer','sol-security','sol-security-armed','sol-mc'].forEach(function(id) {
      const el = document.getElementById(id);
      if (el) el.addEventListener('change', calculatePrice);
    });
    document.getElementById('sol-security').addEventListener('change', function() {
      const armed = document.getElementById('sol-security-armed');
      const armedLabel = document.getElementById('sol-security-armed-label');
      armed.disabled = !this.checked;
      armedLabel.style.opacity = this.checked ? '1' : '0.4';
      if (!this.checked) armed.checked = false;
      calculatePrice();
    });

    var eqPickerBtn = document.getElementById('sol-open-equipment-picker');
    if (eqPickerBtn) {
      eqPickerBtn.addEventListener('click', function() {
        var currentEq = getEquipment();
        var duration = parseInt(document.getElementById('sol-quick-duration').value) || 4;
        var eventType = document.getElementById('sol-quick-event').value || 'Event';
        var summary = '<strong style="color:#fff;">' + eventType + '</strong><br>' + duration + ' hour event';
        openEquipmentPicker(currentEq, summary, function(result) {
          document.getElementById('sol-speakers').value = result.speakers;
          document.getElementById('sol-microphones').value = result.microphones;
          document.getElementById('sol-strobes').value = result.strobe_lights;
          document.getElementById('sol-projector').checked = result.projector;
          document.getElementById('sol-photographer').checked = result.photographer;
          document.getElementById('sol-security').checked = result.security_needed;
          document.getElementById('sol-security-armed').checked = result.security_armed;
          document.getElementById('sol-mc').checked = result.mc_services;
          var armedLabel = document.getElementById('sol-security-armed-label');
          if (armedLabel) armedLabel.style.opacity = result.security_needed ? '1' : '0.4';
          var armedEl = document.getElementById('sol-security-armed');
          if (armedEl) armedEl.disabled = !result.security_needed;
          calculatePrice();
        });
      });
    }

    // ---------- Messaging (Firestore, interoperable with mobile app) ----------
    let activeConversationId = null;
    let chatUnsubscribe = null;

    // ===== SOL MESSENGER =====
    var msgrConvoUnsubs = [];
    var msgrMsgUnsub = null;
    var msgrConvosByField = { clientId: {}, djId: {} };
    var msgrActiveChatId = null;
    var msgrActiveConvo = null;

    function msgrEl(id) { return document.getElementById(id); }

    function openMessenger(chatId) {
      var m = msgrEl('sol-messenger');
      if (!m || !auth.currentUser) return;
      m.style.display = 'block';
      document.body.style.overflow = 'hidden';
      msgrShowList();
      msgrSubscribeConversations();
      if (chatId) msgrOpenChat(chatId);
    }

    function closeMessenger() {
      var m = msgrEl('sol-messenger');
      if (m) m.style.display = 'none';
      document.body.style.overflow = '';
      msgrConvoUnsubs.forEach(function(u) { u(); });
      msgrConvoUnsubs = [];
      if (msgrMsgUnsub) { msgrMsgUnsub(); msgrMsgUnsub = null; }
      msgrConvosByField = { clientId: {}, djId: {} };
      msgrActiveChatId = null;
      msgrActiveConvo = null;
    }

    function msgrShowList() {
      msgrEl('sol-msgr-chat').style.display = 'none';
      msgrEl('sol-msgr-list').style.display = 'flex';
      msgrActiveChatId = null;
      if (msgrMsgUnsub) { msgrMsgUnsub(); msgrMsgUnsub = null; }
    }

    function msgrSubscribeConversations() {
      var uid = auth.currentUser.uid;
      msgrConvoUnsubs.forEach(function(u) { u(); });
      msgrConvoUnsubs = [];
      msgrConvosByField = { clientId: {}, djId: {} };
      ['clientId', 'djId'].forEach(function(field) {
        var unsub = db.collection('conversations').where(field, '==', uid)
          .onSnapshot(function(snap) {
            msgrConvosByField[field] = {};
            snap.forEach(function(doc) { msgrConvosByField[field][doc.id] = doc.data(); });
            msgrRenderList();
            if (msgrActiveChatId && msgrConvosByField[field][msgrActiveChatId]) {
              msgrSetHeader(msgrConvosByField[field][msgrActiveChatId]);
            }
          }, function(err) { console.error('Messenger conversations error:', err); });
        msgrConvoUnsubs.push(unsub);
      });
    }

    function msgrGetConvo(id) {
      return msgrConvosByField.clientId[id] || msgrConvosByField.djId[id] || null;
    }

    function msgrOtherParty(d, uid) {
      var isClient = d.clientId === uid;
      return {
        name: isClient ? (d.djName || 'DJ') : (d.clientName || 'Client'),
        avatar: isClient ? (d.djAvatar || '') : (d.clientAvatar || ''),
        id: isClient ? d.djId : d.clientId
      };
    }

    function msgrTimeAgo(d) {
      var ms = d.lastMessageTime || (d.lastMessageAt && d.lastMessageAt.toMillis ? d.lastMessageAt.toMillis() : 0);
      if (!ms) return '';
      var diff = Date.now() - ms;
      if (diff < 60000) return 'now';
      if (diff < 3600000) return Math.floor(diff / 60000) + 'm';
      if (diff < 86400000) return Math.floor(diff / 3600000) + 'h';
      if (diff < 604800000) return Math.floor(diff / 86400000) + 'd';
      return new Date(ms).toLocaleDateString();
    }

    function msgrAvatarHtml(name, avatar) {
      var initial = escapeHtml((name || '?').charAt(0).toUpperCase());
      if (!avatar) return initial;
      return initial + '<img src="' + escapeAttr(avatar) + '" style="position:absolute; inset:0; width:100%; height:100%; object-fit:cover;" onerror="this.remove()">';
    }

    function msgrRenderList() {
      var box = msgrEl('sol-msgr-conversations');
      if (!box || !auth.currentUser) return;
      var uid = auth.currentUser.uid;
      var q = (msgrEl('sol-msgr-search').value || '').trim().toLowerCase();
      var merged = {};
      ['clientId', 'djId'].forEach(function(f) {
        Object.keys(msgrConvosByField[f]).forEach(function(id) { merged[id] = msgrConvosByField[f][id]; });
      });
      var list = Object.keys(merged).map(function(id) { return { id: id, d: merged[id] }; });
      list.sort(function(a, b) { return (b.d.lastMessageTime || 0) - (a.d.lastMessageTime || 0); });
      box.innerHTML = '';
      var shown = 0;
      list.forEach(function(c) {
        var other = msgrOtherParty(c.d, uid);
        if (q && other.name.toLowerCase().indexOf(q) === -1) return;
        shown++;
        var unread = (c.d.unreadFor && c.d.unreadFor[uid]) || 0;
        var row = document.createElement('div');
        row.style.cssText = 'display:flex; align-items:center; gap:12px; padding:12px 10px; border-radius:12px; cursor:pointer;' + (unread ? ' background:#141414;' : '');
        row.innerHTML =
          '<div style="position:relative; width:56px; height:56px; border-radius:50%; background:#ff1111; display:flex; align-items:center; justify-content:center; color:#fff; font-weight:800; font-size:1.3rem; overflow:hidden; flex-shrink:0;">' + msgrAvatarHtml(other.name, other.avatar) + '</div>' +
          '<div style="flex:1; min-width:0;">' +
            '<div style="display:flex; align-items:center;">' +
              '<span style="flex:1; color:#fff; font-size:1rem; font-weight:' + (unread ? '800' : '600') + '; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + escapeHtml(other.name) + '</span>' +
              '<span style="color:#888; font-size:0.75rem; margin-left:8px; flex-shrink:0;">' + msgrTimeAgo(c.d) + '</span>' +
            '</div>' +
            '<div style="display:flex; align-items:center; margin-top:3px;">' +
              '<span style="flex:1; color:' + (unread ? '#fff' : '#777') + '; font-size:0.85rem; font-weight:' + (unread ? '700' : '400') + '; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">' + escapeHtml(c.d.lastMessage || 'No messages yet') + '</span>' +
              (unread ? '<span style="min-width:20px; height:20px; border-radius:10px; background:#ff1111; color:#fff; font-size:0.7rem; font-weight:800; display:flex; align-items:center; justify-content:center; margin-left:8px; padding:0 6px;">' + unread + '</span>' : '') +
            '</div>' +
          '</div>';
        row.addEventListener('click', function() { msgrOpenChat(c.id); });
        box.appendChild(row);
      });
      if (!shown) {
        box.innerHTML = '<div style="text-align:center; padding:60px 20px; color:#777;"><div style="font-size:1.05rem; font-weight:700; color:#aaa; margin-bottom:6px;">No conversations yet</div>Message a DJ from their profile to get started.</div>';
      }
    }

    function msgrSetHeader(d) {
      var uid = auth.currentUser && auth.currentUser.uid;
      if (!d || !uid) return;
      msgrActiveConvo = d;
      var other = msgrOtherParty(d, uid);
      msgrEl('sol-msgr-chat-name').textContent = other.name;
      msgrEl('sol-msgr-chat-sub').textContent = d.clientId === uid ? 'DJ' : 'Client';
      msgrEl('sol-msgr-chat-avatar').innerHTML = msgrAvatarHtml(other.name, other.avatar);
      msgrBackfillAvatar(d, uid);
    }

    // If the other party's avatar is missing on the conversation doc (threads
    // created before avatars were passed through), look it up once and write it
    // back so the header and inbox show the real photo.
    function msgrBackfillAvatar(d, uid) {
      var other = msgrOtherParty(d, uid);
      if (other.avatar || !other.id) return;
      var field = (d.djId === other.id) ? 'djAvatar' : 'clientAvatar';
      var lookup = (field === 'djAvatar' && firebase.functions)
        ? firebase.functions().httpsCallable('getPublicDjProfile')({ djId: other.id })
            .then(function(res) { var p = res && res.data; return (p && (p.avatar || p.photoURL)) || ''; })
        : db.collection('users').doc(other.id).get()
            .then(function(doc) { var u = doc.exists ? doc.data() : {}; return u.photoURL || u.avatar || ''; });
      lookup.then(function(avatar) {
        if (!avatar) return;
        var upd = {};
        upd[field] = avatar;
        db.collection('conversations').doc(msgrActiveChatId).update(upd).catch(function() {});
      }).catch(function() {});
    }

    function msgrOpenChat(conversationId) {
      if (!auth.currentUser) return;
      var uid = auth.currentUser.uid;
      msgrActiveChatId = conversationId;
      msgrEl('sol-msgr-list').style.display = 'none';
      msgrEl('sol-msgr-chat').style.display = 'flex';

      var cached = msgrGetConvo(conversationId);
      if (cached) msgrSetHeader(cached);
      else db.collection('conversations').doc(conversationId).get().then(function(doc) {
        if (doc.exists) msgrSetHeader(doc.data());
      }).catch(function() {});

      var box = msgrEl('sol-msgr-messages');
      box.innerHTML = '';
      if (msgrMsgUnsub) msgrMsgUnsub();
      var convoRef = db.collection('conversations').doc(conversationId);
      msgrMsgUnsub = convoRef.collection('messages').orderBy('timestamp', 'asc')
        .onSnapshot(function(snapshot) {
          box.innerHTML = '';
          var toMark = [];
          var lastMineId = null, lastMineRead = false;
          snapshot.forEach(function(doc) {
            var m = doc.data();
            var mine = m.senderId === uid;
            if (!mine && !m.read) toMark.push(doc.id);
            if (mine) { lastMineId = doc.id; lastMineRead = m.read; }
            var wrap = document.createElement('div');
            wrap.style.cssText = 'max-width:82%; margin-bottom:14px; align-self:' + (mine ? 'flex-end' : 'flex-start') + '; display:flex; flex-direction:column; align-items:' + (mine ? 'flex-end' : 'flex-start') + ';';
            var ts = m.timestamp && m.timestamp.toMillis ? m.timestamp.toMillis() : 0;
            var timeStr = ts ? new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : '';
            wrap.innerHTML =
              '<div style="background:' + (mine ? '#ff1111' : '#222') + '; color:#fff; padding:10px 15px; border-radius:20px; ' + (mine ? 'border-bottom-right-radius:5px;' : 'border-bottom-left-radius:5px;') + ' font-size:0.95rem; line-height:1.4; word-break:break-word;">' + escapeHtml(m.text || '') + '</div>' +
              '<div style="font-size:0.65rem; color:#666; margin-top:4px;">' + timeStr + (mine ? ' · ' + (m.read ? 'Seen' : 'Sent') : '') + '</div>';
            box.appendChild(wrap);
          });
          box.scrollTop = box.scrollHeight;
          if (toMark.length) {
            var batch = db.batch();
            toMark.forEach(function(mid) {
              batch.update(convoRef.collection('messages').doc(mid), { read: true, readAt: Date.now() });
            });
            batch.commit().catch(function() {});
          }
          convoRef.update('unreadFor.' + uid, 0).catch(function() {});
        }, function(err) {
          console.error('Messenger chat error:', err);
        });
    }

    function msgrSend() {
      var input = msgrEl('sol-msgr-input');
      var text = (input.value || '').trim();
      var user = auth.currentUser;
      if (!text || !msgrActiveChatId || !user) return;
      var convoRef = db.collection('conversations').doc(msgrActiveChatId);
      convoRef.collection('messages').add({
        senderId: user.uid,
        senderName: user.displayName || user.email || 'User',
        senderAvatar: user.photoURL || '',
        text: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
        type: 'text'
      }).then(function() {
        var d = msgrActiveConvo || msgrGetConvo(msgrActiveChatId);
        var recipient = d ? (d.clientId === user.uid ? d.djId : d.clientId) : null;
        var upd = {
          lastMessage: text,
          lastMessageTime: Date.now(),
          lastMessageAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastMessageSenderId: user.uid,
          unreadCount: firebase.firestore.FieldValue.increment(1)
        };
        if (recipient) upd['unreadFor.' + recipient] = firebase.firestore.FieldValue.increment(1);
        return convoRef.update(upd);
      }).catch(function(err) {
        console.error('Messenger send error:', err);
      });
      input.value = '';
    }

    function openChat(conversationId) {
      openMessenger(conversationId);
    }

    var msgrOpenBtn = document.getElementById('sol-open-messenger');
    if (msgrOpenBtn) msgrOpenBtn.addEventListener('click', function() { openMessenger(); });
    if (msgrEl('sol-msgr-close')) {
      msgrEl('sol-msgr-close').addEventListener('click', closeMessenger);
      msgrEl('sol-msgr-chat-close').addEventListener('click', closeMessenger);
      msgrEl('sol-msgr-back').addEventListener('click', msgrShowList);
      msgrEl('sol-msgr-send').addEventListener('click', msgrSend);
      msgrEl('sol-msgr-search').addEventListener('input', msgrRenderList);
      msgrEl('sol-msgr-input').addEventListener('keydown', function(e) {
        if (e.key === 'Enter') msgrSend();
      });
    }

    function sendChatMessage() {
      const input = document.getElementById('sol-chat-input');
      const text = input.value.trim();
      if (!text || !activeConversationId || !auth.currentUser) return;

      const user = auth.currentUser;
      const messagesRef = db.collection('conversations').doc(activeConversationId).collection('messages');
      messagesRef.add({
        senderId: user.uid,
        senderName: user.displayName || user.email || 'Client',
        senderAvatar: user.photoURL || '',
        text: text,
        timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        read: false,
        type: 'text'
      }).then(function() {
        trackSolEvent('chat_message_sent', { conversation_id: activeConversationId });
        return db.collection('conversations').doc(activeConversationId).update({
          lastMessage: text,
          lastMessageTime: Date.now(),
          lastMessageAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }).catch(function(err) {
        console.error('Send message error:', err);
      });

      input.value = '';
    }

    document.getElementById('sol-chat-send').addEventListener('click', sendChatMessage);
    document.getElementById('sol-chat-input').addEventListener('keydown', function(e) {
      if (e.key === 'Enter') sendChatMessage();
    });

    function createOrOpenConversation(bookingId, djId, djName) {
      const user = auth.currentUser;
      if (!user || !djId) return;

      const conversationId = bookingId + '_conversation';
      const conversationRef = db.collection('conversations').doc(conversationId);

      var create = function() {
        const clientAvatar = user.photoURL || ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid);
        // merge:true — creates the doc if missing, updates if the get()
        // was denied but the doc exists. Keeps any existing messages.
        conversationRef.set({
          id: conversationId,
          bookingId: bookingId,
          clientId: user.uid,
          clientName: user.displayName || user.email || 'Client',
          clientAvatar: clientAvatar,
          djId: djId,
          djName: djName || 'DJ',
          djAvatar: '',
          participants: [user.uid, djId],
          unreadCount: 0
        }, { merge: true }).then(function() {
          openChat(conversationId);
        }).catch(function(err) {
          console.error('Create conversation error:', err);
          openChat(conversationId);
        });
      };
      // A get() on a missing doc fails the participants read rule —
      // fall through to the create either way.
      conversationRef.get().then(function(doc) {
        if (doc.exists) openChat(conversationId); else create();
      }).catch(create);
    }

    // Direct client -> DJ conversation (no booking required). Deterministic
    // id so a client/DJ pair always lands in the same thread.
    function createOrOpenDirectConversation(djId, djName, djAvatar) {
      const user = auth.currentUser;
      if (!user || !djId || djId === user.uid) return;

      const conversationId = 'dm_' + [user.uid, djId].sort().join('_');
      const conversationRef = db.collection('conversations').doc(conversationId);

      var create = function() {
        conversationRef.set({
          id: conversationId,
          type: 'direct',
          clientId: user.uid,
          clientName: user.displayName || user.email || 'Client',
          clientAvatar: user.photoURL || ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid),
          djId: djId,
          djName: djName || 'DJ',
          djAvatar: djAvatar || '',
          participants: [user.uid, djId],
          unreadCount: 0
        }, { merge: true }).then(function() {
          openChat(conversationId);
        }).catch(function(err) {
          console.error('Create DM error:', err);
          openChat(conversationId);
        });
      };
      conversationRef.get().then(function(doc) {
        if (doc.exists) openChat(conversationId); else create();
      }).catch(create);
    }

    function handlePaymentReturn() {
      const params = new URLSearchParams(window.location.search);
      const paid = params.get('paid');
      const bookingIdParam = params.get('booking_id');
      if (!bookingIdParam) return;

      const pendingRaw = localStorage.getItem('sol_pending_booking');
      const pending = pendingRaw ? JSON.parse(pendingRaw) : null;
      const status = document.getElementById('sol-quick-status');

      if (paid === '1') {
        status.textContent = 'Payment successful! Your booking is confirmed.';
        status.style.color = '#22c55e';
        if (typeof gtag === 'function') {
          gtag('event', 'booking_completed', {
            'event_category': 'engagement',
            'booking_id': bookingIdParam
          });
        }
        if (pending && pending.bookingId === bookingIdParam) {
          createOrOpenConversation(bookingIdParam, pending.djId, pending.djName);
        }
      } else if (paid === '0') {
        status.textContent = 'Payment was cancelled. Your booking request was still created — you can complete payment later or a DJ may reach out directly.';
        status.style.color = '#ffd860';
      }

      localStorage.removeItem('sol_pending_booking');
      history.replaceState(null, '', window.location.pathname);
    }

    // ===== ADMIN MESSAGING =====
    var adminMessageRecipient = document.getElementById('sol-admin-message-recipient');
    if (adminMessageRecipient) {
      adminMessageRecipient.addEventListener('change', function() {
        var wrap = document.getElementById('sol-admin-message-specific-wrap');
        if (wrap) wrap.style.display = (this.value === 'specific') ? 'block' : 'none';
      });
    }

    var adminMessageForm = document.getElementById('sol-admin-message-form');
    if (adminMessageForm) {
      adminMessageForm.addEventListener('submit', function(e) {
        e.preventDefault();
        var recipient = adminMessageRecipient.value;
        var target = document.getElementById('sol-admin-message-target').value.trim();
        var subject = document.getElementById('sol-admin-message-subject').value.trim();
        var body = document.getElementById('sol-admin-message-body').value.trim();
        var statusEl = document.getElementById('sol-admin-message-status');

        if (!body) {
          statusEl.textContent = 'Message body is required.';
          statusEl.style.color = '#ff1111';
          return;
        }
        if (recipient === 'specific' && !target) {
          statusEl.textContent = 'Enter target UID or email.';
          statusEl.style.color = '#ff1111';
          return;
        }

        statusEl.textContent = 'Sending...';
        statusEl.style.color = '#ffd860';
        var sendBtn = adminMessageForm.querySelector('button[type="submit"]');
        if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = 'Sending...'; }

        var sendFn = firebase.functions().httpsCallable('adminSendMessage');
        sendFn({ recipient: recipient, target: target, subject: subject, body: body })
          .then(function(result) {
            var r = result.data || {};
            statusEl.textContent = 'Sent to ' + (r.sent || 0) + ' recipients' + (r.failed ? ' (' + r.failed + ' failed)' : '') +
              '. Push: ' + (r.pushSent || 0) + ', Email: ' + (r.emailSent || 0) + ', SMS: ' + (r.smsSent || 0) + '.';
            statusEl.style.color = '#22c55e';
            adminMessageForm.reset();
            document.getElementById('sol-admin-message-specific-wrap').style.display = 'none';
            loadAdminMessageHistory();
          })
          .catch(function(err) {
            statusEl.textContent = 'Send failed: ' + err.message;
            statusEl.style.color = '#ff1111';
          })
          .finally(function() {
            if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = 'Send Message'; }
          });
      });
    }

    var adminMessageUnsubscribe = null;
    function loadAdminMessageHistory() {
      var historyBox = document.getElementById('sol-admin-message-history');
      if (!historyBox) return;
      if (adminMessageUnsubscribe) { adminMessageUnsubscribe(); adminMessageUnsubscribe = null; }
      historyBox.innerHTML = '<p style="color:#888;">Loading messages...</p>';
      adminMessageUnsubscribe = db.collection('admin_broadcasts').orderBy('timestamp', 'desc').limit(50).onSnapshot(function(snapshot) {
        historyBox.innerHTML = '';
        if (snapshot.empty) {
          historyBox.innerHTML = '<p style="color:#888; text-align:center;">No messages sent yet.</p>';
          return;
        }
        snapshot.forEach(function(doc) {
          var m = doc.data();
          var card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem;';
          var sentAt = m.timestamp ? m.timestamp.toDate().toLocaleString() : 'Just now';
          var targetLabel = m.recipientType === 'specific' ? ('Specific: ' + (m.target || '')) :
            m.recipientType === 'djs' ? 'All DJs' :
            m.recipientType === 'users' ? 'All Users' : 'All Users & DJs';
          card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
            '<strong style="color:#ffd860;">' + (m.subject || 'No subject') + '</strong>' +
            '<span style="color:#888; font-size:0.8rem;">' + sentAt + '</span>' +
            '</div>' +
            '<div style="color:#aaa; font-size:0.85rem; margin-bottom:0.5rem;">To: ' + targetLabel + ' · Sent: ' + (m.sent || 0) + '</div>' +
            '<div style="color:#ccc; white-space:pre-wrap; font-size:0.9rem;">' + (m.body || '').replace(/</g, '&lt;') + '</div>';
          historyBox.appendChild(card);
        });
      }, function(err) {
        historyBox.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
      });
    }

    // ===== ADMIN SETTINGS (Push + Email) =====
    // Credentials are now managed server-side; no client access to config/notification-settings.
    function loadAdminSettings() {
      var statusEl = document.getElementById('sol-settings-status');
      if (statusEl) {
        statusEl.textContent = 'Settings are managed server-side. Use Cloud Functions environment or Secret Manager.';
        statusEl.style.color = '#ffd860';
      }
    }
    var settingsSaveBtn = document.getElementById('sol-settings-save');
    if (settingsSaveBtn) {
      settingsSaveBtn.addEventListener('click', function() {
        var statusEl = document.getElementById('sol-settings-status');
        if (statusEl) {
          statusEl.textContent = 'Settings are managed server-side. Use Cloud Functions environment or Secret Manager.';
          statusEl.style.color = '#ffd860';
        }
      });
    }

    // ===== SAVED / FAVORITE DJs =====
    function loadSavedDjs(uid) {
      db.collection('saved-djs').where('clientId', '==', uid).onSnapshot(function(snapshot) {
        var box = document.getElementById('sol-saved-djs');
        box.innerHTML = '';
        if (snapshot.empty) {
          box.innerHTML = '<p style="color:#888;">No saved DJs yet. Click ♥ on a DJ profile to save them.</p>';
          return;
        }
        snapshot.forEach(function(doc) {
          var d = doc.data();
          var card = document.createElement('div');
          card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:0.75rem; display:flex; align-items:center; gap:0.75rem; min-width:200px;';
          var safeName = escapeHtml(d.djName || 'D');
          var safeInitial = escapeHtml(safeName.charAt(0).toUpperCase());
          var avatar = d.djAvatar ? '<img loading="lazy" src="' + escapeAttr(d.djAvatar) + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;" onerror="this.onerror=null;var f=document.createElement(\'div\');f.style.cssText=\'width:40px;height:40px;border-radius:50%;background:#ff1111;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;\';f.textContent=\'' + safeInitial + '\';this.replaceWith(f);">' : '<div style="width:40px;height:40px;border-radius:50%;background:#ff1111;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;">' + safeInitial + '</div>';
          card.innerHTML = avatar + '<div style="flex:1;"><strong>' + escapeHtml(d.djName || 'Unknown DJ') + '</strong></div><button type="button" class="submit-btn" style="background:#333; padding:0.3rem 0.6rem; font-size:0.8rem;" data-remove-saved="' + escapeAttr(doc.id) + '">✕</button>';
          box.appendChild(card);
        });
        box.querySelectorAll('button[data-remove-saved]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var djId = btn.getAttribute('data-remove-saved');
            db.collection('saved-djs').doc(djId).delete().then(function() {
              trackSolEvent('dj_unsaved', { saved_dj_doc_id: djId });
            });
          });
        });
      });
    }

    // Handle save DJ from profile modal
    document.getElementById('sol-dj-profile-modal').addEventListener('click', function(e) {
      if (e.target && e.target.hasAttribute('data-save-dj')) {
        var djUid = e.target.getAttribute('data-save-dj');
        var djName = decodeURIComponent(e.target.getAttribute('data-save-dj-name') || '');
        var djAvatar = decodeURIComponent(e.target.getAttribute('data-save-dj-avatar') || '');
        if (!auth.currentUser || !djUid) return;
        db.collection('saved-djs').where('clientId', '==', auth.currentUser.uid).where('djId', '==', djUid).get().then(function(snap) {
          if (!snap.empty) {
            e.target.textContent = '♥ Already Saved';
            return;
          }
          db.collection('saved-djs').add({
            clientId: auth.currentUser.uid,
            djId: djUid,
            djName: djName,
            djAvatar: djAvatar,
            savedAt: firebase.firestore.FieldValue.serverTimestamp()
          }).then(function() {
            e.target.textContent = '♥ Saved!';
            e.target.style.background = '#22c55e';
            trackSolEvent('dj_saved', { dj_id: djUid, dj_name: djName });
          });
        });
      }
    });

    // ===== DEPOSIT / PARTIAL PAYMENTS =====
    document.getElementById('sol-deposit-toggle').addEventListener('change', function() {
      var info = document.getElementById('sol-deposit-info');
      if (this.checked) {
        var total = document.getElementById('price-total');
        var totalVal = parseFloat(total.textContent) || 0;
        // NOTE: keep in sync with computeBookingPayoutClient() above and
        // computeBookingPayout() in functions/index.js.
        var deposit = Math.max(50, Math.round(totalVal * 0.5 * 100) / 100);
        info.textContent = 'Deposit due now: $' + deposit.toFixed(2) + ' | Balance due at event: $' + (totalVal - deposit).toFixed(2);
        info.style.display = 'block';
      } else {
        info.style.display = 'none';
      }
    });

    // ===== TIP / GRATUITY =====
    var selectedTipAmount = 0;
    document.querySelectorAll('.sol-tip-btn').forEach(function(btn) {
      btn.addEventListener('click', function() {
        document.querySelectorAll('.sol-tip-btn').forEach(function(b) { b.style.background = ''; });
        btn.style.background = '#ff1111';
        var val = btn.getAttribute('data-tip');
        if (val === 'custom') {
          document.getElementById('sol-tip-custom').style.display = 'block';
          selectedTipAmount = 0;
        } else {
          document.getElementById('sol-tip-custom').style.display = 'none';
          selectedTipAmount = parseInt(val);
        }
      });
    });
    document.getElementById('sol-tip-submit').addEventListener('click', function() {
      var bookingId = document.getElementById('sol-tip-booking').value;
      if (!bookingId) { document.getElementById('sol-tip-status').textContent = 'Select a booking first.'; return; }
      var amount = selectedTipAmount || parseInt(document.getElementById('sol-tip-custom').value) || 0;
      if (amount <= 0) { document.getElementById('sol-tip-status').textContent = 'Enter a valid tip amount.'; return; }
      db.collection('tips').add({
        bookingId: bookingId,
        clientId: auth.currentUser.uid,
        amount: amount,
        status: 'pending',
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        document.getElementById('sol-tip-status').textContent = 'Tip of $' + amount + ' submitted! Thank you.';
        document.getElementById('sol-tip-status').style.color = '#22c55e';
        trackSolEvent('tip_sent', { booking_id: bookingId, amount: amount });
        setTimeout(function() { document.getElementById('sol-tip-status').textContent = ''; }, 4000);
      });
    });

    // ===== LOYALTY / REWARDS =====
    function loadLoyalty(uid) {
      db.collection('bookings').where('clientId', '==', uid).where('status', '==', 'completed').get().then(function(snap) {
        var count = snap.size;
        var points = count * 100;
        var tier = 'Bronze';
        var perks = '5% off your 3rd booking';
        if (points >= 500) { tier = 'Silver'; perks = '10% off, priority booking'; }
        if (points >= 1000) { tier = 'Gold'; perks = '15% off, priority booking, free MC add-on'; }
        if (points >= 2000) { tier = 'Platinum'; perks = '20% off, priority booking, free MC + lighting'; }
        document.getElementById('sol-loyalty-points').textContent = points;
        document.getElementById('sol-loyalty-bookings').textContent = count;
        document.getElementById('sol-loyalty-tier').textContent = tier;
        document.getElementById('sol-loyalty-perks').textContent = 'Perks: ' + perks;
      });
    }

    // ===== CLIENT VERIFICATION =====
    function loadClientVerifyStatus(uid) {
      db.collection('client-verifications').doc(uid).get().then(function(doc) {
        var box = document.getElementById('sol-verify-status-box');
        if (doc.exists) {
          var s = doc.data().status || 'pending';
          if (s === 'approved') { box.textContent = '✅ Verified'; box.style.color = '#22c55e'; }
          else if (s === 'rejected') { box.textContent = '❌ Verification rejected'; box.style.color = '#ff1111'; }
          else { box.textContent = '⏳ Verification pending review'; box.style.color = '#ffd860'; }
        } else {
          box.textContent = 'Not verified yet. Complete the form below.';
          box.style.color = '#aaa';
        }
      });
    }
    document.getElementById('sol-verify-submit').addEventListener('click', function() {
      if (!auth.currentUser) return;
      var statusEl = document.getElementById('sol-verify-client-status');
      var uid = auth.currentUser.uid;
      db.collection('client-verifications').doc(uid).set({
        fullName: document.getElementById('sol-verify-fullname').value,
        phone: document.getElementById('sol-verify-phone').value,
        idUrl: document.getElementById('sol-verify-id-url').value,
        status: 'pending',
        submittedAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        statusEl.textContent = 'Verification submitted! We\'ll review it shortly.';
        statusEl.style.color = '#22c55e';
        trackSolEvent('client_verification_submitted', { uid: uid });
        loadClientVerifyStatus(uid);
      }).catch(function(err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.style.color = '#ff1111';
      });
    });

    // ===== DJ BOOKING CALENDAR =====
    var calDate = new Date();
    var djCalendarBookings = [];
    var djCalendarBlocked = [];

    function renderDJCalendar() {
      var grid = document.getElementById('sol-cal-grid');
      var monthEl = document.getElementById('sol-cal-month');
      var year = calDate.getFullYear();
      var month = calDate.getMonth();
      var monthNames = ['January','February','March','April','May','June','July','August','September','October','November','December'];
      monthEl.textContent = monthNames[month] + ' ' + year;

      var firstDay = new Date(year, month, 1).getDay();
      var daysInMonth = new Date(year, month + 1, 0).getDate();
      grid.innerHTML = '';
      var dayLabels = ['S','M','T','W','T','F','S'];
      dayLabels.forEach(function(l) {
        var cell = document.createElement('div');
        cell.style.cssText = 'padding:0.3rem; font-size:0.75rem; color:#666; font-weight:700;';
        cell.textContent = l;
        grid.appendChild(cell);
      });
      for (var i = 0; i < firstDay; i++) {
        var empty = document.createElement('div');
        grid.appendChild(empty);
      }
      for (var d = 1; d <= daysInMonth; d++) {
        var dateStr = year + '-' + String(month + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0');
        var cell = document.createElement('div');
        cell.style.cssText = 'padding:0.4rem; font-size:0.8rem; border-radius:6px; cursor:pointer; position:relative;';
        cell.textContent = d;
        var hasBooking = djCalendarBookings.some(function(b) { return (b.event_date || b.date || '').startsWith(dateStr); });
        var isBlocked = djCalendarBlocked.indexOf(dateStr) >= 0;
        if (hasBooking) { cell.style.background = 'rgba(255, 17, 17,0.3)'; cell.style.color = '#ff1111'; cell.title = 'Has booking'; }
        if (isBlocked) { cell.style.background = 'rgba(255,59,48,0.3)'; cell.style.color = '#ff3b30'; cell.title = 'Blocked'; }
        grid.appendChild(cell);
      }
    }
    document.getElementById('sol-cal-prev').addEventListener('click', function() {
      calDate.setMonth(calDate.getMonth() - 1);
      renderDJCalendar();
    });
    document.getElementById('sol-cal-next').addEventListener('click', function() {
      calDate.setMonth(calDate.getMonth() + 1);
      renderDJCalendar();
    });

    function loadDJCalendarData(uid) {
      db.collection('bookings').where('djId', '==', uid).onSnapshot(function(snap) {
        djCalendarBookings = [];
        snap.forEach(function(doc) { djCalendarBookings.push(doc.data()); });
        renderDJCalendar();
      });
      db.collection('dj-availability').doc(uid).onSnapshot(function(doc) {
        djCalendarBlocked = doc.exists ? (doc.data().blockedDates || []) : [];
        renderDJCalendar();
      });
    }

    // ===== DJ SETLIST BUILDER =====
    document.getElementById('sol-setlist-add').addEventListener('click', function() {
      if (!auth.currentUser) return;
      var bookingId = document.getElementById('sol-setlist-booking').value;
      var time = document.getElementById('sol-setlist-time').value;
      var track = document.getElementById('sol-setlist-track').value;
      if (!bookingId || !track) return;
      db.collection('setlists').add({
        bookingId: bookingId,
        djId: auth.currentUser.uid,
        time: time,
        track: track,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      }).then(function() {
        document.getElementById('sol-setlist-track').value = '';
        trackSolEvent('dj_setlist_item_added', { booking_id: bookingId });
        loadSetlist(bookingId);
      });
    });

    function loadSetlist(bookingId) {
      var box = document.getElementById('sol-setlist-items');
      box.innerHTML = '';
      db.collection('setlists').where('bookingId', '==', bookingId).orderBy('time').get().then(function(snap) {
        snap.forEach(function(doc) {
          var s = doc.data();
          var row = document.createElement('div');
          row.style.cssText = 'display:flex; align-items:center; gap:0.5rem; background:#1a1a1a; padding:0.5rem; border-radius:8px;';
          row.innerHTML = '<span style="color:#ff5555; font-size:0.85rem; min-width:55px;">' + (escapeHtml(s.time) || '--:--') + '</span><span style="flex:1; color:#ccc; font-size:0.85rem;">' + escapeHtml(s.track) + '</span><button type="button" class="submit-btn" style="background:#333; padding:0.25rem 0.5rem; font-size:0.75rem;" data-del-setlist="' + doc.id + '">✕</button>';
          box.appendChild(row);
        });
        box.querySelectorAll('button[data-del-setlist]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            db.collection('setlists').doc(btn.getAttribute('data-del-setlist')).delete().then(function() {
              loadSetlist(bookingId);
            });
          });
        });
      });
    }
    document.getElementById('sol-setlist-booking').addEventListener('change', function() {
      if (this.value) loadSetlist(this.value);
    });

    // ===== DJ ANALYTICS =====
    function loadDJAnalytics(uid) {
      db.collection('bookings').where('djId', '==', uid).get().then(function(snap) {
        var completed = 0, total = snap.size, rated = 0, ratingSum = 0;
        var responseTimes = [];
        var clientIds = {};
        var monthlyEarnings = {};
        snap.forEach(function(doc) {
          var b = doc.data();
          if (b.status === 'completed') {
            completed++;
            if (b.rating) { ratingSum += b.rating; rated++; }
            var amount = b.totalAmount || b.total_cost || 0;
            var month = '';
            if (b.event_date) month = b.event_date.substring(0, 7);
            else if (b.date) month = b.date.substring(0, 7);
            if (month) monthlyEarnings[month] = (monthlyEarnings[month] || 0) + amount * 0.85;
          }
          if (b.clientId) clientIds[b.clientId] = (clientIds[b.clientId] || 0) + 1;
          if (b.responseTimeMs) responseTimes.push(b.responseTimeMs);
        });
        document.getElementById('sol-dj-avg-rating').textContent = rated > 0 ? (ratingSum / rated).toFixed(1) : '-';
        document.getElementById('sol-dj-completion-rate').textContent = total > 0 ? Math.round(completed / total * 100) + '%' : '-';
        if (responseTimes.length > 0) {
          var avgMs = responseTimes.reduce(function(a,b){return a+b;},0) / responseTimes.length;
          var mins = Math.round(avgMs / 60000);
          document.getElementById('sol-dj-avg-response').textContent = mins + 'm';
        } else {
          document.getElementById('sol-dj-avg-response').textContent = '-';
        }
        var repeatCount = Object.values(clientIds).filter(function(c) { return c > 1; }).length;
        document.getElementById('sol-dj-repeat-clients').textContent = repeatCount;

        // Render earnings chart
        var chartEl = document.getElementById('sol-dj-earnings-chart');
        chartEl.innerHTML = '';
        var now = new Date();
        var months = [];
        for (var i = 5; i >= 0; i--) {
          var d = new Date(now.getFullYear(), now.getMonth() - i, 1);
          var key = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
          months.push({ key: key, label: d.toLocaleString('default', { month: 'short' }), value: monthlyEarnings[key] || 0 });
        }
        var maxVal = Math.max.apply(null, months.map(function(m) { return m.value; }));
        if (maxVal === 0) maxVal = 1;
        months.forEach(function(m) {
          var bar = document.createElement('div');
          var h = Math.max(4, (m.value / maxVal) * 80);
          bar.style.cssText = 'flex:1; background:linear-gradient(180deg,#ff1111,#c90000); border-radius:4px 4px 0 0; height:' + h + 'px; position:relative;';
          bar.title = m.label + ': $' + m.value.toFixed(0);
          var lbl = document.createElement('div');
          lbl.style.cssText = 'font-size:0.65rem; color:#888; text-align:center; margin-top:4px;';
          lbl.textContent = m.label;
          var wrap = document.createElement('div');
          wrap.style.cssText = 'flex:1; display:flex; flex-direction:column; align-items:center;';
          wrap.appendChild(bar);
          wrap.appendChild(lbl);
          chartEl.appendChild(wrap);
        });
      });
    }

    // ===== DJ REVIEWS CLIENT =====
    var selectedClientRating = 0;
    document.querySelectorAll('#sol-client-review-stars .sol-star').forEach(function(star) {
      star.addEventListener('click', function() {
        selectedClientRating = parseInt(this.getAttribute('data-val'));
        document.querySelectorAll('#sol-client-review-stars .sol-star').forEach(function(s) {
          s.style.color = parseInt(s.getAttribute('data-val')) <= selectedClientRating ? '#ffd860' : '#444';
        });
      });
    });
    document.getElementById('sol-client-review-submit').addEventListener('click', function() {
      if (!auth.currentUser) return;
      var bookingId = document.getElementById('sol-client-review-booking').value;
      var text = document.getElementById('sol-client-review-text').value;
      if (!bookingId || !selectedClientRating) {
        document.getElementById('sol-client-review-status').textContent = 'Select a booking and rating.';
        return;
      }
      db.collection('bookings').doc(bookingId).get().then(function(doc) {
        if (!doc.exists) return;
        var b = doc.data();
        db.collection('feedback').add({
          toUserId: b.clientId,
          fromUserId: auth.currentUser.uid,
          fromName: b.djName || 'DJ',
          rating: selectedClientRating,
          review: text,
          type: 'client',
          bookingId: bookingId,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(function() {
          document.getElementById('sol-client-review-status').textContent = 'Client review submitted!';
          document.getElementById('sol-client-review-status').style.color = '#22c55e';
          trackSolEvent('client_review_submitted', { booking_id: bookingId, rating: selectedClientRating });
          document.getElementById('sol-client-review-text').value = '';
          setTimeout(function() { document.getElementById('sol-client-review-status').textContent = ''; }, 3000);
        });
      });
    });

    // ===== DEPOSIT IN BOOKING FLOW =====
    // Add deposit info to payload when form is submitted
    var origSubmitHandler = document.getElementById('sol-quick-form').onsubmit;

    // ===== CANCEL BOOKING WITH REFUND LOGIC =====
    function parseLocalDayCount(bookingDate) {
      var parts = bookingDate.split(/[-/]/);
      if (parts.length !== 3) return 999;
      var y = parseInt(parts[0], 10);
      var m = parseInt(parts[1], 10) - 1;
      var d = parseInt(parts[2], 10);
      var eventDate = new Date(y, m, d, 0, 0, 0, 0);
      if (isNaN(eventDate.getTime())) return 999;
      var now = new Date();
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      return Math.ceil((eventDate - today) / (1000 * 60 * 60 * 24));
    }

    document.addEventListener('click', function(e) {
      if (e.target && e.target.hasAttribute('data-cancel-booking')) {
        var bookingId = e.target.getAttribute('data-cancel-booking');
        var bookingDate = e.target.getAttribute('data-booking-date') || '';
        var daysUntil = bookingDate ? parseLocalDayCount(bookingDate) : 999;
        var refundMsg = daysUntil >= 7 ? '50% refund will be processed.' : 'No refund (within 7 days of event).';
        if (!confirm('Cancel this booking? ' + refundMsg)) return;
        db.collection('bookings').doc(bookingId).get().then(function(doc) {
          if (!doc.exists) return;
          var b = doc.data();
          var total = Number(b.totalAmount || b.total_cost || 0);
          var refundAmount = daysUntil >= 7 ? Math.round(total * 0.5 * 100) / 100 : 0;
          db.collection('bookings').doc(bookingId).set({
            status: 'cancelled',
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            refundDue: daysUntil >= 7,
            refundAmount: refundAmount
          }, { merge: true });
        }).catch(function(err) {
          console.error('[CANCEL] Error computing refund:', err);
          alert('Unable to cancel booking. Please try again.');
        });
      }
    });

    // ===== MULTI-EVENT / SERIES BOOKING =====
    // Already handled via recurring + multi-DJ toggle; add series name field
    // The recurring field handles weekly/biweekly/monthly automatically

    // ===== POPULATE TIP & SETLIST & CLIENT REVIEW DROPDOWNS =====
    function populateAllBookingDropdowns(bookings) {
      var tipSelect = document.getElementById('sol-tip-booking');
      var setlistSelect = document.getElementById('sol-setlist-booking');
      var clientReviewSelect = document.getElementById('sol-client-review-booking');
      var tipOpts = '<option value="">Select a completed booking...</option>';
      var setlistOpts = '<option value="">Select a booking...</option>';
      var reviewOpts = '<option value="">Select a completed booking...</option>';
      bookings.forEach(function(b) {
        var label = (b.event_type || 'Event') + ' — ' + (b.event_date || b.date || 'TBD');
        if (b.id) label += ' (' + b.id.substring(0, 8) + ')';
        if (b.status === 'completed') {
          tipOpts += '<option value="' + b.id + '">' + label + '</option>';
          reviewOpts += '<option value="' + b.id + '">' + label + '</option>';
        }
        setlistOpts += '<option value="' + b.id + '">' + label + '</option>';
      });
      if (tipSelect) tipSelect.innerHTML = tipOpts;
      if (setlistSelect) setlistSelect.innerHTML = setlistOpts;
      if (clientReviewSelect) clientReviewSelect.innerHTML = reviewOpts;
    }

    // ---------- PWA: Service Worker & Push Notifications ----------
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', function() {
        // Clean up any stray registration from the main site's
        // /service-worker.js (same scope) left over from earlier visits,
        // which fought with /sw.js and broke Firebase auth/session state.
        navigator.serviceWorker.getRegistrations().then(function(regs) {
          regs.forEach(function(reg) {
            var scriptUrl = reg.active && reg.active.scriptURL || (reg.installing && reg.installing.scriptURL) || (reg.waiting && reg.waiting.scriptURL) || '';
            if (scriptUrl.indexOf('/service-worker.js') !== -1) {
              reg.unregister();
            }
          });
        }).catch(function() {});

        navigator.serviceWorker.register('/sw.js').then(function(reg) {
          console.log('[PWA] Service Worker registered:', reg.scope);
        }).catch(function(err) {
          console.error('[PWA] SW registration failed:', err);
        });
      });
    }

    let pushSubscription = null;

    function subscribeToPushNotifications() {
      if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
      navigator.serviceWorker.ready.then(function(reg) {
        reg.pushManager.getSubscription().then(function(sub) {
          if (sub) {
            pushSubscription = sub;
            savePushSubscription(sub);
            return;
          }
          // Use a VAPID public key (needs to be generated and set)
          var vapidKey = window.VAPID_PUBLIC_KEY;
          if (!vapidKey) {
            console.warn('[PUSH] No VAPID key set — push notifications disabled');
            return;
          }
          reg.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey)
          }).then(function(newSub) {
            pushSubscription = newSub;
            savePushSubscription(newSub);
            console.log('[PUSH] Subscribed to push notifications');
          }).catch(function(err) {
            console.error('[PUSH] Subscription failed:', err);
          });
        });
      });
    }

    function urlBase64ToUint8Array(base64String) {
      var padding = '='.repeat((4 - base64String.length % 4) % 4);
      var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
      var rawData = window.atob(base64);
      var arr = new Uint8Array(rawData.length);
      for (var i = 0; i < rawData.length; i++) arr[i] = rawData.charCodeAt(i);
      return arr;
    }

    function savePushSubscription(sub) {
      if (!auth.currentUser) return;
      db.collection('push-subscriptions').doc(auth.currentUser.uid).set({
        subscription: JSON.parse(JSON.stringify(sub)),
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true });
    }

    // Request notification permission when user logs in
    function requestNotificationPermission() {
      if (!('Notification' in window)) return;
      if (Notification.permission === 'default') {
        Notification.requestPermission().then(function(permission) {
          if (permission === 'granted') {
            subscribeToPushNotifications();
          }
        });
      } else if (Notification.permission === 'granted') {
        subscribeToPushNotifications();
      }
    }

    // ---------- PWA Install Prompt ----------
    // iOS Safari only delivers Web Push to installed (Home Screen) apps, so
    // getting users to install is what makes closed-app notifications work.
    var deferredInstallPrompt = null;
    var installBanner = null;

    function isInStandaloneMode() {
      return window.matchMedia('(display-mode: standalone)').matches ||
        window.matchMedia('(display-mode: fullscreen)').matches ||
        navigator.standalone === true;
    }

    function isIosSafari() {
      var ua = navigator.userAgent;
      var isIos = /iPad|iPhone|iPod/.test(ua) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      var isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS|OPiOS/i.test(ua);
      return isIos && isSafari;
    }

    function hideInstallBanner() {
      if (installBanner) installBanner.style.display = 'none';
    }

    function showInstallBanner(canPromptDirectly) {
      if (isInStandaloneMode()) return;
      if (localStorage.getItem('sol-install-dismissed')) return;
      if (installBanner) { installBanner.style.display = 'flex'; return; }

      installBanner = document.createElement('div');
      installBanner.style.cssText = 'position:fixed; left:12px; right:12px; bottom:12px; z-index:9999; ' +
        'background:#1a1a1a; border:1px solid #ff5555; border-radius:12px; padding:0.75rem 1rem; ' +
        'display:flex; align-items:center; gap:0.75rem; box-shadow:0 4px 20px rgba(0,0,0,0.6); ' +
        'font-size:0.9rem; color:#fff; font-family:inherit;';

      var text = document.createElement('div');
      text.style.flex = '1';
      if (canPromptDirectly) {
        text.innerHTML = '<strong>Install SOL</strong><br>' +
          '<span style="color:#aaa; font-size:0.8rem;">Get booking notifications even when the app is closed.</span>';
      } else {
        text.innerHTML = '<strong>Install SOL for notifications</strong><br>' +
          '<span style="color:#aaa; font-size:0.8rem;">Tap <strong>Share</strong>, then <strong>"Add to Home Screen"</strong> to get booking alerts on your phone.</span>';
      }
      installBanner.appendChild(text);

      if (canPromptDirectly) {
        var installBtn = document.createElement('button');
        installBtn.type = 'button';
        installBtn.className = 'submit-btn';
        installBtn.textContent = 'Install';
        installBtn.style.cssText = 'padding:0.5rem 1rem; white-space:nowrap;';
        installBtn.addEventListener('click', function() {
          if (!deferredInstallPrompt) return;
          deferredInstallPrompt.prompt();
          deferredInstallPrompt.userChoice.then(function(choice) {
            if (choice.outcome === 'accepted') hideInstallBanner();
            deferredInstallPrompt = null;
          });
        });
        installBanner.appendChild(installBtn);
      }

      var closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.textContent = '✕';
      closeBtn.setAttribute('aria-label', 'Dismiss');
      closeBtn.style.cssText = 'background:none; border:none; color:#aaa; font-size:1.1rem; padding:0.25rem; cursor:pointer;';
      closeBtn.addEventListener('click', function() {
        localStorage.setItem('sol-install-dismissed', '1');
        hideInstallBanner();
      });
      installBanner.appendChild(closeBtn);

      document.body.appendChild(installBanner);
    }

    window.addEventListener('beforeinstallprompt', function(e) {
      e.preventDefault();
      deferredInstallPrompt = e;
      showInstallBanner(true);
    });

    window.addEventListener('appinstalled', function() {
      hideInstallBanner();
      deferredInstallPrompt = null;
    });

    // iOS Safari never fires beforeinstallprompt — show manual instructions.
    if (isIosSafari() && !isInStandaloneMode()) {
      window.addEventListener('load', function() {
        showInstallBanner(false);
      });
    }

    // =========================================================================
    // FEATURE 1: Booking Status Tracker (ported from rork-app BookingStatusTracker)
    // =========================================================================
    var BOOKING_STATUS_FLOW = [
      { status: 'pending', label: 'Pending', icon: '⏳' },
      { status: 'confirmed', label: 'Confirmed', icon: '✅' },
      { status: 'on_the_way', label: 'On the Way', icon: '🚗' },
      { status: 'arrived', label: 'Arrived', icon: '📍' },
      { status: 'started', label: 'Started', icon: '▶️' },
      { status: 'completed', label: 'Completed', icon: '🎉' }
    ];

    function renderBookingStatusTracker(currentStatus, statusHistory) {
      if (currentStatus === 'cancelled') {
        return '<div style="text-align:center; padding:1.5rem;">' +
          '<div style="width:60px; height:60px; border-radius:30px; background:#ff3b3022; display:flex; align-items:center; justify-content:center; margin:0 auto 0.75rem; font-size:1.5rem;">❌</div>' +
          '<div style="font-size:1.1rem; font-weight:700; color:#ff3b30;">Booking Cancelled</div>' +
          '</div>';
      }
      var currentIndex = -1;
      for (var i = 0; i < BOOKING_STATUS_FLOW.length; i++) {
        if (BOOKING_STATUS_FLOW[i].status === currentStatus) { currentIndex = i; break; }
      }
      if (currentIndex === -1) currentIndex = 0;

      var html = '<div style="display:flex; align-items:flex-start; padding:0.5rem 0;">';
      for (var j = 0; j < BOOKING_STATUS_FLOW.length; j++) {
        var isCompleted = j < currentIndex;
        var isActive = j === currentIndex;
        var isLast = j === BOOKING_STATUS_FLOW.length - 1;
        var iconColor = isCompleted ? '#22c55e' : isActive ? '#ff5555' : '#555';
        var bgColor = isCompleted ? '#22c55e22' : isActive ? '#ff555522' : '#222';
        var borderColor = isCompleted ? '#22c55e' : isActive ? '#ff5555' : '#444';
        var textColor = (isActive || isCompleted) ? '#fff' : '#666';

        var timestampStr = '';
        if (statusHistory) {
          for (var k = 0; k < statusHistory.length; k++) {
            if (statusHistory[k].status === BOOKING_STATUS_FLOW[j].status) {
              var ts = statusHistory[k].timestamp;
              if (ts && ts.toDate) ts = ts.toDate();
              if (ts) timestampStr = new Date(ts).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
              break;
            }
          }
        }

        html += '<div style="flex:1; text-align:center; position:relative;">';
        html += '<div style="width:44px; height:44px; border-radius:22px; background:' + bgColor + '; border:2px solid ' + borderColor + '; display:flex; align-items:center; justify-content:center; margin:0 auto; font-size:1.1rem;">' + BOOKING_STATUS_FLOW[j].icon + '</div>';
        if (!isLast) {
          var lineColor = isCompleted ? '#22c55e' : '#444';
          html += '<div style="position:absolute; top:22px; left:50%; width:100%; height:2px; background:' + lineColor + '; z-index:0;"></div>';
        }
        html += '<div style="margin-top:0.4rem; font-size:0.7rem; font-weight:' + (isActive ? '700' : '600') + '; color:' + textColor + ';">' + BOOKING_STATUS_FLOW[j].label + '</div>';
        if (timestampStr) html += '<div style="font-size:0.6rem; color:#888; margin-top:0.1rem;">' + timestampStr + '</div>';
        html += '</div>';
      }
      html += '</div>';
      return html;
    }

    function openBookingStatusTracker(bookingId) {
      var modal = document.getElementById('sol-status-tracker-modal');
      var content = document.getElementById('sol-status-tracker-content');
      modal.style.display = 'flex';
      content.innerHTML = '<p style="color:#888; text-align:center;">Loading...</p>';

      db.collection('bookings').doc(bookingId).get().then(function(doc) {
        if (!doc.exists) { content.innerHTML = '<p style="color:#ff1111;">Booking not found.</p>'; return; }
        var b = doc.data();
        var status = b.status || 'pending';
        var history = b.statusHistory || [];
        content.innerHTML = renderBookingStatusTracker(status, history);

        if (b.djId === auth.currentUser.uid && status !== 'cancelled' && status !== 'completed') {
          var actionsHtml = '<div style="display:flex; gap:0.5rem; margin-top:1rem; flex-wrap:wrap;">';
          if (status === 'confirmed') actionsHtml += '<button type="button" class="submit-btn" style="flex:1; background:#ff5555; color:#000;" data-status-update="' + bookingId + '" data-new-status="on_the_way">Mark On the Way</button>';
          if (status === 'on_the_way' || status === 'confirmed') actionsHtml += '<button type="button" class="submit-btn" style="flex:1; background:#22c55e;" data-status-update="' + bookingId + '" data-new-status="arrived">Mark Arrived</button>';
          if (status === 'arrived' || status === 'on_the_way') actionsHtml += '<button type="button" class="submit-btn" style="flex:1; background:#9333ea;" data-status-update="' + bookingId + '" data-new-status="started">Start Event</button>';
          if (status === 'started' || status === 'arrived') actionsHtml += '<button type="button" class="submit-btn" style="flex:1; background:#ffd860; color:#000;" data-status-update="' + bookingId + '" data-new-status="completed">Complete</button>';
          actionsHtml += '</div>';
          content.innerHTML += actionsHtml;

          content.querySelectorAll('button[data-status-update]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var newStatus = btn.getAttribute('data-new-status');
              var bId = btn.getAttribute('data-status-update');
              var entry = { status: newStatus, timestamp: firebase.firestore.FieldValue.serverTimestamp() };
              db.collection('bookings').doc(bId).set({
                status: newStatus,
                statusHistory: firebase.firestore.FieldValue.arrayUnion(entry),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
              }, { merge: true }).then(function() {
                openBookingStatusTracker(bId);
              }).catch(function(err) {
                content.innerHTML += '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
              });
            });
          });
        }
      }).catch(function(err) {
        content.innerHTML = '<p style="color:#ff1111;">Error: ' + escapeHtml(err.message) + '</p>';
      });
    }

    document.getElementById('sol-status-tracker-close').addEventListener('click', function() {
      document.getElementById('sol-status-tracker-modal').style.display = 'none';
    });

    // =========================================================================
    // FEATURE 2: Equipment Picker Modal (ported from rork-app EquipmentPickerModal)
    // =========================================================================
    var equipmentModalState = {
      speakers: 0, microphones: 0, strobeLights: 0,
      projector: false, photographer: false, mc: false,
      security: { needed: false, armed: false }
    };
    var equipmentModalCallback = null;

    function openEquipmentPicker(currentEquipment, eventSummary, onConfirm) {
      var modal = document.getElementById('sol-equipment-modal');
      var summary = document.getElementById('sol-equipment-event-summary');
      var content = document.getElementById('sol-equipment-content');
      modal.style.display = 'flex';

      if (currentEquipment) {
        equipmentModalState = {
          speakers: currentEquipment.speakers || 0,
          microphones: currentEquipment.microphones || 0,
          strobeLights: currentEquipment.strobe_lights || currentEquipment.strobeLights || 0,
          projector: !!currentEquipment.projector,
          photographer: !!currentEquipment.photographer,
          mc: !!(currentEquipment.mc || currentEquipment.mc_services),
          security: { needed: !!(currentEquipment.security_needed || (currentEquipment.security && currentEquipment.security.needed)), armed: !!(currentEquipment.security_armed || (currentEquipment.security && currentEquipment.security.armed)) }
        };
      }
      equipmentModalCallback = onConfirm;
      summary.innerHTML = eventSummary || '';
      renderEquipmentModalContent(content);
    }

    function renderEquipmentModalContent(container) {
      var eq = equipmentModalState;
      function qtyRow(key, label, desc) {
        return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:#111; border-radius:10px; margin-bottom:0.5rem;">' +
          '<div><div style="font-weight:600; color:#fff; font-size:0.9rem;">' + label + '</div><div style="font-size:0.75rem; color:#888;">' + desc + '</div></div>' +
          '<div style="display:flex; align-items:center; gap:0.5rem;">' +
          '<button type="button" class="submit-btn" style="width:30px; height:30px; border-radius:15px; background:#333; padding:0; font-size:1rem;" data-eq-dec="' + key + '">−</button>' +
          '<span style="min-width:30px; text-align:center; font-weight:600; color:#fff;" id="eq-val-' + key + '">' + eq[key] + '</span>' +
          '<button type="button" class="submit-btn" style="width:30px; height:30px; border-radius:15px; background:#9333ea; padding:0; font-size:1rem;" data-eq-inc="' + key + '">+</button>' +
          '</div></div>';
      }
      function toggleRow(key, label, desc) {
        var checked = eq[key];
        return '<div style="display:flex; justify-content:space-between; align-items:center; padding:0.75rem; background:#111; border-radius:10px; margin-bottom:0.5rem;">' +
          '<div><div style="font-weight:600; color:#fff; font-size:0.9rem;">' + label + '</div><div style="font-size:0.75rem; color:#888;">' + desc + '</div></div>' +
          '<label style="position:relative; display:inline-block; width:44px; height:24px; cursor:pointer;">' +
          '<input type="checkbox" data-eq-toggle="' + key + '" ' + (checked ? 'checked' : '') + ' style="opacity:0; width:0; height:0;">' +
          '<span style="position:absolute; top:0; left:0; right:0; bottom:0; border-radius:12px; background:' + (checked ? '#9333ea' : '#333') + '; transition:0.2s;"></span>' +
          '<span style="position:absolute; top:2px; left:' + (checked ? '22px' : '2px') + '; width:20px; height:20px; border-radius:10px; background:#fff; transition:0.2s;"></span>' +
          '</label></div>';
      }

      var html = '<h4 style="color:#ccc; margin:0.5rem 0 0.5rem; font-size:0.9rem;">🔊 Audio Equipment</h4>';
      html += qtyRow('speakers', 'Speakers', 'Professional sound system');
      html += qtyRow('microphones', 'Microphones', 'Wireless microphones');
      html += qtyRow('strobeLights', 'Strobe Lights', 'Party lighting effects');
      html += '<h4 style="color:#ccc; margin:1rem 0 0.5rem; font-size:0.9rem;">Additional Services</h4>';
      html += toggleRow('projector', 'Projector', 'Video projection system');
      html += toggleRow('photographer', 'Photographer', 'Event photography service');
      html += toggleRow('mc', 'MC Service', 'Master of ceremonies');
      html += '<h4 style="color:#ccc; margin:1rem 0 0.5rem; font-size:0.9rem;">Security</h4>';
      html += toggleRow('security.needed', 'Security Needed', 'Professional security staff');
      if (eq.security.needed) html += toggleRow('security.armed', 'Armed Security', 'Armed security personnel');
      container.innerHTML = html;

      container.querySelectorAll('button[data-eq-inc]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var key = btn.getAttribute('data-eq-inc');
          equipmentModalState[key] = (equipmentModalState[key] || 0) + 1;
          var valEl = document.getElementById('eq-val-' + key);
          if (valEl) valEl.textContent = equipmentModalState[key];
        });
      });
      container.querySelectorAll('button[data-eq-dec]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var key = btn.getAttribute('data-eq-dec');
          equipmentModalState[key] = Math.max(0, (equipmentModalState[key] || 0) - 1);
          var valEl = document.getElementById('eq-val-' + key);
          if (valEl) valEl.textContent = equipmentModalState[key];
        });
      });
      container.querySelectorAll('input[data-eq-toggle]').forEach(function(input) {
        input.addEventListener('change', function() {
          var key = input.getAttribute('data-eq-toggle');
          if (key.indexOf('security.') === 0) {
            var subKey = key.split('.')[1];
            equipmentModalState.security[subKey] = input.checked;
          } else {
            equipmentModalState[key] = input.checked;
          }
          renderEquipmentModalContent(container);
        });
      });
    }

    function getEquipmentModalResult() {
      var eq = equipmentModalState;
      return {
        speakers: eq.speakers,
        microphones: eq.microphones,
        strobe_lights: eq.strobeLights,
        projector: eq.projector,
        photographer: eq.photographer,
        security_needed: eq.security.needed,
        security_armed: eq.security.armed,
        mc_services: eq.mc
      };
    }

    document.getElementById('sol-equipment-close').addEventListener('click', function() {
      document.getElementById('sol-equipment-modal').style.display = 'none';
    });
    document.getElementById('sol-equipment-cancel').addEventListener('click', function() {
      document.getElementById('sol-equipment-modal').style.display = 'none';
    });
    document.getElementById('sol-equipment-confirm').addEventListener('click', function() {
      document.getElementById('sol-equipment-modal').style.display = 'none';
      if (equipmentModalCallback) equipmentModalCallback(getEquipmentModalResult());
    });

    // =========================================================================
    // FEATURE 3: Counter Offer (ported from rork-app CounterOfferModal)
    // =========================================================================
    var counterOfferBookingId = null;

    function openCounterOffer(bookingId, originalAmount, originalDuration, clientName, eventType) {
      var modal = document.getElementById('sol-counter-offer-modal');
      counterOfferBookingId = bookingId;
      modal.style.display = 'flex';
      document.getElementById('sol-counter-offer-info').textContent = 'Responding to ' + clientName + '\'s ' + eventType + ' request';
      document.getElementById('sol-counter-offer-original').textContent = 'Original: $' + originalAmount + ' · ' + originalDuration + 'h';
      document.getElementById('sol-counter-offer-amount').value = originalAmount;
      document.getElementById('sol-counter-offer-duration').value = originalDuration;
      document.getElementById('sol-counter-offer-message').value = '';
    }

    function submitCounterOffer() {
      var amount = parseFloat(document.getElementById('sol-counter-offer-amount').value);
      var duration = parseFloat(document.getElementById('sol-counter-offer-duration').value);
      var message = document.getElementById('sol-counter-offer-message').value || '';
      var btn = document.getElementById('sol-counter-offer-submit-btn');

      if (isNaN(amount) || amount <= 0) { alert('Please enter a valid counter-offer amount.'); return; }
      if (isNaN(duration) || duration <= 0) { alert('Please enter a valid duration in hours.'); return; }

      btn.textContent = 'Sending...';
      btn.disabled = true;

      db.collection('bookings').doc(counterOfferBookingId).set({
        counterOffer: {
          amount: amount,
          duration: duration,
          message: message,
          djId: auth.currentUser.uid,
          createdAt: firebase.firestore.FieldValue.serverTimestamp()
        },
        hasCounterOffer: true,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, { merge: true }).then(function() {
        btn.textContent = 'Send Offer';
        btn.disabled = false;
        document.getElementById('sol-counter-offer-modal').style.display = 'none';
        djConsoleStatus.textContent = 'Counter-offer sent to client!';
        djConsoleStatus.style.color = '#22c55e';
        setTimeout(function() { djConsoleStatus.textContent = ''; }, 3000);
      }).catch(function(err) {
        btn.textContent = 'Send Offer';
        btn.disabled = false;
        alert('Failed to send counter-offer: ' + err.message);
      });
    }

    document.getElementById('sol-counter-offer-close').addEventListener('click', function() {
      document.getElementById('sol-counter-offer-modal').style.display = 'none';
    });
    document.getElementById('sol-counter-offer-cancel-btn').addEventListener('click', function() {
      document.getElementById('sol-counter-offer-modal').style.display = 'none';
    });
    document.getElementById('sol-counter-offer-submit-btn').addEventListener('click', submitCounterOffer);

    // =========================================================================
    // FEATURE 4: Song Suggestions (ported from rork-app SongSuggestionPanel)
    // =========================================================================
    var POPULAR_SONGS = [
      { id: 'p1', title: 'Rich Flex', artist: 'Drake & 21 Savage', genre: 'Hip-Hop', bpm: 92 },
      { id: 'p2', title: 'Calm Down', artist: 'Rema & Selena Gomez', genre: 'Afrobeats', bpm: 107 },
      { id: 'p3', title: 'Anti-Hero', artist: 'Taylor Swift', genre: 'Pop', bpm: 97 },
      { id: 'p4', title: 'Flowers', artist: 'Miley Cyrus', genre: 'Pop', bpm: 118 },
      { id: 'p5', title: 'Creepin\'', artist: 'Metro Boomin & The Weeknd', genre: 'R&B', bpm: 90 },
      { id: 'p6', title: 'Kill Bill', artist: 'SZA', genre: 'R&B', bpm: 89 },
      { id: 'p7', title: 'As It Was', artist: 'Harry Styles', genre: 'Pop', bpm: 174 },
      { id: 'p8', title: 'Levitating', artist: 'Dua Lipa', genre: 'Pop/Dance', bpm: 103 },
      { id: 'p9', title: 'Blinding Lights', artist: 'The Weeknd', genre: 'Synth-Pop', bpm: 171 },
      { id: 'p10', title: 'Essence', artist: 'Wizkid ft. Tems', genre: 'Afrobeats', bpm: 112 },
      { id: 'p11', title: 'Industry Baby', artist: 'Lil Nas X & Jack Harlow', genre: 'Hip-Hop', bpm: 149 },
      { id: 'p12', title: 'Good 4 U', artist: 'Olivia Rodrigo', genre: 'Pop-Rock', bpm: 166 },
      { id: 'p13', title: 'STAY', artist: 'The Kid LAROI & Justin Bieber', genre: 'Pop', bpm: 170 },
      { id: 'p14', title: 'Shivers', artist: 'Ed Sheeran', genre: 'Pop', bpm: 141 },
      { id: 'p15', title: 'Heat Waves', artist: 'Glass Animals', genre: 'Indie-Pop', bpm: 80 },
      { id: 'p16', title: 'Butter', artist: 'BTS', genre: 'K-Pop', bpm: 110 },
      { id: 'p17', title: 'Peaches', artist: 'Justin Bieber', genre: 'R&B/Pop', bpm: 90 },
      { id: 'p18', title: 'abcdefu', artist: 'GAYLE', genre: 'Pop-Rock', bpm: 116 },
      { id: 'p19', title: 'Running Up That Hill', artist: 'Kate Bush', genre: '80s/Pop', bpm: 117 },
      { id: 'p20', title: 'Super Freaky Girl', artist: 'Nicki Minaj', genre: 'Hip-Hop', bpm: 130 }
    ];

    var INDIE_SONGS = [
      { id: 'i1', title: 'Birthday Bitch', artist: 'Trap Beckham', genre: 'Hip-Hop', isIndie: true, bpm: 140 },
      { id: 'i2', title: 'Lil Booties Matter', artist: 'Trap Beckham', genre: 'Hip-Hop/Trap', isIndie: true, bpm: 150 },
      { id: 'i3', title: 'Taste Like Candy', artist: 'SoCandy', genre: 'R&B/Pop', isIndie: true, bpm: 105 },
      { id: 'i4', title: 'Get Low', artist: 'SoCandy', genre: 'Hip-Hop/R&B', isIndie: true, bpm: 128 },
      { id: 'i5', title: 'Back It Up', artist: 'Trap Beckham', genre: 'Hip-Hop', isIndie: true, bpm: 160 },
      { id: 'i6', title: 'Smack It', artist: 'SoCandy', genre: 'R&B', isIndie: true, bpm: 110 },
      { id: 'i7', title: 'The Cookout', artist: 'Trap Beckham', genre: 'Hip-Hop', isIndie: true, bpm: 145 },
      { id: 'i8', title: 'Ride', artist: 'SoCandy feat. Trap Beckham', genre: 'Hip-Hop/R&B', isIndie: true, bpm: 120 },
      { id: 'i9', title: 'Over The Top', artist: 'SoCandy', genre: 'Hip-Hop', isIndie: true, bpm: 135 },
      { id: 'i10', title: 'Backwoods', artist: 'Trap Beckham', genre: 'Hip-Hop', isIndie: true, bpm: 155 }
    ];

    // Admin-curated songs (songSuggestions collection) — pushed to every DJ's
    // queue as indie-rotation picks. Populated async by loadAdminSuggestedSongs().
    var ADMIN_SONGS = [];

    var songSuggestionsState = { suggestions: [], confirmedIds: {}, playedIndie: [], bookingId: null, djId: null, eventType: '' };
    var songRotationTimer = null;

    function buildSongSuggestions(eventType) {
      var genreHints = {
        wedding: ['Pop', 'R&B', 'Afrobeats'],
        birthday: ['Hip-Hop', 'Pop', 'R&B'],
        corporate: ['Pop', 'Electronic', 'Synth-Pop'],
        festival: ['Hip-Hop', 'Electronic', 'Afrobeats'],
        club: ['Hip-Hop', 'Electronic', 'Trap'],
        graduation: ['Pop', 'Hip-Hop', 'R&B']
      };
      var preferredGenres = [];
      var lowerType = (eventType || '').toLowerCase();
      for (var key in genreHints) { if (lowerType.indexOf(key) >= 0) { preferredGenres = genreHints[key]; break; } }

      var preferred = POPULAR_SONGS.filter(function(s) {
        return preferredGenres.some(function(g) { return s.genre.toLowerCase().indexOf(g.toLowerCase()) >= 0; });
      });
      var rest = POPULAR_SONGS.filter(function(s) { return preferred.indexOf(s) < 0; });
      var ordered = preferred.concat(rest);

      function shuffle(arr) { return arr.slice().sort(function() { return Math.random() - 0.5; }); }

      var indieSlots = shuffle(INDIE_SONGS.concat(ADMIN_SONGS)).slice(0, 2);
      var popularSlots = shuffle(ordered).slice(0, 3);
      return [popularSlots[0], indieSlots[0], popularSlots[1], indieSlots[1], popularSlots[2]].filter(Boolean);
    }

    function openSongSuggestions(bookingId, djId, djName, eventType) {
      var modal = document.getElementById('sol-song-suggestions-modal');
      modal.style.display = 'flex';
      songSuggestionsState = { suggestions: [], confirmedIds: {}, playedIndie: [], bookingId: bookingId, djId: djId, eventType: eventType };
      songSuggestionsState.suggestions = buildSongSuggestions(eventType);
      document.getElementById('sol-song-subtitle').textContent = 'Tailored for your ' + eventType + ' · updates every 3 min';
      renderSongSuggestions();

      if (songRotationTimer) clearInterval(songRotationTimer);
      songRotationTimer = setInterval(function() {
        songSuggestionsState.suggestions = buildSongSuggestions(eventType);
        songSuggestionsState.confirmedIds = {};
        renderSongSuggestions();
      }, 3 * 60 * 1000);
    }

    function renderSongSuggestions() {
      var list = document.getElementById('sol-song-list');
      var banner = document.getElementById('sol-song-indie-banner');
      var indieCount = songSuggestionsState.playedIndie.length;

      if (indieCount > 0) {
        banner.style.display = 'block';
        banner.textContent = '⚡ ' + indieCount + ' indie track' + (indieCount > 1 ? 's' : '') + ' in rotation — artist' + (indieCount > 1 ? 's' : '') + ' notified at event end';
      } else {
        banner.style.display = 'none';
      }

      var html = '';
      for (var i = 0; i < songSuggestionsState.suggestions.length; i++) {
        var song = songSuggestionsState.suggestions[i];
        var isConfirmed = !!songSuggestionsState.confirmedIds[song.id];
        var isIndie = !!song.isIndie;
        var rowBg = isIndie ? '#1a1a2e' : 'transparent';
        var badgeColor = isIndie ? '#d97706' : '#7c3aed';

        html += '<div data-song-id="' + song.id + '" style="display:flex; align-items:center; gap:0.6rem; padding:0.6rem; background:' + rowBg + '; border-radius:10px; margin-bottom:0.4rem; cursor:pointer; opacity:' + (isConfirmed ? '0.6' : '1') + ';">';
        html += '<div style="width:24px; height:24px; border-radius:12px; background:' + badgeColor + '; display:flex; align-items:center; justify-content:center; color:#fff; font-size:0.7rem; font-weight:700;">' + (i + 1) + '</div>';
        html += '<div style="flex:1;">';
        html += '<div style="display:flex; align-items:center; gap:0.3rem; flex-wrap:wrap;">';
        html += '<span style="font-weight:600; color:#fff; font-size:0.85rem;">' + song.title + '</span>';
        if (isIndie) html += '<span style="background:#d97706; color:#fff; border-radius:4px; padding:0.1rem 0.3rem; font-size:0.6rem; font-weight:700;">⚡ Logan</span>';
        html += '</div>';
        html += '<div style="font-size:0.75rem; color:#aaa;">' + song.artist + '</div>';
        html += '<div style="font-size:0.7rem; color:#888;">' + song.genre + (song.bpm ? ' · ' + song.bpm + ' BPM' : '') + '</div>';
        html += '</div>';
        html += '<div style="width:20px; text-align:center;">' + (isConfirmed ? '✅' : '<div style="width:10px; height:10px; border-radius:5px; border:2px solid ' + badgeColor + ';"></div>') + '</div>';
        html += '</div>';
      }
      list.innerHTML = html;

      list.querySelectorAll('[data-song-id]').forEach(function(row) {
        row.addEventListener('click', function() {
          var songId = row.getAttribute('data-song-id');
          var song = songSuggestionsState.suggestions.find(function(s) { return s.id === songId; });
          if (!song || songSuggestionsState.confirmedIds[songId]) return;

          if (song.isIndie) {
            if (!confirm('"' + song.title + '" by ' + song.artist + ' is an indie artist song in the Logan System rotation.\n\nIf you play this track, ' + song.artist + ' will be notified at the end of the event.\n\nAdd to your rotation?')) return;
            songSuggestionsState.playedIndie.push(song);
          }
          songSuggestionsState.confirmedIds[songId] = true;
          renderSongSuggestions();
        });
      });
    }

    function closeSongSuggestions() {
      document.getElementById('sol-song-suggestions-modal').style.display = 'none';
      if (songRotationTimer) { clearInterval(songRotationTimer); songRotationTimer = null; }
      if (songSuggestionsState.playedIndie.length > 0 && songSuggestionsState.bookingId) {
        for (var i = 0; i < songSuggestionsState.playedIndie.length; i++) {
          var song = songSuggestionsState.playedIndie[i];
          db.collection('indie-playback-notifications').add({
            bookingId: songSuggestionsState.bookingId,
            djId: songSuggestionsState.djId,
            songId: song.id,
            songTitle: song.title,
            artistName: song.artist,
            eventType: songSuggestionsState.eventType,
            playedAt: Date.now(),
            notified: false
          }).catch(function(err) { console.warn('Failed to write indie playback notification:', err); });
        }
        var songList = songSuggestionsState.playedIndie.map(function(s) { return '• "' + s.title + '" by ' + s.artist; }).join('\n');
        alert('Indie Artist Rotation\n\nYou played ' + songSuggestionsState.playedIndie.length + ' indie artist song(s) in rotation:\n\n' + songList + '\n\nThe artist(s) have been notified. Thank you for supporting independent music!');
      }
    }

    document.getElementById('sol-song-close').addEventListener('click', closeSongSuggestions);
    document.getElementById('sol-song-refresh').addEventListener('click', function() {
      songSuggestionsState.suggestions = buildSongSuggestions(songSuggestionsState.eventType);
      songSuggestionsState.confirmedIds = {};
      renderSongSuggestions();
    });


