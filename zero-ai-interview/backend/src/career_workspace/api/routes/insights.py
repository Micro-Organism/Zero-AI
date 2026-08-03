from collections import Counter

from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from career_workspace.core.database import get_db
from career_workspace.models.entities import GapItem, JobRequirement, User
from career_workspace.services.auth import get_current_user

router = APIRouter(tags=["insights"])


@router.get("/insights/skills")
def skill_insights(db: Session = Depends(get_db), user: User = Depends(get_current_user)):
    requirements = list(
        db.scalars(select(JobRequirement).where(JobRequirement.user_id == user.id))
    )
    counter = Counter(item.skill or item.description[:30] for item in requirements)
    gaps = list(db.scalars(select(GapItem).where(GapItem.user_id == user.id, GapItem.status == "open")))
    return {
        "skill_frequency": [
            {"skill": skill, "count": count} for skill, count in counter.most_common(20)
        ],
        "open_gap_count": len(gaps),
        "recommendations": [
            "优先补齐重复出现的必备技能证据",
            "每个技能至少关联一个可复现项目",
            "为项目补充基线、指标、失败案例与个人贡献",
        ],
    }
