const mongoose = require('mongoose');

// Define Order Schema
const orderSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If you have user authentication
    products: [
        {
            productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
            productName: { type: String },
            quantity: { type: Number }
        }
    ],
    amount: { type: Number },
    paymentStatus: { type: String, default: 'Paid' }, // You can extend this to handle different payment statuses
    firstName: { type: String },
    lastName: { type: String },
    email: { type: String },
    address: { type: String },
    phone: { type: Number },
    // Add more fields as needed
}, { timestamps: true });

// Create Order Model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
