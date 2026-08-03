from math import ceil

from sqlalchemy import func, select
from sqlalchemy.orm import Session


def paginate(db: Session, statement, model, page: int, page_size: int) -> tuple[list, int, int]:
    page = max(page, 1)
    page_size = min(max(page_size, 1), 100)
    total = db.scalar(select(func.count()).select_from(statement.subquery())) or 0
    items = list(db.scalars(statement.offset((page - 1) * page_size).limit(page_size)).all())
    pages = ceil(total / page_size) if total else 0
    return items, total, pages
