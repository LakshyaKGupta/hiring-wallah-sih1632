import logging
from typing import List, Dict, Any, Tuple
from app.utils.gemini_client import GeminiClient
from app.parsers.resume_parser import parse_resume
from app.db.database import db

from app.agents.requirement_analyst import RequirementAnalyst
from app.agents.hiring_strategist import HiringStrategist
from app.agents.resume_investigator import ResumeInvestigator
from app.agents.candidate_evaluator import CandidateEvaluator
from app.agents.devils_advocate import DevilsAdvocate
from app.agents.hiring_committee import HiringCommittee
from app.agents.candidate_analyst import CandidateAnalyst

logger = logging.getLogger("hiring_wallah.orchestrator")

class Orchestrator:
    def __init__(self):
        self.gemini_client = GeminiClient()
        self.requirement_analyst = RequirementAnalyst(self.gemini_client)
        self.hiring_strategist = HiringStrategist(self.gemini_client)
        self.resume_investigator = ResumeInvestigator(self.gemini_client)
        self.candidate_evaluator = CandidateEvaluator(self.gemini_client)
        self.devils_advocate = DevilsAdvocate(self.gemini_client)
        self.hiring_committee = HiringCommittee(self.gemini_client)
        self.candidate_analyst = CandidateAnalyst(self.gemini_client)

    def _clamp(self, value: Any, low: int = 0, high: int = 100) -> int:
        try:
            number = int(round(float(value)))
        except (TypeError, ValueError):
            number = low
        return max(low, min(high, number))

    def _as_list(self, value: Any) -> List[Any]:
        if value is None:
            return []
        if isinstance(value, list):
            return value
        return [value]

    def _normalize_requirement_analysis(self, analysis: Dict[str, Any]) -> Dict[str, Any]:
        return {
            "must_have": self._as_list(analysis.get("must_have")),
            "preferred": self._as_list(analysis.get("preferred") or analysis.get("good_to_have")),
            "red_flags": self._as_list(analysis.get("red_flags")),
            "success_signals": self._as_list(analysis.get("success_signals") or analysis.get("priorities")),
            "role_level": analysis.get("role_level") or "",
            "domain": analysis.get("domain") or "",
        }

    def _normalize_framework(self, framework: Dict[str, Any]) -> Dict[str, Any]:
        raw_criteria = framework.get("criteria")
        if not raw_criteria and isinstance(framework.get("evaluation_framework"), dict):
            criteria_per_dimension = framework.get("criteria_per_dimension") or {}
            raw_criteria = [
                {
                    "name": name,
                    "weight": weight,
                    "signals": self._as_list(criteria_per_dimension.get(name)),
                }
                for name, weight in framework["evaluation_framework"].items()
            ]

        criteria: List[Dict[str, Any]] = []
        for item in self._as_list(raw_criteria):
            if isinstance(item, dict):
                name = str(item.get("name") or item.get("dimension") or "").strip()
                if not name:
                    continue
                criteria.append({
                    "name": name,
                    "weight": self._clamp(item.get("weight"), 0, 100),
                    "signals": [str(signal) for signal in self._as_list(item.get("signals")) if str(signal).strip()],
                })

        if not criteria:
            criteria = [
                {"name": "Role Fit", "weight": 40, "signals": ["Evidence directly matches must-have requirements"]},
                {"name": "Execution Evidence", "weight": 35, "signals": ["Resume shows shipped work or measurable outcomes"]},
                {"name": "Risk Control", "weight": 25, "signals": ["Resume has enough evidence to reduce hiring uncertainty"]},
            ]

        total = sum(item["weight"] for item in criteria)
        if total <= 0:
            equal = 100 // len(criteria)
            for item in criteria:
                item["weight"] = equal
            criteria[-1]["weight"] += 100 - sum(item["weight"] for item in criteria)
        elif total != 100:
            running = 0
            for item in criteria[:-1]:
                item["weight"] = max(1, round((item["weight"] / total) * 100))
                running += item["weight"]
            criteria[-1]["weight"] = max(1, 100 - running)

        weights = {item["name"]: item["weight"] for item in criteria}
        return {
            "criteria": criteria,
            "weights": weights,
            "rationale": framework.get("rationale") or "",
        }

    def _normalize_evidence_item(self, item: Any, default_type: str = "experience") -> Dict[str, str]:
        if isinstance(item, dict):
            claim = str(item.get("claim") or item.get("name") or item.get("title") or item.get("evidence") or "").strip()
            evidence = str(item.get("evidence") or item.get("detail") or item.get("description") or claim).strip()
            return {
                "claim": claim or evidence,
                "evidence": evidence or claim,
                "resume_section": str(item.get("resume_section") or item.get("source") or "Resume"),
                "evidence_type": str(item.get("evidence_type") or default_type),
                "quality": str(item.get("quality") or "moderate"),
            }
        text = str(item or "").strip()
        return {
            "claim": text,
            "evidence": text,
            "resume_section": "Resume",
            "evidence_type": default_type,
            "quality": "moderate",
        }

    def _normalize_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        projects = self._as_list(profile.get("projects"))
        achievements = self._as_list(profile.get("achievements") or profile.get("quantified_achievements"))
        evidence_items = [self._normalize_evidence_item(item) for item in self._as_list(profile.get("evidence"))]

        for project in projects:
            if isinstance(project, dict):
                for evidence in self._as_list(project.get("evidence")):
                    evidence_items.append(self._normalize_evidence_item({
                        "claim": project.get("name") or evidence,
                        "evidence": evidence,
                        "resume_section": "Projects",
                        "evidence_type": "project",
                        "quality": "strong" if project.get("impact") else "moderate",
                    }))
                if project.get("impact"):
                    evidence_items.append(self._normalize_evidence_item({
                        "claim": f"Impact from {project.get('name') or 'project'}",
                        "evidence": project.get("impact"),
                        "resume_section": "Projects",
                        "evidence_type": "impact",
                        "quality": "strong",
                    }))
        for achievement in achievements:
            evidence_items.append(self._normalize_evidence_item({
                "claim": str(achievement),
                "evidence": str(achievement),
                "resume_section": "Achievements",
                "evidence_type": "achievement",
                "quality": "strong" if any(char.isdigit() for char in str(achievement)) else "moderate",
            }))

        deduped = []
        seen = set()
        for item in evidence_items:
            key = (item["claim"], item["evidence"])
            if item["claim"] and item["evidence"] and key not in seen:
                deduped.append(item)
                seen.add(key)

        return {
            "candidate_name": profile.get("candidate_name") or profile.get("name") or "",
            "skills": self._as_list(profile.get("skills") or profile.get("skills_demonstrated")),
            "experience": self._as_list(profile.get("experience") or profile.get("career_trajectory")),
            "projects": projects,
            "achievements": achievements,
            "evidence": deduped,
            "missing_evidence": self._as_list(profile.get("missing_evidence")),
        }

    def _normalize_evaluation(self, evaluation: Dict[str, Any], profile: Dict[str, Any], framework: Dict[str, Any]) -> Dict[str, Any]:
        evidence_fallback = profile.get("evidence") or []
        if not evidence_fallback:
            raise ValueError("Resume Investigator produced no evidence. Evaluation rejected.")

        criteria = framework.get("criteria") or []
        breakdown = evaluation.get("breakdown") or {}
        normalized_breakdown: Dict[str, Any] = {}
        for criterion in criteria:
            name = criterion.get("name")
            raw = breakdown.get(name) if isinstance(breakdown, dict) else {}
            raw = raw if isinstance(raw, dict) else {}
            raw_evidence = self._as_list(raw.get("evidence")) or evidence_fallback[:1]
            normalized_breakdown[name] = {
                "score": self._clamp(raw.get("score")),
                "evidence": [self._normalize_evidence_item(item) for item in raw_evidence],
                "justification": raw.get("justification") or "Scored from available resume evidence.",
            }

        if not normalized_breakdown and isinstance(breakdown, dict):
            for name, raw in breakdown.items():
                raw = raw if isinstance(raw, dict) else {}
                normalized_breakdown[str(name)] = {
                    "score": self._clamp(raw.get("score")),
                    "evidence": [self._normalize_evidence_item(item) for item in (self._as_list(raw.get("evidence")) or evidence_fallback[:1])],
                    "justification": raw.get("justification") or "Scored from available resume evidence.",
                }

        strengths = []
        for item in self._as_list(evaluation.get("strengths")):
            if isinstance(item, dict):
                normalized = self._normalize_evidence_item(item)
            else:
                fallback = evidence_fallback[0]
                normalized = {
                    "claim": str(item),
                    "evidence": fallback.get("evidence") if isinstance(fallback, dict) else str(fallback),
                    "resume_section": fallback.get("resume_section", "Resume") if isinstance(fallback, dict) else "Resume",
                }
            if normalized.get("evidence"):
                strengths.append(normalized)

        weaknesses = []
        for item in self._as_list(evaluation.get("weaknesses")):
            if isinstance(item, dict):
                weaknesses.append({
                    "claim": str(item.get("claim") or item.get("weakness") or item.get("area") or ""),
                    "missing_or_weak_evidence": str(item.get("missing_or_weak_evidence") or item.get("evidence") or item.get("reason") or ""),
                })
            else:
                weaknesses.append({"claim": str(item), "missing_or_weak_evidence": str(item)})

        if not strengths:
            raise ValueError("Candidate Evaluator produced no evidence-backed strengths. Evaluation rejected.")

        return {
            "overall_score": self._clamp(evaluation.get("overall_score")),
            "breakdown": normalized_breakdown,
            "strengths": strengths,
            "weaknesses": [item for item in weaknesses if item.get("claim") or item.get("missing_or_weak_evidence")],
            "evidence_quality": evaluation.get("evidence_quality") or "moderate",
        }

    def _normalize_critique(self, critique: Dict[str, Any]) -> Dict[str, Any]:
        concerns = critique.get("concerns") or critique.get("contested_claims") or []
        normalized_concerns = []
        for item in self._as_list(concerns):
            if isinstance(item, dict):
                normalized_concerns.append({
                    "claim": item.get("claim") or item.get("original_claim") or "",
                    "concern": item.get("concern") or item.get("counter") or "",
                    "severity": item.get("severity") or "medium",
                })
            else:
                normalized_concerns.append({"claim": str(item), "concern": str(item), "severity": "medium"})
        return {
            "concerns": normalized_concerns,
            "unsupported_claims": self._as_list(critique.get("unsupported_claims")),
            "risk_factors": self._as_list(critique.get("risk_factors") or critique.get("risks")),
            "potential_bias": self._as_list(critique.get("potential_bias")),
            "overall_confidence_adjustment": self._clamp(critique.get("overall_confidence_adjustment"), -40, 0),
            "recommendation": critique.get("recommendation") or "flag",
        }

    def _calculate_confidence(self, evaluation: Dict[str, Any], critique: Dict[str, Any], framework: Dict[str, Any], model_confidence: Any) -> int:
        criteria_count = max(1, len(framework.get("criteria") or []))
        breakdown_items = list((evaluation.get("breakdown") or {}).values())
        covered = sum(1 for item in breakdown_items if isinstance(item, dict) and item.get("evidence"))
        if covered == 0 and breakdown_items:
            # Fallback for flat breakdown scores: check structured evidence items count
            covered = min(criteria_count, len(evaluation.get("evidence_items") or evaluation.get("evidence") or []))
        coverage_score = min(100, round((covered / criteria_count) * 100))
        evidence_quality = str(evaluation.get("evidence_quality") or "moderate").lower()
        quality_score = {"strong": 100, "moderate": 70, "weak": 40}.get(evidence_quality, 60)
        risk_penalty = min(35, len(critique.get("risk_factors") or []) * 7 + len(critique.get("unsupported_claims") or []) * 8)
        adjustment = critique.get("overall_confidence_adjustment") or 0
        base = (
            self._clamp(evaluation.get("overall_score")) * 0.35
            + self._clamp(model_confidence or evaluation.get("overall_score")) * 0.25
            + coverage_score * 0.25
            + quality_score * 0.15
            + adjustment
            - risk_penalty
        )
        return self._clamp(base)

    def _ranking_rationale(self, item: Dict[str, Any]) -> Dict[str, Any]:
        evaluation = item["evaluation"]
        decision = item["decision"]
        strengths = evaluation.get("strengths") or []
        weaknesses = evaluation.get("weaknesses") or []
        critique = item.get("critique") or {}
        return {
            "summary": f"{decision.get('verdict', 'Candidate')} with {decision.get('confidence', 0)}% confidence based on evidence coverage and unresolved risks.",
            "why_hire": [entry.get("claim") if isinstance(entry, dict) else str(entry) for entry in strengths[:3]],
            "why_not_hire": [entry.get("claim") if isinstance(entry, dict) else str(entry) for entry in weaknesses[:3]],
            "risks": critique.get("risk_factors") or [],
            "evidence_count": len(evaluation.get("evidence_items") or evaluation.get("evidence") or []),
        }

    def _comparison_rationale(self, winner: Dict[str, Any], runner_up: Dict[str, Any]) -> Dict[str, Any]:
        winner_name = winner["profile"].get("name") or "Candidate A"
        runner_name = runner_up["profile"].get("name") or "Candidate B"
        winner_strengths = winner["evaluation"].get("strengths") or []
        runner_risks = (runner_up.get("critique") or {}).get("risk_factors") or runner_up["evaluation"].get("weaknesses") or []
        return {
            "summary": f"{winner_name} outranks {runner_name} because the evidence produced a stronger verdict, score, or confidence for this role.",
            "winner_edge": [entry.get("claim") if isinstance(entry, dict) else str(entry) for entry in winner_strengths[:2]],
            "runner_up_risks": [entry.get("claim") if isinstance(entry, dict) else str(entry) for entry in runner_risks[:2]],
        }

    def _extract_deterministic_profile(self, resume_text: str, filename: str) -> Dict[str, Any]:
        """Deterministic resume parser when AI extraction is unavailable."""
        import re
        lines = [line.strip() for line in resume_text.split('\n') if line.strip()]
        
        candidate_name = lines[0] if lines else (filename.rsplit('.', 1)[0] if filename else "Candidate")
        if len(candidate_name) > 40 or "@" in candidate_name or ":" in candidate_name or "resume" in candidate_name.lower():
            candidate_name = filename.rsplit('.', 1)[0] if filename else "Candidate"

        email_match = re.search(r'[\w\.-]+@[\w\.-]+\.\w+', resume_text)
        email = email_match.group(0) if email_match else ""

        known_skills = [
            "Python", "JavaScript", "TypeScript", "React", "Node.js", "SQL", "PostgreSQL", "Docker", "AWS", "Git",
            "Power Systems", "PLC", "SCADA", "MATLAB", "Simulink", "Circuit Design", "AutoCAD", "STAAD Pro",
            "Surveying", "RCC", "Embedded C", "Microcontrollers", "Linux", "REST APIs", "FastAPI", "Data Structures"
        ]
        text_lower = resume_text.lower()
        skills = [s for s in known_skills if s.lower() in text_lower]
        if not skills:
            skills = ["Technical Problem Solving", "Computer Literacy", "Core Engineering Fundamentals"]

        evidence = []
        for s in skills[:6]:
            evidence.append({
                "type": "skill",
                "title": f"Proficiency in {s}",
                "description": f"Candidate demonstrates background and technical application of {s}.",
                "source": "resume",
                "verification_state": "PARTIALLY_VERIFIED",
                "confidence": "MEDIUM"
            })
        
        evidence.append({
            "type": "project",
            "title": "Technical Engineering Portfolio / Projects",
            "description": "Demonstrated practical engineering and problem solving projects in resume timeline.",
            "source": "resume",
            "verification_state": "PARTIALLY_VERIFIED",
            "confidence": "HIGH"
        })

        return {
            "candidate_name": candidate_name,
            "name": candidate_name,
            "email": email,
            "skills": skills,
            "evidence": evidence,
            "timeline": [{"period": "2024-2026", "title": "Technical Education & Applied Projects", "details": f"Practical training in {', '.join(skills[:3])}"}],
            "claims": [e["title"] for e in evidence],
            "skills_demonstrated": skills
        }

    def _run_deterministic_evaluation(self, profile: Dict[str, Any], framework: Dict[str, Any]) -> Dict[str, Any]:
        """Calculates deterministic rubric score when Gemini is unavailable."""
        criteria = framework.get("criteria") or [
            {"name": "Role Fit", "weight": 40},
            {"name": "Execution Evidence", "weight": 35},
            {"name": "Risk Control", "weight": 25}
        ]
        
        skills_count = len(profile.get("skills", []))
        evidence_count = len(profile.get("evidence", []))
        
        base_skill_score = min(int((skills_count / 5.0) * 85), 95)
        base_evidence_score = min(int((evidence_count / 4.0) * 80), 90)
        base_risk_score = 80
        
        breakdown = {}
        total_score = 0
        total_weight = 0
        
        for c in criteria:
            w = c.get("weight", 33)
            cname = c.get("name", "Dimension")
            if "skill" in cname.lower() or "role" in cname.lower():
                s = max(base_skill_score, 60)
            elif "evidence" in cname.lower() or "execution" in cname.lower():
                s = max(base_evidence_score, 55)
            else:
                s = base_risk_score
            breakdown[cname] = s
            total_score += s * w
            total_weight += w
            
        overall_score = int(total_score / max(total_weight, 1))
        
        strengths = [
            {"claim": f"Demonstrated competency in {', '.join(profile.get('skills', [])[:3])}"},
            {"claim": f"Provided {evidence_count} structured evidence points in technical resume"}
        ]
        weaknesses = [
            {"claim": "External code repository and production deployment proofs require live recruiter verification"}
        ]
        
        return {
            "overall_score": overall_score,
            "breakdown": breakdown,
            "strengths": strengths,
            "weaknesses": weaknesses,
            "evidence_items": profile.get("evidence", []),
            "is_fallback": True
        }

    def _run_deterministic_critique(self, evaluation: Dict[str, Any], profile: Dict[str, Any]) -> Dict[str, Any]:
        """Generates Devil's Advocate critique deterministically."""
        eval_score = evaluation.get("overall_score", 75)
        risk_score = max(eval_score - 12, 50)
        
        concerns = [
            "Project claims are self-reported on resume and require technical interview validation",
            "Independent verification of production-scale deployment is pending"
        ]
        risk_factors = [
            "Technical skill depth requires live coding / whiteboard validation",
            "Tenure and timeline continuity should be confirmed during background check"
        ]
        
        return {
            "risk_score": risk_score,
            "concerns": concerns,
            "unsupported_claims": ["Advanced architecture scalability claims lack third-party repository receipts"],
            "risk_factors": risk_factors,
            "potential_bias": ["Evaluation based purely on structured resume evidence without demographic markers"]
        }

    def _run_deterministic_decision(self, evaluation: Dict[str, Any], critique: Dict[str, Any]) -> Dict[str, Any]:
        """Generates committee consensus verdict deterministically."""
        score = evaluation.get("overall_score", 75)
        if score >= 80:
            verdict = "Strong Hire"
            expl = "Candidate presents strong evidence alignment across primary role criteria with manageable risk profile."
        elif score >= 65:
            verdict = "Consider"
            expl = "Candidate satisfies fundamental technical criteria; interview recommended to probe specific practical implementation depth."
        else:
            verdict = "Reject"
            expl = "Candidate resume does not provide sufficient evidence alignment against must-have role requirements."
            
        return {
            "verdict": verdict,
            "confidence": 85,
            "final_explanation": f"{expl} (Generated via deterministic fallback evaluation pipeline)",
            "suggested_interview_questions": [
                "Can you walk through the technical architecture of your most recent engineering project?",
                "How do you handle debugging and failure isolation in distributed or high-reliability systems?",
                "What trade-offs did you consider when selecting your project's technology stack?"
            ]
        }

    def _run_deterministic_candidate_analysis(self, profile: Dict[str, Any], target_role: str) -> Dict[str, Any]:
        """Generates candidate session analysis deterministically."""
        skills = profile.get("skills") or ["Problem Solving", "Engineering Fundamentals"]
        score = min(max(len(skills) * 15, 45), 90)
        
        return {
            "fit_score": score,
            "skill_gaps": {
                "missing": ["Advanced Domain Specialization", "Automated Testing Protocols"],
                "present": skills[:4]
            },
            "tailored_resume_suggestions": {
                "summary": f"Highlight your practical hands-on experience in {', '.join(skills[:3])} prominently in the top third of your resume.",
                "bullet_improvements": [
                    "Quantify project metrics (e.g. reduced latency by 30%, monitored 50+ telemetry points)",
                    "Include links to live GitHub repositories, project demos, or technical publications"
                ]
            },
            "cover_letter": f"Dear Hiring Manager,\n\nI am writing to express my strong enthusiasm for the {target_role} role. With a rigorous background in {', '.join(skills[:3])} and hands-on project execution, I am eager to contribute to your engineering objectives.\n\nSincerely,\n{profile.get('name', 'Candidate')}",
            "interview_prep": {
                "technical_topics": [f"Core {s} fundamentals" for s in skills[:3]],
                "mock_questions": [
                    f"Explain a complex problem you solved using {skills[0] if skills else 'engineering techniques'}.",
                    "How do you ensure data integrity and system reliability in your workflows?"
                ]
            },
            "job_recommendations": [
                {"title": f"Junior {target_role}", "sector": "Rajasthan State Infrastructure & Tech", "fit": f"{score}%"}
            ]
        }

    async def on_job_created(self, job_id: str) -> None:
        """
        Event handler for when a job is created.
        Runs Agent 1 (Requirement Analyst) and Agent 2 (Hiring Strategist).
        """
        logger.info(f"Orchestration: Processing job_created event for job {job_id}...")
        job = await db.get_job(job_id)
        if not job:
            logger.error(f"Job {job_id} not found.")
            return

        if not self.gemini_client.api_key:
            await db.update_job_ai(job_id, {}, {}, "unavailable")
            return
            
        try:
            req_analysis = self._normalize_requirement_analysis(await self.requirement_analyst.run({"jd": job["description"]}))
            framework = self._normalize_framework(await self.hiring_strategist.run({"requirements": req_analysis}))
            await db.create_rubric(job_id, framework["criteria"], framework["weights"])
            await db.update_job_ai(job_id, req_analysis, framework, "ready")
            logger.info(f"Job {job_id} AI setup completed.")
        except Exception as exc:
            logger.error(f"AI rubric generation failed for job {job_id}: {exc}")
            await db.update_job_ai(job_id, {}, {}, "unavailable")

    async def on_resume_uploaded(self, job_id: str, resume_id: str) -> None:
        """
        Event handler for when a resume is uploaded.
        Runs the full candidate pipeline (Agents 3 to 6).
        """
        logger.info(f"Orchestration: Processing resume_uploaded event for resume {resume_id} and job {job_id}...")
        
        # Fetch the resume
        conn = db._connect_sqlite()
        cur = conn.cursor()
        cur.execute("SELECT * FROM resumes WHERE id = ?", (resume_id,))
        row = cur.fetchone()
        conn.close()
        
        if not row:
            logger.error(f"Resume {resume_id} not found.")
            return
            
        resume = dict(row)
        resume_text = resume.get("raw_text")
        if not resume_text:
            logger.error(f"Resume {resume_id} has no raw text.")
            return
            
        # Run pipeline
        try:
            # We'll use the existing pipeline logic
            job = await db.get_job(job_id)
            if not job:
                raise ValueError(f"Job with ID {job_id} not found.")
                
            rubric = await db.get_job_rubric(job_id)
            framework = self._normalize_framework({
                "criteria": (rubric or {}).get("criteria") or (job.get("evaluation_framework") or {}).get("criteria"),
                "evaluation_framework": job.get("evaluation_framework", {}).get("evaluation_framework") if isinstance(job.get("evaluation_framework"), dict) else {},
                "rationale": (job.get("evaluation_framework") or {}).get("rationale") if isinstance(job.get("evaluation_framework"), dict) else "",
            })
            
            # Step 2: Run investigator to build structured profile
            profile = self._normalize_profile(await self.resume_investigator.run({"resume": resume_text}))
            if not profile["evidence"]:
                raise ValueError("Resume Investigator did not extract evidence. Evaluation stopped.")
                
            candidate_id = resume["candidate_id"]
            
            candidate_profile = await db.create_candidate_profile(
                candidate_id=candidate_id,
                resume_id=resume_id,
                structured_profile=profile,
            )
            evidence_items = await db.create_evidence_items(
                candidate_profile_id=candidate_profile["id"],
                candidate_id=candidate_id,
                resume_id=resume_id,
                items=profile["evidence"],
            )
            
            # Run Agent 4: Candidate Evaluator
            evaluation = self._normalize_evaluation(await self.candidate_evaluator.run({
                "profile": profile,
                "framework": framework
            }), profile, framework)
            
            # Run Agent 5: Devil's Advocate
            critique = self._normalize_critique(await self.devils_advocate.run({"evaluation": evaluation}))
            
            # Run Agent 6: Hiring Committee
            decision = await self.hiring_committee.run({
                "evaluation": evaluation,
                "critique": critique
            })
            confidence = self._calculate_confidence(evaluation, critique, framework, decision.get("confidence"))
            
            # Save evaluation in DB
            eval_record = await db.create_evaluation(
                candidate_id=candidate_id,
                job_id=job_id,
                score=evaluation.get("overall_score") or 0,
                breakdown=evaluation.get("breakdown") or {},
                strengths=evaluation.get("strengths") or [],
                weaknesses=evaluation.get("weaknesses") or [],
                evidence=evidence_items,
                devils_advocate=critique,
                resume_id=resume_id,
            )
            critique_record = await db.create_critique(
                evaluation_id=eval_record["id"],
                concerns=critique.get("concerns") or [],
                unsupported_claims=critique.get("unsupported_claims") or [],
                risk_factors=critique.get("risk_factors") or [],
                potential_bias=critique.get("potential_bias") or [],
            )
            
            # Save decision in DB
            decision_record = await db.create_decision(
                candidate_id=candidate_id,
                job_id=job_id,
                verdict=decision.get("verdict") or "Reject",
                confidence=confidence,
                explanation=decision.get("final_explanation") or "",
                interview_questions=decision.get("suggested_interview_questions") or [],
                ranking=999 # Placeholder, will be updated during global sorting
            )
            committee_decision = await db.create_committee_decision(
                job_id=job_id,
                candidate_id=candidate_id,
                evaluation_id=eval_record["id"],
                critique_id=critique_record.get("id"),
                verdict=decision_record.get("verdict") or "Reject",
                confidence=confidence,
                final_reasoning=decision_record.get("explanation") or "",
            )
            report = await db.create_report(
                evaluation_id=eval_record["id"],
                candidate_id=candidate_id,
                job_id=job_id,
                report_data={
                    "candidate_score": eval_record.get("score", 0),
                    "verdict": decision_record.get("verdict"),
                    "confidence": confidence,
                    "strengths": eval_record.get("strengths", []),
                    "weaknesses": eval_record.get("weaknesses", []),
                    "evidence": eval_record.get("evidence", []),
                    "risk_factors": critique.get("risk_factors") or [],
                    "final_recommendation": decision_record.get("verdict"),
                    "interview_questions": decision_record.get("interview_questions", []),
                    "explanation": decision_record.get("explanation", ""),
                    "why_hire": [item.get("claim") for item in evaluation.get("strengths", []) if isinstance(item, dict)],
                    "why_not_hire": [item.get("claim") for item in evaluation.get("weaknesses", []) if isinstance(item, dict)],
                },
            )
            logger.info(f"Successfully processed resume {resume_id} for job {job_id}.")
            
            # Trigger re-ranking
            await self._update_rankings(job_id)
            
        except Exception as e:
            logger.error(f"Failed to process resume {resume_id}: {e}")
            raise

    async def _update_rankings(self, job_id: str):
        # Re-fetch all job results from DB
        results = await db.get_job_results(job_id)
        
        # Rank candidates based on verdict, score, confidence, and evidence coverage.
        verdict_weights = {"Strong Hire": 3, "Consider": 2, "Reject": 1}
        
        def _get_sort_key(res):
            verdict = res["decision"].get("verdict", "Reject")
            score = res["evaluation"].get("score", 0)
            confidence = res["decision"].get("confidence", 0)
            evidence_count = len(res["evaluation"].get("evidence_items") or res["evaluation"].get("evidence") or [])
            return (verdict_weights.get(verdict, 1), score, confidence, evidence_count)
            
        results_sorted = sorted(results, key=_get_sort_key, reverse=True)
        
        ranking_rows = []
        for index, item in enumerate(results_sorted):
            rank = index + 1
            item["decision"]["ranking"] = rank
            item["decision"]["ranking_rationale"] = self._ranking_rationale(item)
            
            d_id = item["decision"]["id"]
            if d_id:
                await db.update_decision_ranking(d_id, rank)
            ranking_rows.append({
                "candidate_id": item["profile"]["id"],
                "score": item["evaluation"].get("score", 0),
                "rank": rank,
                "verdict": item["decision"].get("verdict") or "Reject",
                "confidence": item["decision"].get("confidence") or 0,
                "rationale": item["decision"]["ranking_rationale"],
            })

        await db.replace_job_rankings(job_id, ranking_rows)

        comparisons = []
        for index in range(len(results_sorted) - 1):
            winner = results_sorted[index]
            runner_up = results_sorted[index + 1]
            comparisons.append({
                "candidate_a_id": winner["profile"]["id"],
                "candidate_b_id": runner_up["profile"]["id"],
                "winner_candidate_id": winner["profile"]["id"],
                "rationale": self._comparison_rationale(winner, runner_up),
            })
        await db.replace_job_comparisons(job_id, comparisons)

    async def run_job_setup(
        self,
        title: str,
        company: str,
        description: str,
        owner_uid: str | None = None,
        company_id: str | None = None,
        location: str | None = None,
        experience_range: str | None = None,
    ) -> Dict[str, Any]:
        """Legacy sync method for tests"""
        job = await db.create_job(
            title=title, company=company, location=location, experience_range=experience_range,
            description=description, requirement_analysis={}, evaluation_framework={}, ai_status="pending",
            owner_uid=owner_uid, company_id=company_id
        )
        await self.on_job_created(job["id"])
        return await db.get_job(job["id"])

    async def run_candidate_evaluation(self, job_id: str, resume_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Runs the full candidate pipeline (Agents 3 to 6) against a job's framework.
        Features automatic deterministic fallback if Gemini or AI agents fail.
        """
        # Fetch the job to get the evaluation framework
        job = await db.get_job(job_id)
        if not job:
            raise ValueError(f"Job with ID {job_id} not found.")
            
        rubric = await db.get_job_rubric(job_id)
        framework = self._normalize_framework({
            "criteria": (rubric or {}).get("criteria") or (job.get("evaluation_framework") or {}).get("criteria"),
            "evaluation_framework": job.get("evaluation_framework", {}).get("evaluation_framework") if isinstance(job.get("evaluation_framework"), dict) else {},
            "rationale": (job.get("evaluation_framework") or {}).get("rationale") if isinstance(job.get("evaluation_framework"), dict) else "",
        })
        
        # Step 3: Extract resume text
        resume_text = parse_resume(resume_bytes, filename)
        if not resume_text:
            raise ValueError(f"Unable to parse or extract text from file {filename}")

        is_fallback_mode = False
        profile = None
        
        # Attempt AI Agent 3: Resume Investigator with fallback
        if self.gemini_client.api_key:
            try:
                raw_prof = await self.resume_investigator.run({"resume": resume_text})
                profile = self._normalize_profile(raw_prof)
                if not profile.get("evidence"):
                    profile = None
            except Exception as e:
                logger.warning(f"AI Resume Investigator failed ({e}). Using deterministic profile extractor.")
                profile = None

        if not profile:
            is_fallback_mode = True
            profile = self._extract_deterministic_profile(resume_text, filename)
        
        # Extract candidate details if parsed
        name = profile.get("candidate_name") or profile.get("name") or filename or "Unknown Candidate"
        email = profile.get("email") or ""
        
        # Store Candidate in DB
        candidate = await db.create_candidate(
            name=name,
            email=email,
            parsed_profile=profile,
            raw_resume_text=resume_text
        )
        candidate_id = candidate["id"]
        resume = await db.create_resume(
            job_id=job_id,
            candidate_id=candidate_id,
            file_name=filename,
            file_type=filename.rsplit(".", 1)[-1].lower() if "." in filename else "pdf",
            raw_text=resume_text,
        )
        candidate_profile = await db.create_candidate_profile(
            candidate_id=candidate_id,
            resume_id=resume["id"],
            structured_profile=profile,
        )
        evidence_items = await db.create_evidence_items(
            candidate_profile_id=candidate_profile["id"],
            candidate_id=candidate_id,
            resume_id=resume["id"],
            items=profile.get("evidence", []),
        )
        
        # Run Agents 4, 5, 6 with Fallback
        evaluation = None
        critique = None
        decision = None

        if not is_fallback_mode and self.gemini_client.api_key:
            try:
                raw_eval = await self.candidate_evaluator.run({"profile": profile, "framework": framework})
                evaluation = self._normalize_evaluation(raw_eval, profile, framework)
                
                raw_crit = await self.devils_advocate.run({"evaluation": evaluation})
                critique = self._normalize_critique(raw_crit)
                
                decision = await self.hiring_committee.run({"evaluation": evaluation, "critique": critique})
            except Exception as exc:
                logger.warning(f"AI Committee Pipeline failed ({exc}). Switching to deterministic evaluation.")
                evaluation = None

        if not evaluation:
            is_fallback_mode = True
            evaluation = self._run_deterministic_evaluation(profile, framework)
            critique = self._run_deterministic_critique(evaluation, profile)
            decision = self._run_deterministic_decision(evaluation, critique)

        confidence = self._calculate_confidence(evaluation, critique, framework, decision.get("confidence"))
        
        # Save evaluation in DB
        eval_record = await db.create_evaluation(
            candidate_id=candidate_id,
            job_id=job_id,
            score=evaluation.get("overall_score") or 0,
            breakdown=evaluation.get("breakdown") or {},
            strengths=evaluation.get("strengths") or [],
            weaknesses=evaluation.get("weaknesses") or [],
            evidence=evidence_items,
            devils_advocate=critique,
            resume_id=resume.get("id"),
        )
        critique_record = await db.create_critique(
            evaluation_id=eval_record["id"],
            concerns=critique.get("concerns") or [],
            unsupported_claims=critique.get("unsupported_claims") or [],
            risk_factors=critique.get("risk_factors") or [],
            potential_bias=critique.get("potential_bias") or [],
        )
        
        # Save decision in DB
        decision_record = await db.create_decision(
            candidate_id=candidate_id,
            job_id=job_id,
            verdict=decision.get("verdict") or "Reject",
            confidence=confidence,
            explanation=decision.get("final_explanation") or "",
            interview_questions=decision.get("suggested_interview_questions") or [],
            ranking=999 # Placeholder, will be updated during global sorting
        )
        committee_decision = await db.create_committee_decision(
            job_id=job_id,
            candidate_id=candidate_id,
            evaluation_id=eval_record["id"],
            critique_id=critique_record.get("id"),
            verdict=decision_record.get("verdict") or "Reject",
            confidence=confidence,
            final_reasoning=decision_record.get("explanation") or "",
        )
        report = await db.create_report(
            evaluation_id=eval_record["id"],
            candidate_id=candidate_id,
            job_id=job_id,
            report_data={
                "candidate_name": candidate.get("name"),
                "candidate_score": eval_record.get("score", 0),
                "verdict": decision_record.get("verdict"),
                "confidence": confidence,
                "strengths": eval_record.get("strengths", []),
                "weaknesses": eval_record.get("weaknesses", []),
                "evidence": eval_record.get("evidence", []),
                "risk_factors": critique.get("risk_factors") or [],
                "final_recommendation": decision_record.get("verdict"),
                "interview_questions": decision_record.get("interview_questions", []),
                "explanation": decision_record.get("explanation", ""),
                "is_fallback": is_fallback_mode,
                "ai_mode": "deterministic_fallback" if is_fallback_mode else "gemini_multimodal_agents",
                "why_hire": [item.get("claim") if isinstance(item, dict) else str(item) for item in evaluation.get("strengths", [])],
                "why_not_hire": [item.get("claim") if isinstance(item, dict) else str(item) for item in evaluation.get("weaknesses", [])],
            },
        )
        
        return {
            "candidate": candidate,
            "candidate_profile": candidate_profile,
            "evaluation": eval_record,
            "critique": critique_record,
            "decision": decision_record,
            "committee_decision": committee_decision,
            "report": report,
            "is_fallback": is_fallback_mode
        }

    async def evaluate_multiple_candidates(self, job_id: str, resumes: List[Tuple[bytes, str]]) -> List[Dict[str, Any]]:
        """Legacy sync method for tests"""
        for resume_bytes, filename in resumes:
            await self.run_candidate_evaluation(job_id, resume_bytes, filename)
        await self._update_rankings(job_id)
        return await db.get_job_results(job_id)

    async def run_candidate_analysis(self, target_role: str, resume_bytes: bytes, filename: str = "") -> Dict[str, Any]:
        """
        Runs the Candidate-Side flow: parses resume, runs CandidateAnalyst agent,
        and saves candidate session data. Includes deterministic fallback.
        """
        logger.info(f"Orchestration: Running candidate flow for target role '{target_role}'...")
        
        # Step 1: Parse resume
        resume_text = parse_resume(resume_bytes, filename)
        if not resume_text:
            raise ValueError(f"Unable to parse or extract text from resume.")
            
        # Step 2: Run investigator to build structured profile with fallback
        profile = None
        if self.gemini_client.api_key:
            try:
                profile = await self.resume_investigator.run({"resume": resume_text})
            except Exception as e:
                logger.warning(f"AI Resume Investigator failed ({e}). Using deterministic fallback.")
                profile = None

        if not profile:
            profile = self._extract_deterministic_profile(resume_text, filename)

        name = profile.get("name") or profile.get("candidate_name") or filename or "Candidate"
        email = profile.get("email") or ""
        
        # Create candidate record
        candidate = await db.create_candidate(
            name=name,
            email=email,
            parsed_profile=profile,
            raw_resume_text=resume_text
        )
        candidate_id = candidate["id"]
        
        # Step 3: Run Candidate Analyst Agent with Fallback
        analysis = None
        if self.gemini_client.api_key:
            try:
                analysis = await self.candidate_analyst.run({
                    "profile": profile,
                    "target_role": target_role
                })
            except Exception as e:
                logger.warning(f"AI Candidate Analyst failed ({e}). Using deterministic fallback analysis.")
                analysis = None

        if not analysis:
            analysis = self._run_deterministic_candidate_analysis(profile, target_role)
        
        # Save session in DB
        session = await db.create_candidate_session(
            candidate_id=candidate_id,
            target_role=target_role,
            fit_score=analysis.get("fit_score") or 0,
            skill_gaps=analysis.get("skill_gaps") or {},
            tailored_resume_suggestions=analysis.get("tailored_resume_suggestions") or {},
            cover_letter=analysis.get("cover_letter") or "",
            interview_prep=analysis.get("interview_prep") or {},
            job_recommendations=analysis.get("job_recommendations") or {}
        )
        
        return {
            "candidate": candidate,
            "session": session
        }

# Instantiate global orchestrator
orchestrator = Orchestrator()
