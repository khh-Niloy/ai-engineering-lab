import { Schema, model, models } from "mongoose";

const orderSchema = new Schema(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    items: [
      {
        productName: {
          type: String,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
        },
        unitPrice: {
          type: Number,
          required: true,
        },
      },
    ],

    status: {
      type: String,
      enum: ["PENDING", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
      required: true,
    },

    totalAmount: {
      type: Number,
      required: true,
    },

    trackingNumber: String,
  },
  { timestamps: true },
);

export const Order = models.Order || model("Order", orderSchema);
