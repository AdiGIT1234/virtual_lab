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
        "select": "id,name,institute,created_at,updated_at,user:auth.users(email,last_sign_in_at)",
        "order": "created_at.desc",
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
    from datetime import datetime, timedelta, timezone
    now = datetime.now(timezone.utc)
    active_cutoff = (now - timedelta(hours=72)).isoformat()
    week_cutoff = (now - timedelta(days=7)).isoformat()

    async with httpx.AsyncClient(timeout=10) as client:
        total_resp = await client.get(
            f"{supabase_url}/rest/v1/profiles",
            headers={**headers, "Range": "0-0"},
            params={"select": "id"},
        )
        new_resp = await client.get(
            f"{supabase_url}/rest/v1/profiles",
            headers={**headers, "Range": "0-0"},
            params={"select": "id", "created_at": f"gte.{week_cutoff}"},
        )

    total = int(total_resp.headers.get("content-range", "0/0").split("/")[-1]) if total_resp.status_code in (200, 206) else 0
    new_this_week = int(new_resp.headers.get("content-range", "0/0").split("/")[-1]) if new_resp.status_code in (200, 206) else 0

    return {"total": total, "new_this_week": new_this_week}


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
