import os
from supabase import create_client, Client
from dotenv import load_dotenv

env_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), ".env")
load_dotenv(env_path)

url: str = os.environ.get("SUPABASE_URL", "")
key: str = os.environ.get("SUPABASE_KEY", "")

supabase: Client | None = None
if url and key:
    try:
        supabase = create_client(url, key)
    except Exception as e:
        print(f"Supabase initialization error: {e}")

def store_processed_paper(questions_data: dict):
    """
    Store the extracted questions in Supabase (temporary vector/document storage).
    Skipping user auth for Phase 2 hackathon requirements.
    """
    if not supabase:
        print("Supabase connection not active, skipping cloud backup.")
        return None
        
    try:
        # Assume a table named 'processed_papers' exists with a jsonb column 'data'
        response = supabase.table('processed_papers').insert({"data": questions_data}).execute()
        print("Success: Cached processing results to Supabase.")
        return response
    except Exception as e:
        print(f"Supabase Insert Error: {e}")
        return None
