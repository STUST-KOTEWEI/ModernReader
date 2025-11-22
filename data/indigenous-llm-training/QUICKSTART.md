# Quick Start Guide: Fine-tuning Indigenous Language Models

## Prerequisites

### For GPT-OSS (Recommended for local development)
```bash
pip install transformers datasets torch accelerate
```

### For OpenAI API
```bash
pip install openai
export OPENAI_API_KEY="your-api-key-here"
```

## Step 1: Prepare Training Data

Generate sample training data (or use your own):
```bash
python3 prepare_training_data.py --create-samples --validate --output jsonl
```

This will create JSONL files in the `jsonl/` directory:
- `ami_train.jsonl` - Amis language (Taiwan)
- `pwn_train.jsonl` - Paiwan language (Taiwan)
- `mi_train.jsonl` - Maori language (New Zealand)
- `haw_train.jsonl` - Hawaiian language
- `nv_train.jsonl` - Navajo language

## Step 2: Choose Your Fine-tuning Method

### Option A: GPT-OSS (Local, Free)
Best for development and experimentation:

```bash
# Fine-tune all languages
./finetune.sh --method gpt-oss --language all

# Fine-tune specific language
./finetune.sh --method gpt-oss --language ami

# Custom parameters
./finetune.sh \
  --method gpt-oss \
  --language ami \
  --base-model gpt2-medium \
  --epochs 5 \
  --batch-size 4 \
  --learning-rate 3e-5
```

**Models will be saved to:** `../models/{language}-chatbot/`

### Option B: OpenAI API (Paid, Production-Quality)
Best for production deployment:

```bash
# Fine-tune with OpenAI
./finetune.sh --method openai --language ami --base-model gpt-3.5-turbo

# Check job status
openai api fine_tuning.jobs.retrieve -i ftjob-xxxxx

# List all jobs
openai api fine_tuning.jobs.list
```

## Step 3: Test Your Model

### Test GPT-OSS Model
```python
from transformers import AutoModelForCausalLM, AutoTokenizer

model_path = "../models/ami-chatbot"
tokenizer = AutoTokenizer.from_pretrained(model_path)
model = AutoModelForCausalLM.from_pretrained(model_path)

# Test conversation
prompt = "[SYSTEM] You are an Amis language teacher.\n[USER] How do I say hello?\n[ASSISTANT]"
inputs = tokenizer(prompt, return_tensors="pt")
outputs = model.generate(**inputs, max_length=200)
response = tokenizer.decode(outputs[0], skip_special_tokens=True)

print(response)
```

### Test OpenAI Fine-tuned Model
```python
import openai

response = openai.ChatCompletion.create(
    model="ft:gpt-3.5-turbo:your-org:ami-chatbot:xxxxx",
    messages=[
        {"role": "system", "content": "You are an Amis language teacher."},
        {"role": "user", "content": "How do I say hello?"}
    ]
)

print(response.choices[0].message.content)
```

## Step 4: Integrate with Backend

Update `backend/app/services/indigenous_chat.py`:

```python
# For GPT-OSS models
from transformers import AutoModelForCausalLM, AutoTokenizer

class IndigenousChatService:
    def __init__(self):
        self.models = {}
        self.tokenizers = {}
        
        # Load models for each language
        for lang in ['ami', 'pwn', 'mi']:
            model_path = f"data/models/{lang}-chatbot"
            self.tokenizers[lang] = AutoTokenizer.from_pretrained(model_path)
            self.models[lang] = AutoModelForCausalLM.from_pretrained(model_path)
    
    async def chat(self, message: str, language_code: str) -> str:
        tokenizer = self.tokenizers[language_code]
        model = self.models[language_code]
        
        prompt = f"[USER] {message}\n[ASSISTANT]"
        inputs = tokenizer(prompt, return_tensors="pt")
        outputs = model.generate(**inputs, max_length=200)
        response = tokenizer.decode(outputs[0], skip_special_tokens=True)
        
        return response
```

## Adding More Training Data

### From User Conversations
```python
# Collect from database
python scripts/collect_chat_logs.py --days 30 --min-rating 4

# Process and add to training set
python prepare_training_data.py --input collected/ --output jsonl/ --append
```

### From Community Contributions
```python
# Import community-submitted phrases
python scripts/import_community_data.py --source community_phrases.csv

# Validate and merge
python prepare_training_data.py --validate --merge
```

## Monitoring & Evaluation

### Evaluate Model Quality
```bash
python scripts/evaluate_model.py \
  --model ../models/ami-chatbot \
  --test-data test/ \
  --metrics bleu,perplexity
```

### Track Fine-tuning Metrics
```bash
tensorboard --logdir ../models/ami-chatbot/logs
```

## Continuous Improvement Loop

1. **Collect**: Gather user interactions and feedback
2. **Filter**: Apply quality filters and CARE principles
3. **Augment**: Generate synthetic data for low-resource scenarios
4. **Train**: Fine-tune on expanded dataset
5. **Evaluate**: Test on held-out set + community review
6. **Deploy**: Update production models
7. **Monitor**: Track user satisfaction and language accuracy

## Troubleshooting

### Out of Memory
```bash
# Reduce batch size
./finetune.sh --batch-size 2

# Use smaller base model
./finetune.sh --base-model gpt2-small
```

### Poor Quality Results
- Increase training data (aim for 500+ samples per language)
- Use data augmentation
- Increase epochs (3-10)
- Get native speaker review

### Slow Training
- Use GPU: `export CUDA_VISIBLE_DEVICES=0`
- Enable mixed precision training
- Use distributed training for large datasets

## Resources

- Sample training data: `jsonl/*.jsonl`
- Configuration: `finetuning_config.yaml`
- Scripts: `prepare_training_data.py`, `finetune.sh`
- Models: `../models/{language}-chatbot/`

## Support

For questions or issues:
- Check backend API logs: `backend/app/services/indigenous_chat.py`
- Review training logs: `../models/{language}-chatbot/logs/`
- Community: Submit issues to ModernReader GitHub

---

**Next Steps:**
1. Run `./finetune.sh --method gpt-oss --language ami` to start
2. Test the model with sample conversations
3. Integrate with the backend API
4. Deploy and gather real user feedback
5. Iterate and improve!
