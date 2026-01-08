import app from "./app.js";
import { connectDB } from "./config/db.js";
import env from "./config/env.js";

const PORT = env.PORT || 5000;

// Connect to MongoDB
connectDB();

app.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
});
