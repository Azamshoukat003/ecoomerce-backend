import dotenv from "dotenv";
import connectDB from "./db/index.js";
import serverless from "serverless-http";
import { app } from "./app.js";

dotenv.config({
    path: "./env",
});

connectDB()
    .then(() => {
        // app.listen(process.env.PORT || 8000, () => {
        //     console.log(`server is running at port ${process.env.PORT}`);
        // });
    })
    .catch((err) => {
        console.log("mogo db connection Failed!!!", err);
    });

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
