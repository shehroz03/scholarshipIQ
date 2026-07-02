from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.db.models import VisaProfile, VisaRequirementTemplate, VisaChecklist, VisaChecklistItem
from datetime import datetime
import json

class VisaService:
    @staticmethod
    def calculate_readiness(db: Session, profile: VisaProfile):
        """
        Generates a premium-quality personalized checklist and readiness score.
        Implements weighted scoring and country-specific business logic.
        """
        templates = db.query(VisaRequirementTemplate).filter(
            VisaRequirementTemplate.country_code == profile.target_country.upper(),
            VisaRequirementTemplate.active == True
        ).order_by(VisaRequirementTemplate.display_order).all()

        if not templates:
            raise HTTPException(
                status_code=404, 
                detail=f"Visa requirements for {profile.target_country.upper()} are being updated."
            )

        checklist_items = []
        weighted_score_sum = 0
        max_possible_weight = 0

        # Define Critical Weights
        CRITICAL_KEYS = ["passport", "admission_letter", "cas", "coe", "financial_proof", "blocked_account"]

        for t in templates:
            status, reason, action_hint = "missing", "Requirement not yet fulfilled.", ""
            weight = 3 if t.document_key in CRITICAL_KEYS else 1
            
            # Normalize Keys & Logic
            country = profile.target_country.upper()
            
            # 1. Passport
            if t.document_key == "passport":
                if profile.passport_status == "valid":
                    status, reason = "ready", "Valid passport verified."
                elif profile.passport_status == "expired":
                    status, reason, action_hint = "verify", "Passport expired.", "Smart Guidance: Renew your passport immediately at the nearest consulate or passport office."
                elif profile.passport_status == "applied":
                    status, reason, action_hint = "verify", "Application in progress.", "Smart Guidance: You must have the physical passport before the visa interview."

            # 2. Admission Proof (Country Specific)
            elif t.document_key in ["admission_letter", "cas", "coe"]:
                if country == "AU":
                    if profile.admission_status == "coe_issued":
                        status, reason = "ready", "Confirmation of Enrolment (CoE) confirmed."
                    else:
                        status, reason, action_hint = "verify", "CoE not yet issued.", "Smart Guidance: Pay your first semester deposit to the Australian university to trigger CoE issuance."
                elif country == "UK":
                    if profile.admission_status == "cas_issued":
                        status, reason = "ready", "CAS (Confirmation of Acceptance for Studies) confirmed."
                    else:
                        status, reason, action_hint = "verify", "CAS not issued.", "Smart Guidance: Ensure all conditions on your UK offer letter are met to receive your CAS."
                elif country == "DE":
                    if profile.admission_status == "admission_letter_received":
                        status, reason = "ready", "Official Zulassungsbescheid received."
                    else:
                        status, reason, action_hint = "verify", "Admission letter missing.", "Smart Guidance: Contact the German university's International Office to confirm your final admission status."

            # 3. Financial Proof (Premium Logic)
            elif t.document_key in ["financial_proof", "blocked_account"]:
                if country == "AU":
                    if profile.bank_statement_available:
                        status, reason = "ready", "Financial capacity verified."
                    else:
                        status, reason, action_hint = "missing", "Financial proof required.", "Smart Guidance: Australia requires proof of AUD 24,505 (living) + 1st year tuition fee, held in an approved bank."
                elif country == "UK":
                    if profile.bank_statement_available:
                        status, reason = "ready", "28-day funds rule met."
                    else:
                        status, reason, action_hint = "missing", "Financial proof required.", "Smart Guidance: UK requires £12,006 (London) or £9,207 (Outside) held for 28 consecutive days."
                elif country == "DE":
                    if profile.funding_source == "blocked_account":
                        status, reason = "ready", "Sperrkonto (Blocked Account) confirmed."
                    else:
                        status, reason, action_hint = "verify", "Blocked account missing.", "Smart Guidance: Germany requires a Blocked Account (approx. €11,208) deposited via Fintiba, Expatrio, or Deutsche Bank."

            # 4. APS Verification (Germany Specific)
            elif t.document_key == "aps" and country == "DE":
                # APS is mandatory for specific nationalities (Pakistan, India, China, Vietnam)
                high_risk_aps = ["pakistan", "india", "china", "vietnam"]
                user_nationality = (profile.user.nationality or "").lower()
                
                if user_nationality in high_risk_aps:
                    status, reason, action_hint = "verify", "APS Certificate mandatory.", "Smart Guidance: Students from your region require APS verification of academic credentials before visa application."
                else:
                    status, reason, action_hint = "optional", "APS may not be required.", "Smart Guidance: Check with the German embassy if APS is required for your specific academic background."

            # 5. Health Insurance (OSHC vs DE Insurance)
            elif t.document_key in ["health_insurance", "oshc"]:
                if profile.health_insurance_status == "done":
                    status, reason = "ready", f"{'OSHC' if country == 'AU' else 'Health Insurance'} confirmed."
                else:
                    status, reason, action_hint = "missing", "Insurance coverage missing.", f"Smart Guidance: {'OSHC is mandatory for all Australian student visas' if country == 'AU' else 'Enroll in public (TK/AOK) or private insurance for Germany'}."

            # 6. Language & TB Test
            elif t.document_key == "language_test":
                if profile.language_test_type != "None" and profile.language_test_score:
                    status, reason = "ready", f"{profile.language_test_type} score verified."
                else:
                    status, reason, action_hint = "missing", "Language proficiency required.", f"Smart Guidance: Take IELTS/TOEFL/PTE. {country} typically requires 6.0-6.5 equivalent."

            elif t.document_key == "tb_test" and country == "UK":
                if profile.tuberculosis_test_status == "done":
                    status, reason = "ready", "TB clearance verified."
                else:
                    status, reason, action_hint = "missing", "TB test required.", "Smart Guidance: Schedule a TB test at an IOM-approved clinic (e.g. in Lahore/Karachi for Pakistanis)."

            # Calculate Weighted Scoring
            if t.is_required:
                max_possible_weight += weight
                if status == "ready":
                    weighted_score_sum += weight

            checklist_items.append({
                "document_key": t.document_key,
                "title": t.title,
                "status": status,
                "reason": reason if status != "ready" else "Requirement successfully fulfilled.",
                "action_hint": action_hint,
                "sort_order": t.display_order
            })

        # Calculate Final Score
        if max_possible_weight == 0:
            # Fallback: if no required items, calculate score based on all available items
            max_possible_weight = sum(3 if t.document_key in CRITICAL_KEYS else 1 for t in templates)
            weighted_score_sum = sum( (3 if item['document_key'] in CRITICAL_KEYS else 1) for item in checklist_items if item['status'] == 'ready')

        final_score = int((weighted_score_sum / max_possible_weight) * 100) if max_possible_weight > 0 else 0


        # Create Checklist Record
        new_checklist = VisaChecklist(
            user_id=profile.user_id,
            visa_profile_id=profile.id,
            country_code=profile.target_country.upper(),
            readiness_score=final_score,
            status_summary=f"Premium readiness analysis complete for {profile.target_country.title()}. Your current score is {final_score}%.",
            version_tag="v2.0"
        )
        db.add(new_checklist)
        db.commit()
        db.refresh(new_checklist)

        for item in checklist_items:
            db.add(VisaChecklistItem(checklist_id=new_checklist.id, **item))
        
        db.commit()
        return new_checklist



