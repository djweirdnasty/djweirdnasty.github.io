const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

const ADMIN_UID = "3i7fQdPjN0Qxz3FysVPvnhtxzlJ3";
const ADMIN_EMAIL = "djweirdnasty@gmail.com";

// TEMP DISABLED: uncomment once these secrets are set via `firebase functions:secrets:set`
// const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
// const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
// const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

const PAYPAL_CLIENT_ID = defineSecret("PAYPAL_CLIENT_ID");
const PAYPAL_CLIENT_SECRET = defineSecret("PAYPAL_CLIENT_SECRET");
const PAYPAL_MODE = defineSecret("PAYPAL_MODE");

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

function money(n) {
  var num = Number(n) || 0;
  return "$" + num.toFixed(0);
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

function paypalBaseUrl(mode) {
  return mode === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";
}

async function getPaypalAccessToken(clientId, clientSecret, mode) {
  var url = paypalBaseUrl(mode) + "/v1/oauth2/token";
  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Authorization": "Basic " + Buffer.from(clientId + ":" + clientSecret).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error("PayPal auth error " + res.status + ": " + JSON.stringify(data));
  }
  return data.access_token;
}

async function sendPaypalPayoutBatch(accessToken, mode, receiverEmail, amount, note, senderItemId) {
  var url = paypalBaseUrl(mode) + "/v1/payments/payouts";
  var batchId = "sol_" + senderItemId + "_" + Date.now();

  var body = {
    sender_batch_header: {
      sender_batch_id: batchId,
      email_subject: "You have a payout from SOL!",
      email_message: "You've received a DJ gig payout from Sounds of Logan (SOL).",
    },
    items: [
      {
        recipient_type: "EMAIL",
        amount: { value: amount.toFixed(2), currency: "USD" },
        receiver: receiverEmail,
        note: note || "SOL DJ gig payout",
        sender_item_id: senderItemId,
      },
    ],
  };

  var res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": "Bearer " + accessToken,
    },
    body: JSON.stringify(body),
  });

  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error("PayPal payout error " + res.status + ": " + JSON.stringify(data));
  }
  return data;
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

exports.sendPaypalPayout = onCall(
  {
    secrets: [PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_MODE],
  },
  async (request) => {
    var auth = request.auth;
    if (!auth || (auth.uid !== ADMIN_UID && auth.token.email !== ADMIN_EMAIL)) {
      throw new HttpsError("permission-denied", "Only the SOL admin can trigger payouts.");
    }

    var djId = request.data && request.data.djId;
    if (!djId) {
      throw new HttpsError("invalid-argument", "djId is required.");
    }

    var djDoc = await db.collection("djs").doc(djId).get();
    if (!djDoc.exists) {
      throw new HttpsError("not-found", "DJ profile not found.");
    }
    var dj = djDoc.data();
    var paypalEmail = (dj.paypal || "").trim();

    if (!paypalEmail || paypalEmail.indexOf("@") === -1) {
      throw new HttpsError(
        "failed-precondition",
        "This DJ has no valid PayPal email on file. Funds are held in the admin PayPal account (djweirdnasty / kurtisctabb@gmail.com) until they add one."
      );
    }

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
    totalOwed = Math.round(totalOwed * 100) / 100;

    if (totalOwed <= 0) {
      throw new HttpsError("failed-precondition", "This DJ has no outstanding payout right now.");
    }

    var mode = PAYPAL_MODE.value() || "sandbox";
    var accessToken = await getPaypalAccessToken(
      PAYPAL_CLIENT_ID.value(),
      PAYPAL_CLIENT_SECRET.value(),
      mode
    );

    var djName = dj.stageName || dj.displayName || "DJ";
    var result = await sendPaypalPayoutBatch(
      accessToken,
      mode,
      paypalEmail,
      totalOwed,
      "SOL gig payout for " + djName,
      djId
    );

    var batchStatus = (result.batch_header && result.batch_header.batch_status) || "PENDING";
    var payoutBatchId = (result.batch_header && result.batch_header.payout_batch_id) || null;

    var batch = db.batch();
    var payoutRef = db.collection("payouts").doc();
    batch.set(payoutRef, {
      djId: djId,
      djName: djName,
      paypalEmail: paypalEmail,
      amount: totalOwed,
      bookingIds: payable.map(function (p) { return p.ref.id; }),
      payoutBatchId: payoutBatchId,
      status: batchStatus,
      mode: mode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.uid,
    });

    payable.forEach(function (p) {
      var update = { payoutBatchId: payoutBatchId, payoutAt: admin.firestore.FieldValue.serverTimestamp() };
      if (p.payDeposit) update.depositPayoutSent = true;
      if (p.payFinal) update.finalPayoutSent = true;
      batch.set(p.ref, update, { merge: true });
    });

    await batch.commit();

    logger.info("PayPal payout sent to DJ " + djId + " for $" + totalOwed + " (batch " + payoutBatchId + ")");

    return { success: true, payoutBatchId: payoutBatchId, status: batchStatus, amount: totalOwed };
  }
);

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
        banned: false
      });
      created++;
    }
  }
  if (created > 0) await batch.commit();
  logger.info("[SYNC USERS] Created " + created + " missing user docs out of " + allUsers.length + " auth users.");
  return { created: created, totalAuthUsers: allUsers.length };
});

// Callable function: admin sends messages to users, DJs, or broadcast.
exports.adminSendMessage = onCall(async (request) => {
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
    }
  }

  await db.collection("admin_broadcasts").add({
    recipientType: recipientType,
    target: target,
    subject: subject,
    body: body,
    sent: sent,
    failed: failed,
    sentTo: sentTo,
    sentBy: request.auth.uid,
    sentByEmail: request.auth.token ? request.auth.token.email : "",
    timestamp: timestamp
  });

  logger.info("[ADMIN MESSAGE] Sent to " + sent + " recipients, " + failed + " failed.");
  return { success: true, sent: sent, failed: failed };
});
