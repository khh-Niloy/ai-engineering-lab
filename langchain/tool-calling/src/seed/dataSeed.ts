import "dotenv/config";
import mongoose from "mongoose";
import { connectDB } from "../config/db.config";
import { Order } from "../model/order.model";

const sampleOrders = [
  {
    _id: new mongoose.Types.ObjectId("673a12345678901234567890"),
    customerId: new mongoose.Types.ObjectId("673a99999999901234567890"),
    items: [
      {
        productName: "Mechanical Keyboard",
        quantity: 1,
        unitPrice: 3500,
      },
      {
        productName: "Mouse",
        quantity: 2,
        unitPrice: 1200,
      },
    ],
    status: "SHIPPED",
    totalAmount: 5900,
    trackingNumber: "TRK-12345",
  },
  {
    _id: new mongoose.Types.ObjectId("673a12345678901234567891"),
    customerId: new mongoose.Types.ObjectId("673a99999999901234567890"),
    items: [
      {
        productName: "27-inch 4K Monitor",
        quantity: 1,
        unitPrice: 32000,
      },
    ],
    status: "PROCESSING",
    totalAmount: 32000,
    trackingNumber: "TRK-67890",
  },
  {
    _id: new mongoose.Types.ObjectId("673a12345678901234567892"),
    customerId: new mongoose.Types.ObjectId("673a88888888801234567899"),
    items: [
      {
        productName: "Noise Cancelling Headphones",
        quantity: 1,
        unitPrice: 8500,
      },
      {
        productName: "USB-C Cable",
        quantity: 3,
        unitPrice: 500,
      },
    ],
    status: "DELIVERED",
    totalAmount: 10000,
    trackingNumber: "TRK-99999",
  },
  {
    _id: new mongoose.Types.ObjectId("673a12345678901234567893"),
    customerId: new mongoose.Types.ObjectId("673a88888888801234567899"),
    items: [
      {
        productName: "Ergonomic Desk Chair",
        quantity: 1,
        unitPrice: 18000,
      },
    ],
    status: "PENDING",
    totalAmount: 18000,
  },
];

async function seedData() {
  try {
    await connectDB();

    console.log("Cleaning existing orders...");
    await Order.deleteMany({});

    console.log("Seeding sample orders...");
    await Order.insertMany(sampleOrders);

    console.log("✅ Data seeded successfully!");
  } catch (error) {
    console.error("❌ Error seeding data:", error);
  } finally {
    await mongoose.connection.close();
    console.log("MongoDB connection closed.");
    process.exit(0);
  }
}

seedData();
