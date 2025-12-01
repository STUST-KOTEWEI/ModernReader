"use client";

import { useSession } from "next-auth/react";
import toast from "react-hot-toast";

const POINTS_MAP: Record<string, number> = {
    CHAT_MESSAGE_SENT: 1,
    LEARNING_PATH_COMPLETED: 25,
    PROFILE_UPDATED: 10,
};

export function useGamification() {
    const { data: session, status } = useSession();

    const logActivity = async (activityType: keyof typeof POINTS_MAP) => {
        if (status !== "authenticated") {
            return;
        }

        try {
            const response = await fetch('/api/v1/gamification/activity', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.accessToken}`
                },
                body: JSON.stringify({ activity_type: activityType })
            });

            if (response.ok) {
                const points = POINTS_MAP[activityType];
                toast.success(`+${points} points!`);
            }
        } catch (error) {
            console.error("Failed to log activity:", error);
        }
    };

    return { logActivity };
}
