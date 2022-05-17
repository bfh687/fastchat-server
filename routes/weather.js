const express = require("express");
const https = require("https");

// Initiate the route
var router = express.Router();

const bodyParser = require("body-parser");
router.use(bodyParser.urlencoded({ extended: true }));

router.get("/zipcode/:code", (req, res) => {
  let zip = req.params.code;
  let unit = "imperial";
  console.log(zip);

  const url = "https://api.openweathermap.org/data/2.5/weather?zip=%22+zip+%22,us&units=%22+unit+%22&appid=%22+process.env.WEATHER_API";
  if (zip) {
    https.get(url, (response) => {
      response.on("data", (data) => {
        const weather = JSON.parse(data);
        let info = weather.main.temp;
        res.send({
          info,
        });
      });
    });
  } else {
    response.status(400).send({
      message: "Missing required information",
    });
  }
});

//hourly weather using zipcode
router.get("/daily/:code", (req, res) => {
  let query = req.params.code;
  console.log(query);
  let unit = "imperial";
  console.log("1");
  const url = "https://api.openweathermap.org/data/2.5/forecast?zip=%22+query+%22,us&appid=%22+process.env.WEATHER_API";
  console.log("2");
  if (query) {
    console.log("hi");

    https.get(url, (response) => {
      console.log("pls");
      response.on("data", (data) => {
        console.log("okay here");
        const weather = JSON.parse(data);
        console.log("3");

        res.send({
          weather,
        });
        console.log("4");
      });
    });
  } else {
    response.status(400).send({ message: "Missing required information" });
  }
});

module.exports = router;
