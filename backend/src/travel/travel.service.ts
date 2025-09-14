// src/travel/travel.service.ts

import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { GoogleGenerativeAI, HarmBlockThreshold, HarmCategory } from '@google/generative-ai';
import { google } from 'googleapis';
import { readFileSync } from 'fs';
import { join } from 'path';

@Injectable()
export class TravelService {
    private readonly genAI: GoogleGenerativeAI;
    private readonly customSearchEngineId: string;
    private readonly customsearch;

    constructor() {
        const geminiApiKey = process.env.GOOGLE_GEMINI_API_KEY;
        const cxId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

        // 환경 변수 검사
        if (!geminiApiKey) {
            throw new InternalServerErrorException('GOOGLE_GEMINI_API_KEY is not set.');
        }
        if (!cxId) {
            throw new InternalServerErrorException('GOOGLE_CUSTOM_SEARCH_ENGINE_ID is not set.');
        }

        this.genAI = new GoogleGenerativeAI(geminiApiKey);
        this.customSearchEngineId = cxId;

        // 서비스 계정 키 파일을 읽어와 인증 객체 생성
        const keyFilePath = join(__dirname, '../../../../service-account.json');

        try {
            const keyFile = readFileSync(keyFilePath, 'utf-8');
            const credentials = JSON.parse(keyFile);

            const auth = new google.auth.GoogleAuth({
                credentials,
                scopes: ['https://www.googleapis.com/auth/cse'],
            });

            // 인증 객체를 사용하여 Custom Search API 클라이언트 초기화
            this.customsearch = google.customsearch({
                version: 'v1',
                auth: auth,
            });
        } catch (error) {
            console.error('Failed to load service account key file:', error);
            throw new InternalServerErrorException('서비스 계정 키 파일을 불러오는 데 실패했습니다.');
        }
    }

    async generateTravelPlan(destination: string, duration: string, interests: string): Promise<any> {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-pro' });
        const MAX_RETRIES = 3;
        const BASE_DELAY_MS = 1000;

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

        let travelPlan;
        for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
            try {
                const result = await model.generateContent({
                    contents: [{ role: 'user', parts: [{ text: prompt }] }],
                    safetySettings: [
                        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
                        { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
                    ],
                });

                const response = await result.response;
                let jsonString = response.text().trim();
                const startJson = jsonString.indexOf('{');
                const endJson = jsonString.lastIndexOf('}');
                if (startJson !== -1 && endJson !== -1) {
                    jsonString = jsonString.substring(startJson, endJson + 1);
                }
                travelPlan = JSON.parse(jsonString);
                break;
            } catch (error: any) {
                console.error(`Attempt ${attempt} failed:`, error.message);
                if (attempt < MAX_RETRIES && error?.status === 503) {
                    const delay = BASE_DELAY_MS * (2 ** (attempt - 1)) + Math.random() * 1000;
                    console.log(`Retrying in ${delay / 1000} seconds...`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    console.error('Gemini API Error:', error);
                    throw new InternalServerErrorException('AI로부터 여행 계획을 생성하는 데 실패했습니다.');
                }
            }
        }

        if (travelPlan && travelPlan.itinerary) {
            const promises = travelPlan.itinerary.map(async (dayPlan) => {
                const activityPromises = dayPlan.activities.map(async (activity) => {
                    const query = `${activity.activityName} ${destination}`;
                    try {
                        const response = await this.customsearch.cse.list({
                            cx: this.customSearchEngineId,
                            q: query,
                            searchType: 'image',
                            num: 1,
                        });

                        if (response.data.items && response.data.items.length > 0) {
                            activity.imageURL = response.data.items[0].link;
                        } else {
                            activity.imageURL = null;
                        }
                    } catch (error) {
                        console.error(`이미지 검색 실패: ${query}`, error);
                        activity.imageURL = null;
                    }
                });
                await Promise.all(activityPromises);
            });
            await Promise.all(promises);
        }
        return travelPlan;
    }
}