import { DataSource } from 'typeorm';
import { Lead, LeadSource } from '../leads/entities/lead.entity';
import { config } from 'dotenv';

config();

const dataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'leads_db',
  entities: [Lead],
  synchronize: false,
});

const seedLeads: Partial<Lead>[] = [
  {
    nombre: 'María García',
    email: 'maria.garcia@ejemplo.com',
    telefono: '+573001234567',
    fuente: LeadSource.INSTAGRAM,
    producto_interes: 'Curso de copywriting',
    presupuesto: 350,
  },
  {
    nombre: 'Carlos Rodríguez',
    email: 'carlos.rodriguez@ejemplo.com',
    telefono: '+573009876543',
    fuente: LeadSource.FACEBOOK,
    producto_interes: 'Ebook de marketing digital',
    presupuesto: 150,
  },
  {
    nombre: 'Ana Martínez',
    email: 'ana.martinez@ejemplo.com',
    fuente: LeadSource.LANDING_PAGE,
    producto_interes: 'Mentoría personalizada',
    presupuesto: 1200,
  },
  {
    nombre: 'Juan López',
    email: 'juan.lopez@ejemplo.com',
    telefono: '+573005551234',
    fuente: LeadSource.REFERIDO,
    producto_interes: 'Pack de plantillas',
    presupuesto: 80,
  },
  {
    nombre: 'Laura Sánchez',
    email: 'laura.sanchez@ejemplo.com',
    fuente: LeadSource.INSTAGRAM,
    producto_interes: 'Curso de copywriting',
    presupuesto: 350,
  },
  {
    nombre: 'Pedro Hernández',
    email: 'pedro.hernandez@ejemplo.com',
    telefono: '+573007778899',
    fuente: LeadSource.FACEBOOK,
    producto_interes: 'Consultoría de marca',
    presupuesto: 500,
  },
  {
    nombre: 'Sofía Torres',
    email: 'sofia.torres@ejemplo.com',
    fuente: LeadSource.LANDING_PAGE,
    producto_interes: 'Curso de embudos de venta',
    presupuesto: 450,
  },
  {
    nombre: 'Diego Ramírez',
    email: 'diego.ramirez@ejemplo.com',
    telefono: '+573003334455',
    fuente: LeadSource.OTRO,
    producto_interes: 'Ebook de marketing digital',
    presupuesto: 150,
  },
  {
    nombre: 'Valentina Flores',
    email: 'valentina.flores@ejemplo.com',
    fuente: LeadSource.INSTAGRAM,
    producto_interes: 'Mentoría personalizada',
    presupuesto: 1200,
  },
  {
    nombre: 'Andrés Morales',
    email: 'andres.morales@ejemplo.com',
    telefono: '+573006667788',
    fuente: LeadSource.REFERIDO,
    producto_interes: 'Pack de plantillas',
    presupuesto: 80,
  },
  {
    nombre: 'Camila Vargas',
    email: 'camila.vargas@ejemplo.com',
    fuente: LeadSource.FACEBOOK,
    producto_interes: 'Curso de copywriting',
    presupuesto: 350,
  },
  {
    nombre: 'Santiago Díaz',
    email: 'santiago.diaz@ejemplo.com',
    telefono: '+573002223344',
    fuente: LeadSource.LANDING_PAGE,
    presupuesto: 600,
  },
];

async function seed() {
  await dataSource.initialize();
  console.log('Conexión a la base de datos establecida');

  const leadRepository = dataSource.getRepository(Lead);

  for (const leadData of seedLeads) {
    const existing = await leadRepository.findOne({
      where: { email: leadData.email },
    });

    if (!existing) {
      const lead = leadRepository.create(leadData);
      await leadRepository.save(lead);
      console.log(`Lead creado: ${leadData.nombre} (${leadData.email})`);
    } else {
      console.log(`Lead ya existe: ${leadData.email} — omitido`);
    }
  }

  console.log('\nSeed completado exitosamente');
  await dataSource.destroy();
}

seed().catch((error) => {
  console.error('Error en seed:', error);
  process.exit(1);
});
