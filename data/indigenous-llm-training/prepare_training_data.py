"""
Prepare Indigenous Language Training Data for GPT Fine-tuning

This script collects, processes, and formats training data from:
- User chat sessions
- Handwriting recognition samples
- Pronunciation training data
- Community contributions

Output: JSONL files compatible with OpenAI/GPT-OSS fine-tuning
"""

import json
import os
from pathlib import Path
from typing import List, Dict, Any
from datetime import datetime
import argparse


class TrainingDataPreparer:
    """Prepare training data for indigenous language LLM fine-tuning."""
    
    def __init__(self, output_dir: str = "jsonl"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        
        # Language metadata
        self.languages = {
            # Taiwan
            "ami": {"name": "Amis", "native": "阿美語", "region": "Taiwan"},
            "pwn": {"name": "Paiwan", "native": "排灣語", "region": "Taiwan"},
            "trv": {"name": "Seediq/Truku", "native": "太魯閣語", "region": "Taiwan"},
            "tay": {"name": "Atayal", "native": "泰雅語", "region": "Taiwan"},
            "bnn": {"name": "Bunun", "native": "布農語", "region": "Taiwan"},
            "pyu": {"name": "Puyuma", "native": "卑南語", "region": "Taiwan"},
            "dru": {"name": "Rukai", "native": "魯凱語", "region": "Taiwan"},
            "tsu": {"name": "Tsou", "native": "鄒語", "region": "Taiwan"},
            "xsy": {"name": "Saisiyat", "native": "賽夏語", "region": "Taiwan"},
            "tao": {"name": "Tao (Yami)", "native": "達悟語（雅美語）", "region": "Taiwan"},
            "ssf": {"name": "Thao", "native": "邵語", "region": "Taiwan"},
            "ckv": {"name": "Kavalan", "native": "噶瑪蘭語", "region": "Taiwan"},
            "szy": {"name": "Sakizaya", "native": "撒奇萊雅語", "region": "Taiwan"},
            # Global
            "mi": {"name": "Maori", "native": "Māori", "region": "New Zealand"},
            "haw": {"name": "Hawaiian", "native": "ʻŌlelo Hawaiʻi", "region": "Hawaii, USA"},
            "nv": {"name": "Navajo", "native": "Diné bizaad", "region": "USA"},
            "qu": {"name": "Quechua", "native": "Runa Simi", "region": "Peru/Bolivia/Ecuador"},
            "gn": {"name": "Guarani", "native": "Avañe'ẽ", "region": "Paraguay"},
            "ay": {"name": "Aymara", "native": "Aymara", "region": "Bolivia/Peru/Chile"},
            "iu": {"name": "Inuktitut", "native": "ᐃᓄᒃᑎᑐᑦ", "region": "Canada"},
            "se": {"name": "Northern Sami", "native": "Davvisámegiella", "region": "Norway/Sweden/Finland"},
            "sw": {"name": "Swahili", "native": "Kiswahili", "region": "East Africa"},
            "zu": {"name": "Zulu", "native": "isiZulu", "region": "South Africa"},
            "eu": {"name": "Basque", "native": "Euskara", "region": "Spain/France"},
            "cy": {"name": "Welsh", "native": "Cymraeg", "region": "Wales, UK"},
            "hmn": {"name": "Hmong", "native": "Hmoob", "region": "China/SEA/USA"},
            "bo": {"name": "Tibetan", "native": "བོད་སྐད་", "region": "Tibet/China/India/Nepal"},
            "ug": {"name": "Uyghur", "native": "ئۇيغۇرچە", "region": "China"},
        }
    
    def get_system_prompt(self, language_code: str) -> str:
        """Generate system prompt for a specific language."""
        lang_info = self.languages.get(language_code, {})
        name = lang_info.get("name", language_code.upper())
        native = lang_info.get("native", name)
        region = lang_info.get("region", "various regions")
        
        return (
            f"You are an AI assistant helping users learn {name} ({native}), "
            f"an indigenous language of {region}. "
            f"Provide translations, pronunciation guides (romanization and IPA when possible), "
            f"cultural context, and related phrases. "
            f"Be respectful, accurate, and encourage language learning."
        )
    
    def format_chat_conversation(
        self,
        language_code: str,
        user_message: str,
        assistant_message: str,
        translation: str = None,
        pronunciation: str = None,
        cultural_context: str = None
    ) -> Dict[str, Any]:
        """Format a conversation into OpenAI JSONL format."""
        
        # Build assistant response
        response_parts = [assistant_message]
        
        if translation:
            response_parts.append(f"\n\n**Translation:** {translation}")
        
        if pronunciation:
            response_parts.append(f"\n\n**Pronunciation:** {pronunciation}")
        
        if cultural_context:
            response_parts.append(f"\n\n**Cultural Context:** {cultural_context}")
        
        return {
            "messages": [
                {"role": "system", "content": self.get_system_prompt(language_code)},
                {"role": "user", "content": user_message},
                {"role": "assistant", "content": "".join(response_parts)}
            ]
        }
    
    def create_sample_training_data(self):
        """Create sample training data for demonstration."""
        
        samples = [
            # Amis samples
            {
                "language": "ami",
                "user": "How do I say 'hello' in Amis?",
                "assistant": "In Amis, 'hello' is 'Nga'ay ho'.",
                "translation": "Hello",
                "pronunciation": "Nga-ay ho (IPA: ŋaʔaj ho)",
                "cultural_context": "This is a common greeting used in daily conversations among Amis people."
            },
            {
                "language": "ami",
                "user": "Teach me to say 'thank you'",
                "assistant": "To say 'thank you' in Amis, say 'Tireng'.",
                "translation": "Thank you",
                "pronunciation": "Ti-reng (IPA: tiɾɛŋ)",
                "cultural_context": "Expressing gratitude is important in Amis culture, especially after receiving food or help."
            },
            
            # Paiwan samples
            {
                "language": "pwn",
                "user": "What does 'masalu' mean?",
                "assistant": "'Masalu' means 'hello' or 'peace be with you' in Paiwan.",
                "translation": "Hello / Peace",
                "pronunciation": "Ma-sa-lu",
                "cultural_context": "Masalu is both a greeting and a wish for peace, central to Paiwan values."
            },
            
            # Maori samples
            {
                "language": "mi",
                "user": "How do I greet someone in Maori?",
                "assistant": "You can say 'Kia ora' which means 'hello' or 'be well'.",
                "translation": "Hello / Be well",
                "pronunciation": "Kee-ah o-rah (IPA: kiɑ ɔɾɑ)",
                "cultural_context": "Kia ora is one of the most common Maori greetings and is widely used in New Zealand."
            },
            
            # Hawaiian samples
            {
                "language": "haw",
                "user": "What is 'aloha'?",
                "assistant": "'Aloha' means love, affection, peace, compassion, and mercy in Hawaiian. It's used as both a greeting and farewell.",
                "translation": "Hello / Goodbye / Love",
                "pronunciation": "ah-LO-ha (IPA: ɑˈlo.hɑ)",
                "cultural_context": "Aloha embodies the Hawaiian spirit of love and mutual respect. It's more than a word—it's a way of life."
            },
            
            # Navajo samples
            {
                "language": "nv",
                "user": "How do I say 'hello' in Navajo?",
                "assistant": "You can say 'Yá'át'ééh' which means 'hello' or 'it is good'.",
                "translation": "Hello / It is good",
                "pronunciation": "YAH-ah-teh (IPA: jɑːʔɑːteːh)",
                "cultural_context": "This greeting acknowledges goodness and balance, important concepts in Navajo philosophy."
            },
        ]
        
        # Write samples to language-specific JSONL files
        language_data = {}
        for sample in samples:
            lang = sample["language"]
            if lang not in language_data:
                language_data[lang] = []
            
            formatted = self.format_chat_conversation(
                language_code=lang,
                user_message=sample["user"],
                assistant_message=sample["assistant"],
                translation=sample.get("translation"),
                pronunciation=sample.get("pronunciation"),
                cultural_context=sample.get("cultural_context")
            )
            language_data[lang].append(formatted)
        
        # Write to JSONL files
        for lang, data in language_data.items():
            output_file = self.output_dir / f"{lang}_train.jsonl"
            with open(output_file, "w", encoding="utf-8") as f:
                for item in data:
                    f.write(json.dumps(item, ensure_ascii=False) + "\n")
            
            print(f"✓ Created {output_file} with {len(data)} samples")
    
    def validate_jsonl(self, file_path: Path) -> bool:
        """Validate JSONL format."""
        try:
            with open(file_path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    data = json.loads(line)
                    
                    # Check required structure
                    if "messages" not in data:
                        print(f"✗ Line {i}: Missing 'messages' key")
                        return False
                    
                    messages = data["messages"]
                    if not isinstance(messages, list) or len(messages) < 2:
                        print(f"✗ Line {i}: 'messages' must be a list with at least 2 items")
                        return False
                    
                    # Check message structure
                    for msg in messages:
                        if "role" not in msg or "content" not in msg:
                            print(f"✗ Line {i}: Each message must have 'role' and 'content'")
                            return False
                        
                        if msg["role"] not in ["system", "user", "assistant"]:
                            print(f"✗ Line {i}: Invalid role '{msg['role']}'")
                            return False
            
            print(f"✓ {file_path.name} is valid")
            return True
        
        except json.JSONDecodeError as e:
            print(f"✗ JSON decode error in {file_path.name}: {e}")
            return False
        except Exception as e:
            print(f"✗ Error validating {file_path.name}: {e}")
            return False


def main():
    parser = argparse.ArgumentParser(description="Prepare indigenous language training data")
    parser.add_argument("--output", default="jsonl", help="Output directory for JSONL files")
    parser.add_argument("--create-samples", action="store_true", help="Create sample training data")
    parser.add_argument("--validate", action="store_true", help="Validate existing JSONL files")
    
    args = parser.parse_args()
    
    preparer = TrainingDataPreparer(output_dir=args.output)
    
    if args.create_samples:
        print("Creating sample training data...")
        preparer.create_sample_training_data()
        print("\n✓ Sample data created successfully!")
    
    if args.validate:
        print("\nValidating JSONL files...")
        jsonl_files = list(preparer.output_dir.glob("*.jsonl"))
        
        if not jsonl_files:
            print("No JSONL files found to validate")
        else:
            all_valid = True
            for file in jsonl_files:
                if not preparer.validate_jsonl(file):
                    all_valid = False
            
            if all_valid:
                print("\n✓ All files are valid!")
            else:
                print("\n✗ Some files have validation errors")
                return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
