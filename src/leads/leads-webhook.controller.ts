import { Controller, Post, Body } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { LeadSource } from './entities/lead.entity';

class TypeformWebhookPayload {
  form_response: {
    answers: {
      field: { ref: string };
      text?: string;
      email?: string;
      number?: number;
      phone_number?: string;
      choice?: { label: string };
    }[];
  };
}

@ApiTags('Webhook')
@Controller('leads')
export class LeadsWebhookController {
  constructor(private readonly leadsService: LeadsService) {}

  @Post('webhook')
  @ApiOperation({ summary: 'Webhook para recibir leads desde Typeform' })
  @ApiResponse({ status: 201, description: 'Lead creado desde webhook' })
  async handleTypeformWebhook(@Body() payload: TypeformWebhookPayload) {
    const answers = payload.form_response?.answers || [];

    const getValue = (ref: string) =>
      answers.find((a) => a.field.ref === ref);

    const nombre = getValue('nombre')?.text || 'Sin nombre';
    const email = getValue('email')?.email || getValue('email')?.text || '';
    const telefono = getValue('telefono')?.phone_number || getValue('telefono')?.text;
    const fuente = (getValue('fuente')?.choice?.label || 'otro') as LeadSource;
    const producto_interes = getValue('producto_interes')?.text;
    const presupuesto = getValue('presupuesto')?.number;

    const lead = await this.leadsService.create({
      nombre,
      email,
      telefono,
      fuente: Object.values(LeadSource).includes(fuente) ? fuente : LeadSource.OTRO,
      producto_interes,
      presupuesto,
    });

    return { success: true, lead_id: lead.id };
  }
}
