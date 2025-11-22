#!/usr/bin/env bash
# Fine-tune Indigenous Language Models using GPT-OSS or OpenAI API
# 
# Usage:
#   ./finetune.sh --method [openai|gpt-oss] --language [ami|pwn|mi|all]

set -euo pipefail

# Configuration
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
JSONL_DIR="${PROJECT_DIR}/jsonl"
MODELS_DIR="${PROJECT_DIR}/../models"
CONFIG_FILE="${PROJECT_DIR}/finetuning_config.yaml"

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Default values
METHOD="gpt-oss"
LANGUAGE="all"
BASE_MODEL="gpt2-medium"
EPOCHS=3
BATCH_SIZE=8
LEARNING_RATE=5e-5

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --method)
      METHOD="$2"
      shift 2
      ;;
    --language)
      LANGUAGE="$2"
      shift 2
      ;;
    --base-model)
      BASE_MODEL="$2"
      shift 2
      ;;
    --epochs)
      EPOCHS="$2"
      shift 2
      ;;
    --batch-size)
      BATCH_SIZE="$2"
      shift 2
      ;;
    --learning-rate)
      LEARNING_RATE="$2"
      shift 2
      ;;
    -h|--help)
      echo "Usage: $0 [OPTIONS]"
      echo ""
      echo "Options:"
      echo "  --method [openai|gpt-oss]    Fine-tuning method (default: gpt-oss)"
      echo "  --language [ami|pwn|mi|all]  Language to train (default: all)"
      echo "  --base-model MODEL           Base model name (default: gpt2-medium)"
      echo "  --epochs N                   Number of epochs (default: 3)"
      echo "  --batch-size N               Batch size (default: 8)"
      echo "  --learning-rate RATE         Learning rate (default: 5e-5)"
      echo "  -h, --help                   Show this help message"
      exit 0
      ;;
    *)
      echo -e "${RED}✗ Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

echo -e "${GREEN}🤖 Indigenous Language LLM Fine-tuning${NC}"
echo "Method: ${METHOD}"
echo "Language: ${LANGUAGE}"
echo "Base Model: ${BASE_MODEL}"
echo ""

# Create models directory
mkdir -p "${MODELS_DIR}"

# Get list of JSONL files
if [ "${LANGUAGE}" = "all" ]; then
  JSONL_FILES=("${JSONL_DIR}"/*.jsonl)
else
  JSONL_FILES=("${JSONL_DIR}/${LANGUAGE}_train.jsonl")
fi

if [ ${#JSONL_FILES[@]} -eq 0 ]; then
  echo -e "${RED}✗ No training files found${NC}"
  exit 1
fi

# Fine-tuning function for OpenAI API
finetune_openai() {
  local jsonl_file="$1"
  local lang_code
  lang_code=$(basename "${jsonl_file}" _train.jsonl)
  
  echo -e "${YELLOW}📤 Uploading ${lang_code} training data to OpenAI...${NC}"
  
  # Upload file
  local file_id
  file_id=$(openai api files.create \
    -f "${jsonl_file}" \
    -p fine-tune \
    | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
  
  if [ -z "${file_id}" ]; then
    echo -e "${RED}✗ Failed to upload training file${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ File uploaded: ${file_id}${NC}"
  
  # Create fine-tuning job
  echo -e "${YELLOW}🔧 Starting fine-tuning job for ${lang_code}...${NC}"
  
  local job_id
  job_id=$(openai api fine_tuning.jobs.create \
    -t "${file_id}" \
    -m "${BASE_MODEL}" \
    --suffix "${lang_code}-chatbot" \
    --n_epochs "${EPOCHS}" \
    | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
  
  if [ -z "${job_id}" ]; then
    echo -e "${RED}✗ Failed to create fine-tuning job${NC}"
    return 1
  fi
  
  echo -e "${GREEN}✓ Fine-tuning job created: ${job_id}${NC}"
  echo ""
  echo "To check status: openai api fine_tuning.jobs.retrieve -i ${job_id}"
  echo ""
}

# Fine-tuning function for GPT-OSS (Hugging Face Transformers)
finetune_gpt_oss() {
  local jsonl_file="$1"
  local lang_code
  lang_code=$(basename "${jsonl_file}" _train.jsonl)
  
  echo -e "${YELLOW}🔧 Fine-tuning ${lang_code} with GPT-OSS...${NC}"
  
  # Output directory for this model
  local output_dir="${MODELS_DIR}/${lang_code}-chatbot"
  mkdir -p "${output_dir}"
  
  # Python training script
  cat > /tmp/train_${lang_code}.py << 'EOF'
import sys
import json
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from datasets import Dataset
import torch

def load_jsonl(file_path):
    """Load JSONL training data."""
    data = []
    with open(file_path, 'r', encoding='utf-8') as f:
        for line in f:
            item = json.loads(line)
            messages = item['messages']
            # Combine messages into a single text
            text = ""
            for msg in messages:
                role = msg['role']
                content = msg['content']
                text += f"[{role.upper()}] {content}\n"
            data.append({'text': text})
    return data

def main():
    jsonl_file = sys.argv[1]
    model_name = sys.argv[2]
    output_dir = sys.argv[3]
    epochs = int(sys.argv[4])
    batch_size = int(sys.argv[5])
    learning_rate = float(sys.argv[6])
    
    print(f"Loading model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForCausalLM.from_pretrained(model_name)
    
    # Set padding token if not set
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token
    
    print(f"Loading training data from: {jsonl_file}")
    train_data = load_jsonl(jsonl_file)
    dataset = Dataset.from_list(train_data)
    
    def tokenize_function(examples):
        return tokenizer(
            examples['text'],
            truncation=True,
            max_length=512,
            padding='max_length'
        )
    
    tokenized_dataset = dataset.map(tokenize_function, batched=True)
    
    data_collator = DataCollatorForLanguageModeling(
        tokenizer=tokenizer,
        mlm=False
    )
    
    training_args = TrainingArguments(
        output_dir=output_dir,
        num_train_epochs=epochs,
        per_device_train_batch_size=batch_size,
        learning_rate=learning_rate,
        warmup_steps=100,
        logging_steps=10,
        save_steps=500,
        save_total_limit=3,
        logging_dir=f"{output_dir}/logs",
        report_to="none"
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_dataset,
        data_collator=data_collator
    )
    
    print("Starting training...")
    trainer.train()
    
    print(f"Saving model to: {output_dir}")
    trainer.save_model(output_dir)
    tokenizer.save_pretrained(output_dir)
    
    print("✓ Training complete!")

if __name__ == "__main__":
    main()
EOF
  
  # Run training
  python3 /tmp/train_${lang_code}.py \
    "${jsonl_file}" \
    "${BASE_MODEL}" \
    "${output_dir}" \
    "${EPOCHS}" \
    "${BATCH_SIZE}" \
    "${LEARNING_RATE}"
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Model saved to: ${output_dir}${NC}"
    echo ""
  else
    echo -e "${RED}✗ Training failed${NC}"
    return 1
  fi
  
  # Clean up
  rm /tmp/train_${lang_code}.py
}

# Main fine-tuning loop
for jsonl_file in "${JSONL_FILES[@]}"; do
  if [ ! -f "${jsonl_file}" ]; then
    continue
  fi
  
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${GREEN}Processing: $(basename "${jsonl_file}")${NC}"
  echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  
  case "${METHOD}" in
    openai)
      finetune_openai "${jsonl_file}"
      ;;
    gpt-oss)
      finetune_gpt_oss "${jsonl_file}"
      ;;
    *)
      echo -e "${RED}✗ Unknown method: ${METHOD}${NC}"
      exit 1
      ;;
  esac
done

echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✓ Fine-tuning complete!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Next steps:"
echo "  1. Evaluate models: python evaluate_model.py --model-dir ${MODELS_DIR}"
echo "  2. Deploy to production: Update backend API to use fine-tuned models"
echo "  3. Collect user feedback for continuous improvement"
echo ""
