const { Router } = require("express");
const User = require("../models/user");
const { TokenExpiredError } = require("jsonwebtoken");

const path = require("path");
const multer = require("multer");
const { createTokenForUser } = require("../services/authenication");

const router = Router();

router.get("/signin", (req, res) => {
  res.render("signin");
});

router.get("/signup", (req, res) => {
  res.render("signup");
});

router.post("/signin", async (req, res) => {
  const { email, password } = req.body;
  try {
    const token = await User.matchPasswordAndGenerateToken(email, password);
    return res.cookie("token", token).redirect("/");
  } catch (error) {
    return res.render("signin", {
      error: "Invalid Email or Password",
    });
  }
});

router.post("/signup", async (req, res) => {
  const { fullName, email, password } = req.body;
  await User.create({ fullName, email, password });
  return res.redirect("/");
});

router.get("/logout", (req, res) => {
  res.clearCookie("token").redirect("/");
});

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/profiles/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });

router.post(
  "/upload-profile-image",
  upload.single("profileImage"),
  async (req, res) => {
    try {
      const user = req.user;
      if (!user) {
        return res.status(401).send("Unauthorized");
      }

      const updatedUser = await User.findByIdAndUpdate(
        user._id,
        { profileImageURL: `/profiles/${req.file.filename}` },
        { new: true }
      );

      const token = createTokenForUser(updatedUser);

      return res.cookie("token", token).redirect("/");
    } catch (err) {
      return res
        .status(500)
        .send("An error occurred while updating the profile image.");
    }
  }
);
module.exports = router;
