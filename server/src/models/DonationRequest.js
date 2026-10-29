const mongoose = require("mongoose");
const historySchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, required: true },
  actor: { type: String, required: true },
  at: { type: Date, default: Date.now }
}, { _id: false });
const requestSchema = new mongoose.Schema({
  listing: { type: mongoose.Schema.Types.ObjectId, ref: "Listing", required: true, index: true },
  organization: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  requestedQuantity: { type: Number, required: true, min: 0.01 },
  note: { type: String, default: "", maxlength: 500 },
  status: { type: String, enum: ["pending","accepted","rejected","cancelled","completed"], default: "pending", index: true },
  pickupCode: { type: String, required: true, select: false },
  history: { type: [historySchema], default: [] }
}, { timestamps: true });
module.exports = mongoose.model("DonationRequest", requestSchema);
