# ingest.py
import fitz  # PyMuPDF
import uuid, os

def parse_pdf(pdf_path: str, pdf_id: str, storage_dir: str):
    doc = fitz.open(pdf_path)
    chunks = []

    for page_num, page in enumerate(doc):
        # 1. Extract text blocks with their bounding boxes
        blocks = page.get_text("dict")["blocks"]
        
        # 2. Extract images with their bounding boxes
        images_on_page = []
        for img_index, img in enumerate(page.get_images(full=True)):
            xref = img[0]
            bbox = page.get_image_bbox(img)           # image position on page
            pix = fitz.Pixmap(doc, xref)
            img_filename = f"{pdf_id}_p{page_num}_img{img_index}.png"
            img_path = os.path.join(storage_dir, img_filename)
            pix.save(img_path)
            images_on_page.append({
                "path": img_path,
                "bbox": list(bbox),                   # [x0, y0, x1, y1]
                "page": page_num
            })

        # 3. For each text block, find nearby images by bounding box proximity
        text_blocks = [b for b in blocks if b["type"] == 0]
        for block in text_blocks:
            text = " ".join([
                span["text"]
                for line in block["lines"]
                for span in line["spans"]
            ]).strip()
            if not text:
                continue
            
            block_bbox = block["bbox"]  # [x0, y0, x1, y1]
            
            # Find images whose bbox is "close" to this text block
            associated_images = find_nearby_images(block_bbox, images_on_page)
            
            chunks.append({
                "chunk_id": str(uuid.uuid4()),
                "pdf_id": pdf_id,
                "page": page_num,
                "text": text,
                "image_paths": [img["path"] for img in associated_images],
                "bbox": block_bbox
            })
    
    return chunks


def find_nearby_images(text_bbox, images, threshold=150):
    """
    Associate an image with a text block if their bounding boxes
    are within `threshold` pixels vertically on the same page.
    Strategy: image immediately above or below the text block = related.
    """
    tx0, ty0, tx1, ty1 = text_bbox
    nearby = []
    for img in images:
        ix0, iy0, ix1, iy1 = img["bbox"]
        vertical_gap = min(abs(ty0 - iy1), abs(iy0 - ty1))
        if vertical_gap < threshold:
            nearby.append(img)
    return nearby
