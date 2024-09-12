const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PAGE_ACCESS_TOKEN =
  "EAANHdu97c9oBO1LZACbHy8ejarRMmgdwqz6ZCS4RzWiGx1JNZAc6O0rMH1LQdF2iM4fVf8TF6qjkrK4G0vuWSELFR4D7xkC0FO3CAOcZADBjOuqajZClB4z9xMJ8r8n2bGzm7JB5Dl1v3WsuijWAk77rp0OOYXxHcgwIm7qJMTbdw4il5i6vSfRfuVgpxY47L"; // Token từ Fanpage của bạn

app.use(bodyParser.json());

// Xác thực webhook với Facebook
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "nothings0";

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook verified");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Nhận tin nhắn từ người dùng
app.post("/webhook", (req, res) => {
  const body = req.body;

  if (body.object === "page") {
    body.entry.forEach((entry) => {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      if (event.message && event.message.text) {
        handleMessage(senderId, event.message.text);
      } else if (event.postback && event.postback.payload) {
        handlePostback(senderId, event.postback.payload);
      }
    });
    res.status(200).send("EVENT_RECEIVED");
  } else {
    res.sendStatus(404);
  }
});

function handleMessage(senderId, receivedMessage) {
  if (receivedMessage === "start") {
    sendTextMessage(senderId, "Hello! Bạn muốn nhận voucher không?", [
      {
        type: "postback",
        title: "Lấy Voucher",
        payload: "GET_VOUCHER",
      },
    ]);
  } else {
    sendTextMessage(senderId, 'Vui lòng nhấn nút "Start" để bắt đầu.');
  }
}

function handlePostback(senderId, payload) {
  if (payload === "GET_VOUCHER") {
    sendTextMessage(senderId, `Hello user!`, [
      {
        type: "web_url",
        title: "Tham gia nhóm săn deal",
        url: "https://link-to-group.com",
        webview_height_ratio: "full",
      },
    ]);
  }
}

// Gửi tin nhắn text với các nút tùy chọn
function sendTextMessage(senderId, text, buttons = []) {
  let messageData = {
    recipient: {
      id: senderId,
    },
    message: {
      text: text,
    },
  };

  if (buttons.length > 0) {
    messageData.message = {
      attachment: {
        type: "template",
        payload: {
          template_type: "button",
          text: text,
          buttons: buttons,
        },
      },
    };
  }

  callSendAPI(messageData);
}

// Gọi API của Facebook để gửi tin nhắn
function callSendAPI(messageData) {
  axios({
    url: "https://graph.facebook.com/v16.0/me/messages",
    method: "POST",
    params: { access_token: PAGE_ACCESS_TOKEN },
    data: messageData,
  })
    .then((response) => {
      console.log("Message sent!");
    })
    .catch((error) => {
      console.error("Unable to send message:", error);
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
