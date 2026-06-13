import { Router } from "express";
import { verifyToken } from "../../middleware/auth";

const router = Router();

// wake PC
router.post("/wake-pc", verifyToken, async (req, res) => {
  const wol = require("wake_on_lan");
  try {
    const userEmail = (req as any).user.email;
    
    if (userEmail === "damianojongerius@gmail.com") {
      const macAddress = process.env.WOL_MAC_ADDRESS || "9C:6B:00:37:97:94";
      const broadcastAddresses = (process.env.WOL_BROADCAST_ADDRESSES || '255.255.255.255').split(',');

      const results = await new Promise<{ success: boolean }>((resolve) => {
        let completed = 0;
        let hasError = false;

        broadcastAddresses.forEach(address => {
          wol.wake(macAddress, { address: address.trim() }, function(error: Error | null) {
            completed++;
            if (error) hasError = true;
            
            if (completed === broadcastAddresses.length) {
              if (hasError) console.error("Some packets failed, but others may have succeeded.");
              else console.log("WakeOnLan packets sent to all configured subnets.");
              resolve({ success: true });
            }
          });
        });
      });

      res.json(results);
    } else {
      res.status(403).json({ error: "Unauthorized user for PC wake operations" });
    }
  } catch (error: any) {
    console.error("WOL error:", error);
    res.status(500).json({ error: "Failed to send WakeOnLan packets" });
  }
});

export default router;
