import pandas as pd
import numpy as np
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout, BatchNormalization
from tensorflow.keras.callbacks import EarlyStopping, ModelCheckpoint
import joblib

TRAIN_FILE = "training_dataset_40jobs.csv"
MODEL_FILE = "job_recommender_40jobs.h5"
LABEL_ENCODER_FILE = "job_label_encoder.pkl"

def main():
    print("학습용 CSV 불러오는 중...")
    df = pd.read_csv(TRAIN_FILE)

    score_cols = ["COMM", "RESP", "PROB", "GROW", "STRE", "ADAP"]

    X = df[score_cols].values.astype(np.float32)
    y = df["label"].values

    print(f"X shape = {X.shape}, y shape = {y.shape}")

    print("라벨 인코딩 중...")
    le = LabelEncoder()
    y_encoded = le.fit_transform(y)
    num_classes = len(le.classes_)
    print(f"직업 클래스 수: {num_classes}")

    joblib.dump(le, LABEL_ENCODER_FILE)
    print(f"라벨 인코더 저장 완료 → {LABEL_ENCODER_FILE}")

    print("최적화된 딥러닝 모델 생성 중...")
    model = Sequential([
        Dense(128, activation='relu', input_shape=(6,)),
        BatchNormalization(),
        Dropout(0.3),

        Dense(64, activation='relu'),
        BatchNormalization(),
        Dropout(0.3),

        Dense(32, activation='relu'),
        BatchNormalization(),

        Dense(num_classes, activation='softmax')
    ])

    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])

    print("학습 시작...")
    callbacks = [
        EarlyStopping(monitor='val_accuracy', patience=15, restore_best_weights=True),
        ModelCheckpoint(MODEL_FILE, monitor='val_accuracy', save_best_only=True)
    ]

    history = model.fit(
        X, y_encoded,
        validation_split=0.2,
        epochs=200,
        batch_size=32,
        callbacks=callbacks,
        verbose=1
    )

    print(f"\n모델 저장 완료 → {MODEL_FILE}")
    print("모든 작업 끝!")

if __name__ == "__main__":
    main()
