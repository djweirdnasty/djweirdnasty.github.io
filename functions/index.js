const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const ADMIN_UID = "3i7fQdPjN0Qxz3FysVPvnhtxzlJ3";
const ADMIN_EMAIL = "djweirdnasty@gmail.com";

const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

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
    var amount = Number(request.data && request.data.amount);
    var bookingIds = (request.data && request.data.bookingIds) || [];

    if (!djId || !amount || amount <= 0) {
      throw new HttpsError("invalid-argument", "djId and a positive amount are required.");
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
        "This DJ does not have a valid PayPal email on file. Automated payouts require an email address (not a paypal.me link)."
      );
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
      amount,
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
      amount: amount,
      bookingIds: bookingIds,
      payoutBatchId: payoutBatchId,
      status: batchStatus,
      mode: mode,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: auth.uid,
    });

    bookingIds.forEach(function (bookingId) {
      var ref = db.collection("bookings").doc(bookingId);
      batch.set(ref, {
        payoutSent: true,
        payoutBatchId: payoutBatchId,
        payoutAt: admin.firestore.FieldValue.serverTimestamp(),
      }, { merge: true });
    });

    await batch.commit();

    logger.info("PayPal payout sent to DJ " + djId + " for $" + amount + " (batch " + payoutBatchId + ")");

    return { success: true, payoutBatchId: payoutBatchId, status: batchStatus };
  }
);
