const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const { auth } = require("../middleware/auth");

function tokenFor(user) {
  return jwt.sign({ sub: user._id.toString(), role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "1d" });
}
function publicUser(user) {
  return { id: user._id, name: user.name, email: user.email, role: user.role, organizationName: user.organizationName, phone: user.phone, area: user.area, description: user.description };
}
router.post("/register", async (req, res, next) => {
  try {
    let { name, email, password, role, organizationName, phone, area, description } = req.body;
    name = String(name || "").trim(); email = String(email || "").trim().toLowerCase();
    if (!name || !email || !password || !organizationName) return res.status(400).json({ error: "Name, email, password and organization name are required." });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: "Enter a valid email address." });
    if (String(password).length < 10) return res.status(400).json({ error: "Password must contain at least 10 characters." });
    if (!["donor","recipient"].includes(role)) return res.status(400).json({ error: "Choose donor or recipient. Admin accounts cannot be registered publicly." });
    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash, role, organizationName: String(organizationName).trim(), phone: String(phone||"").trim(), area: String(area||"").trim(), description: String(description||"").trim() });
    res.status(201).json({ token: tokenFor(user), user: publicUser(user) });
  } catch (e) {
    if (e.code === 11000) return res.status(409).json({ error: "An account with this email already exists." });
    next(e);
  }
});
router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const user = await User.findOne({ email }).select("+passwordHash");
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ error: "Email or password is incorrect." });
    res.json({ token: tokenFor(user), user: publicUser(user) });
  } catch (e) { next(e); }
});
router.get("/me", auth, (req,res)=>res.json({ user: publicUser(req.user) }));
router.patch("/me", auth, async (req,res,next) => {
  try {
    const { name, organizationName, phone, area, description } = req.body;
    if (!name || !organizationName) return res.status(400).json({ error: "Contact name and organization name are required." });
    const user = await User.findByIdAndUpdate(req.user._id, {
      name: String(name).trim(),
      organizationName: String(organizationName).trim(),
      phone: String(phone || "").trim(),
      area: String(area || "").trim(),
      description: String(description || "").trim()
    }, { new: true, runValidators: true });
    res.json({ user: publicUser(user) });
  } catch (e) { next(e); }
});
module.exports = router;
