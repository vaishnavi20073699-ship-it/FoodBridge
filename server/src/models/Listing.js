const mongoose = require("mongoose");
const listingSchema = new mongoose.Schema({
  donor: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  foodName: { type: String, required: true, trim: true, maxlength: 120 },
  description: { type: String, default: "", maxlength: 1000 },
  category: { type: String, required: true, enum: ["Indian meals","Rice meals","Packed meals","Breakfast","Bakery","Fruit","Other"] },
  quantity: { type: Number, required: true, min: 0.01 },
  unit: { type: String, required: true, enum: ["meals","portions","boxes","packs","tubs","kg","items"] },
  preparedAt: { type: Date, required: true },
  useByGuidance: { type: String, required: true, maxlength: 300 },
  pickupWindowStart: { type: Date, required: true },
  pickupDeadline: { type: Date, required: true },
  location: { type: String, required: true, maxlength: 200 },
  storageInfo: { type: String, required: true, maxlength: 500 },
  allergens: { type: String, default: "Not specified", maxlength: 300 },
  status: { type: String, enum: ["available","reserved","removed"], default: "available", index: true }
}, { timestamps: true });
listingSchema.index({ foodName: "text", description: "text", location: "text" });
module.exports = mongoose.model("Listing", listingSchema);
