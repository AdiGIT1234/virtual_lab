import asyncio
import os
from typing import Any, Dict, List

import httpx
from fastapi import HTTPException, status

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_SERVICE_ROLE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")

admin_email_env = os.getenv("ADMIN_EMAILS") or os.getenv("ADMIN_EMAIL", "aditya26047@gmail.com")
ADMIN_EMAILS = [email.strip().lower() for email in admin_email_env.split(",") if email.strip()]


def _require_env(name: str, value: str | None) -> str:
    if not value:
        raise RuntimeError(f"Missing required environment variable: {name}")
    return value


async def fetch_user_from_token(access_token: str) -> Dict[str, Any]:
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    anon_key = _require_env("SUPABASE_ANON_KEY", SUPABASE_ANON_KEY)
    headers = {
        "Authorization": f"Bearer {access_token}",
        "apikey": anon_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{supabase_url}/auth/v1/user", headers=headers)
    if resp.status_code != status.HTTP_200_OK:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session token")
    return resp.json()


async def fetch_all_profiles() -> List[Dict[str, Any]]:
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }
    params = {
        "select": "id,name,institute,created_at,updated_at,user:auth.users(email,last_sign_in_at,created_at)",
        "order": "updated_at.desc",
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(f"{supabase_url}/rest/v1/profiles", headers=headers, params=params)
    if resp.status_code != status.HTTP_200_OK:
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail="Failed to query Supabase profiles")
    return resp.json()


async def fetch_admin_stats() -> Dict[str, Any]:
    """Return aggregate counts: total users, active (72h), new this week."""
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Prefer": "count=exact",
    }
    from datetime import datetime, timedelta, timezone  # local import fine here
    now = datetime.now(timezone.utc)
    active_cutoff = (now - timedelta(hours=72)).isoformat()
    week_cutoff = (now - timedelta(days=7)).isoformat()

    async with httpx.AsyncClient(timeout=10) as client:
        total_resp, new_resp, active_resp = await asyncio.gather(
            client.get(
                f"{supabase_url}/rest/v1/profiles",
                headers={**headers, "Range": "0-0"},
                params={"select": "id"},
            ),
            client.get(
                f"{supabase_url}/rest/v1/profiles",
                headers={**headers, "Range": "0-0"},
                params={"select": "id", "created_at": f"gte.{week_cutoff}"},
            ),
            client.get(
                f"{supabase_url}/rest/v1/profiles",
                headers={**headers, "Range": "0-0"},
                params={"select": "id", "updated_at": f"gte.{active_cutoff}"},
            ),
        )

    def _count(r):
        if r.status_code in (200, 206):
            cr = r.headers.get("content-range", "0/0")
            return int(cr.split("/")[-1]) if cr else 0
        return 0

    return {
        "total": _count(total_resp),
        "new_this_week": _count(new_resp),
        "active_72h": _count(active_resp),
    }


async def delete_user_by_id(user_id: str) -> None:
    """Hard-delete a user from Supabase Auth (cascades to profiles via FK)."""
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.delete(
            f"{supabase_url}/auth/v1/admin/users/{user_id}",
            headers=headers,
        )
    if resp.status_code not in (200, 204):
        detail = resp.text or "Failed to delete user"
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)


def ensure_admin_email(email: str | None) -> None:
    if not email or email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")

async def fetch_all_experiments() -> List[Dict[str, Any]]:
    """Fetch master experiment definitions from the experiments table."""
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{supabase_url}/rest/v1/experiments",
            headers=headers,
            params={"select": "id,title,difficulty,aim,objective,theory,procedure,pretest,posttest", "order": "id.asc"},
        )
    if resp.status_code != status.HTTP_200_OK:
        return []
    return resp.json()


async def update_experiment_in_db(exp_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Update a master experiment definition in Supabase AND the local JSON file.
    Filter on id (PK). Never mutates id or unknown columns.
    """
    import glob as _glob
    import json as _json

    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)

    allowed = {"title", "difficulty", "aim", "objective", "theory",
               "procedure", "pretest", "posttest", "feedback"}
    payload = {k: v for k, v in data.items() if k in allowed}

    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }

    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.patch(
            f"{supabase_url}/rest/v1/experiments",
            headers=headers,
            params={"id": f"eq.{exp_id}"},
            json=payload,
        )

    if resp.status_code not in (200, 204):
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail=resp.text or "Supabase update failed",
        )

    result = (resp.json()[0] if resp.text and resp.json() else payload)

    # Keep local JSON files in sync so the filesystem fallback stays current
    data_dir = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data", "experiments")
    for path in _glob.glob(os.path.join(data_dir, "*.json")):
        try:
            with open(path, encoding="utf-8") as f:
                existing = _json.load(f)
            if existing.get("id") == exp_id:
                existing.update(payload)
                with open(path, "w", encoding="utf-8") as f:
                    _json.dump(existing, f, ensure_ascii=False, indent=2)
                break
        except Exception:
            pass  # non-fatal — Supabase is the source of truth

    return result


async def fetch_quiz_analytics() -> List[Dict[str, Any]]:
    """Per-experiment quiz stats: attempt counts and average scores."""
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {"Authorization": f"Bearer {service_key}", "apikey": service_key}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{supabase_url}/rest/v1/quiz_attempts",
            headers=headers,
            params={"select": "experiment_id,quiz_type,score,total,passed", "limit": "5000"},
        )
    if resp.status_code != 200:
        return []
    rows = resp.json()
    # Aggregate client-side: group by experiment_id + quiz_type
    from collections import defaultdict
    agg: Dict[str, Dict] = defaultdict(lambda: {"attempts": 0, "total_score": 0, "total_q": 0, "passed": 0})
    for r in rows:
        key = f"{r['experiment_id']}::{r['quiz_type']}"
        agg[key]["experiment_id"] = r["experiment_id"]
        agg[key]["quiz_type"]     = r["quiz_type"]
        agg[key]["attempts"]     += 1
        agg[key]["total_score"]  += r.get("score", 0)
        agg[key]["total_q"]      += r.get("total", 0)
        if r.get("passed"): agg[key]["passed"] += 1
    result = []
    for item in agg.values():
        attempts = item["attempts"]
        result.append({
            "experiment_id": item["experiment_id"],
            "quiz_type":     item["quiz_type"],
            "attempts":      attempts,
            "avg_score":     round(item["total_score"] / attempts, 1) if attempts else 0,
            "avg_total":     round(item["total_q"]     / attempts, 1) if attempts else 0,
            "pass_rate":     round(item["passed"] / attempts * 100, 1) if attempts else 0,
        })
    result.sort(key=lambda x: (x["experiment_id"], x["quiz_type"]))
    return result


async def fetch_user_detail(user_id: str) -> List[Dict[str, Any]]:
    """Return saved_experiments rows for a single user, ordered by recency.

    Returns an empty list silently if the table or columns don't exist
    (e.g. before a migration has been applied).
    """
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(
                f"{supabase_url}/rest/v1/saved_experiments",
                headers=headers,
                params={
                    "select": "experiment_id,title,completed,pretest_score,posttest_score,time_spent_ms,updated_at",
                    "user_id": f"eq.{user_id}",
                    "order": "updated_at.desc",
                },
            )
    except Exception:
        return []
    if resp.status_code != status.HTTP_200_OK:
        return []
    try:
        data = resp.json()
        return data if isinstance(data, list) else []
    except Exception:
        return []


async def fetch_user_activity() -> List[Dict[str, Any]]:
    """Return all rows from saved_experiments with user email from profiles join."""
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
    }
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.get(
            f"{supabase_url}/rest/v1/saved_experiments",
            headers=headers,
            params={
                "select": "user_id,experiment_id,title,updated_at,profile:profiles(name,institute)",
                "order": "updated_at.desc",
                "limit": "500",
            },
        )
    if resp.status_code != status.HTTP_200_OK:
        return []
    return resp.json()
