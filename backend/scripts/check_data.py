import sqlite3
conn = sqlite3.connect('scholariq.db')
cursor = conn.cursor()
cursor.execute("SELECT title, application_type, button_label FROM scholarships WHERE title LIKE '%Clarendon%'")
print(cursor.fetchall())
conn.close()
