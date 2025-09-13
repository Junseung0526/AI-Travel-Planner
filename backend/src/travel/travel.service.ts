import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';

@Injectable()
export class TravelService {
    private readonly genAI: GoogleGenerativeAI;

    constructor() {
        const apiKey = process.env.GOOGLE_GEMINI_API_KEY;
        if (!apiKey) {
            throw new InternalServerErrorException('GOOGLE_GEMINI_API_KEY is not set.');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async generateTravelPlan(destination: string, duration: string, interests: string): Promise<any> {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

        const prompt = `
      당신은 여행 플래너 전문가입니다.
      사용자의 입력에 따라 JSON 형식으로 상세한 여행 일정을 만들어 주세요.
      JSON 외에 다른 텍스트는 절대로 포함하지 마세요.
      
      사용자 요청:
      - 목적지: ${destination}
      - 기간: ${duration}
      - 관심사: ${interests}
      
      JSON 객체는 다음 스키마를 반드시 따라야 합니다.
      {
        "tripTitle": "여행에 대한 개인화된 제목",
        "itinerary": [
          {
            "day": "Day 1",
            "activities": [
              {
                "time": "오전",
                "activityName": "장소 또는 활동 이름",
                "description": "활동에 대한 간략한 설명.",
                "notes": "선택적 참고 사항이나 팁 (예: '현지 길거리 음식을 맛보세요')."
              }
            ]
          }
        ]
      }
      
      최종 응답은 올바른 형식의 JSON 객체여야 합니다.
    `;

        try {
            const result = await model.generateContent({
                contents: [{ role: 'user', parts: [{ text: prompt }] }],
                safetySettings: [
                    {
                        category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                    {
                        category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                        threshold: HarmBlockThreshold.BLOCK_NONE,
                    },
                ],
            });

            const response = await result.response;
            let jsonString = response.text().trim();

            const startJson = jsonString.indexOf('{');
            const endJson = jsonString.lastIndexOf('}');
            if (startJson !== -1 && endJson !== -1) {
                jsonString = jsonString.substring(startJson, endJson + 1);
            }

            return JSON.parse(jsonString);

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw new InternalServerErrorException('AI로부터 여행 계획을 생성하는 데 실패했습니다.');
        }
    }
}