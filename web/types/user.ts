// User Profile Types for ModernReader

export interface UserProfile {
    id: string;
    email: string;
    name: string;

    // Personal Information
    occupation: string;        // e.g., "Software Engineer", "Teacher", "Student"
    gender: string;            // e.g., "Male", "Female", "Non-binary", "Prefer not to say"
    age: number;              // Age in years

    // Reading Preferences
    interests: string[];      // e.g., ["Technology", "Science Fiction", "Self-Help"]
    readingGoals: string[];   // e.g., ["Professional Development", "Entertainment", "Learning"]
    preferredLanguages: string[]; // e.g., ["English", "Chinese", "Spanish"]

    // Emotional State (for recommendations)
    currentEmotion?: EmotionType;

    // Reading History
    booksRead?: string[];     // Book IDs
    currentlyReading?: string[]; // Book IDs
    wishlist?: string[];      // Book IDs

    // Metadata
    createdAt: Date;
    updatedAt: Date;
}

export type EmotionType =
    | 'joy'
    | 'sadness'
    | 'anger'
    | 'fear'
    | 'surprise'
    | 'disgust'
    | 'neutral';

export type OccupationType =
    | 'Software Engineer'
    | 'Teacher'
    | 'Student'
    | 'Doctor'
    | 'Nurse'
    | 'Business Professional'
    | 'Artist'
    | 'Writer'
    | 'Researcher'
    | 'Entrepreneur'
    | 'Retired'
    | 'Other';

export type ReadingGoalType =
    | 'Professional Development'
    | 'Entertainment'
    | 'Learning New Skills'
    | 'Personal Growth'
    | 'Academic Study'
    | 'Language Learning'
    | 'Relaxation';

export interface BookRecommendation {
    book: {
        key: string;
        title: string;
        authors: { name: string }[];
        cover_id?: number;
        subject?: string[];
        description?: string;
    };
    reasoning: string; // AI explanation for why this book is recommended
    matchScore: number; // 0-100
}

export interface RecommendationRequest {
    userId: string;
    occupation: string;
    gender: string;
    age: number;
    emotion?: EmotionType;
    interests: string[];
    readingGoals: string[];
    limit?: number;
}

export interface RecommendationResponse {
    recommendations: BookRecommendation[];
    summary: string; // Overall recommendation summary
}
