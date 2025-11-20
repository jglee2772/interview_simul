import pandas as pd
import numpy as np

# ---------------------------------------
# 출력 파일
# ---------------------------------------
OUTPUT_FILE = "training_dataset_40jobs.csv"

SAMPLES_PER_JOB = 400    # 직업당 샘플 수
NOISE_STD = 0.7          # 1~5 스케일용 노이즈 (너무 크면 또 섞임)

JOB_PROFILES = {
    "연구원(R&D)":             {"COMM": 3, "RESP": 3, "PROB": 5, "GROW": 5, "STRE": 3, "ADAP": 3},
    "데이터 분석가":           {"COMM": 3, "RESP": 3, "PROB": 5, "GROW": 4, "STRE": 3, "ADAP": 3},
    "AI 개발·기획자":          {"COMM": 3, "RESP": 3, "PROB": 5, "GROW": 5, "STRE": 3, "ADAP": 4},
    "기획/전략 담당자":        {"COMM": 4, "RESP": 4, "PROB": 4, "GROW": 4, "STRE": 3, "ADAP": 3},

    "교육·교사":              {"COMM": 4, "RESP": 4, "PROB": 3, "GROW": 4, "STRE": 3, "ADAP": 3},
    "상담사/심리상담사":       {"COMM": 5, "RESP": 4, "PROB": 3, "GROW": 4, "STRE": 3, "ADAP": 3},

    "백엔드 개발자":           {"COMM": 3, "RESP": 3, "PROB": 4, "GROW": 4, "STRE": 4, "ADAP": 3},
    "프론트엔드 개발자":       {"COMM": 4, "RESP": 3, "PROB": 3, "GROW": 4, "STRE": 3, "ADAP": 4},
    "모바일 앱 개발자":        {"COMM": 3, "RESP": 3, "PROB": 4, "GROW": 4, "STRE": 3, "ADAP": 4},
    "임베디드/시스템 엔지니어": {"COMM": 2, "RESP": 4, "PROB": 5, "GROW": 3, "STRE": 4, "ADAP": 2},

    "정보보안 전문가":         {"COMM": 3, "RESP": 4, "PROB": 5, "GROW": 3, "STRE": 4, "ADAP": 3},
    "데이터 엔지니어":         {"COMM": 3, "RESP": 3, "PROB": 4, "GROW": 4, "STRE": 3, "ADAP": 3},
    "QA/테스터":             {"COMM": 3, "RESP": 4, "PROB": 3, "GROW": 3, "STRE": 3, "ADAP": 3},

    "기계 엔지니어":           {"COMM": 3, "RESP": 3, "PROB": 4, "GROW": 3, "STRE": 3, "ADAP": 2},
    "전기/전자 엔지니어":      {"COMM": 3, "RESP": 3, "PROB": 4, "GROW": 3, "STRE": 3, "ADAP": 3},
    "제조·품질관리(QC/QA)":   {"COMM": 3, "RESP": 4, "PROB": 3, "GROW": 3, "STRE": 3, "ADAP": 2},
    "설계·CAD 엔지니어":      {"COMM": 2, "RESP": 4, "PROB": 4, "GROW": 3, "STRE": 3, "ADAP": 2},
    "토목/건축 엔지니어":      {"COMM": 3, "RESP": 4, "PROB": 4, "GROW": 3, "STRE": 3, "ADAP": 2},
    "공정/생산 엔지니어":      {"COMM": 3, "RESP": 4, "PROB": 4, "GROW": 3, "STRE": 4, "ADAP": 2},

    "의사(전체)":             {"COMM": 4, "RESP": 5, "PROB": 4, "GROW": 4, "STRE": 5, "ADAP": 3},
    "간호사":                 {"COMM": 4, "RESP": 5, "PROB": 3, "GROW": 3, "STRE": 5, "ADAP": 3},
    "치료사(물리·작업)":       {"COMM": 4, "RESP": 4, "PROB": 3, "GROW": 4, "STRE": 3, "ADAP": 3},
    "임상병리사":             {"COMM": 3, "RESP": 4, "PROB": 3, "GROW": 3, "STRE": 3, "ADAP": 2},
    "치위생/치과 직무":       {"COMM": 3, "RESP": 4, "PROB": 3, "GROW": 3, "STRE": 3, "ADAP": 2},
    "약무/보건행정":          {"COMM": 3, "RESP": 4, "PROB": 3, "GROW": 3, "STRE": 3, "ADAP": 3},

    "CS/고객응대":            {"COMM": 4, "RESP": 3, "PROB": 2, "GROW": 2, "STRE": 3, "ADAP": 3},
    "영업·판매":              {"COMM": 4, "RESP": 3, "PROB": 3, "GROW": 3, "STRE": 3, "ADAP": 3},
    "마케팅·홍보":            {"COMM": 4, "RESP": 3, "PROB": 3, "GROW": 4, "STRE": 3, "ADAP": 4},
    "MD/상품기획":            {"COMM": 4, "RESP": 3, "PROB": 3, "GROW": 4, "STRE": 3, "ADAP": 3},
    "서비스 기획자":          {"COMM": 4, "RESP": 3, "PROB": 3, "GROW": 4, "STRE": 3, "ADAP": 4},

    "시각디자이너":           {"COMM": 3, "RESP": 2, "PROB": 3, "GROW": 4, "STRE": 2, "ADAP": 3},
    "UX/UI 디자이너":        {"COMM": 4, "RESP": 2, "PROB": 3, "GROW": 4, "STRE": 2, "ADAP": 4},
    "영상편집/콘텐츠":        {"COMM": 3, "RESP": 2, "PROB": 3, "GROW": 4, "STRE": 2, "ADAP": 4},
    "게임 그래픽/일러스트":   {"COMM": 3, "RESP": 2, "PROB": 3, "GROW": 4, "STRE": 2, "ADAP": 3},
    "기자·작가·출판":         {"COMM": 4, "RESP": 3, "PROB": 4, "GROW": 4, "STRE": 3, "ADAP": 3},

    "행정·사무":              {"COMM": 3, "RESP": 4, "PROB": 2, "GROW": 2, "STRE": 3, "ADAP": 2},
    "회계·재무":              {"COMM": 3, "RESP": 4, "PROB": 4, "GROW": 3, "STRE": 3, "ADAP": 2},
    "인사·총무":              {"COMM": 4, "RESP": 4, "PROB": 3, "GROW": 3, "STRE": 3, "ADAP": 3},

    "경찰·소방·교정":         {"COMM": 3, "RESP": 4, "PROB": 3, "GROW": 3, "STRE": 5, "ADAP": 3},
    "군인":                   {"COMM": 2, "RESP": 4, "PROB": 3, "GROW": 2, "STRE": 5, "ADAP": 2},
}


def generate_noise_samples(base_scores, num_samples, noise_std=0.7):
    base = np.array(base_scores, dtype=float)
    samples = []
    for _ in range(num_samples):
        noise = np.random.normal(0, noise_std, size=6)
        noisy = np.clip(base + noise, 1.0, 5.0)  # 1~5 유지
        samples.append(noisy)
    return np.array(samples)


def main():
    all_X = []
    all_y = []

    for job, scores in JOB_PROFILES.items():
        base = [scores["COMM"], scores["RESP"], scores["PROB"],
                scores["GROW"], scores["STRE"], scores["ADAP"]]

        samples = generate_noise_samples(base, num_samples=SAMPLES_PER_JOB, noise_std=NOISE_STD)
        all_X.append(samples)
        all_y.extend([job] * SAMPLES_PER_JOB)

    X = np.vstack(all_X)
    y = np.array(all_y)

    score_cols = ["COMM", "RESP", "PROB", "GROW", "STRE", "ADAP"]
    df = pd.DataFrame(X, columns=score_cols)
    df["label"] = y

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")
    print(f"✔ 학습용 데이터셋 생성 완료 → {OUTPUT_FILE}")
    print(f"X shape = {X.shape}, y length = {len(y)}")


if __name__ == "__main__":
    main()
