import { Message } from "../models/message.model.js";
import {
  ApiError,
  ApiResponse,
  asyncHandler,
  deleteFromCloudinary,
  uploadOnCLoudinary,
} from "../utils/index.js";
import { config } from "../config/config.js";
import { User } from "../models/user.model.js";
import { io, userSocketMap } from "../app.js";

// Get all Users except the logged in user
const getUsersForSidebar = asyncHandler(async (req, res) => {
  try {
    const userId = req.user?._id;
    const filteredUsers = await User.find({ _id: { $ne: userId } }).select(
      "-password -refreshToken",
    );

    // no of unseen messages
    const unSeenMessages = {};

    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unSeenMessages[user._id] = messages.length;
      }
    });

    await Promise.all(promises);

    res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { users: filteredUsers, unSeenMessages },
          "Sidebar user fetched successfully",
        ),
      );
  } catch (error) {
    console.log("Error: ", error);
    throw new ApiError(
      error.stausCode || 500,
      error.message || "Something went wrong while getting sidebar users",
    );
  }
});

// get all messages for selected user

const getMesages = asyncHandler(async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user?._id;

    const messages = await Message.find({
      $or: [
        {
          senderId: myId,
          receiverId: selectedUserId,
        },
        {
          senderId: selectedUserId,
          receiverId: myId,
        },
      ],
    });

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId },
      { seen: true },
    );

    return res
      .status(200)
      .json(
        new ApiResponse(200, messages, "All messages fetched successfully"),
      );
  } catch (error) {
    console.log("Error while getting selected user messages: ", error);
    throw new ApiError(
      error.stausCode || 500,
      error.message || "Error while getting selected user messages",
    );
  }
});

// api to mark message as seen using message id

const markMessageAsSeen = asyncHandler(async (req, res) => {
  try {
    const { id: messageId } = req.params;
    const response = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: { seen: true },
      },
      { new: true, runValidators: true },
    );

    res
      .status(200)
      .json(
        new ApiResponse(200, response, "Message Marked as seen successfully"),
      );
  } catch (error) {
    console.log("Error while marking seen message: ", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Error while marking seen message",
    );
  }
});

const sendMessage = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const imageLocalPath = req.file?.path;

  const receiverId = req.params.id;
  const senderId = req.user?._id;

  if (!text && !imageLocalPath) {
    throw new ApiError(400, "Message cannot be empty");
  }

  let imageUrl = "";

  if (imageLocalPath) {
    const image = await uploadOnCLoudinary(imageLocalPath);

    if (!image) {
      throw new ApiError(400, "Error uploading image");
    }

    imageUrl = image.secure_url;
  }

  const newMessage = await Message.create({
    senderId,
    receiverId,
    text: text?.trim() || "",
    image: imageUrl,
  });

  // Emit the new messages to the receiver's socket
  const receiverSocketId = userSocketMap[receiverId];
  if (receiverId) {
    io.to(receiverSocketId).emit("newMessage", newMessage);
  }

  return res
    .status(201)
    .json(new ApiResponse(201, newMessage, "Message sent successfully"));
});

export { getUsersForSidebar, getMesages, markMessageAsSeen, sendMessage };
