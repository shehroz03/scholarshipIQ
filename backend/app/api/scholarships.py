from fastapi import APIRouter, Depends, Query, HTTPException
from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.db import models, schemas
from app.db.session import get_db
from app.api.deps import get_current_user
from app.utils.scoring import calculate_match_score

router = APIRouter()

@router.get("/", response_model=schemas.PaginatedScholarshipResponse)
def list_scholarships(
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    page_size: int = Query(15, ge=1, le=100, description="Number of items per page"),
    country: Optional[str] = None,
    city: Optional[str] = None,
    level: Optional[str] = None,
    field: Optional[str] = None,
    funding_type: Optional[str] = None,
    keyword: Optional[str] = None,
    university_id: Optional[int] = None,
    min_cgpa: Optional[float] = None,
    min_funding_amount: Optional[float] = None,
    field_category: Optional[str] = None,
    deadline_before: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: Optional[models.User] = Depends(get_current_user)
):
    """
    List scholarships with pagination support.
    Returns paginated results with metadata.
    """
    # Build the base query
    query = db.query(models.Scholarship).options(joinedload(models.Scholarship.university))
    
    # Apply filters
    if university_id:
        query = query.filter(models.Scholarship.university_id == university_id)
    if country and country.lower() != "all":
        query = query.filter(models.Scholarship.country.ilike(f"%{country}%"))
    if city and city.lower() != "all" and city != "":
        query = query.filter(models.Scholarship.city.ilike(f"%{city}%"))
    if level and level.lower() != "all":
        query = query.filter(models.Scholarship.degree_level.ilike(f"%{level}%"))
    if field and field.lower() != "all":
        query = query.filter(models.Scholarship.field_of_study.ilike(f"%{field}%"))
    if funding_type:
        query = query.filter(models.Scholarship.funding_type.ilike(f"%{funding_type}%"))
    if keyword:
        query = query.join(models.Scholarship.university).filter(
            (models.Scholarship.title.ilike(f"%{keyword}%")) | 
            (models.Scholarship.description.ilike(f"%{keyword}%")) |
            (models.University.name.ilike(f"%{keyword}%"))
        )
    
    # Advanced Filters
    if min_cgpa is not None:
        if not keyword:
            query = query.join(models.University)
        query = query.filter(models.University.min_cgpa <= min_cgpa)
    if min_funding_amount is not None:
        query = query.filter(models.Scholarship.scholarship_amount_numeric >= min_funding_amount)
    if field_category:
        query = query.filter(models.Scholarship.field_of_study.ilike(f"%{field_category}%"))
    if deadline_before:
        from datetime import datetime
        try:
            deadline_dt = datetime.strptime(deadline_before, "%Y-%m-%d")
            query = query.filter(models.Scholarship.deadline <= deadline_dt)
        except ValueError:
            pass # Invalid date format
    
    # Get total count before pagination
    total = query.count()
    
    # Calculate pagination
    total_pages = (total + page_size - 1) // page_size  # Ceiling division
    offset = (page - 1) * page_size
    
    # Apply pagination
    scholarships = query.offset(offset).limit(page_size).all()
    
    # Populate university_name and calculate score
    for s in scholarships:
        if s.university:
            s.university_name = s.university.name
        
        # Calculate matching score if user is logged in
        if current_user:
            s.match_score = calculate_match_score(current_user, s)
        else:
            s.match_score = 0

    # Sort by match score if logged in
    if current_user:
        scholarships.sort(key=lambda x: x.match_score, reverse=True)
    
    return {
        "results": scholarships,
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }

@router.get("/filters/countries")
def get_countries_filter(
    db: Session = Depends(get_db)
):
    """Returns a list of unique countries from Universities."""
    countries = db.query(models.University.country).distinct().order_by(models.University.country).all()
    return [c[0] for c in countries if c[0]]

@router.get("/filters/fields")
def get_fields_filter(
    db: Session = Depends(get_db)
):
    """Returns a list of unique fields of study."""
    fields = db.query(models.Scholarship.field_of_study).distinct().order_by(models.Scholarship.field_of_study).all()
    return [f[0] for f in fields if f[0]]

@router.get("/filters/levels")
def get_levels_filter(
    db: Session = Depends(get_db)
):
    """Returns a list of unique degree levels."""
    levels = db.query(models.Scholarship.degree_level).distinct().order_by(models.Scholarship.degree_level).all()
    return [l[0] for l in levels if l[0]]

@router.get("/stats")
def get_scholarship_stats(
    db: Session = Depends(get_db)
):
    """Returns general statistics for the platform."""
    try:
        total_scholarships = db.query(models.Scholarship).count()
        total_countries = db.query(models.University.country).distinct().count()
        total_universities = db.query(models.University).count()
        
        # Get top countries with counts
        from sqlalchemy import func
        country_counts = db.query(
            models.Scholarship.country, 
            func.count(models.Scholarship.id)
        ).group_by(models.Scholarship.country).order_by(func.count(models.Scholarship.id).desc()).limit(10).all()
        
        # Get top fields with counts
        field_counts = db.query(
            models.Scholarship.field_of_study,
            func.count(models.Scholarship.id)
        ).group_by(models.Scholarship.field_of_study).order_by(func.count(models.Scholarship.id).desc()).limit(15).all()

        # Support for Popular Filters
        total_masters = db.query(models.Scholarship).filter(models.Scholarship.degree_level.ilike("%Master%")).count()
        total_bachelors = db.query(models.Scholarship).filter(models.Scholarship.degree_level.ilike("%Bachelor%")).count()
        total_phd = db.query(models.Scholarship).filter(models.Scholarship.degree_level.ilike("%PhD%")).count()
        total_fully_funded = db.query(models.Scholarship).filter(models.Scholarship.funding_type.ilike("%Full%")).count()

        return {
            "total_scholarships": total_scholarships,
            "total_countries": total_countries,
            "total_universities": total_universities,
            "countries": [{"name": c[0], "count": c[1]} for c in country_counts],
            "fields": [{"name": f[0], "count": f[1]} for f in field_counts],
            "breakdown": {
                "masters": total_masters,
                "bachelors": total_bachelors,
                "phd": total_phd,
                "fully_funded": total_fully_funded
            }
        }
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/filters/cities")
def get_cities_filter(
    country: str,
    db: Session = Depends(get_db)
):
    """Returns a list of unique cities for a given country from Universities."""
    cities = db.query(models.University.city)\
        .filter(models.University.country.ilike(f"%{country}%"))\
        .distinct()\
        .order_by(models.University.city)\
        .all()
    
    return [c[0] for c in cities if c[0]]

@router.get("/universities", response_model=List[schemas.UniversityOut])
def list_universities(
    country: Optional[str] = None,
    city: Optional[str] = None,
    level: Optional[str] = None,
    field: Optional[str] = None,
    keyword: Optional[str] = None,
    skip: int = 0,
    limit: int = 25,
    db: Session = Depends(get_db)
):
    """Returns a list of universities with optional filtering including scholarship-based matches."""
    query = db.query(models.University)
    
    if country and country.lower() != "all":
        query = query.filter(models.University.country.ilike(f"%{country}%"))
    if city and city.lower() != "all" and city != "":
        query = query.filter(models.University.city.ilike(f"%{city}%"))
        
    # Advanced Filtering based on Linked Scholarships
    if level and level.lower() != "all":
        query = query.filter(models.University.scholarships.any(models.Scholarship.degree_level.ilike(f"%{level}%")))
    if field and field.lower() != "all":
        query = query.filter(models.University.scholarships.any(models.Scholarship.field_of_study.ilike(f"%{field}%")))
    if keyword:
        # Match university name OR scholarship title/description
        query = query.filter(
            (models.University.name.ilike(f"%{keyword}%")) |
            (models.University.scholarships.any(
                (models.Scholarship.title.ilike(f"%{keyword}%")) |
                (models.Scholarship.description.ilike(f"%{keyword}%"))
            ))
        )
    
    return query.offset(skip).limit(limit).all()

@router.get("/universities/by-city", response_model=List[schemas.UniversityOut])
def list_universities_by_city(
    country: str,
    city: str,
    db: Session = Depends(get_db)
):
    """Returns a list of unique universities for a given city and country."""
    return db.query(models.University).filter(
        models.University.country.ilike(f"%{country}%"),
        models.University.city.ilike(f"%{city}%")
    ).all()


@router.get("/universities/{uni_id}", response_model=schemas.UniversityDetails)
def get_university_details(
    uni_id: int,
    db: Session = Depends(get_db)
):
    """Returns detailed information for a specific university including its scholarships."""
    uni = db.query(models.University).options(joinedload(models.University.scholarships)).filter(models.University.id == uni_id).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")
    
    # Populate university_name for each scholarship in the list
    for s in uni.scholarships:
        s.university_name = uni.name

    return uni

@router.get("/universities/by-name/{name}", response_model=schemas.UniversityDetails)
def get_university_by_name(
    name: str,
    db: Session = Depends(get_db)
):
    """Returns detailed information for a specific university by name."""
    uni = db.query(models.University).options(joinedload(models.University.scholarships)).filter(models.University.name == name).first()
    if not uni:
        raise HTTPException(status_code=404, detail="University not found")
    
    for s in uni.scholarships:
        s.university_name = uni.name
        
    return uni

@router.get("/{scholarship_id}", response_model=schemas.ScholarshipOut)
def get_scholarship(
    scholarship_id: int, 
    db: Session = Depends(get_db)
):
    scholarship = db.query(models.Scholarship).options(joinedload(models.Scholarship.university)).filter(models.Scholarship.id == scholarship_id).first()
    if not scholarship:
        raise HTTPException(status_code=404, detail="Scholarship not found")
        
    if scholarship.university:
        scholarship.university_name = scholarship.university.name
        # Fallback to university coordinates if scholarship ones are missing
        if scholarship.latitude is None:
            scholarship.latitude = scholarship.university.latitude
        if scholarship.longitude is None:
            scholarship.longitude = scholarship.university.longitude
        
    return scholarship
