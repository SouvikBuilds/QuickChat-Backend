import { Router } from "express";
import {
  registerUser,
  loginUser,
  refreshAccessToken,
  logOutUser,
  getCurrentUser,
  editProfile,
  uploadProfilePicture,
} from "../controllers/user.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.post("/signup", registerUser);
router.post("/login", loginUser);
router.post("/refresh-token", refreshAccessToken);
router.post("/logout", verifyJWT, logOutUser);
router.get("/current-user", verifyJWT, getCurrentUser);
router.patch("/edit-profile", verifyJWT, editProfile);
router.patch(
  "/upload-profile-picture",
  verifyJWT,
  upload.single("profilePic"),
  uploadProfilePicture,
);

export default router;
