const Pushy = require("pushy");
const pushyAPI = new Pushy(process.env.PUSHY_API);

function sendMessageToIndividual(token, message) {
  var data = {
    type: "msg",
    chatid: message.chatid,
    message: message,
  };

  pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
    if (err) return console.log("fatal error", err);
    console.log("push sent successfully! (id: " + id + ")");
  });
}

function sendIncomingContact(token, sender, contact) {
  var data = {
    type: "in-con",
    sender: sender,
    contactid: contact.memberid,
    contact: contact,
  };

  pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
    if (err) return console.log("fatal error", err);
    console.log("push sent successfully! (id: " + id + ")");
  });
}

function sendOutGoingContact(token, sender, contact) {
  var data = {
    type: "out-con",
    sender: sender,
    contactid: contact.memberid,
    contact: contact,
  };

  pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
    if (err) return console.log("fatal error", err);
    console.log("push sent successfully! (id: " + id + ")");
  });
}

function sendUpdateContactList(token, contact) {
  var data = {
    type: "update-con",
    contactid: contact.memberid,
    contact: contact,
  };

  pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
    if (err) return console.log("fatal error", err);
    console.log("push sent successfully! (id: " + id + ")");
  });
}

function sendDeleteContactList(token, contact) {
  var data = {
    type: "delete-con",
    contactid: contact.memberid,
    contact: contact,
  };

  pushyAPI.sendPushNotification(data, token, {}, function (err, id) {
    if (err) return console.log("fatal error", err);
    console.log("push sent successfully! (id: " + id + ")");
  });
}

module.exports = {
  sendMessageToIndividual,
  sendOutGoingContact,
  sendIncomingContact,
  sendUpdateContactList,
  sendDeleteContactList
};
