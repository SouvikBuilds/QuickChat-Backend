import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/config.js";
import { Server } from "socket.io";
import http from "http";
const app = express();

// server
const server = http.createServer(app);
export const io = new Server(server, {
  cors: {
    origin: config.ORIGIN || "http://localhost:5173",
  },
});

// store online users
export const userSocketMap = {}; // {userId : socketId}

// Socket Connection Handler

io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User Connected ", userId);
  if (userId) {
    userSocketMap[userId] = socket.id;

    // Emit online users to all connected clients

    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    socket.on("disconnect", () => {
      console.log("User Disconnected ", userId);
      if (userId) {
        delete userSocketMap[userId];
        io.emit("getOnlineUsers", Object.keys(userSocketMap));
      }
    });
  }
});

app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(
  cors({
    origin: config.ORIGIN || "http://localhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    optionsSuccessStatus: 204,
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

// routes

import userRouter from "./routes/user.route.js";
import messageRouter from "./routes/message.route.js";

app.use("/api/v1/user", userRouter);
app.use("/api/v1/messages", messageRouter);

export default app;
