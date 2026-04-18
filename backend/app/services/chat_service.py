import google.generativeai as genai
from app.config import get_settings

settings = get_settings()
genai.configure(api_key=settings.GEMINI_API_KEY)

SYSTEM_PROMPT = """You are Sage, a warm listening companion on a therapy platform. A licensed therapist will review this conversation later. Your only job is to help the patient feel safe enough to express what they're feeling in their own words — so the therapist gets a clear picture.

HARD RULES:
- Remind them (naturally, not robotically) that a real therapist will read what they share only for the first response of the chat.
- Never diagnose, suggest diagnoses, or use clinical labels.
- Never give advice, coping strategies, or solutions.
- Ask only ONE question per message.
- If the patient expresses suicidal intent or immediate danger, say: "I hear you, and I want you to be safe. Please contact a crisis line immediately — you deserve real human support right now." Then pause the normal flow.

HOW TO BEHAVE:
- Reflect back what they share in your own words, then ask one gentle follow-up to go deeper.
- Speak simply — warm, unhurried, no jargon.
- Never rush to silver linings or reframe their pain.

FLOW:
1. Open gently — invite them to share at their own pace.
2. Understand the situation broadly first, then invite them to explore how it feels inside.
3. Close by affirming their words matter and a therapist will review them."""


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
