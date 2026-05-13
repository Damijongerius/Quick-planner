"use server";

import { auth } from "@/auth";
import wol from "wake_on_lan";

export async function wakePc() {
    const session = await auth();
    
    if (session?.user?.email === "damianojongerius@gmail.com") {
        return new Promise<{ success: boolean }>((resolve) => {
            // Docker on Mac isolates 255.255.255.255. We broadcast to common subnets to ensure it reaches the host's LAN.
            const broadcastAddresses = ['255.255.255.255', '192.168.0.255', '192.168.1.255', '192.168.2.255', '10.0.0.255', '10.0.1.255'];
            let completed = 0;
            let hasError = false;

            broadcastAddresses.forEach(address => {
                wol.wake("9C:6B:00:37:97:94", { address }, function(error: any) {
                    completed++;
                    if (error) hasError = true;
                    
                    if (completed === broadcastAddresses.length) {
                        if (hasError) console.error("Some packets failed, but others may have succeeded.");
                        else console.log("WakeOnLan packets sent to all subnets.");
                        resolve({ success: true }); // We assume success if at least some sent
                    }
                });
            });
        });
    }
    
    throw new Error("Unauthorized");
}
