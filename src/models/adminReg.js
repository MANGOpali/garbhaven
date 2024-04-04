const mongoose = require("mongoose");
const adminRegSchema = new mongoose.Schema({
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

const AdminRegister = new mongoose.model("AdminReg", adminRegSchema);
module.exports = AdminRegister;
