#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Sistema de Geração e Correção de Provas (SGP Católica SC / Correge)
Motor Real em Python + OpenCV para Leitura de QR Code e Reconhecimento Óptico de Marcações (OMR).
Compatível com fotos tiradas pela câmera nativa do smartphone (com sombras, inclinação ou close-up)
e com todos os contratos de C:\\Users\\davi3\\back-end.
Sem dados simulados: retorna exclusivamente o que foi detectado opticamente na imagem.
"""

import sys
import os
import json
import base64
import re
from typing import Dict, Any, Optional, Tuple, List

for _pkg_candidate in [
    r"C:\Users\davi3\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages",
    os.path.expanduser(
        r"~\AppData\Local\Packages\PythonSoftwareFoundation.Python.3.13_qbz5n2kfra8p0\LocalCache\local-packages\Python313\site-packages"
    ),
]:
    if _pkg_candidate not in sys.path:
        sys.path.insert(0, _pkg_candidate)

import cv2
import numpy as np

LETTERS = ["A", "B", "C", "D", "E"]
VERSION_LETTERS = ["A", "B", "C", "D"]


def decode_base64_image(image_base64: str) -> Optional[np.ndarray]:
    if not image_base64:
        return None
    try:
        if "," in image_base64:
            image_base64 = image_base64.split(",", 1)[1]
        img_bytes = base64.b64decode(image_base64)
        np_arr = np.frombuffer(img_bytes, np.uint8)
        img = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None


def parse_qr_payload(raw_text: str) -> Dict[str, Any]:
    raw_text = (raw_text or "").strip()
    if not raw_text:
        return {}

    try:
        parsed = json.loads(raw_text)
        if isinstance(parsed, dict):
            key_str = str(parsed.get("k") or "").upper().strip()
            embedded_key: Dict[str, str] = {}
            for idx, ch in enumerate(key_str):
                if ch in LETTERS:
                    embedded_key[str(idx + 1)] = ch

            if isinstance(parsed.get("answerKey"), dict):
                for k, v in parsed["answerKey"].items():
                    v_up = str(v).upper().strip()
                    if v_up in LETTERS:
                        embedded_key[str(k)] = v_up

            raw_ver = str(
                parsed.get("ver")
                or parsed.get("versionLetter")
                or parsed.get("version")
                or parsed.get("vId")
                or "A"
            ).upper()
            clean_ver = (
                raw_ver.replace("VERSION-", "")
                .replace("VER-", "")
                .replace("CADERNO", "")
                .strip()
            )
            if len(clean_ver) != 1 or not clean_ver.isalpha():
                clean_ver = "A"

            reg = (
                parsed.get("reg")
                or parsed.get("std")
                or parsed.get("registration")
                or parsed.get("studentRegistration")
            )
            std_id = parsed.get("stdId") or parsed.get("studentId")
            nominal = parsed.get("nominal")
            if nominal is None:
                nominal = bool(reg and str(reg).upper() != "ANON")

            return {
                "raw": raw_text,
                "app": parsed.get("app") or parsed.get("appId") or "CORREGE",
                "examId": parsed.get("examId") or parsed.get("idProva"),
                "examCode": (
                    parsed.get("code")
                    or parsed.get("exam")
                    or parsed.get("examCode")
                ),
                "versionId": parsed.get("vId") or parsed.get("idVersaoProva"),
                "versionLetter": clean_ver,
                "nominal": bool(nominal),
                "studentId": std_id if std_id != "ANON" else None,
                "studentRegistration": reg if reg != "ANON" else None,
                "totalQuestions": int(
                    parsed.get("q")
                    or parsed.get("totalQuestions")
                    or len(embedded_key)
                    or 0
                ),
                "pages": parsed.get("pages") or parsed.get("pg"),
                "checksum": parsed.get("chk"),
                "embeddedAnswerKey": embedded_key,
            }
    except Exception:
        pass

    ver_match = re.search(
        r"(?:V|VER|VERSION|CADERNO)\s*[=:-]?\s*([A-E])\b", raw_text, re.IGNORECASE
    )
    if ver_match:
        return {
            "raw": raw_text,
            "app": "CORREGE",
            "versionLetter": ver_match.group(1).upper(),
            "nominal": True,
        }

    return {"raw": raw_text}


def detect_qr_code(img: np.ndarray) -> Tuple[Optional[str], Dict[str, Any]]:
    detector = cv2.QRCodeDetector()
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    _, otsu = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)

    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    enhanced = clahe.apply(gray)

    candidates = [
        gray,
        enhanced,
        otsu,
        img,
        cv2.adaptiveThreshold(
            gray, 255, cv2.ADAPTIVE_THRESH_GAUSSIAN_C, cv2.THRESH_BINARY, 51, 10
        ),
    ]

    h, w = gray.shape[:2]
    if h > 200 and w > 200:
        top_right = gray[0 : int(h * 0.55), int(w * 0.35) : w]
        center_crop = gray[int(h * 0.15) : int(h * 0.85), int(w * 0.15) : int(w * 0.85)]
        candidates.insert(1, top_right)
        candidates.insert(2, center_crop)
        candidates.append(
            cv2.resize(top_right, None, fx=1.6, fy=1.6, interpolation=cv2.INTER_CUBIC)
        )
        candidates.append(
            cv2.resize(gray, None, fx=0.6, fy=0.6, interpolation=cv2.INTER_AREA)
        )

    for candidate in candidates:
        try:
            data, _, _ = detector.detectAndDecode(candidate)
            if data and data.strip():
                clean = data.strip()
                return clean, parse_qr_payload(clean)
        except Exception:
            continue

    return None, {}


def order_corner_points(pts: np.ndarray) -> np.ndarray:
    rect = np.zeros((4, 2), dtype="float32")
    s = pts.sum(axis=1)
    rect[0] = pts[np.argmin(s)]
    rect[2] = pts[np.argmax(s)]

    diff = np.diff(pts, axis=1)
    rect[1] = pts[np.argmin(diff)]
    rect[3] = pts[np.argmax(diff)]
    return rect


def normalize_sheet_image(img: np.ndarray) -> Tuple[np.ndarray, bool]:
    h0, w0 = img.shape[:2]
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)
    edged = cv2.Canny(blurred, 50, 150)

    contours, _ = cv2.findContours(
        edged.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
    )
    contours = sorted(contours, key=cv2.contourArea, reverse=True)[:5]
    img_area = h0 * w0

    for c in contours:
        area = cv2.contourArea(c)
        if area < img_area * 0.45:
            continue
        peri = cv2.arcLength(c, True)
        approx = cv2.approxPolyDP(c, 0.02 * peri, True)
        if len(approx) == 4:
            pts = approx.reshape(4, 2).astype("float32")
            rect = order_corner_points(pts)
            w_top = np.linalg.norm(rect[1] - rect[0])
            h_left = np.linalg.norm(rect[3] - rect[0])
            if h_left > w_top * 0.8:
                target_w, target_h = 1000, 1414
            else:
                target_w, target_h = 1414, 1000
            dst = np.array(
                [
                    [0, 0],
                    [target_w - 1, 0],
                    [target_w - 1, target_h - 1],
                    [0, target_h - 1],
                ],
                dtype="float32",
            )
            M = cv2.getPerspectiveTransform(rect, dst)
            return cv2.warpPerspective(img, M, (target_w, target_h)), True

    max_dim = 1400
    scale = max_dim / float(max(h0, w0))
    new_w = max(400, int(round(w0 * scale)))
    new_h = max(400, int(round(h0 * scale)))
    resized = cv2.resize(img, (new_w, new_h), interpolation=cv2.INTER_CUBIC)
    return resized, False


def compute_ink_maps(img: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
    norm_gray = clahe.apply(gray)

    bg = cv2.GaussianBlur(norm_gray, (81, 81), 0)
    ink_diff = cv2.subtract(bg, norm_gray)

    _, ink_binary = cv2.threshold(ink_diff, 20, 255, cv2.THRESH_BINARY)
    return ink_diff, ink_binary


def measure_bubble_darkness(
    ink_diff: np.ndarray, ink_binary: np.ndarray, cx: float, cy: float, radius: float
) -> float:
    h, w = ink_diff.shape[:2]
    r = max(5, int(round(radius * 0.82)))
    ix, iy = int(round(cx)), int(round(cy))

    y1, y2 = max(0, iy - r), min(h, iy + r)
    x1, x2 = max(0, ix - r), min(w, ix + r)

    roi_diff = ink_diff[y1:y2, x1:x2]
    roi_bin = ink_binary[y1:y2, x1:x2]
    if roi_diff.size == 0:
        return 0.0

    mask = np.zeros(roi_diff.shape, dtype="uint8")
    cv2.circle(mask, (roi_diff.shape[1] // 2, roi_diff.shape[0] // 2), r, 255, -1)
    mask_pixels = max(1, cv2.countNonZero(mask))

    bin_masked = cv2.bitwise_and(roi_bin, roi_bin, mask=mask)
    fill_ratio = cv2.countNonZero(bin_masked) / float(mask_pixels)

    mean_val = cv2.mean(roi_diff, mask=mask)[0] / 110.0
    return float(0.60 * fill_ratio + 0.40 * min(1.0, mean_val))


def extract_5_slots_from_cluster(
    cluster: List[Tuple[float, float, float]]
) -> Optional[List[Tuple[float, float, float]]]:
    cluster = sorted(cluster, key=lambda c: c[0])
    n = len(cluster)
    if n < 3:
        return None

    avg_r = float(np.median([c[2] for c in cluster]))
    avg_y = float(np.median([c[1] for c in cluster]))

    if n == 5:
        diffs = [cluster[i + 1][0] - cluster[i][0] for i in range(4)]
        med_dx = float(np.median(diffs))
        if med_dx >= avg_r * 1.4 and max(diffs) <= med_dx * 1.65:
            return cluster

    if n >= 6:
        tail = cluster[-5:]
        diffs = [tail[i + 1][0] - tail[i][0] for i in range(4)]
        med_dx = float(np.median(diffs))
        if med_dx >= avg_r * 1.4 and max(diffs) <= med_dx * 1.65:
            return tail

    raw_diffs = [cluster[i + 1][0] - cluster[i][0] for i in range(n - 1)]
    valid_steps = [d for d in raw_diffs if avg_r * 1.5 <= d <= avg_r * 4.5]
    if not valid_steps:
        half_steps = [
            d / 2.0 for d in raw_diffs if avg_r * 3.0 <= d <= avg_r * 8.5
        ]
        if not half_steps:
            return None
        step_x = float(np.median(half_steps))
    else:
        step_x = float(np.median(valid_steps))

    span = cluster[-1][0] - cluster[0][0]
    approx_slots = int(round(span / max(1.0, step_x))) + 1

    if approx_slots == 5:
        x0 = cluster[0][0]
        return [(x0 + i * step_x, avg_y, avg_r) for i in range(5)]

    return None


def find_bubble_candidates(img: np.ndarray) -> List[Tuple[float, float, float]]:
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (5, 5), 0)

    h, w = gray.shape[:2]
    min_dim = max(10, int(min(h, w) * 0.011))
    max_dim = max(45, int(min(h, w) * 0.068))

    raw_circles: List[Tuple[float, float, float]] = []

    for block_sz, c_val in [(27, 8), (45, 10)]:
        thresh = cv2.adaptiveThreshold(
            blurred,
            255,
            cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
            cv2.THRESH_BINARY_INV,
            block_sz,
            c_val,
        )
        contours, _ = cv2.findContours(
            thresh, cv2.RETR_LIST, cv2.CHAIN_APPROX_SIMPLE
        )
        for c in contours:
            x, y, cw, ch = cv2.boundingRect(c)
            if cw < min_dim or cw > max_dim or ch < min_dim or ch > max_dim:
                continue
            aspect = cw / float(max(1, ch))
            if aspect < 0.62 or aspect > 1.55:
                continue
            area = cv2.contourArea(c)
            peri = cv2.arcLength(c, True)
            if peri <= 0:
                continue
            circularity = 4.0 * np.pi * (area / (peri * peri))
            if circularity < 0.36:
                continue
            cx = x + cw / 2.0
            cy = y + ch / 2.0
            r = (cw + ch) / 4.0
            raw_circles.append((cx, cy, r))

    try:
        hough = cv2.HoughCircles(
            blurred,
            cv2.HOUGH_GRADIENT,
            dp=1.2,
            minDist=max(10, int(min_dim * 1.1)),
            param1=60,
            param2=22,
            minRadius=max(6, min_dim // 2),
            maxRadius=max(18, max_dim // 2),
        )
        if hough is not None:
            for c_item in hough[0]:
                raw_circles.append((float(c_item[0]), float(c_item[1]), float(c_item[2])))
    except Exception:
        pass

    if not raw_circles:
        return []

    median_r = float(np.median([c[2] for c in raw_circles]))
    filtered = [
        c for c in raw_circles if median_r * 0.58 <= c[2] <= median_r * 1.55
    ]

    deduped: List[Tuple[float, float, float]] = []
    for cx, cy, r in filtered:
        merged = False
        for idx, (ex, ey, er) in enumerate(deduped):
            if np.hypot(cx - ex, cy - ey) < max(r, er) * 0.65:
                deduped[idx] = ((cx + ex) / 2.0, (cy + ey) / 2.0, (r + er) / 2.0)
                merged = True
                break
        if not merged:
            deduped.append((cx, cy, r))

    return deduped


def detect_bubbles_via_contours(
    img: np.ndarray, total_questions: int
) -> Tuple[Dict[int, str], List[float], Optional[str]]:
    ink_diff, ink_binary = compute_ink_maps(img)
    circles = find_bubble_candidates(img)
    if len(circles) < 4:
        return {}, [], None

    circles.sort(key=lambda c: c[1])

    rows: List[List[Tuple[float, float, float]]] = []
    for c in circles:
        placed = False
        for row in rows:
            avg_y = sum(item[1] for item in row) / len(row)
            avg_r = sum(item[2] for item in row) / len(row)
            if abs(c[1] - avg_y) <= max(10.0, avg_r * 1.35):
                row.append(c)
                placed = True
                break
        if not placed:
            rows.append([c])

    detected_version_marked: Optional[str] = None
    question_groups: List[Tuple[int, float, List[Tuple[float, float, float]]]] = []

    all_adj_diffs: List[float] = []
    for row in rows:
        if len(row) >= 4:
            s_row = sorted(row, key=lambda c: c[0])
            for i in range(len(s_row) - 1):
                d = s_row[i + 1][0] - s_row[i][0]
                if s_row[i][2] * 1.4 <= d <= s_row[i][2] * 4.5:
                    all_adj_diffs.append(d)

    typical_step_x = float(np.median(all_adj_diffs)) if all_adj_diffs else 32.0

    raw_clusters: List[Tuple[float, float, List[Tuple[float, float, float]]]] = []
    for row in rows:
        if len(row) < 3:
            continue
        s_row = sorted(row, key=lambda c: c[0])
        clusters: List[List[Tuple[float, float, float]]] = [[s_row[0]]]
        for item in s_row[1:]:
            prev = clusters[-1][-1]
            if (item[0] - prev[0]) > typical_step_x * 2.35:
                clusters.append([item])
            else:
                clusters[-1].append(item)

        for cl in clusters:
            if len(cl) == 4 and detected_version_marked is None:
                v_scores = [
                    (
                        VERSION_LETTERS[i],
                        measure_bubble_darkness(ink_diff, ink_binary, cl[i][0], cl[i][1], cl[i][2]),
                    )
                    for i in range(4)
                ]
                v_scores.sort(key=lambda s: s[1], reverse=True)
                median_other = float(np.median([s[1] for s in v_scores[1:]]))
                if v_scores[0][1] >= 0.22 and (v_scores[0][1] - median_other) >= 0.07:
                    detected_version_marked = v_scores[0][0]

            slots_5 = extract_5_slots_from_cluster(cl)
            if slots_5 is not None:
                mean_x = sum(s[0] for s in slots_5) / 5.0
                mean_y = sum(s[1] for s in slots_5) / 5.0
                raw_clusters.append((mean_x, mean_y, slots_5))

    if not raw_clusters:
        return {}, [], detected_version_marked

    raw_clusters.sort(key=lambda item: item[0])
    col_centers: List[float] = []
    for mean_x, mean_y, slots in raw_clusters:
        assigned_col = -1
        for c_idx, c_x in enumerate(col_centers):
            if abs(mean_x - c_x) <= typical_step_x * 3.5:
                assigned_col = c_idx
                col_centers[c_idx] = (c_x + mean_x) / 2.0
                break
        if assigned_col == -1:
            assigned_col = len(col_centers)
            col_centers.append(mean_x)
        question_groups.append((assigned_col, mean_y, slots))

    question_groups.sort(key=lambda g: (g[0], g[1]))

    detected: Dict[int, str] = {}
    confidences: List[float] = []

    for q_idx, (_, _, group) in enumerate(question_groups[:total_questions]):
        q_num = q_idx + 1
        scores: List[Tuple[str, float]] = []

        for l_idx, (cx, cy, r) in enumerate(group[:5]):
            letter = LETTERS[l_idx]
            darkness = measure_bubble_darkness(ink_diff, ink_binary, cx, cy, r)
            scores.append((letter, darkness))

        scores.sort(key=lambda s: s[1], reverse=True)
        if len(scores) >= 2:
            best_letter, best_score = scores[0]
            second_score = scores[1][1]
            median_other = float(np.median([s[1] for s in scores[1:]]))
            contrast_vs_median = best_score - median_other
            contrast_vs_second = best_score - second_score

            if best_score >= 0.20 and contrast_vs_median >= 0.065 and contrast_vs_second >= 0.04:
                detected[q_num] = best_letter
                confidences.append(min(0.99, 0.72 + contrast_vs_median))

    return detected, confidences, detected_version_marked


def detect_omr_bubbles(
    sheet_img: np.ndarray, total_questions: int = 10
) -> Tuple[Dict[int, str], float, Optional[str]]:
    contour_answers, contour_confs, marked_version = detect_bubbles_via_contours(
        sheet_img, total_questions
    )

    answers: Dict[int, str] = dict(contour_answers)
    confidences: List[float] = list(contour_confs)

    if len(answers) > 0:
        avg_conf = float(np.mean(confidences)) * 100.0 if confidences else 85.0
        return answers, round(avg_conf, 1), marked_version

    ink_diff, ink_binary = compute_ink_maps(sheet_img)
    h, w = ink_diff.shape[:2]

    num_cols = 2 if total_questions <= 40 else (3 if total_questions <= 75 else 4)
    per_col = max(1, int(np.ceil(total_questions / float(num_cols))))

    for top_ratio, row_px_ratio, b_start_ratio, b_end_ratio in [
        (0.335, 0.029, 0.10, 0.54),
        (0.365, 0.032, 0.16, 0.82),
    ]:
        grid_top = int(h * top_ratio)
        grid_left = int(w * 0.075)
        grid_right = int(w * 0.925)
        col_width = (grid_right - grid_left) / float(num_cols)
        row_h = max(24.0, h * row_px_ratio)

        trial_answers: Dict[int, str] = {}
        trial_confs: List[float] = []

        for q_idx in range(total_questions):
            q_num = q_idx + 1
            col = q_idx // per_col
            row = q_idx % per_col

            cy = grid_top + (row + 0.55) * row_h
            col_x_start = grid_left + col * col_width
            bubbles_start_x = col_x_start + col_width * b_start_ratio
            bubbles_end_x = col_x_start + col_width * b_end_ratio
            step_x = (bubbles_end_x - bubbles_start_x) / 4.0
            radius = max(8.0, min(row_h * 0.36, step_x * 0.36))

            scores: List[Tuple[str, float]] = []
            for l_idx, letter in enumerate(LETTERS):
                cx = bubbles_start_x + l_idx * step_x
                darkness = measure_bubble_darkness(ink_diff, ink_binary, cx, cy, radius)
                scores.append((letter, darkness))

            scores.sort(key=lambda s: s[1], reverse=True)
            best_letter, best_score = scores[0]
            second_score = scores[1][1]
            median_other = float(np.median([s[1] for s in scores[1:]]))
            if (
                best_score >= 0.22
                and (best_score - median_other) >= 0.07
                and (best_score - second_score) >= 0.045
            ):
                trial_answers[q_num] = best_letter
                trial_confs.append(min(0.99, 0.70 + (best_score - median_other)))

        if len(trial_answers) > len(answers):
            answers = trial_answers
            confidences = trial_confs

    avg_confidence = float(np.mean(confidences)) * 100.0 if confidences else 0.0
    return answers, round(avg_confidence, 1), marked_version


def grade_exam(
    marked_answers: Dict[Any, str],
    official_answer_key: Dict[Any, str],
    total_questions: int = 10,
    max_score: float = 10.0,
) -> Dict[str, Any]:
    norm_marked: Dict[int, str] = {}
    for k, v in (marked_answers or {}).items():
        if v is None or str(v).strip() == "":
            continue
        try:
            norm_marked[int(k)] = str(v).upper().strip()
        except Exception:
            pass

    norm_key: Dict[int, str] = {}
    for k, v in (official_answer_key or {}).items():
        if v is None or str(v).strip() == "":
            continue
        try:
            norm_key[int(k)] = str(v).upper().strip()
        except Exception:
            pass

    total_q = max(1, int(total_questions or len(norm_key) or 10))
    points_per_question = float(max_score) / total_q
    correct_count = 0
    details = []

    for q_num in range(1, total_q + 1):
        chosen = norm_marked.get(q_num, None)
        correct = norm_key.get(q_num, "A")
        is_correct = bool(chosen is not None and chosen == correct)
        if is_correct:
            correct_count += 1

        details.append(
            {
                "questionNumber": q_num,
                "questionId": f"q-{q_num}",
                "chosen": chosen,
                "correct": correct,
                "isCorrect": is_correct,
                "score": round(points_per_question, 2) if is_correct else 0.0,
            }
        )

    total_score = round((correct_count / total_q) * float(max_score), 1)

    return {
        "correctCount": correct_count,
        "totalQuestions": total_q,
        "totalScore": total_score,
        "maxScore": float(max_score),
        "details": details,
    }


def process_omr_request(payload: Dict[str, Any]) -> Dict[str, Any]:
    action = payload.get("action", "scan")
    total_questions = int(payload.get("totalQuestions") or 10)
    max_score = float(payload.get("maxScore") or 10.0)
    official_key = payload.get("officialAnswerKey") or {}
    version_letter = str(payload.get("versionLetter") or "A").upper()

    if action == "grade":
        marked = payload.get("markedAnswers") or payload.get("respostasLidas") or {}
        grading = grade_exam(marked, official_key, total_questions, max_score)
        respostas_lidas = {
            str(d["questionNumber"]): d["chosen"]
            for d in grading["details"]
            if d["chosen"] is not None
        }
        return {
            "success": True,
            "engine": "python-opencv-omr",
            "versionLetter": version_letter,
            "markedAnswers": respostas_lidas,
            "respostasLidas": respostas_lidas,
            "grading": grading,
        }

    image_b64 = payload.get("imageBase64", "")
    img = decode_base64_image(image_b64)

    if img is None:
        return {
            "success": False,
            "error": "Imagem inválida ou não fornecida para leitura.",
        }

    qr_raw, qr_info = detect_qr_code(img)
    detected_version = qr_info.get("versionLetter") or version_letter
    if qr_info.get("totalQuestions"):
        total_questions = int(qr_info["totalQuestions"])

    if qr_info.get("embeddedAnswerKey") and not official_key:
        official_key = qr_info["embeddedAnswerKey"]

    sheet_img, page_aligned = normalize_sheet_image(img)
    detected_answers, confidence, marked_version = detect_omr_bubbles(
        sheet_img, total_questions
    )

    if marked_version and not qr_raw:
        detected_version = marked_version

    grading = grade_exam(detected_answers, official_key, total_questions, max_score)
    respostas_lidas = {str(k): v for k, v in detected_answers.items()}

    return {
        "success": True,
        "engine": "python-opencv-omr",
        "qrDetected": bool(qr_raw),
        "qrRaw": qr_raw,
        "qrData": qr_info,
        "pageAligned": page_aligned,
        "versionLetter": detected_version,
        "versaoMarcada": marked_version or detected_version,
        "confidence": confidence,
        "markedAnswers": respostas_lidas,
        "respostasLidas": respostas_lidas,
        "grading": grading,
    }


if __name__ == "__main__":
    try:
        raw_input = sys.stdin.read()
        data = json.loads(raw_input) if raw_input.strip() else {}
        result = process_omr_request(data)
        sys.stdout.write(json.dumps(result, ensure_ascii=False))
    except Exception as exc:
        sys.stdout.write(
            json.dumps(
                {
                    "success": False,
                    "error": f"Erro no motor OMR Python: {str(exc)}",
                },
                ensure_ascii=False,
            )
        )
