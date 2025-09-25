// import dotenv from "dotenv";
// import connectDB from "./db/index.js";
// import serverless from "serverless-http";
// import { app } from "./app.js";

// dotenv.config({
//     path: "./env",
// });

// connectDB()
//     .then(() => {
//         // app.listen(process.env.PORT || 8000, () => {
//         //     console.log(`server is running at port ${process.env.PORT}`);
//         // });
//     })
//     .catch((err) => {
//         console.log("mogo db connection Failed!!!", err);
//     });

// export default serverless(app);


import dotenv from "dotenv";
import serverless from "serverless-http";
import { app } from "./app.js";
import connectDB from "./db/index.js";

dotenv.config({
  path: "./env",
});

// ✅ Ensure DB connects when a request comes in
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (err) {
    console.error("❌ DB connection failed:", err.message);
    res.status(500).json({ error: "Database connection failed" });
  }
});

// ❌ Do not use app.listen in Vercel
export default serverless(app);

// const app = express()(async () => {
//     try {
//         await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
//         app.on("error", (error) => {
//             console.log("error in back");
//             throw error;
//         });

//         app.listen(process.env.PORT, () => {
//             console.log("app is listening ib prt", process.env.PORT);
//         });
//     } catch (error) {
//         console.error("ERROR", error);
//         throw error;
//     }
// })();
