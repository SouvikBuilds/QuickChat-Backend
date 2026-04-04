import express, { Router } from "express";
import {
  getUsersForSidebar,
  getMesages,
  markMessageAsSeen,
  sendMessage,
} from "../controllers/message.controller.js";

import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
const router = Router();

router.route("/users").get(verifyJWT, getUsersForSidebar);
router.route("/:id").get(verifyJWT, getMesages);
router.route("/mark/:id").put(verifyJWT, markMessageAsSeen);
router.route("/send/:id").post(verifyJWT, upload.single("image"), sendMessage);

export default router;
