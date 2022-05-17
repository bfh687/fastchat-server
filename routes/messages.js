const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;

const msg_functions = require("../utilities/exports").messaging;
const validation = require("../utilities").validation;
let isStringProvided = validation.isStringProvided;

/**
 * @api {post} /messages Request to send a message to a chatroom
 * @apiName SendMessage
 * @apiGroup Messages
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 * 
 * @apiParam {Number} chatid the id of the chatroom to send the message to
 * @apiParam {String} message the message to send to the chatroom

 * @apiSuccess {boolean} success true when the pushy token is inserted
 *
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: Malformed Parameter, Chat ID Must Be A Number) {String} message "Malformed Parameter, Chat ID Must Be A Number"
 * @apiError (400: User Not In Chat) {String} message "User Not In Chat"
 * 
 * @apiError (400: SQL Error) {String} message "SQL Error On Chat ID Check"
 * @apiError (400: SQL Error) {String} message "SQL Error On Member In Chat Check"
 * @apiError (400: SQL Error) {String} message "SQL Error On Insert"
 * @apiError (400: SQL Error) {String} message "SQL Error On Select From Push Token"
 * @apiError (400: Unknown Error) {String} message "Unknown Error"
 *
 * @apiError (404: Chat ID Not Found) {String} message "Chat ID Not Found"
 *
 */
router.post(
  "/",

  // check that a valid, numerical chat id is given, and that message isn't empty
  (req, res, next) => {
    if (req.body.chatid === undefined || !isStringProvided(req.body.message)) {
      res.status(400).send({
        message: "Missing Required Information",
      });
    } else if (isNaN(req.body.chatid)) {
      res.status(400).send({
        message: "Malformed Parameter, Chat ID Must Be A Number",
      });
    } else {
      next();
    }
  },

  // check that chat room exists
  (req, res, next) => {
    const query = "select * from chats where chatid = $1";
    const values = [req.body.chatid];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 0) {
          res.status(404).send({
            message: "Chat ID Not Found",
          });
        } else {
          next();
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error On Chat ID Check",
          error: error,
        });
      });
  },

  // check that member is apart of the chat room
  (req, res, next) => {
    const query = "select * from chatmembers where chatid = $1 and memberid = $2";
    const values = [req.body.chatid, req.decoded.memberid];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount > 0) {
          next();
        } else {
          res.status(400).send({
            message: "User Not In Chat",
          });
        }
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error On Member In Chat Check",
          error: error,
        });
      });
  },

  // insert message into the database
  (req, res, next) => {
    const query =
      "insert into messages(chatid, message, memberid) values($1, $2, $3) returning primarykey as messageid, chatid, message, memberid as email, timestamp";
    const values = [req.body.chatid, req.body.message, req.decoded.memberid];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 1) {
          res.message = result.rows[0];
          res.message.email = req.decoded.email;
          next();
        } else {
          res.status(400).send({
            message: "Unknown Error",
          });
        }
      })
      .catch((err) => {
        res.status(400).send({
          message: "SQL Error On Insert",
          error: err,
        });
      });
  },

  // send a push notification to all members of the chat
  (req, res) => {
    const query = "select token from push_token inner join chatmembers on push_token.memberid = chatmembers.memberid where chatmembers.chatid = $1";
    const values = [req.body.chatid];

    pool
      .query(query, values)
      .then((result) => {
        console.log(req.decoded.email);
        console.log(req.body.message);
        result.rows.forEach((entry) => msg_functions.sendMessageToIndividual(entry.token, res.message));
        res.status(200).send({
          success: true,
        });
      })
      .catch((err) => {
        res.status(400).send({
          message: "SQL Error On Select From Push Token",
          error: err,
        });
      });
  }
);

/**
 * @api {get} /messages/:chatid Request to get all messages in a chat room
 * @apiName GetMessage
 * @apiGroup Messages
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 * 
 * @apiParam {Number} chatid the id of the chatroom to send the message to
 * @apiParam {String} message the message to send to the chatroom

 * @apiSuccess {boolean} success true when the pushy token is inserted
 *
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: Malformed Parameter, Chat ID Must Be A Number) {String} message "Malformed Parameter, Chat ID Must Be A Number"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: Chat ID Not Found) {String} message "Chat ID Not Found"
 *
 */
router.get(
  "/:chatid",

  // check that a valid, numerical chat id is given
  (req, res, next) => {
    if (req.params.chatid === undefined) {
      res.status(400).send({
        message: "Missing Required Information",
      });
    } else if (isNaN(req.params.chatid)) {
      res.status(400).send({
        message: "Malformed Parameter, Chat ID Must Be A Number",
      });
    } else {
      next();
    }
  },

  // verify that the chat exists
  (req, res, next) => {
    const query = "select * from chats where chatid = $1";
    const values = [req.params.chatid];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 0) {
          res.status(404).send({
            message: "Chat ID not found",
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

  // get up to 15 messages from the given chat room or get the given message
  (req, res) => {
    const query =
      "select messages.primarykey as messageid, members.email, messages.message, to_char(messages.timestamp AT TIME ZONE 'PDT', 'YYYY-MM-DD HH24:MI:SS.US' ) as timestamp from messages " +
      "inner join members on messages.memberid=members.memberid " +
      "where chatid = $1 " +
      "order by timestamp desc limit 15";
    const values = [req.params.chatid];

    pool
      .query(query, values)
      .then((result) => {
        res.send({
          chatid: req.params.chatid,
          rowCount: result.rowCount,
          rows: result.rows,
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
