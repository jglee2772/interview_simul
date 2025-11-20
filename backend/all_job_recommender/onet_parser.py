"""
O*NET 데이터 파싱 및 직업별 6개 성향 점수 계산 스크립트

이 스크립트는 O*NET 데이터를 읽어서 각 직업의 6개 성향 점수를 계산합니다:
- COMM: 커뮤니케이션·협업
- RESP: 책임감·성실성
- PROB: 문제해결·논리
- GROW: 성장지향·학습의지
- STRE: 스트레스·정서안정
- ADAP: 조직적응·대인관계
"""

import os
import csv
import json
from collections import defaultdict
from pathlib import Path

# 프로젝트 루트 경로
BASE_DIR = Path(__file__).resolve().parent.parent.parent
ONET_DATA_DIR = BASE_DIR / "db_30_0_text"


def parse_tsv_file(filepath):
    """TSV 파일을 파싱하여 딕셔너리 리스트로 반환"""
    data = []
    with open(filepath, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter='\t')
        for row in reader:
            data.append(row)
    return data


def normalize_score(value_str, scale_id='IM'):
    """
    O*NET 점수를 0.0~5.0 범위로 정규화
    - IM (Importance): 0~5 범위
    - LV (Level): 0~7 범위 → 0~5로 변환
    """
    try:
        value = float(value_str)
        if scale_id == 'LV':
            # Level은 0~7 범위이므로 0~5로 변환
            return min(5.0, max(0.0, (value / 7.0) * 5.0))
        else:
            # Importance는 이미 0~5 범위
            return min(5.0, max(0.0, value))
    except (ValueError, TypeError):
        return None


def calculate_occupation_scores():
    """
    O*NET 데이터를 읽어서 각 직업의 6개 성향 점수를 계산
    """
    print("O*NET 데이터 파싱 시작...")
    
    # 1. 직업 정보 로드
    occupation_file = ONET_DATA_DIR / "Occupation Data.txt"
    occupations = {}
    if occupation_file.exists():
        occ_data = parse_tsv_file(occupation_file)
        for row in occ_data:
            soc_code = row.get('O*NET-SOC Code', '').strip()
            title = row.get('Title', '').strip()
            if soc_code:
                occupations[soc_code] = title
        print(f"직업 정보 로드 완료: {len(occupations)}개")
    else:
        print(f"경고: {occupation_file} 파일을 찾을 수 없습니다.")
    
    # 2. 각 직업별로 데이터 수집
    occupation_data = defaultdict(lambda: {
        'COMM': [],
        'RESP': [],
        'PROB': [],
        'GROW': [],
        'STRE': [],
        'ADAP': []
    })
    
    # 3. Work Styles 파일 파싱
    work_styles_file = ONET_DATA_DIR / "Work Styles.txt"
    if work_styles_file.exists():
        print("Work Styles 파일 파싱 중...")
        ws_data = parse_tsv_file(work_styles_file)
        
        for row in ws_data:
            soc_code = row.get('O*NET-SOC Code', '').strip()
            element_name = row.get('Element Name', '').strip()
            scale_id = row.get('Scale ID', '').strip()
            data_value = row.get('Data Value', '').strip()
            domain_source = row.get('Domain Source', '').strip()
            
            # Incumbent 데이터만 사용 (더 정확함)
            if domain_source != 'Incumbent':
                continue
            
            score = normalize_score(data_value, scale_id)
            if score is None:
                continue
            
            # COMM: 커뮤니케이션·협업
            if element_name in ['Cooperation', 'Social Orientation']:
                occupation_data[soc_code]['COMM'].append(score)
            
            # RESP: 책임감·성실성
            if element_name in ['Integrity', 'Dependability', 'Attention to Detail', 'Persistence']:
                occupation_data[soc_code]['RESP'].append(score)
            
            # STRE: 스트레스·정서안정
            if element_name in ['Stress Tolerance', 'Self-Control']:
                occupation_data[soc_code]['STRE'].append(score)
            
            # ADAP: 조직적응·대인관계
            if element_name in ['Adaptability/Flexibility']:
                occupation_data[soc_code]['ADAP'].append(score)
        
        print(f"Work Styles 파싱 완료: {len(occupation_data)}개 직업")
    else:
        print(f"경고: {work_styles_file} 파일을 찾을 수 없습니다.")
    
    # 4. Skills 파일 파싱
    skills_file = ONET_DATA_DIR / "Skills.txt"
    if skills_file.exists():
        print("Skills 파일 파싱 중...")
        skills_data = parse_tsv_file(skills_file)
        
        for row in skills_data:
            soc_code = row.get('O*NET-SOC Code', '').strip()
            element_name = row.get('Element Name', '').strip()
            scale_id = row.get('Scale ID', '').strip()
            data_value = row.get('Data Value', '').strip()
            domain_source = row.get('Domain Source', '').strip()
            
            # Analyst 데이터 사용
            if domain_source != 'Analyst':
                continue
            
            score = normalize_score(data_value, scale_id)
            if score is None:
                continue
            
            # COMM: 커뮤니케이션·협업
            if element_name in ['Speaking', 'Active Listening', 'Coordination', 'Oral Expression']:
                occupation_data[soc_code]['COMM'].append(score)
            
            # PROB: 문제해결·논리
            if element_name in ['Critical Thinking', 'Complex Problem Solving']:
                occupation_data[soc_code]['PROB'].append(score)
            
            # GROW: 성장지향·학습의지
            if element_name in ['Learning Strategies', 'Active Learning']:
                occupation_data[soc_code]['GROW'].append(score)
            
            # ADAP: 조직적응·대인관계
            if element_name in ['Social Perceptiveness', 'Service Orientation', 'Persuasion']:
                occupation_data[soc_code]['ADAP'].append(score)
        
        print(f"Skills 파싱 완료")
    else:
        print(f"경고: {skills_file} 파일을 찾을 수 없습니다.")
    
    # 5. Abilities 파일 파싱
    abilities_file = ONET_DATA_DIR / "Abilities.txt"
    if abilities_file.exists():
        print("Abilities 파일 파싱 중...")
        abilities_data = parse_tsv_file(abilities_file)
        
        for row in abilities_data:
            soc_code = row.get('O*NET-SOC Code', '').strip()
            element_name = row.get('Element Name', '').strip()
            scale_id = row.get('Scale ID', '').strip()
            data_value = row.get('Data Value', '').strip()
            domain_source = row.get('Domain Source', '').strip()
            
            # Analyst 데이터 사용
            if domain_source != 'Analyst':
                continue
            
            score = normalize_score(data_value, scale_id)
            if score is None:
                continue
            
            # PROB: 문제해결·논리
            if element_name in ['Problem Sensitivity', 'Inductive Reasoning', 'Deductive Reasoning']:
                occupation_data[soc_code]['PROB'].append(score)
        
        print(f"Abilities 파싱 완료")
    else:
        print(f"경고: {abilities_file} 파일을 찾을 수 없습니다.")
    
    # 6. 각 직업별로 평균 점수 계산
    print("\n직업별 6개 성향 점수 계산 중...")
    results = []
    
    for soc_code, scores in occupation_data.items():
        # 각 성향별 평균 계산
        comm_score = sum(scores['COMM']) / len(scores['COMM']) if scores['COMM'] else 0.0
        resp_score = sum(scores['RESP']) / len(scores['RESP']) if scores['RESP'] else 0.0
        prob_score = sum(scores['PROB']) / len(scores['PROB']) if scores['PROB'] else 0.0
        grow_score = sum(scores['GROW']) / len(scores['GROW']) if scores['GROW'] else 0.0
        stre_score = sum(scores['STRE']) / len(scores['STRE']) if scores['STRE'] else 0.0
        adap_score = sum(scores['ADAP']) / len(scores['ADAP']) if scores['ADAP'] else 0.0
        
        # 최소 3개 이상의 성향 점수가 있어야 유효한 직업으로 간주
        valid_scores = sum([
            len(scores['COMM']) > 0,
            len(scores['RESP']) > 0,
            len(scores['PROB']) > 0,
            len(scores['GROW']) > 0,
            len(scores['STRE']) > 0,
            len(scores['ADAP']) > 0
        ])
        
        if valid_scores >= 3:
            results.append({
                'soc_code': soc_code,
                'title': occupations.get(soc_code, 'Unknown'),
                'COMM': round(comm_score, 2),
                'RESP': round(resp_score, 2),
                'PROB': round(prob_score, 2),
                'GROW': round(grow_score, 2),
                'STRE': round(stre_score, 2),
                'ADAP': round(adap_score, 2)
            })
    
    print(f"계산 완료: {len(results)}개 직업")
    return results


def save_to_json(results, output_file='occupation_scores.json'):
    """결과를 JSON 파일로 저장"""
    output_path = Path(__file__).resolve().parent / output_file
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(results, f, ensure_ascii=False, indent=2)
    print(f"\n결과 저장 완료: {output_path}")
    return output_path


def save_to_csv(results, output_file='occupation_scores.csv'):
    """결과를 CSV 파일로 저장"""
    output_path = Path(__file__).resolve().parent / output_file
    fieldnames = ['soc_code', 'title', 'COMM', 'RESP', 'PROB', 'GROW', 'STRE', 'ADAP']
    
    with open(output_path, 'w', encoding='utf-8', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(results)
    
    print(f"CSV 저장 완료: {output_path}")
    return output_path


if __name__ == '__main__':
    print("=" * 60)
    print("O*NET 데이터 파싱 및 직업별 성향 점수 계산")
    print("=" * 60)
    
    results = calculate_occupation_scores()
    
    if results:
        save_to_json(results)
        save_to_csv(results)
        print(f"\n✅ 총 {len(results)}개 직업의 성향 점수 계산 완료!")
    else:
        print("\n❌ 오류: 데이터를 계산할 수 없습니다.")

