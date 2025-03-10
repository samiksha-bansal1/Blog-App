const { Router } = require("express");
const router = Router();
const path = require("path");
const multer = require("multer");

const Blog = require("../models/blog");
const Comment = require("../models/comment");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.resolve(`./public/uploads/`));
  },
  filename: function (req, file, cb) {
    const fileName = `${Date.now()}-${file.originalname}`;
    cb(null, fileName);
  },
});

const upload = multer({ storage: storage });
router.get("/add-new", (req, res) => {
  return res.render("addBlog", {
    user: req.user,
  });
});

router.get("/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  const comments = await Comment.find({ blogId: req.params.id }).populate(
    "createdBy"
  );
  console.log(comments);
  return res.render("blog", {
    user: req.user,
    blog,
    comments,
  });
});

router.post("/", upload.single("coverImage"), async (req, res) => {
  const { title, body } = req.body;
  const blog = await Blog.create({
    body,
    title,
    createdBy: req.user._id,
    coverImageURL: `/uploads/${req.file.filename}`,
  });
  return res.redirect(`/blog/${blog._id}`);
});

router.post("/comment/:blogId", async (req, res) => {
  await Comment.create({
    content: req.body.content,
    blogId: req.params.blogId,
    createdBy: req.user._id,
  });
  return res.redirect(`/blog/${req.params.blogId}`);
});

router.get("/edit/:id", async (req, res) => {
  const blog = await Blog.findById(req.params.id).populate("createdBy");
  return res.render("editBlog", {
    user: req.user,
    blog,
  });
});

router.post("/edit/:id", upload.single("coverImage"), async (req, res) => {
  const { id } = req.params;
  const { title, body } = req.body;

  const coverImageURL = req.file
    ? `/uploads/${req.file.filename}`
    : req.body.coverImageURL;

  try {
    const blog = await Blog.findByIdAndUpdate(
      id,
      {
        title,
        body,
        coverImageURL,
      },
      { new: true }
    );
    return res.redirect(`/blog/${id}`);
  } catch (error) {
    console.error("Error updating blog:", error);
    return res.redirect(`/blog/edit/${id}`);
  }
});

module.exports = router;
