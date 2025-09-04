import express from "express";
import Post from "../models/Post.js";
import { auth } from "../middleware/auth.js";

const router = express.Router();

// List all posts
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find().populate("author", "username email").sort({ createdAt: -1 });
    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Get one post
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "username email");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Create post
router.post("/", auth, async (req, res) => {
  try {
    const { title, content, category, tags } = req.body;
    const post = await Post.create({
      title,
      content,
      category: category || "General",
      tags: (tags || []).map(t => String(t)),
      author: req.user.id,
    });
    res.status(201).json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Update post (owner only)
router.put("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    const { title, content, category, tags } = req.body;
    post.title = title ?? post.title;
    post.content = content ?? post.content;
    post.category = category ?? post.category;
    if (tags) post.tags = tags.map(t => String(t));
    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

// Delete post (owner only)
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });
    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    await post.deleteOne();
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: "Server error" });
  }
});

export default router;
