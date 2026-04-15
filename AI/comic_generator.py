import sys
import textwrap
import os
from io import BytesIO

import torch
from diffusers import AutoPipelineForText2Image
from PIL import Image, ImageDraw, ImageFilter, ImageFont
from dotenv import load_dotenv
from google import genai


class ComicGenerator:
    def __init__(self, font_path="my_font.ttf"):
        print("🚀 NewsNow 스토리형 만화 엔진 가동...")
        load_dotenv()
        self.provider = os.getenv("COMIC_IMAGE_PROVIDER", "gemini").lower()
        self.model_id = os.getenv("COMIC_MODEL_ID", "gemini-2.5-flash-image")
        self.pipe = None
        self.gemini_client = None

        if self.provider == "gemini":
            api_key = os.getenv("GEMINI_API_KEY")
            if not api_key:
                raise ValueError("GEMINI_API_KEY가 .env 파일에 없습니다! 확인해주세요.")
            self.gemini_client = genai.Client(api_key=api_key)
        else:
            if self.model_id == "gemini-2.5-flash-image":
                self.model_id = "stabilityai/sdxl-turbo"
            self.pipe = AutoPipelineForText2Image.from_pretrained(
                self.model_id,
                torch_dtype=torch.float16,
                variant="fp16",
            ).to("mps")

        try:
            self.font = ImageFont.truetype(font_path, 26)
            print(f"✅ 폰트 로드 성공: '{font_path}'")
        except Exception:
            print("❌ 폰트 로드 실패! 경로를 확인하세요.")
            sys.exit()

        self.fixed_style = (
            "high quality Korean webtoon illustration, polished shading, clean line art, "
            "highly expressive faces, dynamic pose, dramatic body language, cinematic framing, "
            "consistent main character, children's educational comic tone, "
            "soft cinematic lighting, single scene, single panel, one moment only, "
            "detailed face, clear focal subject, one main child only, no text, no letters, no symbols, no watermark"
        )
        self.negative_prompt = (
            "split panels, multiple panels, collage, storyboard page, comic grid, contact sheet, "
            "duplicate character in background, repeated small frames, inset panels, text, caption, "
            "watermark, logo, extra windows, extra borders, multiple scenes in one image, "
            "blurry face, low detail face, cropped face, extra children, crowd around main character, "
            "speech bubble text inside generated image, letters, words, numbers, signage, ui text, subtitles, "
            "crowd, group photo, classroom full of students, family portrait, many faces, many people, audience, "
            "speech bubble, empty speech bubble, thought bubble, dialog balloon, blank white box, caption box, comic text container, "
            "placeholder box, poster, floating panel, infographic box, signboard, billboard, empty rectangle, blue rectangle, framed box, "
            "blank balloon, white balloon shape, comic balloon outline, callout box, text panel, "
            "white paper sheet, hanging paper, wall poster, empty notice, blank board, framed paper, white rectangle on wall"
        )

    def _build_character_prompt(self, storyboard):
        character = storyboard["character_profile"]
        style = storyboard["style_profile"]
        appearance = character.get("appearance", "")
        outfit = character.get("outfit", "")
        visual_style = style.get("visual_style", "")
        color_palette = style.get("color_palette", "")
        mood = style.get("mood", "")

        return (
            f"{self.fixed_style}, {visual_style}, {color_palette}, {mood}, "
            f"main character {appearance}, outfit {outfit}, "
            "keep the same face, hair, age, and costume across all four panels, "
            "show exactly one main child character, "
            "main character should occupy most of the frame, "
            "compose the scene so the child and key object fill the panel strongly, "
            "let the subject reach close to the panel edges with natural cropping when helpful, "
            "close-up or medium shot of one child, "
            "avoid large empty wall, empty floor, or dead space, "
            "no framed object, no signboard, no poster, no placeholder box, no blank balloon shape anywhere"
        )

    def _build_panel_prompt(self, storyboard, panel, panel_index):
        role_hints = [
            "introduce the situation clearly with a strong first reaction, close-up or medium shot",
            "show the development with active explanation, visible hand gesture or meaningful object interaction",
            "show the key problem or emotional turning point with heightened tension and a dramatic reaction",
            "show the resolution or gentle takeaway with relief, hopeful energy, and clear emotional closure",
        ]
        prompt_parts = [
            self._build_character_prompt(storyboard),
            role_hints[panel_index],
            panel["scene"],
            f"must show {panel['must_show']}",
            f"avoid {panel.get('avoid', 'no extra text')}",
            "single full-frame scene, readable composition, emotional storytelling, "
            "focus on one clear action, no mini-panels, no repeated character copies, "
            "no crowd, no audience, no group scene, at most one faint background extra, prioritize one main child character, "
            "fill the panel with the main subject and essential props, minimize empty unused corners, "
            "do not leave a speech-bubble-shaped empty area, poster-shaped empty area, or large blank patch for later editing, "
            "show a clear visual symbol of the news topic, "
            "no generated text or glyphs anywhere in the scene, "
            "avoid static standing pose, avoid passport-photo framing, "
            "use expressive hands, body tilt, motion, dynamic camera angle, and edge-to-edge composition",
        ]
        return ", ".join(part for part in prompt_parts if part)

    def _build_gemini_image_prompt(self, storyboard, panel, panel_index):
        prompt = self._build_panel_prompt(storyboard, panel, panel_index)
        return (
            f"{prompt}, square image, single clean illustration, "
            "do not draw any words, letters, signs, captions, subtitles, labels, speech bubbles, thought bubbles, blank white balloons, or text inside the image, "
            "do not draw any poster, notice board, signboard, placeholder box, empty rectangle, framed blank panel, comic text container, infographic box, balloon outline, callout box, hanging paper, white paper sheet, or framed wall paper, "
            "never draw an empty speech balloon or empty white box, "
            "use a tight edge-to-edge composition so the subject fills the frame without distortion"
        )

    def _wrap_text_lines(self, text, max_chars):
        return textwrap.wrap(text, width=max_chars) or [text]

    def _detect_content_bbox(self, img):
        width, height = img.size
        grayscale = img.convert("L")
        pixels = grayscale.load()
        threshold = 244

        min_x, min_y = width, height
        max_x, max_y = -1, -1

        for y in range(height):
            for x in range(width):
                if pixels[x, y] < threshold:
                    if x < min_x:
                        min_x = x
                    if y < min_y:
                        min_y = y
                    if x > max_x:
                        max_x = x
                    if y > max_y:
                        max_y = y

        if max_x != -1 and max_y != -1:
            return (min_x, min_y, max_x + 1, max_y + 1)

        # Bright backgrounds often defeat the grayscale threshold check.
        # Fall back to a coarse edge-based bbox so lightly colored scenes still fill the panel.
        edge_map = img.convert("L").filter(ImageFilter.FIND_EDGES).resize((32, 32))
        edge_pixels = list(edge_map.getdata())
        avg_edge = sum(edge_pixels) / max(len(edge_pixels), 1)

        min_cell_x, min_cell_y = 32, 32
        max_cell_x, max_cell_y = -1, -1

        for y in range(32):
            for x in range(32):
                value = edge_pixels[y * 32 + x]
                if value > avg_edge * 1.15:
                    min_cell_x = min(min_cell_x, x)
                    min_cell_y = min(min_cell_y, y)
                    max_cell_x = max(max_cell_x, x)
                    max_cell_y = max(max_cell_y, y)

        if max_cell_x == -1 or max_cell_y == -1:
            return None

        cell_w = width / 32
        cell_h = height / 32
        return (
            max(0, int(min_cell_x * cell_w) - 8),
            max(0, int(min_cell_y * cell_h) - 8),
            min(width, int((max_cell_x + 1) * cell_w) + 8),
            min(height, int((max_cell_y + 1) * cell_h) + 8),
        )

    def _square_crop_bounds(self, width, height, center_x, center_y, size):
        size = max(1, min(int(round(size)), width, height))
        left = int(round(center_x - size / 2))
        top = int(round(center_y - size / 2))
        left = max(0, min(left, width - size))
        top = max(0, min(top, height - size))
        return (left, top, left + size, top + size)

    def _trim_generated_margin(self, img):
        width, height = img.size
        content_bbox = self._detect_content_bbox(img)
        if not content_bbox:
            return img

        min_x, min_y, max_x, max_y = content_bbox
        content_w = max_x - min_x
        content_h = max_y - min_y

        if content_w > width * 0.9 and content_h > height * 0.9:
            return img

        size = max(content_w, content_h)
        size = min(max(size + max(12, int(size * 0.04)), int(width * 0.7)), width, height)
        center_x = (min_x + max_x) / 2
        center_y = (min_y + max_y) / 2
        crop_box = self._square_crop_bounds(width, height, center_x, center_y, size)
        cropped = img.crop(crop_box)
        return cropped.resize((width, height), Image.Resampling.LANCZOS)

    def _autofit_panel(self, img):
        width, height = img.size
        content_bbox = self._detect_content_bbox(img)
        if not content_bbox:
            return img

        min_x, min_y, max_x, max_y = content_bbox
        content_w = max_x - min_x
        content_h = max_y - min_y

        if content_w >= width * 0.88 and content_h >= height * 0.88:
            return img

        target_size = max(int(width * 0.94), int(height * 0.94), content_w, content_h)
        crop_size = min(width, height, int(target_size * 1.04))
        center_x = (min_x + max_x) / 2
        # Keep a little more headroom for speech bubbles near the top.
        center_y = min(height - crop_size / 2, max(crop_size / 2, (min_y + max_y) / 2 + height * 0.04))
        crop_box = self._square_crop_bounds(width, height, center_x, center_y, crop_size)
        cropped = img.crop(crop_box)
        return cropped.resize((width, height), Image.Resampling.LANCZOS)

    def _measure_multiline(self, lines, font):
        widths = [font.getbbox(line)[2] for line in lines]
        heights = [font.getbbox(line)[3] for line in lines]
        return max(widths, default=0), sum(heights) + max(0, (len(lines) - 1) * 8)

    def _estimate_protected_regions(self, img):
        width, height = img.size
        protected = [
            (int(width * 0.22), int(height * 0.12), int(width * 0.78), int(height * 0.84)),
            (int(width * 0.3), int(height * 0.0), int(width * 0.7), int(height * 0.24)),
        ]

        edge_map = img.convert("L").filter(ImageFilter.FIND_EDGES).resize((12, 12))
        pixels = list(edge_map.getdata())
        avg_edge = sum(pixels) / max(len(pixels), 1)
        cell_w = width / 12
        cell_h = height / 12

        for y in range(12):
            for x in range(12):
                value = pixels[y * 12 + x]
                if value > avg_edge * 1.25:
                    x0 = int(x * cell_w)
                    y0 = int(y * cell_h)
                    x1 = int((x + 1) * cell_w)
                    y1 = int((y + 1) * cell_h)
                    protected.append((x0, y0, x1, y1))

        return protected

    def _estimate_subject_anchor(self, protected_regions, width, height):
        weighted_x = 0.0
        weighted_y = 0.0
        total_weight = 0.0

        for x0, y0, x1, y1 in protected_regions:
            area = max((x1 - x0) * (y1 - y0), 1)
            center_x = (x0 + x1) / 2
            center_y = (y0 + y1) / 2
            if center_y < height * 0.08:
                continue
            weighted_x += center_x * area
            weighted_y += center_y * area
            total_weight += area

        if total_weight == 0:
            return (width * 0.5, height * 0.62)

        return (weighted_x / total_weight, weighted_y / total_weight)

    def _candidate_bubble_rects(self, width, height, bubble_w, bubble_h):
        margin = 24
        top_y = margin
        upper_mid_y = max(margin, int(height * 0.14))
        mid_y = max(margin, int(height * 0.22))
        center_x = (width - bubble_w) // 2
        left_inset_x = max(margin, int(width * 0.12))
        right_inset_x = min(width - bubble_w - margin, int(width * 0.58))

        return [
            ("top_left", (margin, top_y, margin + bubble_w, top_y + bubble_h)),
            ("top_left_inset", (left_inset_x, top_y, left_inset_x + bubble_w, top_y + bubble_h)),
            ("top_center", (center_x, top_y, center_x + bubble_w, top_y + bubble_h)),
            ("top_right", (width - bubble_w - margin, top_y, width - margin, top_y + bubble_h)),
            ("top_right_inset", (right_inset_x, top_y, right_inset_x + bubble_w, top_y + bubble_h)),
            ("upper_mid_left", (margin, upper_mid_y, margin + bubble_w, upper_mid_y + bubble_h)),
            ("upper_mid_center", (center_x, upper_mid_y, center_x + bubble_w, upper_mid_y + bubble_h)),
            ("upper_mid_right", (width - bubble_w - margin, upper_mid_y, width - margin, upper_mid_y + bubble_h)),
            ("mid_left", (margin, mid_y, margin + bubble_w, mid_y + bubble_h)),
            ("mid_right", (width - bubble_w - margin, mid_y, width - margin, mid_y + bubble_h)),
        ]

    def _rect_intersection_area(self, rect_a, rect_b):
        left = max(rect_a[0], rect_b[0])
        top = max(rect_a[1], rect_b[1])
        right = min(rect_a[2], rect_b[2])
        bottom = min(rect_a[3], rect_b[3])
        if right <= left or bottom <= top:
            return 0
        return (right - left) * (bottom - top)

    def _choose_bubble_rect(self, width, height, bubble_w, bubble_h, protected_regions, blocked_regions=None):
        candidates = self._candidate_bubble_rects(width, height, bubble_w, bubble_h)
        best_name = "top_left"
        best_rect = candidates[0][1]
        best_score = float("inf")
        subject_anchor_x, subject_anchor_y = self._estimate_subject_anchor(protected_regions, width, height)
        blocked_regions = blocked_regions or []

        for name, rect in candidates:
            overlap_score = 0
            for region in protected_regions:
                overlap_score += self._rect_intersection_area(rect, region)
            for region in blocked_regions:
                overlap_score += self._rect_intersection_area(rect, region) * 4

            center_penalty = abs(((rect[0] + rect[2]) / 2) - (width / 2)) * 0.2
            vertical_penalty = rect[1] * 0.15
            bubble_center_x = (rect[0] + rect[2]) / 2
            bubble_center_y = (rect[1] + rect[3]) / 2
            distance_penalty = (
                abs(bubble_center_x - subject_anchor_x) * 0.08 +
                abs(bubble_center_y - subject_anchor_y) * 0.04
            )
            if abs(bubble_center_x - subject_anchor_x) > width * 0.34:
                distance_penalty += 800
            if abs(bubble_center_y - subject_anchor_y) > height * 0.42:
                distance_penalty += 500
            score = overlap_score + center_penalty + vertical_penalty + distance_penalty
            if score < best_score:
                best_name = name
                best_rect = rect
                best_score = score

        return best_name, best_rect

    def _draw_single_speech_bubble(self, img, text, preferred_positions=None, blocked_regions=None):
        draw = ImageDraw.Draw(img)
        width, height = img.size
        max_chars = 14 if len(text) < 28 else 12
        lines = self._wrap_text_lines(text, max_chars=max_chars)
        text_w, text_h = self._measure_multiline(lines, self.font)

        padding_x = 24
        padding_y = 18
        bubble_w = min(width - 48, text_w + padding_x * 2)
        bubble_h = text_h + padding_y * 2 + 10

        protected_regions = self._estimate_protected_regions(img)
        subject_anchor_x, subject_anchor_y = self._estimate_subject_anchor(protected_regions, width, height)

        rect = None
        position_name = None
        candidate_map = dict(self._candidate_bubble_rects(width, height, bubble_w, bubble_h))

        if preferred_positions:
            for preferred_position in preferred_positions:
                rect = candidate_map.get(preferred_position)
                if rect and not any(self._rect_intersection_area(rect, region) > 0 for region in (blocked_regions or [])):
                    position_name = preferred_position
                    break

        if position_name is None:
            position_name, rect = self._choose_bubble_rect(
                width, height, bubble_w, bubble_h, protected_regions, blocked_regions=blocked_regions
            )
        elif rect is None:
            candidate_map = dict(self._candidate_bubble_rects(width, height, bubble_w, bubble_h))
            position_name, rect = self._choose_bubble_rect(
                width, height, bubble_w, bubble_h, protected_regions, blocked_regions=blocked_regions
            )

        x0, y0, x1, y1 = rect
        draw.rounded_rectangle(rect, radius=26, fill="white", outline=(45, 45, 45), width=4)

        tail_anchor_x = x0 + 64 if subject_anchor_x < (x0 + x1) / 2 else x1 - 64
        tail_anchor = (tail_anchor_x, y1)
        raw_tip_x = max(x0 + 28, min(x1 - 28, int(subject_anchor_x)))
        max_horizontal_delta = 90
        if raw_tip_x < tail_anchor_x:
            tail_tip_x = max(tail_anchor_x - max_horizontal_delta, raw_tip_x)
        else:
            tail_tip_x = min(tail_anchor_x + max_horizontal_delta, raw_tip_x)
        raw_tip_y = int(max(y1 + 24, subject_anchor_y * 0.92))
        tail_tip_y = min(y1 + 96, min(height - 14, raw_tip_y))
        tail_points = [
            tail_anchor,
            (tail_anchor[0] - 22 if tail_tip_x < tail_anchor[0] else tail_anchor[0] + 22, tail_anchor[1] + 18),
            (tail_tip_x, tail_tip_y),
        ]
        draw.polygon(tail_points, fill="white", outline=(45, 45, 45))

        current_y = y0 + padding_y
        for line in lines:
            line_w = self.font.getbbox(line)[2]
            draw.text(((x0 + x1 - line_w) / 2, current_y), line, font=self.font, fill=(15, 15, 15))
            current_y += self.font.getbbox(line)[3] + 8

        return {
            "position": position_name,
            "rect": [x0, y0, x1, y1],
            "text": text,
        }

    def _collect_dialogues(self, panel):
        dialogues = panel.get("dialogues")
        if isinstance(dialogues, list) and dialogues:
            normalized = []
            for dialogue in dialogues[:2]:
                if not isinstance(dialogue, dict):
                    continue
                text = str(dialogue.get("text", "")).strip()
                speaker = str(dialogue.get("speaker", "")).strip() or "인물"
                if text:
                    normalized.append({"speaker": speaker, "text": text})
            if normalized:
                return normalized

        fallback = str(panel.get("dialogue", "")).strip()
        return [{"speaker": "인물", "text": fallback}] if fallback else []

    def _preferred_bubble_positions(self, panel, img, dialogue_index=0, dialogue_count=1):
        width, height = img.size
        protected_regions = self._estimate_protected_regions(img)
        subject_anchor_x, _ = self._estimate_subject_anchor(protected_regions, width, height)
        subject_on_left = subject_anchor_x < width * 0.48
        emotion = str(panel.get("emotion", "")).lower()

        if dialogue_count > 1:
            if subject_on_left:
                two_dialogue_sets = [
                    ["top_right", "top_center", "upper_mid_right"],
                    ["top_left_inset", "upper_mid_left", "top_center"],
                ]
            else:
                two_dialogue_sets = [
                    ["top_left", "top_center", "upper_mid_left"],
                    ["top_right_inset", "upper_mid_right", "top_center"],
                ]
            return two_dialogue_sets[min(dialogue_index, 1)]

        if any(keyword in emotion for keyword in ["surprise", "shock", "panic", "fear", "worry", "anxious"]):
            return ["top_center", "upper_mid_center", "top_right" if subject_on_left else "top_left", "top_left_inset" if subject_on_left else "top_right_inset"]
        if any(keyword in emotion for keyword in ["happy", "relief", "hope", "warm", "calm"]):
            return ["top_right_inset" if subject_on_left else "top_left_inset", "top_center", "upper_mid_right" if subject_on_left else "upper_mid_left"]
        if any(keyword in emotion for keyword in ["explain", "thinking", "curious", "question", "confused"]):
            return ["top_left_inset" if not subject_on_left else "top_right_inset", "top_center", "upper_mid_left" if not subject_on_left else "upper_mid_right"]

        return ["top_right_inset" if subject_on_left else "top_left_inset", "top_center", "upper_mid_right" if subject_on_left else "upper_mid_left"]

    def _draw_speech_bubbles(self, img, panel):
        dialogues = self._collect_dialogues(panel)
        bubble_layouts = []
        blocked_regions = []

        if not dialogues:
            return bubble_layouts

        for index, dialogue in enumerate(dialogues[:2]):
            preferred_positions = self._preferred_bubble_positions(
                panel,
                img,
                dialogue_index=index,
                dialogue_count=len(dialogues[:2]),
            )
            layout = self._draw_single_speech_bubble(
                img,
                dialogue["text"],
                preferred_positions=preferred_positions,
                blocked_regions=blocked_regions,
            )
            layout["speaker"] = dialogue["speaker"]
            bubble_layouts.append(layout)
            x0, y0, x1, y1 = layout["rect"]
            blocked_regions.append((x0 - 12, y0 - 12, x1 + 12, y1 + 24))

        return bubble_layouts

    def _render_panel(self, storyboard, panel, panel_index):
        print(f"🎨 {panel_index + 1}번째 컷 생성 중...")
        if self.provider == "gemini":
            prompt = self._build_gemini_image_prompt(storyboard, panel, panel_index)
            response = self.gemini_client.models.generate_content(
                model=self.model_id,
                contents=[prompt],
            )

            image_bytes = None
            for candidate in getattr(response, "candidates", []) or []:
                content = getattr(candidate, "content", None)
                for part in getattr(content, "parts", []) or []:
                    inline_data = getattr(part, "inline_data", None)
                    if inline_data and getattr(inline_data, "data", None):
                        image_bytes = inline_data.data
                        break
                if image_bytes:
                    break

            if not image_bytes:
                raise ValueError("Gemini 이미지 응답에서 이미지 데이터를 찾지 못했습니다.")

            if isinstance(image_bytes, str):
                import base64
                image_bytes = base64.b64decode(image_bytes)

            base_img = Image.open(BytesIO(image_bytes)).convert("RGB")
        else:
            prompt = self._build_panel_prompt(storyboard, panel, panel_index)
            base_img = self.pipe(
                prompt=prompt,
                negative_prompt=self.negative_prompt,
                num_inference_steps=4,
                guidance_scale=1.5,
                height=512,
                width=512,
            ).images[0]
        base_img = self._trim_generated_margin(base_img)
        base_img = self._autofit_panel(base_img)
        bubble_layouts = self._draw_speech_bubbles(base_img, panel)
        return base_img, bubble_layouts

    def generate_story_comic(self, storyboard):
        panels = []
        all_bubble_layouts = []

        for index, panel in enumerate(storyboard["panels"]):
            panel_img, panel_bubble_layouts = self._render_panel(storyboard, panel, index)
            panels.append(panel_img)
            all_bubble_layouts.append(
                {
                    "panel_index": index,
                    "emotion": panel["emotion"],
                    "layouts": panel_bubble_layouts,
                }
            )

        panel_width, panel_height = panels[0].size
        grid = Image.new("RGB", (panel_width * 2, panel_height * 2), color=(255, 255, 255))
        grid.paste(panels[0], (0, 0))
        grid.paste(panels[1], (panel_width, 0))
        grid.paste(panels[2], (0, panel_height))
        grid.paste(panels[3], (panel_width, panel_height))

        draw = ImageDraw.Draw(grid)
        draw.line([(panel_width, 0), (panel_width, panel_height * 2)], fill=(0, 0, 0), width=6)
        draw.line([(0, panel_height), (panel_width * 2, panel_height)], fill=(0, 0, 0), width=6)
        draw.rounded_rectangle(
            [3, 3, panel_width * 2 - 3, panel_height * 2 - 3],
            radius=24,
            outline=(0, 0, 0),
            width=6,
        )

        return {"image": grid, "bubble_layouts": all_bubble_layouts}


if __name__ == "__main__":
    example_storyboard = {
        "character_profile": {
            "name": "하늘",
            "role": "뉴스를 배우는 초등학생",
            "appearance": "young Korean child with short wavy brown hair and big curious eyes",
            "outfit": "orange hoodie, shorts, sneakers",
            "personality": "호기심이 많고 표정이 잘 드러나요",
            "speaking_style": "짧고 솔직하게 말해요",
        },
        "style_profile": {
            "visual_style": "warm children's comic, clean line art, expressive face",
            "color_palette": "soft warm indoor colors",
            "mood": "gentle and educational",
        },
        "panels": [
            {
                "scene": "child in a bright living room reading news on a smartphone, medium shot",
                "emotion": "놀람",
                "dialogues": [
                    {"speaker": "하늘", "text": "어? 이게 무슨 뜻일까요?"},
                ],
                "must_show": "smartphone with news article and surprised child",
                "avoid": "no extra text, no second main character",
            },
            {
                "scene": "same child thinking carefully while looking at the phone, cozy living room background",
                "emotion": "집중",
                "dialogues": [
                    {"speaker": "하늘", "text": "쉽게 말하면 이런 이야기예요!"},
                ],
                "must_show": "same child, phone, thoughtful expression",
                "avoid": "no crowd, no messy background",
            },
            {
                "scene": "same child reacting strongly to the key problem of the news, dramatic comic lighting",
                "emotion": "걱정",
                "dialogues": [
                    {"speaker": "하늘", "text": "아, 그래서 사람들이 걱정했군요."},
                ],
                "must_show": "same child, strong reaction, symbolic key event",
                "avoid": "no violence, no scary gore",
            },
            {
                "scene": "same child smiling with a guardian in a calm room, hopeful ending",
                "emotion": "안심",
                "dialogues": [
                    {"speaker": "하늘", "text": "이제 조금 더 쉽게 이해됐어요!"},
                ],
                "must_show": "same child and supportive adult, warm ending",
                "avoid": "no extra text, no dark mood",
            },
        ],
    }

    generator = ComicGenerator("my_font.ttf")
    result = generator.generate_story_comic(example_storyboard)
    result["image"].save("NewsNow_Story_Comic.png")
    print("\n✨ [완성] 'NewsNow_Story_Comic.png'가 생성되었습니다!")
