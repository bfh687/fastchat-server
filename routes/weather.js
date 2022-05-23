const express = require("express");
const router = express.Router();
const fetch = require("node-fetch");

/**
 * @api {get} /weather/daily/:zipcode Request to get daily (5-day) forecast via zipcode
 * @apiName DailyWeatherZipcode
 * @apiGroup Weather
 *
 * @apiParam {String} zipcode the zipcode to request the forecast for
 *
 * @apiSuccess {Object} data The daily (5-day) forecast for the given zipcode
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *        "coords": {
 *          "latitude": 47.671346,
 *          "longitude": -122.34166
 *        },
 *        "days": [
 *          {
 *            "date": "2022-05-18",
 *            "temp": 50.9,
 *            "desc": "Rain, Partially cloudy",
 *            "type": "rain"
 *          },
 *          {
 *            "date": "2022-05-19",
 *            "temp": 48.3,
 *            "desc": "Rain, Partially cloudy",
 *            "type": "rain"
 *          },
 *          ...
 *        ]
 *     }
 *
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.get("/daily/:zipcode", (req, res) => {
  fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${req.params.zipcode}/next7days?unitGroup=us&include=days&key=${process.env.WEATHER_API}&contentType=json`,
    {
      method: "GET",
      headers: {},
    }
  )
    .then((result) => result.json())
    .then((result) => {
      const data = new Object();
      data.coords = {
        latitude: result.latitude,
        longitude: result.longitude,
      };

      const days = [];
      for (let i = 0; i < Math.min(result.days.length, 5); i++) {
        const info = new Object();
        const day = result.days[i];
        info.date = day.datetime;
        info.temp = day.temp;
        info.desc = day.conditions;
        info.type = day.icon;
        days.push(info);
      }

      data.days = days;

      res.status(200).send(data);
    })
    .catch((error) => {
      res.status(400).send({
        message: "Error Retrieving Weather Data",
        error: error,
      });
    });
});

/**
 * @api {get} /weather/daily?lat=LAT&long=LONG Request to get daily (5-day) forecast via lat/long
 * @apiName DailyWeatherLatLong
 * @apiGroup Weather
 *
 * @apiParam {String} lat the latitude to request the forecast for
 * @apiParam {String} long the longitude to request the forecast for
 *
 * @apiSuccess {Object} data The daily (5-day) forecast for the given lat/long
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *        "coords": {
 *          "latitude": 47.671346,
 *          "longitude": -122.34166
 *        },
 *        "days": [
 *          {
 *            "date": "2022-05-18",
 *            "temp": 50.9,
 *            "desc": "Rain, Partially cloudy",
 *            "type": "rain"
 *          },
 *          {
 *            "date": "2022-05-19",
 *            "temp": 48.3,
 *            "desc": "Rain, Partially cloudy",
 *            "type": "rain"
 *          },
 *          ...
 *        ]
 *     }
 *
 * @apiError (400: Missing Query Parameters) {String} message "Missing Required Query Parameters"
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.get("/daily", (req, res) => {
  if (!req.query.lat || !req.query.long) {
    res.status(400).send({
      message: "Missing Required Query Parameters",
      error: error,
    });
    return;
  }

  fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${req.query.lat}%2C${req.query.long}/next7days?unitGroup=us&include=days&key=${process.env.WEATHER_API}&contentType=json`,
    {
      method: "GET",
      headers: {},
    }
  )
    .then((result) => result.json())
    .then((result) => {
      const data = new Object();
      data.coords = {
        latitude: result.latitude,
        longitude: result.longitude,
      };

      const days = [];
      for (let i = 0; i < Math.min(result.days.length, 5); i++) {
        const info = new Object();
        const day = result.days[i];
        info.date = day.datetime;
        info.temp = day.temp;
        info.desc = day.conditions;
        info.type = day.icon;
        days.push(info);
      }

      data.days = days;

      res.status(200).send(data);
    })
    .catch((error) => {
      res.status(400).send({
        message: "Error Retrieving Weather Data",
        error: error,
      });
    });
});

/**
 * @api {get} /weather/hourly/:zipcode Request to get hourly (24-hr) forecast via zipcode
 * @apiName HourlyWeatherZipcode
 * @apiGroup Weather
 *
 * @apiParam {String} zipcode the zipcode to request the forecast for
 *
 * @apiSuccess {Object} data The hourly (24-hr) forecast for the given zipcode
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *        "coords": {
 *          "latitude": 47.671346,
 *          "longitude": -122.34166
 *        },
 *        "date": "date": "2022-05-18",
 *        "hours": [
 *          {
 *            "time": "00:00:00",
 *            "temp": 52.4,
 *            "desc": "Partially cloudy",
 *            "type": "partly-cloudy-night"
 *          },
 *          {
 *            "time": "01:00:00",
 *            "temp": 52.2,
 *            "desc": "Overcast",
 *            "type": "cloudy"
 *          },
 *          ...
 *        ]
 *     }
 *
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.get("/hourly/:zipcode", (req, res) => {
  fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${req.params.zipcode}/today?unitGroup=us&include=hours&key=${process.env.WEATHER_API}&contentType=json`,
    {
      method: "GET",
      headers: {},
    }
  )
    .then((result) => result.json())
    .then((result) => {
      const data = new Object();

      if (result.days[0]) {
        data.coords = {
          latitude: result.latitude,
          longitude: result.longitude,
        };

        data.date = result.days[0].datetime;
        const hours = [];
        for (let i = 0; i < Math.min(result.days[0].hours.length, 24); i++) {
          const info = new Object();
          const hour = result.days[0].hours[i];

          info.time = hour.datetime;
          info.temp = hour.temp;
          info.desc = hour.conditions;
          info.type = hour.icon;

          hours.push(info);
        }
        data.hours = hours;
        res.status(200).send(data);
      } else {
        res.status(400).send({
          message: "Error Retrieving Weather Data",
          error: error,
        });
      }
    })
    .catch((error) => {
      res.status(400).send({
        message: "Error Retrieving Weather Data",
        error: error,
      });
    });
});

/**
 * @api {get} /weather/hourly?lat=LAT&long=LONG Request to get hourly (24-hr) forecast via lat/long
 * @apiName HourlyWeatherLatLong
 * @apiGroup Weather
 *
 * @apiParam {String} lat the latitude to request the forecast for
 * @apiParam {String} long the longitude to request the forecast for
 *
 * @apiSuccess {Object} data The hourly (24-hr) forecast for the given lat/long
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *        "coords": {
 *          "latitude": 47.671346,
 *          "longitude": -122.34166
 *        },
 *        "date": "date": "2022-05-18",
 *        "hours": [
 *          {
 *            "time": "00:00:00",
 *            "temp": 52.4,
 *            "desc": "Partially cloudy",
 *            "type": "partly-cloudy-night"
 *          },
 *          {
 *            "time": "01:00:00",
 *            "temp": 52.2,
 *            "desc": "Overcast",
 *            "type": "cloudy"
 *          },
 *          ...
 *        ]
 *     }
 *
 * @apiError (400: Missing Query Parameters) {String} message "Missing Required Query Parameters"
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.get("/hourly", (req, res) => {
  if (!req.query.lat || !req.query.long) {
    res.status(400).send({
      message: "Missing Required Query Parameters",
      error: error,
    });
    return;
  }

  fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${req.query.lat}%2C${req.query.long}/today?unitGroup=us&include=hours&key=${process.env.WEATHER_API}&contentType=json`,
    {
      method: "GET",
      headers: {},
    }
  )
    .then((result) => result.json())
    .then((result) => {
      const data = new Object();

      if (result.days[0]) {
        data.coords = {
          latitude: result.latitude,
          longitude: result.longitude,
        };

        data.date = result.days[0].datetime;
        const hours = [];
        for (let i = 0; i < Math.min(result.days[0].hours.length, 24); i++) {
          const info = new Object();
          const hour = result.days[0].hours[i];

          info.time = hour.datetime;
          info.temp = hour.temp;
          info.desc = hour.conditions;
          info.type = hour.icon;

          hours.push(info);
        }
        data.hours = hours;
        res.status(200).send(data);
      } else {
        res.status(400).send({
          message: "Error Retrieving Weather Data",
          error: error,
        });
      }
    })
    .catch((error) => {
      res.status(400).send({
        message: "Error Retrieving Weather Data",
        error: error,
      });
    });
});

/**
 * @api {get} /weather/current/:zipcode Request to get current forecast via zipcode
 * @apiName CurrentWeatherZipcode
 * @apiGroup Weather
 *
 * @apiParam {String} zipcode the zipcode to request the forecast for
 *
 * @apiSuccess {Object} data The current forecast for the given zipcode
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *        "coords": {
 *          "latitude": 47.671346,
 *          "longitude": -122.34166
 *        },
 *        "current": {
 *            "date": "2022-05-18",
 *            "time": "15:28:02",
 *            "temp": 61,
 *            "desc": "Clear",
 *            "type": "wind"
 *        }
 *     }
 *
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.get("/current/:zipcode", (req, res) => {
  fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${req.params.zipcode}/today?unitGroup=us&include=current&key=${process.env.WEATHER_API}&contentType=json`,
    {
      method: "GET",
      headers: {},
    }
  )
    .then((result) => result.json())
    .then((result) => {
      const data = new Object();

      data.coords = {
        latitude: result.latitude,
        longitude: result.longitude,
      };

      const current = new Object();
      current.date = result.days[0].datetime;
      current.time = result.currentConditions.datetime;
      current.temp = result.currentConditions.temp;
      current.desc = result.currentConditions.conditions;
      current.type = result.currentConditions.icon;

      data.current = current;

      res.status(200).send(data);
    })
    .catch((error) => {
      res.status(400).send({
        message: "Error Retrieving Weather Data",
        error: error,
      });
    });
});

/**
 * @api {get} /weather/current?lat=LAT&long=LONG  Request to get current forecast via lat/long
 * @apiName CurrentWeatherLatLong
 * @apiGroup Weather
 *
 * @apiParam {String} lat the latitude to request the forecast for
 * @apiParam {String} long the longitude to request the forecast for
 *
 * @apiSuccess {Object} data The current forecast for the given lat/long
 *
 *  * @apiSuccessExample {json} Success-Response:
 *     HTTP/1.1 201 OK
 *     {
 *        "coords": {
 *          "latitude": 47.6062,
 *          "longitude": -122.3321
 *        },
 *        "current": {
 *            "date": "2022-05-18",
 *            "time": "15:38:18",
 *            "temp": 57,
 *            "desc": "Clear",
 *            "type": "clear-day"
 *        }
 *     }
 *
 * @apiError (400: Missing Query Parameters) {String} message "Missing Required Query Parameters"
 * @apiError (400: Error Retrieving Weather Data) {String} message "Error Retrieving Weather Data"
 *
 */
router.get("/current", (req, res) => {
  if (!req.query.lat || !req.query.long) {
    res.status(400).send({
      message: "Missing Required Query Parameters",
      error: error,
    });
    return;
  }

  fetch(
    `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${req.query.lat}%2C${req.query.long}/today?unitGroup=us&include=current&key=${process.env.WEATHER_API}&contentType=json`,
    {
      method: "GET",
      headers: {},
    }
  )
    .then((result) => result.json())
    .then((result) => {
      const data = new Object();

      data.coords = {
        latitude: result.latitude,
        longitude: result.longitude,
      };

      const current = new Object();
      current.date = result.days[0].datetime;
      current.time = result.currentConditions.datetime;
      current.temp = result.currentConditions.temp;
      current.desc = result.currentConditions.conditions;
      current.type = result.currentConditions.icon;

      data.current = current;

      res.status(200).send(data);
    })
    .catch((error) => {
      res.status(400).send({
        message: "Error Retrieving Weather Data",
        error: error,
      });
    });
});

module.exports = router;
