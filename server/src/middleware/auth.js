const jwt = require("jsonwebtoken");
const User = require("../models/User");

async function auth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    const token = header.startsWith("Bearer ") ? header.slice(7) : "";
    if (!token) return res.status(401).json({ error: "Please log in to continue." });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub).select("_id name email role organizationName phone area description");
    if (!user) return res.status(401).json({ error: "Account no longer exists." });
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: "Session expired or invalid. Please log in again." });
  }
}
function allow(...roles) {
  return (req, res, next) => roles.includes(req.user.role)
    ? next()
    : res.status(403).json({ error: "You do not have permission to perform this action." });
}
module.exports = { auth, allow };
