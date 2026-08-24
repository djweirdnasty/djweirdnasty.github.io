const test = require("node:test");
const assert = require("node:assert/strict");
const { computeBookingPayout } = require("../index.js");

test("deposit-only booking: deposit share payable once DJ accepts (confirmed)", () => {
  const result = computeBookingPayout({
    totalAmount: 200,
    deposit_only: true,
    status: "confirmed",
  });
  // deposit = max(50, 200*0.5) = 100, DJ share = 100*0.85 = 85
  assert.equal(result.owed, 85);
  assert.equal(result.payDeposit, true);
  assert.equal(result.payFinal, false);
});

test("deposit-only booking: remaining balance payable once completed", () => {
  const result = computeBookingPayout({
    totalAmount: 200,
    deposit_only: true,
    status: "completed",
    depositPayoutSent: true,
  });
  // remaining = 200 - 100 = 100, DJ share = 100*0.85 = 85
  assert.equal(result.owed, 85);
  assert.equal(result.payDeposit, false);
  assert.equal(result.payFinal, true);
});

test("deposit-only booking still pending (not accepted): nothing owed yet", () => {
  const result = computeBookingPayout({
    totalAmount: 200,
    deposit_only: true,
    status: "pending",
  });
  assert.equal(result.owed, 0);
});

test("full-payment booking: nothing owed until completed", () => {
  const result = computeBookingPayout({
    totalAmount: 200,
    deposit_only: false,
    status: "confirmed",
  });
  assert.equal(result.owed, 0);
});

test("full-payment booking: full 85% share owed once completed", () => {
  const result = computeBookingPayout({
    totalAmount: 200,
    deposit_only: false,
    status: "completed",
  });
  assert.equal(result.owed, 170);
  assert.equal(result.payFinal, true);
});

test("legacy payoutSent flag blocks both deposit and final payout", () => {
  const result = computeBookingPayout({
    totalAmount: 200,
    deposit_only: true,
    status: "completed",
    payoutSent: true,
  });
  assert.equal(result.owed, 0);
});

test("$50 minimum deposit applies to small bookings", () => {
  const result = computeBookingPayout({
    totalAmount: 60,
    deposit_only: true,
    status: "confirmed",
  });
  // deposit = max(50, 30) = 50, DJ share = 50*0.85 = 42.5
  assert.equal(result.owed, 42.5);
});

test("already-paid deposit is not paid twice, only remaining final share owed", () => {
  const result = computeBookingPayout({
    totalAmount: 200,
    deposit_only: true,
    status: "completed",
    depositPayoutSent: true,
    finalPayoutSent: false,
  });
  assert.equal(result.owed, 85);
  assert.equal(result.payDeposit, false);
  assert.equal(result.payFinal, true);
});
