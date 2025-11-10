# Endpoints de Recomendação de Acasalamentos

## 📋 Visão Geral

Implementação de dois novos endpoints para ranqueamento e recomendação de animais para acasalamento, movendo a lógica do frontend para o backend.

## 🎯 Objetivo

- Centralizar cálculo de prioridade no backend
- Reduzir carga e complexidade no frontend
- Garantir critérios consistentes e validados
- Facilitar manutenção e ajustes futuros

---

## 🐃 Endpoint 1: Recomendações de Fêmeas

### **GET** `/cobertura/recomendacoes/femeas/:id_propriedade`

Retorna lista ranqueada de fêmeas recomendadas para acasalamento com base em critérios zootécnicos.

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id_propriedade` | UUID (path) | ✅ Sim | ID da propriedade |
| `limit` | Number (query) | ❌ Não | Limitar resultados (ex: top 10) |

### Exemplo de Request

```bash
GET /cobertura/recomendacoes/femeas/f47ac10b-58cc-4372-a567-0e02b2c3d479?limit=10
Authorization: Bearer {token}
```

### Exemplo de Response

```json
[
  {
    "id_bufalo": "a1b2c3d4-1234-5678-9012-345678901234",
    "nome": "Valente",
    "brinco": "BR-54321",
    "idade_meses": 48,
    "raca": "Jafarabadi",
    "dados_reprodutivos": {
      "ultima_cobertura": "2024-05-15",
      "dias_desde_ultima_cobertura": 180,
      "ciclo_atual": {
        "numero_ciclo": 3,
        "dias_em_lactacao": 210,
        "status": "Em Lactação"
      },
      "status_reprodutivo": "Disponível"
    },
    "score": 85,
    "motivos": [
      {
        "categoria": "Experiência Reprodutiva",
        "descricao": "Fêmea experiente com 3 ciclos de lactação",
        "pontos": 45
      },
      {
        "categoria": "Intervalo Reprodutivo",
        "descricao": "Período ideal desde última cobertura (180 dias)",
        "pontos": 25
      },
      {
        "categoria": "Idade Reprodutiva",
        "descricao": "Idade produtiva ideal (48 meses = 4 anos)",
        "pontos": 20
      },
      {
        "categoria": "Status Reprodutivo",
        "descricao": "Sem restrições - apta para cobertura imediata",
        "pontos": 15
      },
      {
        "categoria": "Status de Lactação",
        "descricao": "Lactação avançada (210 dias) - momento favorável",
        "pontos": 10
      }
    ]
  }
]
```

### Critérios de Pontuação (Score 0-100)

#### 1. **Experiência Reprodutiva** (0-50 pontos)
- **Base para fêmeas com histórico:** +30 pontos
- **Bônus por ciclo:** +5 pontos/ciclo (máximo +20)
- **Exemplo:** 3 ciclos = 30 + (3 × 5) = 45 pontos

#### 2. **Intervalo Reprodutivo** (0-25 pontos)
- **60-180 dias (ideal):** +25 pontos
  - Período adequado para nova cobertura
- **181-365 dias:** +15 pontos
  - Ainda um bom intervalo
- **>365 dias:** +10 pontos
  - Muito tempo sem cobertura, avaliar condição
- **Primeira cobertura (24-48 meses):** +20 pontos
  - Idade ideal para primeira gestação

#### 3. **Idade Ideal** (0-20 pontos)
- **36-120 meses (3-10 anos):** +20 pontos
  - Fase produtiva ideal
- **24-35 meses (2-3 anos):** +15 pontos
  - Jovem, mas apta
- **121-144 meses (10-12 anos):** +10 pontos
  - Idade avançada, mas ainda produtiva

#### 4. **Ausência de Restrições** (0-15 pontos)
- **Status "Disponível":** +15 pontos
  - Sem impedimentos para cobertura
- **Outras condições:** 0 pontos
  - Ex: "Período Pós-Parto", "Aguardando Diagnóstico"

#### 5. **Status de Lactação** (0-10 pontos)
- **180+ dias em lactação:** +10 pontos
  - Momento favorável para nova gestação
  - Produção estabilizada

### Regras de Elegibilidade

Apenas fêmeas que atendem os seguintes critérios são incluídas:
- ✅ Idade mínima: **18 meses**
- ✅ Status ativo: **true**
- ✅ Sexo: **F** (fêmea)
- ✅ Vinculada à propriedade especificada

---

## 🐂 Endpoint 2: Recomendações de Machos

### **GET** `/cobertura/recomendacoes/machos/:id_propriedade`

Retorna lista ranqueada de machos recomendados para acasalamento.

⚠️ **NOTA:** Critérios ainda em validação técnica. Podem ser ajustados conforme orientação zootécnica.

### Parâmetros

| Parâmetro | Tipo | Obrigatório | Descrição |
|-----------|------|-------------|-----------|
| `id_propriedade` | UUID (path) | ✅ Sim | ID da propriedade |
| `limit` | Number (query) | ❌ Não | Limitar resultados (ex: top 5) |

### Exemplo de Request

```bash
GET /cobertura/recomendacoes/machos/f47ac10b-58cc-4372-a567-0e02b2c3d479?limit=5
Authorization: Bearer {token}
```

### Exemplo de Response

```json
[
  {
    "id_bufalo": "b2c3d4e5-2345-6789-0123-456789012345",
    "nome": "Imperador",
    "brinco": "TR-001",
    "idade_meses": 60,
    "raca": "Murrah",
    "categoria_abcb": "PO",
    "dados_reprodutivos": {
      "total_coberturas": 15,
      "coberturas_bem_sucedidas": 12,
      "taxa_sucesso": 80,
      "ultima_cobertura": "2025-09-01",
      "dias_desde_ultima_cobertura": 70
    },
    "score": 88,
    "motivos": [
      {
        "categoria": "Idade e Maturidade",
        "descricao": "Idade ideal para reprodução (60 meses = 5 anos)",
        "pontos": 25
      },
      {
        "categoria": "Histórico de Acasalamentos",
        "descricao": "Realizou 15 coberturas",
        "pontos": 25
      },
      {
        "categoria": "Taxa de Sucesso",
        "descricao": "Excelente taxa de sucesso (80%)",
        "pontos": 30
      },
      {
        "categoria": "Intervalo de Descanso",
        "descricao": "Período adequado de descanso (70 dias)",
        "pontos": 10
      },
      {
        "categoria": "Qualidade Genética",
        "descricao": "Puro de Origem (PO) - excelente genética",
        "pontos": 10
      }
    ]
  }
]
```

### Critérios de Pontuação (Score 0-100)

#### 1. **Idade e Maturidade** (0-25 pontos)
- **36-96 meses (3-8 anos):** +25 pontos
  - Idade ideal para reprodução
- **24-35 meses (2-3 anos):** +20 pontos
  - Jovem reprodutor
- **97-144 meses (8-12 anos):** +15 pontos
  - Reprodutor experiente

#### 2. **Histórico de Acasalamentos** (0-25 pontos)
- **10+ coberturas:** +25 pontos
- **5-9 coberturas:** +20 pontos
- **1-4 coberturas:** +15 pontos
- **Nenhuma:** 0 pontos (primeiro acasalamento)

#### 3. **Taxa de Sucesso** (0-30 pontos) ⭐ *Critério mais importante*
- **≥75%:** +30 pontos (Excelente)
- **60-74%:** +25 pontos (Boa)
- **40-59%:** +15 pontos (Regular)
- **<40%:** +5 pontos (Baixa)

Taxa de sucesso = (coberturas que resultaram em parto) / (total de coberturas) × 100

#### 4. **Intervalo de Descanso** (0-10 pontos)
- **≥30 dias:** +10 pontos
  - Descanso adequado
- **15-29 dias:** +5 pontos
  - Descanso mínimo
- **<15 dias:** 0 pontos
  - Considerar período maior de descanso
- **Primeiro acasalamento:** +10 pontos

#### 5. **Qualidade Genética - ABCB** (0-10 pontos)
- **PO (Puro de Origem):** +10 pontos
- **PC (Puro por Cruzamento):** +8 pontos
- **PA (Puro por Absorção):** +6 pontos
- **CCG (Controle de Cruzamento):** +4 pontos
- **Outras categorias:** +2 pontos

### Regras de Elegibilidade

Apenas machos que atendem os seguintes critérios são incluídos:
- ✅ Idade mínima: **24 meses**
- ✅ Status ativo: **true**
- ✅ Sexo: **M** (macho)
- ✅ Vinculada à propriedade especificada

### Observações sobre Machos

1. **Histórico de Coberturas:**
   - Coberturas via material genético (IA/TE) na tabela `dadosreproducao`
   - Coberturas via monta natural (filhos registrados com `id_pai`)

2. **Taxa de Sucesso:**
   - Considera apenas partos bem-sucedidos (exclui abortos)
   - Calculada sobre o total de coberturas registradas

3. **Critérios em Validação:**
   - Os pesos e faixas podem ser ajustados
   - Sugestões de melhoria são bem-vindas
   - Considerar adicionar: fertilidade, libido, qualidade seminal (se disponível)

---

## 🔄 Migração do Frontend

### Antes (Frontend)

```javascript
// Frontend calculava score manualmente
const calcularScore = (femea) => {
  let score = 0;
  
  if (femea.ciclo_atual && femea.ciclo_atual.numero_ciclo > 0) {
    score += 30;
    score += Math.min(femea.ciclo_atual.numero_ciclo * 5, 20);
  }
  // ... mais lógica ...
  
  return score;
};

const femeasOrdenadas = femeas
  .map((f) => ({ ...f, score: calcularScore(f) }))
  .sort((a, b) => b.score - a.score);
```

### Depois (Backend)

```javascript
// Frontend apenas consome o endpoint
const femeasRecomendadas = await coberturaService.getRecomendacoesFemeas(
  propriedadeId,
  10 // top 10
);

// Já vem ordenado e com score calculado
console.log(femeasRecomendadas[0].score); // 85
console.log(femeasRecomendadas[0].motivos); // Array de motivos
```

### Vantagens

✅ **Performance:** Cálculo no servidor (mais rápido)  
✅ **Consistência:** Mesma lógica para todos os clientes  
✅ **Manutenibilidade:** Ajustes centralizados  
✅ **Transparência:** Motivos explicam o score  
✅ **Escalabilidade:** Reduz carga no cliente

---

## 🧪 Testes

### Teste 1: Listar Top 10 Fêmeas

```bash
curl -X GET "http://localhost:3000/cobertura/recomendacoes/femeas/{id_propriedade}?limit=10" \
  -H "Authorization: Bearer {token}"
```

**Validar:**
- ✅ Retorna no máximo 10 resultados
- ✅ Ordenados por score (decrescente)
- ✅ Cada item tem `score` e `motivos`
- ✅ Apenas fêmeas ativas com 18+ meses

### Teste 2: Listar Todos os Machos

```bash
curl -X GET "http://localhost:3000/cobertura/recomendacoes/machos/{id_propriedade}" \
  -H "Authorization: Bearer {token}"
```

**Validar:**
- ✅ Retorna todos machos elegíveis
- ✅ Ordenados por score (decrescente)
- ✅ Taxa de sucesso calculada corretamente
- ✅ Apenas machos ativos com 24+ meses

### Teste 3: Propriedade Sem Animais

```bash
curl -X GET "http://localhost:3000/cobertura/recomendacoes/femeas/{id_propriedade_vazia}" \
  -H "Authorization: Bearer {token}"
```

**Esperado:**
```json
[]
```

### Teste 4: Validar Motivos

Verificar se os motivos justificam o score:

```javascript
// Score deve ser igual à soma dos pontos
const somaMotivos = femea.motivos.reduce((sum, m) => sum + m.pontos, 0);
console.assert(somaMotivos === femea.score, 'Score inconsistente!');
```

---

## 📊 Exemplo de Uso no Frontend

### React/Next.js

```jsx
import { useState, useEffect } from 'react';
import { coberturaService } from '@/services/coberturaService';

function RecomendacoesAcasalamento({ propriedadeId }) {
  const [femeas, setFemeas] = useState([]);
  const [machos, setMachos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchRecomendacoes() {
      try {
        const [femeaData, machoData] = await Promise.all([
          coberturaService.getRecomendacoesFemeas(propriedadeId, 10),
          coberturaService.getRecomendacoesMachos(propriedadeId, 5)
        ]);
        
        setFemeas(femeaData);
        setMachos(machoData);
      } catch (error) {
        console.error('Erro ao buscar recomendações:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchRecomendacoes();
  }, [propriedadeId]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div>
      <h2>Top 10 Fêmeas Recomendadas</h2>
      {femeas.map((femea, index) => (
        <div key={femea.id_bufalo} className="card">
          <span className="rank">#{index + 1}</span>
          <h3>{femea.nome}</h3>
          <p>Brinco: {femea.brinco}</p>
          <div className="score">
            Score: <strong>{femea.score}</strong>/100
          </div>
          <ul>
            {femea.motivos.map((motivo, i) => (
              <li key={i}>
                <strong>{motivo.categoria}:</strong> {motivo.descricao}
                <span className="pontos">+{motivo.pontos} pts</span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2>Top 5 Machos Recomendados</h2>
      {machos.map((macho, index) => (
        <div key={macho.id_bufalo} className="card">
          <span className="rank">#{index + 1}</span>
          <h3>{macho.nome}</h3>
          <p>Brinco: {macho.brinco}</p>
          <p>Categoria: {macho.categoria_abcb}</p>
          <div className="score">
            Score: <strong>{macho.score}</strong>/100
          </div>
          <div className="stats">
            <p>Coberturas: {macho.dados_reprodutivos.total_coberturas}</p>
            <p>Taxa de Sucesso: {macho.dados_reprodutivos.taxa_sucesso}%</p>
          </div>
        </div>
      ))}
    </div>
  );
}
```

### Service

```typescript
// src/services/coberturaService.ts
class CoberturaService {
  async getRecomendacoesFemeas(idPropriedade: string, limit?: number) {
    const url = `/cobertura/recomendacoes/femeas/${idPropriedade}${
      limit ? `?limit=${limit}` : ''
    }`;
    
    const response = await api.get(url);
    return response.data;
  }

  async getRecomendacoesMachos(idPropriedade: string, limit?: number) {
    const url = `/cobertura/recomendacoes/machos/${idPropriedade}${
      limit ? `?limit=${limit}` : ''
    }`;
    
    const response = await api.get(url);
    return response.data;
  }
}

export const coberturaService = new CoberturaService();
```

---

## 🔮 Melhorias Futuras

### Curto Prazo
- [ ] Adicionar cache (5-10 min) para melhorar performance
- [ ] Criar filtros adicionais (idade, raça, maturidade)
- [ ] Implementar paginação para propriedades com muitos animais

### Médio Prazo
- [ ] Incluir histórico de saúde no cálculo
- [ ] Considerar consanguinidade para evitar endogamia
- [ ] Adicionar recomendações de acasalamento específico (macho X fêmea)

### Longo Prazo
- [ ] Implementar algoritmo de otimização genética
- [ ] Considerar objetivos de melhoramento (leite, carne, rusticidade)
- [ ] Integração com IA para predição de características da prole

---

## 📚 Referências Técnicas

### Critérios Zootécnicos

1. **Idade Primeira Cobertura:** 24-30 meses (búfalas)
2. **Intervalo Entre Partos (IEP):** 12-15 meses (ideal)
3. **Período Pós-Parto:** Mínimo 45-60 dias antes de nova cobertura
4. **Idade Maturidade Sexual Machos:** 18-24 meses
5. **Vida Reprodutiva:** Até 12-14 anos (ambos sexos)

### Documentação ABCB

- **PO (Puro de Origem):** 4+ gerações da mesma raça
- **PC (Puro por Cruzamento):** 3+ gerações
- **PA (Puro por Absorção):** Raça definida sem genealogia completa
- **CCG:** Mestiços com controle genealógico

---

## 📞 Suporte

Para dúvidas ou sugestões de melhoria nos critérios:
- Abrir issue no repositório
- Consultar equipe de zootecnia
- Revisar literatura técnica sobre reprodução bubalina

---

**Data de Implementação:** 10/11/2025  
**Versão:** 1.0.0  
**Status:** ✅ Implementado e Testado
