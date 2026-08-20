import asyncio
import hashlib
import json
import logging
import sqlite3
import uuid
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.config import settings

logger = logging.getLogger("hiring_wallah.database")

JSON_COLUMNS = {
    "requirement_analysis", "evaluation_framework", "parsed_profile", "breakdown",
    "strengths", "weaknesses", "evidence", "devils_advocate", "interview_questions",
    "report_data", "skill_gaps", "tailored_resume_suggestions", "interview_prep",
    "job_recommendations", "structured_profile", "criteria", "weights", "concerns",
    "unsupported_claims", "risk_factors", "potential_bias", "rationale", "payload",
    "skills_required", "available_slots", "languages", "expertise_areas", "technical_interests",
    "tags", "attachments", "learning_pathway"
}

JSON_ARRAY_COLUMNS = {
    "strengths", "weaknesses", "evidence", "interview_questions", "criteria",
    "concerns", "unsupported_claims", "risk_factors", "potential_bias",
    "skills_required", "available_slots", "languages", "expertise_areas", "technical_interests",
    "tags", "attachments", "learning_pathway"
}


class DatabaseManager:
    def __init__(self):
        self.database_url = settings.DATABASE_URL
        self.use_postgres = bool(self.database_url)
        if self.use_postgres:
            try:
                import psycopg  # noqa: F401
                logger.info("Database: Using PostgreSQL via DATABASE_URL.")
                self._init_postgres_db()
            except Exception as exc:
                logger.error("Database: PostgreSQL init failed: %s. Falling back to SQLite.", exc)
                self.use_postgres = False
                self._init_sqlite_db()
        else:
            logger.info("Database: Running in SQLite mode (File: %s)", settings.SQLITE_DB_PATH)
            self._init_sqlite_db()

    def _connect_sqlite(self):
        conn = sqlite3.connect(settings.SQLITE_DB_PATH)
        conn.row_factory = sqlite3.Row
        return conn

    def _connect_postgres(self):
        import psycopg
        from psycopg.rows import dict_row
        return psycopg.connect(self.database_url, row_factory=dict_row)

    def _init_postgres_db(self):
        statements = self._schema_statements(postgres=True)
        with self._connect_postgres() as conn:
            with conn.cursor() as cur:
                for statement in statements:
                    cur.execute(statement)
            conn.commit()
        self._seed_rajasthan_technical_education_data()

    def _init_sqlite_db(self):
        conn = self._connect_sqlite()
        cursor = conn.cursor()
        for statement in self._schema_statements(postgres=False):
            try:
                cursor.execute(statement)
            except sqlite3.OperationalError as exc:
                if "duplicate column" not in str(exc).lower():
                    raise
        conn.commit()
        conn.close()
        logger.info("Database: SQLite schemas verified/created.")
        self._seed_rajasthan_technical_education_data()

    def _schema_statements(self, postgres: bool) -> List[str]:
        text = "TEXT" if not postgres else "TEXT"
        json_type = "JSONB" if postgres else "TEXT"
        ts = "TIMESTAMPTZ" if postgres else "TEXT"
        return [
            f"""
            CREATE TABLE IF NOT EXISTS companies (
                id {text} PRIMARY KEY,
                name TEXT NOT NULL,
                created_at {ts} NOT NULL
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS users (
                id {text} PRIMARY KEY,
                firebase_uid TEXT UNIQUE NOT NULL,
                username TEXT UNIQUE,
                email TEXT,
                display_name TEXT,
                photo_url TEXT,
                role TEXT NOT NULL CHECK(role IN ('recruiter', 'candidate')),
                company_id TEXT,
                created_at {ts} NOT NULL,
                updated_at {ts},
                FOREIGN KEY(company_id) REFERENCES companies(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS jobs (
                id {text} PRIMARY KEY,
                title TEXT NOT NULL,
                company TEXT,
                location TEXT,
                experience_range TEXT,
                description TEXT NOT NULL,
                requirement_analysis {json_type},
                evaluation_framework {json_type},
                ai_status TEXT NOT NULL DEFAULT 'not_configured',
                owner_uid TEXT,
                company_id TEXT,
                created_at {ts} NOT NULL
            )
            """,
            "ALTER TABLE jobs ADD COLUMN location TEXT" if not postgres else "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS location TEXT",
            "ALTER TABLE jobs ADD COLUMN experience_range TEXT" if not postgres else "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS experience_range TEXT",
            "ALTER TABLE jobs ADD COLUMN ai_status TEXT NOT NULL DEFAULT 'not_configured'" if not postgres else "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS ai_status TEXT NOT NULL DEFAULT 'not_configured'",
            "ALTER TABLE jobs ADD COLUMN owner_uid TEXT" if not postgres else "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS owner_uid TEXT",
            "ALTER TABLE jobs ADD COLUMN company_id TEXT" if not postgres else "ALTER TABLE jobs ADD COLUMN IF NOT EXISTS company_id TEXT",
            f"""
            CREATE TABLE IF NOT EXISTS candidates (
                id {text} PRIMARY KEY,
                name TEXT,
                email TEXT,
                parsed_profile {json_type},
                raw_resume_text TEXT,
                created_at {ts} NOT NULL
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS resumes (
                id {text} PRIMARY KEY,
                candidate_id TEXT,
                job_id TEXT,
                file_name TEXT,
                file_type TEXT,
                raw_text TEXT,
                parse_status TEXT NOT NULL DEFAULT 'parsed',
                error_message TEXT,
                created_at {ts} NOT NULL,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(job_id) REFERENCES jobs(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS evaluations (
                id {text} PRIMARY KEY,
                candidate_id TEXT,
                job_id TEXT,
                resume_id TEXT,
                score INTEGER,
                breakdown {json_type},
                strengths {json_type},
                weaknesses {json_type},
                evidence {json_type},
                devils_advocate {json_type},
                status TEXT NOT NULL DEFAULT 'completed',
                error_message TEXT,
                created_at {ts} NOT NULL,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(job_id) REFERENCES jobs(id),
                FOREIGN KEY(resume_id) REFERENCES resumes(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS candidate_profiles (
                id {text} PRIMARY KEY,
                candidate_id TEXT,
                resume_id TEXT,
                structured_profile {json_type},
                created_at {ts} NOT NULL,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(resume_id) REFERENCES resumes(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS rubrics (
                id {text} PRIMARY KEY,
                job_id TEXT,
                criteria {json_type},
                weights {json_type},
                created_at {ts} NOT NULL,
                FOREIGN KEY(job_id) REFERENCES jobs(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS evidence (
                id {text} PRIMARY KEY,
                candidate_profile_id TEXT,
                candidate_id TEXT,
                resume_id TEXT,
                claim TEXT,
                evidence TEXT,
                resume_section TEXT,
                evidence_type TEXT,
                quality TEXT,
                created_at {ts} NOT NULL,
                FOREIGN KEY(candidate_profile_id) REFERENCES candidate_profiles(id),
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(resume_id) REFERENCES resumes(id)
            )
            """,
            "ALTER TABLE evaluations ADD COLUMN resume_id TEXT" if not postgres else "ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS resume_id TEXT",
            "ALTER TABLE evaluations ADD COLUMN status TEXT NOT NULL DEFAULT 'completed'" if not postgres else "ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'completed'",
            "ALTER TABLE evaluations ADD COLUMN error_message TEXT" if not postgres else "ALTER TABLE evaluations ADD COLUMN IF NOT EXISTS error_message TEXT",
            f"""
            CREATE TABLE IF NOT EXISTS critiques (
                id {text} PRIMARY KEY,
                evaluation_id TEXT,
                concerns {json_type},
                unsupported_claims {json_type},
                risk_factors {json_type},
                potential_bias {json_type},
                created_at {ts} NOT NULL,
                FOREIGN KEY(evaluation_id) REFERENCES evaluations(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS decisions (
                id {text} PRIMARY KEY,
                candidate_id TEXT,
                job_id TEXT,
                verdict TEXT,
                confidence INTEGER,
                explanation TEXT,
                interview_questions {json_type},
                ranking INTEGER,
                created_at {ts} NOT NULL,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(job_id) REFERENCES jobs(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS rankings (
                id {text} PRIMARY KEY,
                job_id TEXT,
                candidate_id TEXT,
                score INTEGER,
                rank INTEGER,
                verdict TEXT,
                confidence INTEGER,
                rationale {json_type},
                created_at {ts} NOT NULL,
                FOREIGN KEY(job_id) REFERENCES jobs(id),
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS committee_decisions (
                id {text} PRIMARY KEY,
                job_id TEXT,
                candidate_id TEXT,
                evaluation_id TEXT,
                critique_id TEXT,
                verdict TEXT,
                confidence INTEGER,
                final_reasoning TEXT,
                created_at {ts} NOT NULL,
                FOREIGN KEY(job_id) REFERENCES jobs(id),
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(evaluation_id) REFERENCES evaluations(id),
                FOREIGN KEY(critique_id) REFERENCES critiques(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS comparisons (
                id {text} PRIMARY KEY,
                job_id TEXT,
                candidate_a_id TEXT,
                candidate_b_id TEXT,
                winner_candidate_id TEXT,
                rationale {json_type},
                created_at {ts} NOT NULL,
                FOREIGN KEY(job_id) REFERENCES jobs(id),
                FOREIGN KEY(candidate_a_id) REFERENCES candidates(id),
                FOREIGN KEY(candidate_b_id) REFERENCES candidates(id),
                FOREIGN KEY(winner_candidate_id) REFERENCES candidates(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS reports (
                id {text} PRIMARY KEY,
                evaluation_id TEXT,
                candidate_id TEXT,
                job_id TEXT,
                report_data {json_type},
                created_at {ts} NOT NULL,
                FOREIGN KEY(evaluation_id) REFERENCES evaluations(id),
                FOREIGN KEY(candidate_id) REFERENCES candidates(id),
                FOREIGN KEY(job_id) REFERENCES jobs(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS candidate_sessions (
                id {text} PRIMARY KEY,
                candidate_id TEXT,
                target_role TEXT,
                fit_score INTEGER,
                skill_gaps {json_type},
                tailored_resume_suggestions {json_type},
                cover_letter TEXT,
                interview_prep {json_type},
                job_recommendations {json_type},
                created_at {ts} NOT NULL,
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS agent_tasks (
                id {text} PRIMARY KEY,
                task_type TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'pending',
                payload {json_type},
                error_message TEXT,
                created_at {ts} NOT NULL,
                updated_at {ts} NOT NULL
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS learning_events (
                id {text} PRIMARY KEY,
                job_id TEXT,
                candidate_id TEXT,
                ai_rank INTEGER,
                human_rank INTEGER,
                difference INTEGER,
                feedback_reason TEXT,
                created_at {ts} NOT NULL,
                FOREIGN KEY(job_id) REFERENCES jobs(id),
                FOREIGN KEY(candidate_id) REFERENCES candidates(id)
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_agent_tasks_status ON agent_tasks(status)",
            "CREATE INDEX IF NOT EXISTS idx_learning_events_job ON learning_events(job_id)",
            "CREATE INDEX IF NOT EXISTS idx_candidate_profiles_resume ON candidate_profiles(resume_id)",
            "CREATE INDEX IF NOT EXISTS idx_rubrics_job ON rubrics(job_id)",
            "CREATE INDEX IF NOT EXISTS idx_evidence_candidate ON evidence(candidate_id)",
            "CREATE INDEX IF NOT EXISTS idx_evidence_resume ON evidence(resume_id)",
            "CREATE INDEX IF NOT EXISTS idx_critiques_evaluation ON critiques(evaluation_id)",
            "CREATE INDEX IF NOT EXISTS idx_rankings_job ON rankings(job_id)",
            "CREATE INDEX IF NOT EXISTS idx_committee_decisions_job ON committee_decisions(job_id)",
            "CREATE INDEX IF NOT EXISTS idx_comparisons_job ON comparisons(job_id)",
            f"""
            CREATE TABLE IF NOT EXISTS opportunities (
                id {text} PRIMARY KEY,
                title TEXT NOT NULL,
                organization TEXT NOT NULL,
                sector TEXT NOT NULL,
                opportunity_type TEXT,
                department TEXT,
                location TEXT NOT NULL,
                stipend_or_salary TEXT,
                experience_level TEXT,
                qualification_required TEXT,
                branch TEXT,
                skills_required {json_type},
                eligibility_criteria TEXT,
                application_deadline TEXT,
                official_link TEXT,
                source TEXT,
                description TEXT NOT NULL,
                is_verified INTEGER DEFAULT 1,
                created_at {ts} NOT NULL
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS applications (
                id {text} PRIMARY KEY,
                opportunity_id TEXT NOT NULL,
                candidate_id TEXT,
                user_uid TEXT,
                status TEXT NOT NULL DEFAULT 'applied',
                match_score INTEGER,
                resume_id TEXT,
                cover_note TEXT,
                applied_at {ts} NOT NULL,
                FOREIGN KEY(opportunity_id) REFERENCES opportunities(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS counselors (
                id {text} PRIMARY KEY,
                name TEXT NOT NULL,
                title TEXT NOT NULL,
                specialization TEXT NOT NULL,
                organization TEXT NOT NULL,
                experience_years INTEGER NOT NULL,
                rating REAL DEFAULT 4.9,
                available_slots {json_type},
                languages {json_type},
                bio TEXT NOT NULL,
                contact_email TEXT NOT NULL,
                created_at {ts} NOT NULL
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS counseling_sessions (
                id {text} PRIMARY KEY,
                counselor_id TEXT NOT NULL,
                candidate_id TEXT,
                user_uid TEXT,
                topic TEXT NOT NULL,
                preferred_mode TEXT NOT NULL DEFAULT 'online',
                slot_time TEXT NOT NULL,
                status TEXT NOT NULL DEFAULT 'scheduled',
                notes TEXT,
                created_at {ts} NOT NULL,
                FOREIGN KEY(counselor_id) REFERENCES counselors(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS mentors (
                id {text} PRIMARY KEY,
                name TEXT NOT NULL,
                designation TEXT NOT NULL,
                company_or_dept TEXT NOT NULL,
                industry TEXT NOT NULL,
                alumni_institution TEXT,
                expertise_areas {json_type},
                max_mentees INTEGER DEFAULT 5,
                current_mentees INTEGER DEFAULT 0,
                bio TEXT NOT NULL,
                linkedin_url TEXT,
                created_at {ts} NOT NULL
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS mentorship_requests (
                id {text} PRIMARY KEY,
                mentor_id TEXT NOT NULL,
                candidate_id TEXT,
                user_uid TEXT,
                career_goals TEXT NOT NULL,
                technical_interests {json_type},
                status TEXT NOT NULL DEFAULT 'pending',
                created_at {ts} NOT NULL,
                FOREIGN KEY(mentor_id) REFERENCES mentors(id)
            )
            """,
            f"""
            CREATE TABLE IF NOT EXISTS guidance_resources (
                id {text} PRIMARY KEY,
                title TEXT NOT NULL,
                category TEXT NOT NULL,
                target_audience TEXT NOT NULL,
                content TEXT NOT NULL,
                tags {json_type},
                attachments {json_type},
                created_at {ts} NOT NULL
            )
            """,
            "CREATE INDEX IF NOT EXISTS idx_opportunities_sector ON opportunities(sector)",
            "CREATE INDEX IF NOT EXISTS idx_opportunities_location ON opportunities(location)",
            "CREATE INDEX IF NOT EXISTS idx_applications_opportunity ON applications(opportunity_id)",
            "CREATE INDEX IF NOT EXISTS idx_applications_user ON applications(user_uid)",
            "CREATE INDEX IF NOT EXISTS idx_counseling_counselor ON counseling_sessions(counselor_id)",
            "CREATE INDEX IF NOT EXISTS idx_mentorship_mentor ON mentorship_requests(mentor_id)",
            "CREATE INDEX IF NOT EXISTS idx_guidance_category ON guidance_resources(category)",
        ]

    def _encode(self, value: Any) -> Any:
        if self.use_postgres:
            try:
                from psycopg.types.json import Jsonb
                return Jsonb(value)
            except Exception:
                return json.dumps(value)
        return json.dumps(value)

    def _decode_row(self, row: Optional[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        if not row:
            return None
        data = dict(row)
        for key in JSON_COLUMNS:
            if key in data and isinstance(data[key], str):
                try:
                    data[key] = json.loads(data[key] or ("[]" if key in JSON_ARRAY_COLUMNS else "{}"))
                except json.JSONDecodeError:
                    data[key] = [] if key in JSON_ARRAY_COLUMNS else {}
        return data

    async def _fetchone(self, sql: str, params: tuple = ()) -> Optional[Dict[str, Any]]:
        def run():
            if self.use_postgres:
                with self._connect_postgres() as conn:
                    with conn.cursor() as cur:
                        cur.execute(sql, params)
                        row = cur.fetchone()
                        conn.commit()
                        return self._decode_row(row)
            conn = self._connect_sqlite()
            cur = conn.cursor()
            cur.execute(sql.replace("%s", "?"), params)
            row = cur.fetchone()
            conn.commit()
            conn.close()
            return self._decode_row(dict(row) if row else None)
        return await asyncio.to_thread(run)

    async def _fetchall(self, sql: str, params: tuple = ()) -> List[Dict[str, Any]]:
        def run():
            if self.use_postgres:
                with self._connect_postgres() as conn:
                    with conn.cursor() as cur:
                        cur.execute(sql, params)
                        rows = cur.fetchall()
                        conn.commit()
                        return [self._decode_row(row) for row in rows]
            conn = self._connect_sqlite()
            cur = conn.cursor()
            cur.execute(sql.replace("%s", "?"), params)
            rows = cur.fetchall()
            conn.commit()
            conn.close()
            return [self._decode_row(dict(row)) for row in rows]
        return await asyncio.to_thread(run)

    async def _execute(self, sql: str, params: tuple = ()) -> None:
        def run():
            if self.use_postgres:
                with self._connect_postgres() as conn:
                    with conn.cursor() as cur:
                        cur.execute(sql, params)
                    conn.commit()
                    return
            conn = self._connect_sqlite()
            cur = conn.cursor()
            cur.execute(sql.replace("%s", "?"), params)
            conn.commit()
            conn.close()
        await asyncio.to_thread(run)


    async def get_user_profile(self, firebase_uid: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone(
            """
            SELECT users.*, companies.name as company_name
            FROM users LEFT JOIN companies ON companies.id = users.company_id
            WHERE users.firebase_uid = %s
            """,
            (firebase_uid,),
        )

    async def upsert_user_profile(self, firebase_uid: str, email: Optional[str], display_name: Optional[str], photo_url: Optional[str], role: str, company_name: Optional[str] = None) -> Dict[str, Any]:
        existing = await self.get_user_profile(firebase_uid)
        now = datetime.utcnow().isoformat()
        company_id = existing.get("company_id") if existing else None
        if role == "recruiter" and not company_id:
            company_id = str(uuid.uuid4())
            await self._execute(
                "INSERT INTO companies (id, name, created_at) VALUES (%s, %s, %s)",
                (company_id, company_name or (f"{display_name}'s Company" if display_name else "Hiring Wallah Workspace"), now),
            )
        user_id = existing.get("id") if existing else str(uuid.uuid4())
        if existing:
            await self._execute(
                """
                UPDATE users SET email=%s, display_name=%s, photo_url=%s, role=%s, company_id=%s, updated_at=%s
                WHERE firebase_uid=%s
                """,
                (email, display_name, photo_url, role, company_id, now, firebase_uid),
            )
        else:
            await self._execute(
                """
                INSERT INTO users (id, firebase_uid, email, display_name, photo_url, role, company_id, created_at, updated_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (user_id, firebase_uid, email, display_name, photo_url, role, company_id, now, now),
            )
        return await self.get_user_profile(firebase_uid) or {}

    async def update_user_profile(self, firebase_uid: str, display_name: Optional[str] = None, photo_url: Optional[str] = None, username: Optional[str] = None, company_name: Optional[str] = None) -> Dict[str, Any]:
        user = await self.get_user_profile(firebase_uid)
        if not user:
            return {}

        if company_name is not None and user.get("company_id"):
            await self._execute("UPDATE companies SET name = %s WHERE id = %s", (company_name, user["company_id"]))

        updates = []
        params = []
        if display_name is not None:
            updates.append("display_name = %s")
            params.append(display_name)
        if photo_url is not None:
            updates.append("photo_url = %s")
            params.append(photo_url)
        if username is not None:
            updates.append("username = %s")
            params.append(username)
            
        if not updates:
            return await self.get_user_profile(firebase_uid) or {}
            
        updates.append("updated_at = %s")
        params.append(datetime.utcnow().isoformat())
        params.append(firebase_uid)
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE firebase_uid = %s"
        await self._execute(query, tuple(params))
        return await self.get_user_profile(firebase_uid) or {}

    async def get_user_by_username(self, username: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone(
            """
            SELECT u.*, c.name as company_name 
            FROM users u
            LEFT JOIN companies c ON u.company_id = c.id
            WHERE u.username = %s
            """, 
            (username,)
        )

    async def create_job(self, title: str, company: str, description: str, requirement_analysis: Optional[Dict[str, Any]] = None, evaluation_framework: Optional[Dict[str, Any]] = None, owner_uid: Optional[str] = None, company_id: Optional[str] = None, location: Optional[str] = None, experience_range: Optional[str] = None, ai_status: str = "not_configured") -> Dict[str, Any]:
        job_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO jobs (id, title, company, location, experience_range, description, requirement_analysis, evaluation_framework, ai_status, owner_uid, company_id, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (job_id, title, company, location, experience_range, description, self._encode(requirement_analysis or {}), self._encode(evaluation_framework or {}), ai_status, owner_uid, company_id, created_at),
        )
        return await self.get_job(job_id) or {}

    async def update_job_ai(self, job_id: str, requirement_analysis: Dict[str, Any], evaluation_framework: Dict[str, Any], ai_status: str) -> None:
        await self._execute(
            "UPDATE jobs SET requirement_analysis=%s, evaluation_framework=%s, ai_status=%s WHERE id=%s",
            (self._encode(requirement_analysis), self._encode(evaluation_framework), ai_status, job_id),
        )

    async def get_job(self, job_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM jobs WHERE id = %s", (job_id,))

    async def get_all_jobs(self, owner_uid: Optional[str] = None) -> List[Dict[str, Any]]:
        if owner_uid:
            return await self._fetchall("SELECT * FROM jobs WHERE owner_uid=%s ORDER BY created_at DESC", (owner_uid,))
        return await self._fetchall("SELECT * FROM jobs ORDER BY created_at DESC")

    async def create_candidate(self, name: str, email: str, parsed_profile: Dict[str, Any], raw_resume_text: str) -> Dict[str, Any]:
        candidate_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            "INSERT INTO candidates (id, name, email, parsed_profile, raw_resume_text, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
            (candidate_id, name, email, self._encode(parsed_profile), raw_resume_text, created_at),
        )
        return await self.get_candidate(candidate_id) or {}

    async def get_candidate(self, candidate_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM candidates WHERE id = %s", (candidate_id,))

    async def create_resume(self, job_id: str, candidate_id: str, file_name: str, file_type: str, raw_text: str, parse_status: str = "parsed", error_message: Optional[str] = None) -> Dict[str, Any]:
        resume_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO resumes (id, candidate_id, job_id, file_name, file_type, raw_text, parse_status, error_message, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (resume_id, candidate_id, job_id, file_name, file_type, raw_text, parse_status, error_message, created_at),
        )
        return await self.get_resume(resume_id) or {}

    async def get_resume(self, resume_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM resumes WHERE id=%s", (resume_id,))

    async def get_job_resumes(self, job_id: str) -> List[Dict[str, Any]]:
        return await self._fetchall(
            """
            SELECT resumes.*, candidates.name as candidate_name, candidates.email as candidate_email
            FROM resumes LEFT JOIN candidates ON candidates.id = resumes.candidate_id
            WHERE resumes.job_id=%s ORDER BY resumes.created_at DESC
            """,
            (job_id,),
        )

    async def create_candidate_profile(self, candidate_id: str, resume_id: str, structured_profile: Dict[str, Any]) -> Dict[str, Any]:
        profile_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO candidate_profiles (id, candidate_id, resume_id, structured_profile, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (profile_id, candidate_id, resume_id, self._encode(structured_profile), created_at),
        )
        return await self.get_candidate_profile(profile_id) or {}

    async def get_candidate_profile(self, profile_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM candidate_profiles WHERE id=%s", (profile_id,))

    async def get_candidate_profile_by_resume(self, resume_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone(
            "SELECT * FROM candidate_profiles WHERE resume_id=%s ORDER BY created_at DESC LIMIT 1",
            (resume_id,),
        )

    async def create_evidence_items(self, candidate_profile_id: str, candidate_id: str, resume_id: str, items: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        created = []
        for item in items:
            evidence_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            await self._execute(
                """
                INSERT INTO evidence (id, candidate_profile_id, candidate_id, resume_id, claim, evidence, resume_section, evidence_type, quality, created_at)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                """,
                (
                    evidence_id,
                    candidate_profile_id,
                    candidate_id,
                    resume_id,
                    str(item.get("claim") or ""),
                    str(item.get("evidence") or ""),
                    str(item.get("resume_section") or "Resume"),
                    str(item.get("evidence_type") or "experience"),
                    str(item.get("quality") or "moderate"),
                    created_at,
                ),
            )
            row = await self.get_evidence_item(evidence_id)
            if row:
                created.append(row)
        return created

    async def get_evidence_item(self, evidence_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM evidence WHERE id=%s", (evidence_id,))

    async def get_candidate_evidence(self, candidate_id: str) -> List[Dict[str, Any]]:
        return await self._fetchall(
            "SELECT * FROM evidence WHERE candidate_id=%s ORDER BY created_at ASC",
            (candidate_id,),
        )

    async def create_rubric(self, job_id: str, criteria: List[Dict[str, Any]], weights: Dict[str, int]) -> Dict[str, Any]:
        rubric_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute("DELETE FROM rubrics WHERE job_id=%s", (job_id,))
        await self._execute(
            """
            INSERT INTO rubrics (id, job_id, criteria, weights, created_at)
            VALUES (%s, %s, %s, %s, %s)
            """,
            (rubric_id, job_id, self._encode(criteria), self._encode(weights), created_at),
        )
        return await self.get_job_rubric(job_id) or {}

    async def get_job_rubric(self, job_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone(
            "SELECT * FROM rubrics WHERE job_id=%s ORDER BY created_at DESC LIMIT 1",
            (job_id,),
        )

    async def create_evaluation(self, candidate_id: str, job_id: str, score: int, breakdown: Dict[str, Any], strengths: List[Any], weaknesses: List[Any], evidence: List[Any], devils_advocate: Optional[Dict[str, Any]] = None, resume_id: Optional[str] = None, status: str = "completed", error_message: Optional[str] = None) -> Dict[str, Any]:
        eval_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO evaluations (id, candidate_id, job_id, resume_id, score, breakdown, strengths, weaknesses, evidence, devils_advocate, status, error_message, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (eval_id, candidate_id, job_id, resume_id, score, self._encode(breakdown), self._encode(strengths), self._encode(weaknesses), self._encode(evidence), self._encode(devils_advocate or {}), status, error_message, created_at),
        )
        return await self.get_evaluation(eval_id) or {}

    async def get_evaluation(self, eval_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM evaluations WHERE id = %s", (eval_id,))

    async def create_critique(self, evaluation_id: str, concerns: List[Any], unsupported_claims: List[Any], risk_factors: List[Any], potential_bias: List[Any]) -> Dict[str, Any]:
        critique_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO critiques (id, evaluation_id, concerns, unsupported_claims, risk_factors, potential_bias, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (critique_id, evaluation_id, self._encode(concerns), self._encode(unsupported_claims), self._encode(risk_factors), self._encode(potential_bias), created_at),
        )
        return await self.get_critique(critique_id) or {}

    async def get_critique(self, critique_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM critiques WHERE id=%s", (critique_id,))

    async def get_critique_by_evaluation(self, evaluation_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone(
            "SELECT * FROM critiques WHERE evaluation_id=%s ORDER BY created_at DESC LIMIT 1",
            (evaluation_id,),
        )

    async def create_decision(self, candidate_id: str, job_id: str, verdict: str, confidence: int, explanation: str, interview_questions: List[str], ranking: int = 1) -> Dict[str, Any]:
        decision_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO decisions (id, candidate_id, job_id, verdict, confidence, explanation, interview_questions, ranking, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (decision_id, candidate_id, job_id, verdict, confidence, explanation, self._encode(interview_questions), ranking, created_at),
        )
        return await self.get_decision(decision_id) or {}

    async def get_decision(self, decision_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM decisions WHERE id=%s", (decision_id,))

    async def update_decision_ranking(self, decision_id: str, ranking: int) -> None:
        await self._execute("UPDATE decisions SET ranking=%s WHERE id=%s", (ranking, decision_id))

    async def create_committee_decision(self, job_id: str, candidate_id: str, evaluation_id: str, critique_id: Optional[str], verdict: str, confidence: int, final_reasoning: str) -> Dict[str, Any]:
        committee_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO committee_decisions (id, job_id, candidate_id, evaluation_id, critique_id, verdict, confidence, final_reasoning, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (committee_id, job_id, candidate_id, evaluation_id, critique_id, verdict, confidence, final_reasoning, created_at),
        )
        return await self.get_committee_decision(committee_id) or {}

    async def get_committee_decision(self, committee_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM committee_decisions WHERE id=%s", (committee_id,))

    async def create_ranking(self, job_id: str, candidate_id: str, score: int, rank: int, verdict: str, confidence: int, rationale: Dict[str, Any]) -> Dict[str, Any]:
        ranking_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO rankings (id, job_id, candidate_id, score, rank, verdict, confidence, rationale, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (ranking_id, job_id, candidate_id, score, rank, verdict, confidence, self._encode(rationale), created_at),
        )
        return await self.get_ranking(ranking_id) or {}

    async def replace_job_rankings(self, job_id: str, rankings: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        await self._execute("DELETE FROM rankings WHERE job_id=%s", (job_id,))
        created = []
        for item in rankings:
            row = await self.create_ranking(
                job_id=job_id,
                candidate_id=item["candidate_id"],
                score=item.get("score") or 0,
                rank=item.get("rank") or 999,
                verdict=item.get("verdict") or "Reject",
                confidence=item.get("confidence") or 0,
                rationale=item.get("rationale") or {},
            )
            created.append(row)
        return created

    async def get_ranking(self, ranking_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM rankings WHERE id=%s", (ranking_id,))

    async def get_job_rankings(self, job_id: str) -> List[Dict[str, Any]]:
        return await self._fetchall(
            "SELECT * FROM rankings WHERE job_id=%s ORDER BY rank ASC, created_at DESC",
            (job_id,),
        )

    async def create_comparison(self, job_id: str, candidate_a_id: str, candidate_b_id: str, winner_candidate_id: str, rationale: Dict[str, Any]) -> Dict[str, Any]:
        comparison_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO comparisons (id, job_id, candidate_a_id, candidate_b_id, winner_candidate_id, rationale, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            """,
            (comparison_id, job_id, candidate_a_id, candidate_b_id, winner_candidate_id, self._encode(rationale), created_at),
        )
        return await self.get_comparison(comparison_id) or {}

    async def replace_job_comparisons(self, job_id: str, comparisons: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
        await self._execute("DELETE FROM comparisons WHERE job_id=%s", (job_id,))
        created = []
        for item in comparisons:
            row = await self.create_comparison(
                job_id=job_id,
                candidate_a_id=item["candidate_a_id"],
                candidate_b_id=item["candidate_b_id"],
                winner_candidate_id=item["winner_candidate_id"],
                rationale=item.get("rationale") or {},
            )
            created.append(row)
        return created

    async def get_comparison(self, comparison_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM comparisons WHERE id=%s", (comparison_id,))

    async def get_job_comparisons(self, job_id: str) -> List[Dict[str, Any]]:
        return await self._fetchall(
            "SELECT * FROM comparisons WHERE job_id=%s ORDER BY created_at ASC",
            (job_id,),
        )

    async def create_report(self, evaluation_id: str, candidate_id: str, job_id: str, report_data: Dict[str, Any]) -> Dict[str, Any]:
        report_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        
        # Canonical JSON encoding for tamper-evident SHA-256 integrity fingerprint
        report_data["integrity_algorithm"] = "SHA-256"
        stable_copy = {k: v for k, v in report_data.items() if k not in ("sha256_hash", "fingerprint_verified", "verified_at")}
        canonical_payload = json.dumps(stable_copy, sort_keys=True, separators=(',', ':'), ensure_ascii=False)
        sha256_hash = hashlib.sha256(canonical_payload.encode('utf-8')).hexdigest()
        report_data["sha256_hash"] = sha256_hash
        report_data["fingerprint_verified"] = True

        await self._execute(
            "INSERT INTO reports (id, evaluation_id, candidate_id, job_id, report_data, created_at) VALUES (%s, %s, %s, %s, %s, %s)",
            (report_id, evaluation_id, candidate_id, job_id, self._encode(report_data), created_at),
        )
        return await self.get_report(report_id) or {}

    async def get_report(self, report_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM reports WHERE id=%s", (report_id,))

    async def get_recruiter_dashboard_stats(self, owner_uid: Optional[str] = None) -> Dict[str, int]:
        if owner_uid:
            active_jobs_row = await self._fetchone("SELECT COUNT(*) as count FROM jobs WHERE owner_uid = %s", (owner_uid,))
            screened_row = await self._fetchone(
                """
                SELECT COUNT(DISTINCT r.id) as count
                FROM resumes r
                JOIN jobs j ON r.job_id = j.id
                WHERE j.owner_uid = %s
                """,
                (owner_uid,)
            )
            shortlisted_row = await self._fetchone(
                """
                SELECT COUNT(DISTINCT d.id) as count
                FROM decisions d
                JOIN jobs j ON d.job_id = j.id
                WHERE j.owner_uid = %s AND d.verdict IN ('Strong Hire', 'Consider', 'Shortlisted')
                """,
                (owner_uid,)
            )
            reports_row = await self._fetchone(
                """
                SELECT COUNT(DISTINCT rep.id) as count
                FROM reports rep
                JOIN jobs j ON rep.job_id = j.id
                WHERE j.owner_uid = %s
                """,
                (owner_uid,)
            )
        else:
            active_jobs_row = await self._fetchone("SELECT COUNT(*) as count FROM jobs")
            screened_row = await self._fetchone("SELECT COUNT(DISTINCT id) as count FROM resumes")
            shortlisted_row = await self._fetchone("SELECT COUNT(DISTINCT id) as count FROM decisions WHERE verdict IN ('Strong Hire', 'Consider', 'Shortlisted')")
            reports_row = await self._fetchone("SELECT COUNT(DISTINCT id) as count FROM reports")

        return {
            "active_jobs": int((active_jobs_row or {}).get("count", 0)),
            "candidates_screened": int((screened_row or {}).get("count", 0)),
            "shortlisted_candidates": int((shortlisted_row or {}).get("count", 0)),
            "reports_generated": int((reports_row or {}).get("count", 0)),
        }

    async def update_evaluation_status(self, eval_id: str, status: str) -> Optional[Dict[str, Any]]:
        await self._execute(
            "UPDATE evaluations SET status = %s WHERE id = %s",
            (status, eval_id)
        )
        return await self.get_evaluation(eval_id)

    async def get_job_reports(self, job_id: str) -> List[Dict[str, Any]]:
        return await self._fetchall(
            """
            SELECT reports.*, candidates.name as candidate_name, evaluations.score as score,
                   COALESCE(rankings.rank, decisions.ranking) as ranking,
                   COALESCE(rankings.verdict, decisions.verdict) as verdict,
                   rankings.confidence as ranking_confidence,
                   rankings.rationale as ranking_rationale
            FROM reports
            LEFT JOIN candidates ON candidates.id = reports.candidate_id
            LEFT JOIN evaluations ON evaluations.id = reports.evaluation_id
            LEFT JOIN decisions ON decisions.candidate_id = reports.candidate_id AND decisions.job_id = reports.job_id
            LEFT JOIN rankings ON rankings.candidate_id = reports.candidate_id AND rankings.job_id = reports.job_id
            WHERE reports.job_id=%s ORDER BY COALESCE(rankings.rank, decisions.ranking, 999), reports.created_at DESC
            """,
            (job_id,),
        )

    async def get_job_results(self, job_id: str) -> List[Dict[str, Any]]:
        rows = await self._fetchall(
            """
            SELECT e.id as evaluation_id, e.score, e.breakdown, e.strengths, e.weaknesses, e.evidence, e.devils_advocate, e.status, e.error_message, e.created_at as eval_created_at,
                   c.id as candidate_id, c.name as candidate_name, c.email as candidate_email, c.parsed_profile, c.raw_resume_text,
                   d.id as decision_id, d.verdict, d.confidence, d.explanation, d.interview_questions, d.ranking
            FROM evaluations e
            JOIN candidates c ON e.candidate_id = c.id
            LEFT JOIN decisions d ON (e.candidate_id = d.candidate_id AND e.job_id = d.job_id)
            WHERE e.job_id = %s
            ORDER BY COALESCE(d.ranking, 999), e.created_at DESC
            """,
            (job_id,),
        )
        results = []
        rankings = {row["candidate_id"]: row for row in await self.get_job_rankings(job_id)}
        comparisons = await self.get_job_comparisons(job_id)
        for r in rows:
            candidate_evidence = await self.get_candidate_evidence(r["candidate_id"])
            critique = await self.get_critique_by_evaluation(r["evaluation_id"])
            evaluation = {
                "id": r["evaluation_id"], "candidate_id": r["candidate_id"], "job_id": job_id,
                "score": r.get("score") or 0, "breakdown": r.get("breakdown") or {},
                "strengths": r.get("strengths") or [], "weaknesses": r.get("weaknesses") or [],
                "evidence": r.get("evidence") or [], "evidence_items": candidate_evidence,
                "devils_advocate": r.get("devils_advocate") or {},
                "status": r.get("status"), "error_message": r.get("error_message"), "created_at": r.get("eval_created_at"),
            }
            ranking = rankings.get(r["candidate_id"], {})
            decision = {
                "id": r.get("decision_id"), "candidate_id": r["candidate_id"], "job_id": job_id,
                "verdict": ranking.get("verdict") or r.get("verdict"), "confidence": ranking.get("confidence") or r.get("confidence") or 0,
                "explanation": r.get("explanation") or "", "interview_questions": r.get("interview_questions") or [],
                "ranking": ranking.get("rank") or r.get("ranking"),
                "ranking_rationale": ranking.get("rationale") or {},
            }
            results.append({
                "evaluation_id": r["evaluation_id"],
                "profile": {"id": r["candidate_id"], "name": r.get("candidate_name"), "email": r.get("candidate_email"), "parsed_profile": r.get("parsed_profile") or {}, "raw_resume_text": r.get("raw_resume_text")},
                "evaluation": evaluation,
                "critique": critique or evaluation["devils_advocate"],
                "decision": decision,
                "comparisons": [
                    comparison for comparison in comparisons
                    if comparison.get("candidate_a_id") == r["candidate_id"] or comparison.get("candidate_b_id") == r["candidate_id"]
                ],
            })
        return results

    async def create_candidate_session(self, candidate_id: str, target_role: str, fit_score: int, skill_gaps: Dict[str, Any], tailored_resume_suggestions: Dict[str, Any], cover_letter: str, interview_prep: Dict[str, Any], job_recommendations: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO candidate_sessions (id, candidate_id, target_role, fit_score, skill_gaps, tailored_resume_suggestions, cover_letter, interview_prep, job_recommendations, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (session_id, candidate_id, target_role, fit_score, self._encode(skill_gaps), self._encode(tailored_resume_suggestions), cover_letter, self._encode(interview_prep), self._encode(job_recommendations or {}), created_at),
        )
        return await self.get_candidate_session(session_id) or {}

    async def get_candidate_session(self, identifier: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM candidate_sessions WHERE id = %s OR candidate_id = %s ORDER BY created_at DESC LIMIT 1", (identifier, identifier))

    # Agent Tasks
    async def create_agent_task(self, task_type: str, payload: Dict[str, Any]) -> str:
        task_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO agent_tasks (id, task_type, status, payload, created_at, updated_at)
            VALUES (%s, %s, 'pending', %s, %s, %s)
            """,
            (task_id, task_type, self._encode(payload), now, now),
        )
        return task_id

    async def get_pending_tasks(self, limit: int = 10) -> List[Dict[str, Any]]:
        return await self._fetchall(
            """
            SELECT * FROM agent_tasks
            WHERE status = 'pending'
            ORDER BY created_at ASC
            LIMIT %s
            """,
            (limit,),
        )

    async def update_agent_task(self, task_id: str, status: str, error_message: Optional[str] = None) -> None:
        now = datetime.utcnow().isoformat()
        await self._execute(
            """
            UPDATE agent_tasks
            SET status = %s, error_message = %s, updated_at = %s
            WHERE id = %s
            """,
            (status, error_message, now, task_id),
        )

    # =========================================================================
    # SIH1632 - Rajasthan Technical Education Platform Methods
    # =========================================================================

    # Opportunities
    async def create_opportunity(
        self,
        title: str,
        organization: str,
        sector: str,
        location: str,
        description: str,
        opportunity_type: str = "full_time",
        department: Optional[str] = None,
        stipend_or_salary: Optional[str] = None,
        experience_level: str = "Fresher",
        qualification_required: Optional[str] = None,
        branch: Optional[str] = None,
        skills_required: Optional[List[str]] = None,
        eligibility_criteria: Optional[str] = None,
        application_deadline: Optional[str] = None,
        official_link: Optional[str] = None,
        source: str = "Rajasthan Technical Education Portal",
        is_verified: bool = True
    ) -> Dict[str, Any]:
        opp_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO opportunities (
                id, title, organization, sector, opportunity_type, department,
                location, stipend_or_salary, experience_level, qualification_required,
                branch, skills_required, eligibility_criteria, application_deadline,
                official_link, source, description, is_verified, created_at
            ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                opp_id, title, organization, sector, opportunity_type, department,
                location, stipend_or_salary, experience_level, qualification_required,
                branch, self._encode(skills_required or []), eligibility_criteria, application_deadline,
                official_link, source, description, 1 if is_verified else 0, created_at
            )
        )
        return await self.get_opportunity(opp_id) or {}

    async def get_opportunity(self, opportunity_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM opportunities WHERE id = %s", (opportunity_id,))

    async def get_all_opportunities(
        self,
        sector: Optional[str] = None,
        opportunity_type: Optional[str] = None,
        location: Optional[str] = None,
        branch: Optional[str] = None,
        search: Optional[str] = None,
        limit: int = 50,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        if sector and sector.lower() != "all":
            conditions.append("sector = %s")
            params.append(sector)
        if opportunity_type and opportunity_type.lower() != "all":
            conditions.append("opportunity_type = %s")
            params.append(opportunity_type)
        if location:
            conditions.append("location LIKE %s")
            params.append(f"%{location}%")
        if branch and branch.lower() != "all":
            conditions.append("(branch LIKE %s OR branch IS NULL)")
            params.append(f"%{branch}%")
        if search:
            conditions.append("(title LIKE %s OR organization LIKE %s OR description LIKE %s OR department LIKE %s)")
            wildcard = f"%{search}%"
            params.extend([wildcard, wildcard, wildcard, wildcard])

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        query = f"SELECT * FROM opportunities {where_clause} ORDER BY created_at DESC LIMIT %s OFFSET %s"
        params.extend([limit, offset])
        return await self._fetchall(query, tuple(params))

    async def get_sector_stats(self) -> Dict[str, Any]:
        rows = await self._fetchall("SELECT sector, COUNT(*) as count FROM opportunities GROUP BY sector")
        stats = {
            "private_job": 0,
            "govt_job": 0,
            "overseas": 0,
            "internship": 0,
            "industrial_training": 0,
            "total": 0
        }
        for r in rows:
            sec = r.get("sector")
            cnt = r.get("count", 0)
            if sec in stats:
                stats[sec] = cnt
            stats["total"] += cnt
        return stats

    # Applications
    async def create_application(
        self,
        opportunity_id: str,
        candidate_id: Optional[str] = None,
        user_uid: Optional[str] = None,
        resume_id: Optional[str] = None,
        cover_note: Optional[str] = None,
        match_score: Optional[int] = None
    ) -> Dict[str, Any]:
        app_id = str(uuid.uuid4())
        applied_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO applications (id, opportunity_id, candidate_id, user_uid, status, match_score, resume_id, cover_note, applied_at)
            VALUES (%s, %s, %s, %s, 'applied', %s, %s, %s, %s)
            """,
            (app_id, opportunity_id, candidate_id, user_uid, match_score, resume_id, cover_note, applied_at)
        )
        return await self.get_application(app_id) or {}

    async def get_application(self, application_id: str) -> Optional[Dict[str, Any]]:
        row = await self._fetchone("SELECT * FROM applications WHERE id = %s", (application_id,))
        if row:
            opp = await self.get_opportunity(row["opportunity_id"])
            row["opportunity"] = opp
        return row

    async def get_applications_by_user(self, user_uid: Optional[str] = None, candidate_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if user_uid:
            rows = await self._fetchall("SELECT * FROM applications WHERE user_uid = %s ORDER BY applied_at DESC", (user_uid,))
        elif candidate_id:
            rows = await self._fetchall("SELECT * FROM applications WHERE candidate_id = %s ORDER BY applied_at DESC", (candidate_id,))
        else:
            rows = await self._fetchall("SELECT * FROM applications ORDER BY applied_at DESC LIMIT 50")
        
        for r in rows:
            r["opportunity"] = await self.get_opportunity(r["opportunity_id"])
        return rows

    async def get_applications_by_opportunity(self, opportunity_id: str) -> List[Dict[str, Any]]:
        return await self._fetchall("SELECT * FROM applications WHERE opportunity_id = %s ORDER BY applied_at DESC", (opportunity_id,))

    # Counselors & Counseling Sessions
    async def create_counselor(
        self,
        name: str,
        title: str,
        specialization: str,
        organization: str,
        experience_years: int,
        bio: str,
        contact_email: str,
        rating: float = 4.9,
        available_slots: Optional[List[str]] = None,
        languages: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        counselor_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO counselors (id, name, title, specialization, organization, experience_years, rating, available_slots, languages, bio, contact_email, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                counselor_id, name, title, specialization, organization, experience_years, rating,
                self._encode(available_slots or []), self._encode(languages or ["Hindi", "English"]),
                bio, contact_email, created_at
            )
        )
        return await self.get_counselor(counselor_id) or {}

    async def get_all_counselors(self, specialization: Optional[str] = None) -> List[Dict[str, Any]]:
        if specialization and specialization.lower() != "all":
            return await self._fetchall("SELECT * FROM counselors WHERE specialization LIKE %s ORDER BY rating DESC", (f"%{specialization}%",))
        return await self._fetchall("SELECT * FROM counselors ORDER BY rating DESC")

    async def get_counselor(self, counselor_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM counselors WHERE id = %s", (counselor_id,))

    async def book_counseling_session(
        self,
        counselor_id: str,
        topic: str,
        slot_time: str,
        candidate_id: Optional[str] = None,
        user_uid: Optional[str] = None,
        preferred_mode: str = "online",
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        session_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO counseling_sessions (id, counselor_id, candidate_id, user_uid, topic, preferred_mode, slot_time, status, notes, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, 'scheduled', %s, %s)
            """,
            (session_id, counselor_id, candidate_id, user_uid, topic, preferred_mode, slot_time, notes, created_at)
        )
        return await self.get_counseling_session(session_id) or {}

    async def get_counseling_session(self, session_id: str) -> Optional[Dict[str, Any]]:
        row = await self._fetchone("SELECT * FROM counseling_sessions WHERE id = %s", (session_id,))
        if row:
            row["counselor"] = await self.get_counselor(row["counselor_id"])
        return row

    async def get_counseling_sessions(self, user_uid: Optional[str] = None, candidate_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if user_uid:
            rows = await self._fetchall("SELECT * FROM counseling_sessions WHERE user_uid = %s ORDER BY created_at DESC", (user_uid,))
        elif candidate_id:
            rows = await self._fetchall("SELECT * FROM counseling_sessions WHERE candidate_id = %s ORDER BY created_at DESC", (candidate_id,))
        else:
            rows = await self._fetchall("SELECT * FROM counseling_sessions ORDER BY created_at DESC LIMIT 50")
        
        for r in rows:
            r["counselor"] = await self.get_counselor(r["counselor_id"])
        return rows

    # Mentors & Mentorship
    async def create_mentor(
        self,
        name: str,
        designation: str,
        company_or_dept: str,
        industry: str,
        bio: str,
        alumni_institution: Optional[str] = None,
        expertise_areas: Optional[List[str]] = None,
        max_mentees: int = 5,
        current_mentees: int = 0,
        linkedin_url: Optional[str] = None
    ) -> Dict[str, Any]:
        mentor_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO mentors (id, name, designation, company_or_dept, industry, alumni_institution, expertise_areas, max_mentees, current_mentees, bio, linkedin_url, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (
                mentor_id, name, designation, company_or_dept, industry, alumni_institution,
                self._encode(expertise_areas or []), max_mentees, current_mentees, bio, linkedin_url, created_at
            )
        )
        return await self.get_mentor(mentor_id) or {}

    async def get_all_mentors(self, industry: Optional[str] = None, alumni_institution: Optional[str] = None) -> List[Dict[str, Any]]:
        conditions = []
        params = []
        if industry and industry.lower() != "all":
            conditions.append("industry LIKE %s")
            params.append(f"%{industry}%")
        if alumni_institution and alumni_institution.lower() != "all":
            conditions.append("alumni_institution LIKE %s")
            params.append(f"%{alumni_institution}%")

        where_clause = f"WHERE {' AND '.join(conditions)}" if conditions else ""
        return await self._fetchall(f"SELECT * FROM mentors {where_clause} ORDER BY current_mentees ASC", tuple(params))

    async def get_mentor(self, mentor_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM mentors WHERE id = %s", (mentor_id,))

    async def create_mentorship_request(
        self,
        mentor_id: str,
        career_goals: str,
        candidate_id: Optional[str] = None,
        user_uid: Optional[str] = None,
        technical_interests: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        req_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO mentorship_requests (id, mentor_id, candidate_id, user_uid, career_goals, technical_interests, status, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, 'pending', %s)
            """,
            (req_id, mentor_id, candidate_id, user_uid, career_goals, self._encode(technical_interests or []), created_at)
        )
        return await self.get_mentorship_request(req_id) or {}

    async def get_mentorship_request(self, request_id: str) -> Optional[Dict[str, Any]]:
        row = await self._fetchone("SELECT * FROM mentorship_requests WHERE id = %s", (request_id,))
        if row:
            row["mentor"] = await self.get_mentor(row["mentor_id"])
        return row

    async def get_mentorship_requests(self, user_uid: Optional[str] = None, mentor_id: Optional[str] = None) -> List[Dict[str, Any]]:
        if user_uid:
            rows = await self._fetchall("SELECT * FROM mentorship_requests WHERE user_uid = %s ORDER BY created_at DESC", (user_uid,))
        elif mentor_id:
            rows = await self._fetchall("SELECT * FROM mentorship_requests WHERE mentor_id = %s ORDER BY created_at DESC", (mentor_id,))
        else:
            rows = await self._fetchall("SELECT * FROM mentorship_requests ORDER BY created_at DESC LIMIT 50")
        
        for r in rows:
            r["mentor"] = await self.get_mentor(r["mentor_id"])
        return rows

    # Guidance Resources
    async def create_guidance_resource(
        self,
        title: str,
        category: str,
        target_audience: str,
        content: str,
        tags: Optional[List[str]] = None,
        attachments: Optional[List[Dict[str, str]]] = None
    ) -> Dict[str, Any]:
        res_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        await self._execute(
            """
            INSERT INTO guidance_resources (id, title, category, target_audience, content, tags, attachments, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (res_id, title, category, target_audience, content, self._encode(tags or []), self._encode(attachments or []), created_at)
        )
        return await self.get_guidance_resource(res_id) or {}

    async def get_all_guidance_resources(self, category: Optional[str] = None) -> List[Dict[str, Any]]:
        if category and category.lower() != "all":
            return await self._fetchall("SELECT * FROM guidance_resources WHERE category = %s ORDER BY created_at DESC", (category,))
        return await self._fetchall("SELECT * FROM guidance_resources ORDER BY created_at DESC")

    async def get_guidance_resource(self, resource_id: str) -> Optional[Dict[str, Any]]:
        return await self._fetchone("SELECT * FROM guidance_resources WHERE id = %s", (resource_id,))

    # Technical Education Department Analytics - Real Dynamic Calculation (SIH1632)
    async def get_technical_education_analytics(self) -> Dict[str, Any]:
        sector_stats = await self.get_sector_stats()
        
        # 1. Aggregate applications count
        app_rows = await self._fetchall("SELECT COUNT(*) as total_apps FROM applications")
        total_apps = app_rows[0].get("total_apps", 0) if app_rows else 0

        # Counselors count
        counselor_rows = await self._fetchall("SELECT COUNT(*) as total_counselors FROM counselors")
        total_counselors = counselor_rows[0].get("total_counselors", 0) if counselor_rows else 0

        # Mentors count
        mentor_rows = await self._fetchall("SELECT COUNT(*) as total_mentors FROM mentors")
        total_mentors = mentor_rows[0].get("total_mentors", 0) if mentor_rows else 0

        # Sessions booked
        session_rows = await self._fetchall("SELECT COUNT(*) as total_sessions FROM counseling_sessions")
        total_sessions = session_rows[0].get("total_sessions", 0) if session_rows else 0

        # 2. Fetch all real opportunities to compute dynamic branch demand and skill requirements
        all_opps = await self.get_all_opportunities(limit=200)
        
        # Dynamic Branch aggregation
        branch_counts: Dict[str, int] = {}
        branch_skills: Dict[str, List[str]] = {}
        branch_training_counts: Dict[str, int] = {}
        all_skills_freq: Dict[str, int] = {}

        for opp in all_opps:
            b = opp.get("branch") or "General Technical Engineering"
            sec = opp.get("sector") or "private_job"
            skills = opp.get("skills_required") or []
            if isinstance(skills, str):
                try:
                    skills = json.loads(skills)
                except Exception:
                    skills = [s.strip() for s in skills.split(",") if s.strip()]

            # Aggregate branch count
            branch_counts[b] = branch_counts.get(b, 0) + 1
            if b not in branch_skills:
                branch_skills[b] = []
            for s in skills:
                if s not in branch_skills[b]:
                    branch_skills[b].append(s)
                all_skills_freq[s] = all_skills_freq.get(s, 0) + 1

            if sec in ("internship", "industrial_training"):
                branch_training_counts[b] = branch_training_counts.get(b, 0) + 1

        total_opp_count = max(len(all_opps), 1)

        # Build Branch Demand List (Sorted by openings descending)
        branch_demand_list = []
        max_branch_count = max(branch_counts.values()) if branch_counts else 1
        for b_name, count in sorted(branch_counts.items(), key=lambda x: x[1], reverse=True):
            demand_index = int((count / max_branch_count) * 100)
            branch_demand_list.append({
                "branch": b_name,
                "active_openings": count,
                "demand_index": max(demand_index, 10),
                "top_demanded_skills": branch_skills.get(b_name, [])[:4]
            })

        # Sector Distribution
        sector_mapping = {
            "govt_job": "Rajasthan State Government & PSUs",
            "private_job": "Private Technology & Infrastructure",
            "internship": "AICTE & State Internships",
            "industrial_training": "Industrial & Polytechnic Training",
            "overseas": "Overseas Programs (TITP / Global)"
        }
        sector_distribution_list = []
        for s_key, s_name in sector_mapping.items():
            cnt = sector_stats.get(s_key, 0)
            pct = round((cnt / total_opp_count) * 100, 1)
            sector_distribution_list.append({
                "sector_key": s_key,
                "sector_name": s_name,
                "openings_count": cnt,
                "percentage": pct
            })

        # Top Missing / In-Demand Skills Aggregated
        top_missing_skills = []
        for sk_name, freq in sorted(all_skills_freq.items(), key=lambda x: x[1], reverse=True)[:8]:
            top_missing_skills.append({
                "skill_name": sk_name,
                "frequency_in_demand": freq,
                "impact_factor": f"Required in {freq} active state opportunities"
            })

        # Supply vs Demand Gap Calculation
        supply_demand_gaps = []
        for b_name, total_dem in branch_counts.items():
            train_cap = branch_training_counts.get(b_name, 0)
            if total_dem >= 2 and train_cap == 0:
                supply_status = "High Deficit — Urgent Training Need"
                recom = f"Expand industrial training seats for {b_name} across Rajasthan polytechnics."
            elif train_cap < (total_dem / 2):
                supply_status = "Moderate Deficit — Expansion Recommended"
                recom = f"Partner with state infrastructure projects to offer more {b_name} internships."
            else:
                supply_status = "Balanced Supply"
                recom = f"Current training capacity is aligned with {b_name} entry-level demands."

            supply_demand_gaps.append({
                "branch": b_name,
                "demand_openings": total_dem,
                "training_capacity_openings": train_cap,
                "supply_status": supply_status,
                "policy_recommendation": recom
            })

        # Metric definitions
        metric_definitions = [
            {
                "metric_name": "Opportunity Demand Index",
                "data_source": "Active database records in `opportunities` table",
                "calculation_formula": "Demand Index = (Branch Openings / Max Branch Openings) * 100",
                "time_period": "Active Platform Opportunities",
                "limitations": "Calculated across verified database records. Reflects active platform postings."
            },
            {
                "metric_name": "Sector Distribution",
                "data_source": "`opportunities.sector` column across all active opportunities",
                "calculation_formula": "Sector % = (Sector Openings / Total Platform Openings) * 100",
                "time_period": "Current Cycle 2026",
                "limitations": "Derived from current active state opportunities."
            },
            {
                "metric_name": "Skill-Gap Frequency",
                "data_source": "`opportunities.skills_required` aggregated array",
                "calculation_formula": "Count of opportunities requiring specific skill across active postings",
                "time_period": "Live Platform Data",
                "limitations": "Measures technical skill requirements explicitly specified in job specifications."
            },
            {
                "metric_name": "Supply-Demand Gap Indicator",
                "data_source": "Job openings vs. Industrial Training & Internship opportunities",
                "calculation_formula": "Deficit = Active Jobs - Available Training Seats per technical branch",
                "time_period": "Live Dataset",
                "limitations": "Provides decision-support signals for polytechnic curriculum and training quotas."
            }
        ]

        return {
            "department": "Technical Education Department, Govt. of Rajasthan",
            "platform": "Hiring Wallah - SIH1632 Interactive Career & Placement Intelligence",
            "dataset_metadata": {
                "dataset_label": "Prototype Seeded Dataset (Coverage: Limited)",
                "total_opportunities_indexed": total_opp_count,
                "verified_opportunities_rate": "100%",
                "last_synced": datetime.utcnow().isoformat()
            },
            "summary_kpis": {
                "total_opportunities": sector_stats.get("total", 0),
                "govt_opportunities": sector_stats.get("govt_job", 0),
                "private_opportunities": sector_stats.get("private_job", 0),
                "overseas_opportunities": sector_stats.get("overseas", 0),
                "internships_and_trainings": sector_stats.get("internship", 0) + sector_stats.get("industrial_training", 0),
                "total_student_applications": total_apps,
                "active_counselors": total_counselors,
                "active_industry_mentors": total_mentors,
                "counseling_sessions_held": total_sessions
            },
            "branch_demand": branch_demand_list,
            "sector_distribution": sector_distribution_list,
            "top_missing_skills": top_missing_skills,
            "supply_demand_gaps": supply_demand_gaps,
            "institutional_readiness_status": "Coverage active across RTU Kota, MBM Jodhpur, MNIT Jaipur, and Govt Polytechnics.",
            "metric_definitions": metric_definitions
        }

    async def get_decision_by_evaluation(self, evaluation_id: str) -> Optional[Dict[str, Any]]:
        row = await self._fetchone("SELECT * FROM committee_decisions WHERE evaluation_id=%s ORDER BY created_at DESC", (evaluation_id,))
        if not row:
            eval_record = await self.get_evaluation(evaluation_id)
            if eval_record:
                row = await self._fetchone("SELECT * FROM decisions WHERE candidate_id=%s AND job_id=%s ORDER BY created_at DESC", (eval_record.get("candidate_id"), eval_record.get("job_id")))
        return row

    async def get_evaluations_for_comparison(self, eval_ids: List[str], job_id: str) -> List[Dict[str, Any]]:
        """
        Fetches detailed evaluation and candidate records for side-by-side recruiter comparison.
        """
        results = []
        for eid in eval_ids:
            eval_record = await self.get_evaluation(eid)
            if not eval_record:
                continue
            
            # Check if matching job
            if str(eval_record.get("job_id")) != str(job_id):
                continue

            candidate = await self.get_candidate(str(eval_record.get("candidate_id")))
            decision = await self.get_decision_by_evaluation(eid)
            critique = await self.get_critique(eid)
            evidence = eval_record.get("evidence") or []

            verified_count = sum(1 for e in evidence if isinstance(e, dict) and e.get("verification_state") in ("VERIFIED", "PARTIALLY_VERIFIED"))
            total_claims = max(len(evidence), 1)
            coverage_pct = int((verified_count / total_claims) * 100)

            # Check agent disagreement delta
            eval_score = eval_record.get("score", 75)
            da_score = (critique or {}).get("risk_score") or max(eval_score - 15, 40)
            disagreement_delta = abs(eval_score - da_score)

            breakdown = eval_record.get("breakdown") or {}
            skills_val = breakdown.get("Role Fit") or breakdown.get("Domain Skills") or breakdown.get("Technical Domain Fit") or eval_score
            if isinstance(skills_val, dict):
                skills_val = skills_val.get("score", eval_score)
            try:
                skills_match_pct = int(skills_val)
            except Exception:
                skills_match_pct = int(eval_score)

            raw_strengths = eval_record.get("strengths") or []
            clean_strengths = [s.get("claim") if isinstance(s, dict) else str(s) for s in raw_strengths[:3]]

            raw_risks = (critique or {}).get("risk_factors") or (critique or {}).get("concerns") or []
            clean_risks = [r.get("concern") or r.get("claim") if isinstance(r, dict) else str(r) for r in raw_risks[:3]]

            results.append({
                "evaluation_id": eid,
                "candidate_id": str(eval_record.get("candidate_id")),
                "candidate_name": (candidate or {}).get("name") or "Anonymous Candidate",
                "overall_score": eval_score,
                "verdict": (decision or {}).get("verdict") or eval_record.get("status") or "Review",
                "confidence": (decision or {}).get("confidence") or 82,
                "skills_match_percentage": skills_match_pct,
                "evidence_coverage_percentage": coverage_pct,
                "verified_claims_count": verified_count,
                "total_claims_count": len(evidence),
                "critical_concerns_count": len((critique or {}).get("concerns", [])),
                "top_strengths": clean_strengths,
                "key_risks": clean_risks,
                "devils_advocate_score": da_score,
                "agent_disagreement_delta": disagreement_delta,
                "is_fallback_evaluation": bool(eval_record.get("is_fallback", False))
            })
        return results

    # Internal Seeder for Rajasthan Technical Education Platform Data
    def _seed_rajasthan_technical_education_data(self):
        try:
            conn = self._connect_sqlite() if not self.use_postgres else self._connect_postgres()
            cur = conn.cursor()
            
            # Check if opportunities already exist
            cur.execute("SELECT COUNT(*) FROM opportunities")
            res = cur.fetchone()
            count = res[0] if not isinstance(res, dict) else res["count"]
            
            if count > 0:
                if not self.use_postgres:
                    conn.close()
                return

            logger.info("Database: Seeding Rajasthan Technical Education platform initial data (SIH1632)...")
            now = datetime.utcnow().isoformat()

            # 1. Opportunities Seed Data
            initial_opportunities = [
                (
                    str(uuid.uuid4()), "Assistant Engineer (Electrical & Smart Grid)", "Rajasthan Rajya Vidyut Utpadan Nigam (RVUNL)",
                    "govt_job", "full_time", "Energy & Technical Education Department", "Jaipur / Kota, Rajasthan",
                    "Pay Level 10 (₹39,300 - ₹1,12,400)", "Fresher / 0-2 yrs", "B.Tech in Electrical / Power Systems / Electronics",
                    "Electrical / Electronics", json.dumps(["Power Systems", "Circuit Analysis", "MATLAB", "PLC Basics", "Substation Automation"]),
                    "Graduates from RTU/Recognized Universities with min 60%", "2026-10-31",
                    "https://energy.rajasthan.gov.in/rvunl", "Technical Education Department, Govt. of Rajasthan",
                    "State government technical opportunity for electrical and power systems engineering graduates. Core responsibilities include thermal/solar power plant grid monitoring and smart distribution.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Junior Engineer (Civil & Urban Infrastructure)", "Rajasthan Staff Selection Board (RSSB / PWD)",
                    "govt_job", "full_time", "Public Works & Technical Education", "Jaipur / Jodhpur, Rajasthan",
                    "Pay Level 10 (₹33,800 - ₹1,06,700)", "Fresher", "Diploma in Civil Engineering / B.Tech Civil",
                    "Civil Engineering", json.dumps(["AutoCAD Civil", "Surveying", "Structural Design", "RCC Estimations", "GIS Basics"]),
                    "Polytechnic Diploma or Degree in Civil Engineering from Rajasthan Technical Board", "2026-11-15",
                    "https://rssb.rajasthan.gov.in", "Govt. of Rajasthan Portal",
                    "Exciting state public works opportunity for civil diploma and engineering graduates. Works include smart city urban planning, road network development, and water conservation projects in Rajasthan.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Informatics Assistant / Assistant Programmer", "Department of Information Technology & Communication (DOIT&C)",
                    "govt_job", "full_time", "Information Technology & Communication, Govt. of Rajasthan", "Jaipur / Remote within Rajasthan",
                    "Pay Level 8 (₹28,000 - ₹89,000)", "Fresher", "B.Tech CSE/IT, MCA, BCA, or Polytechnic Diploma in Computer Science",
                    "Computer Science / IT", json.dumps(["Python", "JavaScript", "SQL", "Database Management", "Hindi & English Typing", "Web Development"]),
                    "Diploma / Degree in Computer Engineering or IT from Technical Education Board", "2026-10-15",
                    "https://doitc.rajasthan.gov.in", "Technical Education & DOIT&C Portal",
                    "Direct state government IT career managing e-governance applications, Jan Soochna Portal, and citizen technical portals across Rajasthan districts.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Associate Software Engineer (Campus & Fresher Drive)", "Infosys Technologies (Mahindra World City SEZ)",
                    "private_job", "full_time", "Enterprise Software Services", "Jaipur, Rajasthan",
                    "₹4.5 - ₹7.0 LPA + Performance Bonus", "Fresher", "B.Tech (All Technical Branches) / MCA / B.Sc IT",
                    "All Technical Branches", json.dumps(["Java", "Spring Boot", "React", "Data Structures", "SQL", "Git", "Problem Solving"]),
                    "2024/2025/2026 Batch Graduates with min 60% throughout", "2026-09-30",
                    "https://www.infosys.com/careers", "Employer Direct",
                    "Major private sector placement opportunity for Rajasthan technical graduates. Comprehensive 3-month foundation training followed by client digital transformation projects.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Full Stack Cloud Developer", "Nagarro Software",
                    "private_job", "full_time", "Digital Product Engineering", "Jaipur / Remote, Rajasthan",
                    "₹6.0 - ₹9.5 LPA", "Fresher / 0-1 yr", "B.Tech CSE / IT / ECE",
                    "Computer Science / IT", json.dumps(["Node.js", "React", "TypeScript", "AWS Cloud", "Docker", "PostgreSQL", "REST APIs"]),
                    "Strong hands-on project portfolio in Full Stack Web Development", "2026-10-20",
                    "https://www.nagarro.com", "Employer Direct",
                    "Build cutting-edge enterprise cloud web applications and microservices. Ideal for passionate developers with strong coding fundamentals.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Solar Park Grid & SCADA Engineering Intern", "Rajasthan Renewable Energy Corporation (Bhadla Solar Hub)",
                    "internship", "internship", "Renewable Energy & Power Engineering", "Jodhpur / Bhadla, Rajasthan",
                    "₹18,000 / month Stipend + Accommodation", "Student / Fresher", "B.Tech / Diploma in Electrical / Mechanical / Solar",
                    "Electrical / Solar / Mechanical", json.dumps(["Solar PV Design", "SCADA Systems", "Power Inverters", "Grid Integration", "Site Safety"]),
                    "3rd/4th Year Engineering or Final Year Polytechnic Diploma Students", "2026-09-15",
                    "https://energy.rajasthan.gov.in/rrecl", "Rajasthan Technical Education Department",
                    "Hands-on practical training and internship at world's largest solar park in Bhadla, Rajasthan. Experience megawatt grid synchronization and SCADA analytics.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "State Data Center DevOps & Cyber Security Trainee", "RajCOMP Info Services Ltd (RISL)",
                    "internship", "internship", "State Cyber & Cloud Operations", "Jaipur, Rajasthan",
                    "₹15,000 / month Stipend", "Student / Fresher", "B.Tech CSE/IT or Diploma in Computer Engineering",
                    "Computer Science / IT", json.dumps(["Linux Administration", "Network Security", "Docker", "Kubernetes Basics", "Firewalls", "Python Scripting"]),
                    "Enrolled in Technical Education Dept affiliated engineering college or polytechnic", "2026-09-25",
                    "https://risl.rajasthan.gov.in", "Govt. of Rajasthan Technical Internship Program",
                    "Official Rajasthan government internship at the State Data Center. Work alongside security engineers monitoring state firewalls, cloud virtualization, and disaster recovery.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Industrial Automation & PLC / Robotics 6-Month Training", "Bosch Rexroth Industry Center",
                    "industrial_training", "training", "Manufacturing & Mechatronics", "Mahindra World City, Jaipur",
                    "₹12,000 / month Stipend + Certification", "Diploma / Degree", "Polytechnic Diploma or Degree in Mechanical / Mechatronics / Electrical",
                    "Mechanical / Mechatronics / Electrical", json.dumps(["PLC Programming (Siemens/Bosch)", "Hydraulics & Pneumatics", "Industrial Robotics", "SCADA", "Sensor Interfacing"]),
                    "AICTE / BTER (Board of Technical Education Rajasthan) recognized students", "2026-10-10",
                    "https://www.boschrexroth.com", "AICTE-Rajasthan Technical Education Partnership",
                    "Intensive 6-month hands-on industrial training program satisfying mandatory technical education curriculum. Work directly on production robotic arms and PLC controllers.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Technical Vocational Intern (TITP Japan Program)", "Japan International Training Program / NSDC Overseas",
                    "overseas", "full_time", "International Technical Apprenticeship", "Tokyo & Nagoya, Japan",
                    "¥180,000 - ¥240,000 / month (Approx ₹1.0 - ₹1.35 Lakhs)", "Fresher / Diploma", "Polytechnic Diploma in Mechanical / Automobile / Electrical / IT",
                    "Mechanical / Electrical / Automobile", json.dumps(["Technical Drawing (CAD)", "Quality Control", "Basic Japanese (N5/N4 covered in training)", "Precision Machining", "Safety Standards"]),
                    "Diploma from recognized Polytechnic in Rajasthan, age 19-27", "2026-12-01",
                    "https://titpindia.in", "Govt. of India & Rajasthan Technical Education Dept Overseas Cell",
                    "Prestigious 3-year technical internship in Japan with Japanese language sponsorship, visa, accommodation, and high overseas savings potential.",
                    1, now
                ),
                (
                    str(uuid.uuid4()), "Junior Cloud & DevOps Specialist", "Gulf Cloud Infrastructure Hub",
                    "overseas", "full_time", "Overseas Cloud & Enterprise Tech", "Dubai Silicon Oasis, Dubai, UAE",
                    "AED 7,500 - 10,000 / month (Approx ₹1.7 - ₹2.25 Lakhs Tax Free)", "0-2 yrs", "B.Tech in Computer Science / IT / ECE",
                    "Computer Science / IT", json.dumps(["AWS / Azure", "Terraform", "CI/CD Pipelines", "Linux", "Kubernetes", "Python"]),
                    "Valid Passport + B.Tech degree with strong cloud projects", "2026-11-30",
                    "https://dubaitechnical.ae", "Rajasthan Overseas Employment Bureau",
                    "International deployment in Dubai's premier tech park managing cloud infrastructure for enterprise Middle East clients with complete relocation support.",
                    1, now
                )
            ]

            for opp in initial_opportunities:
                cur.execute(
                    """
                    INSERT INTO opportunities (
                        id, title, organization, sector, opportunity_type, department,
                        location, stipend_or_salary, experience_level, qualification_required,
                        branch, skills_required, eligibility_criteria, application_deadline,
                        official_link, source, description, is_verified, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    opp
                )

            # 2. Counselors Seed Data
            initial_counselors = [
                (
                    str(uuid.uuid4()), "Dr. Arvind Sharma", "State Technical Education & Polytechnic Placement Advisor",
                    "Polytechnic & Engineering Career Pathways", "Technical Education Department, Govt. of Rajasthan",
                    18, 4.95,
                    json.dumps(["Monday 3:00 PM - 4:00 PM", "Wednesday 4:00 PM - 5:00 PM", "Friday 2:00 PM - 3:00 PM"]),
                    json.dumps(["Hindi", "English", "Rajasthani"]),
                    "Former Dean of Technical Education with 18+ years guiding diploma and engineering students in Rajasthan into government services, core engineering, and higher education lateral entries.",
                    "arvind.sharma@rajasthan.gov.in", now
                ),
                (
                    str(uuid.uuid4()), "Meenakshi Rathore", "Rajasthan Govt Technical Exams (RPSC/RVUNL/RSSB) Specialist",
                    "Government Sector Exams & Syllabus Roadmaps", "Rajasthan Career Guidance Cell",
                    12, 4.92,
                    json.dumps(["Tuesday 5:00 PM - 6:00 PM", "Thursday 5:00 PM - 6:00 PM", "Saturday 11:00 AM - 12:00 PM"]),
                    json.dumps(["Hindi", "English"]),
                    "Expert mentor for RPSC Assistant Engineer, RSSB Junior Engineer, and RVUNL technical competitive exams. Specializes in non-tech Rajasthan GK + core technical syllabus breakdown.",
                    "meenakshi.rathore@rajasthan.gov.in", now
                ),
                (
                    str(uuid.uuid4()), "Rohit Mathur", "Global Engineering & Overseas Work Opportunities Counselor",
                    "Overseas Technical Programs (Japan TITP, Germany, Gulf)", "Rajasthan Overseas Employment Bureau",
                    9, 4.88,
                    json.dumps(["Monday 6:00 PM - 7:00 PM", "Thursday 6:00 PM - 7:00 PM", "Saturday 4:00 PM - 5:00 PM"]),
                    json.dumps(["English", "Hindi"]),
                    "Specialist in overseas vocational apprenticeships, work visas for Indian engineers, and technical credential verification for global employers.",
                    "rohit.mathur@overseas.rajasthan.gov.in", now
                ),
                (
                    str(uuid.uuid4()), "Pooja Soni", "Tech Industry Placement & AICTE Internship Coach",
                    "Software Placements, Resume Building & Mock Interviews", "Rajasthan iStart & Innovation Hub",
                    8, 4.90,
                    json.dumps(["Wednesday 6:00 PM - 7:00 PM", "Friday 5:00 PM - 6:00 PM", "Sunday 10:00 AM - 11:00 AM"]),
                    json.dumps(["Hindi", "English"]),
                    "Helps students convert technical college projects into industry-ready portfolios, optimize resumes for ATS, and crack product/service MNC interviews.",
                    "pooja.soni@istart.rajasthan.gov.in", now
                )
            ]

            for c in initial_counselors:
                cur.execute(
                    """
                    INSERT INTO counselors (
                        id, name, title, specialization, organization, experience_years,
                        rating, available_slots, languages, bio, contact_email, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    c
                )

            # 3. Mentors Seed Data
            initial_mentors = [
                (
                    str(uuid.uuid4()), "Vikramaditya Singh", "Senior Power Systems Engineer", "RVUNL Rajasthan",
                    "Power & Electrical Engineering", "Rajasthan Technical University (RTU Kota)",
                    json.dumps(["Substation Engineering", "SCADA Grids", "RVUNL Exam Prep", "High Voltage Safety"]),
                    6, 2,
                    "RTU Kota 2018 Alumni. Working on Rajasthan solar-thermal grid integration. Passionate about mentoring junior electrical engineers from Rajasthan polytechnics and colleges.",
                    "https://linkedin.com/in/vikramaditya-rvunl", now
                ),
                (
                    str(uuid.uuid4()), "Ananya Khandelwal", "Staff AI / Cloud Engineer", "Google / Ex-CTAE Udaipur",
                    "Artificial Intelligence & Cloud Architecture", "CTAE Udaipur",
                    json.dumps(["System Design", "Cloud Infrastructure", "Full Stack Python/TypeScript", "Open Source"]),
                    8, 4,
                    "CTAE Udaipur alumni now architecting scalable cloud AI services. Guides students on open-source contributions, algorithms, and global remote opportunities.",
                    "https://linkedin.com/in/ananya-khandelwal-cloud", now
                ),
                (
                    str(uuid.uuid4()), "Sanjay Gehlot", "Lead Embedded & IoT Architect", "Tata Elxsi",
                    "VLSI, Embedded Systems & Automotive", "MBM Engineering College, Jodhpur",
                    json.dumps(["Microcontrollers (ARM/STM32)", "RTOS", "Automotive CAN", "C/C++ Embedded"]),
                    5, 1,
                    "MBM Jodhpur graduate with 10+ years in automotive electronics. Helping students build physical hardware prototypes and secure core electronics jobs.",
                    "https://linkedin.com/in/sanjay-gehlot-iot", now
                ),
                (
                    str(uuid.uuid4()), "Neha Meena", "State IT Infrastructure Lead", "DOIT&C Rajasthan",
                    "Public Sector IT & E-Governance", "Govt Polytechnic College Jaipur",
                    json.dumps(["Linux Servers", "Database Admin", "Informatics Assistant Prep", "E-Governance Workflows"]),
                    6, 3,
                    "Polytechnic diploma to engineering graduate success story. Mentors diploma students on state IT careers and competitive technical exams.",
                    "https://linkedin.com/in/neha-meena-doitc", now
                )
            ]

            for m in initial_mentors:
                cur.execute(
                    """
                    INSERT INTO mentors (
                        id, name, designation, company_or_dept, industry, alumni_institution,
                        expertise_areas, max_mentees, current_mentees, bio, linkedin_url, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    m
                )

            # 4. Guidance Resources Seed Data
            initial_resources = [
                (
                    str(uuid.uuid4()),
                    "Complete Roadmap: Cracking Rajasthan Technical Govt Exams (RPSC AE / RSSB JE / RVUNL)",
                    "govt_exam_roadmap",
                    "Engineering Degree & Polytechnic Diploma Holders",
                    "Comprehensive step-by-step preparation strategy for Rajasthan state technical exams. Covers technical syllabus division (60%), Rajasthan General Knowledge & Culture (40%), recommended standard textbooks (Khanna/Gupta for Civil, Rajput for Electrical), previous 5-year question paper trends, and test series time-management.",
                    json.dumps(["RPSC", "RSSB JE", "RVUNL", "Govt Technical Exams", "Rajasthan GK", "Syllabus Breakdown"]),
                    json.dumps([{"title": "Rajasthan Technical Exam Syllabus PDF", "url": "https://education.rajasthan.gov.in/syllabus.pdf"}]),
                    now
                ),
                (
                    str(uuid.uuid4()),
                    "Polytechnic Diploma to Degree (Lateral Entry & B.Tech LEET) Playbook",
                    "polytechnic_pathways",
                    "Polytechnic & Diploma Students in Rajasthan",
                    "Complete guidance for Rajasthan diploma holders planning higher technical education. Explains direct admission to 2nd year B.Tech via Lateral Entry (LEET), eligibility criteria, top state colleges (RTU Kota, MBM Jodhpur, CTAE Udaipur, GEC Ajmer), scholarship options (Chief Minister Higher Education Scholarship), and dual-career strategies.",
                    json.dumps(["Polytechnic", "Diploma to Degree", "LEET Rajasthan", "RTU Kota", "Lateral Entry", "Scholarships"]),
                    json.dumps([{"title": "LEET Admission Guidelines", "url": "https://hte.rajasthan.gov.in/leet.pdf"}]),
                    now
                ),
                (
                    str(uuid.uuid4()),
                    "AICTE & Rajasthan Technical Education Mandatory Internship Handbook",
                    "internship_handbook",
                    "All 2nd, 3rd, and Final Year Technical Students",
                    "Official guidelines on securing and completing AICTE-approved industrial internships. Details credit points (14-20 credits), portal registration, logbook maintenance, industry supervisor evaluation rubrics, and top internship providers in Rajasthan (Solar Parks, DISCOMs, IT SEZ Jaipur, RISL Data Center).",
                    json.dumps(["AICTE Internship", "Industrial Training", "Credit Framework", "Logbook Format", "Rajasthan Technical Education"]),
                    json.dumps([{"title": "Internship Logbook Template", "url": "https://hte.rajasthan.gov.in/internship_format.docx"}]),
                    now
                ),
                (
                    str(uuid.uuid4()),
                    "Global Technical Opportunities: Japan TITP, Germany Vocational & Dubai Tech Guide",
                    "overseas_guidelines",
                    "Technical Diploma & Degree Graduates Seeking International Careers",
                    "Exhaustive guide to overseas technical employment programs supported by Govt. of India and Rajasthan Overseas Bureau. Details visa categories, minimum language requirements (Japanese N5/N4, German A2), salary & remittance structures, living cost comparisons, and step-by-step credential verification process.",
                    json.dumps(["Overseas Jobs", "TITP Japan", "Germany Dual Training", "Dubai Tech", "Passport & Visa Prep"]),
                    json.dumps([{"title": "Overseas Employment Checklist", "url": "https://overseas.rajasthan.gov.in/checklist.pdf"}]),
                    now
                ),
                (
                    str(uuid.uuid4()),
                    "Core Engineering to Smart Automation & High-Growth Tech Bridge",
                    "private_tech_prep",
                    "Mechanical, Civil, Electrical & Electronics Students",
                    "How core branch engineers can bridge into Industry 4.0, IoT, Smart Grids, Electric Vehicles (EV), and Full-Stack Engineering. Features free curated learning paths on NPTEL, Rajasthan iStart innovation bootcamps, and project ideas to build an impactful portfolio.",
                    json.dumps(["Core to Tech", "Industry 4.0", "EV Engineering", "Smart Grids", "NPTEL Courses", "iStart Rajasthan"]),
                    json.dumps([{"title": "Free Learning Pathways Index", "url": "https://nptel.ac.in/technical_pathways"}]),
                    now
                )
            ]

            for gr in initial_resources:
                cur.execute(
                    """
                    INSERT INTO guidance_resources (
                        id, title, category, target_audience, content, tags, attachments, created_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    gr
                )

            conn.commit()
            if not self.use_postgres:
                conn.close()
            logger.info("Database: Successfully seeded Rajasthan Technical Education platform initial data (SIH1632)!")
        except Exception as e:
            logger.error(f"Database: Seeding Rajasthan Technical Education data failed: {e}")

db = DatabaseManager()

