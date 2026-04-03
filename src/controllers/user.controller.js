import { User } from "../models/user.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  deleteFromCloudinary,
  uploadOnCLoudinary,
} from "../utils/index.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

const generateAccessRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) {
      throw new ApiError(404, "User not exists");
    }

    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save();

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message ||
        "Something went wrong while generating access and refreshTokens",
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  try {
    const { email, fullName, password, bio } = req.body;
    if (
      !email ||
      !fullName ||
      !password ||
      !bio ||
      email.trim().length === 0 ||
      fullName.trim().length === 0 ||
      password.trim().length === 0 ||
      bio.trim().length === 0
    ) {
      throw new ApiError(400, "Required data is missing");
    }
    const existedUser = await User.findOne({ email });
    if (existedUser) {
      throw new ApiError(400, "User with this email id already exists.");
    }
    const newUser = await User.create({
      email,
      fullName,
      password,
      bio,
    });

    const createdUser = await User.findById(newUser?._id).select(
      "-password -refreshToken",
    );
    if (!createdUser) {
      throw new ApiError(500, "Something went wrong while creating user");
    }

    return res
      .status(201)
      .json(
        new ApiResponse(201, createdUser, "New User registered successfully."),
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Internal Server Error",
    );
  }
});

const loginUser = asyncHandler(async (req, res) => {
  try {
    // console.log("Login Request");
    const { email, password } = req.body;
    if (
      !email ||
      !password ||
      email.trim().length === 0 ||
      password.trim().length === 0
    ) {
      // console.log("Required data missing");
      throw new ApiError(400, "Required data is missing");
    }
    const user = await User.findOne({ email });
    if (!user) {
      // console.log("User with this email not exist");
      throw new ApiError(404, "User with this email not exist");
    }

    const passwordCorrect = await user.isPasswordCorrect(password);
    if (!passwordCorrect) {
      // console.log("Password not correct");
      throw new ApiError(401, "Incorrect credential");
    }
    const { accessToken, refreshToken } = await generateAccessRefreshTokens(
      user._id,
    );
    const loggedInUser = await User.findById(user._id).select(
      "-password -refreshToken",
    );
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    // console.log("Login Successfull");
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(new ApiResponse(200, loggedInUser, "User Login Successfull"));
  } catch (error) {
    // console.log("Error: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong",
    );
  }
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(400, "Refresh token is required");
  }
  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      config.REFRESH_TOKEN_SECRET,
    );
    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.refreshToken !== incomingRefreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
    };
    const { accessToken, refreshToken } = await generateAccessRefreshTokens(
      user._id,
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken,
          },
          "Accesstoken refreshed successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Refreshing AccessToken Error",
    );
  }
});

const logOutUser = asyncHandler(async (req, res) => {
  try {
    // console.log("Logout Request");

    await User.findByIdAndUpdate(
      req.user?._id,
      {
        $unset: { refreshToken: 1 },
      },
      { new: true },
    );

    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
    };

    return res
      .status(200)
      .clearCookie("accessToken", options)
      .clearCookie("refreshToken", options)
      .json(new ApiResponse(200, {}, "User Logged out successfully"));
  } catch (error) {
    // console.log("Error: ", error);
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong while loggingout",
    );
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  try {
    return res
      .status(200)
      .json(
        new ApiResponse(200, req.user, "Current User Fetched Successfully"),
      );
  } catch (error) {
    throw new ApiError(
      error?.statusCode || 500,
      error?.message || "Something went wrong while getting current user",
    );
  }
});

const editProfile = asyncHandler(async (req, res) => {
  try {
    // console.log("Edit Profile Request");
    const { fullName, bio } = req.body;
    if (
      !fullName ||
      !bio ||
      fullName.trim().length === 0 ||
      bio.trim().length === 0
    ) {
      // console.log("Required Data is missing");
      throw new ApiError(400, "Required data is missing");
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: {
          fullName: fullName.trim(),
          bio: bio.trim(),
        },
      },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");

    if (!updatedUser) {
      // console.log("User doesn't exist");
      throw new ApiError(404, "User doesn't exist");
    }

    console.log("User Profile Updated Successfully");
    return res
      .status(200)
      .json(
        new ApiResponse(200, updatedUser, "User Profile Updated Successfully"),
      );
  } catch (error) {
    // console.log("Error: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Something went wrong while editing profile",
    );
  }
});

const uploadProfilePicture = asyncHandler(async (req, res) => {
  try {
    const user = await User.findById(req.user?._id);
    if (!user) {
      throw new ApiError(404, "User not found");
    }
    if (user.profilePic) {
      await deleteFromCloudinary(user.profilePic);
    }
    const newProfilePicturePath = req.file?.path;
    if (!newProfilePicturePath) {
      throw new ApiError(400, "Profile Picture not provided");
    }
    const uploadedProfilePic = await uploadOnCLoudinary(newProfilePicturePath);
    if (!uploadedProfilePic) {
      throw new ApiError(400, "Error uploading Profile Picture");
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user?._id,
      {
        $set: { profilePic: uploadedProfilePic.secure_url },
      },
      { new: true, runValidators: true },
    ).select("-password -refreshToken");

    if (!updatedUser) {
      throw new ApiError(404, "User doesn't exist");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          updatedUser,
          "Profile Picture uploaded successfully",
        ),
      );
  } catch (error) {
    throw new ApiError(
      error.statusCode || 500,
      error?.message || "Something went wrong while uploading profile pic",
    );
  }
});

export {
  registerUser,
  generateAccessRefreshTokens,
  loginUser,
  refreshAccessToken,
  logOutUser,
  getCurrentUser,
  editProfile,
  uploadProfilePicture,
};
