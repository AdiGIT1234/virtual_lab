import os
import json
import asyncio
import httpx
from services.admin_portal import _require_env, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  # type: ignore

async def migrate():
    url = _require_env("SUPABASE_URL", SUPABASE_URL)
    key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    
    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates"
    }
    
    data_dir = "backend/data/experiments"
    files = [f for f in os.listdir(data_dir) if f.endswith(".json")]
    
    async with httpx.AsyncClient(timeout=30) as client:
        for f in files:
            path = os.path.join(data_dir, f)
            with open(path, "r", encoding="utf-8") as file:
                data = json.load(file)
                # Ensure it has an id
                if not data.get("id"):
                    continue
                
                print(f"Migrating {data['id']}...")
                resp = await client.post(
                    f"{url}/rest/v1/experiments",
                    headers=headers,
                    json=data
                )
                if resp.status_code not in (200, 201):
                    print(f"Failed to migrate {data['id']}: {resp.text}")
                else:
                    print(f"Migrated {data['id']}")

if __name__ == "__main__":
    asyncio.run(migrate())
