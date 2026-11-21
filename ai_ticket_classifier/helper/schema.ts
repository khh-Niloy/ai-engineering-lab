import { z } from "zod";

export const TicketSchema = z.object({
  category: z.enum([
    "PAYMENT",
    "ACCOUNT",
    "TECHNICAL",
    "SHIPPING",
    "REFUND",
    "OTHER",
  ]),
  priority: z.enum(["LOW", "MEDIUM", "HIGH"]),
  reason: z.string(),
});
