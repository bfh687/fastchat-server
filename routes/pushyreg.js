const express = require("express");
const router = express.Router();

const pool = require("../utilities/exports").pool;
const middleware = require("../middleware");

/**
 * @api {put} /auth req to insert a Pushy Token for the user
 * @apiName PutAuth
 * @apiGroup Auth
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 * @apiParam {String} token the Pushy Token of the user identified in the JWT
 *
 * @apiSuccess {boolean} success true when the pushy token is inserted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (404: User Not Found) {String} message "user not found"
 *
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.put(
    "/",
    middleware.checkToken,

    // verify that a jwt was passed (redundant?)
    (req, res, next) => {
        if (!req.body.token) {
            res.status(400).send({
                message: "Missing required information",
            });
        } else {
            next();
        }
    },

    // check that the member exists
    (req, res, next) => {
        const memberid = req.decoded.memberid;

        const query = "select * from members where memberid = $1";
        const values = [memberid];

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

    // attempt to insert token, updating token if one already exists
    (req, res) => {
        const insert =
            "insert into push_token(memberid, token) values ($1, $2) " +
            "on conflict (memberid) do update set token = $2 returning *";
        const values = [req.decoded.memberid, req.body.token];

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
 * @api {delete} /auth req to delete a Pushy Token for the user
 * @apiName DeleteAuth
 * @apiGroup Auth
 *
 * @apiHeader {String} authorization Valid JSON Web Token JWT
 *
 * @apiSuccess {boolean} success true when the pushy token is deleted
 *
 * @apiError (400: Missing Parameters) {String} message "Missing required information"
 *
 * @apiError (404: User Not Found) {String} message "user not found"
 *
 * @apiError (400: JSON Error) {String} message "malformed JSON in parameters"
 *
 * @apiError (400: SQL Error) {String} message the reported SQL error details
 */
router.delete(
    "/",
    middleware.checkToken,

    // check that member exists
    (req, res, next) => {
        const memberid = req.decoded.memberid;

        const query = "SELECT * FROM Members WHERE MemberId=$1";
        const values = [memberid];

        pool.query(query, values)
            .then((result) => {
                if (result.rowCount == 0) {
                    res.status(404).send({
                        message: "user not found",
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

    // delete the member's pushy token
    (req, res) => {
        const insert = "delete from push_token where memberid = $1 returning *";
        const values = [req.decoded.memberid];

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

module.exports = router;
