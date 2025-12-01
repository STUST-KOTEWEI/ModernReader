import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
    try {
        const { text_snippet } = await req.json();

        // Simulate processing delay
        await new Promise(resolve => setTimeout(resolve, 800));

        // Simple keyword-based logic for demo purposes
        let feedback = "Neutral sensation.";
        let temp = 20; // Room temp
        let vibe = 0;

        let scent = "Neutral air";

        const lowerText = (text_snippet || "").toLowerCase();

        if (lowerText.includes("fire") || lowerText.includes("warm") || lowerText.includes("sun")) {
            feedback = "Warmth spreading across the surface.";
            temp = 45;
            scent = "Campfire smoke";
        } else if (lowerText.includes("ice") || lowerText.includes("cold") || lowerText.includes("snow")) {
            feedback = "A cool breeze and chilly surface.";
            temp = 10;
            scent = "Crisp winter air";
        } else if (lowerText.includes("thunder") || lowerText.includes("drum") || lowerText.includes("beat")) {
            feedback = "Strong rhythmic vibrations.";
            vibe = 80;
            scent = "Ozone and rain";
        } else if (lowerText.includes("wind") || lowerText.includes("whisper")) {
            feedback = "Gentle, flowing vibrations.";
            vibe = 20;
            scent = "Fresh grass";
        } else {
            // Random fallback for "simulation" feel
            const random = Math.random();
            if (random > 0.7) {
                feedback = "Subtle texture changes detected.";
                vibe = 10;
                scent = "Old book paper";
            } else if (random > 0.4) {
                feedback = "Ambient warmth.";
                temp = 25;
                scent = "Brewed tea";
            }
        }

        return NextResponse.json({
            feedback_description: feedback,
            intensity: {
                temperature: temp,
                vibration: vibe,
                scent: scent
            },
            status: "success"
        });

    } catch (error) {
        console.error('Haptics simulation error:', error);
        return NextResponse.json(
            { error: 'Failed to simulate haptics' },
            { status: 500 }
        );
    }
}
