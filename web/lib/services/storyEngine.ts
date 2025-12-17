export class StoryEngine {
    private grammars = {
        myth: {
            openers: ["In the age before maps,", "When the stars were young,", "Long after the cities fell,", "In a garden of silver light,"],
            subjects: ["a warrior with a glass heart", "a child made of starlight", "a fox with nine shadows", "the last keeper of memories"],
            actions: ["sought the meaning of silence", "planted a seed of pure logic", "sang a song that stopped time", "wove a net to catch the wind"],
            objects: ["in the ruins of an ancient library.", "beneath the roots of the world tree.", "at the edge of the known universe.", "within the reflection of a mirror."],
            outcomes: ["And thus, the world learned to listen again.", "Discovery came, but at a terrible price.", "Yet, silence was the only answer.", "New life bloomed from the ashes."]
        },
        scifi: {
            openers: ["Orbiting the red giant,", "In the neon slums of K-Sector,", "After the upload completed,", "On the drift-ship 'Icarus',"],
            subjects: ["a rogue android", "a data-ghost", "a cybernetic monk", "a quantum navigator"],
            actions: ["hacked the reality filter", "decoded the ancient signal", "reset the simulation", "merged with the void"],
            objects: ["inside the central core.", "beyond the event horizon.", "within the error logs.", "at the end of time."],
            outcomes: ["The system rebooted.", "Humanity was obsolete.", "The code became flesh.", "Silence filled the void."]
        },
        fable: {
            openers: ["Once, in a deep forest,", "A long time ago,", "In a village by the sea,", "Where the river bends,"],
            subjects: ["a brave little mouse", "a wise old owl", "a greedy fox", "a lonely stone"],
            actions: ["found a golden coin", "tricked the north wind", "learned to fly", "shared its dinner"],
            objects: ["under the great oak tree.", "in the king's garden.", "atop the highest mountain.", "inside a magic box."],
            outcomes: ["And everyone lived happily.", "A lesson was learned.", "The sun shined brighter.", "Balance was restored."]
        }
    };

    /**
     * Generates a unique story snippet by combining grammar parts
     */
    generate(style: 'myth' | 'scifi' | 'fable' = 'myth'): string {
        const currentGrammar = this.grammars[style] || this.grammars.myth;
        const pick = (arr: string[]) => arr[Math.floor(Math.random() * arr.length)];

        const part1 = pick(currentGrammar.openers);
        const part2 = pick(currentGrammar.subjects);
        const part3 = pick(currentGrammar.actions);
        const part4 = pick(currentGrammar.objects);
        const part5 = pick(currentGrammar.outcomes);

        return `${part1} ${part2} ${part3} ${part4} ${part5}`;
    }
}

export const storyEngine = new StoryEngine();
