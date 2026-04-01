import { config } from "./config/config.js";
import app from "./app.js";
import { connectDB } from "./db/index.js";

connectDB()
  .then(() => {
    app.listen(config.PORT || 8000, () => {
      console.log(
        `Server is running on http://localhost:${config.PORT || 8000}`,
      );
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection failed", error);
    throw error;
  });
