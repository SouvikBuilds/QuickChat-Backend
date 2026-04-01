import { v2 as cloudinary } from "cloudinary";
import { config } from "../config/config.js";
import fs from "fs";

cloudinary.config({
  cloud_name: config.CLOUDINARY_CLOUD_NAME,
  api_key: config.CLOUDINARY_API_KEY,
  api_secret: config.CLOUDINARY_CLOUD_SECRET,
});

export const uploadOnCLoudinary = async (localFilePath) => {
  try {
    if (!localFilePath) {
      console.log("No File Path Provided");
      return null;
    }
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    console.log("Cloudinary upload error.", error);
    if (fs.existsSync(localFilePath)) {
      fs.unlinkSync(localFilePath);
      console.log("Local File path deleted after error");
    }
    return null;
  }
};

export const deleteFromCloudinary = async (fileUrl) => {
  try {
    if (!fileUrl) {
      console.log("No File Url Provided");
      return null;
    }

    const parts = fileUrl.split("/");
    const publicId = parts[parts.length - 1].split(".")[0];
    const response = await cloudinary.uploader.destroy(publicId);
    return response;
  } catch (error) {
    console.log("Error deleting file from cloudinary", error);
    return null;
  }
};
