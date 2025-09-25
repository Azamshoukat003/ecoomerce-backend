import express from "express";
import cookieParser from "cookie-parser"; // for setting cokie in user browser
import cors from "cors";
import connectDB from "./db/index.js";


const app = express();

app.use(
    cors({
        origin: process.env.CORS_ORIGIN,
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" })); //set limit on sending json data
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //set limit on url data
app.use(express.static("public")); // for setting images/faicon in folder
app.use(cookieParser());
app.use(async (req, res, next) => {
  try {
    await connectDB(); // ensures DB is connected
    next();
  } catch (err) {
    next(err);
  }
});
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});

//routes import
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/errors.middleware.js";
app.use("/api/v1/users", userRouter);
app.use("/auth", authRouter);

app.use(errorHandler);

export { app };
