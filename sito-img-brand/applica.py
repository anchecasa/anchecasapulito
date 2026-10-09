"""Applica il logo ufficiale AncheCasa (file intatto) su una superficie di una foto, in prospettiva,
con la luce della superficie. Uso: python applica.py lavori.json cartella_foto cartella_logo uscita"""
import json, sys, os
import cv2
import numpy as np

LOGHI = {
    "colore": "anchecasa-payoff-colore-2400px.png",
    "bianco": "anchecasa-payoff-bianco-2400px.png",
    "negativo": "anchecasa-payoff-negativo-2400px.png",
}


def carica_logo(cartella, variante):
    lg = cv2.imread(os.path.join(cartella, LOGHI[variante]), cv2.IMREAD_UNCHANGED)
    # ritaglia al contenuto (solo margini trasparenti, il disegno non cambia)
    a = lg[:, :, 3]
    ys, xs = np.where(a > 0)
    return lg[ys.min():ys.max() + 1, xs.min():xs.max() + 1]


def applica(img, logo, quad, luce=1.0, morbido=0.6, opacita=0.96):
    h, w = logo.shape[:2]
    src = np.float32([[0, 0], [w, 0], [w, h], [0, h]])
    dst = np.float32(quad)
    M = cv2.getPerspectiveTransform(src, dst)
    H, W = img.shape[:2]
    warped = cv2.warpPerspective(logo, M, (W, H), flags=cv2.INTER_AREA, borderMode=cv2.BORDER_CONSTANT, borderValue=(0, 0, 0, 0))
    rgb = warped[:, :, :3].astype(np.float32)
    a = warped[:, :, 3].astype(np.float32) / 255.0
    if morbido > 0:
        a = cv2.GaussianBlur(a, (0, 0), morbido)
        rgb = cv2.GaussianBlur(rgb, (0, 0), morbido * 0.6)
    base = img.astype(np.float32)
    # luce della superficie: luminanza locale della foto rispetto alla media sotto il logo
    lum = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY).astype(np.float32)
    lum_s = cv2.GaussianBlur(lum, (0, 0), 3)
    mask = a > 0.3
    ref = np.percentile(lum_s[mask], 75) if mask.any() else 255
    shade = np.clip(lum_s / max(ref, 1), 0.55, 1.12) * luce
    out_rgb = np.clip(rgb * shade[:, :, None], 0, 255)
    # un po' della grana della foto sopra la stampa
    grana = (lum - lum_s)[:, :, None] * 0.6
    out_rgb = np.clip(out_rgb + grana, 0, 255)
    a3 = (a * opacita)[:, :, None]
    return (base * (1 - a3) + out_rgb * a3).astype(np.uint8)


if __name__ == "__main__":
    lavori = json.load(open(sys.argv[1]))
    foto, cartella_logo, uscita = sys.argv[2], sys.argv[3], sys.argv[4]
    os.makedirs(uscita, exist_ok=True)
    for nome, lista in lavori.items():
        img = cv2.imread(os.path.join(foto, nome))
        for l in lista:
            logo = carica_logo(cartella_logo, l.get("variante", "colore"))
            img = applica(img, logo, l["quad"], l.get("luce", 1.0), l.get("morbido", 0.6), l.get("opacita", 0.96))
        cv2.imwrite(os.path.join(uscita, nome), img, [cv2.IMWRITE_JPEG_QUALITY, 90])
        print("fatto", nome)
