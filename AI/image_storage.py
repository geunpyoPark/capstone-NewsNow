"""생성된 이미지를 Cloudinary에 업로드하고 공개 URL을 반환하는 모듈."""

import hashlib
import os
import time
from io import BytesIO

import requests


def is_cloudinary_configured():
    """Cloudinary 업로드에 필요한 환경변수가 모두 있는지 확인한다."""
    return all(
        [
            os.getenv("CLOUDINARY_CLOUD_NAME"),
            os.getenv("CLOUDINARY_API_KEY"),
            os.getenv("CLOUDINARY_API_SECRET"),
        ]
    )


def _build_cloudinary_signature(params, api_secret):
    """Cloudinary 업로드 API가 요구하는 SHA1 서명을 만든다."""
    sign_items = []
    for key in sorted(params):
        value = params[key]
        if value is None or value == "":
            continue
        sign_items.append(f"{key}={value}")
    sign_payload = "&".join(sign_items) + api_secret
    return hashlib.sha1(sign_payload.encode("utf-8")).hexdigest()


def upload_image_to_cloudinary(image, folder=None, public_id=None):
    """
    PIL 이미지를 Cloudinary에 업로드하고 secure_url을 반환한다.
    SDK 없이 HTTP API로 업로드한다.
    """
    cloud_name = os.getenv("CLOUDINARY_CLOUD_NAME")
    api_key = os.getenv("CLOUDINARY_API_KEY")
    api_secret = os.getenv("CLOUDINARY_API_SECRET")
    upload_folder = folder or os.getenv("CLOUDINARY_FOLDER", "newsnow/comics")

    if not all([cloud_name, api_key, api_secret]):
        raise ValueError("Cloudinary 환경변수가 설정되지 않았습니다.")

    timestamp = int(time.time())
    params = {
        "timestamp": timestamp,
        "folder": upload_folder,
    }
    if public_id:
        params["public_id"] = public_id

    signature = _build_cloudinary_signature(params, api_secret)
    upload_url = f"https://api.cloudinary.com/v1_1/{cloud_name}/image/upload"

    image_buffer = BytesIO()
    image.save(image_buffer, format="PNG")
    image_buffer.seek(0)

    response = requests.post(
        upload_url,
        data={
            **params,
            "api_key": api_key,
            "signature": signature,
        },
        files={
            "file": ("newsnow-comic.png", image_buffer, "image/png"),
        },
        timeout=30,
    )
    response.raise_for_status()
    payload = response.json()
    secure_url = payload.get("secure_url")
    if not secure_url:
        raise ValueError("Cloudinary 업로드 응답에 secure_url이 없습니다.")
    return secure_url
