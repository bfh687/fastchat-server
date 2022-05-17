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

  const url = "https://api.openweathermap.org/data/2.5/weather?zip=" + zip + ",us&units=" + unit + "&appid=" + process.env.WEATHER_API;
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
router.get("/hourly/:code", (req, res) => {
  let query = req.params.code;
  console.log(query);

  const url = "https://api.openweathermap.org/data/2.5/forecast?zip=" + query + ",us&units=imperial&appid=" + process.env.WEATHER_API;

  if (query) {
    https.get(url, (response) => {
      response.on("data", (data) => {
        const weather = JSON.parse(data);

        let one = weather.list[0].main.temp;
        let two = weather.list[1].main.temp;
        let three = weather.list[2].main.temp;
        let four = weather.list[3].main.temp;
        let five = weather.list[4].main.temp;

        res.send({
          one,
          two,
          three,
          four,
          five,
        });
      });
    });
  } else {
    response.status(400).send({ message: "Missing required information" });
  }
});

router.get("/daily/:code", (req, res) => {
  let zip = req.params.code;
  let unit = "imperial";
  console.log(zip);

  const url = "https://api.openweathermap.org/data/2.5/forecast/daily?zip=" + zip + ",us&appid=" + process.env.FORECAST_API;
  if (zip) {
    https.get(url, (response) => {
      response.on("data", (data) => {
        const weather = JSON.parse(data);
        let info = weather;
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

module.exports = router;
