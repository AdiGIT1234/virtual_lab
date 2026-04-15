import os
import json
import asyncio
import httpx
from dotenv import load_dotenv
load_dotenv()

def _require_env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise RuntimeError(f"Missing {name}")
    return val

async def migrate():
    try:
        url = _require_env("SUPABASE_URL")
        key = _require_env("SUPABASE_SERVICE_ROLE_KEY")
    except Exception as e:
        print(f"ERROR: {e}")
        return
    
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    data_dir = "data/experiments"
    if not os.path.exists(data_dir):
        print(f"Directory not found: {data_dir}")
        return
        
    files = [f for f in os.listdir(data_dir) if f.endswith(".json")]
    print(f"Found {len(files)} files to migrate.")
    
    async with httpx.AsyncClient(timeout=30) as client:
        for f in files:
            path = os.path.join(data_dir, f)
            try:
                with open(path, "r", encoding="utf-8") as file:
                    data = json.load(file)
                    if not data.get("id"):
                        continue
                    
                    print(f"Migrating {data['id']}...", end=" ", flush=True)
                    resp = await client.post(
                        f"{url}/rest/v1/experiments",
                        headers=headers,
                        json=data
                    )
                    if resp.status_code not in (200, 201):
                        print(f"FAILED: {resp.status_code} - {resp.text}")
                    else:
                        print("SUCCESS")
            except Exception as e:
                print(f"Error processing {f}: {e}")

if __name__ == "__main__":
    asyncio.run(migrate())
