import pandas as pd
import os

# Define categorization
portal_unis = [
    "University of Oxford", 
    "University of Cambridge", 
    "Imperial College London", 
    "University of Edinburgh", 
    "University of Manchester", 
    "King's College London", 
    "University of Warwick", 
    "University of Southampton"
]

auto_unis = [
    "Queen Mary University of London",
    "University of Glasgow",
    "University of Leicester",
    "Lancaster University",
    "University of Surrey",
    "University of Sussex",
    "University of Birmingham",
    "University of Leeds",
    "Cardiff University", 
    "Aston University",
    "Loughborough University", 
    "University of Exeter",
    "University of Liverpool" # if exists
]

# (The rest will be Direct Form: Bristol, UCL, St Andrews, Sheffield, Nottingham, Newcastle, York, Swansea, Heriot-Watt, Reading, Durham, + any leftovers)

def assign_type(row):
    uni = row['uni_name']
    
    if uni in portal_unis:
        return "portal_application", "View Portal Steps 📋", "Apply for course first - then access scholarship via university portal"
    
    if uni in auto_unis:
        return "auto_considered", "Apply for Course 🎓", "No separate form - automatically considered with admission"
        
    return "direct_form", "Apply Now 🎯", "Direct online scholarship form available"

# Load existing data
csv1 = "data/UK_Masters_Top20_Verified.csv"
csv2 = "data/UK_Masters_Next10_Verified.csv"

df1 = pd.read_csv(csv1)
df2 = pd.read_csv(csv2)
combined = pd.concat([df1, df2], ignore_index=True)

# Apply logic
combined[['application_type', 'button_label', 'user_note']] = combined.apply(
    lambda row: pd.Series(assign_type(row)), axis=1
)

# Fix specific requested examples to match prompt EXACTLY
combined.loc[combined['uni_name'] == 'University of Oxford', 'user_note'] = "Apply for your Oxford course - Clarendon auto-considered in your application"
combined.loc[combined['uni_name'] == 'University of Bristol', 'user_note'] = "Direct online scholarship form available"
combined.loc[combined['uni_name'] == 'Queen Mary University of London', 'user_note'] = "No separate form - rolling allocation with offer"

# Ensure column order or just save
output_path = "data/UK_Masters_31_WithApplicationType.csv"
combined.to_csv(output_path, index=False)
print(f"Generated {output_path} with {len(combined)} rows.")
print(combined['application_type'].value_counts())
