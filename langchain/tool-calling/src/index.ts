import "dotenv/config";
import express from "express";
import { connectDB } from "./config/db.config";
import router from "./routes/support.route";

const app = express();

app.use(express.json());

app.use("/api/support", router);

async function startServer() {
  await connectDB();

  app.listen(process.env.PORT || 5000, () => {
    console.log("Server running");
  });
}

startServer();
