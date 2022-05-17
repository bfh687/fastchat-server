const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;

const validation = require("../utilities").validation;
const isStringProvided = validation.isStringProvided;

/**
 * @api {post} /chats Request to create a new chatroom, also placing the current user in it
 * @apiName CreateChat
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 * 
 * @apiParam {String} name the name of the chatroom

 * @apiSuccess {boolean} success true when the pushy token is inserted
 * @apiSuccess {Number} chatid id of the newly created chatroom
 * @apiSuccess {String} chatname name of the newly created chatroom
 *
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
router.post(
  "/",

  // check that a chatroom name was provided
  (req, res, next) => {
    if (!isStringProvided(req.body.name)) {
      res.status(400).send({
        message: "Missing Required Information",
      });
      return;
    }
    next();
  },

  // add the chatroom, returning chatid of newly created room
  (req, res, next) => {
    const insert = "insert into chats(name) values ($1) returning chatid";
    const values = [req.body.name];

    pool
      .query(insert, values)
      .then((result) => {
        req.body.chatid = result.rows[0].chatid;
        next();
      })
      .catch((err) => {
        res.status(400).send({
          message: "SQL Error",
          error: err,
        });
      });
  },

  // add current user to the chatroom
  (req, res) => {
    const query = "insert into chatmembers (chatid, memberid) values ($1, $2)";
    const values = [req.body.chatid, req.decoded.memberid];

    pool
      .query(query, values)
      .then((result) => {
        res.status(200).send({
          success: true,
          chatid: req.body.chatid,
          chatname: req.body.name,
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

/**
 * @api {get} /chats Request to get all chatrooms the user is apart of
 * @apiName GetChats
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {Object[]} chats the ids and names of each chat
 *
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
router.get("/", (req, res, next) => {
  const query = "select * from chats where chatid in " + "(select chatid from chatmembers where memberid = $1)";
  const values = [req.decoded.memberid];
  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send({ success: true, chats: result.rows });
    })
    .catch((err) => {
      res.status(400).send({
        message: "SQL Error",
        error: err,
      });
    });
});

/**
 * @api {post} /chats/:chatid Request add a user to a chat room
 * @apiName AddUser
 * @apiGroup Chats
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
  "/:chatid/",

  // check that a valid chat id is given
  (req, res, next) => {
    if (!req.params.chatid) {
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

  // check that the chat room exists
  (req, res, next) => {
    const query = "select * from chats where chatid = $1";
    const values = [req.params.chatid];

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
          message: "SQL Error",
          error: error,
        });
      });
  },

  // check that user exists
  (req, res, next) => {
    const query = "select * from members where memberid = $1";
    const values = [req.body.memberid];

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
    const query = "select * from chatmembers where chatid = $1 and memberid = $2";
    const values = [req.params.chatid, req.decoded.memberid];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount > 0) {
          res.status(400).send({
            message: "User Already Exists In Chat Room",
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

  // insert member into chat
  (req, res) => {
    const insert = "insert into chatmembers(chatid, memberid) values ($1, $2) returning *";
    const values = [req.params.chatid, req.decoded.memberid];

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

/**
 * @api {get} /chats/:chatid Request to get info of all users in the chat room
 * @apiName GetUsers
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} chatid the id of the chatroom
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {Number} count the amount of users in the chat room
 * @apiSuccess {Object[]} users the user's information
 *
 * @apiError (400: Malformed Parameter, Chat ID Must Be A Number) {String} message "Malformed Parameter, Chat ID Must Be A Number"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: Chat ID Not Found) {String} message "Chat ID Not Found"
 */
router.get(
  "/:chatid",
  // check that a valid, numerical chat id is given
  (req, res, next) => {
    if (!req.params.chatid) {
      res.status(400).send({
        message: "Missing required information",
      });
    } else if (isNaN(req.params.chatid)) {
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
    const values = [req.params.chatid];

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
          message: "SQL Error",
          error: error,
        });
      });
  },

  // get the member's id and email
  (req, res) => {
    const query =
      "select members.memberid, members.email from " +
      "chatmembers inner join members on chatmembers.memberid = members.memberid " +
      "where chatid = $1";
    const values = [req.params.chatid];

    pool
      .query(query, values)
      .then((result) => {
        res.send({
          success: true,
          count: result.rowCount,
          users: result.rows,
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

/**
 * @api {delete} /chats/:chatid/:memberid Request to delete a user from the chat room
 * @apiName DeleteUser
 * @apiGroup Chats
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} chatid the id of the chatroom
 * @apiParam {Number} memberid the id of the user to delete
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {Number} count the amount of users in the chat room
 * @apiSuccess {Object[]} users the user's information
 *
 * @apiError (400: Malformed Parameter, Chat ID Must Be A Number) {String} message "Malformed Parameter, Chat ID Must Be A Number"
 * @apiError (400: Malformed Parameter, Member ID Must Be A Number) {String} message "Malformed Parameter, Member ID Must Be A Number"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: User Not In Chat) {String} message "User Not In Chat"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: Chat ID Not Found) {String} message "Chat ID Not Found"
 * @apiError (404: User Not Found) {String} message "User Not Found"
 *
 */
router.delete(
  "/:chatid/:memberid",

  // check that a valid chatid and memberid are given, and that they are both numerical
  (req, res, next) => {
    if (!req.params.chatid || !req.params.memberid) {
      res.status(400).send({
        message: "Missing Required Information",
      });
    } else if (isNaN(req.params.chatid)) {
      res.status(400).send({
        message: "Malformed Parameter, Chat ID Must Be A Number",
      });
    } else if (isNaN(req.params.memberid)) {
      res.status(400).send({
        message: "Malformed Parameter, Member ID Must Be A Number",
      });
    } else {
      next();
    }
  },

  // check that chat room exists
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

  // check that member exists and convert email to memberid
  (req, res, next) => {
    const query = "select * from members where memberid = $1";
    const values = [req.params.memberid];

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

  // check that member is apart of the chat room
  (req, res, next) => {
    const query = "select * from chatmembers where chatid = $1 and memberid = $2";
    const values = [req.params.chatid, req.params.memberid];

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
          message: "SQL Error",
          error: error,
        });
      });
  },

  // delete member from the chat room
  (req, res) => {
    const query = "delete from chatmembers where chatid = $1 and memberid = $2 returning *";
    const values = [req.params.chatid, req.params.memberid];
    pool
      .query(query, values)
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
