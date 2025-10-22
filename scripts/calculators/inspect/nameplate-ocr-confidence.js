module.exports = {
  "id": "nameplate-ocr-confidence",
  "name": "Nameplate OCR confidence",
  "description": "Score OCR extraction completeness and confidence for nameplates",
  "category": "Evidence and confidence",
  "module": "inspect",
  "icon": "IdcardOutlined",
  "tags": [
    "nameplate",
    "ocr",
    "confidence",
    "extraction",
    "vision"
  ],
  "uiDefinition": [
    { "id": "input-card", "type": "section", "title": "Input Parameters", "description": "Upload nameplate photos and set required fields", "icon": "FormOutlined", "order": 1, "size": 24 },
    { "id": "samples", "type": "group", "title": "Samples", "description": "Images to OCR", "sectionId": "input-card", "order": 1, "size": 24, "collapsible": false },
    { "id": "nameplate_images", "type": "image-upload-with-drawing", "title": "Nameplate Images", "label": "Nameplate Images", "required": true, "size": 24, "sectionId": "input-card", "groupId": "samples", "props": { "accept": "image/*", "multiple": true, "clientOnly": true, "showThumbnails": true, "layout": "grid", "thumbnailSize": 120 } },
    
  ],
  "aiPrompt": "You are an OCR specialist.\n\nGoal: Perform full OCR on the provided nameplate images and extract ALL discernible fields and values without relying on a predefined field list.\n\nInstructions:\n- Consider all uploaded images together; merge duplicate keys and prefer the clearest instance.\n- Normalize field keys to snake_case where possible (e.g., Serial No → serial_no).\n- When characters are uncertain or unreadable, use '?' for the character and add a legibility note.\n- Estimate a per-field confidence (0–1) based on clarity, focus, contrast, skew, glare, and occlusions.\n- If a field is partially visible or cropped, mark legibility accordingly (e.g., partial, low-contrast, glare, motion-blur, shadow, overexposed).\n- Do not invent values. Only report what is observed.\n\nOutput a professional Markdown report with ONLY these sections:\n\n# Nameplate OCR Extraction\n## Inputs\n## OCR Results Table\nProvide a table with columns: Field | Value | Confidence | Legibility | Notes\n## OCR JSON\nProvide a JSON object with keys and values plus confidence and legibility metadata.\n## Observations and Quality Notes\nSummarize issues impacting OCR (e.g., skew, blur, glare) and retake guidance.\n## References and Standards"
};