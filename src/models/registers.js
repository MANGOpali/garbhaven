const mongoose = require("mongoose");
const regSchema = new mongoose.Schema({
  fname: {
    type: String,
    required: true,
  },
  lname: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  confirmpassword: {
    type: String,
    required: true,
  },
  phone: {
    type: Number,
    required: true,
  },
});

const Register = new mongoose.model("Register", regSchema);
module.exports = Register;
