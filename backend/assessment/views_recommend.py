import os
import numpy as np
import pandas as pd
import joblib

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from tensorflow.keras.models import load_model

# -----------------------------
# 경로 설정 (ML 폴더는 backend보다 상위)
# -----------------------------
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))      # backend/assessment
APP_DIR = os.path.dirname(CURRENT_DIR)                        # backend
PROJECT_DIR = os.path.dirname(APP_DIR)                        # interview_simul
ML_DIR = os.path.join(PROJECT_DIR, "ML")                      # interview_simul/ML

MODEL_PATH = os.path.join(ML_DIR, "job_recommender_40jobs.h5")
ENCODER_PATH = os.path.join(ML_DIR, "job_label_encoder.pkl")
REPRESENTATIVE_JOBS = os.path.join(ML_DIR, "representative_jobs.csv")

model = load_model(MODEL_PATH)
label_encoder = joblib.load(ENCODER_PATH)
df_jobs = pd.read_csv(REPRESENTATIVE_JOBS)


class JobRecommendView(APIView):

    def get(self, request, format=None):

        # 1) 점수 파싱
        try:
            user_scores = [
                float(request.GET.get("comm")),
                float(request.GET.get("resp")),
                float(request.GET.get("prob")),
                float(request.GET.get("grow")),
                float(request.GET.get("stre")),
                float(request.GET.get("adap")),
            ]
        except:
            return Response({"error": "점수 형식이 잘못되었습니다."},
                            status=status.HTTP_400_BAD_REQUEST)

        # 2) 40개 직업 예측
        X = np.array(user_scores).reshape(1, -1)
        pred = model.predict(X)[0]
        top_indices = pred.argsort()[::-1][:3]

        # 3) label_encoder가 뽑아주는 값 = title_ko
        job_titles = label_encoder.inverse_transform(top_indices)
        
        # 콘솔 디버깅 출력
        print("TOP INDICES:", top_indices)
        print("MODEL OUTPUT (job_titles):", job_titles)
        print("CSV title_ko sample:", df_jobs["title_ko"].unique()[:10])

        # 4) CSV에서 매칭
        results = []
        for title in job_titles:
            matches = df_jobs[df_jobs["title_ko"] == title]

            if matches.empty:
                results.append({
                    "title_ko": title,
                    "description": "",
                    "category": "",
                })
                continue

            row = matches.iloc[0]
            results.append({
                "title_ko": row["title_ko"],
                "description": row.get("description", ""),
                "category": row.get("category", ""),
            })

        return Response({"results": results}, status=status.HTTP_200_OK)
