"""Applica il logo ufficiale AncheCasa (file intatto) sulle scene.
Per ogni superficie: quad (4 angoli in senso orario da in alto a sinistra), variante del logo,
larghezza del logo come frazione della superficie, centro (u, v) in frazioni della superficie."""
import json, os, sys
import cv2
import numpy as np
from applica import carica_logo

R = 6  # sovracampionamento per bordi puliti


def lati(q):
    q = np.float32(q)
    w = (np.linalg.norm(q[1] - q[0]) + np.linalg.norm(q[2] - q[3])) / 2
    h = (np.linalg.norm(q[3] - q[0]) + np.linalg.norm(q[2] - q[1])) / 2
    return w, h


def cilindro(logo, forza):
    """Curva il logo come su un oggetto cilindrico (tazza, secchio): i bordi si stringono."""
    h, w = logo.shape[:2]
    xs = np.linspace(-1, 1, w)
    # posizione sorgente per ogni colonna di destinazione
    theta = np.arcsin(np.clip(xs, -1, 1))
    src = (np.sin(theta * (1 - forza * 0.0)) )
    # proiezione: x_dest = sin(phi), phi lineare sulla superficie
    phi = np.linspace(-forza, forza, w)
    dest = np.sin(phi) / np.sin(forza)
    mapx = np.interp(xs, dest, np.arange(w)).astype(np.float32)
    mapx = np.tile(mapx, (h, 1))
    mapy = np.tile(np.arange(h, dtype=np.float32)[:, None], (1, w))
    return cv2.remap(logo, mapx, mapy, cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))


def applica_superficie(img, spec, cartella_logo):
    logo = carica_logo(cartella_logo, spec.get("variante", "colore"))
    if spec.get("cilindro"):
        logo = cilindro(logo, spec["cilindro"])
    lh, lw = logo.shape[:2]
    quad = np.float32(spec["quad"])
    sw, sh = lati(quad)
    # rettangolo virtuale della superficie
    rect = np.float32([[0, 0], [sw, 0], [sw, sh], [0, sh]])
    Hs = cv2.getPerspectiveTransform(rect, quad)
    larg = spec.get("larghezza", 0.8) * sw
    alt = larg * lh / lw
    cu, cv_ = spec.get("centro", [0.5, 0.5])
    x0, y0 = cu * sw - larg / 2, cv_ * sh - alt / 2
    src = np.float32([[0, 0], [lw, 0], [lw, lh], [0, lh]])
    dst_rect = np.float32([[x0, y0], [x0 + larg, y0], [x0 + larg, y0 + alt], [x0, y0 + alt]])
    M = Hs @ cv2.getPerspectiveTransform(src, dst_rect)
    H, W = img.shape[:2]
    S = np.diag([R, R, 1.0]).astype(np.float64)
    big = cv2.warpPerspective(logo, S @ M, (W * R, H * R), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    war = cv2.resize(big, (W, H), interpolation=cv2.INTER_AREA)
    rgb = war[:, :, :3].astype(np.float32)
    a = war[:, :, 3].astype(np.float32) / 255.0
    # luce: luminanza della superficie sotto il logo rispetto al suo valore tipico
    lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    lum_s = cv2.GaussianBlur(lum, (0, 0), spec.get("morbidezza_luce", 6))
    mask = cv2.fillConvexPoly(np.zeros((H, W), np.uint8), quad.astype(np.int32), 1).astype(bool)
    ref = np.percentile(lum_s[mask], 70)
    shade = np.clip(lum_s / max(ref, 1), 0.5, 1.15)
    shade = 1 + (shade - 1) * spec.get("intensita_luce", 0.85)
    out = rgb * shade[:, :, None]
    # grana della foto
    grana = (lum - cv2.GaussianBlur(lum, (0, 0), 1.2))[:, :, None] * 0.5
    out = np.clip(out + grana, 0, 255)
    a = cv2.GaussianBlur(a, (0, 0), spec.get("sfocatura", 0.45)) * spec.get("opacita", 0.97)
    a3 = a[:, :, None]
    return (img.astype(np.float32) * (1 - a3) + out * a3).astype(np.uint8)


if __name__ == "__main__":
    lavori = json.load(open(sys.argv[1]))
    scene, cartella_logo, uscita = sys.argv[2], sys.argv[3], sys.argv[4]
    solo = sys.argv[5:] or None
    os.makedirs(uscita, exist_ok=True)
    for nome, superfici in lavori.items():
        if solo and nome not in solo:
            continue
        img = cv2.imread(os.path.join(scene, nome))
        for s in superfici:
            img = applica_superficie(img, s, cartella_logo)
        cv2.imwrite(os.path.join(uscita, nome), img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        print("fatto", nome)
