const { onDocumentWritten } = require("firebase-functions/v2/firestore");
const { defineSecret } = require("firebase-functions/params");
const { setGlobalOptions } = require("firebase-functions/v2");
const logger = require("firebase-functions/logger");
const admin = require("firebase-admin");

admin.initializeApp();
const db = admin.firestore();

setGlobalOptions({ region: "us-central1", maxInstances: 10 });

const TEXTBEE_API_KEY = defineSecret("TEXTBEE_API_KEY");
const TEXTBEE_DEVICE_ID = defineSecret("TEXTBEE_DEVICE_ID");

function formatPhoneE164(raw) {
  if (!raw) return null;
  var digits = String(raw).replace(/[^\d+]/g, "");
  if (digits.startsWith("+")) return digits;
  if (digits.length === 10) return "+1" + digits;
  if (digits.length === 11 && digits.startsWith("1")) return "+" + digits;
  return null;
}

async function sendSms(apiKey, deviceId, recipients, message) {
  var body = { recipients: recipients, message: message };
  if (deviceId) body.deviceId = deviceId;

  var res = await fetch("https://api.textbee.dev/api/v1/gateway/send-sms", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
    },
    body: JSON.stringify(body),
  });

  var data = await res.json().catch(function () { return {}; });
  if (!res.ok) {
    throw new Error("TextBee error " + res.status + ": " + JSON.stringify(data));
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
    secrets: [TEXTBEE_API_KEY, TEXTBEE_DEVICE_ID],
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
        TEXTBEE_API_KEY.value(),
        TEXTBEE_DEVICE_ID.value() || undefined,
        [phone],
        message
      );

      await afterSnap.ref.set({ djSmsSentFor: djId }, { merge: true });
      logger.info("SMS sent to DJ " + djId + " for booking " + event.params.bookingId);
    } catch (err) {
      logger.error("Failed to send DJ booking SMS: " + err.message);
    }
  }
);
