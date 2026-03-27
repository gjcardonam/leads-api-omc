import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Leads API (e2e)', () => {
  let app: INestApplication;
  let createdLeadId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /leads — debería crear un lead', async () => {
    const res = await request(app.getHttpServer())
      .post('/leads')
      .send({
        nombre: 'Test User',
        email: `test-${Date.now()}@ejemplo.com`,
        fuente: 'instagram',
        producto_interes: 'Curso de prueba',
        presupuesto: 100,
      })
      .expect(201);

    expect(res.body).toHaveProperty('id');
    expect(res.body.nombre).toBe('Test User');
    createdLeadId = res.body.id;
  });

  it('POST /leads — debería rechazar email duplicado', async () => {
    const email = `dup-${Date.now()}@ejemplo.com`;

    await request(app.getHttpServer())
      .post('/leads')
      .send({ nombre: 'Dup Test', email, fuente: 'facebook' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/leads')
      .send({ nombre: 'Dup Test 2', email, fuente: 'instagram' })
      .expect(409);
  });

  it('POST /leads — debería validar campos requeridos', async () => {
    const res = await request(app.getHttpServer())
      .post('/leads')
      .send({ email: 'noname@test.com' })
      .expect(400);

    expect(res.body.message).toBeDefined();
  });

  it('GET /leads — debería listar leads con paginación', async () => {
    const res = await request(app.getHttpServer())
      .get('/leads?page=1&limit=5')
      .expect(200);

    expect(res.body).toHaveProperty('data');
    expect(res.body).toHaveProperty('meta');
    expect(Array.isArray(res.body.data)).toBe(true);
    expect(res.body.meta).toHaveProperty('total');
    expect(res.body.meta).toHaveProperty('page');
  });

  it('GET /leads/:id — debería obtener un lead', async () => {
    if (!createdLeadId) return;

    const res = await request(app.getHttpServer())
      .get(`/leads/${createdLeadId}`)
      .expect(200);

    expect(res.body.id).toBe(createdLeadId);
  });

  it('PATCH /leads/:id — debería actualizar un lead', async () => {
    if (!createdLeadId) return;

    const res = await request(app.getHttpServer())
      .patch(`/leads/${createdLeadId}`)
      .send({ producto_interes: 'Curso actualizado' })
      .expect(200);

    expect(res.body.producto_interes).toBe('Curso actualizado');
  });

  it('GET /leads/stats — debería retornar estadísticas', async () => {
    const res = await request(app.getHttpServer())
      .get('/leads/stats')
      .expect(200);

    expect(res.body).toHaveProperty('total_leads');
    expect(res.body).toHaveProperty('leads_por_fuente');
    expect(res.body).toHaveProperty('promedio_presupuesto');
    expect(res.body).toHaveProperty('leads_ultimos_7_dias');
  });

  it('DELETE /leads/:id — debería eliminar (soft delete) un lead', async () => {
    if (!createdLeadId) return;

    await request(app.getHttpServer())
      .delete(`/leads/${createdLeadId}`)
      .expect(200);

    await request(app.getHttpServer())
      .get(`/leads/${createdLeadId}`)
      .expect(404);
  });
});
