import sqlite3

def update_scholarships():
    conn = sqlite3.connect('scholariq.db')
    cursor = conn.cursor()
    
    # Update Gates Cambridge and Clarendon
    cursor.execute("""
        UPDATE scholarships 
        SET amount = 'Full Funding', funding_type = 'Full Funding' 
        WHERE title LIKE '%Gates Cambridge%' OR title LIKE '%Clarendon%'
    """)
    
    # Update other common ones that might be null
    cursor.execute("""
        UPDATE scholarships 
        SET amount = 'GBP 15,000', funding_type = 'Partial' 
        WHERE title LIKE '%Commonwealth%' AND amount IS NULL
    """)
    
    conn.commit()
    print(f"Rows affected: {cursor.rowcount}")
    conn.close()

if __name__ == "__main__":
    update_scholarships()
