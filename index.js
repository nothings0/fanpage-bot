const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");

const app = express();
const PAGE_ACCESS_TOKEN =
  "EAANHdu97c9oBO17fZACjMIZAN2FPcZA4D8qZBRbFlfiIhN3a0UYZBwD8jtaNTBLxZCwCTk65K8rLgLxhlcH9CmYc0W2tmsRx0fQVjZCKqqaJZCJMOr6Cln7jQ03k9MC2TStJVbm2ICIBbnUbBq223sHGMSzEQ3Ktbuyk2ZCezamd34KUNerAzXfhzMwZAsBllMh5ZAkgQZDZD"; // Thay bằng token của fanpage

app.use(bodyParser.json());

// Xác thực webhook từ Facebook
app.get("/webhook", (req, res) => {
  const VERIFY_TOKEN = "nothings0"; // Token do bạn tự đặt để xác thực

  const mode = req.query["hub.mode"];
  const token = req.query["hub.verify_token"];
  const challenge = req.query["hub.challenge"];

  if (mode && token) {
    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("Webhook đã được xác thực.");
      res.status(200).send(challenge);
    } else {
      res.sendStatus(403);
    }
  }
});

// Nhận tin nhắn từ người dùng
app.post("/webhook", (req, res) => {
  const body = req.body;

  // Đảm bảo webhook đến từ một trang
  if (body.object === "page") {
    body.entry.forEach((entry) => {
      const event = entry.messaging[0];
      const senderId = event.sender.id;

      // Kiểm tra xem có tin nhắn hay postback không
      if (event.message && event.message.text) {
        handleMessage(senderId, event.message.text);
      } else if (event.postback && event.postback.payload) {
        handlePostback(senderId, event.postback.payload);
      }
    });

    // Phản hồi "EVENT_RECEIVED" để Facebook biết đã xử lý
    res.status(200).send("EVENT_RECEIVED");
  } else {
    // Nếu sự kiện không đến từ một trang
    res.sendStatus(404);
  }
});

// Xử lý tin nhắn từ người dùng
function handleMessage(senderId, receivedMessage) {
  console.log(senderId, receivedMessage);

  if (receivedMessage === "Bắt đầu") {
    sendTextMessage(senderId, "Hello! Bạn muốn nhận voucher không?", [
      {
        type: "postback",
        title: "Lấy Voucher",
        payload: "GET_VOUCHER",
      },
    ]);
  } else {
    sendTextMessage(senderId, 'Vui lòng nhấn nút "Lấy Voucher" để bắt đầu.');
  }
}

// Xử lý postback khi người dùng nhấn nút
function handlePostback(senderId, payload) {
  if (payload === "GET_VOUCHER") {
    sendTextMessage(senderId, "Đã hết voucher, quay lại sau nhé.", [
      {
        type: "web_url",
        title: "Vào nhóm săn deal",
        url: "https://link-to-group.com", // Thay bằng link nhóm săn deal
        webview_height_ratio: "full",
      },
    ]);
  }
}

// Gửi tin nhắn với text và các button
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
    url: "https://graph.facebook.com/v20.0/me/messages",
    method: "POST",
    params: { access_token: PAGE_ACCESS_TOKEN },
    data: messageData,
  })
    .then((response) => {
      console.log("Message sent successfully.");
    })
    .catch((error) => {
      console.error(
        "Unable to send message:",
        error.response ? error.response.data : error.message
      );
    });
}

// Chạy server trên port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
