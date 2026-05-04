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
    """Update a master experiment definition. Filter by id (PK of experiments table)."""
    supabase_url = _require_env("SUPABASE_URL", SUPABASE_URL)
    service_key = _require_env("SUPABASE_SERVICE_ROLE_KEY", SUPABASE_SERVICE_ROLE_KEY)
    headers = {
        "Authorization": f"Bearer {service_key}",
        "apikey": service_key,
        "Content-Type": "application/json",
        "Prefer": "return=representation",
    }
    # Only allow updating known editable fields — never mutate the id
    allowed = {"title", "difficulty", "aim", "objective", "theory", "procedure", "pretest", "posttest"}
    payload = {k: v for k, v in data.items() if k in allowed}
    async with httpx.AsyncClient(timeout=10) as client:
        resp = await client.patch(
            f"{supabase_url}/rest/v1/experiments",
            headers=headers,
            params={"id": f"eq.{exp_id}"},
            json=payload,
        )
    if resp.status_code not in (200, 204):
        detail = resp.text or "Update failed"
        raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail)
    results = resp.json() if resp.text else []
    return results[0] if results else payload


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
