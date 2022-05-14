// http client
const express = require("express");
const app = express();

// connection to db
const pool = require("./utilities").pool;

// import middleware (performs intermediate steps before request is received)
const middleware = require("./middleware");

app.use(express.json());
app.use(middleware.jsonErrorInBody);

// routes
app.use("/messages", middleware.checkToken, require("./routes/messages.js"));
app.use("/chats", middleware.checkToken, require("./routes/chats.js"));
app.use("/auth", middleware.checkToken, require("./routes/pushyreg.js"));

// app.use("/doc", express.static('apidoc'))

app.listen(process.env.PORT || 5000, () => {
  console.log("Server up and running on port: " + (process.env.PORT || 5000));
});
