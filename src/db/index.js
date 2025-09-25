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

let isConnected = false;

async function connectDB() {
  if (isConnected) return;

  const conn = await mongoose.connect(process.env.MONGODB_URL, {
    dbName: process.env.DB_NAME,
  });

  isConnected = true;
  console.log("✅ MongoDB connected:", conn.connection.host);
}

export default connectDB;

