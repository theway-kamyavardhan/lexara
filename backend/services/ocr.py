import base64
import io
import tempfile
import pdf2image
from PIL import Image

def extract_base64_from_file(file_bytes: bytes, filename: str) -> list[str]:
    """
    Converts an uploaded file (PDF or Image) into a list of Base64 Data URLs.
    These are passed directly to OpenAI Vision to bypass Tesseract completely.
    """
    base64_images = []
    try:
        if filename.lower().endswith('.pdf') or file_bytes.startswith(b'%PDF'):
            # Convert PDF pages to images at lower DPI to prevent payload bloat
            images = pdf2image.convert_from_bytes(file_bytes, dpi=150)
            for image in images:
                buffered = io.BytesIO()
                image.save(buffered, format="JPEG", quality=65)
                img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
                base64_images.append(f"data:image/jpeg;base64,{img_str}")
        else:
            # Assume it is a standard image (jpg, png)
            image = Image.open(io.BytesIO(file_bytes))
            # Convert to RGB if it has an Alpha channel to save as JPEG safely
            if image.mode in ("RGBA", "P"):
                image = image.convert("RGB")
            buffered = io.BytesIO()
            image.save(buffered, format="JPEG", quality=65)
            img_str = base64.b64encode(buffered.getvalue()).decode("utf-8")
            base64_images.append(f"data:image/jpeg;base64,{img_str}")
            
        return base64_images
    except Exception as e:
        print(f"Base64 Conversion Error: {e}")
        return []
