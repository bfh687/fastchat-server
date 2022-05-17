const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;

const validation = require("../utilities").validation;
const isStringProvided = validation.isStringProvided;

/**
 * @api {get} /contacts Request to get all contacts the user has a connection to
 * @apiName GetContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {String} email the email of the current user
 * @apiSuccess {Object[]} chats the ids and names of each chat
 *
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
 router.get("/", (req, res, next) => {
  const query = "select memberid_b from contacts where memberid_a = ($1)";
  const values = [req.decoded.memberid];
  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send({ 
        success: true, 
        email: req.decoded.email, 
        contacts: result.rows});
    })
    .catch((err) => {
      res.status(400).send({
        message: "SQL Error",
        error: err,
      });
    });
});

/**
 * @api {post} /chats/:chatid Request add a user as a contact
 * @apiName AddContact
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} chatid the id of the chatroom
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {Number[]} chatids the ids of the chats
 *
 * @apiError (400: Malformed Parameter, Chat ID Must Be A Number) {String} message "Malformed Parameter, Chat ID Must Be A Number"
 * @apiError (400: User Already Exists In Chat Room) {String} message "User Already Exists In Chat Room"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: Chat ID Not Found) {String} message "Chat ID Not Found"
 */
 router.post(
  "/:memberid_b/",

  // check that a valid chat id is given
  (req, res, next) => {
    if (!req.decoded.memberid || !req.params.memberid_b) {
      res.status(400).send({
        message: "Missing Required Information",
      });
    } else if (isNaN(req.params.memberid_b)) {
      res.status(400).send({
        message: "Malformed Parameter, Memberid Must Be A Number",
      });
    } else {
      next();
    }
  },

  // check that user exists
  (req, res, next) => {
    const query = "select * from members where memberid = $1";
    const values = [req.params.memberid_b];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 0) {
          res.status(404).send({
            message: "User Not Found",
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error",
          error: error,
        });
      });
  },

  // check that user doesn't already exist in the chatroom
  (req, res, next) => {
    const query = "select * from contacts where memberid_b = $1 and memberid_a = $2";
    const values = [req.params.memberid_b, req.decoded.memberid];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount > 0) {
          res.status(400).send({
            message: "User Already Exists as a Contact",
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error",
          error: error,
        });
      });
  },

  // check that a chatroom name was provided
  (req, res, next) => {
    if (!isStringProvided(req.body.nickname)) {
      res.status(400).send({
        message: "Missing Required Information",
      });
      return;
    }
    next();
  },

  // add member as a contact
  (req, res) => {
    const insert = "insert into contacts(memberid_a, memberid_b, nickname) values ($1, $2, $3) returning *";
    const values = [req.decoded.memberid, req.params.memberid_b, req.body.nickname];

    pool
      .query(insert, values)
      .then((result) => {
        res.status(200).send({
          success: true,
        });
      })
      .catch((err) => {
        res.status(400).send({
          message: "SQL Error",
          error: err,
        });
      });
  }
);

module.exports = router;
