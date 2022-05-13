const Pushy = require("pushy");
const pushyAPI = new Pushy(process.env.PUSHY_API_KEY);

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

module.exports = {
    sendMessageToIndividual,
};
