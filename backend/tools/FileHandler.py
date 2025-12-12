"""
檔案處理模組 - 負責圖片檔案的讀取、儲存、列印等操作
"""

import os
from PIL import Image
from typing import Optional, Tuple
import subprocess
import sys


class FileHandler:
    """檔案處理類別"""

    def __init__(self):
        self.current_image: Optional[Image.Image] = None
        self.file_path: Optional[str] = None
        self.original_format: Optional[str] = None

    def load_file(self, file_path: str) -> Image.Image:
        """
        載入圖片檔案

        Args:
            file_path: 圖片檔案路徑

        Returns:
            PIL Image 物件
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"找不到檔案: {file_path}")

        try:
            self.current_image = Image.open(file_path)
            self.file_path = file_path
            self.original_format = self.current_image.format
            print(f"✓ 成功載入圖片: {file_path}")
            print(f"  格式: {self.original_format}")
            print(f"  尺寸: {self.current_image.size[0]} x {self.current_image.size[1]}")
            print(f"  色彩模式: {self.current_image.mode}")
            return self.current_image
        except Exception as e:
            raise IOError(f"無法載入圖片: {e}")

    def save_as(self, output_path: str, image: Optional[Image.Image] = None,
                format: Optional[str] = None, quality: int = 95) -> str:
        """
        另存圖片檔案

        Args:
            output_path: 輸出檔案路徑
            image: 要儲存的圖片（若為 None 則使用目前載入的圖片）
            format: 輸出格式（若為 None 則自動偵測）
            quality: JPEG 品質 (1-100)

        Returns:
            儲存的檔案路徑
        """
        img = image if image is not None else self.current_image

        if img is None:
            raise ValueError("沒有可儲存的圖片，請先載入圖片")

        # 確保目錄存在
        output_dir = os.path.dirname(output_path)
        if output_dir and not os.path.exists(output_dir):
            os.makedirs(output_dir)

        # 處理 RGBA 轉 JPEG 的情況
        save_img = img
        ext = os.path.splitext(output_path)[1].lower()
        if ext in ['.jpg', '.jpeg'] and img.mode == 'RGBA':
            # 將透明背景轉為白色
            background = Image.new('RGB', img.size, (255, 255, 255))
            background.paste(img, mask=img.split()[3])
            save_img = background

        try:
            save_kwargs = {}
            if ext in ['.jpg', '.jpeg']:
                save_kwargs['quality'] = quality
            if format:
                save_kwargs['format'] = format

            save_img.save(output_path, **save_kwargs)
            print(f"✓ 圖片已儲存至: {output_path}")
            return output_path
        except Exception as e:
            raise IOError(f"無法儲存圖片: {e}")

    def with_open(self, file_path: str) -> Image.Image:
        """
        使用 context manager 方式開啟圖片（用於暫時讀取）

        Args:
            file_path: 圖片檔案路徑

        Returns:
            PIL Image 物件
        """
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"找不到檔案: {file_path}")

        with Image.open(file_path) as img:
            # 複製一份以便在 context 結束後仍可使用
            return img.copy()

    def print_file(self, image: Optional[Image.Image] = None,
                   printer_name: Optional[str] = None) -> bool:
        """
        列印圖片（需要系統支援）

        Args:
            image: 要列印的圖片
            printer_name: 印表機名稱

        Returns:
            是否成功送出列印
        """
        img = image if image is not None else self.current_image

        if img is None:
            raise ValueError("沒有可列印的圖片")

        # 建立暫存檔案
        temp_path = "/tmp/print_temp.png"
        img.save(temp_path)

        try:
            if sys.platform == 'win32':
                # Windows
                os.startfile(temp_path, "print")
            elif sys.platform == 'darwin':
                # macOS
                subprocess.run(['lpr', temp_path], check=True)
            else:
                # Linux
                if printer_name:
                    subprocess.run(['lpr', '-P', printer_name, temp_path], check=True)
                else:
                    subprocess.run(['lpr', temp_path], check=True)

            print("✓ 已送出列印工作")
            return True
        except Exception as e:
            print(f"✗ 列印失敗: {e}")
            return False

    def get_file_info(self) -> dict:
        """
        取得目前檔案資訊

        Returns:
            檔案資訊字典
        """
        if self.current_image is None:
            return {"status": "尚未載入圖片"}

        info = {
            "file_path": self.file_path,
            "format": self.original_format,
            "size": self.current_image.size,
            "width": self.current_image.size[0],
            "height": self.current_image.size[1],
            "mode": self.current_image.mode,
        }

        # 取得檔案大小
        if self.file_path and os.path.exists(self.file_path):
            info["file_size"] = os.path.getsize(self.file_path)
            info["file_size_str"] = self._format_size(info["file_size"])

        return info

    def _format_size(self, size_bytes: int) -> str:
        """格式化檔案大小"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024:
                return f"{size_bytes:.2f} {unit}"
            size_bytes /= 1024
        return f"{size_bytes:.2f} TB"

    def batch_load(self, folder_path: str, extensions: Tuple[str, ...] =
    ('.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp')) -> list:
        """
        批次載入資料夾中的圖片

        Args:
            folder_path: 資料夾路徑
            extensions: 要載入的副檔名

        Returns:
            圖片檔案路徑清單
        """
        if not os.path.isdir(folder_path):
            raise NotADirectoryError(f"不是有效的資料夾: {folder_path}")

        files = []
        for f in os.listdir(folder_path):
            if f.lower().endswith(extensions):
                files.append(os.path.join(folder_path, f))

        print(f"✓ 找到 {len(files)} 個圖片檔案")
        return sorted(files)