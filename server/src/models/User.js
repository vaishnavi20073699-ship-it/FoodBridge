const mongoose = require("mongoose");
const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ["donor", "recipient", "admin"], required: true },
  organizationName: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, default: "", trim: true, maxlength: 40 },
  area: { type: String, default: "", trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 500 }
}, { timestamps: true });
module.exports = mongoose.model("User", userSchema);
