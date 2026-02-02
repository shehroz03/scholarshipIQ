from fastapi import APIRouter, Depends
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.api import deps
from app.db.models import User
from app.services.resume_generator import generate_resume_pdf

router = APIRouter()

@router.get("/download")
def download_resume(
    current_user: User = Depends(deps.get_current_user),
    db: Session = Depends(get_db)
):
    # 2. PDF Generate karein
    pdf_buffer = generate_resume_pdf(current_user)

    # 3. File Return karein (Browser isay download karega)
    safe_name = current_user.full_name or "ScholarUser"
    filename = f"{safe_name.replace(' ', '_')}_Resume.pdf"
    
    return StreamingResponse(
        pdf_buffer, 
        media_type="application/pdf",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )
