"""
Migrate all local experiment JSON files → Supabase experiments table.

Run AFTER applying migrations/001_quiz_and_progress.sql:
    cd backend && python migrate_experiments.py

Uses UPSERT (merge-duplicates) so it's safe to re-run at any time.
"""

import asyncio
import json
import os
import glob

import httpx
from dotenv import load_dotenv  # type: ignore

load_dotenv()


def _require_env(name: str) -> str:
    val = os.getenv(name)
    if not val:
        raise RuntimeError(f"Missing env var: {name}")
    return val


async def migrate():
    url = _require_env("SUPABASE_URL")
    key = _require_env("SUPABASE_SERVICE_ROLE_KEY")

    headers = {
        "Authorization": f"Bearer {key}",
        "apikey": key,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation",
    }

    data_dir = os.path.join(os.path.dirname(__file__), "data", "experiments")
    if not os.path.exists(data_dir):
        print(f"ERROR: {data_dir} not found")
        return

    files = sorted(glob.glob(os.path.join(data_dir, "*.json")))
    print(f"Found {len(files)} experiment files\n")

    ok, failed = 0, 0

    async with httpx.AsyncClient(timeout=30) as client:
        for path in files:
            with open(path, encoding="utf-8") as f:
                raw = json.load(f)

            exp_id = raw.get("id")
            if not exp_id:
                print(f"  SKIP  {os.path.basename(path)} — no 'id' field")
                continue

            row = {
                "id":         exp_id,
                "title":      raw.get("title", ""),
                "difficulty": raw.get("difficulty", "Beginner"),
                "aim":        raw.get("aim"),
                "objective":  raw.get("objective"),
                "theory":     raw.get("theory"),
                "procedure":  raw.get("procedure", []),
                "pretest":    raw.get("pretest", []),
                "posttest":   raw.get("posttest", []),
                "feedback":   raw.get("feedback"),
            }

            resp = await client.post(
                f"{url}/rest/v1/experiments",
                headers=headers,
                json=row,
            )

            if resp.status_code in (200, 201):
                print(f"  OK    {exp_id}")
                ok += 1
            else:
                print(f"  FAIL  {exp_id}  →  {resp.status_code}: {resp.text[:120]}")
                failed += 1

    print(f"\n{'─' * 40}")
    print(f"  Migrated: {ok}   Failed: {failed}")
    if ok > 0:
        print("\nNext: redeploy backend so /api/experiments reads from Supabase.")


if __name__ == "__main__":
    asyncio.run(migrate())
