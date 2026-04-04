import { config } from "./config/config.js";
import server from "./app.js";
import { connectDB } from "./db/index.js";

connectDB()
  .then(() => {
    server.listen(config.PORT || 8000, () => {
      console.log(
        `Server is running on http://localhost:${config.PORT || 8000}`,
      );
    });
  })
  .catch((error) => {
    console.log("MongoDB Connection failed", error);
    throw error;
  });
