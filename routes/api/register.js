// Importing required modules and libraries
const express = require("express");          // Express framework for building web applications
const bcrypt = require("bcryptjs");          // Library for password hashing
const gravatar = require("gravatar");        // Library to get user avatars from email
const jwt = require("jsonwebtoken");         // Library for creating and verifying JSON Web Tokens
const { check, validationResult } = require("express-validator");   // Library for request validation
const User = require("../../models/User");   // User model for interacting with the database
const dotenv = require("dotenv");            // Library to read environment variables

// Creating an instance of Express Router
const router = express.Router();
dotenv.config();

// Register request handling function
router.post(
  "/",
  check("name", "Name is required").notEmpty(),   // Validate that the name field is not empty
  check("email", "Please include a valid email").isEmail(),  // Validate that the email field is a valid email
  check(
    "password",
    "Please enter a password with 6 or more characters"
  ).isLength({ min: 6 }),                         // Validate that the password has at least 6 characters
  async (req, res) => {
    // Validation checks
    const validationErrors = validationResult(req);
    if (!validationErrors.isEmpty()) {
      return res.status(400).json({ errors: validationErrors.array() }); // Return validation errors if any
    }

    // Extracting data from the request body
    const { name, email, password } = req.body;

    try {
      // Checking if the user already exists in the database
      let existingUser = await User.findOne({ email });
      if (existingUser) {
        return res
          .status(400)
          .json({ errors: [{ msg: "User already exists" }] });  // Return error if the user already exists
      }

      // Generating avatar URL using Gravatar
      const avatarURL = "https:" + gravatar.url(email, {
        s: "200",    // Size of the avatar image
        r: "pg",     // Rating of the image (PG rating)
        d: "mm",     // Default image if no avatar is available (mystery-man)
      });

      // Creating a new User object
      const newUser = new User({
        name,
        email,
        avatar: avatarURL,   // Set the avatar for the new user
        password,
      });

      // Generating a salt and hashing the password using bcrypt
      const saltRounds = await bcrypt.genSalt(10);  // Generate a salt with 10 rounds
      newUser.password = await bcrypt.hash(password, saltRounds);  // Hash the password with the generated salt

      // Saving the new user to the database
      await newUser.save();

      // Creating a JWT token for authentication
      const payload = {
        user: {
          id: newUser.id,     // Set the user ID in the token payload
        },
      };

      jwt.sign(
        payload,
        process.env.JWT_SECRET,   // Use the JWT secret from the environment variables
        { expiresIn: "5 days" },  // Token expiration time (5 days in this case)
        (err, token) => {
          if (err) throw err;
          res.json({ token });     // Return the generated JWT token to the client
        }
      );
    } catch (err) {
      console.error(err.message);
      res.status(500).send("Server error");  // Return a server error if something goes wrong
    }
  }
);

module.exports = router;
