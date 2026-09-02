from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from backend.database import get_db
from backend.services.policy_engine import policy_engine

router = APIRouter(prefix="/api/v1/config", tags=["config"])


class UpdateConfigRequest(BaseModel):
    value: str


@router.get("")
async def get_all_config(db=Depends(get_db)):
    return await policy_engine.get_all(db)


@router.put("/{key}")
async def update_config(key: str, body: UpdateConfigRequest, db=Depends(get_db)):
    try:
        updated = await policy_engine.update(key, body.value, db)
        return updated
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
