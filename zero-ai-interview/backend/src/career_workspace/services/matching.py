import json

from sqlalchemy import select
from sqlalchemy.orm import Session

from career_workspace.models.entities import (
    GapItem,
    JobRequirement,
    MatchingProject,
    RequirementEvidence,
)

WEIGHTS = {
    "required": 5,
    "preferred": 2,
    "soft_skill": 1,
    "responsibility": 2,
    "domain": 2,
    "company_specific": 0,
}


def infer_strength(requirement: JobRequirement, snapshot: dict) -> tuple[int, str]:
    source = json.dumps(snapshot, ensure_ascii=False).lower()
    candidates = [requirement.skill, requirement.description]
    tokens = []
    for candidate in candidates:
        tokens.extend(
            token.strip().lower()
            for token in candidate.replace("/", " ").replace("、", " ").split()
            if len(token.strip()) >= 2
        )
    matched = [token for token in tokens if token in source]
    if matched:
        return 4, f"简历版本中包含相关证据：{', '.join(dict.fromkeys(matched))}"
    return 0, "当前简历版本中未找到可验证证据"


def recalculate(db: Session, project: MatchingProject, requirements: list[JobRequirement], snapshot: dict):
    existing = {
        item.requirement_id: item
        for item in db.scalars(
            select(RequirementEvidence).where(RequirementEvidence.matching_project_id == project.id)
        )
    }
    db.query(GapItem).filter(GapItem.matching_project_id == project.id).delete()
    breakdown = []
    weighted_score = 0.0
    total_weight = 0
    for requirement in requirements:
        weight = WEIGHTS.get(requirement.kind, 1)
        evidence = existing.get(requirement.id)
        if evidence and evidence.is_manual:
            strength = evidence.strength
            explanation = evidence.explanation
        else:
            strength, explanation = infer_strength(requirement, snapshot)
            if not evidence:
                evidence = RequirementEvidence(
                    user_id=project.user_id,
                    matching_project_id=project.id,
                    requirement_id=requirement.id,
                )
                db.add(evidence)
            evidence.strength = strength
            evidence.explanation = explanation
        if weight:
            weighted_score += weight * (strength / 4)
            total_weight += weight
        breakdown.append(
            {
                "requirement_id": requirement.id,
                "kind": requirement.kind,
                "skill": requirement.skill,
                "description": requirement.description,
                "weight": weight,
                "strength": strength,
                "explanation": explanation,
            }
        )
        if strength < 2 and requirement.kind != "company_specific":
            db.add(
                GapItem(
                    user_id=project.user_id,
                    matching_project_id=project.id,
                    requirement_id=requirement.id,
                    priority="high" if requirement.kind == "required" else "medium",
                    suggestion=f"补充 {requirement.skill or requirement.description} 的项目证据或学习计划",
                )
            )
    project.total_score = round((weighted_score / total_weight) * 100, 1) if total_weight else 0
    project.score_breakdown = breakdown
    project.status = "analyzed"
    db.flush()
    return project
