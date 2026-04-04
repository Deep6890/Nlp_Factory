import struct, zlib, os

def make_png(w, h, pixels):
    def chunk(name, data):
        c = zlib.crc32(name + data) & 0xffffffff
        return struct.pack('>I', len(data)) + name + data + struct.pack('>I', c)
    raw = b''
    for row in pixels:
        raw += b'\x00' + bytes(row)
    compressed = zlib.compress(raw, 9)
    ihdr = struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
    return b'\x89PNG\r\n\x1a\n' + chunk(b'IHDR', ihdr) + chunk(b'IDAT', compressed) + chunk(b'IEND', b'')

size = 1024
cx, cy = size // 2, size // 2
pixels = []

for y in range(size):
    row = []
    for x in range(size):
        dx, dy = x - cx, y - cy
        nx, ny = dx / (size * 0.44), dy / (size * 0.44)

        # Background: dark green
        r, g, b = 0x3D, 0x5A, 0x3E

        # Shield shape: rounded top, pointed bottom
        in_shield = False
        if ny < -0.25 and abs(nx) < 1.0:
            in_shield = True
        elif -0.25 <= ny < 0.75 and abs(nx) < (1.0 - (ny + 0.25) / 1.0):
            in_shield = True

        if in_shield:
            r, g, b = 0x4A, 0x6E, 0x4B

        # Letter "A" in cream
        lx, ly = dx / (size * 0.30), dy / (size * 0.30)
        # Left stroke
        if -0.12 < (lx + ly * 0.58 + 0.58) < 0.12 and -0.85 < ly < 0.55:
            r, g, b = 0xF5, 0xF0, 0xE8
        # Right stroke
        if -0.12 < (lx - ly * 0.58 - 0.58) < 0.12 and -0.85 < ly < 0.55:
            r, g, b = 0xF5, 0xF0, 0xE8
        # Crossbar
        if -0.50 < lx < 0.50 and -0.10 < ly < 0.10:
            r, g, b = 0xF5, 0xF0, 0xE8

        row.extend([r, g, b])
    pixels.append(row)

os.makedirs('assets', exist_ok=True)
data = make_png(size, size, pixels)
with open('assets/icon.png', 'wb') as f:
    f.write(data)
with open('assets/icon_fg.png', 'wb') as f:
    f.write(data)
print('Icons generated successfully')
