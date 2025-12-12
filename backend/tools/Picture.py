"""
圖片處理模組 - 提供各種圖片編輯與特效功能
"""

from PIL import Image, ImageFilter, ImageEnhance, ImageOps, ImageDraw
import numpy as np
from typing import Tuple, Optional, Union
import colorsys


class Picture:
    """圖片處理類別 - 提供 12+ 種圖片處理功能"""

    def __init__(self, image: Optional[Image.Image] = None):
        """
        初始化

        Args:
            image: PIL Image 物件
        """
        self.image = image

    def set_image(self, image: Image.Image):
        """設定要處理的圖片"""
        self.image = image
        return self

    def _ensure_image(self) -> Image.Image:
        """確保有圖片可處理"""
        if self.image is None:
            raise ValueError("尚未設定圖片，請先使用 set_image() 或載入圖片")
        return self.image

    # ========== 1. 縮圖 (Thumbnail) ==========
    def thumbnail(self, max_size: Tuple[int, int] = (128, 128)) -> Image.Image:
        """
        建立縮圖（保持比例）

        Args:
            max_size: 最大尺寸 (寬, 高)

        Returns:
            縮圖 Image 物件
        """
        img = self._ensure_image().copy()
        img.thumbnail(max_size, Image.Resampling.LANCZOS)
        print(f"✓ 縮圖完成: {img.size[0]} x {img.size[1]}")
        return img

    # ========== 2. 放大圖 (Resize/Enlarge) ==========
    def resize(self, new_size: Tuple[int, int],
               keep_aspect: bool = False) -> Image.Image:
        """
        調整圖片尺寸

        Args:
            new_size: 新尺寸 (寬, 高)
            keep_aspect: 是否保持比例

        Returns:
            調整後的 Image 物件
        """
        img = self._ensure_image()

        if keep_aspect:
            # 保持比例：計算適合目標尺寸的新尺寸
            target_width, target_height = new_size
            original_width, original_height = img.size

            # 計算寬度和高度的縮放比例
            width_ratio = target_width / original_width
            height_ratio = target_height / original_height

            # 使用較小的比例以確保圖片能完全適合目標尺寸
            scale = min(width_ratio, height_ratio)

            # 計算新的尺寸
            new_width = int(original_width * scale)
            new_height = int(original_height * scale)

            result = img.resize((new_width, new_height), Image.Resampling.LANCZOS)
            print(f"✓ 調整尺寸完成 (保持比例): {result.size[0]} x {result.size[1]}")
        else:
            result = img.resize(new_size, Image.Resampling.LANCZOS)
            print(f"✓ 調整尺寸完成: {result.size[0]} x {result.size[1]}")

        return result

    # ========== 3. 旋轉圖 (Rotate) ==========
    def rotate(self, angle: float, expand: bool = True,
               fill_color: Tuple[int, int, int] = (255, 255, 255)) -> Image.Image:
        """
        旋轉圖片

        Args:
            angle: 旋轉角度（逆時針）
            expand: 是否擴展畫布以容納旋轉後的圖片
            fill_color: 填充顏色

        Returns:
            旋轉後的 Image 物件
        """
        img = self._ensure_image()
        result = img.rotate(angle, expand=expand, fillcolor=fill_color,
                            resample=Image.Resampling.BICUBIC)
        print(f"✓ 旋轉 {angle}° 完成")
        return result

    # ========== 4. 裁切圖 (Crop) ==========
    def crop(self, box: Tuple[int, int, int, int]) -> Image.Image:
        """
        裁切圖片

        Args:
            box: 裁切區域 (左, 上, 右, 下)

        Returns:
            裁切後的 Image 物件
        """
        img = self._ensure_image()
        result = img.crop(box)
        print(f"✓ 裁切完成: {result.size[0]} x {result.size[1]}")
        return result

    def crop_center(self, width: int, height: int) -> Image.Image:
        """
        從中心裁切指定尺寸

        Args:
            width: 裁切寬度
            height: 裁切高度
        """
        img = self._ensure_image()
        img_width, img_height = img.size

        left = (img_width - width) // 2
        top = (img_height - height) // 2
        right = left + width
        bottom = top + height

        return self.crop((left, top, right, bottom))

    # ========== 5. 灰階圖 (Grayscale) ==========
    def grayscale(self) -> Image.Image:
        """
        轉換為灰階圖

        Returns:
            灰階 Image 物件
        """
        img = self._ensure_image()
        result = img.convert('L')
        print("✓ 灰階轉換完成")
        return result

    # ========== 6. 藝術照效果 (Art Effect) ==========
    def art_effect(self, effect_type: str = 'poster') -> Image.Image:
        """
        套用藝術效果

        Args:
            effect_type: 效果類型
                - 'poster': 海報效果
                - 'sketch': 素描效果
                - 'oil_paint': 油畫效果
                - 'cartoon': 卡通效果

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image()

        if effect_type == 'poster':
            # 海報效果 - 減少色彩數量
            result = ImageOps.posterize(img.convert('RGB'), bits=3)

        elif effect_type == 'sketch':
            # 素描效果
            gray = img.convert('L')
            inverted = ImageOps.invert(gray)
            blurred = inverted.filter(ImageFilter.GaussianBlur(radius=21))
            result = Image.blend(gray, ImageOps.invert(blurred), alpha=0.5)

        elif effect_type == 'oil_paint':
            # 油畫效果 - 使用多次模糊和銳化
            result = img.filter(ImageFilter.ModeFilter(size=5))
            result = result.filter(ImageFilter.EDGE_ENHANCE_MORE)

        elif effect_type == 'cartoon':
            # 卡通效果
            # 邊緣偵測
            edges = img.convert('L').filter(ImageFilter.FIND_EDGES)
            edges = ImageOps.invert(edges)
            # 色彩簡化
            color = ImageOps.posterize(img.convert('RGB'), bits=4)
            # 合併
            result = Image.composite(color,
                                     Image.new('RGB', img.size, (255, 255, 255)),
                                     edges.convert('L'))
        else:
            raise ValueError(f"未知的效果類型: {effect_type}")

        print(f"✓ 藝術效果 ({effect_type}) 套用完成")
        return result

    # ========== 7. 白平衡 (White Balance) ==========
    def white_balance(self, method: str = 'auto') -> Image.Image:
        """
        白平衡調整

        Args:
            method: 調整方法
                - 'auto': 自動白平衡
                - 'gray_world': 灰色世界假設

        Returns:
            調整後的 Image 物件
        """
        img = self._ensure_image().convert('RGB')
        img_array = np.array(img, dtype=np.float32)

        if method == 'auto' or method == 'gray_world':
            # 灰色世界假設法
            avg_r = np.mean(img_array[:, :, 0])
            avg_g = np.mean(img_array[:, :, 1])
            avg_b = np.mean(img_array[:, :, 2])
            avg_gray = (avg_r + avg_g + avg_b) / 3

            # 計算增益
            img_array[:, :, 0] *= avg_gray / (avg_r + 1e-6)
            img_array[:, :, 1] *= avg_gray / (avg_g + 1e-6)
            img_array[:, :, 2] *= avg_gray / (avg_b + 1e-6)

        # 限制範圍
        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        result = Image.fromarray(img_array)

        print("✓ 白平衡調整完成")
        return result

    # ========== 8. 亮度調整 (Brightness) ==========
    def brightness(self, factor: float = 1.0) -> Image.Image:
        """
        調整亮度

        Args:
            factor: 亮度因子 (0.0=全黑, 1.0=原始, 2.0=兩倍亮)

        Returns:
            調整後的 Image 物件
        """
        img = self._ensure_image()
        enhancer = ImageEnhance.Brightness(img)
        result = enhancer.enhance(factor)
        print(f"✓ 亮度調整完成 (factor={factor})")
        return result

    # ========== 9. 對比度調整 (Contrast) ==========
    def contrast(self, factor: float = 1.0) -> Image.Image:
        """
        調整對比度

        Args:
            factor: 對比因子 (0.0=灰色, 1.0=原始, 2.0=高對比)

        Returns:
            調整後的 Image 物件
        """
        img = self._ensure_image()
        enhancer = ImageEnhance.Contrast(img)
        result = enhancer.enhance(factor)
        print(f"✓ 對比度調整完成 (factor={factor})")
        return result

    # ========== 10. 飽和度調整 (Saturation) ==========
    def saturation(self, factor: float = 1.0) -> Image.Image:
        """
        調整飽和度

        Args:
            factor: 飽和度因子 (0.0=黑白, 1.0=原始, 2.0=高飽和)

        Returns:
            調整後的 Image 物件
        """
        img = self._ensure_image()
        enhancer = ImageEnhance.Color(img)
        result = enhancer.enhance(factor)
        print(f"✓ 飽和度調整完成 (factor={factor})")
        return result

    # ========== 11. 銳化 (Sharpen) ==========
    def sharpen(self, factor: float = 1.0) -> Image.Image:
        """
        銳化圖片

        Args:
            factor: 銳化因子 (0.0=模糊, 1.0=原始, 2.0=銳化)

        Returns:
            調整後的 Image 物件
        """
        img = self._ensure_image()
        enhancer = ImageEnhance.Sharpness(img)
        result = enhancer.enhance(factor)
        print(f"✓ 銳化調整完成 (factor={factor})")
        return result

    # ========== 12. 模糊 (Blur) ==========
    def blur(self, radius: float = 2.0, blur_type: str = 'gaussian') -> Image.Image:
        """
        模糊圖片

        Args:
            radius: 模糊半徑
            blur_type: 模糊類型 ('gaussian', 'box', 'motion')

        Returns:
            模糊後的 Image 物件
        """
        img = self._ensure_image()

        if blur_type == 'gaussian':
            result = img.filter(ImageFilter.GaussianBlur(radius=radius))
        elif blur_type == 'box':
            result = img.filter(ImageFilter.BoxBlur(radius=radius))
        elif blur_type == 'motion':
            # 模擬動態模糊
            kernel = [1 / radius] * int(radius)
            result = img.filter(ImageFilter.Kernel(
                size=(int(radius), 1),
                kernel=kernel,
                scale=1
            ))
        else:
            result = img.filter(ImageFilter.BLUR)

        print(f"✓ 模糊處理完成 ({blur_type}, radius={radius})")
        return result

    # ========== 13. 翻轉 (Flip) ==========
    def flip(self, direction: str = 'horizontal') -> Image.Image:
        """
        翻轉圖片

        Args:
            direction: 翻轉方向 ('horizontal', 'vertical')

        Returns:
            翻轉後的 Image 物件
        """
        img = self._ensure_image()

        if direction == 'horizontal':
            result = img.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
        elif direction == 'vertical':
            result = img.transpose(Image.Transpose.FLIP_TOP_BOTTOM)
        else:
            raise ValueError(f"未知的翻轉方向: {direction}")

        print(f"✓ 翻轉完成 ({direction})")
        return result

    # ========== 14. 負片效果 (Invert/Negative) ==========
    def invert(self) -> Image.Image:
        """
        負片效果（色彩反轉）

        Returns:
            反轉後的 Image 物件
        """
        img = self._ensure_image()

        if img.mode == 'RGBA':
            r, g, b, a = img.split()
            rgb = Image.merge('RGB', (r, g, b))
            inverted_rgb = ImageOps.invert(rgb)
            r2, g2, b2 = inverted_rgb.split()
            result = Image.merge('RGBA', (r2, g2, b2, a))
        else:
            result = ImageOps.invert(img.convert('RGB'))

        print("✓ 負片效果完成")
        return result

    # ========== 15. 懷舊/復古效果 (Sepia) ==========
    def sepia(self, intensity: float = 1.0) -> Image.Image:
        """
        懷舊色調效果

        Args:
            intensity: 強度 (0.0-1.0)

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image().convert('RGB')
        img_array = np.array(img, dtype=np.float32)

        # Sepia 轉換矩陣
        sepia_matrix = np.array([
            [0.393, 0.769, 0.189],
            [0.349, 0.686, 0.168],
            [0.272, 0.534, 0.131]
        ])

        # 套用 sepia
        sepia_img = img_array @ sepia_matrix.T

        # 混合原圖和 sepia
        result_array = img_array * (1 - intensity) + sepia_img * intensity
        result_array = np.clip(result_array, 0, 255).astype(np.uint8)

        result = Image.fromarray(result_array)
        print(f"✓ 懷舊效果完成 (intensity={intensity})")
        return result

    # ========== 16. 邊緣偵測 (Edge Detection) ==========
    def edge_detect(self, method: str = 'default') -> Image.Image:
        """
        邊緣偵測

        Args:
            method: 偵測方法 ('default', 'enhance', 'contour')

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image()

        if method == 'default':
            result = img.filter(ImageFilter.FIND_EDGES)
        elif method == 'enhance':
            result = img.filter(ImageFilter.EDGE_ENHANCE_MORE)
        elif method == 'contour':
            result = img.filter(ImageFilter.CONTOUR)
        else:
            result = img.filter(ImageFilter.FIND_EDGES)

        print(f"✓ 邊緣偵測完成 ({method})")
        return result

    # ========== 17. 浮雕效果 (Emboss) ==========
    def emboss(self) -> Image.Image:
        """
        浮雕效果

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image()
        result = img.filter(ImageFilter.EMBOSS)
        print("✓ 浮雕效果完成")
        return result

    # ========== 18. 馬賽克效果 (Pixelate/Mosaic) ==========
    def pixelate(self, pixel_size: int = 10) -> Image.Image:
        """
        馬賽克效果

        Args:
            pixel_size: 像素塊大小

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image()

        # 先縮小再放大
        small = img.resize(
            (img.size[0] // pixel_size, img.size[1] // pixel_size),
            resample=Image.Resampling.NEAREST
        )
        result = small.resize(img.size, resample=Image.Resampling.NEAREST)

        print(f"✓ 馬賽克效果完成 (pixel_size={pixel_size})")
        return result

    # ========== 19. 暈影效果 (Vignette) ==========
    def vignette(self, strength: float = 0.5) -> Image.Image:
        """
        暈影效果（邊緣變暗）

        Args:
            strength: 強度 (0.0-1.0)

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image().convert('RGB')
        width, height = img.size

        # 建立暈影遮罩
        mask = Image.new('L', (width, height), 255)
        draw = ImageDraw.Draw(mask)

        # 繪製漸層橢圓
        for i in range(min(width, height) // 2):
            alpha = int(255 * (1 - strength * (1 - i / (min(width, height) / 2))))
            draw.ellipse([i, i, width - i, height - i], fill=alpha)

        # 套用遮罩
        black = Image.new('RGB', (width, height), (0, 0, 0))
        result = Image.composite(img, black, mask)

        print(f"✓ 暈影效果完成 (strength={strength})")
        return result

    # ========== 20. 色相調整 (Hue Shift) ==========
    def hue_shift(self, degrees: float = 0) -> Image.Image:
        """
        色相偏移

        Args:
            degrees: 偏移角度 (0-360)

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image().convert('RGB')
        img_array = np.array(img, dtype=np.float32) / 255.0

        # RGB to HSV
        result_array = np.zeros_like(img_array)
        for i in range(img_array.shape[0]):
            for j in range(img_array.shape[1]):
                r, g, b = img_array[i, j]
                h, s, v = colorsys.rgb_to_hsv(r, g, b)
                # 偏移色相
                h = (h + degrees / 360.0) % 1.0
                r, g, b = colorsys.hsv_to_rgb(h, s, v)
                result_array[i, j] = [r, g, b]

        result_array = (result_array * 255).astype(np.uint8)
        result = Image.fromarray(result_array)

        print(f"✓ 色相偏移完成 ({degrees}°)")
        return result

    # ========== 21. 添加邊框 (Border) ==========
    def add_border(self, border_width: int = 10,
                   color: Tuple[int, int, int] = (0, 0, 0)) -> Image.Image:
        """
        添加邊框

        Args:
            border_width: 邊框寬度
            color: 邊框顏色 RGB

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image()
        result = ImageOps.expand(img, border=border_width, fill=color)
        print(f"✓ 邊框添加完成 (width={border_width})")
        return result

    # ========== 22. 自動對比 (Auto Contrast) ==========
    def auto_contrast(self, cutoff: float = 0) -> Image.Image:
        """
        自動對比調整

        Args:
            cutoff: 裁切百分比

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image()

        # 處理不同的圖像模式
        if img.mode == 'RGBA':
            # 對於帶 Alpha 通道的圖像，分離處理
            r, g, b, alpha = img.split()
            rgb_img = Image.merge('RGB', (r, g, b))
            result_rgb = ImageOps.autocontrast(rgb_img, cutoff=cutoff)
            r, g, b = result_rgb.split()
            result = Image.merge('RGBA', (r, g, b, alpha))
        elif img.mode == 'LA':
            l, alpha = img.split()
            result_l = ImageOps.autocontrast(l, cutoff=cutoff)
            result = Image.merge('LA', (result_l, alpha))
        else:
            # 對於 RGB、L、P 等模式直接處理
            result = ImageOps.autocontrast(img, cutoff=cutoff)

        print("✓ 自動對比調整完成")
        return result

    # ========== 23. 等化直方圖 (Histogram Equalization) ==========
    def equalize(self) -> Image.Image:
        """
        直方圖等化（增強對比）

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image()

        # ImageOps.equalize 只能處理 'L' 或 'P' 模式
        # 對於彩色圖像，需要轉換到 YCbCr 空間，只等化 Y 通道
        if img.mode == 'RGBA':
            # 分離 Alpha 通道
            r, g, b, alpha = img.split()
            rgb_img = Image.merge('RGB', (r, g, b))

            # 轉換到 YCbCr 色彩空間
            img_ycbcr = rgb_img.convert('YCbCr')
            y, cb, cr = img_ycbcr.split()

            # 只對亮度通道 Y 進行直方圖等化
            y_eq = ImageOps.equalize(y)

            # 合併回 YCbCr 並轉回 RGB
            img_ycbcr_eq = Image.merge('YCbCr', (y_eq, cb, cr))
            result_rgb = img_ycbcr_eq.convert('RGB')

            # 加回 alpha 通道
            r, g, b = result_rgb.split()
            result = Image.merge('RGBA', (r, g, b, alpha))

        elif img.mode == 'RGB':
            # 轉換到 YCbCr 色彩空間
            img_ycbcr = img.convert('YCbCr')
            y, cb, cr = img_ycbcr.split()

            # 只對亮度通道 Y 進行直方圖等化
            y_eq = ImageOps.equalize(y)

            # 合併回 YCbCr 並轉回 RGB
            img_ycbcr_eq = Image.merge('YCbCr', (y_eq, cb, cr))
            result = img_ycbcr_eq.convert('RGB')

        elif img.mode in ('L', 'P'):
            # 灰度或調色板圖像可以直接等化
            result = ImageOps.equalize(img)

        elif img.mode == 'LA':
            # 灰度 + Alpha
            l, alpha = img.split()
            l_eq = ImageOps.equalize(l)
            result = Image.merge('LA', (l_eq, alpha))

        else:
            # 其他模式先轉為 RGB 再處理
            rgb_img = img.convert('RGB')
            img_ycbcr = rgb_img.convert('YCbCr')
            y, cb, cr = img_ycbcr.split()
            y_eq = ImageOps.equalize(y)
            img_ycbcr_eq = Image.merge('YCbCr', (y_eq, cb, cr))
            result = img_ycbcr_eq.convert('RGB')

        print("✓ 直方圖等化完成")
        return result

    # ========== 24. 色溫調整 (Color Temperature) ==========
    def color_temperature(self, temperature: int = 6500) -> Image.Image:
        """
        調整色溫

        Args:
            temperature: 色溫值 (2000=暖色, 6500=日光, 10000=冷色)

        Returns:
            處理後的 Image 物件
        """
        img = self._ensure_image().convert('RGB')
        img_array = np.array(img, dtype=np.float32)

        # 簡化的色溫調整
        if temperature < 6500:
            # 暖色調 - 增加紅色，減少藍色
            factor = (6500 - temperature) / 4500
            img_array[:, :, 0] *= (1 + factor * 0.2)  # R
            img_array[:, :, 2] *= (1 - factor * 0.2)  # B
        else:
            # 冷色調 - 增加藍色，減少紅色
            factor = (temperature - 6500) / 3500
            img_array[:, :, 0] *= (1 - factor * 0.2)  # R
            img_array[:, :, 2] *= (1 + factor * 0.2)  # B

        img_array = np.clip(img_array, 0, 255).astype(np.uint8)
        result = Image.fromarray(img_array)

        print(f"✓ 色溫調整完成 ({temperature}K)")
        return result