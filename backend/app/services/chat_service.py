import google.generativeai as genai
from app.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are a compassionate, empathetic mental health support companion called HelpNow AI. 
Your role is to:
- Listen actively and respond with genuine empathy
- Help users express and process their emotions
- Provide a safe, non-judgmental space for sharing feelings
- Offer gentle coping suggestions when appropriate
- Encourage professional help when needed

IMPORTANT RULES:
- You are NOT a therapist and must never provide clinical diagnoses
- Never prescribe medication or medical advice
- If someone expresses intent to self-harm, gently encourage them to contact emergency services or a crisis helpline
- Keep responses warm, concise, and supportive
- Ask open-ended follow-up questions to show you care
- Remember context from the current conversation"""


async def get_ai_response(messages: list[dict]) -> str:
    """Generate an empathetic AI response using Gemini."""
    try:
        model = genai.GenerativeModel(
            model_name="gemini-3-flash-preview",
            system_instruction=SYSTEM_PROMPT,
        )

        # Convert messages to Gemini format
        history = []
        for msg in messages[:-1]:  # All except the last message
            role = "user" if msg["sender"] == "user" else "model"
            history.append({"role": role, "parts": [msg["content"]]})

        chat = model.start_chat(history=history)
        last_message = messages[-1]["content"] if messages else ""

        response = chat.send_message(last_message)
        return response.text

    except Exception as e:
        print(f"Gemini API error: {e}")
        return "I'm here for you. I'm having a brief moment of difficulty, but please continue sharing — I'm listening. 💙"
