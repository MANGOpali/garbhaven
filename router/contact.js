const express = require("express");
const router = express.Router();
const Message = require("../src/models/contactMessages"); 

router.get("/contactus", (req, res) => {
  res.render("contactUs");
});

router.post('/send-message', async (req, res) => {
  try {
      // Create a new message document
      const newMessage = new Message(req.body); // Use Message here

      // Save the message to the database
      await newMessage.save();

      // Send a success response
      res.status(201).json({ message: 'Message sent successfully' });
  } catch (error) {
      // Send an error response if there's a problem
      console.error('Error sending message:', error);
      res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
