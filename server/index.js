// Import required modules
require("dotenv").config();
const express = require("express");
const Razorpay = require("razorpay");
const cors = require("cors");
const crypto = require("crypto");

// Create an Express application
const app = express();
const PORT = process.env.PORT || 5000; // Set the server port

// Middleware setup
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// POST endpoint to create a new order
app.post("/order", async (req, res) => {
  try {
    // Initialize Razorpay client with API keys
    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    // Create an order using request body options
    const options = req.body;
    const order = await razorpay.orders.create(options);

    // Check if order creation was successful
    if (!order) {
      throw new Error("Failed to create order");
    }

    // Send the order details as a JSON response
    res.json(order);
  } catch (err) {
    // Log and send error response if order creation fails
    console.error(err);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// POST endpoint to validate a payment
app.post("/order/validate", async (req, res) => {
  try {
    // Extract required parameters from request body
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    // Generate HMAC signature using secret key
    const generated_signature = crypto.createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    // Compare generated signature with received signature
    if (generated_signature !== razorpay_signature) {
      throw new Error("Transaction is not legit!");
    }

    // Send success message and payment details as JSON response
    res.json({
      msg: "success",
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
    });
  } catch (err) {
    // Log and send error response if payment validation fails
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

// Start the server and listen on specified port
app.listen(PORT, () => {
  console.log("Server is listening on port", PORT);
});
