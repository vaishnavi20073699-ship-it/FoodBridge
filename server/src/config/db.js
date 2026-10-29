const mongoose = require("mongoose");

async function connectDB() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI is missing. Copy server/.env.example to server/.env and configure Atlas.");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB Atlas");
}
module.exports = connectDB;
