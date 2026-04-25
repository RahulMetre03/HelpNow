from fastapi import FastAPI
from apscheduler.schedulers.background import BackgroundScheduler
import asyncio
import asyncpg
import os

app = FastAPI()
from dotenv import load_dotenv

# Load the .env file (looks in the current directory by default)
load_dotenv() 

# Access variables using os.getenv


DATABASE_URL = os.getenv("DATABASE_URL")


async def update_expired_appointments():
    print("Checking expired appointments...")

    try:
        # asyncpg requires postgresql://
        db_url = DATABASE_URL.replace(
            "postgresql+asyncpg://",
            "postgresql://"
        )

        conn = await asyncpg.connect(db_url)

        query = """
        UPDATE appointments
        SET status = 'completed'
        WHERE
            scheduled_at + (duration_minutes * INTERVAL '1 minute') < NOW()
            AND status IN ('pending', 'confirmed');
        """

        result = await conn.execute(query)

        print(f"Update result: {result}")

        await conn.close()

    except Exception as e:
        print("Cron job failed:", str(e))


def run_cron():
    asyncio.run(update_expired_appointments())


scheduler = BackgroundScheduler()

# Runs every 6 hours
scheduler.add_job(
    run_cron,
    "interval",
    hours=6
)


@app.on_event("startup")
def start_scheduler():
    scheduler.start()
    print("Cron job started...")


@app.on_event("shutdown")
def stop_scheduler():
    scheduler.shutdown()
    print("Cron job stopped...")


@app.get("/health-check")
def health_check():
    return "OK"