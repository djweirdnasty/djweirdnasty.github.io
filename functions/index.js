const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const TWILIO_ACCOUNT_SID = defineSecret("TWILIO_ACCOUNT_SID");
const TWILIO_AUTH_TOKEN = defineSecret("TWILIO_AUTH_TOKEN");
const TWILIO_FROM_NUMBER = defineSecret("TWILIO_FROM_NUMBER");

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
