import { DefaultSession } from "next-auth";

export interface User {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    id?: string;
    role?: string;
}

export interface Session extends Omit<DefaultSession, "user"> {
    user?: User;
}
