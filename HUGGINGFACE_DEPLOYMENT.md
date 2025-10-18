# Hugging Face Model Deployment Guide

## Current Status

Your fine-tuned model `elmunoz42/llama3-ev-finetuned-v-0-0-2` exists on Hugging Face Hub but is **not accessible via the free Inference API**. The integration code is complete and working, but we need to deploy the model properly.

## Why Your Model Isn't Working

The Hugging Face Inference API (free tier) has limitations:

1. **Not all models are automatically available** - Even public models need to be "loaded" or deployed
2. **Large models (8B parameters) require resources** - Your Llama 3 model is too large for free tier
3. **4-bit quantized models** may not be supported on the serverless Inference API
4. **Fine-tuned models** often require dedicated deployment

## Solutions (Ordered by Recommendation)

### Option 1: Use Hugging Face Inference Endpoints (Paid - Recommended for Production)

**Best for**: Production use, guaranteed uptime, fast inference

**Steps**:

1. Go to https://ui.endpoints.huggingface.co/
2. Click "Create new endpoint"
3. Select your model: `elmunoz42/llama3-ev-finetuned-v-0-0-2`
4. Choose instance type (starts at $0.60/hour)
5. Copy the endpoint URL
6. Update `.env.local`:
   ```
   HUGGINGFACE_ENDPOINT_URL=https://xxx.endpoints.huggingface.cloud
   ```

**Cost**: ~$0.60-$2.00/hour depending on instance size

### Option 2: Deploy as Hugging Face Space with Gradio (Free)

**Best for**: Testing, demos, low traffic

**Steps**:

1. Create a new Space at https://huggingface.co/new-space
2. Choose "Gradio" as the SDK
3. Add this `app.py`:

   ```python
   import gradio as gr
   from transformers import AutoTokenizer, AutoModelForCausalLM
   import torch

   model_id = "elmunoz42/llama3-ev-finetuned-v-0-0-2"
   tokenizer = AutoTokenizer.from_pretrained(model_id)
   model = AutoModelForCausalLM.from_pretrained(
       model_id,
       load_in_4bit=True,
       device_map="auto"
   )

   def chat(message, temperature=0.7, max_tokens=500):
       inputs = tokenizer(message, return_tensors="pt").to(model.device)
       outputs = model.generate(
           **inputs,
           max_new_tokens=max_tokens,
           temperature=temperature,
           do_sample=True
       )
       response = tokenizer.decode(outputs[0], skip_special_tokens=True)
       return response

   iface = gr.Interface(
       fn=chat,
       inputs=[
           gr.Textbox(label="Message"),
           gr.Slider(0, 1, value=0.7, label="Temperature"),
           gr.Slider(50, 1000, value=500, label="Max Tokens")
       ],
       outputs=gr.Textbox(label="Response"),
       title="EV Fine-tuned Llama 3 Chat",
       description="Chat with a Llama 3 model fine-tuned on EV technical data"
   )

   if __name__ == "__main__":
       iface.launch()
   ```

4. The Space will provide a URL like `https://hf.space/elmunoz42/llama3-ev-chat`
5. Use the Space's API endpoint in your backend

**Limitations**:

- Slow cold starts (30-60 seconds)
- May timeout on free tier
- Limited concurrent users

### Option 3: Local Deployment with Ollama (Free, Offline)

**Best for**: Development, offline use, full control

**Steps**:

1. Install Ollama: https://ollama.ai
2. Pull a base Llama 3 model:
   ```bash
   ollama pull llama3
   ```
3. Create a Modelfile for your fine-tuned version
4. Run locally:
   ```bash
   ollama serve
   ```
5. Update backend to call `http://localhost:11434/api/generate`

**Limitations**:

- Requires significant GPU (8GB+ VRAM for 8B model)
- Need to convert your Hugging Face model to Ollama format
- Local only (can't access from deployed frontend)

### Option 4: Use a Different Model for Testing (Current Setup)

**Best for**: Immediate testing of the integration

**Status**: ✅ **Currently configured**

The code is now set to use `mistralai/Mistral-7B-Instruct-v0.1` which should be available on the Inference API. This allows you to test the full integration while you set up deployment for your fine-tuned model.

To switch back to your model later, just update the `HUGGINGFACE_MODEL_ID` in `.env.local`.

## Recommended Path Forward

1. **Now**: Test with Mistral-7B to verify the integration works ✅
2. **Short term**: Deploy your model to a Hugging Face Space (free)
3. **Long term**: Move to Inference Endpoints when you need production reliability

## Files Modified for Easy Switching

- **`backend/.env.local`**:

  - `HUGGINGFACE_TOKEN`: Your API token
  - `HUGGINGFACE_MODEL_ID`: Model to use (easily switchable)

- **`backend/chat_api/huggingface_service.py`**:
  - Reads model ID from environment variable
  - Ready to work with any compatible model

## Testing the Integration

1. Start backend: `cd backend && python manage.py runserver 8000`
2. Start frontend: `cd frontend && npm run dev`
3. Select "Llama 3 EV Fine-tuned" from model dropdown
4. Send a message about EVs
5. You should get a response from the configured Hugging Face model

## Training Data Reference

Your fine-tuning dataset is in: `county_docs/ev_quiz_finetuning.json`

It contains 33 EVITP (Electric Vehicle Infrastructure Training Program) questions covering:

- EV motors and components
- Charging standards (Level 1, 2, DC Fast Charging)
- CHAdeMO, J1772 connectors
- NEC electrical codes for EVSE
- Voltage drop calculations
- ADA compliance for charging stations

## Next Steps

Choose one of the deployment options above and follow the steps. The integration code is complete and ready to work with any deployment method!
