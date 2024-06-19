const express = require('express');

const path = require("path");
const port = process.env.PORT || 3000;
const multer = require('multer');
const exphbs = require('express-handlebars');
const bodyParser = require('body-parser');
const crypto = require('crypto');
const mongoose = require('mongoose');
const paypal = require('paypal-rest-sdk');

const app = express();

//routes
const contactRoute = require("../router/contact");
const adminContactRoute= require("../router/adminContact");
// const { validateOrder } = require('../validators/orderValidator');
// Middleware to parse request body
app.use(bodyParser.urlencoded({ extended: true }));

require("./db/conn");
//session
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);


// Use sessions
const store = new MongoDBStore({
    uri: 'mongodb://localhost:27017/your-session-db',
    collection: 'sessions',
    expires: 1000 * 60 * 60 * 24, // 1 day
  });
  
  app.use(
    session({
      secret: 'your-secret-key',
      resave: false,
      saveUninitialized: false,
      store: store,
      cookie: {
        maxAge: 1000 * 60 * 60 * 24, // 1 day
      },
    })
  );

 
  
  const authenticateUser = (req, res, next) => {
    const user = req.session.user;
    // Make user information available to all routes
    res.locals.user = user;
    res.locals.isAuthenticated = true; 
    next();
  };
  
  // Apply middleware to routes that require authentication
  app.use(authenticateUser);
  

//hbs
const hbs = require("hbs");
//get models
const Register = require("./models/registers");
const Product = require("./models/addProduct");
const AdminRegister = require("./models/adminReg");
const Order = require("./models/orders");


//use static file to import css
const static_path = path.join(__dirname, "../public");

const template_path = path.join(__dirname, "../templates/views");
const partials_path = path.join(__dirname, "../templates/partials");
app.use(express.static(static_path));
//to get code written in form
app.use(express.json()); //best for postman
app.use(express.urlencoded({ extended: false }));

//using hbs

app.set("view engine", "hbs");
app.set("views", path.join(__dirname, "templates/views"));
app.set("views", template_path);
hbs.registerPartials(partials_path);

// Configure PayPal SDK with API credentials
paypal.configure({
  mode: 'sandbox', // Use 'sandbox' for testing, 'live' for production
  client_id: "AZpFKzph-gVkLcfJr93HP9V3mtcITxibiYG_ZDgQFnHQtvpXIOoflJ2bu3BCYGGNa0pwiaFoP4wy1lom", // Your PayPal Client ID
  client_secret:"EIIkEG7Q00oV9jxNxvHTHrCeJEmRQ_2QjnYLedM4-aUcDq67yeGBjJ1OvtTcU-jjFl1CuPT55-_IVP4h" // Your PayPal Client Secret
});


app.get("/", async (req, res) => {
    try {
      const products = await Product.find();
      res.render('index', { products, user: res.locals.user });
    } catch (error) {
      console.error('Error fetching products:', error);
      res.status(500).send('Internal Server Error');
    }
  });


app.get("/loginPage", (req, res) => {
    res.render("loginPage");
  });
app.get("/registerPage", (req, res) => {
    res.render("registerPage");
});
//create a new user in database
app.post("/register", async (req, res) => {
    try {
      const password = req.body.password;
      const cpassword = req.body.confirmpassword;
      if (password === cpassword) {
        const registerEmployee = new Register({
         
          fname: req.body.firstname,
          lname: req.body.lastname,
          email: req.body.email,
          password: req.body.password,
          confirmpassword: req.body.confirmpassword,
          phone: req.body.phone,
        });
        
        const registerd = await registerEmployee.save();
        res.redirect("/loginPage");
      } else {
        res.send("password are not matching");
      }
  
      
    } catch (err) {
      res.status(400).send(err);
    }
  });
  
//login check
app.post("/loginPage", async (req, res) => {
    try {
      const email = req.body.email;
      const password = req.body.password;
      const user = await Register.findOne({ email: email });
  
      if (user && user.password === password) {
        // Set user data in session
        req.session.user = user;

        // Redirect to the home page
        res.redirect("/");
      } else {
        res.send("Invalid login details");
      }
    } catch (err) {
      res.status(400).send("Invalid details");
    }
});
// Logout route
app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error("Error destroying session:", err);
      res.status(500).send("Internal Server Error");
    } else {
      // Clear user information from locals
      res.locals.user = null;
      res.redirect("/");
    }
  });
});

//product details
app.get('/product-details/:productId', async (req, res) => {
  try {
      const productId = req.params.productId;
      
      // Fetch the product details from the database based on the productId
      const product = await Product.findById(productId);

      // Render the product details page and pass the product data to the template
      res.render('product-details', { product });
  } catch (error) {
      console.error('Error fetching product details:', error);
      res.status(500).send('Internal Server Error');
  }
});

// Add a route to handle the "Add to Cart" request


// Function to calculate the total amount based on products in the cart
function calculateTotalAmount(products) {
  let totalAmount = 0;
  products.forEach(product => {
      totalAmount += product.price; // Assuming each product has a 'price' property
  });
  return totalAmount;
}
// Function to generate the signature
// function generateSignature(transaction_uuid, totalAmount) {
//   const secretKey = '8gBm/:&EnhH.1/q(';
//   const data = transaction_uuid + totalAmount;
//   const hmac = crypto.createHmac('sha256', secretKey);
//   hmac.update(data);
//   return hmac.digest('base64');
// }
// // Function to generate a unique transaction UUID
// function generateTransactionUuid() {
//   return 'transaction_' + Math.random().toString(36).substr(2, 9);
// }


app.get('/cart', async (req, res) => {
  try {
    // Get the user's cart items from the session
    let cartItems = req.session.cart || [];

    // Ensure cartItems is an array before using map
    if (!Array.isArray(cartItems)) {
      cartItems = [];
    }

    // Fetch the products based on the items in the cart
    const productsInCart = await Product.find({ _id: { $in: cartItems.map(item => item.productId) } });

    // Calculate total amount
    const totalAmount = calculateTotalAmount(productsInCart);

    res.render('cart', { 
      products: productsInCart, 
      cartItems,
      totalAmount
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    res.status(500).send('Internal Server Error');
  }
});





// POST route to add items to the cart
app.post('/cart', async (req, res) => {
  try {
    const productId = req.body.productId; // Assuming productId is a string
    const quantity = req.body.quantity || 1; // Default quantity is 1

    // Ensure productId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ error: 'Invalid product ID' });
    }

    // Initialize req.session.cart as an empty array if it's not already
    req.session.cart = req.session.cart || [];

    // Check if productId is already in the cart
    let existingItemIndex = -1;
    for (let i = 0; i < req.session.cart.length; i++) {
      if (req.session.cart[i].productId === productId) {
        existingItemIndex = i;
        break;
      }
    }

    if (existingItemIndex !== -1) {
      // If the product is already in the cart, update its quantity
      req.session.cart[existingItemIndex].quantity += quantity;
    } else {
      // If the product is not in the cart, add it as a new item
      req.session.cart.push({ productId, quantity });
    }

    res.json({ message: 'Product added to cart successfully' });
  } catch (error) {
    console.error('Error adding product to cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.post('/cart/delete', async (req, res) => {
  try {
    const productId = req.body.productId;

    // Get the user's cart items from the session
    const cartItems = req.session.cart || [];

    // Remove the item with matching productId from the cart
    const updatedCart = cartItems.filter(item => item.productId !== productId);

    // Update the user's cart in the session
    req.session.cart = updatedCart;

    res.json({ message: 'Product removed from cart successfully' });
  } catch (error) {
    console.error('Error removing product from cart:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// // Define the calculateTotalPrice function
// function calculateTotalPrice(products, req) {
//   let totalPrice = 0;
//   products.forEach(product => {
//       const quantity = req.session.quantity[product._id] || 1; // Retrieve quantity from session
//       totalPrice += product.price * quantity; // Multiply price by quantity
//   });
//   return totalPrice;
 
// }

// Define the /checkout route
// Route to handle the checkout process
app.get('/checkout', async (req, res) => {
    try {
        // Retrieve the total cart price from the request query parameters
        const totalCartPrice = req.query.total;

        // Render the checkout page and pass the total cart price to the template
        res.render('checkout', { totalCartPrice });
    } catch (error) {
        console.error('Error fetching cart:', error);
        res.status(500).send('Internal Server Error');
    }
});


// Route to handle order creation
app.post('/saveOrder', async (req, res) => {
  try {
      const { userId, products, amount, firstName, lastName, email, address, phone } = req.body;

      // Create a new order instance
      const newOrder = new Order({
          userId,
          products: products.map(product => ({
              productId: product.productId,
              productName: product.productName,
              quantity: product.quantity
          })),
          amount,
          firstName,
          lastName,
          email,
          address,
          phone
          // Add more fields as needed
      });

      // Save the order to the database
      const savedOrder = await newOrder.save();

      res.status(201).json(savedOrder); // Respond with saved order details
  } catch (error) {
      console.error('Error saving order:', error);
      res.status(500).json({ error: 'Failed to save order' });
  }
});




// Session middleware
app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true
}));


app.get("/adminReg", (req, res) => {
  res.render("adminSignup");
});
//create a new admin in database
app.post("/adminReg", async (req, res) => {
  try {
    const password = req.body.password;
    const cpassword = req.body.confirmpassword;
    if (password === cpassword) {
      const registerAdmin= new AdminRegister({
       
        fname: req.body.firstname,
        lname: req.body.lastname,
        email: req.body.email,
        password: req.body.password,
        confirmpassword: req.body.confirmpassword,
        phone: req.body.phone,
      });
      
      const registerd = await registerAdmin.save();
      res.status(201).render("admin");
    } else {
      res.send("password are not matching");
    }

    
  } catch (err) {
    res.status(400).send(err);
  }
});

//for admin section
app.get("/adminLogin", (req, res) => {
  res.render("admin");
});
//login check
app.post("/adminLogin", async (req, res) => {
  try {
    const email = req.body.email;
    const password = req.body.password;
    const user = await AdminRegister.findOne({ email: email });

    if (user && user.password === password) {
      req.session.user = user; 
      const products = await Product.find();
      res.render('adminPanel', { products, user: res.locals.user });
      
    } else {
      res.send("Invalid login details");
    }
  } catch (err) {
    console.error(err); // Log the actual error to the console
    res.status(400).send("Error occurred during login"); // Send a generic error message
  }
});
// Admin logout route
app.get('/admin/logout', (req, res) => {
  req.session.destroy();
  res.redirect("/adminLogin");
});


//admin panel
app.get("/adminPanel",authenticateUser, async(req, res) => {
  try {
    const products = await Product.find();

    
    res.render("adminPanel", { products });
} catch (err) {
    
    res.status(500).send("Error fetching products: " + err.message);
}
});

app.post("/delete/:id", async (req, res) => {
  try {
    const productId = req.params.id;

    // Delete the member
    await Product.findByIdAndDelete(productId);

    res.redirect("/adminPanel");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
});

app.get("/editProduct/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    res.render("adminEditProduct", { product });
  } catch (err) {
    console.error("Error retrieving product:", err);
    res.send("Error retrieving product: " + err.message);
  }
});

app.post("/editProduct/:id", async (req, res) => {
  try {
    const productId = req.params.id;
    const { title, description, price, image } = req.body;

    // Validate required fields
    if (!title || !description || !price || !image) {
      throw new Error("All fields (title, description, price, image) are required.");
    }

   
    const product = await Product.findById(productId);

    if (!product) {
      throw new Error("Product not found.");
    }

    
    product.title = title;
    product.description = description;
    product.price = price;
    product.image = image;

    
    const updatedProduct = await product.save();

    res.redirect("/adminPanel");
  } catch (err) {
    res.send("Error updating product: " + err.message);
  }
});
//see admin members
app.get("/viewAllMembers",authenticateUser, async (req, res) => {
  try {
      const members = await Register.find();

      res.render("viewAllMembers", { members });
  } catch (err) {
      
      res.status(500).send("Error fetching members: " + err.message);
  }
});
app.get("/adminOrdersView",authenticateUser, async (req, res) => {
  try {
      const order = await Order.find();

      res.render("adminOrdersView", { order });
  } catch (err) {
      
      res.status(500).send("Error fetching members: " + err.message);
  }
});


//multer 
// Define storage for uploaded images
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
      cb(null, 'public/images/products'); 
  },
  filename: function (req, file, cb) {
      cb(null, Date.now() + path.extname(file.originalname)); 
  }
});
// Initialize multer middleware
const upload = multer({ storage: storage });

app.get("/addProduct",authenticateUser, (req, res) => {
  res.render("addProduct");
    
  });
 
app.post("/addProduct",upload.single('productImage'), async (req, res) => {
    try {
  
      const image = req.file.filename;
      const { title, description, price } = req.body;

      const newProduct = new Product({ title, description, price, image });

      const savedProduct = await newProduct.save();
      res.status(201).redirect("/adminPanel");

    } catch (error) {
      console.error("Error adding product:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

// Route handler for handling PayPal payment confirmation
app.post('/paypal/confirm-payment', (req, res) => {
  // Extract order information from PayPal 'details' object
  const orderId = req.body.id;
  const amount = req.body.purchase_units[0].amount.value;
  const productId = req.body.product_id; // Replace with actual product ID

  // Create new order instance
  const newOrder = new Order({
      orderId: orderId,
      userId: req.session.user._id, // Assuming you have user authentication
      product: productId,
      amount: amount
      // Add more fields as needed
  });

  // Save the order to the database
  newOrder.save()
      .then(order => {
          console.log('Order created successfully:', order);
          
          res.sendStatus(200); 
      })
      .catch(error => {
          console.error('Error creating order:', error);
          res.status(500).send('Error creating order'); 
      });
});

app.get("/aboutus", (req, res) => {
  res.render("myTeams");
    
  });

app.use(contactRoute);
app.use(adminContactRoute);

app.listen(port, () => {
  console.log(`server is running on ${port}`);
});
