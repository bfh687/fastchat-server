const express = require("express");
const pool = require("../utilities/sql_conn");
const router = express.Router();
const fetch = require("node-fetch");

router.post(
  "/",
  (req, res, next) => {
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
        res.status(400).send();
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
        res.status(400).send();
      });
  }
);

router.delete("/:zip", (req, res) => {
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
      res.status(400).send();
    });
});

router.delete("/:lat/:lon", (req, res) => {
  const id = req.decoded.memberid;
  const lat = req.params.lat;
  const lon = req.params.lon;

  const query = "delete from locations where memberid = $1 and lat = $2 and long = $3";
  const values = [id, lat, lon];

  console.log(id + " " + lat + " " + lon);

  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send();
    })
    .catch((err) => {
      res.status(400).send();
    });
});

// gets a list of current weather for each saved location
router.get("/", (req, res) => {
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

      console.log("HEJKRSHJKREHESJHGSJDHGJK" + req.body.lat + " " + req.body.long);
      if (req.body.lat && req.body.long) {
        const response = await fetch(`${process.env.DOMAIN_URL}/weather/current?lat=${req.body.lat}&long=${req.body.long}`);
        const location = await response.json();
        location.city += " (Current Location)";
        locations.push(location);
      }

      res.status(200).send({
        locations: locations,
      });
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send();
    });
});

module.exports = router;
