"use server";

import { auth } from "@/auth";
import wol from "wake_on_lan";

export async function wakePc() {
    const session = await auth();
    
    if (session?.user?.email === "damianojongerius@gmail.com") {
        const macAddress = process.env.WOL_MAC_ADDRESS || "9C:6B:00:37:97:94";
        const broadcastAddresses = (process.env.WOL_BROADCAST_ADDRESSES || '255.255.255.255').split(',');

        return new Promise<{ success: boolean }>((resolve) => {
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
    }
    
    throw new Error("Unauthorized");
}
