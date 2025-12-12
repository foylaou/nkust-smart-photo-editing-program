#!/usr/bin/env python3
"""
IPC Server - 圖片處理服務
透過 stdin/stdout JSON 通訊，暴露所有圖片處理功能給前端
"""

import sys
import json
import base64
from io import BytesIO
from typing import Optional, Dict, Any

sys.stdout.reconfigure(encoding='utf-8')
sys.stderr.reconfigure(encoding='utf-8')

from tools.FileHandler import FileHandler
from tools.Picture import Picture
from PIL import Image


class IPCServer:
    """IPC 伺服器 - 處理前端請求並回傳結果"""

    def __init__(self):
        try:
            self.file_handler = FileHandler()
            self.picture = Picture()
            self.current_image: Optional[Image.Image] = None
            self.original_image: Optional[Image.Image] = None  # 儲存原始圖片用於復原
            sys.stderr.write("圖片處理服務初始化成功\n")
            sys.stderr.flush()
        except Exception as e:
            sys.stderr.write(f"Error: 初始化失敗: {e}\n")
            sys.stderr.flush()
            raise

    def _image_to_base64(self, img: Image.Image, format: str = "PNG", quality: int = 75) -> str:
        """將 PIL Image 轉換為 Base64 字串"""
        buffer = BytesIO()

        # 為了減小傳輸大小，預覽圖統一使用 JPEG 格式
        save_format = "JPEG"
        save_img = img

        # 處理 RGBA 轉 JPEG（需要移除透明通道）
        if img.mode in ("RGBA", "LA", "P"):
            # 創建白色背景
            background = Image.new("RGB", img.size, (255, 255, 255))
            if img.mode == "P":
                img = img.convert("RGBA")
            if img.mode in ("RGBA", "LA"):
                background.paste(img, mask=img.split()[-1])  # 使用 alpha 通道作為遮罩
            save_img = background
        elif img.mode != "RGB":
            # 其他模式轉為 RGB
            save_img = img.convert("RGB")

        # 使用 JPEG 壓縮以減小大小
        save_img.save(buffer, format=save_format, quality=quality, optimize=True)

        base64_size = len(buffer.getvalue())
        sys.stderr.write(f"Base64 編碼大小: {base64_size / 1024:.1f} KB\n")
        sys.stderr.flush()

        return base64.b64encode(buffer.getvalue()).decode('utf-8')

    def _base64_to_image(self, base64_str: str) -> Image.Image:
        """將 Base64 字串轉換為 PIL Image"""
        image_data = base64.b64decode(base64_str)
        return Image.open(BytesIO(image_data))

    def _get_image_info(self, img: Image.Image) -> Dict[str, Any]:
        """取得圖片資訊"""
        return {
            "width": img.size[0],
            "height": img.size[1],
            "mode": img.mode,
            "format": img.format or "Unknown"
        }

    def _create_preview(self, img: Image.Image, max_size: int = 1024) -> Image.Image:
        """
        為大圖片創建預覽
        如果圖片任一邊超過 max_size，則縮小至適當大小

        Args:
            img: 原始圖片
            max_size: 最大尺寸（寬或高），默認 1024px（減小以避免 IPC 傳輸問題）

        Returns:
            預覽圖片
        """
        width, height = img.size

        # 如果圖片不大，直接返回
        if width <= max_size and height <= max_size:
            sys.stderr.write(f"圖片尺寸適中，無需縮放: {width}x{height}\n")
            sys.stderr.flush()
            return img

        # 計算縮放比例
        scale = min(max_size / width, max_size / height)
        new_width = int(width * scale)
        new_height = int(height * scale)

        # 創建縮圖
        preview = img.copy()
        preview.thumbnail((new_width, new_height), Image.Resampling.LANCZOS)

        # 計算壓縮比例
        reduction = (1 - (preview.size[0] * preview.size[1]) / (width * height)) * 100

        sys.stderr.write(f"✓ 預覽圖片已縮放: {width}x{height} -> {preview.size[0]}x{preview.size[1]} (減少 {reduction:.1f}%)\n")
        sys.stderr.flush()

        return preview

    def handle_request(self, request: dict) -> dict:
        """處理前端請求"""
        action = request.get("action")

        try:
            # ==================== 檔案操作 ====================

            # 載入檔案
            if action == "load_file":
                file_path = request.get("file_path")
                if not file_path:
                    return {"success": False, "error": "缺少 file_path 參數"}

                sys.stderr.write(f"📂 開始載入圖片: {file_path}\n")
                sys.stderr.flush()

                self.current_image = self.file_handler.load_file(file_path)
                self.original_image = self.current_image.copy()  # 儲存原始圖片備份
                self.picture.set_image(self.current_image)

                sys.stderr.write(f"✓ 原始圖片已載入: {self.current_image.size[0]}x{self.current_image.size[1]} ({self.current_image.mode})\n")
                sys.stderr.write(f"✓ 原始圖片已備份，可使用 reset 功能恢復\n")
                sys.stderr.flush()

                # 為大圖片生成預覽縮圖
                preview_image = self._create_preview(self.current_image)

                return {
                    "success": True,
                    "message": f"成功載入: {file_path}",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(preview_image)
                }

            # 從 Base64 載入
            elif action == "load_base64":
                base64_str = request.get("base64")
                if not base64_str:
                    return {"success": False, "error": "缺少 base64 參數"}

                self.current_image = self._base64_to_image(base64_str)
                self.original_image = self.current_image.copy()  # 儲存原始圖片
                self.picture.set_image(self.current_image)

                # 為大圖片生成預覽縮圖
                preview_image = self._create_preview(self.current_image)

                return {
                    "success": True,
                    "message": "成功從 Base64 載入圖片",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(preview_image)
                }

            # 儲存檔案
            elif action == "save_file":
                output_path = request.get("output_path")
                quality = request.get("quality", 95)

                if not output_path:
                    return {"success": False, "error": "缺少 output_path 參數"}
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.file_handler.save_as(output_path, self.current_image, quality=quality)

                return {
                    "success": True,
                    "message": f"已儲存至: {output_path}",
                    "path": output_path
                }

            # 取得 Base64 輸出
            elif action == "get_base64":
                format = request.get("format", "PNG")

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                return {
                    "success": True,
                    "base64": self._image_to_base64(self.current_image, format),
                    "info": self._get_image_info(self.current_image)
                }

            # 取得檔案資訊
            elif action == "get_info":
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                return {
                    "success": True,
                    "info": self._get_image_info(self.current_image)
                }

            # 批次載入資料夾
            elif action == "batch_load":
                folder_path = request.get("folder_path")
                if not folder_path:
                    return {"success": False, "error": "缺少 folder_path 參數"}

                files = self.file_handler.batch_load(folder_path)
                return {
                    "success": True,
                    "files": files,
                    "count": len(files)
                }

            # ==================== 圖片處理 ====================

            # 1. 縮圖
            elif action == "thumbnail":
                max_width = request.get("max_width", 128)
                max_height = request.get("max_height", 128)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.thumbnail((max_width, max_height))
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"縮圖完成: {self.current_image.size}",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 2. 調整尺寸
            elif action == "resize":
                width = request.get("width")
                height = request.get("height")
                keep_aspect = request.get("keep_aspect", False)

                if not width or not height:
                    return {"success": False, "error": "缺少 width 或 height 參數"}
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.resize((width, height), keep_aspect)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"調整尺寸完成: {self.current_image.size}",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 3. 旋轉
            elif action == "rotate":
                angle = request.get("angle", 0)
                expand = request.get("expand", True)
                fill_color = request.get("fill_color", [255, 255, 255])

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.rotate(angle, expand, tuple(fill_color))
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"旋轉 {angle}° 完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 4. 裁切
            elif action == "crop":
                left = request.get("left", 0)
                top = request.get("top", 0)
                right = request.get("right")
                bottom = request.get("bottom")

                if right is None or bottom is None:
                    return {"success": False, "error": "缺少 right 或 bottom 參數"}
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.crop((left, top, right, bottom))
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"裁切完成: {self.current_image.size}",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 4b. 中心裁切
            elif action == "crop_center":
                width = request.get("width")
                height = request.get("height")

                if not width or not height:
                    return {"success": False, "error": "缺少 width 或 height 參數"}
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.crop_center(width, height)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"中心裁切完成: {self.current_image.size}",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 5. 灰階
            elif action == "grayscale":
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.grayscale()
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": "灰階轉換完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 6. 藝術效果
            elif action == "art_effect":
                effect_type = request.get("effect_type", "poster")
                # 支援: poster, sketch, oil_paint, cartoon

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.art_effect(effect_type)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"藝術效果 ({effect_type}) 套用完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 7. 白平衡
            elif action == "white_balance":
                method = request.get("method", "auto")

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.white_balance(method)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": "白平衡調整完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 8. 亮度
            elif action == "brightness":
                factor = request.get("factor", 1.0)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.brightness(factor)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"亮度調整完成 (factor={factor})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 9. 對比度
            elif action == "contrast":
                factor = request.get("factor", 1.0)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.contrast(factor)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"對比度調整完成 (factor={factor})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 10. 飽和度
            elif action == "saturation":
                factor = request.get("factor", 1.0)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.saturation(factor)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"飽和度調整完成 (factor={factor})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 11. 銳化
            elif action == "sharpen":
                factor = request.get("factor", 1.0)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.sharpen(factor)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"銳化調整完成 (factor={factor})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 12. 模糊
            elif action == "blur":
                radius = request.get("radius", 2.0)
                blur_type = request.get("blur_type", "gaussian")

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.blur(radius, blur_type)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"模糊處理完成 ({blur_type}, radius={radius})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 13. 翻轉
            elif action == "flip":
                direction = request.get("direction", "horizontal")

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.flip(direction)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"翻轉完成 ({direction})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 14. 負片
            elif action == "invert":
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.invert()
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": "負片效果完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 15. 懷舊/復古
            elif action == "sepia":
                intensity = request.get("intensity", 1.0)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.sepia(intensity)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"懷舊效果完成 (intensity={intensity})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 16. 邊緣偵測
            elif action == "edge_detect":
                method = request.get("method", "default")

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.edge_detect(method)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"邊緣偵測完成 ({method})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 17. 浮雕
            elif action == "emboss":
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.emboss()
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": "浮雕效果完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 18. 馬賽克
            elif action == "pixelate":
                pixel_size = request.get("pixel_size", 10)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.pixelate(pixel_size)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"馬賽克效果完成 (pixel_size={pixel_size})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 19. 暈影
            elif action == "vignette":
                strength = request.get("strength", 0.5)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.vignette(strength)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"暈影效果完成 (strength={strength})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 20. 色相偏移
            elif action == "hue_shift":
                degrees = request.get("degrees", 0)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.hue_shift(degrees)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"色相偏移完成 ({degrees}°)",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 21. 添加邊框
            elif action == "add_border":
                border_width = request.get("border_width", 10)
                color = request.get("color", [0, 0, 0])

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.add_border(border_width, tuple(color))
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"邊框添加完成 (width={border_width})",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 22. 自動對比
            elif action == "auto_contrast":
                cutoff = request.get("cutoff", 0)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.auto_contrast(cutoff)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": "自動對比調整完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 23. 直方圖等化
            elif action == "equalize":
                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.equalize()
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": "直方圖等化完成",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # 24. 色溫調整
            elif action == "color_temperature":
                temperature = request.get("temperature", 6500)

                if self.current_image is None:
                    return {"success": False, "error": "尚未載入圖片"}

                self.current_image = self.picture.color_temperature(temperature)
                self.picture.set_image(self.current_image)

                return {
                    "success": True,
                    "message": f"色溫調整完成 ({temperature}K)",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(self._create_preview(self.current_image))
                }

            # ==================== 系統功能 ====================

            # 復原（重新載入原圖）
            elif action == "reset":
                if self.original_image is None:
                    sys.stderr.write("⚠ 復原失敗: 沒有備份的原始圖片\n")
                    sys.stderr.flush()
                    return {"success": False, "error": "沒有原始圖片可復原"}

                sys.stderr.write(f"🔄 復原至原始圖片: {self.original_image.size[0]}x{self.original_image.size[1]}\n")
                sys.stderr.flush()

                self.current_image = self.original_image.copy()
                self.picture.set_image(self.current_image)

                # 為大圖片生成預覽縮圖
                preview_image = self._create_preview(self.current_image)

                sys.stderr.write("✓ 已成功復原至原始圖片\n")
                sys.stderr.flush()

                return {
                    "success": True,
                    "message": "已復原至原始圖片",
                    "info": self._get_image_info(self.current_image),
                    "preview": self._image_to_base64(preview_image)
                }

            # 取得可用的 actions 列表
            elif action == "list_actions":
                actions = {
                    "file_operations": {
                        "load_file": {"params": ["file_path"], "desc": "載入圖片檔案"},
                        "load_base64": {"params": ["base64"], "desc": "從 Base64 載入圖片"},
                        "save_file": {"params": ["output_path", "quality?"], "desc": "儲存圖片"},
                        "get_base64": {"params": ["format?"], "desc": "取得 Base64 輸出"},
                        "get_info": {"params": [], "desc": "取得圖片資訊"},
                        "batch_load": {"params": ["folder_path"], "desc": "批次載入資料夾"},
                        "reset": {"params": [], "desc": "復原至原始圖片"}
                    },
                    "basic_transforms": {
                        "thumbnail": {"params": ["max_width?", "max_height?"], "desc": "建立縮圖"},
                        "resize": {"params": ["width", "height", "keep_aspect?"], "desc": "調整尺寸"},
                        "rotate": {"params": ["angle", "expand?", "fill_color?"], "desc": "旋轉圖片"},
                        "crop": {"params": ["left", "top", "right", "bottom"], "desc": "裁切圖片"},
                        "crop_center": {"params": ["width", "height"], "desc": "中心裁切"},
                        "flip": {"params": ["direction"], "desc": "翻轉 (horizontal/vertical)"}
                    },
                    "color_adjustments": {
                        "grayscale": {"params": [], "desc": "轉灰階"},
                        "brightness": {"params": ["factor"], "desc": "亮度調整"},
                        "contrast": {"params": ["factor"], "desc": "對比度調整"},
                        "saturation": {"params": ["factor"], "desc": "飽和度調整"},
                        "white_balance": {"params": ["method?"], "desc": "白平衡"},
                        "color_temperature": {"params": ["temperature"], "desc": "色溫 (2000-10000K)"},
                        "hue_shift": {"params": ["degrees"], "desc": "色相偏移 (0-360)"},
                        "auto_contrast": {"params": ["cutoff?"], "desc": "自動對比"},
                        "equalize": {"params": [], "desc": "直方圖等化"},
                        "invert": {"params": [], "desc": "負片效果"},
                        "sepia": {"params": ["intensity?"], "desc": "懷舊色調"}
                    },
                    "filters_effects": {
                        "blur": {"params": ["radius?", "blur_type?"], "desc": "模糊 (gaussian/box)"},
                        "sharpen": {"params": ["factor?"], "desc": "銳化"},
                        "edge_detect": {"params": ["method?"], "desc": "邊緣偵測"},
                        "emboss": {"params": [], "desc": "浮雕效果"},
                        "pixelate": {"params": ["pixel_size?"], "desc": "馬賽克"},
                        "vignette": {"params": ["strength?"], "desc": "暈影效果"},
                        "art_effect": {"params": ["effect_type"], "desc": "藝術效果 (poster/sketch/oil_paint/cartoon)"},
                        "add_border": {"params": ["border_width?", "color?"], "desc": "添加邊框"}
                    }
                }
                return {"success": True, "actions": actions}

            # Ping - 健康檢查
            elif action == "ping":
                return {"success": True, "message": "pong", "status": "running"}

            # 未知 action
            else:
                return {"success": False, "error": f"未知的 action: {action}"}

        except Exception as e:
            import traceback
            sys.stderr.write(f"處理錯誤: {traceback.format_exc()}\n")
            sys.stderr.flush()
            return {"success": False, "error": str(e)}

    def run(self):
        """主迴圈 - 透過 stdin/stdout 進行 IPC 通訊"""
        sys.stderr.write("IPC Server 啟動中...\n")
        sys.stderr.flush()

        # 增加輸入緩衝區大小以處理大型圖片
        buffer = ""

        while True:
            try:
                # 讀取一行，但處理可能的大型輸入
                chunk = sys.stdin.readline()
                if not chunk:
                    sys.stderr.write("EOF received, shutting down\n")
                    sys.stderr.flush()
                    break

                buffer += chunk

                # 檢查是否有完整的 JSON（以換行符結束）
                if not chunk.endswith('\n'):
                    # 還沒讀完，繼續讀取
                    continue

                line = buffer.strip()
                buffer = ""  # 清空緩衝區

                if not line:
                    continue

                try:
                    request = json.loads(line)
                except json.JSONDecodeError as e:
                    sys.stderr.write(f"JSON 解析錯誤: {str(e)}\n")
                    sys.stderr.write(f"資料長度: {len(line)} 字元\n")
                    sys.stderr.write(f"資料預覽: {line[:200]}...\n")
                    sys.stderr.flush()
                    response = {"success": False, "error": f"JSON 解析錯誤: {str(e)}"}
                    self._send_response(response)
                    continue

                response = self.handle_request(request)
                self._send_response(response)

            except KeyboardInterrupt:
                sys.stderr.write("收到中斷訊號\n")
                sys.stderr.flush()
                break
            except Exception as e:
                sys.stderr.write(f"Error: {str(e)}\n")
                sys.stderr.flush()
                response = {"success": False, "error": str(e)}
                self._send_response(response)

    def _send_response(self, response: dict):
        """發送 JSON 回應"""
        try:
            json_str = json.dumps(response, ensure_ascii=False)
            sys.stdout.write(json_str + "\n")
            sys.stdout.flush()
        except Exception as e:
            sys.stderr.write(f"發送回應失敗: {str(e)}\n")
            sys.stderr.flush()


def main():
    from dotenv import load_dotenv
    load_dotenv()

    server = IPCServer()
    server.run()


if __name__ == "__main__":
    main()