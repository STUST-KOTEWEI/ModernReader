import { NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { localUserStore } from '@/lib/db/localUserStore';

export async function GET() {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch real data from Local Store
    const user = localUserStore.findUser(session.user.email);

    if (!user) {
        // Fallback for demo/hardcoded accounts if they still exist, or 404
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Remove sensitive data (though findUser returns raw user relative to store inner logic, 
    // but in route we should be careful. localUserStore getters return plain object usually.)
    // Let's rely on JSON serialization to not leak passwordHash if we strip it.
    const { passwordHash: _, ...safeUser } = user;

    return NextResponse.json(safeUser);
}

export async function PUT(request: Request) {
    const session = await getServerSession(authOptions);

    if (!session || !session.user?.email) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Update Local Store
        const updatedUser = localUserStore.updateUser(session.user.email, body);

        if (!updatedUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        const { passwordHash: _, ...safeUser } = updatedUser;

        return NextResponse.json({
            success: true,
            message: 'Profile updated successfully',
            data: safeUser
        });
    } catch (error) {
        console.error("Profile update error:", error);
        return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }
}
