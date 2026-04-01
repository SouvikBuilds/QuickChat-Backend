import mongoose from "mongoose";
import { config } from "../config/config.js";
export const connectDB = async () => {
  try {
    const connectionInstance = await mongoose.connect(
      `${config.MONGO_URI}/${config.DB_NAME}`,
    );
    console.log(
      `DB Connected Successfully, Connection Host: ${connectionInstance.connection.host}`,
    );
  } catch (error) {
    console.log("DB Connection Failed. Error: ", error);
    process.exit(1);
  }
};
