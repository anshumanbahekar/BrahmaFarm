"""Generate app icons from the BrahmaFarm leaf mark. Requires Pillow."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SIZE = 1024
image = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
draw = ImageDraw.Draw(image)
draw.rounded_rectangle((0, 0, SIZE - 1, SIZE - 1), radius=220, fill="#276b4b")
scale = SIZE / 128

def poly(points, fill):
    draw.polygon([(round(x * scale), round(y * scale)) for x, y in points], fill=fill)

poly([(62, 105), (58, 87), (60, 71), (68, 54), (80, 39), (99, 20),
      (98, 44), (93, 65), (83, 86), (62, 105)], "#bde2b6")
poly([(58, 88), (44, 82), (35, 73), (29, 61), (26, 45), (28, 32),
      (43, 40), (53, 52), (59, 68), (58, 88)], "#d2edcb")
draw.line([(round(x * scale), round(y * scale)) for x, y in [(62, 108), (61, 86), (64, 67), (69, 49), (78, 33)]], fill="#f0f8e9", width=round(5 * scale), joint="curve")

assets = ROOT / "ios" / "BrahmaSpreadsheet" / "Assets.xcassets" / "AppIcon.appiconset"
assets.mkdir(parents=True, exist_ok=True)
image.convert("RGB").save(assets / "AppIcon.png")
image.save(ROOT / "windows" / "app.ico", format="ICO", sizes=[(16,16),(32,32),(48,48),(64,64),(128,128),(256,256)])
