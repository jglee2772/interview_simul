import csv
import os
import sys
from openai import OpenAI
from dotenv import load_dotenv
import time

# 환경 변수 로드 (backend 디렉토리의 .env 파일)
script_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.dirname(script_dir)
env_path = os.path.join(backend_dir, '.env')
load_dotenv(env_path)

def translate_with_openai(title, client):
    """OpenAI API를 사용하여 영어 직업명을 한국어로 번역"""
    try:
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # 비용 효율적인 모델 사용
            messages=[
                {
                    "role": "system",
                    "content": "You are a professional translator specializing in job titles. Translate English job titles to Korean naturally and accurately. Return only the Korean translation without any explanation or additional text."
                },
                {
                    "role": "user",
                    "content": f"Translate this job title to Korean: {title}"
                }
            ],
            temperature=0.3,  # 일관성 있는 번역을 위해 낮은 temperature
            max_tokens=100
        )
        translated = response.choices[0].message.content.strip()
        return translated
    except Exception as e:
        print(f"번역 오류 ({title}): {e}")
        return title  # 오류 시 원문 반환

def translate_csv_with_openai(input_file, output_file, batch_size=50):
    """CSV 파일의 직업명을 OpenAI API로 한국어 번역"""
    api_key = os.getenv('OPENAI_API_KEY')
    if not api_key:
        print("오류: OPENAI_API_KEY 환경 변수가 설정되지 않았습니다.")
        print(".env 파일에 OPENAI_API_KEY를 설정해주세요.")
        return
    
    client = OpenAI(api_key=api_key)
    
    # 파일 읽기
    with open(input_file, 'r', encoding='utf-8') as f_in:
        reader = csv.DictReader(f_in)
        rows = list(reader)
    
    total = len(rows)
    print(f"총 {total}개의 직업명을 번역합니다.")
    print("OpenAI API를 사용하여 정확하고 자연스러운 번역을 수행합니다.\n")
    
    # 번역 수행
    translated_count = 0
    for i, row in enumerate(rows, 1):
        if 'title' in row:
            original = row['title'].strip('"')
            print(f"[{i}/{total}] 번역 중: {original}")
            
            translated = translate_with_openai(original, client)
            row['title'] = translated
            translated_count += 1
            
            print(f"  → {translated}\n")
            
            # API 호출 제한을 고려한 딜레이 (필요시)
            if i % batch_size == 0:
                print(f"진행 상황: {i}/{total} 완료 (일시 정지 2초)\n")
                time.sleep(2)
    
    # 번역된 데이터를 새 파일에 저장
    with open(output_file, 'w', encoding='utf-8', newline='') as f_out:
        if rows:
            writer = csv.DictWriter(f_out, fieldnames=reader.fieldnames)
            writer.writeheader()
            writer.writerows(rows)
    
    print(f"\n번역 완료: {translated_count}개 직업명이 번역되었습니다.")
    print(f"결과 파일: {output_file}")

if __name__ == "__main__":
    script_dir = os.path.dirname(os.path.abspath(__file__))
    input_file = os.path.join(script_dir, "occupation_scores.csv")
    output_file = os.path.join(script_dir, "occupation_scores_kr.csv")  # 새 파일로 저장
    
    # 원본 파일 백업 여부 확인
    print("=" * 60)
    print("OpenAI API를 사용한 직업명 번역 스크립트")
    print("=" * 60)
    print(f"입력 파일: {input_file}")
    print(f"출력 파일: {output_file}")
    print("\n주의: OpenAI API 사용 시 비용이 발생할 수 있습니다.")
    print("gpt-4o-mini 모델 사용 시 약 $0.15/1M input tokens, $0.60/1M output tokens")
    print("895개 직업명 번역 시 예상 비용: 약 $0.01-0.05 정도")
    print("\n번역을 시작합니다...\n")
    
    translate_csv_with_openai(input_file, output_file)

