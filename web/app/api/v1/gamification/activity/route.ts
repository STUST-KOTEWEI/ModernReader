import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { localUserStore } from '@/lib/db/localUserStore';

const POINTS_MAP: Record<string, number> = {
    CHAT_MESSAGE_SENT: 1,
    LEARNING_PATH_COMPLETED: 25,
    PROFILE_UPDATED: 10,
    BOOK_FINISHED: 50,
    DAILY_LOGIN: 5
};

export async function POST(req: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { activity_type } = body;

        if (!activity_type || !POINTS_MAP[activity_type]) {
            return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
        }

        const pointsToAdd = POINTS_MAP[activity_type];
        const updatedUser = localUserStore.addPoints(session.user.email, pointsToAdd);

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            added: pointsToAdd,
            totalPoints: updatedUser.points,
            level: updatedUser.level
        });

    } catch (error) {
        console.error("Gamification error:", error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
