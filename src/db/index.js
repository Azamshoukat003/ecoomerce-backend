import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

async function connectDB() {
    try {
        const connectionInstance = await mongoose.connect(
            `${process.env.MONGODB_URL}/${DB_NAME}`
        );
        console.log("MOngondb connected", connectionInstance.connection.host);
    } catch (error) {
        console.log("Mngodb onection Error", error);
        process.exit(1);
    }
}

export default connectDB;
