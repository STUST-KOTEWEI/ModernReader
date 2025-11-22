import SweetReader from "@/components/reader/SweetReader";

const SAMPLE_CONTENT = `In the ancient times of the Paiwan people, the Hundred-Pacer Snake was not just a creature of the forest, but a guardian spirit of the nobility.
The elders say that the first noble was born from a pottery jar protected by two Hundred-Pacer snakes.
The sun's rays warmed the jar, and the snakes curled around it, infusing it with their power and wisdom.
When the jar finally cracked open, a child emerged—the first chief of the Paiwan.
This is why we honor the snake pattern on our clothes, our houses, and our tools. It reminds us of our origins and our connection to the land.
To see the snake is to see our ancestors. To touch the carving is to feel their protection.
Listen closely to the wind in the bamboo... can you hear them whispering the old laws?`;

export default function ReaderPage() {
    return (
        <SweetReader
            title="The Legend of the Hundred-Pacer"
            author="Paiwan Tradition"
            content={SAMPLE_CONTENT}
        />
    );
}
