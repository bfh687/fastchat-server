const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;

const validation = require("../utilities").validation;
const msg_functions = require("../utilities/exports").messaging;
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
 * @apiSuccess {Object[]} contacts the memberid_b, names and email of each connected user
 *
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
 router.get("/", (req, res, next) => {
  let query = "select m.memberid, m.username, m.email, max(c.verified) as verified" +
              "from members m " +
              "inner join contacts c " +
              "on m.memberid = c.memberid_b " +
              "where c.verified = 1 and c.memberid_a = $1" +
              "group by m.memberid";           
  const values = [req.decoded.memberid];
  
  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send({ 
                success: true, 
                email: req.decoded.email,
                id: req.decoded.memberid,
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
 * @api {get} /contacts Request to get all contacts the user has a connection to
 * @apiName GetContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {String} email the email of the current user
 * @apiSuccess {Object[]} contacts the memberid_b, names and email of each connected user
 *
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
 router.get("/incoming", (req, res, next) => {
  let query = "select m.memberid, m.username, m.email, max(c.verified) as verified " +
              "from members m " +
              "inner join contacts c " +
              "on m.memberid = c.memberid_a " +
              "where c.verified = 0 and c.memberid_b = $1 " +
              "group by memberid";
  const values = [req.decoded.memberid];
  
  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send({ 
        success: true, 
        email: req.decoded.email,
        memberid: req.decoded.memberid,
        contacts: result.rows
      });
    })
    .catch((err) => {
      res.status(400).send({
        message: "SQL Error",
        error: err,
      });
    });

  
});

router.get("/outgoing", (req, res, next) => {
  let query = "select m.memberid, m.username, m.email, max(c.verified) as verified " +
              "from members m " +
              "inner join contacts c " +
              "on m.memberid = c.memberid_b " +
              "where c.verified = 0 and c.memberid_a = $1" +
              "group by m.memberid";
              
  const values = [req.decoded.memberid];

  let contacts = []

    pool
      .query(query, values)
      .then((result) => {
        res.status(200).send({ 
                  success: true, 
                  email: req.decoded.email,
                  id: req.decoded.memberid,
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
 * @api {get} /contacts/search Request for a search of contacts based on input string. 
 * @apiName SearchContacts
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 * 
 * @apiBody {String} search_string the string to search with. 
 *
 * @apiSuccess {boolean} success true on successful SQL query
 * @apiSuccess {String} email the email of the current user
 * @apiSuccess {Object[]} contacts the ids, names, usernames and email of each connected user
 *
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 */
 router.get("/search/:search_string?", 
  
  
  // (req, res, next) => {
  //   let string = req.params.search_string ? req.params.search_string : ' '

  //   if (!isStringProvided(string)) {
  //     res.status(400).send({
  //       search_string: "Missing Required Information",
  //     });
  //   } else {
  //     next();
  //   }
  // },
  (req, res) => {
    

    const query = "SELECT memberid, CONCAT(firstname,' ', lastname) AS first_last, username, email FROM members WHERE CONCAT(firstname, ' ', lastname) LIKE $1 OR username LIKE $1 OR email LIKE $1;";
    // const query = "SELECT MATCH (CONCAT (firstname, ' ', lastname), email) AGAINST ('%'+ $1 + '%') FROM members GROUP BY email WITH ROLLUP;";
    const values = [['%', req.params.search_string, '%'].join('')];
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
  }
);

/**
 * @api {post} /contacts/:memberid_b Request add a user as a contact
 * @apiName AddContact
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} memberid_b the id of the user to request a connection
 *
 * @apiSuccess {boolean} success true on successful SQL query
 *
 * @apiError (400: Malformed Parameter, Member ID_B Must Be A Number) {String} message "Malformed Parameter, Member ID_B Must Be A Number"
 * @apiError (400: User Already Exists As A Contact) {String} message "User Already Exists As A Contact"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: User Not Found) {String} message "User Not Found"
 */
 router.post(
  "/verify/:memberid_b",

  // check that a valid memberid is given
  (req, res, next) => {
    const query = "select * from contacts where verified = 0 and memberid_a = $1 and memberid_b = $2";
    const values = [req.decoded.memberid, req.params.memberid_b];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 0) {
          res.status(400).send({
            message: "Contacts already Verified",
          });
        } else {
          next();
        }
      })
      .catch((err) => {
        res.status(400).send({
          message: "Error verifying contacts",
        });
      });
  },
  (req, res) => {
    const query = "update contacts set verified = 1 where (memberid_a = $1 and memberid_b = $2) or ( memberid_a = $2 and memberid_b = $1)";
    const values = [req.decoded.memberid, req.params.memberid_b];

    pool
      .query(query, values)
      .then((result) => {
        res.status(200).send({
          success: true,
          message: "Successfully added contact",
          email: req.decoded.email,
          memberid: req.decoded.memberid,
        });
      })
      .catch((err) => {
        // remove user from database
        remove(req.decoded.memberid);

        res.status(400).send({
          message: "Error Verifying Email",
        });
      });
  }
  );

/**
 * @api {post} /contacts/:memberid_b Request add a user as a contact
 * @apiName AddContact
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} memberid_b the id of the user to request a connection
 *
 * @apiSuccess {boolean} success true on successful SQL query
 *
 * @apiError (400: Malformed Parameter, Member ID_B Must Be A Number) {String} message "Malformed Parameter, Member ID_B Must Be A Number"
 * @apiError (400: User Already Exists As A Contact) {String} message "User Already Exists As A Contact"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: User Not Found) {String} message "User Not Found"
 */
 router.post(
  "/:memberid_b",

  // check that a valid memberid is given
  (req, res, next) => {
    if (!req.params.memberid_b) {
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

  // add member as a contact
  (req, res, next) => {
    const insert = "insert into contacts(memberid_a, memberid_b) values ($1, $2) returning primarykey as requestid, memberid_a, memberid_b, verified";
    const values = [req.decoded.memberid, req.params.memberid_b];

    pool
      .query(insert, values)
      .then((result) => {
        if (result.rowCount == 1) {
          // res.contact = result.rows[0];
          // res.message.email = req.decoded.email;
          next();
        } else {
          res.status(400).send({
            message: "Unknown Error",
          });
        }
      })
      .catch((err) => {
        res.status(400).send({
          message: "SQL Error",
          error: err,
        });
      });
  },

  // check that user exists
  (req, res, next) => {
    const query = "select memberid, username, email from members where memberid = $1";
    const values = [req.decoded.memberid];

    pool
      .query(query, values)
      .then((result) => {
        res.sender = result.rows[0];
        next()
      })
      .catch((error) => {
        res.status(400).send({
          message: "SQL Error",
          error: error,
        });
      });
  },
    // send push notification of incoming contact request to newly added user. 
    (req, res, next) => {
      const query = "select pt.token, pt.memberid, m.email, m.username from push_token pt inner join members m on pt.memberid = m.memberid where pt.memberid = $1";
      const values = [req.params.memberid_b];
  
      pool
        .query(query, values)
        .then((result) => {
          console.log(req.decoded.email);
          console.log(result.rows[0]);
          res.contactin = result.rows[0];
          msg_functions.sendIncomingContact(res.contactin.token, res.sender, res.contactin);
          next()
        })
        .catch((err) => {
          res.status(400).send({
            message: "SQL Error On Select From Push Token 1",
            error: err,
          });
        });
    },
    (req, res) => {
      const query = "select pt.token, pt.memberid, m.email, m.username from push_token pt inner join members m on pt.memberid = m.memberid where pt.memberid = $1";
      const values = [req.decoded.memberid];
  
      pool
        .query(query, values)
        .then((result) => {
          res.contactout = result.rows[0];
          msg_functions.sendOutGoingContact(res.contactout.token, res.sender, res.contactout);
          res.status(200).send({
            success: true,
            // sender: res.sender
          });
        })
        .catch((err) => {
          res.status(400).send({
            message: "SQL Error On Select From Push Token 2",
            error: err,
          });
        });
    },
  );

/**
 * @api {delete} /contacts/:memberid_b Request to delete a user from contacts
 * @apiName DeleteUser
 * @apiGroup Contacts
 *
 * @apiHeader {String} authorization valid json web token (JWT)
 *
 * @apiParam {Number} memberid_b the id of the user to delete from contacts
 *
 * @apiSuccess {boolean} success true on successful SQL query
 *
 * @apiError (400: Malformed Parameter, Member ID Must Be A Number) {String} message "Malformed Parameter, Member ID Must Be A Number"
 * @apiError (400: Missing Required Information) {String} message "Missing Required Information"
 * @apiError (400: User Not a Contact) {String} message "User Not a Contact"
 * @apiError (400: SQL Error) {String} message "SQL Error"
 *
 * @apiError (404: User Not Found) {String} message "User Not Found"
 *
 */
 router.delete(
  "/:memberid_b",

  // check that a valid chatid and memberid are given, and that they are both numerical
  (req, res, next) => {
    if (!req.params.memberid_b) {
      res.status(400).send({
        message: "Missing Required Information",
      });
    } else if (isNaN(req.params.memberid_b)) {
      res.status(400).send({
        message: "Malformed Parameter, Member ID Must Be A Number",
      });
    } else {
      next();
    }
  },

  // check that member exists and convert email to memberid
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

  // check that member is actually a contact
  (req, res, next) => {
    const query = "select * from contacts where memberid_a = $1 and memberid_b = $2";
    const values = [req.decoded.memberid, req.params.memberid_b];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount > 0) {
          next();
        } else {
          res.status(400).send({
            message: "User Not a Contact",
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
    const query = "delete from contacts where memberid_a = $1 and memberid_b = $2 returning *";
    const values = [req.decoded.memberid, req.params.memberid_b];
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
