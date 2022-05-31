const express = require("express");
const pool = require("../utilities/sql_conn");
const router = express.Router();
const fetch = require("node-fetch");

router.post("/", (req, res) => {
  const id = req.decoded.memberid;
  const nickname = req.body.city;
  const lat = req.body.lat;
  const long = req.body.long;
  const zip = req.body.zip;

  const query = "insert into locations(memberid, nickname, lat, long, zip) values($1, $2, $3, $4, $5)";
  const values = [id, nickname, lat, long, zip];

  pool
    .query(query, values)
    .then((result) => {
      res.status(200).send();
    })
    .catch((err) => {
      res.status(400).send();
    });
});

router.delete("/", (req, res) => {
  const id = req.decoded.memberid;
  const zipcode = req.body.zip;

  const query = "delete from locations where memberid = $1 and zip = $2";
  const values = [id, zipcode];

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
  const query = "select lat, long from locations where memberid = $1";
  const values = [req.decoded.memberid];
  pool
    .query(query, values)
    .then(async (result) => {
      const locations = [];
      for (let i = 0; i < result.rows.length; i++) {
        const lat = result.rows[i].lat;
        const long = result.rows[i].long;
        const response = await fetch(`${process.env.DOMAIN_URL}/weather/current?lat=${lat}&long=${long}`);
        const location = await response.json();
        locations.push(location);
      }
      res.status(200).send(locations);
    })
    .catch((err) => {
      console.log(err);
      res.status(400).send();
    });
});

module.exports = router;
