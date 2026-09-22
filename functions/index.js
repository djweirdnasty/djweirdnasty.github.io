const { onDocumentWritten, onDocumentCreated, onDocumentUpdated } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");
const webpush = require("web-push");

admin.initializeApp();
const db = admin.firestore();

const ADMIN_UID = "3i7fQdPjN0Qxz3FysVPvnhtxzlJ3";
const ADMIN_EMAIL = "djweirdnasty@gmail.com";
const SEARCH_URL = "https://rork-dj-booking-payment-app.onrender.com/api/djs/search";

const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

const STRIPE_SECRET_KEY = defineSecret("STRIPE_SECRET_KEY");
const SENDGRID_API_KEY = defineSecret("SENDGRID_API_KEY");
const SENDGRID_FROM_EMAIL = process.env.SENDGRID_FROM_EMAIL || "noreply@djweirdnasty.com";

// Web Push (PWA) — public key is safe to embed; private key stays in Secret Manager.
const VAPID_PRIVATE_KEY = defineSecret("VAPID_PRIVATE_KEY");
const VAPID_PUBLIC_KEY = "BKth1HKn9DWqvOh-xF5Ic_ao5aFOmmexju8l1GamXQB8zQy_gUJz8eLbnohT47KKbvkt9tZNPiN3cDnKcCGZK68";
var vapidConfigured = false;
function ensureVapid() {
  if (vapidConfigured) return;
  webpush.setVapidDetails(
    "mailto:" + ADMIN_EMAIL,
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY.value()
  );
  vapidConfigured = true;
}

function formatPhoneE164(raw) {
  if (!raw) return null;
  var digits = String(raw).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return null;
}

async function sendSms(accountSid, authToken, fromNumber, toNumber, message) {
  var url = "https://api.twilio.com/2010-04-01/Accounts/" + accountSid + "/Messages.json";
  var params = new URLSearchParams();
  params.append("To", toNumber);
  params.append("From", fromNumber);
  params.append("Body", message);

  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(accountSid + ":" + authToken).toString("base64"),
    },
    body: params.toString(),
  });

  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error("Twilio error " + res.status + ": " + JSON.stringify(data));
  }
  return data;
}

async function sendEmail(apiKey, to, subject, html) {
  var res = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + apiKey,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: to }] }],
      from: { email: SENDGRID_FROM_EMAIL, name: "SOL DJ Booking" },
      subject: subject,
      content: [{ type: "text/html", value: html }]
    })
  });
  if (res.status !== 202) {
    var text = await res.text().catch(function () { return ""; });
    throw new Error("SendGrid error " + res.status + ": " + text);
  }
  return true;
}

function money(n) {
  var num = Number(n) || 0;
  return "$" + num.toFixed(0);
}

async function sendExpoPush(token, title, body) {
  var res = await fetch("https://exp.host/--/api/v2/push/send", {
    method: "POST",
    headers: {
      "Accept": "application/json",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ to: token, title: title, body: body, sound: "default" })
  });
  var data = await res.json().catch(function () { return {}; });
  var ticket = data && data.data;
  if (ticket && ticket.status === "error") {
    throw new Error("Expo push error: " + (ticket.message || "unknown"));
  }
  return data;
}

// Sends a Web Push to the browser/PWA subscription stored at
// push-subscriptions/{uid}. Returns true if a push was delivered.
// Expired subscriptions (404/410) are deleted so we stop retrying them.
async function sendWebPush(uid, payload) {
  var subDoc = await db.collection("push-subscriptions").doc(uid).get();
  if (!subDoc.exists || !subDoc.data().subscription) return false;
  ensureVapid();
  try {
    await webpush.sendNotification(subDoc.data().subscription, JSON.stringify(payload));
    return true;
  } catch (err) {
    if (err.statusCode === 404 || err.statusCode === 410) {
      await subDoc.ref.delete().catch(function () {});
      logger.info("[WEB PUSH] Deleted expired subscription for " + uid);
    } else {
      throw err;
    }
  }
  return false;
}

// Fans a notification out to every push channel a user has:
// Web Push (PWA/browser) + Expo push (native app). Returns counts sent.
async function notifyUser(uid, title, body, url) {
  var result = { webPush: 0, expoPush: 0 };
  try {
    var sent = await sendWebPush(uid, {
      title: title,
      body: body,
      tag: "sol-" + Date.now(),
      data: { url: url || "/sol.html" }
    });
    if (sent) result.webPush = 1;
  } catch (err) {
    logger.error("[NOTIFY] Web push failed for " + uid + ": " + err.message);
  }
  try {
    var userDoc = await db.collection("users").doc(uid).get();
    var token = userDoc.exists ? userDoc.data().expoPushToken : null;
    if (token) {
      await sendExpoPush(token, title, body);
      result.expoPush = 1;
    }
  } catch (err) {
    logger.error("[NOTIFY] Expo push failed for " + uid + ": " + err.message);
  }
  return result;
}

// TEMP DISABLED: uncomment once TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER secrets are set
/*
exports.notifyDjOnBooking = onDocumentWritten(
  {
    document: "bookings/{bookingId}",
    secrets: [TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER],
  },
  async (event) => {
    var beforeSnap = event.data.before;
    var afterSnap = event.data.after;

    if (!afterSnap || !afterSnap.exists) return;

    var before = beforeSnap && beforeSnap.exists ? beforeSnap.data() : null;
    var after = afterSnap.data();

    var djId = after.djId;
    if (!djId) return;

    var djIdChanged = !before || before.djId !== djId;
    var alreadyNotified = after.djSmsSentFor === djId;

    if (!djIdChanged || alreadyNotified) return;

    try {
      var djDoc = await db.collection("djs").doc(djId).get();
      if (!djDoc.exists) {
        logger.info("No DJ profile found for djId " + djId);
        return;
      }
      var dj = djDoc.data();

      if (dj.smsOptIn === false) {
        logger.info("DJ " + djId + " has opted out of SMS.");
        return;
      }

      var phone = formatPhoneE164(dj.phone);
      if (!phone) {
        logger.info("DJ " + djId + " has no valid phone number on file.");
        return;
      }

      var clientName = after.client_name || after.clientName || "A client";
      var eventDate = after.event_date || after.eventDate || "TBD";
      var eventType = after.event_type || after.eventType || "an event";
      var duration = after.duration || "";
      var loc = after.event_location || after.eventLocation || {};
      var locStr = loc.address || loc.city || "";
      var amount = after.totalAmount || after.total_cost || 0;

      var message =
        "SOL Booking Alert: " + clientName + " requested you for " + eventType +
        " on " + eventDate + (duration ? " (" + duration + " hrs)" : "") +
        (locStr ? " near " + locStr : "") +
        (amount ? ". Est. payout " + money(amount) : "") +
        ". Open the SOL app to accept or decline.";

      await sendSms(
        TWILIO_ACCOUNT_SID.value(),
        TWILIO_AUTH_TOKEN.value(),
        TWILIO_FROM_NUMBER.value(),
        phone,
        message
      );

      await afterSnap.ref.set({ djSmsSentFor: djId }, { merge: true });
      logger.info("SMS sent to DJ " + djId + " for booking " + event.params.bookingId);
    } catch (err) {
      logger.error("Failed to send DJ booking SMS: " + err.message);
    }
  }
);
*/

// Push booking status updates to the client (and DJ) so phones get notified
// even when the SOL browser tab/PWA is closed. The on-page countdown timer
// cannot run while the browser is closed, but it always re-derives from the
// booking's stored date/time on reopen — these pushes are what keep users
// informed in the meantime.
exports.notifyOnBookingUpdate = onDocumentWritten(
  {
    document: "bookings/{bookingId}",
    secrets: [VAPID_PRIVATE_KEY],
  },
  async (event) => {
    var afterSnap = event.data.after;
    if (!afterSnap || !afterSnap.exists) return;

    var beforeSnap = event.data.before;
    var before = beforeSnap && beforeSnap.exists ? beforeSnap.data() : null;
    var after = afterSnap.data();
    var bookingId = event.params.bookingId;

    var clientId = after.clientId;
    var djId = after.djId;

    var djName = after.djName || "Your DJ";
    var clientName = after.clientName || after.client_name || "A client";
    var eventType = after.eventType || after.event_type || "event";
    var date = after.date || after.eventDate || "TBD";
    var time = after.startTime || after.eventTime || "";
    var when = date + (time ? " at " + time : "");
    var duration = after.duration ? " (" + after.duration + " hrs)" : "";

    var pushes = []; // [{ uid, title, body }]

    if (!before) {
      // New booking request — notify the DJ.
      if (djId) {
        pushes.push({
          uid: djId,
          title: "New booking request",
          body: clientName + " requested you for " + eventType + " on " + when + ". Open SOL to accept or decline."
        });
      }
    } else if (before.status !== after.status) {
      switch (after.status) {
        case "confirmed":
          if (clientId) pushes.push({ uid: clientId, title: "Booking confirmed", body: djName + " confirmed your " + eventType + " booking for " + when + "." });
          break;
        case "accepted":
          if (clientId) pushes.push({ uid: clientId, title: "Booking accepted", body: djName + " accepted your " + eventType + " booking for " + when + "." });
          break;
        case "on_the_way":
          if (clientId) pushes.push({ uid: clientId, title: "DJ on the way", body: djName + " is on the way to your " + eventType + "!" });
          break;
        case "arrived":
          if (clientId) pushes.push({ uid: clientId, title: "DJ arrived", body: djName + " has arrived at your event." });
          break;
        case "started":
          if (clientId) pushes.push({ uid: clientId, title: "Event started", body: djName + " started your event" + duration + " — timer is running." });
          break;
        case "completed":
          if (clientId) pushes.push({ uid: clientId, title: "Event completed", body: "Your " + eventType + " with " + djName + " is complete. Thanks for booking with SOL!" });
          break;
        case "cancelled":
          if (clientId) pushes.push({ uid: clientId, title: "Booking cancelled", body: "Your " + eventType + " booking on " + when + " was cancelled." });
          if (djId) pushes.push({ uid: djId, title: "Booking cancelled", body: "The " + eventType + " booking on " + when + " was cancelled." });
          break;
      }
    }

    // DJ pressed the event timer — tell the client the clock is running.
    if (!before || (!before.timerStarted && after.timerStarted)) {
      if (after.status === "started" || after.status === "confirmed" || after.status === "arrived") {
        if (clientId) {
          pushes.push({
            uid: clientId,
            title: "Event timer started",
            body: djName + " started the timer for your " + eventType + duration + "."
          });
        }
      }
    }

    for (var i = 0; i < pushes.length; i++) {
      var p = pushes[i];
      await notifyUser(p.uid, p.title, p.body, "/sol.html");
      logger.info("[BOOKING PUSH] " + after.status + " -> " + p.uid + " for booking " + bookingId);
    }
  }
);

// New chat message -> notify the other participant. Push goes out on every
// message (web + native app). Email is the fallback for users with no push
// subscription, throttled to one email per conversation per recipient per
// 15 minutes so active chats don't spam inboxes.
exports.notifyOnNewMessage = onDocumentCreated(
  {
    document: "conversations/{conversationId}/messages/{messageId}",
    secrets: [VAPID_PRIVATE_KEY, SENDGRID_API_KEY],
  },
  async (event) => {
    try {
      var msg = event.data && event.data.data ? event.data.data() : null;
      if (!msg || !msg.senderId) return;

      var conversationId = event.params.conversationId;
      var convoRef = db.collection("conversations").doc(conversationId);
      var convoDoc = await convoRef.get();
      if (!convoDoc.exists) return;
      var convo = convoDoc.data();

      var recipientId = convo.clientId === msg.senderId ? convo.djId : convo.clientId;
      if (!recipientId || recipientId === msg.senderId) return;

      var senderName = msg.senderName || "Someone";
      var preview = String(msg.text || "").slice(0, 140) || "New message";
      var chatLink = "/sol.html?message=" + encodeURIComponent(msg.senderId);

      var push = await notifyUser(recipientId, "New message from " + senderName, preview, chatLink);
      logger.info("[MSG PUSH] " + msg.senderId + " -> " + recipientId + " (web:" + push.webPush + " expo:" + push.expoPush + ")");

      // Email always goes out (throttled to one per 15 minutes per
      // conversation+recipient) so DJs and clients get a real notification
      // even if they ignore or never see the push.
      {
        var throttleKey = "lastMsgEmailAt." + recipientId;
        var lastEmail = convo.lastMsgEmailAt && convo.lastMsgEmailAt[recipientId];
        var lastMs = lastEmail && lastEmail.toMillis ? lastEmail.toMillis() : (lastEmail || 0);
        if (Date.now() - lastMs < 15 * 60 * 1000) {
          logger.info("[MSG EMAIL] Throttled for " + recipientId + " on " + conversationId);
          return;
        }

        var toEmail = null;
        var userDoc = await db.collection("users").doc(recipientId).get();
        if (userDoc.exists && userDoc.data().email) toEmail = userDoc.data().email;
        if (!toEmail) {
          var verDoc = await db.collection("dj-verifications").doc(recipientId).get();
          if (verDoc.exists) toEmail = verDoc.data().notificationEmail || verDoc.data().email || null;
        }
        if (!toEmail) {
          var authUser = await admin.auth().getUser(recipientId).catch(function () { return null; });
          toEmail = authUser && authUser.email;
        }
        if (!toEmail) {
          logger.info("[MSG EMAIL] No email on file for " + recipientId);
          return;
        }

        var subject = "New message from " + senderName + " — SOL";
        var html =
          '<div style="font-family:Arial,sans-serif;max-width:520px;margin:0 auto;">' +
          '<h2 style="color:#ff1111;">New message on SOL</h2>' +
          '<p><strong>' + senderName + '</strong> sent you a message:</p>' +
          '<div style="background:#f4f4f4;border-left:4px solid #ff1111;padding:12px 16px;margin:16px 0;">' + preview + '</div>' +
          '<p><a href="https://djweirdnasty.com' + chatLink + '" style="display:inline-block;background:#ff1111;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;">Reply in SOL Messenger</a></p>' +
          '<p style="color:#888;font-size:12px;margin-top:24px;">Sounds of Logan — DJ Booking Platform</p>' +
          '</div>';

        await sendEmail(SENDGRID_API_KEY.value(), toEmail, subject, html);
        var stamp = {};
        stamp[throttleKey] = admin.firestore.FieldValue.serverTimestamp();
        await convoRef.set(stamp, { merge: true }).catch(function () {});
        logger.info("[MSG EMAIL] Sent to " + toEmail + " for " + recipientId);
      }
    } catch (err) {
      logger.error("[MSG NOTIFY] Failed: " + err.message);
    }
  }
);

// DJs return here after Stripe Connect onboarding.
const SOL_URL = "https://djweirdnasty.com/sol.html";

// Stripe client is created lazily on first use — STRIPE_SECRET_KEY is a
// secret, so .value() only works inside a function invocation context.
const Stripe = require("stripe");
var stripeClient = null;
function getStripe() {
  if (!stripeClient) {
    stripeClient = Stripe(STRIPE_SECRET_KEY.value());
  }
  return stripeClient;
}

// Reads a v2 connected account's readiness to receive transfers.
// stripe_transfers capability "active" = the DJ can be paid; the requirements
// summary tells us whether they've finished submitting what Stripe needs.
async function getStripeAccountStatus(stripe, accountId) {
  var acct = await stripe.v2.core.accounts.retrieve(accountId, {
    include: ["configuration.recipient", "requirements"],
  });
  var sb = (((acct.configuration || {}).recipient || {}).capabilities || {}).stripe_balance || {};
  var transfersStatus = (sb.stripe_transfers && sb.stripe_transfers.status) || null;
  var minDeadline = (((acct.requirements || {}).summary || {}).minimum_deadline || {}).status || null;
  return {
    transfersActive: transfersStatus === "active",
    transfersStatus: transfersStatus,
    detailsSubmitted: minDeadline !== null && minDeadline !== "currently_due" && minDeadline !== "past_due",
  };
}

// Computes what's currently owed to a DJ for one booking.
// Deposit share becomes payable as soon as the DJ accepts (status confirmed or later) —
// this is the DJ's cut of whatever the client already paid to lock in the gig.
// The remaining balance share only becomes payable once the gig is marked completed.
// NOTE: this formula is duplicated client-side in sol.html as
// computeBookingPayoutClient() and the deposit-info display near
// sol-deposit-toggle — keep all three in sync if the deposit/payout math changes.
function computeBookingPayout(b) {
  var total = Number(b.totalAmount || b.total_cost || 0);
  var depositOnly = !!b.deposit_only;
  var depositAmount = depositOnly ? Math.max(50, Math.round(total * 0.5 * 100) / 100) : 0;
  var djDepositShare = Math.round(depositAmount * 0.85 * 100) / 100;
  var djFinalShare = Math.round((total - depositAmount) * 0.85 * 100) / 100;

  var depositEligible = depositOnly && (b.status === "confirmed" || b.status === "completed");
  var finalEligible = b.status === "completed";

  // Legacy bookings paid in full before per-portion tracking existed.
  var legacyPaid = !!b.payoutSent;
  var depositPaid = legacyPaid || !!b.depositPayoutSent;
  var finalPaid = legacyPaid || !!b.finalPayoutSent;

  var owedDeposit = depositEligible && !depositPaid ? djDepositShare : 0;
  var owedFinal = finalEligible && !finalPaid ? djFinalShare : 0;

  return {
    owed: Math.round((owedDeposit + owedFinal) * 100) / 100,
    payDeposit: owedDeposit > 0,
    payFinal: owedFinal > 0,
  };
}

// Exported (not wrapped in onCall/onRequest/etc.) purely for unit testing —
// Firebase only deploys exports created via its function builders, so this
// plain export is never treated as a Cloud Function trigger.
exports.computeBookingPayout = computeBookingPayout;

// Finds a DJ's confirmed/completed bookings with unpaid portions and totals
// what's owed. Shared by the Stripe payout path and the manual-pay marker.
async function scanPayableBookings(djId) {
  var bookingsSnap = await db.collection("bookings")
    .where("djId", "==", djId)
    .where("status", "in", ["confirmed", "completed"])
    .get();

  var payable = [];
  var totalOwed = 0;
  bookingsSnap.forEach(function (doc) {
    var result = computeBookingPayout(doc.data());
    if (result.owed > 0) {
      totalOwed += result.owed;
      payable.push({ ref: doc.ref, payDeposit: result.payDeposit, payFinal: result.payFinal });
    }
  });
  return { payable: payable, totalOwed: Math.round(totalOwed * 100) / 100 };
}

// Shared payout core: sends everything currently owed to a DJ via a Stripe
// Connect transfer (platform balance → DJ's Express account; Stripe pays their
// bank on its normal schedule) and flags the bookings so neither this nor the
// auto-trigger can double-pay. Throws Error with .code for the callable to map.
async function performDjPayout(djId, opts) {
  opts = opts || {};
  var djDoc = await db.collection("djs").doc(djId).get();
  if (!djDoc.exists) {
    var nf = new Error("DJ profile not found.");
    nf.code = "not-found";
    throw nf;
  }
  var dj = djDoc.data();
  var stripeAccountId = (dj.stripeAccountId || "").trim();

  if (!stripeAccountId) {
    var noAcct = new Error("DJ has not connected a Stripe account.");
    noAcct.code = "no-stripe";
    throw noAcct;
  }

  var stripe = getStripe();
  var acctStatus = await getStripeAccountStatus(stripe, stripeAccountId);
  if (!acctStatus.transfersActive) {
    var notReady = new Error("DJ's Stripe account is not enabled for payouts yet.");
    notReady.code = "no-stripe";
    throw notReady;
  }

  var scan = await scanPayableBookings(djId);
  var payable = scan.payable;
  var totalOwed = scan.totalOwed;

  if (totalOwed <= 0) {
    var none = new Error("No outstanding payout for this DJ.");
    none.code = "nothing-owed";
    throw none;
  }

  var djName = dj.stageName || dj.displayName || "DJ";

  // Separate charges & transfers: this debits the platform's Stripe balance,
  // which is funded by the client checkout payments landing there.
  var transfer = await stripe.transfers.create({
    amount: Math.round(totalOwed * 100),
    currency: "usd",
    destination: stripeAccountId,
    description: "SOL gig payout for " + djName,
    metadata: {
      djId: djId,
      bookingIds: payable.map(function (p) { return p.ref.id; }).join(","),
    },
  });

  var batch = db.batch();
  var payoutRef = db.collection("payouts").doc();
  batch.set(payoutRef, {
    djId: djId,
    djName: djName,
    stripeAccountId: stripeAccountId,
    amount: totalOwed,
    bookingIds: payable.map(function (p) { return p.ref.id; }),
    stripeTransferId: transfer.id,
    status: "sent",
    method: "stripe",
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: opts.createdBy || "admin",
  });

  payable.forEach(function (p) {
    var update = { stripeTransferId: transfer.id, payoutAt: admin.firestore.FieldValue.serverTimestamp(), payoutStatus: "sent" };
    if (p.payDeposit) update.depositPayoutSent = true;
    if (p.payFinal) update.finalPayoutSent = true;
    batch.set(p.ref, update, { merge: true });
  });

  await batch.commit();

  logger.info("Stripe payout sent to DJ " + djId + " for $" + totalOwed + " (transfer " + transfer.id + ")");

  return { success: true, stripeTransferId: transfer.id, status: "sent", amount: totalOwed };
}

exports.sendDjPayout = onCall(
  {
    secrets: [STRIPE_SECRET_KEY],
  },
  async (request) => {
    var auth = request.auth;
    if (!auth || (auth.uid !== ADMIN_UID && (!auth.token || auth.token.email !== ADMIN_EMAIL))) {
      throw new HttpsError("permission-denied", "Only the SOL admin can trigger payouts.");
    }

    var djId = request.data && request.data.djId;
    if (!djId) {
      throw new HttpsError("invalid-argument", "djId is required.");
    }

    try {
      return await performDjPayout(djId, { createdBy: auth.uid });
    } catch (e) {
      if (e.code === "not-found") throw new HttpsError("not-found", e.message);
      if (e.code === "no-stripe") {
        throw new HttpsError("failed-precondition", "This DJ has not finished Stripe Connect setup. Their funds stay in the platform Stripe balance until they connect and complete onboarding.");
      }
      if (e.code === "nothing-owed") throw new HttpsError("failed-precondition", "This DJ has no outstanding payout right now.");
      throw new HttpsError("internal", e.message);
    }
  }
);

// DJ payout onboarding: creates (or resumes) a Stripe Express account for the
// DJ and returns the hosted onboarding URL. Called from the DJ console.
exports.createDjConnectAccount = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    var auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign in first.");
    var djId = (request.data && request.data.djId) || auth.uid;
    var isAdmin = auth.uid === ADMIN_UID || (auth.token && auth.token.email === ADMIN_EMAIL);
    if (djId !== auth.uid && !isAdmin) {
      throw new HttpsError("permission-denied", "You can only connect Stripe for your own DJ profile.");
    }

    var djDoc = await db.collection("djs").doc(djId).get();
    var dj = djDoc.exists ? djDoc.data() : {};
    var email = dj.notificationEmail || dj.email || (auth.token && auth.token.email) || "";
    if (!email) {
      throw new HttpsError("failed-precondition", "Add an email to your DJ profile first.");
    }

    var stripe = getStripe();
    var accountId = (dj.stripeAccountId || "").trim();

    if (!accountId) {
      // Accounts v2 with this platform's Managed Risk setup: losses_collector
      // must be "stripe", and that value is only valid when the account has a
      // merchant configuration — so DJs get card_payments + stripe_transfers.
      // "full" dashboard because Express + Managed Risk is preview-only.
      var account = await stripe.v2.core.accounts.create({
        contact_email: email,
        display_name: dj.stageName || dj.displayName || "SOL DJ",
        dashboard: "full",
        identity: { country: "us", entity_type: "individual" },
        configuration: {
          merchant: { capabilities: { card_payments: { requested: true } } },
          recipient: {
            capabilities: {
              stripe_balance: { stripe_transfers: { requested: true } },
            },
          },
        },
        defaults: {
          currency: "usd",
          responsibilities: { fees_collector: "stripe", losses_collector: "stripe" },
        },
        metadata: { djId: djId },
      });
      accountId = account.id;
      await db.collection("djs").doc(djId).set(
        { stripeAccountId: accountId, stripePayoutsEnabled: false },
        { merge: true }
      );
    } else {
      var st = await getStripeAccountStatus(stripe, accountId);
      if (st.transfersActive) {
        await db.collection("djs").doc(djId).set(
          { stripePayoutsEnabled: true, stripeDetailsSubmitted: true },
          { merge: true }
        );
        return { alreadyOnboarded: true, payoutsEnabled: true, accountId: accountId };
      }
    }

    var link = await stripe.v2.core.accountLinks.create({
      account: accountId,
      use_case: {
        type: "account_onboarding",
        account_onboarding: {
          configurations: ["merchant", "recipient"],
          refresh_url: SOL_URL + "?stripe=refresh",
          return_url: SOL_URL + "?stripe=return",
        },
      },
    });
    return { url: link.url, accountId: accountId };
  }
);

// Refreshes a DJ's Stripe Connect status onto their profile (called when they
// return from onboarding) and returns it for the UI.
exports.getDjStripeStatus = onCall(
  { secrets: [STRIPE_SECRET_KEY] },
  async (request) => {
    var auth = request.auth;
    if (!auth) throw new HttpsError("unauthenticated", "Sign in first.");
    var djId = (request.data && request.data.djId) || auth.uid;
    var isAdmin = auth.uid === ADMIN_UID || (auth.token && auth.token.email === ADMIN_EMAIL);
    if (djId !== auth.uid && !isAdmin) {
      throw new HttpsError("permission-denied", "You can only check Stripe status for your own DJ profile.");
    }

    var djDoc = await db.collection("djs").doc(djId).get();
    var accountId = djDoc.exists ? (djDoc.data().stripeAccountId || "").trim() : "";
    if (!accountId) return { connected: false };

    var st = await getStripeAccountStatus(getStripe(), accountId);
    await db.collection("djs").doc(djId).set(
      { stripePayoutsEnabled: st.transfersActive, stripeDetailsSubmitted: st.detailsSubmitted },
      { merge: true }
    );
    return { connected: true, payoutsEnabled: st.transfersActive, detailsSubmitted: st.detailsSubmitted, accountId: accountId };
  }
);

// Marketplace payout automation (Uber/Lyft-style, Stripe Connect rails):
// the client pays SOL up front at booking; when the booking flips to
// "completed" this immediately transfers the DJ's owed share (deposit + final,
// 85%) to the Stripe account connected on their DJ profile.
exports.autoPayoutOnCompletion = onDocumentUpdated(
  { document: "bookings/{bookingId}", secrets: [STRIPE_SECRET_KEY] },
  async (event) => {
    var before = event.data && event.data.before.data();
    var after = event.data && event.data.after.data();
    if (!before || !after) return;
    if (after.status !== "completed" || before.status === "completed") return;
    var djId = after.djId || after.dj_id;
    if (!djId) return;
    var bookingId = event.params.bookingId;
    var bookingRef = event.data.after.ref;

    // Claim a short-lived lock so concurrent completion writes can't double-pay.
    var lockRef = db.collection("payoutLocks").doc(djId);
    var claimed = await db.runTransaction(async (tx) => {
      var lock = await tx.get(lockRef);
      var at = lock.exists ? (lock.data().at || 0) : 0;
      if (Date.now() - at < 10 * 60 * 1000) return false;
      tx.set(lockRef, { at: Date.now(), bookingId: bookingId });
      return true;
    });
    if (!claimed) {
      logger.warn("[AUTO PAYOUT] Skipped " + bookingId + " — payout already in flight for DJ " + djId);
      return;
    }

    try {
      var res = await performDjPayout(djId, { createdBy: "auto-completion" });
      await bookingRef.set({ payoutStatus: "sent" }, { merge: true });
      logger.info("[AUTO PAYOUT] Paid DJ " + djId + " $" + res.amount + " for booking " + bookingId);
    } catch (e) {
      if (e.code === "no-stripe" || e.code === "not-found") {
        await bookingRef.set({ payoutStatus: "awaiting_stripe_setup" }, { merge: true });
        logger.warn("[AUTO PAYOUT] DJ " + djId + " has no Stripe account — payout held until they connect one.");
      } else if (e.code === "nothing-owed") {
        logger.info("[AUTO PAYOUT] Nothing owed for DJ " + djId + " on booking " + bookingId);
      } else {
        logger.error("[AUTO PAYOUT] Failed for DJ " + djId + " on booking " + bookingId + ": " + e.message);
      }
    } finally {
      await lockRef.delete();
    }
  }
);

// Admin fallback: records that the DJ was paid outside Stripe (PayPal Send
// Money, cash, Zelle, etc.) and flags the bookings so neither the admin
// button nor the auto-trigger can double-pay.
exports.markDjPayoutManual = onCall(async (request) => {
  var auth = request.auth;
  if (!auth || (auth.uid !== ADMIN_UID && (!auth.token || auth.token.email !== ADMIN_EMAIL))) {
    throw new HttpsError("permission-denied", "Only the SOL admin can record manual payouts.");
  }

  var djId = request.data && request.data.djId;
  if (!djId) {
    throw new HttpsError("invalid-argument", "djId is required.");
  }
  var note = ((request.data && request.data.note) || "").toString().trim().slice(0, 300);

  var djDoc = await db.collection("djs").doc(djId).get();
  if (!djDoc.exists) {
    throw new HttpsError("not-found", "DJ profile not found.");
  }

  var scan = await scanPayableBookings(djId);
  if (scan.totalOwed <= 0) {
    throw new HttpsError("failed-precondition", "This DJ has no outstanding payout right now.");
  }

  var batch = db.batch();
  var payoutRef = db.collection("payouts").doc();
  batch.set(payoutRef, {
    djId: djId,
    djName: djDoc.data().stageName || djDoc.data().displayName || "DJ",
    amount: scan.totalOwed,
    bookingIds: scan.payable.map(function (p) { return p.ref.id; }),
    status: "manual",
    method: "manual",
    note: note || null,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    createdBy: auth.uid,
  });

  scan.payable.forEach(function (p) {
    var update = {
      payoutAt: admin.firestore.FieldValue.serverTimestamp(),
      payoutStatus: "manual",
    };
    if (p.payDeposit) update.depositPayoutSent = true;
    if (p.payFinal) update.finalPayoutSent = true;
    batch.set(p.ref, update, { merge: true });
  });

  await batch.commit();
  logger.info("[MANUAL PAYOUT] DJ " + djId + " marked paid $" + scan.totalOwed + " by " + auth.uid);
  return { success: true, amount: scan.totalOwed };
});


// Admin test: creates a $1 booking for a DJ and marks it completed, which fires
// autoPayoutOnCompletion end-to-end (real $0.85 Stripe transfer + any other owed).
exports.adminTestPayout = onCall(async (request) => {
  var auth = request.auth;
  if (!auth || (auth.uid !== ADMIN_UID && (!auth.token || auth.token.email !== ADMIN_EMAIL))) {
    throw new HttpsError("permission-denied", "Only the SOL admin can test payouts.");
  }
  var djId = (request.data && request.data.djId) || auth.uid;
  var ref = db.collection("bookings").doc();
  await ref.set({
    djId: djId,
    clientId: auth.uid,
    clientName: "PAYOUT TEST",
    eventType: "Payout Test",
    date: new Date().toISOString().slice(0, 10),
    totalAmount: 1,
    status: "confirmed",
    isTestBooking: true,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
  });
  await ref.set({ status: "completed" }, { merge: true });
  return { bookingId: ref.id };
});

// Callable function: admin clicks "Sync Users" to create missing users/ docs for all Firebase Auth accounts.
exports.syncAllAuthUsers = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  var isCallerAdmin = request.auth.uid === ADMIN_UID ||
    (request.auth.token && request.auth.token.email === ADMIN_EMAIL);
  if (!isCallerAdmin) {
    throw new HttpsError("permission-denied", "Admin only.");
  }

  var allUsers = [];
  var nextPageToken = undefined;
  do {
    var result = await admin.auth().listUsers(1000, nextPageToken);
    allUsers = allUsers.concat(result.users);
    nextPageToken = result.pageToken;
  } while (nextPageToken);

  // Ensure the admin account is always marked as protected.
  var adminRef = db.collection("users").doc(ADMIN_UID);
  var adminDoc = await adminRef.get();
  if (adminDoc.exists) {
    await adminRef.set({ protected: true }, { merge: true });
  }

  var batch = db.batch();
  var created = 0;
  for (var i = 0; i < allUsers.length; i++) {
    var u = allUsers[i];
    var userRef = db.collection("users").doc(u.uid);
    var existing = await userRef.get();
    if (!existing.exists) {
      batch.set(userRef, {
        email: u.email || "",
        displayName: u.displayName || "",
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
        isAdmin: false,
        isVerifiedClient: false,
        isVerifiedDJ: false,
        banned: false,
        protected: u.uid === ADMIN_UID || (u.email || "").toLowerCase() === ADMIN_EMAIL
      });
      created++;
    }
  }
  if (created > 0) await batch.commit();
  logger.info("[SYNC USERS] Created " + created + " missing user docs out of " + allUsers.length + " auth users.");

  // Backfill dj-status.isVerified for any existing verified DJs.
  const verifiedSnapshot = await db.collection("users").where("isVerifiedDJ", "==", true).get();
  var vBatch = db.batch();
  var verifiedCount = 0;
  for (var j = 0; j < verifiedSnapshot.docs.length; j++) {
    var d = verifiedSnapshot.docs[j];
    vBatch.set(db.collection("dj-status").doc(d.id), { isVerified: true, verifiedAt: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
    verifiedCount++;
    if (verifiedCount % 500 === 0) {
      await vBatch.commit();
      vBatch = db.batch();
    }
  }
  if (verifiedCount % 500 !== 0) await vBatch.commit();
  logger.info("[SYNC USERS] Backfilled " + verifiedCount + " verified DJ status docs.");

  return { created: created, totalAuthUsers: allUsers.length, verifiedDjs: verifiedCount };
});

// Callable function: admin sends messages to users, DJs, or broadcast.
exports.adminSendMessage = onCall(
  { secrets: [SENDGRID_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER, VAPID_PRIVATE_KEY] },
  async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  if (request.auth.uid !== ADMIN_UID &&
      (!request.auth.token || request.auth.token.email !== ADMIN_EMAIL)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }

  const data = request.data || {};
  const recipientType = data.recipient || "all";
  const subject = (data.subject || "").trim();
  const body = (data.body || "").trim();
  const target = (data.target || "").trim();

  if (!body) {
    throw new HttpsError("invalid-argument", "Message body is required.");
  }

  const fullText = subject ? subject + "\n\n" + body : body;
  const timestamp = admin.firestore.FieldValue.serverTimestamp();

  let userQuerySnapshot;
  if (recipientType === "specific") {
    if (!target) {
      throw new HttpsError("invalid-argument", "Target UID or email required.");
    }
    let userByUid = await db.collection("users").doc(target).get();
    if (userByUid.exists) {
      userQuerySnapshot = { docs: [userByUid] };
    } else {
      let emailSnap = await db.collection("users").where("email", "==", target).limit(1).get();
      if (emailSnap.empty) {
        throw new HttpsError("not-found", "User not found with that UID or email.");
      }
      userQuerySnapshot = emailSnap;
    }
  } else if (recipientType === "djs") {
    userQuerySnapshot = await db.collection("users").where("isVerifiedDJ", "==", true).get();
  } else if (recipientType === "users") {
    userQuerySnapshot = await db.collection("users").where("isVerifiedDJ", "==", false).get();
  } else {
    userQuerySnapshot = await db.collection("users").get();
  }

  let sent = 0;
  let failed = 0;
  let sentTo = [];
  let pushSent = 0, emailSent = 0, smsSent = 0;

  for (const userDoc of userQuerySnapshot.docs) {
    const u = userDoc.data();
    const uid = userDoc.id;
    const conversationId = "admin_" + uid;
    const conversationRef = db.collection("conversations").doc(conversationId);

    try {
      await conversationRef.set({
        id: conversationId,
        adminId: ADMIN_UID,
        userId: uid,
        participants: [ADMIN_UID, uid],
        userName: u.displayName || u.email || "User",
        userEmail: u.email || "",
        lastMessage: fullText,
        lastMessageTime: Date.now(),
        unreadCount: admin.firestore.FieldValue.increment(1)
      }, { merge: true });

      await conversationRef.collection("messages").add({
        senderId: ADMIN_UID,
        senderName: "SOL Admin",
        senderAvatar: "",
        text: fullText,
        subject: subject,
        timestamp: timestamp,
        read: false,
        type: "admin"
      });

      sent++;
      sentTo.push(u.email || uid);
    } catch (err) {
      logger.error("[ADMIN MESSAGE] Failed to send to " + uid + ": " + err.message);
      failed++;
      continue;
    }

    // Push notification (Expo push token for the app + Web Push subscription for the PWA).
    if (u.expoPushToken) {
      try {
        await sendExpoPush(u.expoPushToken, subject || "New message from SOL Admin", body);
        pushSent++;
      } catch (err) {
        logger.error("[ADMIN MESSAGE] Push failed for " + uid + ": " + err.message);
      }
    }
    try {
      var webPushed = await sendWebPush(uid, {
        title: subject || "New message from SOL Admin",
        body: body.slice(0, 200),
        tag: "sol-admin-" + uid,
        data: { url: "/sol.html" }
      });
      if (webPushed) pushSent++;
    } catch (err) {
      logger.error("[ADMIN MESSAGE] Web push failed for " + uid + ": " + err.message);
    }

    // Email via SendGrid.
    if (u.email) {
      try {
        const emailHtml = "<p>" + (subject ? "<strong>" + subject + "</strong></p><p>" : "") +
          body.replace(/\n/g, "<br>") + "</p><p style=\"color:#888;font-size:0.85rem;\">Sent by SOL Admin.</p>";
        await sendEmail(SENDGRID_API_KEY.value(), u.email, subject || "Message from SOL Admin", emailHtml);
        emailSent++;
      } catch (err) {
        logger.error("[ADMIN MESSAGE] Email failed for " + uid + ": " + err.message);
      }
    }

    // SMS via Twilio — phone lives on the DJ verification profile, not the users doc.
    try {
      const verDoc = await db.collection("dj-verifications").doc(uid).get();
      const rawPhone = verDoc.exists ? (verDoc.data().djProfile || {}).phone : null;
      const phone = formatPhoneE164(rawPhone);
      if (phone) {
        const smsText = "SOL: " + (subject ? subject + " - " : "") + body;
        await sendSms(
          TWILIO_ACCOUNT_SID.value(),
          TWILIO_AUTH_TOKEN.value(),
          TWILIO_FROM_NUMBER.value(),
          phone,
          smsText.slice(0, 1500)
        );
        smsSent++;
      }
    } catch (err) {
      logger.error("[ADMIN MESSAGE] SMS failed for " + uid + ": " + err.message);
    }
  }

  await db.collection("admin_broadcasts").add({
    recipientType: recipientType,
    target: target,
    subject: subject,
    body: body,
    sent: sent,
    failed: failed,
    pushSent: pushSent,
    emailSent: emailSent,
    smsSent: smsSent,
    sentTo: sentTo,
    sentBy: request.auth.uid,
    sentByEmail: request.auth.token ? request.auth.token.email : "",
    timestamp: timestamp
  });

  logger.info("[ADMIN MESSAGE] Sent to " + sent + " recipients (" + failed + " failed). Push: " + pushSent + ", Email: " + emailSent + ", SMS: " + smsSent + ".");
  return { success: true, sent: sent, failed: failed, pushSent: pushSent, emailSent: emailSent, smsSent: smsSent };
});

// Callable function: client validates a promo code without reading the full list.
exports.redeemPromo = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  const code = String(request.data.code || "").trim().toUpperCase();
  if (!code) {
    throw new HttpsError("invalid-argument", "Promo code is required.");
  }
  const doc = await db.collection("promo-codes").doc(code).get();
  if (!doc.exists) {
    return { valid: false };
  }
  const p = doc.data();
  if (p.active === false) {
    return { valid: false };
  }
  return {
    valid: true,
    discount: Number(p.discount) || 0,
    type: p.type || "percent"
  };
});

// Callable function: returns whether the currently signed-in user is the site admin.
exports.isAdmin = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  return {
    admin: request.auth.uid === ADMIN_UID ||
           (request.auth.token && request.auth.token.email === ADMIN_EMAIL)
  };
});

// Callable function: returns whether a given DJ UID is the site admin.
exports.isAdminDj = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  const djId = String(request.data.djId || "");
  if (!djId) {
    throw new HttpsError("invalid-argument", "djId is required.");
  }
  const djDoc = await db.collection("users").doc(djId).get();
  const djData = djDoc.exists ? djDoc.data() : {};
  const djEmail = (djData.email || "").toLowerCase();
  return {
    admin: djId === ADMIN_UID || djEmail === ADMIN_EMAIL
  };
});

// Callable function: returns a sanitized list of DJs near the selected location.
exports.publicSearchDjs = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  const location = request.data.selectedLocation;
  if (!location || typeof location !== "object") {
    throw new HttpsError("invalid-argument", "selectedLocation is required.");
  }
  const userLat = parseFloat(location.latitude != null ? location.latitude : location.lat);
  const userLng = parseFloat(location.longitude != null ? location.longitude : location.lng);
  if (isNaN(userLat) || isNaN(userLng)) {
    throw new HttpsError("invalid-argument", "selectedLocation must include valid latitude and longitude.");
  }

  function getNumber(...vals) {
    for (const v of vals) {
      if (typeof v === "number" && !isNaN(v)) return v;
      const n = parseFloat(v);
      if (!isNaN(n)) return n;
    }
    return null;
  }

  function toRad(deg) { return deg * Math.PI / 180; }
  function haversine(lat1, lon1, lat2, lon2) {
    const R = 3958.8;
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  try {
    const verifiedSnapshot = await db.collection("users").where("isVerifiedDJ", "==", true).get();
    const verifiedUids = verifiedSnapshot.docs.map(d => d.id);

    const djsMap = {};
    const statusMap = {};
    if (verifiedUids.length > 0) {
      const chunkSize = 10;
      for (let i = 0; i < verifiedUids.length; i += chunkSize) {
        const chunk = verifiedUids.slice(i, i + chunkSize);
        const djsSnapshot = await db.collection("djs").where(admin.firestore.FieldPath.documentId(), "in", chunk).get();
        djsSnapshot.forEach(d => { djsMap[d.id] = d.data() || {}; });
        // dj-status holds the live/shared location — many DJs only ever set
        // location here (GPS share), so it must be a fallback for the search.
        const statusSnapshot = await db.collection("dj-status").where(admin.firestore.FieldPath.documentId(), "in", chunk).get();
        statusSnapshot.forEach(d => { statusMap[d.id] = d.data() || {}; });
      }
    }

    const userMap = {};
    verifiedSnapshot.forEach(d => { userMap[d.id] = d.data() || {}; });

    const results = [];
    for (const uid of verifiedUids) {
      const u = userMap[uid] || {};
      const d = djsMap[uid] || {};
      const s = statusMap[uid] || {};
      var loc = d.location || s.location;
      if (!loc) continue;
      const lat = getNumber(loc.latitude, loc._latitude, loc.lat);
      const lng = getNumber(loc.longitude, loc._longitude, loc.lng);
      if (lat === null || lng === null) continue;

      const name = d.stageName || d.name || d.displayName || u.displayName || u.email || "DJ";
      const distance = haversine(userLat, userLng, lat, lng);
      results.push({
        id: uid,
        uid: uid,
        firebaseUid: uid,
        name: name,
        djName: name,
        avatar: d.photoURL || d.avatar || "",
        photoURL: d.photoURL || d.avatar || "",
        bio: d.bio || "",
        genres: d.genres || [],
        styles: d.specialties || d.styles || [],
        specialties: d.specialties || [],
        equipment: d.equipment || [],
        hourly_rate: d.hourlyRate || 0,
        rating: d.rating || 0,
        review_count: d.reviewCount || 0,
        total_bookings_completed: d.totalBookingsCompleted || 0,
        is_verified: true,
        experience: d.experience || d.yearsExperience || 0,
        website: d.website || "",
        socialLinks: d.socialLinks || {},
        city: d.city || "",
        state: d.state || "",
        location: {
          address: loc.address || (d.location && d.location.address) || "",
          city: d.city || "",
          state: d.state || "",
          latitude: lat,
          longitude: lng
        },
        lat: lat,
        lng: lng,
        coordinates: { latitude: lat, longitude: lng },
        distance: distance
      });
    }

    results.sort((a, b) => a.distance - b.distance);
    return { djs: results };
  } catch (err) {
    logger.error("[PUBLIC SEARCH DJS] error: " + err.message);
    throw new HttpsError("internal", "Unable to search DJs.");
  }
});

function djSlugify(name) {
  return String(name || "").toLowerCase().trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// Public (unauthenticated) DJ profile lookup for shareable dj.html pages.
// Returns only promo-safe fields — no email, phone, PayPal, license, or
// precise coordinates. Private gigs are filtered out server-side.
// Accepts ?dj=<slug> (preferred) or djId (back-compat for old uid links).
exports.getPublicDjProfile = onCall(async (request) => {
  const data = request.data || {};
  let uid = String(data.djId || "").trim();
  const name = String(data.name || "").trim();

  try {
    if (!uid && name) {
      const slug = djSlugify(name);
      // 1) Stored slug (written on profile save).
      let snap = await db.collection("djs").where("profileSlug", "==", slug).limit(1).get();
      // 2) Exact stage/display-name match for DJs saved before slugs existed.
      if (snap.empty) {
        snap = await db.collection("djs").where("stageName", "==", name).limit(1).get();
      }
      if (snap.empty) {
        snap = await db.collection("djs").where("name", "==", name).limit(1).get();
      }
      // 3) Slug-match over verified DJs' stage/display names.
      if (snap.empty) {
        const verified = await db.collection("users").where("isVerifiedDJ", "==", true).get();
        const uids = verified.docs.map(d => d.id);
        for (let i = 0; i < uids.length && snap.empty; i += 10) {
          const chunk = uids.slice(i, i + 10);
          const djsSnap = await db.collection("djs").where(admin.firestore.FieldPath.documentId(), "in", chunk).get();
          djsSnap.forEach(function(d) {
            const dd = d.data() || {};
            const candidates = [dd.profileSlug, dd.stageName, dd.name, dd.displayName];
            for (const c of candidates) {
              if (djSlugify(c) === slug) {
                snap = { docs: [d], empty: false };
                break;
              }
            }
          });
        }
      }
      // 4) Slug-match over approved verification profiles (covers DJs whose
      //    names live only in dj-verifications.djProfile).
      if (snap.empty) {
        const verSnap = await db.collection("dj-verifications").where("status", "==", "approved").get();
        verSnap.forEach(function(d) {
          if (!snap.empty) return;
          const vd = d.data() || {};
          const vp = vd.djProfile || {};
          const candidates = [vp.profileSlug, vp.stageName, vp.djName, vp.displayName, vd.stageName, vd.djName, vd.displayName, vd.realName];
          for (const c of candidates) {
            if (djSlugify(c) === slug) {
              snap = { docs: [d], empty: false };
              break;
            }
          }
        });
      }
      if (snap.empty) {
        throw new HttpsError("not-found", "DJ not found.");
      }
      uid = snap.docs[0].id;
    }
    if (!uid) {
      throw new HttpsError("invalid-argument", "djId or name is required.");
    }

    const results = await Promise.all([
      db.collection("djs").doc(uid).get(),
      db.collection("dj-galleries").doc(uid).get(),
      db.collection("dj-samples").doc(uid).get(),
      db.collection("dj-videos").doc(uid).get(),
      db.collection("dj-events").doc(uid).get(),
      db.collection("dj-verifications").doc(uid).get(),
      db.collection("users").doc(uid).get(),
    ]);
    const d = results[0].exists ? results[0].data() : {};
    const verData = results[5].exists ? results[5].data() : {};
    const userDoc = results[6];
    const vp = verData.djProfile || {};
    // Verified via either the users flag or an approved verification.
    const isVerified = (userDoc.exists && userDoc.data().isVerifiedDJ === true) ||
      verData.status === "approved";
    if (!isVerified) {
      throw new HttpsError("not-found", "DJ not found.");
    }
    const photos = results[1].exists ? (results[1].data().photos || []) : [];
    const samples = results[2].exists ? (results[2].data().samples || []) : [];
    const videos = results[3].exists ? (results[3].data().videos || []) : [];
    const allEvents = results[4].exists ? (results[4].data().events || []) : [];
    const gigs = allEvents
      .filter(function (ev) { return ev.isPublic === true; })
      .map(function (ev) {
        return {
          title: ev.title || "",
          venue: ev.venue || "",
          date: ev.date || "",
          startTime: ev.startTime || "",
          endTime: ev.endTime || "",
          description: ev.description || "",
          ticketUrl: ev.ticketUrl || "",
          coverCharge: ev.coverCharge || "",
        };
      })
      .sort(function (a, b) { return String(a.date).localeCompare(String(b.date)); });

    const djName = d.stageName || d.name || d.displayName ||
      vp.stageName || vp.djName || vp.displayName ||
      verData.stageName || verData.djName || verData.displayName || "DJ";
    // Fields may be stored as arrays OR comma/newline-separated strings.
    const toArr = function (v) {
      if (!v) return [];
      if (Array.isArray(v)) return v.filter(Boolean).map(String);
      return String(v).split(/[,\n;]+/).map(function (s) {
        return s.replace(/^[\s\-•*]+/, "").trim();
      }).filter(Boolean);
    };
    const genres = toArr(d.genres).length ? toArr(d.genres) :
      (toArr(vp.genres).length ? toArr(vp.genres) : toArr(vp.specializations));
    const equipment = toArr(d.equipment).length ? toArr(d.equipment) : toArr(vp.equipment);
    return {
      uid: uid,
      slug: djSlugify(djName),
      name: djName,
      avatar: d.photoURL || d.avatar || vp.photoURL || vp.avatar ||
        verData.photoURL || verData.avatar ||
        (userDoc.exists ? (userDoc.data().photoURL || userDoc.data().avatar || "") : ""),
      bio: d.bio || vp.bio || "",
      genres: genres,
      specialties: toArr(d.specialties).length ? toArr(d.specialties) : toArr(d.styles),
      equipment: equipment,
      hourlyRate: d.hourlyRate || vp.hourlyRate || 0,
      rating: d.rating || 0,
      reviewCount: d.reviewCount || 0,
      totalBookingsCompleted: d.totalBookingsCompleted || 0,
      experience: d.experience || d.yearsExperience || vp.yearsOfExperience || 0,
      city: d.city || vp.city || "",
      state: d.state || vp.state || "",
      website: d.website || "",
      socialLinks: d.socialLinks || {},
      photos: photos,
      samples: samples,
      videos: videos,
      gigs: gigs,
    };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error("[PUBLIC DJ PROFILE] error: " + err.message);
    throw new HttpsError("internal", "Unable to load DJ profile.");
  }
});

function publicDjData(data) {
  const allowed = [
    "name", "displayName", "stageName", "photoURL", "avatar", "bio", "genres",
    "styles", "eventTypes", "hourlyRate", "baseRate", "rating", "reviewCount",
    "isVerifiedDJ", "verifiedAt", "city", "state", "coordinates", "location",
    "sampleUrls", "videoUrls", "socialLinks", "equipment", "yearsExperience",
    "createdAt", "updatedAt"
  ];
  const out = {};
  for (const key of allowed) {
    if (key in data) out[key] = data[key];
  }
  return out;
}

// Admin: force logout a user by revoking tokens and disabling the account.
exports.forceLogoutUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  if (request.auth.uid !== ADMIN_UID &&
      (!request.auth.token || request.auth.token.email !== ADMIN_EMAIL)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
  const targetUid = String(request.data.uid || "");
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (targetUid === ADMIN_UID) {
    throw new HttpsError("permission-denied", "Cannot force logout the founder.");
  }
  try {
    await admin.auth().revokeRefreshTokens(targetUid);
    await db.collection("users").doc(targetUid).set({
      banned: true,
      bannedAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    logger.info("[FORCE LOGOUT] " + request.auth.uid + " revoked " + targetUid);
    return { success: true };
  } catch (err) {
    logger.error("[FORCE LOGOUT] error: " + err.message);
    throw new HttpsError("internal", err.message);
  }
});

// Sign out a user without banning them: revokes refresh tokens, stamps
// users/{uid}.forceLogoutAt (clients compare it to their last sign-in time
// and sign out live), and marks the DJ offline so they disappear from the map.
exports.adminSignOutUser = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  if (request.auth.uid !== ADMIN_UID &&
      (!request.auth.token || request.auth.token.email !== ADMIN_EMAIL)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
  const targetUid = String(request.data.uid || "");
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (targetUid === ADMIN_UID) {
    throw new HttpsError("permission-denied", "Cannot sign out the founder.");
  }
  try {
    await admin.auth().revokeRefreshTokens(targetUid);
    await db.collection("users").doc(targetUid).set({
      forceLogoutAt: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
    await db.collection("dj-status").doc(targetUid).set({
      isOnline: false,
      sharingLocation: false
    }, { merge: true }).catch(function() {});
    logger.info("[ADMIN SIGN OUT] " + request.auth.uid + " signed out " + targetUid);
    return { success: true };
  } catch (err) {
    logger.error("[ADMIN SIGN OUT] error: " + err.message);
    throw new HttpsError("internal", err.message);
  }
});

// Mint a custom token so the admin can sign in as a DJ (impersonation).
// The token is short-lived and only usable via signInWithCustomToken.
exports.adminGetDjToken = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  if (request.auth.uid !== ADMIN_UID &&
      (!request.auth.token || request.auth.token.email !== ADMIN_EMAIL)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
  const targetUid = String(request.data.uid || "");
  if (!targetUid) {
    throw new HttpsError("invalid-argument", "uid is required.");
  }
  if (targetUid === ADMIN_UID) {
    throw new HttpsError("permission-denied", "Already the founder account.");
  }
  try {
    const token = await admin.auth().createCustomToken(targetUid);
    logger.info("[ADMIN IMPERSONATE] " + request.auth.uid + " minted token for " + targetUid);
    return { token: token };
  } catch (err) {
    logger.error("[ADMIN IMPERSONATE] error: " + err.message);
    throw new HttpsError("internal", err.message);
  }
});

// Fix a DJ's avatar by pointing it at a real Storage object. Accepts either a
// storage path (e.g. "DJ's/IMG_0593.jpg") or nothing — auto mode HEAD-checks
// every verified/approved DJ's avatar and repairs dead links it can match by
// filename under the DJ's/ prefix. Generates a firebase download token so the
// URL works regardless of Storage rules.
async function storageDownloadUrl(storagePath) {
  const bucket = admin.storage().bucket();
  const file = bucket.file(storagePath);
  const [exists] = await file.exists();
  if (!exists || storagePath.endsWith("/")) {
    throw new HttpsError("not-found", "No file at " + storagePath);
  }
  const [meta] = await file.getMetadata();
  if (Number(meta.size || 0) <= 0) {
    throw new HttpsError("not-found", "Empty file at " + storagePath);
  }
  let token = meta.metadata && meta.metadata.firebaseStorageDownloadTokens;
  if (token && token.indexOf(",") >= 0) token = token.split(",")[0];
  if (!token) {
    token = require("crypto").randomUUID();
    await file.setMetadata({ metadata: { firebaseStorageDownloadTokens: token } });
  }
  return "https://firebasestorage.googleapis.com/v0/b/" + bucket.name +
    "/o/" + encodeURIComponent(storagePath) + "?alt=media&token=" + token;
}

async function writeDjAvatar(uid, url) {
  const writes = [
    db.collection("djs").doc(uid).set({ photoURL: url, avatar: url }, { merge: true }),
    db.collection("dj-verifications").doc(uid).set(
      { photoURL: url, djProfile: { photoURL: url, avatar: url } }, { merge: true }),
    db.collection("users").doc(uid).set({ photoURL: url }, { merge: true }),
  ];
  await Promise.all(writes);
}

exports.adminFixDjAvatar = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  if (request.auth.uid !== ADMIN_UID &&
      (!request.auth.token || request.auth.token.email !== ADMIN_EMAIL)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
  const targetUid = String(request.data.uid || "");
  const storagePath = String(request.data.storagePath || "").replace(/^\/+/, "");

  try {
    if (targetUid && storagePath) {
      const url = await storageDownloadUrl(storagePath);
      await writeDjAvatar(targetUid, url);
      logger.info("[FIX AVATAR] " + targetUid + " -> " + storagePath);
      return { fixed: [targetUid], url: url };
    }

    // Auto mode: check every approved/verified DJ's avatar URL.
    const uidSet = new Set();
    const verSnap = await db.collection("dj-verifications").get();
    verSnap.forEach(function(d) { if ((d.data().status || "") === "approved") uidSet.add(d.id); });
    const uSnap = await db.collection("users").where("isVerifiedDJ", "==", true).get();
    uSnap.forEach(function(d) { uidSet.add(d.id); });
    const uids = Array.from(uidSet);

    // Candidate files under the DJ's/ prefix for filename matching.
    const bucket = admin.storage().bucket();
    const [files] = await bucket.getFiles({ prefix: "DJ's/" });
    const norm = function(s) { return String(s || "").toLowerCase().replace(/[^a-z0-9]/g, ""); };
    const fileList = files
      .filter(function(f) {
        return !f.name.endsWith("/") && Number(f.metadata.size || 0) > 0;
      })
      .map(function(f) {
        const base = f.name.split("/").pop().replace(/\.[^.]+$/, "");
        return { path: f.name, key: norm(base) };
      });

    const fixed = [];
    const skipped = [];
    const unmatched = [];
    for (const uid of uids) {
      const [djDoc, verDoc, userDoc] = await Promise.all([
        db.collection("djs").doc(uid).get(),
        db.collection("dj-verifications").doc(uid).get(),
        db.collection("users").doc(uid).get(),
      ]);
      const d = djDoc.exists ? djDoc.data() : {};
      const vd = verDoc.exists ? verDoc.data() : {};
      const ud = userDoc.exists ? userDoc.data() : {};
      const vp = vd.djProfile || {};
      const avatar = d.photoURL || d.avatar || vp.photoURL || vp.avatar ||
        vd.photoURL || ud.photoURL || ud.avatar || "";

      let alive = false;
      if (avatar) {
        try {
          const head = await fetch(avatar, { method: "HEAD" });
          const ct = String(head.headers.get("content-type") || "");
          alive = head.ok && ct.indexOf("image/") === 0;
        } catch (e) { alive = false; }
      }
      if (alive) { skipped.push(uid); continue; }

      // First: the stored URL's own storage path — file may exist, just needs a token.
      let pathFromUrl = "";
      const m = String(avatar).match(/\/o\/([^?]+)/);
      if (m) pathFromUrl = decodeURIComponent(m[1]);
      if (pathFromUrl) {
        try {
          const url = await storageDownloadUrl(pathFromUrl);
          await writeDjAvatar(uid, url);
          fixed.push({ uid: uid, name: d.stageName || vd.stageName || "", path: pathFromUrl });
          continue;
        } catch (e) { /* file gone — fall through to name matching */ }
      }

      const name = d.stageName || d.name || vp.stageName || vp.djName ||
        vd.stageName || vd.djName || ud.displayName || "";
      const emailLocal = String(ud.email || vp.email || vd.email || "").split("@")[0];
      const keys = [norm(name), norm(emailLocal), norm(name.replace(/^dj[\s-]*/i, ""))].filter(Boolean);
      const hit = fileList.find(function(f) {
        return keys.some(function(k) { return k && (f.key === k || f.key.indexOf(k) >= 0 || k.indexOf(f.key) >= 0); });
      });
      if (!hit) {
        // Clear the bogus URL so clients show the initial fallback cleanly.
        if (avatar) await writeDjAvatar(uid, "");
        unmatched.push({ uid: uid, name: name });
        continue;
      }
      const url = await storageDownloadUrl(hit.path);
      await writeDjAvatar(uid, url);
      fixed.push({ uid: uid, name: name, path: hit.path });
    }
    logger.info("[FIX AVATAR] auto: fixed=" + fixed.length + " skipped=" + skipped.length + " unmatched=" + unmatched.length);
    return { fixed: fixed, alreadyOk: skipped.length, unmatched: unmatched };
  } catch (err) {
    if (err instanceof HttpsError) throw err;
    logger.error("[FIX AVATAR] error: " + err.message);
    throw new HttpsError("internal", err.message);
  }
});

// Backfill the publicDjs collection for all existing DJs (admin only).
exports.syncAllPublicDjs = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Must be signed in.");
  }
  if (request.auth.uid !== ADMIN_UID &&
      (!request.auth.token || request.auth.token.email !== ADMIN_EMAIL)) {
    throw new HttpsError("permission-denied", "Admin only.");
  }
  const snapshot = await db.collection("djs").get();
  let synced = 0;
  const batch = db.batch();
  for (const doc of snapshot.docs) {
    const ref = db.collection("publicDjs").doc(doc.id);
    batch.set(ref, publicDjData(doc.data() || {}), { merge: false });
    synced++;
    if (synced % 500 === 0) {
      await batch.commit();
    }
  }
  if (synced % 500 !== 0) await batch.commit();
  logger.info("[SYNC PUBLIC DJS] synced " + synced + " public DJ profiles");
  return { synced: synced };
});

// Keep publicDjs in sync with the source djs documents.
exports.syncPublicDj = onDocumentWritten({
  document: "djs/{uid}",
}, async (event) => {
  const uid = event.params.uid;
  const after = event.data.after ? event.data.after.data() : null;
  if (!after) {
    await db.collection("publicDjs").doc(uid).delete().catch(() => {});
    logger.info("[SYNC PUBLIC DJ] removed " + uid);
    return;
  }
  const userDoc = await db.collection("users").doc(uid).get();
  if (!userDoc.exists || !userDoc.data().isVerifiedDJ) {
    await db.collection("publicDjs").doc(uid).delete().catch(() => {});
    return;
  }
  const public = publicDjData(after);
  public.uid = uid;
  public.isVerifiedDJ = true;
  public.updatedAt = admin.firestore.FieldValue.serverTimestamp();
  await db.collection("publicDjs").doc(uid).set(public, { merge: false });
  logger.info("[SYNC PUBLIC DJ] updated " + uid);
});

// Email users when their admin privileges, DJ status, or ban status changes.
exports.notifyUserOnPrivilegeChange = onDocumentWritten({
  document: "users/{uid}",
  secrets: [SENDGRID_API_KEY],
}, async (event) => {
  const uid = event.params.uid;
  const beforeSnap = event.data.before;
  const afterSnap = event.data.after;
  if (!afterSnap || !afterSnap.exists) return;

  const beforeData = beforeSnap && beforeSnap.exists ? beforeSnap.data() : null;
  const afterData = afterSnap.data() || {};
  if (!beforeData) return;

  const changes = [];
  if (beforeData.isAdmin !== true && afterData.isAdmin === true) {
    changes.push("You have been granted admin privileges on SOL.");
  }
  if (beforeData.isAdmin === true && afterData.isAdmin !== true) {
    changes.push("Your admin privileges on SOL have been revoked.");
  }
  if (beforeData.isVerifiedDJ !== true && afterData.isVerifiedDJ === true) {
    changes.push("Your DJ account on SOL has been verified and approved.");
  }
  if (beforeData.isVerifiedDJ === true && afterData.isVerifiedDJ !== true) {
    changes.push("Your DJ verification on SOL has been revoked.");
  }
  if (beforeData.banned !== true && afterData.banned === true) {
    changes.push("Your SOL account has been disabled/banned.");
  }
  if (beforeData.banned === true && afterData.banned !== true) {
    changes.push("Your SOL account has been re-enabled/unbanned.");
  }

  if (changes.length === 0) return;

  const toEmail = afterData.email || (await admin.auth().getUser(uid).catch(function () { return {}; })).email;
  if (!toEmail) {
    logger.warn("[NOTIFY PRIVILEGE] No email for user " + uid);
    return;
  }

  const html = "<p>" + changes.join("</p><p>") + "</p><p>If you believe this was a mistake, contact support at " + ADMIN_EMAIL + ".</p>";
  try {
    await sendEmail(SENDGRID_API_KEY.value(), toEmail, "Your SOL account status has changed", html);
    logger.info("[NOTIFY PRIVILEGE] Sent status email to " + toEmail);
  } catch (err) {
    logger.error("[NOTIFY PRIVILEGE] Failed to send email to " + toEmail + ": " + err.message);
  }
});
