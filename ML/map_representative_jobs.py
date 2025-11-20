import pandas as pd
from sqlalchemy import create_engine

# ------------------------------------------------
# DB 접속 설정
# ------------------------------------------------
DB_HOST = "localhost"
DB_USER = "root"
DB_PASSWORD = "1234"
DB_NAME = "interview_simul"

OUTPUT_FILE = "representative_jobs.csv"

# SQLAlchemy 엔진
engine = create_engine(f"mysql+pymysql://{DB_USER}:{DB_PASSWORD}@{DB_HOST}/{DB_NAME}?charset=utf8mb4")


# ------------------------------------------------
# 대표직업 40개 리스트
# ------------------------------------------------
REPRESENTATIVE_JOBS = [
    "연구원(R&D)", "데이터 분석가", "AI 개발·기획자", "기획/전략 담당자",
    "교육·교사", "상담사/심리상담사", "백엔드 개발자", "프론트엔드 개발자",
    "모바일 앱 개발자", "임베디드/시스템 엔지니어", "정보보안 전문가",
    "데이터 엔지니어", "QA/테스터", "기계 엔지니어", "전기/전자 엔지니어",
    "제조·품질관리(QC/QA)", "설계·CAD 엔지니어", "토목/건축 엔지니어",
    "공정/생산 엔지니어", "의사(전체)", "간호사", "치료사(물리·작업)",
    "임상병리사", "치위생/치과 직무", "약무/보건행정", "CS/고객응대",
    "영업·판매", "마케팅·홍보", "MD/상품기획", "서비스 기획자",
    "시각디자이너", "UX/UI 디자이너", "영상편집/콘텐츠",
    "게임 그래픽/일러스트", "기자·작가·출판", "행정·사무",
    "회계·재무", "인사·총무", "경찰·소방·교정", "군인"
]


# ------------------------------------------------
# 직업명 → 대표직업 매핑 규칙
# ------------------------------------------------
def map_representative(title: str) -> str:
    if not isinstance(title, str):
        return "기타전문직"

    t = title.replace(" ", "")

    # 연구·기획
    if "연구" in t:
        return "연구원(R&D)"
    if "기획" in t or "전략" in t:
        return "기획/전략 담당자"
    if "상담" in t or "심리" in t:
        return "상담사/심리상담사"
    if "강사" in t or "교사" in t or "교수" in t:
        return "교육·교사"

    # 데이터·AI
    if ("데이터" in t and "엔지니어" not in t) or "통계" in t or "빅데이터" in t:
        return "데이터 분석가"
    if "AI" in t or "인공지능" in t:
        return "AI 개발·기획자"
    if "데이터엔지니어" in t or ("데이터" in t and "엔지니어" in t):
        return "데이터 엔지니어"

    # 개발자
    if "백엔드" in t or ("서버" in t and "개발" in t):
        return "백엔드 개발자"
    if "프론트" in t:
        return "프론트엔드 개발자"
    if "앱개발" in t or "모바일" in t:
        return "모바일 앱 개발자"
    if "임베디드" in t or "펌웨어" in t or "시스템" in t:
        return "임베디드/시스템 엔지니어"

    # 보안
    if "보안" in t or "정보보안" in t:
        return "정보보안 전문가"

    # QA
    if "테스터" in t or "QA" in t:
        return "QA/테스터"

    # 엔지니어링
    if "기계" in t:
        return "기계 엔지니어"
    if "전기" in t or "전자" in t:
        return "전기/전자 엔지니어"
    if "제조" in t or "품질" in t:
        return "제조·품질관리(QC/QA)"
    if "CAD" in t or "설계" in t:
        return "설계·CAD 엔지니어"
    if "토목" in t or "건축" in t:
        return "토목/건축 엔지니어"
    if "공정" in t or "생산" in t:
        return "공정/생산 엔지니어"

    # 의료
    if "의사" in t or "의료" in t:
        return "의사(전체)"
    if "간호" in t:
        return "간호사"
    if "치료사" in t:
        return "치료사(물리·작업)"
    if "임상병리" in t:
        return "임상병리사"
    if "치위생" in t or "치과" in t:
        return "치위생/치과 직무"
    if "약사" in t or "약무" in t:
        return "약무/보건행정"

    # 서비스·영업
    if "고객" in t or "CS" in t:
        return "CS/고객응대"
    if "영업" in t or "판매" in t:
        return "영업·판매"
    if "마케팅" in t or "홍보" in t:
        return "마케팅·홍보"
    if "상품기획" in t or "MD" in t:
        return "MD/상품기획"
    if "서비스기획" in t:
        return "서비스 기획자"

    # 디자인·콘텐츠
    if "디자인" in t:
        return "시각디자이너"
    if "UX" in t or "UI" in t:
        return "UX/UI 디자이너"
    if "영상" in t or "편집" in t or "콘텐츠" in t:
        return "영상편집/콘텐츠"
    if "게임" in t or "일러스트" in t:
        return "게임 그래픽/일러스트"
    if "기자" in t or "작가" in t or "출판" in t:
        return "기자·작가·출판"

    # 경영·사무
    if "행정" in t or "사무" in t:
        return "행정·사무"
    if "회계" in t or "재무" in t:
        return "회계·재무"
    if "인사" in t or "총무" in t:
        return "인사·총무"

    # 특수직무
    if "경찰" in t or "소방" in t or "교도관" in t:
        return "경찰·소방·교정"
    if "부사관" in t or "장교" in t or "군인" in t or "준사관" in t:
        return "군인"

    return "기타전문직"


# ------------------------------------------------
# 실행
# ------------------------------------------------
def main():
    print("DB에서 직업 데이터 읽는 중 (SQLAlchemy)...")

    df = pd.read_sql("SELECT * FROM job_profiles", engine)

    print(f"{len(df)}개 직업 로드 완료")

    print("대표직업 매핑 중...")
    df["representative_job"] = df["title_ko"].apply(map_representative)

    print("\n대표직업 분포:")
    print(df["representative_job"].value_counts())

    df.to_csv(OUTPUT_FILE, index=False, encoding="utf-8-sig")
    print(f"\n저장 완료 → {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
