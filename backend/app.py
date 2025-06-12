import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai

app = Flask(__name__)
CORS(app)

API_KEY = os.environ.get("GEMINI_API_KEY")

if API_KEY:
    genai.configure(api_key=API_KEY)
else:
    print("경고: GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")

# --- 여기에 프롬프트 내용을 정의합니다 ---
# 텍스트 블록으로 정의하여 관리하기 용이하게 합니다.
GEMINI_PROMPT_TEMPLATE = """
당신은 고객의 선택을 대신해주는 친절한 가이드입니다. 고객이 두 가지 이상의 선택지를 제시하면, 그중 하나를 신중하게 선택하고 그 이유와 함께 해당 선택지의 핵심 특징 3가지를 **간결한 게이지 형식**으로 평가해주세요.

**제약 조건:**
- 항상 제시된 선택지 중에서만 골라야 합니다.
- 선택의 이유는 1~2문장으로 간결하게 설명합니다.
- 평가 항목(게이지)은 **선택지의 종류에 따라 AI가 가장 적절하다고 판단하는 3가지 고유한 항목**을 선정합니다.
- 각 항목에 대해 0%에서 100% 사이의 수치를 퍼센트(%)로 표시합니다.
- 계절, 날씨, 고객의 기분(단어에서 유추), 또는 최신 트렌드 등 다양한 요소를 선택의 근거로 활용할 수 있습니다.

**답변 형식:**
- 선택한 항목을 먼저 명시합니다.
- 이어서 선택 이유를 1~2문장으로 설명합니다.
- 마지막으로 평가 게이지를 '항목명 N%' 형식으로 한 줄씩 나열합니다.

**예시 입력 1:**
초코, 딸기

**예시 출력 1:**
초코를 선택했습니다.
선택 이유: 달콤함으로 꿀꿀한 기분을 전환하고 스트레스를 해소하는 데 최고입니다.
달콤함 95%
기분 전환 90%
만족도 85%

**예시 입력 2:**
쏘나타, 그랜저

**예시 출력 2:**
그랜저를 선택했습니다.
선택 이유: 고급스러움과 넓은 실내 공간으로 편안하고 품격 있는 이동을 제공합니다.
승차감 90%
브랜드 가치 85%
안락함 95%

**예시 입력 3:**
사과, 배

**예시 출력 3:**
사과를 선택했습니다.
선택 이유: 아삭한 식감과 새콤달콤한 맛으로 남녀노소 누구나 즐기기 좋습니다.
신선도 90%
당도 80%
휴대성 95%

---
고객의 실제 요청:
"""

@app.route("/api", methods=["POST"])
def chat():
    data = request.get_json()
    user_message = data.get("message", "") # 사용자로부터 받은 실제 메시지

    if not user_message:
        return jsonify({"reply": "메시지가 제공되지 않았습니다."}), 400

    try:
        # 모델 선택 (ListModels로 확인한 모델 사용)
        model = genai.GenerativeModel('gemini-1.5-flash') # 예시: 'gemini-1.5-flash' 또는 'gemini-pro' 등

        # 프롬프트 템플릿과 사용자 메시지를 결합하여 최종 메시지 생성
        final_message_for_gemini = GEMINI_PROMPT_TEMPLATE + user_message

        # Gemini 모델에 최종 메시지 전송
        response = model.generate_content(final_message_for_gemini)
        reply = response.text

    except Exception as e:
        reply = f"Gemini API 호출 중 에러 발생: {str(e)}"
        print(f"에러 상세: {e}")
        return jsonify({"reply": reply}), 500

    return jsonify({"reply": reply})

@app.route("/")
def home():
    return "Google Gemini API 백엔드 연결 준비 완료! `/api` 엔드포인트로 POST 요청을 보내세요."

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port)

