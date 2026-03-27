import {
  IsString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsNumber,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { LeadSource } from '../entities/lead.entity';

export class CreateLeadDto {
  @ApiProperty({ example: 'Juan Pérez', minLength: 2 })
  @IsString()
  @MinLength(2, { message: 'El nombre debe tener al menos 2 caracteres' })
  nombre: string;

  @ApiProperty({ example: 'juan@ejemplo.com' })
  @IsEmail({}, { message: 'El email debe tener un formato válido' })
  email: string;

  @ApiPropertyOptional({ example: '+573001234567' })
  @IsOptional()
  @IsString()
  telefono?: string;

  @ApiProperty({ enum: LeadSource, example: LeadSource.INSTAGRAM })
  @IsEnum(LeadSource, {
    message: `La fuente debe ser uno de: ${Object.values(LeadSource).join(', ')}`,
  })
  fuente: LeadSource;

  @ApiPropertyOptional({ example: 'Curso de marketing digital' })
  @IsOptional()
  @IsString()
  producto_interes?: string;

  @ApiPropertyOptional({ example: 500, description: 'Presupuesto en USD' })
  @IsOptional()
  @IsNumber({}, { message: 'El presupuesto debe ser un número' })
  @Min(0, { message: 'El presupuesto no puede ser negativo' })
  presupuesto?: number;
}
