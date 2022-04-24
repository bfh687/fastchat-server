const pool = require("./sql_conn.js");
const cred = require("./cred.js");
const validation = require("./validation.js");

const sendEmail = require("./email.js").sendEmail;
const generateHash = cred.generateHash;
const generateSalt = cred.generateSalt;

module.exports = {
    pool,
    generateHash,
    generateSalt,
    validation,
    sendEmail,
};
