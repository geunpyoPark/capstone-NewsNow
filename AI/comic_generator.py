import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image, ImageDraw, ImageFont
import textwrap
import sys

class ComicGenerator:
    def __init__(self, font_path="my_font.ttf"):
        print("🚀 NewsNow 카드뉴스 엔진 가동 (M4 Pro 최적화)...")
        self.pipe = AutoPipelineForText2Image.from_pretrained(
            "stabilityai/sdxl-turbo", 
            torch_dtype=torch.float16, 
            variant="fp16"
        ).to("mps")
        
        try:
            # 하단 텍스트는 가독성이 중요하므로 폰트 크기를 조금 키웠습니다.
            self.font = ImageFont.truetype(font_path, 28)
            print(f"✅ 폰트 로드 성공: '{font_path}'")
        except:
            print("❌ 폰트 로드 실패! 경로를 확인하세요.")
            sys.exit()

        self.FIXED_STYLE = (
            "Professional news illustration, high-quality caricature, "
            "expressive faces, clean background, high resolution, no text"
        )

    def add_bottom_caption(self, img, text):
        """이미지 하단에 반투명 검은색 띠와 텍스트를 추가합니다."""
        w, h = img.size
        # 텍스트 영역 높이 설정 (이미지 높이의 약 20%)
        caption_height = 100
        
        # 새로운 캔버스 생성 (이미지 + 하단 텍스트 바)
        new_img = Image.new('RGB', (w, h + caption_height), color=(255, 255, 255))
        new_img.paste(img, (0, 0))
        
        draw = ImageDraw.Draw(new_img)
        
        # 1. 하단 텍스트 바 배경 (세련된 진회색/검정)
        draw.rectangle([0, h, w, h + caption_height], fill=(30, 30, 30))
        
        # 2. 텍스트 줄바꿈 및 중앙 정렬
        lines = textwrap.wrap(text, width=20)
        line_height = self.font.getbbox("가")[3] + 10
        total_text_h = line_height * len(lines)
        
        current_y = h + (caption_height - total_text_h) / 2
        for line in lines:
            text_w = self.font.getlength(line)
            draw.text(((w - text_w) / 2, current_y), line, font=self.font, fill="white")
            current_y += line_height
            
        return new_img

    def generate_news_card(self, news_data):
        """4장의 이미지를 생성하고 하단 캡션을 붙여 2x2 격자로 합칩니다."""
        final_panels = []
        
        for i, data in enumerate(news_data):
            print(f"🎨 {i+1}번째 카드 생성 중...")
            prompt = f"{self.FIXED_STYLE}, {data['scenario']}"
            base_img = self.pipe(prompt=prompt, num_inference_steps=2, guidance_scale=0.0).images[0]
            
            # 하단 캡션 추가
            card_panel = self.add_bottom_caption(base_img, data['text'])
            final_panels.append(card_panel)

        # 2x2 격자 합치기 (이제 하단 텍스트 영역 때문에 크기가 커짐)
        pw, ph = final_panels[0].size
        grid = Image.new('RGB', (pw*2, ph*2), color='white')
        grid.paste(final_panels[0], (0, 0))
        grid.paste(final_panels[1], (pw, 0))
        grid.paste(final_panels[2], (0, ph))
        grid.paste(final_panels[3], (pw, ph))
        
        return grid

# ==========================================
# 실행 테스트 (이제 좌표 설정 필요 없음!)
# ==========================================
if __name__ == "__main__":
    news_steps = [
        {"text": "미국 정부가 강력한 대응을 예고했어요", "scenario": "Leader at a podium, political news style"},
        {"text": "바닷길이 막히면 물가가 오를 수 있어요", "scenario": "Cargo ship in a narrow strait, map view"},
        {"text": "협상이 안 되면 긴장이 더 높아질 거예요", "scenario": "Two sides debating at a table, serious mood"},
        {"text": "상황이 어떻게 변할지 지켜봐야 해요", "scenario": "People watching news on a big screen"}
    ]
    
    generator = ComicGenerator("my_font.ttf") 
    result = generator.generate_news_card(news_steps)
    result.save("NewsNow_CardNews_Style.png")
    
    print("\n✨ [완성] 'NewsNow_CardNews_Style.png'가 생성되었습니다!")