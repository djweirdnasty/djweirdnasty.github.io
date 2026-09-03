    console.log('[SOL APP] loaded v7');

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
        gtag('event', name, params || {});
      } catch (e) {}
    }

    // ---------- Account (Firebase Auth) ----------
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
        authStatus.style.color = '#ff4d8f';
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
            trackSolEvent('sign_up', { method: 'email', uid: cred.user.uid });
            authStatus.textContent = 'Account created!';
            authStatus.style.color = '#22c55e';
            if (name) return cred.user.updateProfile({ displayName: name });
          })
          .catch(function(err) {
            console.error('[AUTH] Sign up error:', err.code, err.message);
            authStatus.textContent = err.message;
            authStatus.style.color = '#ff4d8f';
          })
          .finally(done);
      } else {
        auth.signInWithEmailAndPassword(email, password)
          .then(function(cred) {
            console.log('[AUTH] Sign in successful:', cred.user.uid);
            trackSolEvent('login', { method: 'email', uid: cred.user.uid });
            authStatus.textContent = '';
          })
          .catch(function(err) {
            console.error('[AUTH] Sign in error:', err.code, err.message);
            authStatus.textContent = err.message;
            authStatus.style.color = '#ff4d8f';
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
      auth.sendPasswordResetEmail(email)
        .then(function() {
          trackSolEvent('password_reset', { method: 'email' });
          authStatus.textContent = 'Password reset email sent.';
          authStatus.style.color = '#22c55e';
        })
        .catch(function(err) {
          authStatus.textContent = err.message;
          authStatus.style.color = '#ff4d8f';
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

    const djModeToggleBtn = document.getElementById('sol-dj-mode-toggle');
    const djConsole = document.getElementById('sol-dj-console');
    const clientView = document.getElementById('sol-client-view');
    const djOnlineToggle = document.getElementById('sol-dj-online-toggle');
    const djToggleTrack = document.getElementById('sol-dj-toggle-track');
    const djToggleKnob = document.getElementById('sol-dj-toggle-knob');
    const djStatusLabel = document.getElementById('sol-dj-status-label');
    const djConsoleStatus = document.getElementById('sol-dj-console-status');
    const djConversationsBox = document.getElementById('sol-dj-conversations');

    function checkDJVerification(user) {
      db.collection('dj-verifications').doc(user.uid).get()
        .then(function(doc) {
          if (doc.exists && doc.data().status === 'approved') {
            isVerifiedDJ = true;
            djModeToggleBtn.style.display = 'inline-block';
            loadDJProfile(user, doc.data());
            db.collection('dj-status').doc(user.uid).set({ isVerified: true }, { merge: true }).catch(function() {});
          } else {
            return db.collection('users').doc(user.uid).get();
          }
        })
        .then(function(userDoc) {
          if (userDoc && userDoc.exists && userDoc.data().isVerifiedDJ === true) {
            isVerifiedDJ = true;
            djModeToggleBtn.style.display = 'inline-block';
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
            statusEl.style.background = '#00d4ff33';
            statusEl.style.color = '#00d4ff';
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

      var profileData = {
        stageName: document.getElementById('sol-dj-stage-name').value.trim(),
        photoURL: document.getElementById('sol-dj-avatar-url').value.trim(),
        avatar: document.getElementById('sol-dj-avatar-url').value.trim(),
        phone: document.getElementById('sol-dj-phone').value.trim(),
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

      db.collection('dj-verifications').doc(user.uid).set(verData, { merge: true })
        .then(function() {
          db.collection('djs').doc(user.uid).set(profileData, { merge: true });
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
          statusEl.style.color = '#ff4d8f';
        });
    });

    // ---------- DJ Profile Picture Upload ----------
    document.getElementById('sol-dj-avatar-file').addEventListener('change', function(e) {
      var file = e.target.files[0];
      if (!file) return;
      if (!file.type.match('image.*')) {
        document.getElementById('sol-dj-avatar-upload-status').textContent = 'Please select an image file.';
        document.getElementById('sol-dj-avatar-upload-status').style.color = '#ff4d8f';
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
        statusEl.style.color = '#ff4d8f';
      }, function() {
        ref.getDownloadURL().then(function(url) {
          document.getElementById('sol-dj-avatar-url').value = url;
          if (preview) { preview.src = url; preview.style.display = 'block'; }
          statusEl.textContent = 'Upload complete.';
          statusEl.style.color = '#22c55e';
          trackSolEvent('dj_profile_photo_uploaded', { uid: user.uid });
        }).catch(function(err) {
          statusEl.textContent = 'Upload failed: ' + err.message;
          statusEl.style.color = '#ff4d8f';
        });
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
          chip.innerHTML = new Date(d).toLocaleDateString('en-US', { month:'short', day:'numeric', year:'numeric' }) +
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
        document.getElementById('sol-dj-gallery-status').style.color = '#ff4d8f';
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
        statusEl.style.color = '#ff4d8f';
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
            statusEl.style.color = '#ff4d8f';
          });
        }).catch(function(err) {
          statusEl.textContent = 'Upload failed: ' + err.message;
          statusEl.style.color = '#ff4d8f';
        });
      });
    });

    function loadDjGallery(uid) {
      db.collection('dj-galleries').doc(uid).get().then(function(doc) {
        var box = document.getElementById('sol-dj-gallery');
        box.innerHTML = '';
        if (!doc.exists || !doc.data().photos) return;
        doc.data().photos.forEach(function(url) {
          var wrapper = document.createElement('div');
          wrapper.style.cssText = 'position:relative; width:100px; height:100px;';
          wrapper.innerHTML = '<img loading="lazy" src="' + url + '" style="width:100px;height:100px;object-fit:cover;border-radius:8px;border:1px solid #444;" onerror="this.style.display=\'none\'">' +
            '<button type="button" style="position:absolute;top:-4px;right:-4px;background:#ff3b30;border:none;color:#fff;width:20px;height:20px;border-radius:50%;cursor:pointer;font-size:0.8rem;" data-del-photo="' + url + '">&times;</button>';
          box.appendChild(wrapper);
        });
        box.querySelectorAll('button[data-del-photo]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            db.collection('dj-galleries').doc(uid).set({
              photos: firebase.firestore.FieldValue.arrayRemove(btn.getAttribute('data-del-photo'))
            }, { merge: true }).then(function() { loadDjGallery(uid); });
          });
        });
      });
    }

    // ---------- DJ Earnings + CSV Export ----------
    function loadDJEarnings(uid) {
      db.collection('bookings').where('djId', '==', uid).where('status', '==', 'completed').get()
        .then(function(snapshot) {
          var total = 0, gigs = 0;
          var rows = [['Date','Event','Client','Amount','Platform Fee','DJ Payout']];
          snapshot.forEach(function(doc) {
            var b = doc.data();
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

          document.getElementById('sol-dj-export-csv').onclick = function() {
            var csv = rows.map(function(r) { return r.map(function(c) { return '"' + c + '"'; }).join(','); }).join('\n');
            var blob = new Blob([csv], { type: 'text/csv' });
            var a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = 'dj-earnings.csv';
            a.click();
          };
        });
    }

    // ---------- DJ Network (DJ-to-DJ messaging) ----------
    function loadDJNetwork(uid) {
      db.collection('dj-verifications').where('status', '==', 'approved').get()
        .then(function(snapshot) {
          var box = document.getElementById('sol-dj-network');
          box.innerHTML = '';
          if (snapshot.empty) { box.innerHTML = '<p style="color:#888;">No other DJs yet.</p>'; return; }
          snapshot.forEach(function(doc) {
            if (doc.id === uid) return;
            var d = doc.data();
            var p = d.djProfile || {};
            var name = p.djName || p.stageName || d.displayName || 'DJ';
            var email = d.email || p.email || '';
            var card = document.createElement('div');
            card.style.cssText = 'background:#111; border:1px solid #333; border-radius:8px; padding:0.75rem; display:flex; justify-content:space-between; align-items:center;';
            card.innerHTML = '<span><strong>' + name + '</strong><br><span style="font-size:0.8rem; color:#666;">' + email + '</span></span><button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem;" data-dm-dj="' + doc.id + '" data-dm-name="' + encodeURIComponent(name) + '">Message</button>';
            box.appendChild(card);
          });
          box.querySelectorAll('button[data-dm-dj]').forEach(function(btn) {
            btn.addEventListener('click', function() {
              var toUid = btn.getAttribute('data-dm-dj');
              var toName = decodeURIComponent(btn.getAttribute('data-dm-name'));
              var msg = prompt('Message to ' + toName + ':');
              if (!msg) return;
              var user = auth.currentUser;
              db.collection('dj-messages').add({
                fromUid: user.uid,
                fromName: user.displayName || user.email,
                toUid: toUid,
                toName: toName,
                message: msg,
                read: false,
                sentAt: firebase.firestore.FieldValue.serverTimestamp()
              }).then(function() {
                btn.textContent = 'Sent!';
                setTimeout(function() { btn.textContent = 'Message'; }, 2000);
              });
            });
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
            card.innerHTML = '<span><strong>' + (w.clientName || 'Client') + '</strong><br><span style="font-size:0.8rem; color:#aaa;">' + (w.eventType || 'Event') + ' — ' + (w.date || 'TBD') + '</span></span>' +
              '<button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.8rem; background:#22c55e;" data-waitlist-accept="' + doc.id + '">Accept</button>';
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
          const d = new Date(b.date || b.eventDate || '');
          d.setHours(23, 59, 59);
          return d >= now;
        } catch { return false; }
      }).sort(function(a, b) {
        return new Date(a.date || a.eventDate || '').getTime() - new Date(b.date || b.eventDate || '').getTime();
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
            '<strong>' + clientName + '</strong>' +
            '<span style="background:#ff4d8f; color:#fff; padding:0.15rem 0.5rem; border-radius:8px; font-size:0.75rem;">NEW</span>' +
            '</div>' +
            '<div style="color:#ccc; font-size:0.9rem; line-height:1.6;">' +
            '<div>📅 ' + (date ? new Date(date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) : 'TBD') + (startTime ? ' at ' + startTime : '') + '</div>' +
            '<div>🎉 ' + eventType + '</div>' +
            (location ? '<div>📍 ' + location + '</div>' : '') +
            '<div>💰 $' + Number(amount).toLocaleString() + '</div>' +
            (special ? '<div style="margin-top:0.5rem; color:#ffd860;">📝 ' + special + '</div>' : '') +
            '</div>' +
            '<div style="display:flex; gap:0.5rem; margin-top:0.75rem;">' +
            '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-action="reject" data-booking-id="' + b.id + '">Reject</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#9333ea;" data-counter-offer="' + b.id + '" data-amount="' + amount + '" data-duration="' + (b.duration || b.event_duration || 4) + '" data-client="' + clientName + '" data-event="' + eventType + '">Counter</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#22c55e;" data-action="accept" data-booking-id="' + b.id + '">Accept</button>' +
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
            '<div><strong>' + eventType + '</strong><br><span style="color:#aaa; font-size:0.85rem;">' + clientName + '</span></div>' +
            '<div style="text-align:right; color:#aaa; font-size:0.85rem;">' + (date ? new Date(date).toLocaleDateString('en-US', { month:'short', day:'numeric' }) : '') + (startTime ? '<br>' + startTime : '') + '</div>' +
            '</div>' +
            '<div id="' + countdownId + '" style="background:#1a1a1a; border-radius:8px; padding:0.5rem 0.75rem; margin-bottom:0.5rem; text-align:center; font-size:0.9rem; color:#00d4ff; font-weight:600;"></div>' +
            (location ? '<div style="color:#ccc; font-size:0.9rem;">📍 ' + location + '</div>' : '') +
            '<div style="color:#22c55e; font-size:0.9rem; margin-top:0.25rem;">💰 $' + Number(amount).toLocaleString() + '</div>' +
            (arrived ? '<div style="color:#22c55e; font-size:0.85rem; margin-top:0.5rem;">✅ Arrived' + (arrivalStatus ? ' — ' + arrivalStatus : '') + '</div>' : '') +
            '<div style="display:flex; gap:0.5rem; margin-top:0.75rem; flex-wrap:wrap;">' +
            (arrived ? '' : '<button type="button" class="submit-btn" style="flex:1; background:#00d4ff; color:#000;" data-im-here="' + b.id + '">I\'m Here</button>') +
            (hasCoords ? '<button type="button" class="submit-btn" style="flex:1; background:#ff4d8f;" data-show-map="' + b.id + '" data-lat="' + evtLat + '" data-lng="' + evtLng + '" data-addr="' + (location || '').replace(/"/g, '&quot;') + '">Show on Map</button>' : '') +
            '<button type="button" class="submit-btn" style="flex:1; background:#333;" data-expand="' + detailsId + '">Details</button>' +
            '</div>' +
            '<div style="display:flex; gap:0.5rem; margin-top:0.5rem; flex-wrap:wrap;">' +
            '<button type="button" class="submit-btn" style="flex:1; background:#1a1a1a; border:1px solid #00d4ff; color:#00d4ff;" data-track-status="' + b.id + '">📊 Track Status</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#1a1a1a; border:1px solid #9333ea; color:#c084fc;" data-song-suggestions="' + b.id + '" data-dj-id="' + user.uid + '" data-dj-name="' + (b.djName || user.displayName || user.email || 'DJ') + '" data-event-type="' + eventType + '">🎵 Song Suggestions</button>' +
            '</div>' +
            '<div id="' + detailsId + '" style="display:none; margin-top:0.75rem; padding-top:0.75rem; border-top:1px solid #333; color:#ccc; font-size:0.85rem; line-height:1.8;">' +
            (duration ? '<div>⏱️ Duration: ' + duration + ' hrs</div>' : '') +
            (clientEmail ? '<div>📧 <a href="mailto:' + clientEmail + '" style="color:#00d4ff;">' + clientEmail + '</a></div>' : '') +
            (clientPhone ? '<div>📱 <a href="tel:' + clientPhone + '" style="color:#00d4ff;">' + clientPhone + '</a></div>' : '') +
            (eqStr ? '<div>🎛️ Equipment: ' + eqStr + '</div>' : '') +
            (special ? '<div style="color:#ffd860;">📝 ' + special + '</div>' : '') +
            '</div>';

          upcomingBox.appendChild(card);

          (function(bId, dateStr, timeStr) {
            var el = document.getElementById('sol-countdown-' + bId);
            if (!el || !dateStr) return;
            function tick() {
              var target = new Date(dateStr);
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
              djConsoleStatus.style.color = '#ff4d8f';
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
          var d = new Date(b.date || b.eventDate || '');
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
          bookingRef.set(updateData, { merge: true })
            .then(function() {
              djConsoleStatus.textContent = 'Booking accepted! Client notified.';
              djConsoleStatus.style.color = '#22c55e';
              setTimeout(function() { djConsoleStatus.textContent = ''; }, 3000);
            })
            .catch(function(err) {
              djConsoleStatus.textContent = 'Failed: ' + err.message;
              djConsoleStatus.style.color = '#ff4d8f';
            });
        });
      } else {
        bookingRef.set(updateData, { merge: true })
          .then(function() {
            djConsoleStatus.textContent = 'Booking rejected.';
            djConsoleStatus.style.color = '#ff4d8f';
            setTimeout(function() { djConsoleStatus.textContent = ''; }, 3000);
          })
          .catch(function(err) {
            djConsoleStatus.textContent = 'Failed: ' + err.message;
            djConsoleStatus.style.color = '#ff4d8f';
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
        djName: user.displayName || user.email || 'DJ',
        djId: user.uid
      }, { merge: true }).catch(function(err) {
        djConsoleStatus.textContent = 'Failed to update status: ' + err.message;
        djConsoleStatus.style.color = '#ff4d8f';
      });
    });

    // DJ live location tracking
    let djLocWatchId = null;
    let djWakeLock = null;
    const djShareLocBtn = document.getElementById('sol-dj-share-loc');
    const djLocStatus = document.getElementById('sol-dj-loc-status');

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
        djLocStatus.style.color = '#ff4d8f';
        return;
      }
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        djLocStatus.textContent = 'HTTPS required for location';
        djLocStatus.style.color = '#ff4d8f';
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
        djLocStatus.style.color = '#ff4d8f';
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
        }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
      }, function(err) {
        onErr(err, false);
      }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 });
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
            djLocStatus.style.color = '#ff4d8f';
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
          djLocStatus.style.color = '#ff4d8f';
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
        }
      }

      function onAutoErr(err) {
        djLocStatus.textContent = 'Auto-share error: ' + err.message;
        djLocStatus.style.color = '#ff4d8f';
      }

      navigator.geolocation.getCurrentPosition(function(pos) {
        onAutoPos(pos);
        djLocWatchId = navigator.geolocation.watchPosition(onAutoPos, onAutoErr, {
          enableHighAccuracy: true, maximumAge: 10000, timeout: 20000
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
      }, onAutoErr, { enableHighAccuracy: true, maximumAge: 10000, timeout: 20000 });
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
      var el = createSolPin('#ff4d8f', 16);
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
            item.innerHTML = '<span><strong>' + (c.clientName || 'Client') + '</strong><br><span style="font-size:0.85rem; color:#888;">' + (c.lastMessage || 'No messages yet') + '</span></span><span style="font-size:0.75rem; color:#ff4d8f;">' + (c.unreadCount ? c.unreadCount + ' unread' : '') + '</span>';
            item.addEventListener('click', function() {
              openChat(doc.id);
            });
            djConversationsBox.appendChild(item);
          });
          updateDjModeBadge(totalUnread);
        }, function(err) {
          console.error('DJ conversations listener error:', err);
          djConversationsBox.innerHTML = '<p style="color:#ff4d8f;">Could not load conversations: ' + err.message + '</p>';
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
      djModeActive = !djModeActive;
      if (djModeActive) {
        djConsole.style.display = 'block';
        clientView.style.display = 'none';
        djModeToggleBtn.textContent = 'Client Mode';
        const user = auth.currentUser;
        if (user) {
          subscribeDJStatus(user);
          subscribeDJConversations(user);
          subscribeDJBookings(user);
          loadDJSetupForm(user);
          loadBlockedDates(user.uid);
          loadDjGallery(user.uid);
          loadDJEarnings(user.uid);
          loadDJNetwork(user.uid);
          loadDJWaitlist(user.uid);
          loadDJCalendarData(user.uid);
          loadDJAnalytics(user.uid);
        }
      } else {
        djConsole.style.display = 'none';
        clientView.style.display = 'block';
        djModeToggleBtn.textContent = 'DJ Mode';
        if (djStatusUnsubscribe) { djStatusUnsubscribe(); djStatusUnsubscribe = null; }
        if (djConversationsUnsubscribe) { djConversationsUnsubscribe(); djConversationsUnsubscribe = null; }
        if (djBookingsUnsubscribe) { djBookingsUnsubscribe(); djBookingsUnsubscribe = null; }
      }
    });

    // ---------- Admin Console ----------
    const ADMIN_UID = '3i7fQdPjN0Qxz3FysVPvnhtxzlJ3';
    const ADMIN_EMAIL = 'djweirdnasty@gmail.com';
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
      if (user.uid === ADMIN_UID || user.email === ADMIN_EMAIL) {
        isAdmin = true;
        adminToggleBtn.style.display = 'inline-block';
        return;
      }
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
        djModeToggleBtn.textContent = 'DJ Mode';
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
              card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem; display:flex; align-items:center; gap:1rem;';
              var statusColor = d.status === 'approved' ? '#22c55e' : d.status === 'pending' ? '#ffd860' : '#ff3b30';
              var avatarHtml = djAvatar
                ? '<img loading="lazy" src="' + djAvatar + '" style="width:48px;height:48px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'"><div style="width:48px;height:48px;border-radius:50%;background:#00d4ff;display:none;align-items:center;justify-content:center;font-weight:700;color:#000;flex-shrink:0;">' + (djName.charAt(0) || 'D').toUpperCase() + '</div>'
                : '<div style="width:48px;height:48px;border-radius:50%;background:#00d4ff;display:flex;align-items:center;justify-content:center;font-weight:700;color:#000;flex-shrink:0;">' + (djName.charAt(0) || 'D').toUpperCase() + '</div>';
              card.innerHTML = avatarHtml +
                '<div style="flex:1;"><strong>' + djName + '</strong>' +
                (djEmail ? '<br><span style="font-size:0.85rem; color:#aaa;">' + djEmail + '</span>' : '<br><span style="font-size:0.8rem; color:#666;">UID: ' + uidShort + '</span>') +
                (djCity ? '<br><span style="font-size:0.8rem; color:#666;">' + djCity + (djState ? ', ' + djState : '') + '</span>' : '') +
                (genresStr ? '<br><span style="font-size:0.8rem; color:#666;">' + genresStr + '</span>' : '') +
                (djRate ? '<br><span style="font-size:0.8rem; color:#22c55e;">$' + djRate + '/hr</span>' : '') +
                '</div>' +
                '<span style="color:' + statusColor + '; font-size:0.85rem; font-weight:600;">' + (d.status || 'unknown') + '</span>' +
                '<button type="button" class="submit-btn" style="background:#ff3b30; padding:0.4rem 0.7rem; font-size:0.8rem;" data-delete-dj="' + v.id + '">Delete</button>';
              djsList.appendChild(card);
            });
            document.getElementById('sol-admin-stat-djs').textContent = count;
          });
        })
        .catch(function(err) {
          djsList.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
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
          var statusColor = b.status === 'confirmed' ? '#22c55e' : b.status === 'pending' ? '#ffd860' : b.status === 'completed' ? '#00d4ff' : '#ff3b30';
          card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
            '<strong>' + (b.eventType || b.event_type || 'Event') + '</strong>' +
            '<span style="color:' + statusColor + '; font-size:0.85rem;">' + (b.status || 'unknown') + '</span>' +
            '</div>' +
            '<div style="color:#ccc; font-size:0.85rem; line-height:1.6;">' +
            '<div>👤 Client: ' + (b.clientName || b.client_name || 'Unknown') + '</div>' +
            '<div>🎧 DJ: ' + (b.djName || 'Unknown') + '</div>' +
            '<div>📅 ' + (b.date || b.eventDate || 'TBD') + (b.startTime ? ' at ' + b.startTime : '') + '</div>' +
            '<div>💰 $' + Number(b.totalAmount || b.total_cost || 0).toLocaleString() + '</div>' +
            '</div>' +
            (b.status !== 'cancelled' && b.status !== 'completed' ? '<button type="button" class="submit-btn" style="background:#ff3b30; padding:0.4rem 0.7rem; font-size:0.8rem; margin-top:0.5rem;" data-cancel-admin-booking="' + doc.id + '">Cancel Booking</button>' : '') +
            '<button type="button" class="submit-btn" style="background:#1a1a1a; border:1px solid #00d4ff; color:#00d4ff; padding:0.4rem 0.7rem; font-size:0.8rem; margin-top:0.5rem;" data-track-status="' + doc.id + '">📊 Track Status</button>';
          bookingsList.appendChild(card);
        });
        document.getElementById('sol-admin-stat-bookings').textContent = count;
      }, function(err) {
        bookingsList.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
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
            '<strong>' + djName + '</strong>' +
            '<span style="color:' + statusColor + '; font-size:0.85rem;">' + (d.status || 'unknown') + '</span>' +
            '</div>' +
            '<div style="color:#ccc; font-size:0.85rem; margin-bottom:0.75rem;">' +
            (djEmail ? '<div>📧 ' + djEmail + '</div>' : '') +
            (djCity ? '<div>📍 ' + djCity + (djState ? ', ' + djState : '') + '</div>' : '') +
            (djBio ? '<div>📝 ' + djBio + '</div>' : '') +
            (genresStr ? '<div>🎵 ' + genresStr + '</div>' : '') +
            (djRate ? '<div>💰 $' + djRate + '/hr</div>' : '') +
            (djExp ? '<div>⏱️ ' + djExp + ' years experience</div>' : '') +
            '</div>' +
            '<div style="display:flex; gap:0.5rem;">' +
            '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-action="reject" data-uid="' + doc.id + '">Reject</button>' +
            '<button type="button" class="submit-btn" style="flex:1; background:#22c55e;" data-action="approve" data-uid="' + doc.id + '">Approve</button>' +
            '</div>';
          verificationsList.appendChild(card);
        });
        verificationsList.querySelectorAll('button[data-action]').forEach(function(btn) {
          btn.addEventListener('click', function() {
            var action = btn.getAttribute('data-action');
            var uid = btn.getAttribute('data-uid');
            var newStatus = action === 'approve' ? 'approved' : 'rejected';
            db.collection('dj-verifications').doc(uid).set({
              status: newStatus,
              reviewedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true }).then(function() {
              if (action === 'approve') {
                db.collection('users').doc(uid).set({
                  isVerifiedDJ: true,
                  verifiedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                trackSolEvent('dj_verification_approved', { uid: uid, method: 'admin_panel' });
                trackSolEvent('dj_registration', { uid: uid, method: 'admin_panel_verification' });
              } else {
                trackSolEvent('dj_verification_rejected', { uid: uid });
              }
              adminStatus.textContent = 'DJ ' + newStatus + ' successfully.';
              adminStatus.style.color = action === 'approve' ? '#22c55e' : '#ff3b30';
              setTimeout(function() { adminStatus.textContent = ''; }, 3000);
            }).catch(function(err) {
              adminStatus.textContent = 'Error: ' + err.message;
              adminStatus.style.color = '#ff4d8f';
            });
          });
        });
      }, function(err) {
        verificationsList.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
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
      var tabs = ['djs','bookings','verifications','users','earnings','add-dj','disputes','settings'];
      tabs.forEach(function(t) {
        var panel = document.getElementById('sol-admin-panel-' + t);
        var btn = document.getElementById('sol-admin-tab-' + t);
        if (panel) panel.style.display = (t === activeId) ? 'block' : 'none';
        if (btn) {
          if (t === activeId) { btn.style.background = '#00d4ff'; btn.style.color = '#000'; }
          else { btn.style.background = ''; btn.style.color = ''; }
        }
      });
    }

    document.getElementById('sol-admin-tab-djs').addEventListener('click', function() { adminSwitchTab('djs'); });
    document.getElementById('sol-admin-tab-bookings').addEventListener('click', function() { adminSwitchTab('bookings'); });
    document.getElementById('sol-admin-tab-verifications').addEventListener('click', function() { adminSwitchTab('verifications'); });
    document.getElementById('sol-admin-tab-users').addEventListener('click', function() { adminSwitchTab('users'); loadAdminUsers(); });
    document.getElementById('sol-admin-tab-earnings').addEventListener('click', function() { adminSwitchTab('earnings'); loadAdminEarnings(); });
    document.getElementById('sol-admin-tab-add-dj').addEventListener('click', function() { adminSwitchTab('add-dj'); });
    document.getElementById('sol-admin-tab-disputes').addEventListener('click', function() { adminSwitchTab('disputes'); loadAdminDisputes(); });
    document.getElementById('sol-admin-tab-settings').addEventListener('click', function() { adminSwitchTab('settings'); loadAdminSettings(); });

    document.getElementById('sol-purge-test-data').addEventListener('click', purgeTestData);

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
          usersList.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
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
        var avatarHtml = avatar
          ? '<img loading="lazy" src="' + avatar + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;flex-shrink:0;" onerror="this.style.display=\'none\'"><div style="width:40px;height:40px;border-radius:50%;background:#ff4d8f;display:none;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;">' + (name.charAt(0) || 'U').toUpperCase() + '</div>'
          : '<div style="width:40px;height:40px;border-radius:50%;background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;flex-shrink:0;">' + (name.charAt(0) || 'U').toUpperCase() + '</div>';
        var badges = '';
        var now = Date.now();
        var created = d.createdAt && typeof d.createdAt.toMillis === 'function' ? d.createdAt.toMillis() : 0;
        var isNew = (now - created) < 24 * 60 * 60 * 1000;
        if (isNew) badges += '<span style="background:#ffd860; color:#000; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">NEW</span> ';
        if (isAdmin) badges += '<span style="background:#00d4ff; color:#000; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">ADMIN</span> ';
        if (isDJ) badges += '<span style="background:#22c55e; color:#fff; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">DJ</span> ';
        if (banned) badges += '<span style="background:#ff3b30; color:#fff; padding:0.1rem 0.4rem; border-radius:4px; font-size:0.7rem; font-weight:600;">BANNED</span> ';
        card.innerHTML = avatarHtml +
          '<div style="flex:1; cursor:pointer;" data-view-user="' + u.id + '"><strong>' + name + '</strong>' +
          (email ? '<br><span style="font-size:0.85rem; color:#aaa;">' + email + '</span>' : '') +
          '<br><span style="font-size:0.8rem; color:#666;">UID: ' + u.id.substring(0, 12) + '...</span></div>' +
          '<div style="display:flex; flex-direction:column; gap:0.25rem; align-items:flex-end;">' +
          '<div>' + badges + '</div>' +
          '<button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:#00d4ff; color:#000;" data-view-user="' + u.id + '">View</button>' +
          '<button type="button" class="submit-btn" style="padding:0.3rem 0.6rem; font-size:0.75rem; background:' + (banned ? '#22c55e' : '#ff3b30') + ';" data-ban-user="' + u.id + '" data-banned="' + (banned ? '1' : '0') + '">' + (banned ? 'Unban' : 'Ban') + '</button>' +
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
          if (uid === ADMIN_UID) {
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
    }

    // ---------- Admin User Profile Modal ----------
    function createAdminUserModal() {
      if (document.getElementById('sol-user-modal')) return;
      var modal = document.createElement('div');
      modal.id = 'sol-user-modal';
      modal.style.cssText = 'display:none; position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.85); z-index:10000; align-items:center; justify-content:center; padding:1rem; box-sizing:border-box;';
      modal.innerHTML =
        '<div style="background:#111; border:1px solid #ff4d8f; border-radius:16px; max-width:700px; width:100%; max-height:90vh; overflow-y:auto; padding:1.5rem; position:relative;">' +
        '<button type="button" id="sol-user-modal-close" style="position:absolute; top:1rem; right:1rem; background:none; border:none; color:#fff; font-size:1.5rem; cursor:pointer;">&times;</button>' +
        '<h3 style="margin-top:0; color:#ff4d8f;">User Profile</h3>' +
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
          content.innerHTML = '<p style="color:#ff4d8f;">User not found.</p>';
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

        var isFounder = (uid === ADMIN_UID || email === ADMIN_EMAIL);
        var founderBadge = isFounder ? '<span style="background:#22c55e; color:#fff; padding:0.4rem 0.8rem; border-radius:8px; font-size:0.85rem; font-weight:600; margin-bottom:0.5rem; display:inline-block;">Founder / Developer — protected</span>' : '';
        var adminActionsHtml = isFounder ?
          ('<div style="display:flex; flex-wrap:wrap; gap:0.5rem;">' + founderBadge + '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#ff4d8f;" data-admin-action="resetPassword" data-uid="' + uid + '" data-email="' + email + '">Reset Password</button></div>') :
          ('<div style="display:flex; flex-wrap:wrap; gap:0.5rem;">' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:' + (banned ? '#22c55e' : '#ff3b30') + ';" data-admin-action="ban" data-uid="' + uid + '" data-banned="' + banned + '">' + (banned ? (isDJ ? 'Unsuspend DJ' : 'Unban User') : (isDJ ? 'Suspend DJ' : 'Ban User')) + '</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#00d4ff; color:#000;" data-admin-action="admin" data-uid="' + uid + '">' + (isAdmin ? 'Remove Admin' : 'Promote to Admin') + '</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#22c55e;" data-admin-action="verifyClient" data-uid="' + uid + '">Verify Client (Bypass)</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#ffd860; color:#000;" data-admin-action="promoteDj" data-uid="' + uid + '">' + (isDJ ? 'Revoke DJ' : 'Promote to DJ (Bypass)') + '</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#ff4d8f;" data-admin-action="resetPassword" data-uid="' + uid + '" data-email="' + email + '">Reset Password</button>' +
          '<button type="button" class="submit-btn" style="padding:0.4rem 0.8rem; font-size:0.85rem; background:#333;" data-admin-action="delete" data-uid="' + uid + '">Delete Account</button>' +
          '</div>');

        content.innerHTML =
          '<div style="display:flex; align-items:center; gap:1rem; margin-bottom:1rem;">' +
          (photo ? '<img src="' + photo + '" style="width:64px;height:64px;border-radius:50%;object-fit:cover;">' : '<div style="width:64px;height:64px;border-radius:50%;background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-size:1.5rem;font-weight:700;color:#fff;">' + (name.charAt(0) || 'U').toUpperCase() + '</div>') +
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
        content.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
      });
    }

    function runAdminUserAction(btn) {
      var action = btn.getAttribute('data-admin-action');
      var uid = btn.getAttribute('data-uid');
      var statusEl = document.getElementById('sol-user-modal-status');
      if (!statusEl) return;
      statusEl.style.color = '#ffd860';
      statusEl.textContent = 'Working...';

      if (uid === ADMIN_UID && action !== 'resetPassword') {
        statusEl.style.color = '#ff4d8f';
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
        }).catch(function(err) { statusEl.style.color = '#ff4d8f'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'admin') {
        var isAdmin = btn.textContent === 'Remove Admin';
        db.collection('users').doc(uid).set({ isAdmin: !isAdmin }, { merge: true }).then(function() {
          statusEl.style.color = '#22c55e';
          statusEl.textContent = isAdmin ? 'Admin removed.' : 'User is now admin.';
          openAdminUserModal(uid);
          loadAdminUsers();
        }).catch(function(err) { statusEl.style.color = '#ff4d8f'; statusEl.textContent = err.message; });
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
        }).catch(function(err) { statusEl.style.color = '#ff4d8f'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'promoteDj') {
        var isRevoke = btn.textContent === 'Revoke DJ';
        var name;
        if (isRevoke) {
          var batch = db.batch();
          batch.set(db.collection('users').doc(uid), { isVerifiedDJ: false, revokedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
          batch.set(db.collection('dj-verifications').doc(uid), { status: 'revoked', revokedAt: firebase.firestore.FieldValue.serverTimestamp() }, { merge: true });
          batch.set(db.collection('djs').doc(uid), { isVerified: false, status: 'revoked' }, { merge: true });
          batch.commit().then(function() {
            statusEl.style.color = '#22c55e';
            statusEl.textContent = 'DJ status revoked.';
            trackSolEvent('dj_revoked', { uid: uid });
            openAdminUserModal(uid);
            loadAdminUsers();
          }).catch(function(err) { statusEl.style.color = '#ff4d8f'; statusEl.textContent = err.message; });
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
        }).catch(function(err) { statusEl.style.color = '#ff4d8f'; statusEl.textContent = err.message; });
        return;
      }

      if (action === 'resetPassword') {
        var email = btn.getAttribute('data-email');
        if (!email) {
          statusEl.style.color = '#ff4d8f';
          statusEl.textContent = 'No email on file.';
          return;
        }
        auth.sendPasswordResetEmail(email).then(function() {
          statusEl.style.color = '#22c55e';
          statusEl.textContent = 'Password reset email sent.';
        }).catch(function(err) { statusEl.style.color = '#ff4d8f'; statusEl.textContent = err.message; });
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
        }).catch(function(err) { statusEl.style.color = '#ff4d8f'; statusEl.textContent = err.message; });
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
              return { id: id, paypal: doc.exists ? (doc.data().paypal || '') : '' };
            }).catch(function() { return { id: id, paypal: '' }; });
          });

          Promise.all(djLookups).then(function(results) {
            var paypalMap = {};
            results.forEach(function(r) { paypalMap[r.id] = r.paypal; });

            entries.forEach(function(e) {
              var card = document.createElement('div');
              card.style.cssText = 'background:#111; border:1px solid #333; border-radius:12px; padding:1rem; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.75rem;';
              var paypalInfo = paypalMap[e.id] || '';

              var payBtnHtml;
              if (e.unpaidTotal <= 0) {
                payBtnHtml = '<span style="display:inline-block; margin-top:0.4rem; font-size:0.75rem; color:#22c55e;">✅ All paid</span>';
              } else if (isPaypalEmail(paypalInfo)) {
                payBtnHtml = '<button type="button" class="submit-btn sol-auto-payout-btn" data-dj-id="' + e.id + '" style="display:inline-block; margin-top:0.4rem; background:#0070ba; color:#fff; padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:8px;">Pay $' + e.unpaidTotal.toFixed(2) + ' via PayPal</button>';
              } else if (paypalInfo) {
                var payoutUrl = buildPaypalPayoutUrl(paypalInfo, e.unpaidTotal);
                payBtnHtml = '<a href="' + payoutUrl + '" target="_blank" rel="noopener" class="submit-btn" style="display:inline-block; margin-top:0.4rem; background:#0070ba; color:#fff; text-decoration:none; padding:0.4rem 0.8rem; font-size:0.8rem; border-radius:8px;">Pay via PayPal (manual)</a>';
              } else {
                payBtnHtml = '<span style="display:inline-block; margin-top:0.4rem; font-size:0.75rem; color:#ffd860;" title="This DJ has not added a PayPal email or PayPal.me link yet.">🔒 $' + e.unpaidTotal.toFixed(2) + ' held in admin account (djweirdnasty) until DJ adds PayPal</span>';
              }

              card.innerHTML = '<div><strong>' + e.name + '</strong><br><span style="font-size:0.85rem; color:#aaa;">' + e.gigs + ' gigs completed</span></div>' +
                '<div style="text-align:right;"><span style="font-size:1.2rem; font-weight:700; color:#ffd860;">$' + e.total.toFixed(2) + '</span><br><span style="font-size:0.8rem; color:#666;">earnings (85%)</span><br>' + payBtnHtml + '</div>';
              earningsList.appendChild(card);
            });

            earningsList.querySelectorAll('.sol-auto-payout-btn').forEach(function(btn) {
              btn.addEventListener('click', function() {
                var djId = btn.getAttribute('data-dj-id');
                if (!confirm('Send the outstanding PayPal payout to this DJ now? This cannot be undone.')) return;

                var original = btn.textContent;
                btn.disabled = true;
                btn.textContent = 'Sending...';

                var sendPaypalPayout = functions.httpsCallable('sendPaypalPayout');
                sendPaypalPayout({ djId: djId })
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
          });
        })
        .catch(function(err) {
          earningsList.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
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

        var batch = db.batch();
        batch.set(db.collection('djs').doc(toUid), Object.assign({}, sourceDjs, targetDjs), { merge: true });

        var mergedUser = Object.assign({}, sourceUser, targetUser);
        mergedUser.isVerifiedDJ = mergedUser.isVerifiedDJ || sourceUser.isVerifiedDJ;
        if (sourceUser.roles && Array.isArray(sourceUser.roles)) {
          mergedUser.roles = Array.from(new Set((mergedUser.roles || []).concat(sourceUser.roles)));
        }
        if (sourceUser.role && !mergedUser.role) mergedUser.role = sourceUser.role;
        batch.set(db.collection('users').doc(toUid), mergedUser, { merge: true });

        if (sourceVerify.status === 'approved' && targetVerify.status !== 'approved') {
          batch.set(db.collection('dj-verifications').doc(toUid), { status: 'approved', approvedAt: sourceVerify.approvedAt || new Date() }, { merge: true });
        } else if (sourceVerify.status && !targetVerify.status) {
          batch.set(db.collection('dj-verifications').doc(toUid), sourceVerify, { merge: true });
        }
        batch.delete(db.collection('dj-verifications').doc(fromUid));

        var mergedBlocked = Array.from(new Set((targetAvail.blockedDates || []).concat(sourceAvail.blockedDates || [])));
        batch.set(db.collection('dj-availability').doc(toUid), { blockedDates: mergedBlocked }, { merge: true });
        batch.delete(db.collection('dj-availability').doc(fromUid));

        var mergedPhotos = Array.from(new Set((targetGallery.photos || []).concat(sourceGallery.photos || [])));
        batch.set(db.collection('dj-galleries').doc(toUid), { photos: mergedPhotos }, { merge: true });
        batch.delete(db.collection('dj-galleries').doc(fromUid));

        batch.set(db.collection('dj-status').doc(toUid), Object.assign({}, sourceStatus, targetStatus), { merge: true });
        batch.delete(db.collection('dj-status').doc(fromUid));

        return db.collection('bookings').where('djId', '==', fromUid).get().then(function(bookingsSnap) {
          bookingsSnap.forEach(function(doc) {
            batch.update(doc.ref, { djId: toUid, djName: targetDjs.name || targetDjs.stageName || toName });
          });
          return Promise.all([
            db.collection('tips').where('djId', '==', fromUid).get(),
            db.collection('disputes').where('djId', '==', fromUid).get(),
            db.collection('feedback').where('djId', '==', fromUid).get(),
            db.collection('saved-djs').where('djId', '==', fromUid).get()
          ]);
        }).then(function(snaps) {
          snaps[0].forEach(function(doc) { batch.update(doc.ref, { djId: toUid }); });
          snaps[1].forEach(function(doc) { batch.update(doc.ref, { djId: toUid }); });
          snaps[2].forEach(function(doc) { batch.update(doc.ref, { djId: toUid }); });
          snaps[3].forEach(function(doc) { batch.update(doc.ref, { djId: toUid, djName: targetDjs.name || targetDjs.stageName || toName }); });
          batch.delete(db.collection('djs').doc(fromUid));
          batch.delete(db.collection('users').doc(fromUid));
          return batch.commit();
        });
      }).then(function() {
        statusEl.textContent = 'Merged successfully. Refresh to see changes.';
        statusEl.style.color = '#22c55e';
        loadAdminEarnings();
        loadAdminUsers();
      }).catch(function(err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.style.color = '#ff4d8f';
      });
    }

    document.getElementById('sol-merge-djs').addEventListener('click', mergeDjs);

    function purgeCollection(collectionName) {
      return db.collection(collectionName).get().then(function(snapshot) {
        if (snapshot.empty) return 0;
        var batch = db.batch();
        var count = 0;
        var total = 0;
        var promises = [];
        snapshot.forEach(function(doc) {
          batch.delete(doc.ref);
          count++;
          total++;
          if (count === 500) {
            promises.push(batch.commit());
            batch = db.batch();
            count = 0;
          }
        });
        if (count > 0) promises.push(batch.commit());
        return Promise.all(promises).then(function() { return total; });
      });
    }

    function purgeTestData() {
      if (!isAdmin) { alert('Admin only.'); return; }
      if (!confirm('WARNING: This permanently erases ALL bookings, tips, disputes, feedback, setlists, playlists, saved-djs, and conversations. Users and DJ profiles remain. No real money was collected. Continue?')) return;
      var typed = window.prompt('Type DELETE to confirm erasing all test earnings data:');
      if (typed !== 'DELETE') { alert('Cancelled.'); return; }
      var statusEl = document.getElementById('sol-purge-status');
      statusEl.textContent = 'Purging test data...';
      statusEl.style.color = '#ffd860';
      Promise.all([
        purgeCollection('bookings'),
        purgeCollection('tips'),
        purgeCollection('disputes'),
        purgeCollection('feedback'),
        purgeCollection('setlists'),
        purgeCollection('playlists'),
        purgeCollection('saved-djs'),
        purgeCollection('conversations')
      ]).then(function(results) {
        var total = results.reduce(function(a, b) { return a + b; }, 0);
        return db.collection('dj-status').get().then(function(snapshot) {
          var batch = db.batch();
          var count = 0;
          var promises = [];
          snapshot.forEach(function(doc) {
            batch.update(doc.ref, {
              isOnline: false,
              sharingLocation: false,
              location: firebase.firestore.FieldValue.delete()
            });
            count++;
            if (count === 500) {
              promises.push(batch.commit());
              batch = db.batch();
              count = 0;
            }
          });
          if (count > 0) promises.push(batch.commit());
          return Promise.all(promises).then(function() { return total; });
        });
      }).then(function(total) {
        statusEl.textContent = 'Purged ' + total + ' test records. Earnings will refresh shortly.';
        statusEl.style.color = '#22c55e';
        loadAdminEarnings();
        loadAdminBookings();
      }).catch(function(err) {
        statusEl.textContent = 'Error: ' + err.message;
        statusEl.style.color = '#ff4d8f';
      });
    }

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
        statusEl.style.color = '#ff4d8f';
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
            '<strong>' + (typeLabels[d.type] || d.type || 'Unknown') + '</strong>' +
            '<span style="color:' + statusColor + '; font-size:0.85rem;">' + (d.status || 'open') + '</span></div>' +
            '<div style="color:#ccc; font-size:0.85rem; margin-bottom:0.5rem;">' +
            '<div>From: ' + (d.clientEmail || 'Unknown') + '</div>' +
            '<div>Booking: ' + (d.bookingId || '').substring(0, 12) + '...</div></div>' +
            '<p style="color:#aaa; font-size:0.85rem; margin-bottom:0.75rem;">' + (d.description || '') + '</p>' +
            (d.status === 'open' ?
              '<div style="display:flex; gap:0.5rem;">' +
              '<button type="button" class="submit-btn" style="flex:1; background:#22c55e;" data-resolve-dispute="' + doc.id + '" data-resolution="resolved">Resolve</button>' +
              '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-resolve-dispute="' + doc.id + '" data-resolution="rejected">Reject</button>' +
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
        list.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
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
        return;
      }
      var bookings = [];
      snapshot.forEach(function(doc) { bookings.push({ id: doc.id, ...doc.data() }); });
      bookings.sort(function(a, b) {
        var da = new Date(a.date || a.eventDate || 0).getTime();
        var db = new Date(b.date || b.eventDate || 0).getTime();
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
        var djName = b.djName || 'DJ';
        var amount = b.totalAmount || b.total_cost || 0;
        var status = b.status || 'unknown';
        var statusColor = status === 'confirmed' ? '#22c55e' : status === 'pending' ? '#ffd860' : status === 'completed' ? '#00d4ff' : '#ff3b30';
        var canCancel = status === 'pending' || status === 'confirmed';
        var canRate = status === 'completed' && !b.clientRated;
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
            var color = isActive ? (i === 4 ? '#00d4ff' : i === 3 ? '#22c55e' : i === 2 ? '#ffd860' : '#ff4d8f') : '#333';
            var size = isCurrent ? '12px' : '10px';
            return '<div style="display:flex; flex-direction:column; align-items:center; flex:1;">' +
              '<div style="width:' + size + '; height:' + size + '; border-radius:50%; background:' + color + ';' + (isCurrent ? 'box-shadow:0 0 8px ' + color + ';' : '') + ' transition:all 0.3s;"></div>' +
              '<span style="font-size:0.65rem; color:' + (isActive ? '#ccc' : '#555') + '; margin-top:4px; text-align:center;">' + label + '</span>' +
              '</div>';
          }).join('');
          var connectors = steps.slice(0, -1).map(function(_, i) {
            var isDone = i < currentStep;
            return '<div style="flex:0.5; height:2px; background:' + (isDone ? '#ff4d8f' : '#333') + '; margin-top:5px; transition:background 0.3s;"></div>';
          }).join('');
          var dotsRow = '';
          for (var si = 0; si < steps.length; si++) {
            dotsRow += dots[si] ? '' : '';
          }
          // Interleave dots and connectors
          var barHtml = '<div style="display:flex; align-items:flex-start; margin:0.75rem 0;">';
          for (var si2 = 0; si2 < steps.length; si2++) {
            barHtml += '<div style="display:flex; flex-direction:column; align-items:center; flex:1;">' +
              '<div style="width:' + (si2 === currentStep ? '12px' : '10px') + '; height:' + (si2 === currentStep ? '12px' : '10px') + '; border-radius:50%; background:' + (si2 <= currentStep ? (si2 === 4 ? '#00d4ff' : si2 === 3 ? '#22c55e' : si2 === 2 ? '#ffd860' : '#ff4d8f') : '#333') + ';' + (si2 === currentStep ? 'box-shadow:0 0 8px ' + (si2 === 4 ? '#00d4ff' : si2 === 3 ? '#22c55e' : si2 === 2 ? '#ffd860' : '#ff4d8f') + ';' : '') + ' transition:all 0.3s;"></div>' +
              '<span style="font-size:0.65rem; color:' + (si2 <= currentStep ? '#ccc' : '#555') + '; margin-top:4px; text-align:center;">' + steps[si2] + '</span>' +
              '</div>';
            if (si2 < steps.length - 1) {
              barHtml += '<div style="flex:0.5; height:2px; background:' + (si2 < currentStep ? '#ff4d8f' : '#333') + '; margin-top:5px; transition:background 0.3s;"></div>';
            }
          }
          barHtml += '</div>';
          progressBar = barHtml;
        }

        var djLiveLink = '';
        if (djSharing && status === 'confirmed' && b.djId) {
          djLiveLink = '<div style="margin-top:0.5rem;"><button type="button" class="submit-btn" style="background:#22c55e; padding:0.4rem 0.8rem; font-size:0.8rem;" data-track-dj="' + b.djId + '">Track DJ Live Location</button></div>';
        }

        card.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:0.5rem;">' +
          '<strong>' + eventType + '</strong>' +
          '<span style="color:' + statusColor + '; font-size:0.85rem; font-weight:600; text-transform:capitalize;">' + status + '</span>' +
          '</div>' +
          '<div style="color:#ccc; font-size:0.9rem; line-height:1.6;">' +
          '<div>🎧 ' + djName + '</div>' +
          '<div>📅 ' + (date ? new Date(date).toLocaleDateString('en-US', { weekday:'short', month:'short', day:'numeric' }) : 'TBD') + (startTime ? ' at ' + startTime : '') + '</div>' +
          '<div>💰 $' + Number(amount).toLocaleString() + '</div>' +
          '</div>' +
          progressBar +
          djLiveLink +
          '<div style="display:flex; gap:0.5rem; margin-top:0.75rem;">' +
          (canCancel ? '<button type="button" class="submit-btn" style="flex:1; background:#ff3b30;" data-cancel-booking="' + b.id + '" data-booking-date="' + (date || '') + '">Cancel</button>' : '') +
          (canRate ? '<button type="button" class="submit-btn" style="flex:1; background:#ffd860; color:#000;" data-rate-booking="' + b.id + '" data-rate-dj="' + (b.djId || '') + '">Rate DJ</button>' : '') +
          '</div>';
        box.appendChild(card);
      });

      box.querySelectorAll('button[data-cancel-booking]').forEach(function(btn) {
        btn.addEventListener('click', function() {
          var bookingId = btn.getAttribute('data-cancel-booking');
          var bookingDate = btn.getAttribute('data-booking-date') || '';
          var daysUntil = 999;
          if (bookingDate) {
            var eventDate = new Date(bookingDate);
            daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
          }
          var refundMsg = daysUntil >= 7 ? '50% refund will be processed.' : 'No refund (within 7 days of event).';
          if (!confirm('Cancel this booking? ' + refundMsg)) return;
          db.collection('bookings').doc(bookingId).set({
            status: 'cancelled',
            cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
            refundDue: daysUntil >= 7,
            refundAmount: daysUntil >= 7 ? 50 : 0
          }, { merge: true }).catch(function(err) {
            alert('Error: ' + err.message);
          });
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
      if (!code) { statusEl.textContent = 'Enter a code.'; statusEl.style.color = '#ff4d8f'; return; }
      db.collection('promo-codes').doc(code).get().then(function(doc) {
        if (doc.exists) {
          var p = doc.data();
          if (p.active === false) { statusEl.textContent = 'This code is no longer active.'; statusEl.style.color = '#ff3b30'; return; }
          activePromo = { code: code, discount: p.discount || 0, type: p.type || 'percent' };
          var msg = p.type === 'flat' ? '$' + p.discount + ' off!' : p.discount + '% off!';
          statusEl.textContent = '✅ Code applied: ' + msg;
          statusEl.style.color = '#22c55e';
          trackSolEvent('promo_code_applied', { code: code, discount: p.discount, type: p.type });
          calculatePrice();
        } else {
          statusEl.textContent = 'Invalid promo code.';
          statusEl.style.color = '#ff4d8f';
          activePromo = null;
        }
      }).catch(function() {
        statusEl.textContent = 'Could not verify code.';
        statusEl.style.color = '#ff4d8f';
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
            item.innerHTML = '<span style="color:#ccc; font-size:0.9rem;">🎵 ' + s.song + '</span><button type="button" style="background:none; border:none; color:#ff3b30; cursor:pointer; font-size:1.2rem;" data-del-song="' + doc.id + '">&times;</button>';
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
      if (!bookingId || !type || !text) { statusEl.textContent = 'Fill all fields.'; statusEl.style.color = '#ff4d8f'; return; }
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
        statusEl.style.color = '#ff4d8f';
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

        isVerifiedDJ = false;
        djModeToggleBtn.style.display = 'none';
        djModeActive = false;
        djConsole.style.display = 'none';
        clientView.style.display = 'block';
        djModeToggleBtn.textContent = 'DJ Mode';
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
      inner.style.cssText = 'width:40px;height:40px;border-radius:50%;overflow:hidden;border:3px solid #22c55e;background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-size:18px;font-weight:700;color:#fff;';
      if (avatar) {
        inner.innerHTML = '<img loading="lazy" src="' + avatar + '" style="width:100%;height:100%;object-fit:cover;" onerror="this.style.display=\'none\'; this.parentElement.style.background=\'#ff4d8f\'; this.parentElement.innerHTML=\'' + initial + '\'" />';
      } else {
        inner.textContent = initial;
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
        var selEl = createSolPin('#ff4d8f', 16);
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

    function renderDJMarker(djId, data, lat, lng) {
      var djName = data.djName || 'DJ';
      var initial = djName.charAt(0).toUpperCase();
      var avatar = data.djAvatar || data.avatar || data.photoURL || '';
      var popupAvatar = avatar
        ? '<img loading="lazy" src="' + avatar + '" style="width:40px;height:40px;border-radius:50%;display:block;margin:0 auto 6px;object-fit:cover;" onerror="this.style.display=\'none\'" />'
        : '<div style="width:40px;height:40px;border-radius:50%;background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-size:20px;font-weight:700;color:#fff;margin:0 auto 6px;">' + initial + '</div>';
      var popupHtml = '<div style="text-align:center;">' + popupAvatar +
                      '<strong>' + djName + '</strong><br>' +
                      '<span style="color:#22c55e;font-size:12px;">Online</span>' +
                      '</div>';

      if (djMarkers[djId]) {
        djMarkers[djId].setLngLat([lng, lat]);
        djMarkers[djId].setPopup(new mapboxgl.Popup().setHTML(popupHtml));
      } else {
        var el = createDJMarkerEl(avatar, initial);
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

    function updateDJCount() {
      const count = Object.keys(onlineDJs).length;
      mapStatus.textContent = count === 0 ? 'No DJs currently online.' : count + ' DJ' + (count === 1 ? '' : 's') + ' online now';
      mapStatus.style.color = count === 0 ? '#ffd860' : '#22c55e';
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
              mapStatus.style.color = '#ff4d8f';
              console.error(err2);
            });
        });
    }

    function useMyLocation() {
      if (!navigator.geolocation) {
        mapStatus.textContent = 'Geolocation is not supported by your browser.';
        mapStatus.style.color = '#ff4d8f';
        return;
      }
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        mapStatus.textContent = 'HTTPS required for location access.';
        mapStatus.style.color = '#ff4d8f';
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
        mapStatus.style.color = '#ff4d8f';
      }, { enableHighAccuracy: true, timeout: 20000, maximumAge: 10000 });
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
        mapStatus.style.color = '#ff4d8f';
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
        status.style.color = '#ff4d8f';
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
          status.style.color = '#ff4d8f';
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
        status.style.color = '#ff4d8f';
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
        mapStatus.style.color = '#ff4d8f';
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
            mapStatus.style.color = '#ff4d8f';
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
                'line-color': '#00d4ff',
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
          mapStatus.style.color = '#ff4d8f';
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
          mapStatus.style.color = '#ff4d8f';
        }
      })
      .catch(function(err) {
        mapStatus.textContent = 'Search error: ' + err.message;
        mapStatus.style.color = '#ff4d8f';
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

      fetch(SEARCH_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(selectedLocation)
      })
      .then(function(res) { return res.json(); })
      .then(function(data) {
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
          mapStatus.style.color = '#ff4d8f';
        }
      })
      .catch(function(err) {
        track.innerHTML = '<p style="width:100%; text-align:center;">Could not load DJs.</p>';
        mapStatus.textContent = 'DJ search error: ' + err.message;
        mapStatus.style.color = '#ff4d8f';
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
        div.style.cssText = 'flex:0 0 260px; min-width:260px; scroll-snap-align:start; background:#111; border:1px solid #ff4d8f; border-radius:12px; padding:1rem; text-align:center;';

        var avatarUrl = dj.avatar || dj.photoURL || '';
        var avatarHtml;
        var initial = (dj.name || 'D').charAt(0).toUpperCase();
        if (avatarUrl) {
          avatarHtml = '<div style="width:100px;height:100px;border-radius:50%;overflow:hidden;border:3px solid #22c55e;margin:0 auto; background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#fff;position:relative;">' +
            initial + '<img loading="lazy" src="' + avatarUrl + '" style="width:100%;height:100%;object-fit:cover;position:absolute;" onerror="this.style.display=\'none\'">' +
            '</div>';
        } else {
          avatarHtml = '<div style="width:100px;height:100px;border-radius:50%;background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-size:36px;font-weight:700;color:#fff;margin:0 auto;border:3px solid #22c55e;">' + initial + '</div>';
        }
        const verified = dj.is_verified ? '✅ Verified' : '⏳ Unverified';
        const genres = (dj.genres || []).slice(0, 3).join(', ');
        const navUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + dj.location.latitude + ',' + dj.location.longitude;
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
          '<h3 style="margin:0 0 0.25rem; font-size:1.1rem;">' + (dj.name || 'DJ') + '</h3>' +
          '<p style="margin:0.25rem 0; color:#ffd860; font-size:0.9rem;">⭐ ' + dj.rating + ' (' + dj.review_count + ') · $' + dj.hourly_rate + '/hr</p>' +
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
          d.style.background = (i === idx) ? '#ff4d8f' : '#444';
          d.style.width = (i === idx) ? '24px' : '8px';
          d.style.borderRadius = (i === idx) ? '4px' : '50%';
        });
      });
    }

    let lastDjList = [];

    function showDJProfile(dj) {
      var modal = document.getElementById('sol-dj-profile-modal');
      var content = document.getElementById('sol-dj-profile-content');
      var initial = (dj.name || 'D').charAt(0).toUpperCase();
      var avatar = dj.avatar || dj.photoURL || '';
      var avatarHtml = avatar
        ? '<img loading="lazy" src="' + avatar + '" style="width:120px;height:120px;border-radius:50%;object-fit:cover;border:4px solid #22c55e;margin:0 auto 1rem;display:block;" onerror="this.style.display=\'none\'; this.nextElementSibling.style.display=\'flex\'">' +
          '<div style="width:120px;height:120px;border-radius:50%;background:#ff4d8f;display:none;align-items:center;justify-content:center;font-size:48px;font-weight:700;color:#fff;margin:0 auto 1rem;border:4px solid #22c55e;">' + initial + '</div>'
        : '<div style="width:120px;height:120px;border-radius:50%;background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-size:48px;font-weight:700;color:#fff;margin:0 auto 1rem;border:4px solid #22c55e;">' + initial + '</div>';

      var genres = (dj.genres || []).join(', ') || 'Not specified';
      var specialties = (dj.specialties || []).join(', ') || 'Not specified';
      var equipment = (dj.equipment || []).join(', ') || 'Not specified';
      var verified = dj.is_verified ? '✅ Verified DJ' : '⏳ Unverified';
      var navUrl = 'https://www.google.com/maps/dir/?api=1&destination=' + dj.location.latitude + ',' + dj.location.longitude;
      var djUid = dj.firebaseUid || dj.id || '';

      content.innerHTML =
        avatarHtml +
        '<h2 style="margin:0 0 0.5rem;">' + (dj.name || 'DJ') + '</h2>' +
        '<p style="color:#ffd860; margin:0.25rem 0;">⭐ ' + dj.rating + ' (' + dj.review_count + ' reviews)</p>' +
        '<p style="color:#22c55e; margin:0.25rem 0; font-size:0.9rem;">' + verified + '</p>' +
        '<p style="color:#aaa; margin:0.25rem 0; font-size:0.9rem;">📍 ' + (dj.location.address || dj.location.city + ', ' + dj.location.state) + '</p>' +
        '<div style="text-align:left; margin:1.5rem 0; display:flex; flex-direction:column; gap:0.75rem;">' +
        '<div><strong style="color:#ff4d8f;">Genres:</strong> <span style="color:#ccc;">' + genres + '</span></div>' +
        '<div><strong style="color:#ff4d8f;">Specialties:</strong> <span style="color:#ccc;">' + specialties + '</span></div>' +
        '<div><strong style="color:#ff4d8f;">Equipment:</strong> <span style="color:#ccc;">' + equipment + '</span></div>' +
        '<div><strong style="color:#ff4d8f;">Experience:</strong> <span style="color:#ccc;">' + (dj.experience || 0) + ' years</span></div>' +
        '<div><strong style="color:#ff4d8f;">Hourly Rate:</strong> <span style="color:#22c55e;">$' + dj.hourly_rate + '/hr</span></div>' +
        '<div><strong style="color:#ff4d8f;">Bookings Completed:</strong> <span style="color:#ccc;">' + (dj.total_bookings_completed || 0) + '</span></div>' +
        '<div><strong style="color:#ff4d8f;">Match Score:</strong> <span style="color:#00d4ff;" id="sol-dj-match-score">Calculating...</span></div>' +
        '</div>' +
        '<div id="sol-dj-sound-samples" style="text-align:left; margin:1rem 0;"><p style="color:#888;">Loading sound samples...</p></div>' +
        '<div id="sol-dj-video-reel" style="text-align:left; margin:1rem 0;"></div>' +
        '<div id="sol-dj-upcoming-events" style="text-align:left; margin:1rem 0;"></div>' +
        '<div id="sol-dj-reviews" style="text-align:left; margin:1rem 0;"><p style="color:#888;">Loading reviews...</p></div>' +
        '<div style="display:flex; gap:0.5rem; margin-top:1rem; flex-wrap:wrap;">' +
        '<a href="' + navUrl + '" target="_blank" class="playlist-link" style="flex:1;">Get Directions</a>' +
        '<button type="button" class="submit-btn" style="flex:1;" data-share-dj="' + encodeURIComponent(dj.name || '') + '">Share Profile</button>' +
        '<button type="button" class="submit-btn" style="flex:1; background:#333;" data-save-dj="' + (djUid || '') + '" data-save-dj-name="' + encodeURIComponent(dj.name || '') + '" data-save-dj-avatar="' + encodeURIComponent(dj.avatar || dj.photoURL || '') + '">♥ Save DJ</button>' +
        '</div>';

      modal.style.display = 'flex';

      if (djUid) {
        // Fetch sound samples
        db.collection('dj-samples').doc(djUid).get().then(function(doc) {
          var samplesEl = document.getElementById('sol-dj-sound-samples');
          if (!samplesEl) return;
          if (doc.exists && doc.data().samples && doc.data().samples.length > 0) {
            var html = '<h3 style="color:#ff4d8f; margin:0 0 0.5rem;">Sound Samples</h3>';
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
            var html = '<h3 style="color:#ff4d8f; margin:0 0 0.5rem;">Video Reel</h3>';
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

        // Upcoming events for DJ Weird Nasty
        var djEvents = [
          { title: 'MURRDAH SEASON MONDAY', date: 'Every Monday', time: '3:00 PM – 4:00 PM EST', location: 'Glocawear Radio (Live Stream)', img: 'murrdahseasonmonday.webp', url: 'event-murrdah-season.html', recurring: true },
          { title: 'KREW NASA: Out of This World Tour 2026', date: 'Aug 22 – Oct 11, 2026', time: 'Various times', location: '11 Cities (Allentown, Norristown (Aug 28), Lancaster, Baltimore, Philadelphia, Pittsburgh, Brooklyn, Trenton, Ansonia, Emmaculate)', img: 'krew-nasa-tour.jpeg', url: 'event-krew-nasa.html', recurring: false, endDate: '2026-10-12' },
          { title: 'Ghetto House Party', date: 'Saturday, August 29, 2026', time: '9:00 PM – 3:00 AM EDT', location: '476 Riverly Avenue, Collingdale, PA 19023', img: 'Ghetto-house-party.webp', url: 'event-ghetto-house-party.html', recurring: false, endDate: '2026-08-30' },
          { title: 'Halloween Hibachi on Elm Street', date: 'Saturday, October 31, 2026', time: '12:00 PM – 6:00 PM EDT', location: 'Delink Social Club, 4172 Germantown Ave, Philadelphia, PA 19140', img: 'halloween-habachi-on-elm-street.JPG', url: 'event-halloween-hibachi-elm-street.html', recurring: false, endDate: '2026-11-01' },
          { title: 'Philly Skate Plex Family Session', date: 'Recurring Sessions', time: 'Various times', location: 'Philly Skate Plex, Philadelphia, PA', img: 'Philly-skate-logo.webp', url: 'event-philly-skate-plex.html', recurring: true },
          { title: 'Welcome 2 Muggatime', date: 'Saturday, August 22, 2026', time: '8:00 PM', location: "Crafty's, 35 Baltimore Pike, Springfield, PA 19064", img: 'muggatime.webp', url: 'event-muggatime.html', recurring: false, endDate: '2026-08-23' }
        ];

        var djNameLower = (dj.name || '').toLowerCase();
        var isWeirdNasty = djNameLower.indexOf('weird') >= 0 || djNameLower.indexOf('nasty') >= 0 || djNameLower.indexOf('djweirdnasty') >= 0;

        // Also check by Firebase UID or email if available
        if (!isWeirdNasty && dj.email && dj.email.toLowerCase().indexOf('weird') >= 0) {
          isWeirdNasty = true;
        }

        var eventsEl = document.getElementById('sol-dj-upcoming-events');
        if (eventsEl && isWeirdNasty) {
          var now = new Date();
          var upcoming = djEvents.filter(function(e) {
            if (e.recurring) return true;
            if (!e.endDate) return true;
            return new Date(e.endDate + 'T23:59:59') >= now;
          });

          if (upcoming.length > 0) {
            var eventsHtml = '<h3 style="color:#ff4d8f; margin:0 0 0.75rem;">📅 Upcoming Events</h3>';
            upcoming.forEach(function(e) {
              eventsHtml += '<a href="' + e.url + '" style="display:block; text-decoration:none; color:inherit; background:#111; border:1px solid #333; border-radius:12px; padding:0.75rem; margin-bottom:0.75rem; transition:border-color 0.2s;" onmouseover="this.style.borderColor=\'#ff4d8f\'" onmouseout="this.style.borderColor=\'#333\'">' +
                '<div style="display:flex; gap:0.75rem; align-items:flex-start;">' +
                '<img loading="lazy" src="' + e.img + '" style="width:60px; height:60px; border-radius:8px; object-fit:cover; flex-shrink:0;" onerror="this.style.display=\'none\'">' +
                '<div style="flex:1; min-width:0;">' +
                '<strong style="color:#fff; font-size:0.9rem; display:block; margin-bottom:0.25rem;">' + e.title + '</strong>' +
                '<div style="color:#ffd860; font-size:0.8rem; margin-bottom:0.15rem;">📆 ' + e.date + '</div>' +
                '<div style="color:#aaa; font-size:0.8rem; margin-bottom:0.15rem;">🕐 ' + e.time + '</div>' +
                '<div style="color:#aaa; font-size:0.8rem;">📍 ' + e.location + '</div>' +
                '</div>' +
                '</div>' +
                '<div style="text-align:right; margin-top:0.5rem; color:#00d4ff; font-size:0.8rem; font-weight:600;">View Event Details →</div>' +
                '</a>';
            });
            eventsEl.innerHTML = eventsHtml;
          } else {
            eventsEl.innerHTML = '<h3 style="color:#ff4d8f; margin:0 0 0.5rem;">📅 Upcoming Events</h3><p style="color:#888;">No upcoming events at this time.</p>';
          }
        } else if (eventsEl) {
          eventsEl.innerHTML = '';
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
          scoreEl.style.color = score >= 80 ? '#22c55e' : score >= 60 ? '#ffd860' : '#ff4d8f';
        }

        db.collection('feedback').where('toUserId', '==', djUid).orderBy('createdAt', 'desc').limit(20).get()
          .then(function(snapshot) {
            var reviewsEl = document.getElementById('sol-dj-reviews');
            if (snapshot.empty) {
              reviewsEl.innerHTML = '<h3 style="color:#ff4d8f; margin:0 0 0.5rem;">Reviews</h3><p style="color:#888;">No reviews yet. Be the first to review after your event!</p>';
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

            var html = '<h3 style="color:#ff4d8f; margin:0 0 0.5rem;">Reviews</h3>' +
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
                '<div style="display:flex; justify-content:space-between;"><strong>' + (r.fromName || 'Anonymous') + '</strong><span style="color:#ffd860;">' + stars + '</span></div>' +
                (dateStr ? '<div style="color:#666; font-size:0.75rem; margin-top:2px;">' + dateStr + '</div>' : '') +
                (r.review ? '<p style="color:#ccc; font-size:0.85rem; margin:0.25rem 0 0;">' + r.review + '</p>' : '') +
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
        var shareUrl = window.location.origin + window.location.pathname + '?dj=' + encodeURIComponent(djName);
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
    });

    document.getElementById('sol-dj-track').addEventListener('click', function(e) {
      if (e.target && e.target.tagName === 'BUTTON' && e.target.hasAttribute('data-dj-index')) {
        var idx = parseInt(e.target.getAttribute('data-dj-index'));
        if (lastDjList[idx]) showDJProfile(lastDjList[idx]);
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

    function openChat(conversationId) {
      activeConversationId = conversationId;
      document.getElementById('sol-chat-box').style.display = 'block';
      const messagesBox = document.getElementById('sol-chat-messages');
      messagesBox.innerHTML = '';

      if (chatUnsubscribe) chatUnsubscribe();
      chatUnsubscribe = db.collection('conversations').doc(conversationId).collection('messages')
        .orderBy('timestamp', 'asc')
        .onSnapshot(function(snapshot) {
          messagesBox.innerHTML = '';
          snapshot.forEach(function(doc) {
            const m = doc.data();
            const mine = auth.currentUser && m.senderId === auth.currentUser.uid;
            const bubble = document.createElement('div');
            bubble.style.cssText = 'align-self:' + (mine ? 'flex-end' : 'flex-start') + '; background:' + (mine ? '#ff4d8f' : '#222') + '; color:#fff; padding:0.5rem 0.75rem; border-radius:10px; max-width:80%;';
            bubble.textContent = (mine ? '' : (m.senderName || 'DJ') + ': ') + (m.text || '');
            messagesBox.appendChild(bubble);
          });
          messagesBox.scrollTop = messagesBox.scrollHeight;
        }, function(err) {
          console.error('Chat listener error:', err);
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
          lastMessageTime: Date.now()
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

      conversationRef.get().then(function(doc) {
        if (doc.exists) {
          openChat(conversationId);
          return;
        }
        const clientAvatar = user.photoURL || ('https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.uid);
        conversationRef.set({
          id: conversationId,
          bookingId: bookingId,
          clientId: user.uid,
          clientName: user.displayName || user.email || 'Client',
          clientAvatar: clientAvatar,
          djId: djId,
          djName: djName || 'DJ',
          djAvatar: '',
          unreadCount: 0,
          lastMessage: '',
          lastMessageTime: Date.now()
        }).then(function() {
          openChat(conversationId);
        }).catch(function(err) {
          console.error('Create conversation error:', err);
          const status = document.getElementById('sol-quick-status');
          status.textContent = 'Payment successful, but chat could not start: ' + err.message;
          status.style.color = '#ffd860';
        });
      });
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

    // ===== ADMIN SETTINGS (Push + Email) =====
    function loadAdminSettings() {
      db.collection('config').doc('notification-settings').get().then(function(doc) {
        var s = doc.exists ? doc.data() : {};
        var p = s.push || {};
        var e = s.email || {};
        document.getElementById('sol-settings-fcm-key').value = p.fcmKey || '';
        document.getElementById('sol-settings-fcm-project').value = p.fcmProject || '';
        document.getElementById('sol-settings-push-enabled').checked = !!p.enabled;
        document.getElementById('sol-settings-push-booking').checked = p.booking !== false;
        document.getElementById('sol-settings-push-message').checked = p.message !== false;
        document.getElementById('sol-settings-push-reminder').checked = p.reminder !== false;
        document.getElementById('sol-settings-smtp-host').value = e.smtpHost || '';
        document.getElementById('sol-settings-smtp-port').value = e.smtpPort || '';
        document.getElementById('sol-settings-smtp-user').value = e.smtpUser || '';
        document.getElementById('sol-settings-smtp-pass').value = e.smtpPass || '';
        document.getElementById('sol-settings-from-email').value = e.fromEmail || '';
        document.getElementById('sol-settings-email-enabled').checked = !!e.enabled;
        document.getElementById('sol-settings-email-booking').checked = e.booking !== false;
        document.getElementById('sol-settings-email-reminder').checked = e.reminder !== false;
        document.getElementById('sol-settings-email-receipt').checked = e.receipt !== false;
      }).catch(function() {});
    }
    document.getElementById('sol-settings-save').addEventListener('click', function() {
      var statusEl = document.getElementById('sol-settings-status');
      statusEl.textContent = 'Saving...';
      statusEl.style.color = '#ffd860';
      var data = {
        push: {
          fcmKey: document.getElementById('sol-settings-fcm-key').value,
          fcmProject: document.getElementById('sol-settings-fcm-project').value,
          enabled: document.getElementById('sol-settings-push-enabled').checked,
          booking: document.getElementById('sol-settings-push-booking').checked,
          message: document.getElementById('sol-settings-push-message').checked,
          reminder: document.getElementById('sol-settings-push-reminder').checked
        },
        email: {
          smtpHost: document.getElementById('sol-settings-smtp-host').value,
          smtpPort: document.getElementById('sol-settings-smtp-port').value,
          smtpUser: document.getElementById('sol-settings-smtp-user').value,
          smtpPass: document.getElementById('sol-settings-smtp-pass').value,
          fromEmail: document.getElementById('sol-settings-from-email').value,
          enabled: document.getElementById('sol-settings-email-enabled').checked,
          booking: document.getElementById('sol-settings-email-booking').checked,
          reminder: document.getElementById('sol-settings-email-reminder').checked,
          receipt: document.getElementById('sol-settings-email-receipt').checked
        },
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      db.collection('config').doc('notification-settings').set(data, { merge: true })
        .then(function() {
          statusEl.textContent = 'Settings saved successfully!';
          statusEl.style.color = '#22c55e';
          trackSolEvent('admin_settings_saved', { push_enabled: data.pushEnabled, email_enabled: data.emailEnabled });
          setTimeout(function() { statusEl.textContent = ''; }, 3000);
        }).catch(function(err) {
          statusEl.textContent = 'Error: ' + err.message;
          statusEl.style.color = '#ff4d8f';
        });
    });

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
          var avatar = d.djAvatar ? '<img loading="lazy" src="' + d.djAvatar + '" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">' : '<div style="width:40px;height:40px;border-radius:50%;background:#ff4d8f;display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff;">' + (d.djName || 'D').charAt(0) + '</div>';
          card.innerHTML = avatar + '<div style="flex:1;"><strong>' + (d.djName || 'Unknown DJ') + '</strong></div><button type="button" class="submit-btn" style="background:#333; padding:0.3rem 0.6rem; font-size:0.8rem;" data-remove-saved="' + doc.id + '">✕</button>';
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
        btn.style.background = '#ff4d8f';
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
          else if (s === 'rejected') { box.textContent = '❌ Verification rejected'; box.style.color = '#ff4d8f'; }
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
        statusEl.style.color = '#ff4d8f';
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
        if (hasBooking) { cell.style.background = 'rgba(255,77,143,0.3)'; cell.style.color = '#ff4d8f'; cell.title = 'Has booking'; }
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
          row.innerHTML = '<span style="color:#00d4ff; font-size:0.85rem; min-width:55px;">' + (s.time || '--:--') + '</span><span style="flex:1; color:#ccc; font-size:0.85rem;">' + s.track + '</span><button type="button" class="submit-btn" style="background:#333; padding:0.25rem 0.5rem; font-size:0.75rem;" data-del-setlist="' + doc.id + '">✕</button>';
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
          bar.style.cssText = 'flex:1; background:linear-gradient(180deg,#ff4d8f,#e33471); border-radius:4px 4px 0 0; height:' + h + 'px; position:relative;';
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
    document.addEventListener('click', function(e) {
      if (e.target && e.target.hasAttribute('data-cancel-booking')) {
        var bookingId = e.target.getAttribute('data-cancel-booking');
        var bookingDate = e.target.getAttribute('data-booking-date') || '';
        var daysUntil = 999;
        if (bookingDate) {
          var eventDate = new Date(bookingDate);
          daysUntil = Math.ceil((eventDate - new Date()) / (1000 * 60 * 60 * 24));
        }
        var refundMsg = daysUntil >= 7 ? '50% refund will be processed.' : 'No refund (within 7 days of event).';
        if (!confirm('Cancel this booking? ' + refundMsg)) return;
        db.collection('bookings').doc(bookingId).set({
          status: 'cancelled',
          cancelledAt: firebase.firestore.FieldValue.serverTimestamp(),
          refundDue: daysUntil >= 7,
          refundAmount: daysUntil >= 7 ? 50 : 0
        }, { merge: true });
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
        var iconColor = isCompleted ? '#22c55e' : isActive ? '#00d4ff' : '#555';
        var bgColor = isCompleted ? '#22c55e22' : isActive ? '#00d4ff22' : '#222';
        var borderColor = isCompleted ? '#22c55e' : isActive ? '#00d4ff' : '#444';
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
        if (!doc.exists) { content.innerHTML = '<p style="color:#ff4d8f;">Booking not found.</p>'; return; }
        var b = doc.data();
        var status = b.status || 'pending';
        var history = b.statusHistory || [];
        content.innerHTML = renderBookingStatusTracker(status, history);

        if (b.djId === auth.currentUser.uid && status !== 'cancelled' && status !== 'completed') {
          var actionsHtml = '<div style="display:flex; gap:0.5rem; margin-top:1rem; flex-wrap:wrap;">';
          if (status === 'confirmed') actionsHtml += '<button type="button" class="submit-btn" style="flex:1; background:#00d4ff; color:#000;" data-status-update="' + bookingId + '" data-new-status="on_the_way">Mark On the Way</button>';
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
                content.innerHTML += '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
              });
            });
          });
        }
      }).catch(function(err) {
        content.innerHTML = '<p style="color:#ff4d8f;">Error: ' + err.message + '</p>';
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
      { id: 'i1', title: 'Neon Dreams', artist: 'Kayla Renée', genre: 'R&B/Soul', isIndie: true, bpm: 95 },
      { id: 'i2', title: 'City Lights', artist: 'Marco Velli', genre: 'Electronic', isIndie: true, bpm: 128 },
      { id: 'i3', title: 'Golden Hour', artist: 'The Sunnyside', genre: 'Indie-Pop', isIndie: true, bpm: 104 },
      { id: 'i4', title: 'Midnight Run', artist: 'Aria Cole', genre: 'Hip-Hop/Soul', isIndie: true, bpm: 88 },
      { id: 'i5', title: 'Wavelength', artist: 'Dex Monroe', genre: 'Trap/Electronic', isIndie: true, bpm: 140 }
    ];

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

      var indieSlots = shuffle(INDIE_SONGS).slice(0, 2);
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


