import { Module } from '@nestjs/common';
import { TravelModule } from './travel/travel.module';

@Module({
  imports: [TravelModule],
  controllers: [],
  providers: [],
})
export class AppModule {}