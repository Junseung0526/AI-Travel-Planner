import { Module } from '@nestjs/common';
import { TravelModule } from './travel/travel.module';

@Module({
  imports: [TravelModule],
})
export class AppModule {}