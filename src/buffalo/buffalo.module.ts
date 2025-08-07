import { Module } from '@nestjs/common';
import { BuffaloService } from './buffalo.service';
import { BuffaloController } from './buffalo.controller';

@Module({
  controllers: [BuffaloController],
  providers: [BuffaloService],
})
export class BuffaloModule {}
