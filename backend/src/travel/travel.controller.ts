import { Controller, Post, Body, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { TravelService } from './travel.service';

@Controller('travel')
export class TravelController {
    constructor(private readonly travelService: TravelService) {}

    @Post('plan')
    async getTravelPlan(
        @Body('destination') destination: string,
        @Body('duration') duration: string,
        @Body('interests') interests: string,
    ) {
        if (!destination || !duration || !interests) {
            throw new BadRequestException('목적지, 기간, 관심사를 모두 제공해주세요.');
        }

        try {
            const travelPlan = await this.travelService.generateTravelPlan(destination, duration, interests);
            return travelPlan;
        } catch (error) {
            throw new InternalServerErrorException('여행 계획을 생성하는 중 서버 오류가 발생했습니다.');
        }
    }
}