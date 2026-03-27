import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, MoreThanOrEqual, LessThanOrEqual } from 'typeorm';
import { Lead } from './entities/lead.entity';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { QueryLeadsDto } from './dto/query-leads.dto';

@Injectable()
export class LeadsService {
  constructor(
    @InjectRepository(Lead)
    private readonly leadRepository: Repository<Lead>,
  ) {}

  async create(createLeadDto: CreateLeadDto): Promise<Lead> {
    const existing = await this.leadRepository.findOne({
      where: { email: createLeadDto.email },
    });

    if (existing) {
      throw new ConflictException(
        `Ya existe un lead con el email: ${createLeadDto.email}`,
      );
    }

    const lead = this.leadRepository.create(createLeadDto);
    return this.leadRepository.save(lead);
  }

  async findAll(query: QueryLeadsDto) {
    const page = parseInt(query.page || '1', 10);
    const limit = Math.min(parseInt(query.limit || '10', 10), 100);
    const skip = (page - 1) * limit;

    const where: any = { deleted: false };

    if (query.fuente) {
      where.fuente = query.fuente;
    }

    if (query.fecha_inicio && query.fecha_fin) {
      where.created_at = Between(
        new Date(query.fecha_inicio),
        new Date(query.fecha_fin + 'T23:59:59.999Z'),
      );
    } else if (query.fecha_inicio) {
      where.created_at = MoreThanOrEqual(new Date(query.fecha_inicio));
    } else if (query.fecha_fin) {
      where.created_at = LessThanOrEqual(
        new Date(query.fecha_fin + 'T23:59:59.999Z'),
      );
    }

    const [data, total] = await this.leadRepository.findAndCount({
      where,
      order: { created_at: 'DESC' },
      skip,
      take: limit,
    });

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Lead> {
    const lead = await this.leadRepository.findOne({
      where: { id, deleted: false },
    });

    if (!lead) {
      throw new NotFoundException(`Lead con ID ${id} no encontrado`);
    }

    return lead;
  }

  async update(id: string, updateLeadDto: UpdateLeadDto): Promise<Lead> {
    const lead = await this.findOne(id);

    if (updateLeadDto.email && updateLeadDto.email !== lead.email) {
      const existing = await this.leadRepository.findOne({
        where: { email: updateLeadDto.email },
      });
      if (existing) {
        throw new ConflictException(
          `Ya existe un lead con el email: ${updateLeadDto.email}`,
        );
      }
    }

    Object.assign(lead, updateLeadDto);
    return this.leadRepository.save(lead);
  }

  async remove(id: string): Promise<{ message: string }> {
    const lead = await this.findOne(id);
    lead.deleted = true;
    await this.leadRepository.save(lead);
    return { message: `Lead con ID ${id} eliminado correctamente` };
  }

  async getStats() {
    const qb = this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.deleted = :deleted', { deleted: false });

    const total = await qb.getCount();

    const bySource = await this.leadRepository
      .createQueryBuilder('lead')
      .select('lead.fuente', 'fuente')
      .addSelect('COUNT(*)', 'total')
      .where('lead.deleted = :deleted', { deleted: false })
      .groupBy('lead.fuente')
      .getRawMany();

    const avgResult = await this.leadRepository
      .createQueryBuilder('lead')
      .select('AVG(lead.presupuesto)', 'promedio')
      .where('lead.deleted = :deleted', { deleted: false })
      .andWhere('lead.presupuesto IS NOT NULL')
      .getRawOne();

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentCount = await this.leadRepository
      .createQueryBuilder('lead')
      .where('lead.deleted = :deleted', { deleted: false })
      .andWhere('lead.created_at >= :date', { date: sevenDaysAgo })
      .getCount();

    return {
      total_leads: total,
      leads_por_fuente: bySource.reduce(
        (acc, item) => {
          acc[item.fuente] = parseInt(item.total, 10);
          return acc;
        },
        {} as Record<string, number>,
      ),
      promedio_presupuesto: parseFloat(avgResult?.promedio) || 0,
      leads_ultimos_7_dias: recentCount,
    };
  }

  async getLeadsForSummary(filters: {
    fuente?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  }): Promise<Lead[]> {
    const where: any = { deleted: false };

    if (filters.fuente) {
      where.fuente = filters.fuente;
    }

    if (filters.fecha_inicio && filters.fecha_fin) {
      where.created_at = Between(
        new Date(filters.fecha_inicio),
        new Date(filters.fecha_fin + 'T23:59:59.999Z'),
      );
    } else if (filters.fecha_inicio) {
      where.created_at = MoreThanOrEqual(new Date(filters.fecha_inicio));
    } else if (filters.fecha_fin) {
      where.created_at = LessThanOrEqual(
        new Date(filters.fecha_fin + 'T23:59:59.999Z'),
      );
    }

    return this.leadRepository.find({
      where,
      order: { created_at: 'DESC' },
    });
  }
}
