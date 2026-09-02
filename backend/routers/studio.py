from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from backend.database import get_db
from backend.services.failure_studio import failure_studio, PRESETS

router = APIRouter(prefix="/api/v1/studio", tags=["studio"])


class CustomFailure(BaseModel):
    amount_rupees: float
    method: str
    error_code: str
    error_description: str
    customer_name: str
    language_hint: str = "en"


class FireRequest(BaseModel):
    preset: Optional[str] = None
    custom: Optional[CustomFailure] = None


@router.post("/fire")
async def fire_failure(body: FireRequest, db=Depends(get_db)):
    if not body.preset and not body.custom:
        raise HTTPException(status_code=400, detail="Provide either 'preset' or 'custom'")
    if body.preset and body.preset not in PRESETS:
        raise HTTPException(status_code=400, detail=f"Unknown preset. Choose: {list(PRESETS.keys())}")

    result = await failure_studio.fire(
        preset=body.preset,
        custom=body.custom.model_dump() if body.custom else None,
        db=db,
    )
    return result


@router.get("/presets")
async def get_presets():
    return [
        {
            "key": k,
            "label": v["label"],
            "amount_rupees": v["amount_rupees"],
            "method": v["method"],
            "description": v["error_description"],
            "error_code": v["error_code"],
            "customer_name": v["customer_name"],
            "language_hint": v.get("language_hint", "en"),
        }
        for k, v in PRESETS.items()
    ]
