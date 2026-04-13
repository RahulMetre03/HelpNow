import logging
import sys
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import DeclarativeBase
from app.config import get_settings

logger = logging.getLogger(__name__)
logging.basicConfig(level=logging.INFO, handlers=[logging.StreamHandler(sys.stdout)])

settings = get_settings()

engine = create_async_engine(settings.DATABASE_URL)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    logger.info("DB dependency called")

    async with AsyncSessionLocal() as session:
        try:
            yield session
        except Exception as e:
            logger.error(f"DB ERROR: {str(e)}", exc_info=True)
            raise
        finally:
            logger.info("Closing DB session")
            await session.close()
