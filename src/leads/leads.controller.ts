import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { LeadsService } from './leads.service';
import { AiService } from '../ai/ai.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';
import { AiSummaryDto } from './dto/ai-summary.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Leads')
@Controller('leads')
export class LeadsController {
  constructor(
    private readonly leadsService: LeadsService,
    private readonly aiService: AiService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Registrar un nuevo lead' })
  @ApiResponse({ status: 201, description: 'Lead creado exitosamente' })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  @ApiResponse({ status: 409, description: 'Email duplicado' })
  create(@Body() createLeadDto: CreateLeadDto) {
    return this.leadsService.create(createLeadDto);
  }

  @Get()
  @ApiOperation({ summary: 'Listar leads con paginación y filtros' })
  @ApiResponse({ status: 200, description: 'Lista de leads paginada' })
  findAll(@Query() query: QueryLeadsDto) {
    return this.leadsService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Obtener estadísticas de leads' })
  @ApiResponse({ status: 200, description: 'Estadísticas de leads' })
  getStats() {
    return this.leadsService.getStats();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener un lead por ID' })
  @ApiResponse({ status: 200, description: 'Lead encontrado' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar un lead existente' })
  @ApiResponse({ status: 200, description: 'Lead actualizado' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateLeadDto: UpdateLeadDto,
  ) {
    return this.leadsService.update(id, updateLeadDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar un lead (soft delete)' })
  @ApiResponse({ status: 200, description: 'Lead eliminado' })
  @ApiResponse({ status: 404, description: 'Lead no encontrado' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.leadsService.remove(id);
  }

  @Post('ai/summary')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generar resumen ejecutivo con IA' })
  @ApiResponse({ status: 200, description: 'Resumen generado' })
  async aiSummary(@Body() filters: AiSummaryDto) {
    const leads = await this.leadsService.getLeadsForSummary(filters);
    const summary = await this.aiService.generateLeadsSummary(leads);
    return {
      total_leads_analizados: leads.length,
      filtros_aplicados: filters,
      resumen: summary,
    };
  }
}
