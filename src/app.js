import express from "express";
import cookieParser from "cookie-parser"; // for setting cokie in user browser
import cors from "cors";


const app = express();

app.use(
    cors({
        origin: ["http://localhost:5173",'http://localhost:5174','https://ecoomerce-frontend-project.vercel.app',"https://ecommerce-frontend-iota-taupe.vercel.app","https://ecommerce-admin-frontend-one.vercel.app"],
        credentials: true,
    })
);

app.use(express.json({ limit: "16kb" })); //set limit on sending json data
app.use(express.urlencoded({ extended: true, limit: "16kb" })); //set limit on url data
app.use(express.static("public")); // for setting images/faicon in folder
app.use(cookieParser());



//routes import
import userRouter from "./routes/user.routes.js";
import authRouter from "./routes/auth.routes.js";
import { errorHandler } from "./middlewares/errors.middleware.js";
app.get("/", (req, res) => {
  res.send("Backend is running ✅");
});
app.use("/api/v1/users", userRouter);
app.use("/auth", authRouter);

app.use(errorHandler);

export { app };
