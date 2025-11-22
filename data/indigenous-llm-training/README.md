# Indigenous Language LLM Fine-tuning Data

## Overview
Training data for fine-tuning language models on indigenous languages, supporting the ModernReader Indigenous AI Chatbot.

## Supported Languages (28+)
### Taiwan Indigenous Languages (13)
- Amis (ami) - 阿美語
- Paiwan (pwn) - 排灣語
- Seediq/Truku (trv) - 太魯閣語
- Atayal (tay) - 泰雅語
- Bunun (bnn) - 布農語
- Puyuma (pyu) - 卑南語
- Rukai (dru) - 魯凱語
- Tsou (tsu) - 鄒語
- Saisiyat (xsy) - 賽夏語
- Tao/Yami (tao) - 達悟語（雅美語）
- Thao (ssf) - 邵語
- Kavalan (ckv) - 噶瑪蘭語
- Sakizaya (szy) - 撒奇萊雅語

### Global Indigenous Languages (15+)
- Maori (mi) - Māori
- Hawaiian (haw) - ʻŌlelo Hawaiʻi
- Navajo (nv) - Diné bizaad
- Quechua (qu) - Runa Simi
- Guarani (gn) - Avañe'ẽ
- Aymara (ay)
- Inuktitut (iu) - ᐃᓄᒃᑎᑐᑦ
- Northern Sami (se) - Davvisámegiella
- Swahili (sw) - Kiswahili
- Zulu (zu) - isiZulu
- Basque (eu) - Euskara
- Welsh (cy) - Cymraeg
- Hmong (hmn) - Hmoob
- Tibetan (bo) - བོད་སྐད་
- Uyghur (ug) - ئۇيغۇرچە

## Data Structure
```
indigenous-llm-training/
├── README.md (this file)
├── raw/                    # Raw corpus from multiple sources
│   ├── ami/
│   ├── pwn/
│   ├── trv/
│   └── ...
├── processed/              # Cleaned and aligned data
│   ├── train/
│   ├── validation/
│   └── test/
├── augmented/              # Synthetic data for low-resource languages
├── jsonl/                  # JSONL format for GPT fine-tuning
│   ├── ami_train.jsonl
│   ├── pwn_train.jsonl
│   └── ...
├── scripts/
│   ├── prepare_training_data.py
│   ├── validate_jsonl.py
│   └── merge_multilingual.py
└── configs/
    ├── finetuning_config.yaml
    └── language_metadata.json
```

## JSONL Format for GPT Fine-tuning
Each line is a JSON object:
```json
{"messages": [
  {"role": "system", "content": "You are an AI assistant helping users learn Amis (阿美語), an indigenous language of Taiwan."},
  {"role": "user", "content": "How do I say 'hello' in Amis?"},
  {"role": "assistant", "content": "In Amis, 'hello' is 'Nga'ay ho'. The pronunciation is similar to 'nga-ay ho'. This is a common greeting used in daily conversations."}
]}
```

## Data Sources
- **Community Contributions**: User-generated conversations from the Indigenous Chatbot
- **Handwriting Recognition**: Confirmed text from handwriting training
- **Pronunciation Training**: Audio transcripts and romanization
- **Public Corpus**: 
  - Taiwan Indigenous Languages Online Dictionary (原住民族語言線上辭典)
  - Formosan Language Archive (臺灣南島語言典藏)
  - UNESCO Atlas of World's Languages in Danger
  - Ethnologue data
  - Community-maintained language resources

## CARE Principles Compliance
All training data follows CARE Principles for Indigenous Data Governance:
- **C**ollective Benefit: Data supports language revitalization
- **A**uthority to Control: Indigenous communities maintain data sovereignty
- **R**esponsibility: Ethical data handling and privacy protection
- **E**thics: Respectful representation and cultural sensitivity

## Fine-tuning Workflow

### 1. Data Collection
```bash
python scripts/collect_chat_logs.py --days 30 --output raw/
python scripts/collect_handwriting_samples.py --output raw/
```

### 2. Data Processing
```bash
python scripts/prepare_training_data.py \
  --input raw/ \
  --output processed/ \
  --min-quality 0.8 \
  --filter-pii
```

### 3. JSONL Conversion
```bash
python scripts/convert_to_jsonl.py \
  --input processed/train/ \
  --output jsonl/ \
  --format openai-chat
```

### 4. Validation
```bash
python scripts/validate_jsonl.py --input jsonl/
```

### 5. Fine-tuning (OpenAI or GPT-OSS)
```bash
# Option A: OpenAI API
openai api fine_tuning.jobs.create \
  -t jsonl/ami_train.jsonl \
  -m gpt-3.5-turbo \
  --suffix ami-chatbot

# Option B: GPT-OSS (Open Source)
python -m gpt_oss.train \
  --model gpt2-medium \
  --data jsonl/ami_train.jsonl \
  --output models/ami-chatbot \
  --epochs 3 \
  --batch-size 8
```

### 6. Evaluation
```bash
python scripts/evaluate_model.py \
  --model models/ami-chatbot \
  --test-data processed/test/ami/ \
  --metrics bleu,perplexity,cultural-accuracy
```

## Current Status
- ✅ Data structure created
- ⏳ Awaiting corpus collection from production usage
- ⏳ Script templates to be implemented
- ⏳ Integration with backend fine-tuning API

## Next Steps
1. Implement data collection scripts
2. Set up automated processing pipeline
3. Create evaluation benchmarks for each language
4. Establish community feedback loops
5. Deploy fine-tuned models to production

## References
- [CARE Principles](https://www.gida-global.org/care)
- [OpenAI Fine-tuning Guide](https://platform.openai.com/docs/guides/fine-tuning)
- [GPT-OSS Documentation](https://github.com/huggingface/transformers)
- [Taiwan Indigenous Languages Online Dictionary](https://e-dictionary.ilrdf.org.tw/)
