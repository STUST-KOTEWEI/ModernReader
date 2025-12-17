import fs from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface User {
    id: string;
    name: string;
    email: string;
    passwordHash: string; // "Hashed" for demo
    image?: string;
    occupation?: string;
    gender?: string;
    age?: number;
    interests?: string[];
    readingGoals?: string[];
    preferredLanguages?: string[];
    cultural_preferences?: string[];
    points?: number;
    level?: number;
}

class LocalUserStore {
    private getUsers(): User[] {
        if (!fs.existsSync(USERS_FILE)) {
            return [];
        }
        try {
            const data = fs.readFileSync(USERS_FILE, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
            console.error("Error reading users file:", error);
            return [];
        }
    }

    private saveUsers(users: User[]) {
        fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
    }

    findUser(email: string): User | undefined {
        const users = this.getUsers();
        return users.find(u => u.email === email);
    }

    createUser(name: string, email: string, password: string): User {
        const users = this.getUsers();
        if (users.find(u => u.email === email)) {
            throw new Error("User already exists");
        }

        // Simple "Hash" for local demo purposes
        const passwordHash = Buffer.from(password).toString('base64');

        const newUser: User = {
            id: Math.random().toString(36).substr(2, 9),
            name,
            email,
            passwordHash,
            image: `https://api.dicebear.com/7.x/initials/svg?seed=${name}`,
            occupation: 'Reader',
            age: 25,
            points: 0,
            level: 1
        };

        this.saveUsers([...users, newUser]);
        return newUser;
    }

    updateUser(email: string, updates: Partial<User>): User | null {
        const users = this.getUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) return null;

        // Prevent updating critical fields directly via this method if needed, 
        // but for now allow all except email/id persistence check.
        const updatedUser = { ...users[index], ...updates };
        // Ensure ID/Email didn't change accidentally if not intended (though Partial allows it)
        // ideally we might protect them, but trusting the caller for this local demo.

        users[index] = updatedUser;
        this.saveUsers(users);
        return updatedUser;
    }

    addPoints(email: string, amount: number): User | null {
        const users = this.getUsers();
        const index = users.findIndex(u => u.email === email);
        if (index === -1) return null;

        const user = users[index];
        const currentPoints = user.points || 0;
        const newPoints = currentPoints + amount;

        // Simple Leveling Logic: 100 points per level
        // Level 1: 0-99, Level 2: 100-199, etc.
        const newLevel = Math.floor(newPoints / 100) + 1;

        const updatedUser = {
            ...user,
            points: newPoints,
            level: newLevel
        };

        users[index] = updatedUser;
        this.saveUsers(users);
        return updatedUser;
    }

    validateCredentials(email: string, password: string): Omit<User, 'passwordHash'> | null {
        const user = this.findUser(email);
        if (!user) return null;

        const inputHash = Buffer.from(password).toString('base64');
        if (user.passwordHash === inputHash) {
            // Return user without passwordHash
            return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image
            };
        }
        return null;
    }
}

export const localUserStore = new LocalUserStore();
