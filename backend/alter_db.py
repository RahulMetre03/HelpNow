import asyncio
from sqlalchemy import text
from app.database import engine

async def run():
    async with engine.begin() as conn:
        try:
            await conn.execute(text("ALTER TABLE chat_sessions ADD COLUMN appointment_id UUID;"))
            print("Successfully added column.")
        except Exception as e:
            print(f"Error: {e}")
            
        try:
            await conn.execute(text("ALTER TABLE chat_sessions ADD CONSTRAINT fk_chat_session_appointment FOREIGN KEY (appointment_id) REFERENCES appointments(id);"))
            print("Successfully added FK.")
        except Exception as e:
            print(f"Error adding FK: {e}")

asyncio.run(run())
