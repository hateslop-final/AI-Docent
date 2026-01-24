import torch
import open_clip
from PIL import Image
from io import BytesIO
import numpy as np
from app.core.config import settings

# 모델 전역 변수
_device = None
_model = None
_preprocess = None
_model_loaded = False
_model_load_error = None

def load_model():
    """모델을 로드 (서버 시작 시 호출)"""
    global _device, _model, _preprocess, _model_loaded, _model_load_error
    
    if _model is not None:
        return _model, _preprocess, _device
    
    if _model_load_error is not None:
        raise RuntimeError(f"모델 로드 실패: {_model_load_error}")
    
    print("[Embedding] 모델 로딩 시작...")
    _device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Embedding] 디바이스: {_device}")
    
    try:
        _model, _, _preprocess = open_clip.create_model_and_transforms(
            settings.CLIP_MODEL,        
            pretrained="laion2b_s34b_b79k"
        )
        _model = _model.to(_device).eval()
        _model_loaded = True
        print("[Embedding] 모델 로딩 완료")
    except Exception as e:
        _model_load_error = str(e)
        print(f"[Embedding] 모델 로딩 실패: {e}")
        raise
    
    return _model, _preprocess, _device

def get_model():
    """모델 가져오기 (이미 로드된 경우)"""
    global _model, _preprocess, _device, _model_loaded, _model_load_error
    
    if _model is not None:
        return _model, _preprocess, _device
    
    if _model_load_error is not None:
        raise RuntimeError(f"모델이 로드되지 않았습니다: {_model_load_error}")
    
    # 지연 로딩 (fallback)
    print("[Embedding] 지연 로딩 시도...")
    return load_model()

def is_model_loaded() -> bool:
    """모델이 로드되었는지 확인"""
    return _model_loaded and _model is not None

def get_model_status() -> dict:
    """모델 상태 정보 반환"""
    return {
        "loaded": _model_loaded,
        "device": _device if _device else "unknown",
        "error": _model_load_error,
        "model_name": settings.CLIP_MODEL if settings else "unknown"
    }

def image_to_embedding(image_bytes: bytes) -> list[float]:
    # 모델 가져오기 (서버 시작 시 로드됨)
    model, preprocess, device = get_model()
    
    image = preprocess(
        Image.open(BytesIO(image_bytes)).convert("RGB")
    ).unsqueeze(0).to(device)

    with torch.no_grad():
        feat = model.encode_image(image)
        feat = feat / feat.norm(dim=-1, keepdim=True)
    print("임베딩 완료")
    return feat.cpu().numpy()[0].tolist()