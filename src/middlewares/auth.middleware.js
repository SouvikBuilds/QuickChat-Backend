import jwt from "jsonwebtoken";
import { User } from "../models/user.model.js";
import { ApiError, asyncHandler } from "../utils/index.js";
import { config } from "../config/config.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
  try {
    const token =
      req.cookies?.accessToken ||
      req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      throw new ApiError(401, "Unauthorised request");
    }

    const decodedToken = jwt.verify(token, config.ACCESS_TOKEN_SECRET);
    const user = await User.findById(decodedToken?._id).select(
      "-password -refreshToken",
    );
    if (!user) {
      throw new ApiError(401, "Invalid access token");
    }
    req.user = user;
    next();
  } catch (error) {
    console.log("Auth Middleware error: ", error);
    throw new ApiError(401, error?.message || "Something went wrong");
  }
});
