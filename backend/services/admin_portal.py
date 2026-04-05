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


def ensure_admin_email(email: str | None) -> None:
    if not email or email.lower() not in ADMIN_EMAILS:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin privileges required")
