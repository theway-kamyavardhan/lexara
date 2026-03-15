import os
from fpdf import FPDF
import uuid

FONTS_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "fonts")
TEMP_SAVES_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "temp_pdfs")

os.makedirs(TEMP_SAVES_DIR, exist_ok=True)

class DyslexicPDF(FPDF):
    def __init__(self):
        super().__init__()
        self.set_auto_page_break(auto=True, margin=20)
        self.add_page()
        
        # Load Dyslexic Fonts (OTF/TTF supported by fpdf2 via fonttools)
        # Using built-in helvetica if font doesn't load
        try:
            self.add_font("OpenDyslexic", "", os.path.join(FONTS_DIR, "OpenDyslexic-Regular.otf"))
            self.add_font("OpenDyslexic", "B", os.path.join(FONTS_DIR, "OpenDyslexic-Bold.otf"))
        except Exception as e:
            print(f"Warning: Could not load OpenDyslexic fonts: {e}")
            pass

    def header(self):
        try:
            self.set_font("OpenDyslexic", "B", 18)
        except:
            self.set_font("helvetica", "B", 18)
        self.set_text_color(0, 113, 227) # Lexara Accent Blue
        self.cell(0, 10, "Lexara Air - Document Processing", ln=True, align="C")
        self.ln(5)

    def footer(self):
        self.set_y(-15)
        try:
            self.set_font("OpenDyslexic", "", 10)
        except:
            self.set_font("helvetica", "I", 8)
        self.set_text_color(128, 128, 128)
        self.cell(0, 10, f"Page {self.page_no()}", align="C")

def generate_dyslexic_pdf(data: dict, language: str = "en") -> str:
    """
    Generates a PDF using FPDF2 from the provided CognitiveData list
    and returns the file path to the temporary PDF.
    """
    pdf = DyslexicPDF()
    pdf.set_text_color(33, 33, 33)

    questions = data.get("questions", [])
    
    for idx, q in enumerate(questions):
        if language == "en":
            original_text = q.get("original", {}).get("english", "")
            simplified = q.get("simplified", {})
            simplified_text = simplified.get("english", "")
            steps = simplified.get("steps", [])
            if steps:
                simplified_text += "\n\n" + "\n".join(steps)
        else:
            original_text = "Dyslexic Cognitive Translation"
            simplified_text = q.get("translations", {}).get(language, "")
        
        # Section Header (Question #)
        try:
            pdf.set_font("OpenDyslexic", "B", 16)
        except:
            pdf.set_font("helvetica", "B", 16)
        pdf.set_text_color(0, 113, 227)
        pdf.cell(0, 12, f"Question {idx + 1}", ln=True)
        pdf.ln(2)

        # Draw a little accent line
        pdf.set_draw_color(0, 113, 227)
        pdf.set_line_width(0.5)
        pdf.line(pdf.get_x(), pdf.get_y(), pdf.get_x() + 50, pdf.get_y())
        pdf.ln(5)

        # 1. Original Context
        pdf.set_text_color(100, 100, 100)
        try:
            pdf.set_font("OpenDyslexic", "B", 12)
        except:
            pdf.set_font("helvetica", "B", 12)
        pdf.cell(0, 8, "Original Context (Reference):", ln=True)
        
        pdf.set_text_color(50, 50, 50)
        try:
            pdf.set_font("OpenDyslexic", "", 11)
        except:
            pdf.set_font("helvetica", "", 11)
            
        original_encoded = original_text.encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 8, original_encoded) # 8 is good line height for readability
        pdf.ln(6)

        # 2. Simplified Breakdown
        pdf.set_text_color(0, 0, 0)
        try:
            pdf.set_font("OpenDyslexic", "B", 14)
        except:
            pdf.set_font("helvetica", "B", 14)
        
        simplified_encoded = simplified_text.encode('latin-1', 'replace').decode('latin-1')
        pdf.multi_cell(0, 10, simplified_encoded)
        pdf.ln(15) # Spacing before next question

    # Save to file
    filename = f"dyslexic_export_{uuid.uuid4().hex[:8]}.pdf"
    filepath = os.path.join(TEMP_SAVES_DIR, filename)
    pdf.output(filepath)
    return filepath
