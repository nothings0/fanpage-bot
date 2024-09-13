const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios");
const dotenv = require("dotenv");
const cron = require("node-cron");
const { getUserProfile } = require("./helper");
dotenv.config();

const app = express();
const PAGE_ACCESS_TOKEN = process.env.PAGE_ACCESS_TOKEN; // Thay bằng token của fanpage
const VERIFY_TOKEN = process.env.VERIFY_TOKEN; // Thay bằng token của fanpage

app.use(bodyParser.json());

// Xác thực webhook từ Facebook
app.get("/webhook", (req, res) => {
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
async function handleMessage(senderId, receivedMessage) {
  console.log(senderId, receivedMessage);

  if (receivedMessage === "Bắt đầu") {
    const name = await getUserProfile();
    sendTextMessage(senderId, `Hello ${name}! Bạn cần hỗ trợ gì không?`, [
      {
        type: "postback",
        title: "Lấy Voucher Shopee",
        payload: "GET_VOUCHER",
      },
    ]);
  } else {
    sendTextMessage(senderId, 'Vui lòng nhấn nút "Lấy Voucher" để bắt đầu.');
  }
}

// Xử lý postback khi người dùng nhấn nút
function handlePostback(senderId, payload) {
  console.log(payload);
  if (payload === "GET_VOUCHER") {
    sendTextMessage(
      senderId,
      "😢 Hết lượt dùng voucher rồi, bạn hãy quay lại vào lúc 0h | 12h để lấy nha",
      [
        {
          type: "web_url",
          title: "Kênh lấy voucher",
          url: "https://t.me/mekoupon", // Thay bằng link nhóm săn deal
          webview_height_ratio: "full",
        },
      ]
    );
  } else if (payload === "GET_STARTED") {
    sendTextMessage(
      senderId,
      "Chào mừng bạn đến với Fanpage của chúng tôi! Bạn muốn nhận voucher không?",
      [
        {
          type: "postback",
          title: "Lấy Voucher",
          payload: "GET_VOUCHER",
        },
      ]
    );
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

app.get("/ping", () => {
  return "pong";
});

cron.schedule("*/12 * * * *", async () => {
  try {
    const response = await axios("https://fanpage-bot.onrender.com/ping");
    const data = await response.data;
    console.log(data);
  } catch (error) {
    console.error("Lỗi khi gọi API:", error);
  }
});

// Chạy server trên port 3000
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server đang chạy trên cổng ${PORT}`);
});
