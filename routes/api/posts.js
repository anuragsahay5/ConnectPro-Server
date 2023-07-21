// Import required modules and packages
const express = require("express"); // Express framework for creating routes
const router = express.Router(); // Create a router object to define routes
const { check, validationResult } = require("express-validator"); // Validation middleware for request validation
const auth = require("../../middleware/auth"); // Custom authentication middleware

const PostModel = require("../../models/Post"); // Import the Post model for interacting with posts
const UserModel = require("../../models/User"); // Import the User model for interacting with users

// Adding a new post
router.post(
  "/",
  auth, // Authenticate the user before adding a post
  check("text", "Text is required").notEmpty(), // Validate that the post text is not empty
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, return them to the client
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await UserModel.findById(req.user.id).select("-password"); // Retrieve user details from the database

      const newPost = new PostModel({
        text: req.body.text, // Get the post text from the request body
        name: user.name, // Set the post author's name
        avatar: user.avatar, // Set the post author's avatar
        user: req.user.id, // Set the user ID of the post author
      });

      const post = await newPost.save(); // Save the new post to the database

      res.json(post); // Return the newly created post to the client
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Get all posts sorted by date in descending order
router.get("/", auth, async (req, res) => {
  try {
    const posts = await PostModel.find().sort({ date: -1 }); // Find all posts and sort them by date in descending order
    res.json(posts); // Return the posts to the client
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Get a post by postID
router.get("/:id", auth, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id); // Find a post by its ID

    if (!post) {
      // If the post does not exist, return a 404 Not Found status and a message
      return res.status(404).json({ msg: "Post not found" });
    }

    res.json(post); // Return the post to the client
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Delete a post by postID
router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id); // Find the post to be deleted

    if (!post) {
      // If the post does not exist, return a 404 Not Found status and a message
      return res.status(404).json({ msg: "Post not found" });
    }

    // Check if the user is authorized to delete the post
    if (post.user.toString() !== req.user.id) {
      // If the user is not authorized, return a 401 Unauthorized status and a message
      return res.status(401).json({ msg: "User not authorized" });
    }

    await PostModel.findByIdAndRemove(req.params.id); // Delete the post from the database

    res.json({ msg: "Post removed" }); // Return a success message to the client
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
});

// Add a like on a post with postID
router.put("/like/:id", auth, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id); // Find the post to be liked

    // Check if the post has already been liked by the user
    if (post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post already liked" });
    }

    post.likes.push({ user: req.user.id }); // Add the user's like to the post

    await post.save(); // Save the updated post

    return res.json(post.likes); // Return the updated likes to the client
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Remove a like from a post with postID
router.put("/unlike/:id", auth, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id); // Find the post to remove the like from

    // Check if the post has been liked by the user
    if (!post.likes.some((like) => like.user.toString() === req.user.id)) {
      return res.status(400).json({ msg: "Post has not yet been liked" });
    }

    // Remove the like from the post
    post.likes = post.likes.filter(
      ({ user }) => user.toString() !== req.user.id
    );

    await post.save(); // Save the updated post

    return res.json(post.likes); // Return the updated likes to the client
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Add a comment on a post with postID
router.post(
  "/comment/:id",
  auth, // Authenticate the user before adding a comment
  check("text", "Text is required").notEmpty(), // Validate that the comment text is not empty
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // If there are validation errors, return them to the client
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await UserModel.findById(req.user.id).select("-password"); // Retrieve user details from the database
      const post = await PostModel.findById(req.params.id); // Find the post to add the comment to

      const newComment = {
        text: req.body.text, // Get the comment text from the request body
        name: user.name, // Set the comment author's name
        avatar: user.avatar, // Set the comment author's avatar
        user: req.user.id, // Set the user ID of the comment author
      };

      post.comments.unshift(newComment); // Add the new comment to the beginning of the comments array

      await post.save(); // Save the updated post

      res.json(post.comments); // Return the updated comments to the client
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Delete a comment from a post with postID and commentID
router.delete("/comment/:id/:comment_id", auth, async (req, res) => {
  try {
    const post = await PostModel.findById(req.params.id); // Find the post to remove the comment from

    // Get the comment
    const comment = post.comments.find(
      (comment) => comment.id === req.params.comment_id
    );

    // Check if the comment exists
    if (!comment) {
      // If the comment does not exist, return a 404 Not Found status and a message
      return res.status(404).json({ msg: "Comment does not exist" });
    }

    // Check if the user is authorized to delete the comment
    if (comment.user.toString() !== req.user.id) {
      // If the user is not authorized, return a 401 Unauthorized status and a message
      return res.status(401).json({ msg: "User not authorized" });
    }

    // Remove the comment from the post
    post.comments = post.comments.filter(
      ({ id }) => id !== req.params.comment_id
    );

    await post.save(); // Save the updated post

    return res.json(post.comments); // Return the updated comments to the client
  } catch (err) {
    console.error(err.message);
    return res.status(500).send("Server Error");
  }
});

module.exports = router; // Export the router with all defined routes
