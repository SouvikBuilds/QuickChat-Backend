import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { config } from "./config/config.js";
const app = express();
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: true, limit: "4mb" }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(
  cors({
    origin: config.ORIGIN || "http://locqalhost:5173",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    optionsSuccessStatus: 204,
  }),
);

app.get("/", (req, res) => {
  res.json({ message: "Hello World" });
});

export default app;
