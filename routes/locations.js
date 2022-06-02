const express = require("express");
const pool = require("../utilities/sql_conn");
const router = express.Router();
const fetch = require("node-fetch");

/**
 * @api {post} / Request to add a saved location
 * @apiName AddSavedLocations
 * @apiGroup Locations
 *
 * @apiParam {String} lat the latitude of the location to add
 * @apiParam {String} long the longitude of the location to add
 *
 * @apiError (400: Missing Query Parameters) {String} message "Missing Required Query Parameters"
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.post(
  "/",
  (req, res, next) => {
    if (!req.body.lat || !req.body.long) {
      res.status(400).send({
        message: "Missing Required Query Parameters",
      });
      return;
    }
    const id = req.decoded.memberid;
    const lat = req.body.lat;
    const long = req.body.long;

    const query = "select * from locations where memberid = $1 and lat = $2 and long = $3";
    const values = [id, lat, long];

    pool
      .query(query, values)
      .then((result) => {
        if (result.rowCount == 0) next();
        res.status(200).send();
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({
          message: "Error Deleting Location",
          error: err,
        });
      });
  },
  (req, res) => {
    const id = req.decoded.memberid;
    const nickname = req.body.city;
    const lat = req.body.lat;
    const long = req.body.long;
    const zip = req.body.zip;

    let query = "insert into locations(memberid, nickname, lat, long, zip) values($1, $2, $3, $4, $5)";
    let values = [id, nickname, lat, long, zip];

    if (!zip) {
      query = "insert into locations(memberid, nickname, lat, long) values($1, $2, $3, $4)";
      values = [id, nickname, lat, long];
    }

    pool
      .query(query, values)
      .then((result) => {
        res.status(200).send();
      })
      .catch((err) => {
        console.log(err);
        res.status(400).send({
          message: "Error Deleting Location",
          error: err,
        });
      });
  }
);

/**
 * @api {delete} /:zip Request to delete saved location with the given zip
 * @apiName DeleteSavedLocationsZipcode
 * @apiGroup Locations
 *
 * @apiParam {String} zip the zipcode of the location to delete
 *
 * @apiError (400: Missing Query Parameters) {String} message "Missing Required Query Parameters"
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.delete("/:zip", (req, res) => {
  if (!req.params.zip) {
    res.status(400).send({
      message: "Missing Required Query Parameters",
    });
    return;
  }

  const id = req.decoded.memberid;
  const zip = req.params.zip;

  const query = "delete from locations where memberid = $1 and zip = $2";
  const values = [id, zip];

  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        message: "Error Deleting Location",
        error: err,
      });
    });
});

/**
 * @api {delete} /:lat/:long Request to delete saved location with the given coords
 * @apiName DeleteSavedLocationsCoords
 * @apiGroup Locations
 *
 * @apiParam {String} lat the latitude of the location to delete
 * @apiParam {String} long the longitude of the location to delete
 *
 * @apiError (400: Missing Query Parameters) {String} message "Missing Required Query Parameters"
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.delete("/:lat/:lon", (req, res) => {
  if (!req.params.lat || !req.params.lon) {
    res.status(400).send({
      message: "Missing Required Query Parameters",
    });
    return;
  }

  const id = req.decoded.memberid;
  const lat = req.params.lat;
  const lon = req.params.lon;

  const query = "delete from locations where memberid = $1 and lat = $2 and long = $3";
  const values = [id, lat, lon];

  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send();
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        message: "Error Deleting Location",
        error: err,
      });
    });
});

/**
 * @api {get} /:lat/:long Request to get weather data for saved and current locations
 * @apiName GetSavedLocations
 * @apiGroup Locations
 *
 * @apiParam {String} lat the latitude of the current location
 * @apiParam {String} long the longitude of the current location
 *
 * @apiSuccess {Array} The list of the current and saved locations' weather data
 * @apiError (400: Missing Query Parameters) {String} message "Missing Required Query Parameters"
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.get("/:lat/:long", (req, res) => {
  if (!req.params.lat || !req.params.long) {
    res.status(400).send({
      message: "Missing Required Query Parameters",
    });
    return;
  }

  const query = "select lat, long, zip from locations where memberid = $1";
  const values = [req.decoded.memberid];
  pool
    .query(query, values)
    .then(async (result) => {
      const locations = [];
      for (let i = 0; i < result.rows.length; i++) {
        const lat = result.rows[i].lat;
        const long = result.rows[i].long;

        let response;
        if (lat == 0 || long == 0) response = await fetch(`${process.env.DOMAIN_URL}/weather/current/${result.rows[i].zip}`);
        else response = await fetch(`${process.env.DOMAIN_URL}/weather/current?lat=${lat}&long=${long}`);

        const location = await response.json();
        location.zip = result.rows[i].zip == "" ? null : result.rows[i].zip;
        locations.push(location);
      }

      if (req.params.lat && req.params.long) {
        const response = await fetch(`${process.env.DOMAIN_URL}/weather/current?lat=${req.params.lat}&long=${req.params.long}`);
        const location = await response.json();
        location.city += " (Current)";
        location.zip = null;
        locations.push(location);
      }

      res.status(200).send({
        locations: locations,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send({
        message: "Error Retrieving Weather Data",
        error: err,
      });
    });
});

module.exports = router;
