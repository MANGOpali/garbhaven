const mongoose = require("mongoose");
mongoose.set("strictQuery", false);

mongoose
  .connect("mongodb://localhost:27017/ecommerce")
  .then(() => {
    console.log("database connection successful");
  })
  .catch((err) => {
    console.log(err);
  });
