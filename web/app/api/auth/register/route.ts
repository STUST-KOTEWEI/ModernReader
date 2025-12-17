import { NextResponse } from 'next/server';
import { localUserStore } from '@/lib/db/localUserStore';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!name || !email || !password) {
            return NextResponse.json(
                { message: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newUser = localUserStore.createUser(name, email, password);

        return NextResponse.json(
            { message: 'User created successfully', user: newUser },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);

        // Simple error handling for duplicates
        if (error instanceof Error && error.message === 'User already exists') {
            return NextResponse.json(
                { message: 'User already exists' },
                { status: 409 }
            );
        }

        return NextResponse.json(
            { message: 'Internal server error' },
            { status: 500 }
        );
    }
}
