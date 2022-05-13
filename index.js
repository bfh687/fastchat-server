// http client
const express = require("express");
const app = express();
const https = require('https')
var router= express.Router()
// connection to db
const pool = require("./utilities").pool;

// import middleware (performs intermediate steps before request is received)
const middleware = require("./middleware");

app.use(express.json());
app.use(middleware.jsonErrorInBody);

app.use('/weather',  require('./routes/weather'))

/*
 * Serve the API documentation generated by apidoc as HTML.
 * https://apidocjs.com/
 */
// app.use("/doc", express.static('apidoc'))

app.listen(process.env.PORT || 5000, () => {
    console.log("Server up and running on port: " + (process.env.PORT || 5000));
});
