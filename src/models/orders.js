const mongoose = require('mongoose');

// Define Order Schema
const orderSchema = new mongoose.Schema({
    orderId: { type: String, required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // If you have user authentication
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    amount: { type: Number, required: true },
    paymentStatus: { type: String, default: 'Paid' }, // You can extend this to handle different payment statuses
    // Add more fields as needed
}, { timestamps: true });

// Create Order Model
const Order = mongoose.model('Order', orderSchema);
module.exports = Order;