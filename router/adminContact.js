const express = require("express");
const router = express.Router();
const Message = require("../src/models/contactMessages"); 

router.get("/adminContact", async(req, res) => {
    try {
        // Fetch all messages from the database
        const messages = await Message.find().sort({ createdAt: -1 });
    
        // Render a page to display the messages
        res.render("adminContactMessage", { messages });
      } catch (error) {
        console.error('Error fetching messages:', error);
        res.status(500).send('Internal Server Error');
      }
 
});



module.exports = router;
