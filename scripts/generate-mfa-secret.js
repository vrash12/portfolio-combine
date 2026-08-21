const { authenticator } = require("otplib");

const secret = authenticator.generateSecret();
const issuer = process.env.MFA_ISSUER || "VRMS Portfolio";
const account = process.env.ADMIN_EMAIL || "portfolio-admin";

console.log(`ADMIN_MFA_SECRET=${secret}`);
console.log(`Enrollment URI=${authenticator.keyuri(account, issuer, secret)}`);
console.log("Store the secret only in Hostinger environment variables after enrolling it.");
