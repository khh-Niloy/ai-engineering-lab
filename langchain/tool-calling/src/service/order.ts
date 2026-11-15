import mongoose from "mongoose";
import { Order } from "../model/order.model";

async function getOrderStatus(orderId: string, customerId: string) {
  if (!mongoose.isValidObjectId(orderId)) {
    return { error: "Invalid order ID" };
  }

  const order = await Order.findOne({
    _id: orderId,
    customerId,
  })
    .select("status trackingNumber updatedAt")
    .lean();

  if (!order) {
    return { error: "Order not found" };
  }

  return {
    status: order.status,
    trackingNumber: order.trackingNumber,
    lastUpdated: order.updatedAt,
  };
}

async function getOrderItems(orderId: string, customerId: string) {
  if (!mongoose.isValidObjectId(orderId)) {
    return { error: "Invalid order ID" };
  }

  const order = await Order.findOne({
    _id: orderId,
    customerId,
  })
    .select("items totalAmount")
    .lean();

  if (!order) {
    return { error: "Order not found" };
  }

  return {
    items: order.items,
    totalAmount: order.totalAmount,
  };
}

async function listMyOrders(customerId: string, limit: number = 5) {
  const orders = await Order.find({
    customerId,
  })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select("status totalAmount createdAt")
    .lean();

  return orders;
}

export const orderService = {
  getOrderStatus,
  getOrderItems,
  listMyOrders,
};
