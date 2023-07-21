// Import required modules and libraries
const express = require("express"); // Express framework for handling HTTP requests
const axios = require("axios"); // Axios for making HTTP requests
const dotenv = require("dotenv"); // dotenv for managing environment variables
const { check, validationResult } = require("express-validator"); // Express-validator for request validation
dotenv.config();

// Create an instance of Express router
const router = express.Router();

// Import middleware and models
const authMiddleware = require("../../middleware/auth"); // Authentication middleware
const ProfileModel = require("../../models/Profile"); // Profile data model
const UserModel = require("../../models/User"); // User data model
const PostModel = require("../../models/Post"); // Post data model

// Route to get the complete profile of the authenticated user
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const userProfile = await ProfileModel.findOne({
      user: req.user.id, // Find the profile associated with the authenticated user
    });

    if (!userProfile) {
      return res.status(400).json({ msg: "There is no profile for this user" });
    }

    res.json(userProfile); // Send the profile data in the response
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Route to create or update the profile of the authenticated user
router.post(
  "/",
  authMiddleware,
  check("status", "Status is required").notEmpty(), // Validate the "status" field in the request body
  check("skills", "Skills is required").notEmpty(), // Validate the "skills" field in the request body
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // Send validation errors in the response
    }

    // Destructure the request body to get the relevant fields
    const { website, skills, youtube, twitter, instagram, linkedin, facebook } =
      req.body;

    // Build the profile fields object
    const profileFields = {
      user: req.user.id, // Associate the profile with the authenticated user
      website: website,
      skills: skills.split(","), // Split skills into an array
    };

    // Build the social handles object
    const socialHandles = { youtube, twitter, instagram, linkedin, facebook };

    // Remove any empty or undefined social handles
    for (const [key, value] of Object.entries(socialHandles)) {
      if (value && value.length > 0) socialHandles[key] = value;
    }

    // Add the social handles to the profileFields object
    profileFields.social = socialHandles;

    try {
      // Add or update the profile in the database
      let userProfile = await ProfileModel.findOneAndUpdate(
        { user: req.user.id }, // Search for the profile associated with the authenticated user
        { $set: profileFields }, // Set the updated profile fields
        { new: true, upsert: true, setDefaultsOnInsert: true } // Options: create if not found (upsert), return the updated document (new), set default values if inserting (setDefaultsOnInsert)
      );
      return res.json(userProfile); // Send the updated profile data in the response
    } catch (err) {
      console.error(err.message);
      return res.status(500).send("Server Error");
    }
  }
);

// Route to get all profiles
router.get("/", async (req, res) => {
  try {
    const profiles = await ProfileModel.find(); // Find all profiles in the database
    res.json(profiles); // Send the profiles data in the response
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Route to get a profile by user ID
router.get("/user/:user_id", async ({ params: { user_id } }, res) => {
  try {
    const userProfile = await ProfileModel.findOne({
      user: user_id, // Find the profile associated with the specified user ID
    });

    if (!userProfile) return res.status(400).json({ msg: "Profile not found" });

    return res.json(userProfile); // Send the profile data in the response
  } catch (err) {
    console.error(err.message);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Route to delete the profile, user & posts of the authenticated user
router.delete("/", authMiddleware, async (req, res) => {
  try {
    await PostModel.deleteMany({ user: req.user.id }); // Delete all posts made by the user
    await ProfileModel.findOneAndRemove({ user: req.user.id }); // Delete the profile
    await UserModel.findOneAndRemove({ _id: req.user.id }); // Delete user data
    res.json({ msg: "User deleted" }); // Send a success message in the response
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
});

// Route to add profile experience for the authenticated user
router.put(
  "/experience",
  authMiddleware,
  check("title", "Title is required").notEmpty(), // Validate the "title" field in the request body
  check("company", "Company is required").notEmpty(), // Validate the "company" field in the request body
  check("from", "From date is required").notEmpty(), // Validate the "from" field in the request body
  check("to", "From date is required").notEmpty(), // Validate the "to" field in the request body
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // Send validation errors in the response
    }

    try {
      const userProfile = await ProfileModel.findOne({ user: req.user.id }); // Find the profile associated with the authenticated user

      userProfile.experience.unshift(req.body); // Add the new experience to the beginning of the experience array

      await userProfile.save(); // Save the updated profile

      res.json(userProfile); // Send the updated profile data in the response
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Route to delete experience from the profile of the authenticated user
router.delete("/experience/:exp_id", authMiddleware, async (req, res) => {
  try {
    const userProfile = await ProfileModel.findOne({ user: req.user.id }); // Find the profile associated with the authenticated user

    userProfile.experience = userProfile.experience.filter(
      (exp) => exp._id.toString() !== req.params.exp_id
    ); // Filter out the experience to be deleted from the experience array

    await userProfile.save(); // Save the updated profile
    return res.status(200).json(userProfile); // Send the updated profile data in the response
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Route to add profile education for the authenticated user
router.put(
  "/education",
  authMiddleware,
  check("school", "School is required").notEmpty(), // Validate the "school" field in the request body
  check("degree", "Degree is required").notEmpty(), // Validate the "degree" field in the request body
  check("fieldofstudy", "Field of study is required").notEmpty(), // Validate the "fieldofstudy" field in the request body
  check("from", "From date is required").notEmpty(), // Validate the "from" field in the request body
  check("to", "From date is required").notEmpty(), // Validate the "to" field in the request body
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() }); // Send validation errors in the response
    }

    try {
      const userProfile = await ProfileModel.findOne({ user: req.user.id }); // Find the profile associated with the authenticated user

      userProfile.education.unshift(req.body); // Add the new education to the beginning of the education array

      await userProfile.save(); // Save the updated profile

      res.json(userProfile); // Send the updated profile data in the response
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server Error");
    }
  }
);

// Route to delete education from the profile of the authenticated user
router.delete("/education/:edu_id", authMiddleware, async (req, res) => {
  try {
    const userProfile = await ProfileModel.findOne({ user: req.user.id }); // Find the profile associated with the authenticated user

    userProfile.education = userProfile.education.filter(
      (edu) => edu._id.toString() !== req.params.edu_id
    ); // Filter out the education to be deleted from the education array

    await userProfile.save(); // Save the updated profile
    return res.status(200).json(userProfile); // Send the updated profile data in the response
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "Server error" });
  }
});

// Export the router to use in the main application
module.exports = router;
