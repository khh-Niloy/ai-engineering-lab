import { StructuredTool, tool } from "@langchain/core/tools";
import { z } from "zod";
import { orderService } from "../service/order";

// Create tools for the authenticated customer
export function createOrderTools(customerId: string): StructuredTool[] {
  // ==================================
  // TOOL 1: GET ORDER STATUS
  // ==================================

  const getOrderStatus = tool(
    ({ orderId }) => orderService.getOrderStatus(orderId, customerId),
    {
      name: "get_order_status",
      description:
        "Get the delivery status and tracking number of a specific customer order.",
      schema: z.object({
        orderId: z.string().describe("MongoDB order ID"),
      }),
    },
  );

  // ==================================
  // TOOL 2: GET ORDER ITEMS
  // ==================================

  const getOrderItems = tool(
    ({ orderId }) => orderService.getOrderItems(orderId, customerId),
    {
      name: "get_order_items",
      description:
        "Get the products, quantities and total amount of a specific order.",
      schema: z.object({
        orderId: z.string().describe("MongoDB order ID"),
      }),
    },
  );

  // ==================================
  // TOOL 3: LIST CUSTOMER ORDERS
  // ==================================

  const listMyOrders = tool(
    ({ limit }) => orderService.listMyOrders(customerId, limit),
    {
      name: "list_my_orders",
      description: "List the logged-in customer's most recent orders.",
      schema: z.object({
        limit: z.number().int().min(1).max(10).default(5),
      }),
    },
  );

  return [getOrderStatus, getOrderItems, listMyOrders];
}
