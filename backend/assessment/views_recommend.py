import os
import numpy as np
import pandas as pd
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

# ----------------------
#   1) CSV 읽기 (1회 로딩)
# ----------------------
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RECOMMENDER_DIR = os.path.join(BASE_DIR, "all_job_recommender")
CSV_PATH = os.path.join(RECOMMENDER_DIR, "occupation_scores_kr.csv")

# CSV 컬럼 예시: job_title, COMM, RESP, PROB, GROW, STRE, ADAP, description, category
df_jobs = pd.read_csv(CSV_PATH, encoding="utf-8")


# ----------------------
#   2) 추천 API
# ----------------------
class JobRecommendView(APIView):

    def get(self, request, format=None):

        # 점수 가져오기
        try:
            user_vec = np.array([
                float(request.GET.get("comm")),
                float(request.GET.get("resp")),
                float(request.GET.get("prob")),
                float(request.GET.get("grow")),
                float(request.GET.get("stre")),
                float(request.GET.get("adap")),
            ])
        except:
            return Response({"error": "점수 형식이 잘못되었습니다."}, status=400)

        # 직업 점수 벡터 생성
        job_vectors = df_jobs[["COMM", "RESP", "PROB", "GROW", "STRE", "ADAP"]].values

        # 코사인 유사도
        def cosine(a, b):
            return float(np.dot(a, b) / (np.linalg.norm(a) * np.linalg.norm(b)))

        sims = []
        for i, job_row in df_jobs.iterrows():
            job_vec = np.array([
                job_row["COMM"], job_row["RESP"], job_row["PROB"],
                job_row["GROW"], job_row["STRE"], job_row["ADAP"],
            ])
            sims.append(cosine(user_vec, job_vec))

        df_jobs["similarity"] = sims

        # TOP 3
        top3 = df_jobs.sort_values("similarity", ascending=False).head(3)

        results = []
        for _, row in top3.iterrows():
            results.append({
                "title_ko": row["title"],
                "similarity": round(row["similarity"], 4),
                "description": row.get("description", ""),
                "category": row.get("category", "")
            })

        return Response({"results": results}, status=200)
