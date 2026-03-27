import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Lead } from '../leads/entities/lead.entity';

/**
 * Interfaz para proveedores de IA.
 * Permite intercambiar fácilmente entre OpenAI, Anthropic o un mock.
 */
export interface AiProvider {
  generateSummary(prompt: string): Promise<string>;
}

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: string;

  constructor(private readonly configService: ConfigService) {
    this.provider = this.configService.get<string>('AI_PROVIDER', 'mock');
  }

  async generateLeadsSummary(leads: Lead[]): Promise<string> {
    if (leads.length === 0) {
      return 'No se encontraron leads con los filtros proporcionados.';
    }

    const prompt = this.buildPrompt(leads);

    switch (this.provider) {
      case 'openai':
        return this.callOpenAI(prompt);
      case 'anthropic':
        return this.callAnthropic(prompt);
      case 'mock':
      default:
        return this.mockResponse(leads);
    }
  }

  private buildPrompt(leads: Lead[]): string {
    const sourceCounts: Record<string, number> = {};
    let totalBudget = 0;
    let budgetCount = 0;
    const products: string[] = [];

    for (const lead of leads) {
      sourceCounts[lead.fuente] = (sourceCounts[lead.fuente] || 0) + 1;
      if (lead.presupuesto) {
        totalBudget += Number(lead.presupuesto);
        budgetCount++;
      }
      if (lead.producto_interes) {
        products.push(lead.producto_interes);
      }
    }

    return `Analiza los siguientes datos de leads de marketing y genera un resumen ejecutivo en español:

- Total de leads: ${leads.length}
- Distribución por fuente: ${JSON.stringify(sourceCounts)}
- Presupuesto promedio: $${budgetCount > 0 ? (totalBudget / budgetCount).toFixed(2) : '0'} USD
- Productos de interés: ${[...new Set(products)].join(', ') || 'No especificados'}

Genera:
1. Un análisis general del estado de los leads
2. Cuál es la fuente principal de captación y qué significa
3. Recomendaciones accionables para mejorar la conversión`;
  }

  /**
   * Integración con OpenAI (requiere OPENAI_API_KEY en .env)
   */
  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn('OPENAI_API_KEY no configurada, usando mock');
      return this.mockResponseFromPrompt(prompt);
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content:
              'Eres un analista de marketing digital experto. Genera resúmenes ejecutivos concisos y accionables.',
          },
          { role: 'user', content: prompt },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    return data.choices?.[0]?.message?.content || 'No se pudo generar el resumen.';
  }

  /**
   * Integración con Anthropic (requiere ANTHROPIC_API_KEY en .env)
   */
  private async callAnthropic(prompt: string): Promise<string> {
    const apiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    if (!apiKey) {
      this.logger.warn('ANTHROPIC_API_KEY no configurada, usando mock');
      return this.mockResponseFromPrompt(prompt);
    }

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    const data = await response.json();
    return (
      data.content?.[0]?.text || 'No se pudo generar el resumen.'
    );
  }

  /**
   * Mock: genera un resumen realista sin necesidad de API key.
   * La arquitectura está preparada para cambiar AI_PROVIDER a 'openai' o 'anthropic'.
   */
  private mockResponse(leads: Lead[]): string {
    const sourceCounts: Record<string, number> = {};
    let totalBudget = 0;
    let budgetCount = 0;

    for (const lead of leads) {
      sourceCounts[lead.fuente] = (sourceCounts[lead.fuente] || 0) + 1;
      if (lead.presupuesto) {
        totalBudget += Number(lead.presupuesto);
        budgetCount++;
      }
    }

    const topSource = Object.entries(sourceCounts).sort(
      (a, b) => b[1] - a[1],
    )[0];

    const avgBudget = budgetCount > 0 ? (totalBudget / budgetCount).toFixed(2) : '0';

    return `📊 RESUMEN EJECUTIVO DE LEADS
================================

📈 Análisis General:
Se analizaron ${leads.length} leads en el período seleccionado. El presupuesto promedio es de $${avgBudget} USD, lo que indica un nivel de inversión ${Number(avgBudget) > 500 ? 'alto' : Number(avgBudget) > 200 ? 'moderado' : 'inicial'} por parte de los prospectos.

🎯 Fuente Principal:
La fuente con mayor captación es "${topSource?.[0] || 'N/A'}" con ${topSource?.[1] || 0} leads (${leads.length > 0 ? ((topSource?.[1] || 0) / leads.length * 100).toFixed(1) : 0}% del total). Esto sugiere que la estrategia en este canal está generando buenos resultados.

Distribución por fuente:
${Object.entries(sourceCounts)
  .map(([source, count]) => `  - ${source}: ${count} leads (${((count / leads.length) * 100).toFixed(1)}%)`)
  .join('\n')}

💡 Recomendaciones:
1. Aumentar la inversión en "${topSource?.[0] || 'N/A'}" ya que es el canal con mejor rendimiento.
2. Revisar la estrategia en los canales con menor captación para identificar oportunidades de mejora.
3. Implementar seguimiento personalizado para leads con presupuesto superior a $${avgBudget} USD.
4. Considerar campañas de retargeting para leads sin producto de interés definido.

⚠️ Nota: Este resumen fue generado con el proveedor mock. Configure AI_PROVIDER=openai o AI_PROVIDER=anthropic en .env para usar un LLM real.`;
  }

  private mockResponseFromPrompt(prompt: string): string {
    return `[Mock] Resumen generado a partir del análisis:\n\n${prompt}\n\nNota: Configure una API key válida para obtener un análisis real con IA.`;
  }
}
