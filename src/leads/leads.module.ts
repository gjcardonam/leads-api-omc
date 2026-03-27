import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LeadsService } from './leads.service';
import { LeadsController } from './leads.controller';
import { LeadsWebhookController } from './leads-webhook.controller';
import { Lead } from './entities/lead.entity';
import { AiModule } from '../ai/ai.module';

@Module({
  imports: [TypeOrmModule.forFeature([Lead]), AiModule],
  controllers: [LeadsController, LeadsWebhookController],
  providers: [LeadsService],
  exports: [LeadsService],
})
export class LeadsModule {}
