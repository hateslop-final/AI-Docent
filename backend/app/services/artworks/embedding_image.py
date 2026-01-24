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
        import gc
        import torch
        
        # 메모리 정리
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        print(f"[Embedding] 모델: {settings.CLIP_MODEL} 로딩 시작...")
        _model, _, _preprocess = open_clip.create_model_and_transforms(
            settings.CLIP_MODEL,        
            pretrained="laion2b_s34b_b79k"
        )
        
        # CPU 환경에서는 float32 유지 (float16은 CPU에서 제대로 작동하지 않을 수 있음)
        # Render는 CPU만 사용하므로 float32 유지
        _model = _model.to(_device).eval()
        
        # 추가 메모리 정리
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
        
        _model_loaded = True
        print("[Embedding] 모델 로딩 완료")
    except RuntimeError as e:
        error_msg = str(e)
        _model_load_error = error_msg
        print(f"[Embedding] 모델 로딩 실패 (RuntimeError): {error_msg}")
        # 메모리 부족 에러인지 확인
        if "out of memory" in error_msg.lower() or "cuda" in error_msg.lower():
            raise RuntimeError(f"메모리 부족: 모델을 로드할 수 없습니다. {error_msg}")
        raise RuntimeError(f"모델 로드 실패: {error_msg}")
    except Exception as e:
        error_msg = str(e)
        _model_load_error = error_msg
        print(f"[Embedding] 모델 로딩 실패: {error_msg}")
        raise RuntimeError(f"모델 로드 실패: {error_msg}")
    
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
    
    # CPU로 이동 후 numpy 변환
    feat = feat.cpu()
    print("임베딩 완료")
    return feat.numpy()[0].tolist()