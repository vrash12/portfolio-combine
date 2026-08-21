require("dotenv").config({ quiet: true });

const { authenticator } = require("otplib");

const account = process.env.ADMIN_EMAIL || "portfolio-admin";
const issuer = process.env.MFA_ISSUER || "VRMS Portfolio";
const secret = authenticator.generateSecret();
const enrollmentUri = authenticator.keyuri(account, issuer, secret);

console.log("Add this secret to ADMIN_MFA_SECRET after enrollment:");
console.log(secret);
console.log("\nOpen this otpauth URI with your authenticator app:");
console.log(enrollmentUri);
