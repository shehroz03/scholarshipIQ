import os
import sys
from pymongo import MongoClient
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Safety Check - User must set this to "DELETE" in the script or via env
CONFIRM = "DELETE" 

def main():
    print("=== ScholarIQ MongoDB Cleanup Script ===")
    
    if CONFIRM != "DELETE":
        print("ERROR: Safety check failed. Please set CONFIRM = 'DELETE' in the script to run.")
        sys.exit(1)

    mongodb_uri = os.getenv("MONGODB_URI")
    if not mongodb_uri:
        print("ERROR: MONGODB_URI environment variable not found.")
        sys.exit(1)

    try:
        client = MongoClient(mongodb_uri)
        # Assuming database name is 'scholariq' or derived from URI
        db = client.get_database()
        
        print(f"Connected to database: {db.name}")
        
        collections = ["scholarships", "universities"]
        
        for coll_name in collections:
            collection = db[coll_name]
            
            # Define cleanup criteria
            # ONLY deletes old scraped data, not structure or indexes.
            # Assume old data is marked with either:
            # - source_type: "scraped"
            # - verified: false
            # - missing source or official_link fields
            
            query = {
                "$or": [
                    {"source_type": "scraped"},
                    {"verified": False},
                    {"source": {"$exists": False}},
                    {"official_link": {"$exists": False}},
                    {"official_link": None},
                    {"official_link": ""}
                ]
            }
            
            print(f"Cleaning up collection: {coll_name}...")
            
            # Get count before deletion
            initial_count = collection.count_documents({})
            
            # Execute deletion
            result = collection.delete_many(query)
            
            deleted_count = result.deleted_count
            final_count = collection.count_documents({})
            
            print(f"  - Initial documents: {initial_count}")
            print(f"  - Deleted documents: {deleted_count}")
            print(f"  - Remaining documents: {final_count}")
            print(f"Successfully cleaned '{coll_name}'.")
            print("-" * 30)

        print("Cleanup process completed successfully.")
        
    except Exception as e:
        print(f"An error occurred during cleanup: {e}")
        sys.exit(1)
    finally:
        if 'client' in locals():
            client.close()

if __name__ == "__main__":
    main()
