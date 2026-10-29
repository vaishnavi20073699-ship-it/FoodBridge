const mongoose = require("mongoose");
const reportSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", default: null },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  reason: { type: String, required: true, maxlength: 160 },
  details: { type: String, default: "", maxlength: 1000 },
  status: { type: String, enum: ["open","resolved"], default: "open" }
}, { timestamps: true });
module.exports = mongoose.model("Report", reportSchema);
