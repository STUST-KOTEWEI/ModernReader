export interface HyReadBook {
    id: string;
    title: string;
    author: string;
    cover: string;
    progress: number;
    daysLeft?: number;
    isRenewing?: boolean;
}

// Simulate API delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const hyReadApi = {
    async linkAccount(token: string): Promise<{ success: boolean; message: string }> {
        await delay(1500);
        if (token === "error") {
            return { success: false, message: "Invalid credentials" };
        }
        return { success: true, message: "Account linked successfully" };
    },

    async syncBooks(): Promise<HyReadBook[]> {
        await delay(2000);
        return [
            {
                id: "hr-1",
                title: "The Soul of the Tree",
                author: "Lin Yi-han",
                cover: "bg-emerald-800",
                progress: 65
            },
            {
                id: "hr-2",
                title: "Taiwanese Folklore",
                author: "Chen Yu-hsiu",
                cover: "bg-indigo-900",
                progress: 12
            },
            {
                id: "hr-3",
                title: "Mountain Spirits",
                author: "Wang Wei",
                cover: "bg-stone-800",
                progress: 0
            }
        ];
    }
};
