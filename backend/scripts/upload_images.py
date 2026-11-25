"""Copy the approved product photos into Supabase Storage and save their URLs + credits.

Photos and credits are listed in scripts/images.json (openly licensed images only).

    python scripts/upload_images.py            # show the list (nothing is changed)
    python scripts/upload_images.py --upload   # download, upload to Storage, update products
"""

import json
import sys
import time
from pathlib import Path

import httpx

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.db import get_db  # noqa: E402

BUCKET = "product-images"
IMAGES = json.loads((Path(__file__).parent / "images.json").read_text(encoding="utf-8"))


def show_list() -> None:
    for pid, img in IMAGES.items():
        print(f"- {pid}\n    {img['credit']}\n    source: {img['page_url']}")


def upload() -> None:
    db = get_db()
    storage = db.storage.from_(BUCKET)
    with httpx.Client(follow_redirects=True, timeout=60,
                      headers={"User-Agent": "nexus-commerce-image-upload/1.0"}) as http:
        for pid, img in IMAGES.items():
            res = http.get(img["download_url"])
            res.raise_for_status()
            content_type = res.headers.get("content-type", "image/jpeg").split(";")[0]
            ext = {"image/png": "png", "image/webp": "webp"}.get(content_type, "jpg")
            path = f"{pid}.{ext}"
            for attempt in range(3):  # Storage sometimes drops the connection; retry
                try:
                    storage.upload(path, res.content, {"content-type": content_type, "upsert": "true"})
                    break
                except httpx.HTTPError:
                    if attempt == 2:
                        raise
                    time.sleep(2)
            public_url = storage.get_public_url(path).rstrip("?")
            db.table("products").update({"image_url": public_url, "image_credit": img["credit"]}).eq("id", pid).execute()
            print(f"uploaded {path} ({len(res.content) // 1024} KB)")
    print("Done.")


if __name__ == "__main__":
    upload() if "--upload" in sys.argv else show_list()
