const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;

const validation = require("../utilities").validation;
const isStringProvided = validation.isStringProvided;

/**
 * @api {post} /chats req to add a chat
 * @apiName PostChats
 * @apiGroup Chats
 */
router.post(
    "/",

    // check that a chatroom name was provided
    (req, res, next) => {
        if (!isStringProvided(req.body.name)) {
            res.status(400).send({
                message: "Missing Required Information",
            });
        } else {
            next();
        }
    },

    // add the chatroom, returning chatid of newly created chatroom
    (req, res) => {
        const insert = "insert into chats(name) values ($1) returning chatid";
        const values = [req.body.name];

        pool.query(insert, values)
            .then((result) => {
                res.send({
                    success: true,
                    chatid: result.rows[0].chatid,
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
 * @api {put} /chats/:chatid? req add a user to a chat
 * @apiName PutChats
 * @apiGroup Chats
 */
router.put(
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

        pool.query(query, values)
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
        const values = [req.decoded.memberid];

        pool.query(query, values)
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
        //validate email does not already exist in the chat
        const query = "select * from chatmembers where chatid = $1 and memberid = $2";
        const values = [req.params.chatid, req.decoded.memberid];

        pool.query(query, values)
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

        pool.query(insert, values)
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
 * @api {get} /chats/:chatId? req to get the emails of user in a chat
 * @apiName GetChats
 * @apiGroup Chats
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

        pool.query(query, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "Chat Room Not Found",
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

        pool.query(query, values)
            .then((result) => {
                res.send({
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

/**
 * @api {delete} /chats/:chatid?/:email? req delete a user from a chat
 * @apiName DeleteChats
 * @apiGroup Chats
 */
router.delete(
    "/:chatid/:memberid",

    // check that a valid chatid and email are given, and that the chatid is numerical
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
        const values = [req.params.memberid];

        pool.query(query, values)
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

    // check that member exists
    (req, res, next) => {
        const query = "select * from members where memberid = $1";
        const values = [req.params.memberid];

        pool.query(query, values)
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

        pool.query(query, values)
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
        pool.query(query, values)
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
