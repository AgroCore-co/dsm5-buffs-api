# Requisitos de Banco de Dados - IAR/IVR

## ⚠️ CAMPOS OBRIGATÓRIOS

### Tabela: `dadosreproducao`

**Para IVR funcionar, é OBRIGATÓRIO:**

```sql
-- Verificar se campo existe:
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dadosreproducao' 
  AND column_name IN ('diagnostico_gestacao', 'id_semen', 'id_touro');
```

**Campo necessário:**
- `diagnostico_gestacao` (ENUM ou TEXT): Valores possíveis: 'Positivo', 'Negativo', 'Pendente'
- `id_semen` (UUID): Referência ao material genético/reprodutor
- `id_touro` (UUID): Referência direta ao búfalo reprodutor (alternativa)

**Se não existir, criar:**

```sql
-- Opção 1: ENUM tipado
CREATE TYPE diagnostico_enum AS ENUM ('Positivo', 'Negativo', 'Pendente');
ALTER TABLE dadosreproducao 
  ADD COLUMN diagnostico_gestacao diagnostico_enum;

-- Opção 2: TEXT com constraint
ALTER TABLE dadosreproducao 
  ADD COLUMN diagnostico_gestacao TEXT 
  CHECK (diagnostico_gestacao IN ('Positivo', 'Negativo', 'Pendente'));
```

## 📊 Queries para IAR (Fêmeas)

### 1. Buscar fêmeas elegíveis

```sql
SELECT 
  b.id_bufalo,
  b.nome,
  b.brinco,
  b.dt_nascimento,
  b.status,
  r.nome as raca_nome
FROM bufalo b
LEFT JOIN raca r ON b.id_raca = r.id_raca
WHERE b.id_propriedade = $1
  AND b.sexo = 'Fêmea'
  AND b.status = TRUE
  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, b.dt_nascimento)) * 12 + 
      EXTRACT(MONTH FROM AGE(CURRENT_DATE, b.dt_nascimento)) >= 18
ORDER BY b.nome;
```

### 2. Buscar ciclo ativo da fêmea

```sql
SELECT 
  id_ciclolactacao,
  dt_parto,
  status,
  dt_secagem
FROM ciclolactacao
WHERE id_bufala = $1
  AND (status = 'Em Lactação' OR (status = 'Seca' AND dt_secagem >= CURRENT_DATE - INTERVAL '60 days'))
ORDER BY dt_parto DESC
LIMIT 1;
```

### 3. Contar ciclos totais (partos históricos)

```sql
SELECT COUNT(*) as total
FROM ciclolactacao
WHERE id_bufala = $1;
```

### 4. Calcular IEP médio (Intervalo Entre Partos)

```sql
WITH ciclos_ordenados AS (
  SELECT 
    dt_parto,
    LAG(dt_parto) OVER (ORDER BY dt_parto) as dt_parto_anterior
  FROM ciclolactacao
  WHERE id_bufala = $1
  ORDER BY dt_parto
)
SELECT 
  AVG(EXTRACT(EPOCH FROM (dt_parto - dt_parto_anterior)) / 86400)::INTEGER as iep_medio_dias
FROM ciclos_ordenados
WHERE dt_parto_anterior IS NOT NULL;
```

## 📊 Queries para IVR (Machos)

### 1. Buscar machos elegíveis

```sql
SELECT 
  b.id_bufalo,
  b.nome,
  b.brinco,
  b.dt_nascimento,
  b.categoria,
  b.status,
  r.nome as raca_nome
FROM bufalo b
LEFT JOIN raca r ON b.id_raca = r.id_raca
WHERE b.id_propriedade = $1
  AND b.sexo = 'Macho'
  AND b.status = TRUE
  AND EXTRACT(YEAR FROM AGE(CURRENT_DATE, b.dt_nascimento)) * 12 + 
      EXTRACT(MONTH FROM AGE(CURRENT_DATE, b.dt_nascimento)) >= 24
ORDER BY b.nome;
```

### 2. Estatísticas do touro (individual)

**⚠️ DEPENDE DO MODELO:**

**Cenário A: Material Genético registrado em `materialgenetico`**

```sql
SELECT 
  COUNT(*) as total_coberturas,
  COUNT(*) FILTER (WHERE dr.diagnostico_gestacao = 'Positivo') as total_prenhezes,
  MAX(dr.dt_evento) as ultima_cobertura
FROM dadosreproducao dr
INNER JOIN materialgenetico mg ON dr.id_semen = mg.id_material_genetico
WHERE mg.id_bufalo_origem = $1  -- ID do touro
  AND dr.diagnostico_gestacao IS NOT NULL;
```

**Cenário B: Campo direto `id_touro` em `dadosreproducao`**

```sql
SELECT 
  COUNT(*) as total_coberturas,
  COUNT(*) FILTER (WHERE diagnostico_gestacao = 'Positivo') as total_prenhezes,
  MAX(dt_evento) as ultima_cobertura
FROM dadosreproducao
WHERE id_touro = $1
  AND diagnostico_gestacao IS NOT NULL;
```

### 3. Estatísticas do rebanho (média global)

```sql
SELECT 
  COUNT(*) as total_coberturas,
  COUNT(*) FILTER (WHERE diagnostico_gestacao = 'Positivo') as total_prenhezes,
  (COUNT(*) FILTER (WHERE diagnostico_gestacao = 'Positivo')::FLOAT / 
   NULLIF(COUNT(*), 0) * 100) as mr_tc
FROM dadosreproducao
WHERE id_propriedade = $1
  AND diagnostico_gestacao IS NOT NULL;
```

## 🔍 Verificações de Integridade

### Verificar dados de diagnóstico existentes

```sql
-- Quantas coberturas TÊM diagnóstico?
SELECT 
  COUNT(*) FILTER (WHERE diagnostico_gestacao IS NOT NULL) as com_diagnostico,
  COUNT(*) as total,
  ROUND(COUNT(*) FILTER (WHERE diagnostico_gestacao IS NOT NULL)::NUMERIC / 
        NULLIF(COUNT(*), 0) * 100, 2) as percentual
FROM dadosreproducao;

-- Distribuição dos diagnósticos
SELECT 
  diagnostico_gestacao,
  COUNT(*) as quantidade
FROM dadosreproducao
WHERE diagnostico_gestacao IS NOT NULL
GROUP BY diagnostico_gestacao;
```

### Verificar associação reprodutor→cobertura

```sql
-- Se usar tabela intermediária 'materialgenetico'
SELECT 
  b.nome as reprodutor,
  COUNT(DISTINCT dr.id_dados_reproducao) as total_coberturas
FROM bufalo b
INNER JOIN materialgenetico mg ON b.id_bufalo = mg.id_bufalo_origem
INNER JOIN dadosreproducao dr ON mg.id_material_genetico = dr.id_semen
WHERE b.sexo = 'Macho'
GROUP BY b.id_bufalo, b.nome
ORDER BY total_coberturas DESC
LIMIT 10;
```

## 🚨 Problemas Comuns

### Problema 1: Campo `diagnostico_gestacao` não existe

**Sintoma:** Erro "column 'diagnostico_gestacao' does not exist"

**Solução:** Executar migration para adicionar campo (ver SQL acima)

### Problema 2: Nenhuma cobertura tem diagnóstico preenchido

**Sintoma:** IVR sempre retorna score 50 (valor padrão)

**Solução temporária:**
```typescript
// No service, verificar antes:
if (totalCoberturas === 0) {
  return {
    ...dadosReprodutivosPadrao,
    confiabilidade: 'Sem Dados',
  };
}
```

**Solução definitiva:** Popular dados históricos ou desabilitar IVR até ter diagnósticos

### Problema 3: Não há associação touro→cobertura

**Sintoma:** Todos touros aparecem com 0 coberturas

**Verificação:**
```sql
-- Checar se há coberturas registradas
SELECT COUNT(*) FROM dadosreproducao;

-- Checar se campo id_semen está preenchido
SELECT COUNT(*) FILTER (WHERE id_semen IS NOT NULL) as com_semen,
       COUNT(*) as total
FROM dadosreproducao;
```

**Solução:** Revisar modelo de dados. Alternativas:
1. Usar `id_touro` diretamente em `dadosreproducao`
2. Usar tabela `materialgenetico` como ponte
3. Inferir paternidade via `id_pai` na tabela `bufalo` (limitado a partos confirmados)

## 📌 Modelo Recomendado

```sql
-- Estrutura ideal para IVR:
CREATE TABLE dadosreproducao (
  id_dados_reproducao UUID PRIMARY KEY,
  id_bufala UUID REFERENCES bufalo(id_bufalo), -- Fêmea coberta
  id_touro UUID REFERENCES bufalo(id_bufalo),   -- Reprodutor (direto)
  id_semen UUID REFERENCES materialgenetico(id_material_genetico), -- Opcional
  dt_evento DATE NOT NULL,                      -- Data da cobertura/IA
  tipo_evento TEXT NOT NULL,                    -- 'Cobertura' ou 'Inseminação'
  diagnostico_gestacao TEXT,                    -- 'Positivo', 'Negativo', 'Pendente'
  dt_diagnostico DATE,                          -- Data do diagnóstico
  observacoes TEXT,
  id_propriedade UUID NOT NULL REFERENCES propriedade(id_propriedade),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX idx_dadosreproducao_touro ON dadosreproducao(id_touro);
CREATE INDEX idx_dadosreproducao_bufala ON dadosreproducao(id_bufala);
CREATE INDEX idx_dadosreproducao_prop ON dadosreproducao(id_propriedade);
```

## ✅ Checklist de Implementação

- [ ] Verificar existência de `diagnostico_gestacao`
- [ ] Verificar existência de `id_touro` ou `id_semen`
- [ ] Testar query de estatísticas do touro (retorna resultados?)
- [ ] Testar query de estatísticas do rebanho (MR_TC calculado?)
- [ ] Popular dados históricos se necessário
- [ ] Adicionar validação no service para casos sem dados
- [ ] Documentar no README limitações se diagnóstico não disponível
