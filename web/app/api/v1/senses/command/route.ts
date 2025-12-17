import { NextRequest, NextResponse } from "next/server";
import { openai, isOpenAIConfigured } from "@/lib/openai";

export async function POST(req: NextRequest) {
    try {
        const { text_snippet } = await req.json();

        // Default values (Neutral)
        let feedback = "Neutral sensation.";
        let temp = 20; // Room temp
        let vibe = 0;
        let scent = "Neutral air";
        let audio = "Silence";

        if (isOpenAIConfigured()) {
            try {
                const completion = await openai.chat.completions.create({
                    model: "gpt-4o-mini",
                    messages: [
                        {
                            role: "system",
                            content: `You are a Sensory Extraction AI. Analyze the text and extract implied physical sensations.
Return JSON ONLY:
{
  "temperature": number (0-100, 0=freezing, 50=neutral/room temp, 100=burning),
  "vibration": number (0-100, 0=still, 100=earthquake),
  "scent": string (short evocative description, e.g. "Ozone and rain", "Old paper"),
  "audio_ambience": string (keyword for background sound, e.g. "Rain", "Fire", "Wind", "Silence"),
  "feedback_description": string (short poetic description of the physical sensation, max 10 words)
}
If abstract/no sensation, return neutral values (temp 20-30, vibe 0).`
                        },
                        {
                            role: "user",
                            content: text_snippet
                        }
                    ],
                    response_format: { type: "json_object" }
                });

                const result = JSON.parse(completion.choices[0].message.content || "{}");
                temp = result.temperature ?? 20;
                vibe = result.vibration ?? 0;
                scent = result.scent || "Neutral air";
                audio = result.audio_ambience || "Silence";
                feedback = result.feedback_description || "Subtle ambient sensation.";

            } catch (aiError) {
                console.error("OpenAI Haptics Error:", aiError);
                // Fallback to mock if AI fails
                feedback = "AI Connection failed. Using fallback.";
            }
        } else {
            // Mock Fallback Logic (if no key)
            const lowerText = (text_snippet || "").toLowerCase();

            if (lowerText.includes("fire") || lowerText.includes("warm") || lowerText.includes("sun")) {
                feedback = "Warmth spreading across the surface.";
                temp = 45;
                scent = "Campfire smoke";
                audio = "Fire";
            } else if (lowerText.includes("ice") || lowerText.includes("cold") || lowerText.includes("snow")) {
                feedback = "A cool breeze and chilly surface.";
                temp = 10;
                scent = "Crisp winter air";
                audio = "Wind";
            } else if (lowerText.includes("thunder") || lowerText.includes("drum") || lowerText.includes("beat")) {
                feedback = "Strong rhythmic vibrations.";
                vibe = 80;
                scent = "Ozone and rain";
                audio = "Thunder";
            } else if (lowerText.includes("wind") || lowerText.includes("whisper")) {
                feedback = "Gentle, flowing vibrations.";
                vibe = 20;
                scent = "Fresh grass";
                audio = "Wind";
            } else {
                const random = Math.random();
                if (random > 0.7) {
                    feedback = "Subtle texture changes detected.";
                    vibe = 10;
                    scent = "Old book paper";
                    audio = "Silence";
                } else if (random > 0.4) {
                    feedback = "Ambient warmth.";
                    temp = 25;
                    scent = "Brewed tea";
                    audio = "Cafe";
                }
            }
        }

        return NextResponse.json({
            feedback_description: feedback,
            intensity: {
                temperature: temp,
                vibration: vibe,
                scent: scent,
                audio: audio
            },
            status: "success"
        });

    } catch {
        return NextResponse.json({ status: "error", message: "Internal Server Error" }, { status: 500 });
    }
}
