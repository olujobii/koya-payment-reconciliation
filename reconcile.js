// Payment reconciliation.
//
// Reads payments.jsonl and works out how much money we actually collected.
// Run:  node reconcile.js

const fs = require("fs");

let total = 0;
let count = 0;
const successfulTxnIds = new Map();

const lines = fs
  .readFileSync("payments.jsonl", "utf8")
  .split("\n")
  .filter((l) => l.length > 0);

for (const line of lines) {
  try {
    const event = JSON.parse(line);

    if (event.txn_id == null || event.txn_id.trim().length === 0) {
      continue;
    }

    if (successfulTxnIds.has(event.txn_id)) {
      const savedEvent = Date.parse(successfulTxnIds.get(event.txn_id).ts);
      if (savedEvent < Date.parse(event.ts))
        successfulTxnIds.set(event.txn_id, event);
    } else {
      successfulTxnIds.set(event.txn_id, event);
    }
  } catch (error) {
    console.log("Invalid JSON line, will be skipped");
  }
}

for (const [index, event] of successfulTxnIds.entries()) {
  if (event.status === "success") {
    total += parseFloat(event.amount);
    count += 1;
  }
}

const expected = parseInt(fs.readFileSync("expected.txt", "utf8").trim(), 10);

if (count !== expected) {
  console.log(
    `Check failed: counted ${count} successful payments, expected ${expected}.`,
  );
  console.log(
    "Something in the data isn't being handled the way the README describes.",
  );
} else {
  console.log(`Check passed: ${count} successful payments.`);
  console.log(`Your code: KOYA-${Math.round(total)}`);
}
