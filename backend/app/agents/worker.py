import asyncio
import logging
from app.db.database import db
from app.agents.orchestrator import orchestrator

logger = logging.getLogger("hiring_wallah.worker")

class AgentWorker:
    def __init__(self):
        self.is_running = False

    async def start(self):
        self.is_running = True
        logger.info("Agent Worker Loop Started.")
        while self.is_running:
            try:
                tasks = await db.get_pending_tasks(limit=5)
                for task in tasks:
                    await self.process_task(task)
            except Exception as e:
                logger.error(f"Worker Loop Error: {e}")
            await asyncio.sleep(2) # Polling interval

    async def stop(self):
        self.is_running = False
        logger.info("Agent Worker Loop Stopped.")

    async def process_task(self, task: dict):
        task_id = task['id']
        task_type = task['task_type']
        payload = task['payload']

        logger.info(f"Processing Task: {task_type} (ID: {task_id})")
        await db.update_agent_task(task_id, status='processing')

        try:
            if task_type == 'job_created':
                job_id = payload.get('job_id')
                if job_id:
                    await orchestrator.on_job_created(job_id)
            elif task_type == 'resume_uploaded':
                job_id = payload.get('job_id')
                resume_id = payload.get('resume_id')
                if job_id and resume_id:
                    await orchestrator.on_resume_uploaded(job_id, resume_id)
            else:
                logger.warning(f"Unknown task type: {task_type}")

            await db.update_agent_task(task_id, status='completed')
            logger.info(f"Task Completed: {task_id}")
        except Exception as e:
            logger.error(f"Task Failed {task_id}: {e}")
            await db.update_agent_task(task_id, status='failed', error_message=str(e))

worker = AgentWorker()
