"""
Build-time asset generator for Lokhi.
Pure Python stdlib only (no network / no PIL available in this environment).
Renders the fairy-godmother mark as flat polygon/circle/star shapes onto a
high-res master canvas, then box-downsamples to each target icon size.
Run: python3 scripts/gen_assets.py
"""
import struct
import zlib
import os

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ICONS_DIR = os.path.join(ROOT, "icons")
SPLASH_DIR = os.path.join(ICONS_DIR, "splash")

# ---------------------------------------------------------------------------
# PNG writer
# ---------------------------------------------------------------------------

def write_png(path, width, height, pixels, has_alpha=True):
    """pixels: flat list/bytes of RGBA bytes (always RGBA in memory);
    if has_alpha is False, the alpha channel is dropped before encoding
    (color type 2 / truecolor, no alpha) so the file is fully opaque."""
    channels = 4 if has_alpha else 3
    color_type = 6 if has_alpha else 2

    raw = bytearray()
    stride = width * 4
    for y in range(height):
        raw.append(0)  # filter type: none
        row = pixels[y * stride:(y + 1) * stride]
        if has_alpha:
            raw.extend(row)
        else:
            for x in range(width):
                raw.extend(row[x * 4:x * 4 + 3])

    def chunk(tag, data):
        c = tag + data
        return struct.pack(">I", len(data)) + c + struct.pack(">I", zlib.crc32(c) & 0xffffffff)

    sig = b"\x89PNG\r\n\x1a\n"
    ihdr = struct.pack(">IIBBBBB", width, height, 8, color_type, 0, 0, 0)
    idat = zlib.compress(bytes(raw), 9)

    with open(path, "wb") as f:
        f.write(sig)
        f.write(chunk(b"IHDR", ihdr))
        f.write(chunk(b"IDAT", idat))
        f.write(chunk(b"IEND", b""))
    print("wrote", path, f"{width}x{height}", "alpha" if has_alpha else "opaque")


# ---------------------------------------------------------------------------
# Rasterizer (pixel-center point tests over a shape's bounding box)
# ---------------------------------------------------------------------------

def new_canvas(size, bg_rgba):
    px = bytearray(size * size * 4)
    r, g, b, a = bg_rgba
    px[0::4] = bytes([r]) * (size * size)
    px[1::4] = bytes([g]) * (size * size)
    px[2::4] = bytes([b]) * (size * size)
    px[3::4] = bytes([a]) * (size * size)
    return px


def set_px(px, size, x, y, rgba):
    if x < 0 or y < 0 or x >= size or y >= size:
        return
    i = (y * size + x) * 4
    px[i], px[i + 1], px[i + 2], px[i + 3] = rgba


def point_in_polygon(px_, py_, poly):
    n = len(poly)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > py_) != (yj > py_)) and (px_ < (xj - xi) * (py_ - yi) / (yj - yi + 1e-12) + xi):
            inside = not inside
        j = i
    return inside


def fill_polygon(px, size, poly, rgba):
    xs = [p[0] for p in poly]
    ys = [p[1] for p in poly]
    x0, x1 = max(0, int(min(xs))), min(size - 1, int(max(xs)) + 1)
    y0, y1 = max(0, int(min(ys))), min(size - 1, int(max(ys)) + 1)
    for y in range(y0, y1 + 1):
        cy = y + 0.5
        for x in range(x0, x1 + 1):
            cx = x + 0.5
            if point_in_polygon(cx, cy, poly):
                set_px(px, size, x, y, rgba)


def fill_circle(px, size, cx, cy, r, rgba):
    x0, x1 = max(0, int(cx - r)), min(size - 1, int(cx + r) + 1)
    y0, y1 = max(0, int(cy - r)), min(size - 1, int(cy + r) + 1)
    r2 = r * r
    for y in range(y0, y1 + 1):
        dy = (y + 0.5) - cy
        for x in range(x0, x1 + 1):
            dx = (x + 0.5) - cx
            if dx * dx + dy * dy <= r2:
                set_px(px, size, x, y, rgba)


def stroke_line(px, size, x0, y0, x1, y1, width, rgba):
    steps = int(max(abs(x1 - x0), abs(y1 - y0)) * 2) + 1
    for i in range(steps + 1):
        t = i / steps
        cx = x0 + (x1 - x0) * t
        cy = y0 + (y1 - y0) * t
        fill_circle(px, size, cx, cy, width / 2, rgba)


def star_points(cx, cy, r, inner_ratio=0.42, points=4, rot=0.0):
    import math
    pts = []
    n = points * 2
    for i in range(n):
        ang = rot + (math.pi * 2 * i) / n
        rad = r if i % 2 == 0 else r * inner_ratio
        pts.append((cx + rad * math.sin(ang), cy - rad * math.cos(ang)))
    return pts


def downsample(src, src_size, dst_size):
    """Box-filter average downsample, src_size must be a multiple-ish of dst_size."""
    dst = bytearray(dst_size * dst_size * 4)
    for dy in range(dst_size):
        sy0 = int(dy * src_size / dst_size)
        sy1 = max(sy0 + 1, int((dy + 1) * src_size / dst_size))
        for dx in range(dst_size):
            sx0 = int(dx * src_size / dst_size)
            sx1 = max(sx0 + 1, int((dx + 1) * src_size / dst_size))
            rs = gs = bs = as_ = 0
            count = 0
            for sy in range(sy0, sy1):
                row_base = sy * src_size * 4
                for sx in range(sx0, sx1):
                    i = row_base + sx * 4
                    rs += src[i]; gs += src[i + 1]; bs += src[i + 2]; as_ += src[i + 3]
                    count += 1
            i = (dy * dst_size + dx) * 4
            dst[i] = rs // count
            dst[i + 1] = gs // count
            dst[i + 2] = bs // count
            dst[i + 3] = as_ // count
    return dst


# ---------------------------------------------------------------------------
# Fairy godmother mark — defined in a 0..100 viewBox, 3 shapes.
# ---------------------------------------------------------------------------

BEIGE = (0xFA, 0xFA, 0xFA, 255)
CREAM = (0xFA, 0xFA, 0xFA, 255)
BLUE = (0x2E, 0x5C, 0x8A, 255)
GOLD = (0xD8, 0xA8, 0x3E, 255)

CLOAK_POLY = [
    (50, 10),
    (58, 18), (64, 28), (70, 42), (75, 58), (79, 74), (82, 90),
    (18, 90), (21, 74), (25, 58), (30, 42), (36, 28), (42, 18),
]
FACE_CENTER = (50, 32)
FACE_R = 11
STAR_CENTER = (67, 19)
STAR_R = 8


def draw_mark(px, size, scale, ox, oy, cloak_rgba, face_rgba, star_rgba):
    def tx(pt):
        return (ox + pt[0] * scale, oy + pt[1] * scale)

    fill_polygon(px, size, [tx(p) for p in CLOAK_POLY], cloak_rgba)
    fc = tx(FACE_CENTER)
    fill_circle(px, size, fc[0], fc[1], FACE_R * scale, face_rgba)
    sc = tx(STAR_CENTER)
    fill_polygon(px, size, star_points(sc[0], sc[1], STAR_R * scale), star_rgba)


def render_icon_master(master_size, bg_rgba, cloak_rgba, face_rgba, star_rgba, fit=0.70):
    """Mark's natural bbox spans ~70 viewBox units within a 100-unit box,
    so scale=master_size/100 places it at ~70% width; `fit` scales further."""
    px = new_canvas(master_size, bg_rgba)
    base_scale = master_size / 100.0
    scale = base_scale * (fit / 0.70)
    # keep mark centered on (50,50) regardless of scale
    ox = master_size / 2 - 50 * scale
    oy = master_size / 2 - 50 * scale
    draw_mark(px, master_size, scale, ox, oy, cloak_rgba, face_rgba, star_rgba)
    return px


def make_icon_set(master_size=1024):
    regular_sizes = {"icon-512.png": 512, "icon-192.png": 192}
    maskable_sizes = {"icon-512-maskable.png": 512, "icon-192-maskable.png": 192}
    opaque_sizes = {"apple-touch-icon-180.png": 180, "favicon-32.png": 32, "favicon-16.png": 16}

    regular_master = render_icon_master(master_size, BEIGE, BLUE, CREAM, GOLD, fit=0.70)
    maskable_master = render_icon_master(master_size, BLUE, CREAM, BLUE, GOLD, fit=0.66)

    for name, sz in regular_sizes.items():
        write_png(os.path.join(ICONS_DIR, name), sz, sz, downsample(regular_master, master_size, sz), has_alpha=True)

    for name, sz in maskable_sizes.items():
        write_png(os.path.join(ICONS_DIR, name), sz, sz, downsample(maskable_master, master_size, sz), has_alpha=True)

    for name, sz in opaque_sizes.items():
        write_png(os.path.join(ICONS_DIR, name), sz, sz, downsample(regular_master, master_size, sz), has_alpha=False)


def make_splash_screens(master_size=1024):
    os.makedirs(SPLASH_DIR, exist_ok=True)
    sizes = [
        (750, 1334), (828, 1792), (1125, 2436), (1242, 2688),
        (1170, 2532), (1284, 2778), (1179, 2556), (1290, 2796),
        (1206, 2622), (1320, 2868),
    ]
    mark_master = render_icon_master(master_size, BEIGE, BLUE, CREAM, GOLD, fit=0.70)
    for w, h in sizes:
        canvas = bytearray(w * h * 4)
        canvas[0::4] = bytes([BEIGE[0]]) * (w * h)
        canvas[1::4] = bytes([BEIGE[1]]) * (w * h)
        canvas[2::4] = bytes([BEIGE[2]]) * (w * h)
        canvas[3::4] = bytes([255]) * (w * h)
        mark_size = int(min(w, h) * 0.30)
        mark_small = downsample(mark_master, master_size, mark_size)
        ox = (w - mark_size) // 2
        oy = (h - mark_size) // 2
        for y in range(mark_size):
            for x in range(mark_size):
                si = (y * mark_size + x) * 4
                dxp, dyp = ox + x, oy + y
                if 0 <= dxp < w and 0 <= dyp < h:
                    di = (dyp * w + dxp) * 4
                    sa = mark_small[si + 3]
                    if sa == 255:
                        canvas[di:di + 4] = mark_small[si:si + 4]
                    elif sa > 0:
                        for c in range(3):
                            bgv = canvas[di + c]
                            fgv = mark_small[si + c]
                            canvas[di + c] = (fgv * sa + bgv * (255 - sa)) // 255
        write_png(os.path.join(SPLASH_DIR, f"splash-{w}x{h}.png"), w, h, canvas, has_alpha=False)


if __name__ == "__main__":
    os.makedirs(ICONS_DIR, exist_ok=True)
    make_icon_set()
    make_splash_screens()
    print("done")
