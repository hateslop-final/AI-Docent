import torch
import open_clip
from PIL import Image
from io import BytesIO
import numpy as np
from app.core.config import settings

# 지연 로딩: 첫 호출 시에만 모델 로드
_device = None
_model = None
_preprocess = None

def _load_model():
    """모델을 지연 로딩 (첫 호출 시에만 로드)"""
    global _device, _model, _preprocess
    
    if _model is not None:
        return _model, _preprocess, _device
    
    print("[Embedding] 모델 로딩 시작...")
    _device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"[Embedding] 디바이스: {_device}")
    
    try:
        _model, _, _preprocess = open_clip.create_model_and_transforms(
            settings.CLIP_MODEL,        
            pretrained="laion2b_s34b_b79k"
        )
        _model = _model.to(_device).eval()
        print("[Embedding] 모델 로딩 완료")
    except Exception as e:
        print(f"[Embedding] 모델 로딩 실패: {e}")
        raise
    
    return _model, _preprocess, _device

def image_to_embedding(image_bytes: bytes) -> list[float]:
    # 모델 지연 로딩
    model, preprocess, device = _load_model()
    
    image = preprocess(
        Image.open(BytesIO(image_bytes)).convert("RGB")
    ).unsqueeze(0).to(device)

    with torch.no_grad():
        feat = model.encode_image(image)
        feat = feat / feat.norm(dim=-1, keepdim=True)
    print("임베딩 완료")
    return feat.cpu().numpy()[0].tolist()