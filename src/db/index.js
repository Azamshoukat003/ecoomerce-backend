// import mongoose from "mongoose";
// import { DB_NAME } from "../constant.js";

// async function connectDB() {
//     try {
//         const connectionInstance = await mongoose.connect(
//             `${process.env.MONGODB_URL}/${DB_NAME}`
//         );
//         console.log("MOngondb connected", connectionInstance.connection.host);
//     } catch (error) {
//         console.log("Mngodb onection Error", error);
//         process.exit(1);
//     }
// }

// export default connectDB;

import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";

let isConnected = false; // Cache the DB connection

async function connectDB() {
  if (isConnected) {
    return;
  }

  try {
    const connectionInstance = await mongoose.connect(
      `${process.env.MONGODB_URL}/${DB_NAME}`
    );

    isConnected = connectionInstance.connections[0].readyState === 1;
    console.log("✅ MongoDB connected:", connectionInstance.connection.host);
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
    throw error; // Let serverless bubble up the error
  }
}

export default connectDB;
