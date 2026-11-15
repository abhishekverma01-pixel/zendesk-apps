import zlib
import struct

def make_png(width, height, get_pixel_func):
    def chunk(chunk_type, data):
        c = chunk_type + data
        crc = struct.pack('>I', zlib.crc32(c) & 0xffffffff)
        return struct.pack('>I', len(data)) + c + crc

    header = b'\x89PNG\r\n\x1a\n'
    ihdr = chunk(b'IHDR', struct.pack('>IIBBBBB', width, height, 8, 6, 0, 0, 0)) # RGBA
    
    raw_data = bytearray()
    for y in range(height):
        raw_data.append(0) # Filter type 0
        for x in range(width):
            r, g, b, a = get_pixel_func(x, y, width, height)
            raw_data.extend([r, g, b, a])
            
    idat = chunk(b'IDAT', zlib.compress(bytes(raw_data), 9))
    iend = chunk(b'IEND', b'')
    return header + ihdr + idat + iend

def draw_view_icon(x, y, w, h):
    # Rounded rectangle background in Zendesk Kale (#17494D = 23, 73, 77)
    # White view/list icon in center
    pad = int(w * 0.08)
    radius = int(w * 0.22)
    
    # Check if inside rounded rectangle
    cx = min(max(x, pad + radius), w - pad - radius - 1)
    cy = min(max(y, pad + radius), h - pad - radius - 1)
    dist_sq = (x - cx)**2 + (y - cy)**2
    
    if dist_sq > (radius)**2 or x < pad or x >= w - pad or y < pad or y >= h - pad:
        return (0, 0, 0, 0)
    
    # Background color: Zendesk Kale gradient or solid #17494D
    bg_r, bg_g, bg_b = 23, 73, 77
    
    # View icon: Eye or List with lines
    # Let's draw a neat "list with card/lines" or "view" icon
    nx = (x - pad) / (w - 2 * pad)
    ny = (y - pad) / (h - 2 * pad)
    
    # Draw a 3-bar list / views icon
    # Left dots + right bars
    is_icon = False
    
    # Dot 1, 2, 3
    for i, row_y in enumerate([0.32, 0.50, 0.68]):
        # Dot
        if (nx - 0.28)**2 + (ny - row_y)**2 < (0.045)**2:
            is_icon = True
        # Bar
        if 0.38 <= nx <= 0.76 and (row_y - 0.035) <= ny <= (row_y + 0.035):
            is_icon = True
            
    if is_icon:
        return (255, 255, 255, 255)
        
    return (bg_r, bg_g, bg_b, 255)

with open('/Users/abhishekverma/.gemini/antigravity/scratch/zendesk-view-descriptions-app/assets/logo.png', 'wb') as f:
    f.write(make_png(128, 128, draw_view_icon))

with open('/Users/abhishekverma/.gemini/antigravity/scratch/zendesk-view-descriptions-app/assets/logo-small.png', 'wb') as f:
    f.write(make_png(32, 32, draw_view_icon))

print("Icons generated successfully!")
