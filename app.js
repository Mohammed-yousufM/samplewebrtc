// const express = require("express");
// const app = express();
// let http = require("http").Server(app);
// let io = require("socket.io")(http);

// app.use(express.static("public"));

// http.listen(port, () => {
//   console.log("Listening on", port);
// });

// io.on("connection", (socket) => {
//   console.log("a user connected");
//   socket.on("create or join", (room) => {
//     console.log("create or join to room", room);
//     room = room.trim();
//     const myRoom = io.sockets.adapter.rooms.get(room) || { size: 0 };
//     const numClients = myRoom.size;
//     console.log(room, " has ", numClients, " clients", myRoom);

//     if (numClients === 0) {
//       socket.join(room);
//       socket.emit("created", room);
//       console.log("created a new ", room);
//     } else if (numClients === 1) {
//       socket.join(room);
//       socket.emit("joined", room);
//       console.log("joined a ", room);
//     } else {
//       socket.emit("full", room);
//       console.log("room is full");
//     }
//   });

//   socket.on("ready", (room) => {
//     socket.broadcast.to(room).emit("ready");
//   });

//   socket.on("candidate", (event) => {
//     socket.broadcast.to(event.room).emit("candidate", event);
//   });

//   socket.on("offer", (event) => {
//     socket.broadcast.to(event.room).emit("offer", event.sdp);
//   });

//   socket.on("answer", (event) => {
//     socket.broadcast.to(event.room).emit("answer", event.sdp);
//   });
// });
const config = require("./config");
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const pino = require("express-pino-logger")();
const { videoToken } = require("./tokens");

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(pino);
app.use(cors({ origin: true }));

const port = process.env.PORT || 3001;

app.listen(port, () => console.log("Express server is running on ", port));

const sendTokenResponse = (token, res) => {
  res.set("Content-Type", "application/json");
  res.send(
    JSON.stringify({
      token: token.toJwt(),
    })
  );
};

app.get("/", (req, res) => {
  res.send("Hello, This is for Together Project");
});

app.get("/api/greeting", (req, res) => {
  const name = req.query.name || "World";
  res.setHeader("Content-Type", "application/json");
  res.send(JSON.stringify({ greeting: `Hello ${name}!` }));
});

app.get("/video/token", (req, res) => {
  const identity = req.query.identity;
  const room = req.query.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});

//actual api firing
app.post("/video", (req, res) => {
  const identity = req.body.identity;
  const room = req.body.room;
  const token = videoToken(identity, room, config);
  sendTokenResponse(token, res);
});
