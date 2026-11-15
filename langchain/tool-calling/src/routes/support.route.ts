import { Router } from "express";
import { runSupportAgent } from "../service/support-agent.service";

const router = Router();

router.post("/chat", async (req, res) => {
  try {
    const { message, customerId } = req.body;

    const answer = await runSupportAgent(customerId, message);

    return res.json({ answer });
  } catch (error) {
    console.error("Support agent error:", error);

    return res.status(500).json({
      error: "Something went wrong",
    });
  }
});

export default router;
