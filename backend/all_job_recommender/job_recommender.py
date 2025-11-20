"""
직업 추천 서비스

사용자의 6개 성향 점수를 받아서 가장 유사한 직업들을 추천합니다.
"""

import json
import math
from pathlib import Path
from typing import List, Dict, Tuple

BASE_DIR = Path(__file__).resolve().parent
OCCUPATION_SCORES_FILE = BASE_DIR / "occupation_scores.json"


class JobRecommender:
    """직업 추천 클래스"""
    
    def __init__(self, occupation_scores_file=None):
        """
        초기화
        Args:
            occupation_scores_file: 직업 점수 JSON 파일 경로 (기본값: occupation_scores.json)
        """
        if occupation_scores_file is None:
            occupation_scores_file = OCCUPATION_SCORES_FILE
        
        self.occupations = self._load_occupations(occupation_scores_file)
    
    def _load_occupations(self, filepath: Path) -> List[Dict]:
        """직업 점수 데이터 로드"""
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                return json.load(f)
        except FileNotFoundError:
            print(f"경고: {filepath} 파일을 찾을 수 없습니다.")
            return []
        except json.JSONDecodeError:
            print(f"오류: {filepath} 파일을 파싱할 수 없습니다.")
            return []
    
    def euclidean_distance(self, user_scores: Dict[str, float], job_scores: Dict[str, float]) -> float:
        """
        유클리드 거리 계산
        Args:
            user_scores: 사용자의 6개 성향 점수 {'COMM': 4.5, 'RESP': 3.8, ...}
            job_scores: 직업의 6개 성향 점수 {'COMM': 4.6, 'RESP': 4.1, ...}
        Returns:
            거리 (작을수록 유사함)
        """
        dimensions = ['COMM', 'RESP', 'PROB', 'GROW', 'STRE', 'ADAP']
        sum_squared_diff = 0.0
        
        for dim in dimensions:
            user_val = user_scores.get(dim, 0.0)
            job_val = job_scores.get(dim, 0.0)
            sum_squared_diff += (user_val - job_val) ** 2
        
        return math.sqrt(sum_squared_diff)
    
    def cosine_similarity(self, user_scores: Dict[str, float], job_scores: Dict[str, float]) -> float:
        """
        코사인 유사도 계산
        Args:
            user_scores: 사용자의 6개 성향 점수
            job_scores: 직업의 6개 성향 점수
        Returns:
            유사도 (0~1, 클수록 유사함)
        """
        dimensions = ['COMM', 'RESP', 'PROB', 'GROW', 'STRE', 'ADAP']
        
        dot_product = 0.0
        user_norm = 0.0
        job_norm = 0.0
        
        for dim in dimensions:
            user_val = user_scores.get(dim, 0.0)
            job_val = job_scores.get(dim, 0.0)
            
            dot_product += user_val * job_val
            user_norm += user_val ** 2
            job_norm += job_val ** 2
        
        if user_norm == 0.0 or job_norm == 0.0:
            return 0.0
        
        return dot_product / (math.sqrt(user_norm) * math.sqrt(job_norm))
    
    def recommend_jobs(
        self,
        user_scores: Dict[str, float],
        top_n: int = 10,
        method: str = 'euclidean'
    ) -> List[Dict]:
        """
        사용자 점수에 기반하여 직업 추천
        Args:
            user_scores: 사용자의 6개 성향 점수
                예: {'COMM': 4.5, 'RESP': 3.8, 'PROB': 4.2, 'GROW': 3.9, 'STRE': 4.1, 'ADAP': 4.3}
            top_n: 추천할 직업 개수 (기본값: 10)
            method: 거리 계산 방법 ('euclidean' 또는 'cosine')
        Returns:
            추천 직업 리스트 (거리/유사도 순으로 정렬)
        """
        if not self.occupations:
            return []
        
        # 사용자 점수 벡터 생성
        user_vector = {
            'COMM': float(user_scores.get('COMM', 0.0)),
            'RESP': float(user_scores.get('RESP', 0.0)),
            'PROB': float(user_scores.get('PROB', 0.0)),
            'GROW': float(user_scores.get('GROW', 0.0)),
            'STRE': float(user_scores.get('STRE', 0.0)),
            'ADAP': float(user_scores.get('ADAP', 0.0))
        }
        
        # 각 직업과의 거리/유사도 계산
        scored_jobs = []
        
        for job in self.occupations:
            job_vector = {
                'COMM': float(job.get('COMM', 0.0)),
                'RESP': float(job.get('RESP', 0.0)),
                'PROB': float(job.get('PROB', 0.0)),
                'GROW': float(job.get('GROW', 0.0)),
                'STRE': float(job.get('STRE', 0.0)),
                'ADAP': float(job.get('ADAP', 0.0))
            }
            
            if method == 'cosine':
                similarity = self.cosine_similarity(user_vector, job_vector)
                scored_jobs.append({
                    'soc_code': job['soc_code'],
                    'title': job['title'],
                    'scores': job_vector,
                    'similarity': round(similarity, 4),
                    'distance': None
                })
            else:  # euclidean
                distance = self.euclidean_distance(user_vector, job_vector)
                scored_jobs.append({
                    'soc_code': job['soc_code'],
                    'title': job['title'],
                    'scores': job_vector,
                    'distance': round(distance, 4),
                    'similarity': None
                })
        
        # 정렬
        if method == 'cosine':
            scored_jobs.sort(key=lambda x: x['similarity'], reverse=True)
        else:
            scored_jobs.sort(key=lambda x: x['distance'])
        
        # Top N 반환
        return scored_jobs[:top_n]
    
    def get_job_details(self, soc_code: str) -> Dict:
        """특정 직업의 상세 정보 반환"""
        for job in self.occupations:
            if job['soc_code'] == soc_code:
                return job
        return None


# 전역 인스턴스 (싱글톤 패턴)
_recommender_instance = None


def get_recommender() -> JobRecommender:
    """JobRecommender 싱글톤 인스턴스 반환"""
    global _recommender_instance
    if _recommender_instance is None:
        _recommender_instance = JobRecommender()
    return _recommender_instance


# 테스트 코드
if __name__ == '__main__':
    # 예시 사용자 점수
    user_scores = {
        'COMM': 4.5,
        'RESP': 3.8,
        'PROB': 4.2,
        'GROW': 3.9,
        'STRE': 4.1,
        'ADAP': 4.3
    }
    
    recommender = JobRecommender()
    recommendations = recommender.recommend_jobs(user_scores, top_n=5, method='euclidean')
    
    print("=" * 60)
    print("직업 추천 결과 (유클리드 거리 기준)")
    print("=" * 60)
    for i, job in enumerate(recommendations, 1):
        print(f"\n{i}. {job['title']} ({job['soc_code']})")
        print(f"   거리: {job['distance']}")
        print(f"   점수: COMM={job['scores']['COMM']}, RESP={job['scores']['RESP']}, "
              f"PROB={job['scores']['PROB']}, GROW={job['scores']['GROW']}, "
              f"STRE={job['scores']['STRE']}, ADAP={job['scores']['ADAP']}")

