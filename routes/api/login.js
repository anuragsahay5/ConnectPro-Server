// Import required modules
const express = require("express"); // Express.js framework
const bcrypt = require("bcryptjs"); // Library for hashing passwords
const jwt = require("jsonwebtoken"); // JSON Web Token for user authentication
const dotenv = require("dotenv"); // Load environment variables from a .env file
const { check, validationResult } = require("express-validator"); // Validation middleware
const authMiddleware = require("../../middleware/auth"); // Custom authentication middleware
const router = express.Router(); // Create a router instance
dotenv.config(); // Load environment variables from .env file

const User = require("../../models/User"); // User model (assuming it represents a MongoDB schema)

// Get user information
router.get("/", authMiddleware, async (req, res) => {
  try {
    const authenticatedUser = await User.findById(req.user.id).select("-password"); // Retrieve user information, excluding the password
    res.json(authenticatedUser); // Respond with the user data
  } catch (err) {
    console.error(err.message); // Log the error message
    res.status(500).send("Server Error"); // Respond with an internal server error
  }
});

// Login request
router.post(
  "/",
  check("email", "Please include a valid email").isEmail(), // Validate the email field
  check("password", "Password is required").notEmpty(), // Validate the password field
  async (req, res) => {
    const validationErrors = validationResult(req); // Perform validation and get the result
    if (!validationErrors.isEmpty()) { // If there are validation errors
      return res.status(400).json({ errors: validationErrors.array() }); // Respond with the validation errors
    }

    const { email, password } = req.body; // Extract email and password from the request body

    try {
      let user = await User.findOne({ email }); // Find the user by email in the database

      if (!user) { // If the email is not found in the database
        console.log("User not found"); // Log the error message (for debugging purposes)
        return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] }); // Respond with an error indicating invalid credentials
      }

      const isPasswordMatch = await bcrypt.compare(password, user.password); // Compare the provided password with the hashed password stored in the database

      if (!isPasswordMatch) { // If the provided password does not match the hashed password in the database
        return res.status(400).json({ errors: [{ msg: "Invalid Credentials" }] }); // Respond with an error indicating invalid credentials
      }

      const payload = { // Prepare the payload to send user ID to the client in the JWT
        user: {
          id: user.id,
        },
      };

      jwt.sign( // Sign the token using the JWT secret from the environment variables
        payload,
        process.env.JWT_SECRET,
        { expiresIn: "5 days" }, // Set the token expiration time to 5 days
        (err, token) => {
          if (err) throw err; // If an error occurs during token signing, throw the error
          res.json({ token }); // Respond with the generated token
        }
      );
    } catch (err) {
      console.error(err.message); // Log the error message
      res.status(500).send("Server error"); // Respond with an internal server error
    }
  }
);

module.exports = router; // Export the router to be used in the application
