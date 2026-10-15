# ArchRay (ex-Oraclo) — PRD (Product Requirements Document)

> **Versão:** 0.3 · **Data:** 2026-10-14 · **Status:** v0.3 publicada (fase 1: vistas, editor manual, orçamento, GUT, painel e laudo)
> **Pasta:** `A:\Claude Code\Oraclo` · **Porta de dev:** 3022 · **Produção:** oraclo-app.vercel.app
> Histórico: a versão 0.2 (scan-to-BIM / nuvem de pontos) está em `docs/PRD-v0.2-scan-to-bim.md`.

---

## 1. O produto em uma frase

> **Mapa de danos com IA.**
> Aponte os danos sobre a imagem do imóvel — a IA ajuda a contornar e medir — e o
> orçamento e o laudo saem prontos.

O ArchRay é uma **central visual de diagnóstico de edificações existentes**: o imóvel
aparece na tela (fachadas retificadas, plantas, fotos 360°, modelo 3D opcional), os danos
são apontados em cima — à mão ou com ajuda da IA — e a plataforma calcula quantitativos,
**orçamento do tratamento**, prioridades e gera o **laudo de estado de conservação**.

**Por que mudou (0.2 → 0.3):** gerar nuvem de pontos exige hardware/GPU que não temos sem
custo. O valor para o cliente está no **diagnóstico que vira orçamento e laudo** — e isso
roda em qualquer computador, de graça.

**Princípios**
1. **Visual primeiro:** o imóvel é a interface. Tudo é apontado sobre a imagem.
2. **Manual + automático:** o profissional decide; a máquina mede, soma, sugere e documenta.
3. **Do dano ao orçamento:** cada dano tem preço de tratamento → orçamento automático.
4. **Leve e gratuito:** nada de processamento pesado no servidor; o que for "IA" roda no
   navegador ou em serviços gratuitos.

## 2. Para quem

| Público | Uso principal | Como paga |
|---|---|---|
| **Estúdios de restauro** (ex.: Estúdio Restaura) — cliente piloto | Laudo + mapa de danos + orçamento que vende a obra | Usa internamente e cobra o serviço do cliente final |
| **Engenheiros/arquitetos de inspeção predial e patologia** | Laudos de inspeção (ABNT NBR 16747), vistorias de condomínio, vistoria cautelar | Por laudo / assinatura (fase 2) |
| **Retrofit e manutenção predial** | Diagnóstico, orçamento e acompanhamento entre visitas | Assinatura / contrato |
| **Patrimônio** (dioceses, museus, órgãos) | Estado de conservação e monitoramento | Contrato de conservação |

## 3. Conceitos (modelo mental)

- **Projeto** — o imóvel (casa, prédio, igreja, galpão).
- **Área** — parte do imóvel (fachada norte, térreo, nave, cobertura…).
- **Vistoria** — uma visita numa data (vistoria inicial, monitoramento, obra). Agrupa as
  vistas e os danos daquele momento; permite comparar "antes × agora".
- **Vista** — a imagem-base onde se apontam danos, sempre **em escala**:
  - **Fachada retificada** — foto comum + 4 cliques nos cantos + 1 medida real → imagem
    plana em escala (correção de perspectiva no navegador).
  - **Planta baixa** — imagem/PDF da planta, calibrada por uma medida.
  - **Imagem em escala** — ortofoto vinda de outro software, drone, etc.
  - **Modelo 3D (opcional)** — GLB/PLY de apps gratuitos de celular (ex.: Scaniverse, que
    processa no próprio aparelho); gera ortofotos das paredes.
  - **Foto 360° (fase 2)** — tour com danos marcados nas paredes.
- **Dano** — ponto, linha ou área sobre uma vista, com tipo (biblioteca), gravidade,
  urgência, tendência (matriz **GUT**), causa, recomendação, fotos e medida automática.
- **Tratamento / preço** — cada tipo de dano tem um tratamento com preço unitário (R$/m²,
  R$/m ou R$/un.) na tabela do escritório.
- **Orçamento** — quantidade × preço de cada dano, somado por tipo e por área.
- **Laudo** — PDF do estado de conservação: identificação, resumo, vistas com danos,
  tabela de danos com prioridade GUT, recomendações e orçamento.

## 4. Funcionalidades

### 4.1 Painel do projeto (dashboard)
- Indicadores: danos, área afetada (m²), extensão de fissuras (m), orçamento estimado,
  urgentes (GUT alto).
- Vistas do imóvel em miniatura (clique abre o editor).
- Gráficos: custo e quantidade por tipo de dano; distribuição por gravidade; por área.
- Lista de prioridades (GUT), com acesso direto ao dano.
- Filtro por vistoria; botão **Gerar laudo**.

### 4.2 Vistas
- Fachada retificada (4 cantos + largura/altura real), planta (calibração por medida),
  imagem em escala, modelo 3D → ortofoto.
- Fotos de campo da vistoria pelo celular (com envio offline) — usadas para retificar e
  como fotos de detalhe dos danos.

### 4.3 Editor de danos (manual + IA)
- Manual: ponto, linha, área; ajuste de vértices; tipo, gravidade, urgência, tendência,
  causa, recomendação, observações; custo do dano em tempo real.
- IA (fase 2): **contornar com um clique** (segmentação SAM no navegador) e **sugestões de
  fissuras/manchas** para confirmar ou descartar.

### 4.4 Biblioteca de danos e tabela de preços
- Tipos padrão (já existentes) + preços de tratamento por organização, com unidade.

### 4.5 Orçamento e laudo
- Orçamento automático por vista, por vistoria e por projeto.
- Laudo PDF (A4) e pranchas de mapa de danos (A3, PDF/DXF — já existentes).

### 4.6 Fase 2+
- Contorno com IA e sugestões automáticas; foto 360°; comparação entre vistorias;
  tipos de dano personalizados; planos de conservação recorrentes; acesso do cliente final
  (leitor) ao laudo.

## 5. O que sai do produto (0.2 → 0.3)
- Pedido de modelo BIM, operação/parceiros e fila de modelagem.
- Processamento de fotogrametria (nuvem de pontos), roteiro de alvos/medidas de controle,
  relatório de precisão, captura por vídeo para 3D.
- Páginas globais de Capturas e Modelos BIM.
- Permanece como opcional: importar modelo 3D pronto e visualizador 3D (para gerar vistas).

## 6. Técnica
- Next.js 16 + Neon/Drizzle + Vercel (planos gratuitos); arquivos no Vercel Blob.
- Retificação: homografia de 4 pontos calculada e aplicada no navegador (canvas).
- PDF com pdf-lib; DXF com @tarikjabiri/dxf (já existentes).
- IA no navegador (fase 2): modelos ONNX/Transformers.js (ex.: SlimSAM/MobileSAM).

## 7. Validação
1. Medir com o Estúdio Restaura o tempo atual de um mapa de danos com orçamento.
2. Fazer 2–3 trabalhos reais no ArchRay e comparar tempo e conversão em obra.
3. Entrevistar 5–10 profissionais (restauro e inspeção predial) sobre frequência, tempo e
   quanto pagariam por laudo.
