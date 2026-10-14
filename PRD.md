# Oraclo — PRD (Product Requirements Document)

> **Versão:** 0.2 · **Data:** 2026-10-14 · **Status:** em construção (MVP no ar em oraclo-app.vercel.app)
> **Pasta:** `A:\Claude Code\Oraclo` · **Porta de dev:** 3022

> **Revisão 0.2 — reposicionamento (2026-10-14).** O objetivo deixou de ser documentação de
> patrimônio histórico e passou a ser **scan-to-BIM para qualquer edificação**, como a Teiva:
> **o cliente envia a nuvem de pontos (ou captura com o celular, drone ou laser) e o Oraclo
> entrega o modelo BIM** em **Revit (RVT), Archicad (PLN) e IFC aberto**. Mercado: **reforma,
> retrofit, indústria**, varejo, corporativo, institucional e também patrimônio (HBIM).
> A modelagem é feita por **equipe própria e parceiros**. Mapa de danos, ortofotos e pranchas
> continuam como entregáveis complementares. As seções 2–3 e 5.6–5.7 foram reescritas; o
> restante do documento (escrito para o foco anterior) segue válido onde não conflitar.

---

## 1. Visão

**O Oraclo é a plataforma "do scan ao BIM".** Arquitetos, engenheiros, construtoras,
indústrias e gestores de imóveis trazem a realidade construída — capturada com o
**celular (fotos ou vídeo)**, drone ou laser scanner — e recebem **nuvem de pontos, modelo
BIM, ortofotos e documentação**, num só lugar.

> Em uma frase: **captura (ou nuvem) → nuvem de pontos validada → modelo BIM (RVT/PLN/IFC)
> → medição, ortofotos e documentação**, com acompanhamento de cada pedido na plataforma.

**Princípio de produto: plataforma completa e agnóstica de origem.** O celular é a porta
de entrada barata, mas o Oraclo **importa, converte e integra tudo** o que uma empresa de
levantamento entrega hoje — laser scanner terrestre, LiDAR aéreo e fotogrametria de
drone, nuvem de pontos, BIM (Revit/Archicad/IFC), CAD (DWG/DXF), levantamento cadastral,
as-built por fases e planialtimétrico georreferenciado em SIRGAS 2000. Ver seção 5.4.

### Diferença em relação ao mercado

| | Empresas de scan-to-BIM (ex.: Teiva) | Apps de celular (Polycam, Scaniverse, Matterport) | **Oraclo** |
|---|---|---|---|
| Quem captura | Equipe técnica com laser / drone LiDAR | O usuário, com celular | O cliente (celular, vídeo, drone) **ou** laser próprio/parceiro |
| Entrega BIM | Sim (RVT/PLN), por orçamento | Não (só malha/planta simples) | **Sim: RVT, PLN e IFC**, pedido e acompanhado na plataforma |
| Custo e prazo | Altos (mobilização de equipe e equipamento) | Baixos | **Baixos para LOD 200** (captura do cliente); laser quando o projeto exige |
| Controle de precisão | Relatório do serviço | Nenhum | **Relatório com medidas de controle e selo de aptidão** |
| Plataforma própria | Não (entrega arquivos) | Sim, genérica | **Sim**: projetos, capturas, modelos, pedidos, equipe, histórico |

---

## 2. Problema

1. **Levantar o existente é caro e lento.** Para reforma, retrofit, ampliação ou
   manutenção, o projeto precisa partir do que está construído — e as plantas antigas
   raramente batem com a realidade. Contratar laser + modelagem custa caro e tem fila.
2. **Nuvem de pontos sozinha não resolve.** O escritório recebe gigabytes de nuvem e ainda
   precisa de dias (ou de um modelador especializado) para chegar a um modelo BIM usável.
3. **Não há visibilidade do serviço.** Pedido, prazo, revisões e entregas ficam em e-mail,
   WhatsApp e links de download que expiram.
4. **Precisão é uma caixa-preta.** Quem recebe o modelo raramente sabe quanto ele erra.
5. **Documentação complementar é manual.** Ortofotos, mapas de patologias e quantitativos
   para orçamento ainda são feitos à mão no CAD.

---

## 3. Público-alvo e personas

| Persona | Quem é | O que quer do Oraclo | Pagador? |
|---|---|---|---|
| **Arquiteto(a) de reforma / retrofit** | Escritório pequeno ou médio | Modelo BIM do existente rápido e barato para começar o projeto | **Sim — cliente principal** |
| **Engenheiro(a) / construtora** | Obras de retrofit, ampliação, manutenção | As-built e as-is em BIM, quantitativos, acompanhamento por etapas | Sim |
| **Indústria / facilities** | Plantas industriais, galpões, utilidades | Nuvem + BIM de instalações para ampliações e manutenção (laser quando preciso) | Sim — contratos maiores |
| **Varejo / corporativo / gestor de imóveis** | Redes de lojas, administradoras | Levantar muitos imóveis padronizados com equipe própria (celular) | Sim — volume |
| **Patrimônio histórico** | Restauradores, dioceses, órgãos | HBIM, ortofotos e mapa de danos | Sim — vertical de nicho |
| **Modelador(a) BIM (equipe/parceiro)** | Interno ou terceirizado | Fila de pedidos clara, nuvem validada, entrega e revisões organizadas | Recebe (custo) |
| **Técnico de campo** | Equipe do cliente | App que diga exatamente como capturar | Não (usuário) |

**Persona primária do MVP:** arquiteto(a)/engenheiro(a) de reforma e retrofit.


---

## 4. O que é tecnicamente possível com o celular (premissas)

- **A geometria vem da fotogrametria** (fotos/vídeo da câmera), **não do LiDAR do
  iPhone**, que alcança ~5 m e acumula erro em ambientes grandes. O LiDAR é um
  complemento opcional para interiores pequenos.
- **Precisão-alvo:** erro ≤ **3 cm** em distâncias até 20 m, **com alvos de escala**
  (impressos) ou distâncias de controle medidas com trena a laser. Suficiente para
  cadastral, mapa de danos, ortofotos e editais. **Não** substitui laser para projeto
  estrutural milimétrico.
- **Limites conhecidos e contorno:**
  - Forros altos, torres, cúpulas → **bastão telescópico** (~5 m) com o celular.
  - Telhados e topo do edifício → **drone de entrada** (fotos importadas no Oraclo).
  - Ambientes escuros / paredes lisas → iluminação auxiliar e alvos colados.
  - Projeto que exige milímetro → **importar E57 de laser** (parceiro ou locado).
- **A qualidade depende ~80% do protocolo de captura.** Por isso a captura guiada no app
  é parte central do produto, não um detalhe.

---

## 5. Escopo do produto (módulos)

### 5.1 App de captura (celular)

- Criar/abrir um **bem** e uma **campanha de captura** (data, equipe, objetivo).
- **Captura guiada por ambiente/elemento** (ex.: "Fachada principal", "Nave",
  "Retábulo-mor"):
  - modos: **fotos em sequência** (padrão), **vídeo 4K** (extração de quadros no
    servidor) e, no iPhone Pro, **LiDAR** (opcional, fase 2);
  - feedback em tempo real: nitidez (desfoque/tremor), exposição, sobreposição estimada,
    contagem de fotos, aviso de "feche o percurso";
  - checklist do protocolo (alvos posicionados, distâncias de controle anotadas, duas
    voltas — perto e longe).
- **Distâncias de controle:** registrar 3–10 medidas de trena a laser entre alvos.
- **Fotos de detalhe de danos** com marcação já no campo (tipo de dano, observação).
- **Upload resumível em segundo plano** (Wi-Fi/4G), com fila offline — muitas igrejas
  ficam em áreas com sinal ruim.
- Importação de fotos de **drone** e de câmera externa pela plataforma web.

### 5.2 Processamento (nuvem, GPU)

- Pipeline automático disparado ao fim do upload:
  1. triagem de fotos (descarta borradas/duplicadas);
  2. alinhamento (SfM) e calibração da câmera;
  3. **escala e georreferência** pelos alvos/distâncias de controle;
  4. nuvem densa (MVS) → **nuvem de pontos colorida**;
  5. **malha texturizada**;
  6. **Gaussian Splat** (visualização fotorrealista e visita virtual);
  7. otimização para web (nuvem em níveis de detalhe).
- **Relatório de qualidade** automático por captura: nº de fotos usadas/descartadas, erro
  de reprojeção, **resíduo em cada distância de controle**, áreas com cobertura fraca
  (mapa de calor). Selo "apto para levantamento cadastral" quando o erro ≤ 3 cm.
- Fusão de capturas da mesma campanha (interior + exterior, chão + drone) e
  **importação de E57/LAS** de laser.

### 5.3 Plataforma web

**Visualizador 3D**
- Nuvem de pontos (milhões de pontos no navegador), malha e splat, com troca de modo.
- Medição (distância, altura, área), cortes/seções horizontais e verticais, planos de
  referência, anotações fixadas em 3D, tela cheia, compartilhamento por link.

**Ortofotos**
- Usuário define um plano (fachada, parede, piso, forro) e o Oraclo gera a **ortofoto em
  escala** (imagem retificada, sem perspectiva), exportável em alta resolução.

**Mapa de danos** ⭐ (funcionalidade principal)
- Desenho de polígonos/linhas/pontos de dano **sobre a ortofoto** (como o profissional já
  trabalha hoje) e marcação de pontos no 3D.
- **Biblioteca de danos padronizada** (fissuras, trincas, umidade ascendente/descendente,
  eflorescência, desagregação, perda de reboco, ataque de xilófagos, biodeterioração,
  intervenções inadequadas, etc.), com hachuras/cores consistentes e editável por
  organização.
- Cada dano: tipo, gravidade, elemento, fotos de detalhe, observação, causa provável,
  recomendação.
- Quantitativos automáticos (m² de reboco a recompor, metros lineares de fissura) —
  base para orçamento de restauro.

**Pranchas e relatórios**
- Geração automática de **pranchas** (PDF e DXF/DWG com camadas por tipo de dano):
  ortofotos, mapa de danos, legenda, carimbo com dados do bem e do responsável técnico.
- **Relatório de levantamento** e **relatório de estado de conservação** (PDF/DOCX).
- **Pacote para edital/órgão de proteção:** junta levantamento, mapa de danos, fotos,
  inventário e relatório de qualidade num só arquivo.
- Exportação de dados brutos: **E57, LAS/LAZ, PLY, OBJ/GLB, ortofotos em TIFF/PNG**.

**Inventário de bens integrados**
- Fichas de bens móveis/integrados (retábulos, imagens, pinturas, alfaias, azulejaria)
  presas a um ponto do modelo 3D, com fotos, dimensões, estado de conservação e
  histórico.

**Monitoramento e linha do tempo**
- Várias capturas do mesmo bem ao longo do tempo; **comparação lado a lado e por
  diferença** (nuvem × nuvem), evolução de cada dano e diário de obra do restauro
  (antes/durante/depois).

**Visita virtual pública** (opcional por bem)
- Página pública com o splat/malha, textos e pontos de interesse — para turismo,
  memória e campanhas de doação da igreja.

**Conta e organização**
- Organização (escritório, diocese, prefeitura) → usuários com papéis (admin, técnico,
  campo, leitor) → bens → campanhas.
- Compartilhamento com cliente/órgão por link com permissão de leitura.

### 5.4 Hub de formatos e integrações (plataforma completa)

O Oraclo deve cobrir **todos os entregáveis de uma empresa de levantamento** (laser
scanner, aerolevantamento LiDAR, nuvem de pontos, cadastral, as-built, planialtimétrico,
BIM e AutoCAD), seja **produzindo** a partir do celular/drone, seja **importando e
convertendo** dados de equipamentos profissionais.

#### Matriz de cobertura

| Entregável | Como entra no Oraclo | O que o Oraclo produz / converte |
|---|---|---|
| **Laser Scanner 3D** (terrestre) | Importação de **E57, PTX, PTS, LAS/LAZ, XYZ**; formatos proprietários (Leica LGS/BLK, FARO FLS, Trimble TZF) via exportação E57 no software do fabricante — leitura direta via SDK do fabricante em fase posterior | Registro/alinhamento de várias estações, limpeza, unificação com capturas de celular/drone, streaming web, todas as saídas abaixo |
| **Aerolevantamento LiDAR** (drone) | **LAS/LAZ** (DJI Terra, etc.) com sistema de coordenadas; trajetória opcional | Classificação de solo/vegetação/edificação, MDT/MDS, fusão com o levantamento terrestre |
| **Fotogrametria** (celular, câmera, drone) | Fotos/vídeo + EXIF/GPS; pontos de controle | Nuvem densa, malha texturizada, ortofotos e ortomosaico, splat |
| **Nuvem de pontos** (entregável) | Gerada ou importada | Exportação **E57, LAS/LAZ, COPC, PLY, PTS, XYZ** e **RCP/RCS** (Autodesk ReCap) para uso direto no Revit/AutoCAD |
| **Levantamento Cadastral (As-Is)** | Captura ou importação | Plantas, cortes, fachadas e ortofotos do estado atual; mapa de danos; relatório |
| **As-Built por fases** | Capturas recorrentes do mesmo bem ao longo da obra | Linha do tempo, comparação nuvem × nuvem e **nuvem × projeto (IFC/DWG)** com mapa de desvios; diário de obra 3D |
| **Levantamento Planialtimétrico** | Drone (fotogrametria ou LiDAR) + **pontos GNSS/RTK** (CSV/TXT) | Georreferenciamento em **SIRGAS 2000 / UTM** (e outros sistemas via EPSG), MDT, **curvas de nível**, perfis, cálculo de áreas e volumes; exportação **DXF/DWG, GeoTIFF, SHP/GeoJSON, KML** |
| **Documentação em AutoCAD** | Desenho a partir da nuvem/ortofoto | **Planta, corte e fachada** por seções da nuvem: fatias exportadas como pontos e como **polilinhas vetorizadas** (semiautomático, revisado pelo usuário) em **DXF/DWG** com camadas, mais ortofotos em escala como imagem de fundo |
| **Modelagem BIM** (Revit/Archicad, LOD 200/300) | Importação de **IFC** (e RVT/PLN via exportação IFC do software de origem) | Exportação da nuvem para Revit (RCP/E57) e Archicad (E57/PTS); **IFC** com elementos do mapa de danos e do inventário (propriedades/psets); modelagem BIM assistida — semiautomática (paredes, pisos, aberturas) e, no início, como **serviço** feito pela equipe |

#### Integrações

- **Autodesk:** exportação RCP/RCS para ReCap/Revit/AutoCAD; DWG nativo; (futuro) plugin
  Revit que abre o projeto do Oraclo e sincroniza danos e anotações.
- **Graphisoft Archicad:** E57/PTS + IFC; (futuro) add-on.
- **BIM aberto:** IFC 2x3 / IFC4 (importação e exportação) e **BCF** para tarefas e
  anotações trocadas com qualquer software BIM.
- **GIS:** GeoTIFF, SHP, GeoJSON, KML, WMS/XYZ tiles; QGIS e Google Earth.
- **Web 3D aberta:** **3D Tiles / Cesium** e glTF/GLB para publicar em mapas e portais
  (prefeituras, órgãos de patrimônio).
- **API pública e webhooks:** para escritórios e empresas de laser parceiras enviarem e
  buscarem dados automaticamente.

#### Notas técnicas e de licença

- **E57, LAS/LAZ, COPC, PLY, IFC, DXF, GeoTIFF** são abertos — implementação direta
  (PDAL, libE57, IfcOpenShell, ezdxf, GDAL/PROJ).
- **DWG** e **RCP/RCS** são proprietários: DWG via **SDK da Open Design Alliance**
  (licença paga) ou conversão DXF→DWG; RCP/RCS via ferramenta/SDK da Autodesk (a
  verificar). Até lá, DXF e E57 atendem, porque AutoCAD, Revit e ReCap os importam.
- **Formatos de scanner** (LGS, FLS, TZF): começar aceitando o E57 exportado pelo
  software do fabricante; SDKs dos fabricantes avaliados por demanda.
- **Georreferência:** toda nuvem/projeto guarda o sistema de coordenadas (EPSG) e pode
  ser reprojetado (PROJ); padrão brasileiro = SIRGAS 2000.

### 5.6 Modelagem BIM como serviço (núcleo da revisão 0.2)

**Entregáveis:** **Revit (RVT)**, **Archicad (PLN)** e **IFC aberto** — o cliente escolhe um
ou mais. Nuvem de pontos (E57/RCP/LAS) e relatório de precisão acompanham a entrega.

**Quem modela:** equipe própria do Oraclo **e** parceiros credenciados (modeladores
terceirizados), com a mesma fila e o mesmo padrão de entrega.

**Fluxo do pedido (a construir):**

1. **Base:** captura concluída (celular/vídeo/drone) ou nuvem importada (laser).
2. **Pedido:** área (m²), nível de detalhe (**LOD 200** volumes/paredes/aberturas · **LOD 300**
   elementos com dimensões e tipos · LOD 350 sob consulta), disciplinas (arquitetura,
   estrutura, MEP aparente), software(s) de entrega, prazo desejado, observações e anexos
   (plantas antigas, fotos).
3. **Orçamento:** preço por m² × LOD × disciplinas (tabela + ajuste manual), prazo; cliente
   aprova na plataforma.
4. **Modelagem:** pedido atribuído a um modelador (equipe ou parceiro); status visível ao
   cliente (fila → em modelagem → em revisão interna).
5. **Entrega:** arquivos RVT/PLN/IFC + visualização do IFC no navegador; cliente comenta
   (pinos no modelo) e pede revisão; aprovação final encerra o pedido.
6. **Histórico:** versões do modelo por campanha (as-built por etapas).

**Precisão × LOD:** captura por celular/vídeo atende **LOD 200** com folga e LOD 300 em
ambientes pequenos com medidas de controle; **LOD 300 em áreas grandes e indústria → laser**
(o Oraclo importa E57/LAS e o pedido segue igual).

**A construir na plataforma:** papel de operador Oraclo (vê pedidos de todas as
organizações), papel de parceiro modelador (vê só os pedidos atribuídos), tabela de preços,
visualizador IFC (web-ifc / That Open Components), comentários com pinos, versões.

**Aceleração da modelagem (roadmap):** detecção automática de pisos, paredes e aberturas
na nuvem para pré-modelar o LOD 200; o modelador faz o acabamento.

### 5.7 Captura por vídeo (implementada)

- Gravar com a câmera nativa (4K, foco/exposição travados, sem estabilização
  cinematográfica, lente 1×, andar devagar, duas passadas) ou escolher um vídeo pronto.
- O navegador percorre o vídeo e mantém ~2,5 quadros/s: avalia 3 candidatos por janela e
  fica com o mais nítido; descarta **tremidos** (nitidez < 45% da mediana recente) e
  **repetidos** (miniatura quase igual à anterior — pessoa parada).
- Só os quadros escolhidos (JPEG na resolução do vídeo) entram na fila de envio offline;
  o vídeo não sobe. Funciona também no modo "Enviar fotos" (vídeo de drone/câmera).
- Vídeo: melhor cobertura e captura mais rápida, ideal para LOD 200; fotos seguem melhores
  para detalhe fino — o ideal é combinar.

---

## 6. MVP — o que entra e o que fica para depois

| Funcionalidade | MVP | V2 | V3 |
|---|:-:|:-:|:-:|
| App: captura guiada por fotos + upload resumível | ✅ | | |
| App: distâncias de controle e alvos | ✅ | | |
| App: modo vídeo 4K | | ✅ | |
| App: LiDAR (iPhone Pro) | | ✅ | |
| Processamento: nuvem colorida + malha + escala | ✅ | | |
| Relatório de qualidade com resíduos de controle | ✅ | | |
| Gaussian Splat | | ✅ | |
| Importação de E57/drone e fusão de capturas | | ✅ | |
| Visualizador 3D com medição e anotações | ✅ | | |
| Cortes/seções | | ✅ | |
| Ortofotos por plano | ✅ | | |
| Mapa de danos sobre ortofoto + biblioteca padrão | ✅ | | |
| Prancha PDF do mapa de danos | ✅ | | |
| **Exportação DXF** (ortofoto em escala + mapa de danos em camadas) | ✅ | | |
| Exportação DWG nativa (SDK ODA) | | ✅ | |
| Exportação E57/LAS/PLY/GLB | ✅ | | |
| Inventário de bens integrados | | ✅ | |
| Monitoramento / comparação entre capturas | | | ✅ |
| Pacote para edital | | ✅ | |
| Visita virtual pública | | ✅ | |
| Importação de laser: E57, LAS/LAZ, PTX, PTS, XYZ | ✅ | | |
| Exportação RCP/RCS (Revit/ReCap) | | ✅ | |
| LiDAR aéreo: classificação de solo, MDT/MDS | | ✅ | |
| Georreferência SIRGAS 2000/UTM + pontos GNSS | | ✅ | |
| Planialtimétrico: curvas de nível, perfis, volumes, GeoTIFF/SHP | | ✅ | |
| Plantas/cortes/fachadas: seções → DXF (pontos) | | ✅ | |
| Vetorização semiautomática de seções → DXF/DWG | | | ✅ |
| As-built: comparação nuvem × projeto (IFC/DWG) | | | ✅ |
| IFC (import/export) + BCF | | ✅ | |
| Modelagem BIM assistida como serviço | | ✅ | |
| Extração automática de planta / BIM (IFC) | | | ✅ |
| 3D Tiles/Cesium, API pública e webhooks | | | ✅ |
| Plugins Revit / Archicad | | | ✅ |
| Detecção automática de danos por IA (sugestão) | | | ✅ |

**Critério de sucesso do MVP:** uma restauradora captura uma fachada e um interior de
igreja com o celular, sozinha, em até 1 h de campo, e recebe em até 4 h a nuvem, a
ortofoto e consegue entregar a prancha de mapa de danos — com erro ≤ 3 cm nas distâncias
de controle.

---

## 7. Fluxo principal (MVP)

1. Restauradora cria a organização e cadastra o **bem** (nome, endereço, tipo,
   nível de proteção, órgão).
2. No app, abre o bem → **nova campanha** → escolhe o elemento ("Fachada principal").
3. O app passa o **checklist**: espalhar 4–6 alvos, medir 3 distâncias entre eles.
4. **Captura guiada**: duas voltas (longe/perto), com o app avisando foto borrada e
   cobertura.
5. Upload em segundo plano; a plataforma mostra "processando" com etapas.
6. Recebe notificação: modelo pronto + **relatório de qualidade** (erro por distância).
7. Na web, define o plano da fachada → gera a **ortofoto**.
8. Desenha os **danos** sobre a ortofoto usando a biblioteca padrão.
9. Gera a **prancha em PDF** e baixa a nuvem em E57 para o escritório.

---

## 8. Requisitos não funcionais

- **Precisão:** erro ≤ 3 cm até 20 m com controle; o relatório de qualidade é sempre
  entregue e nunca escondido do usuário.
- **Volume de dados:** uma captura típica = 500–1.500 fotos (2–10 GB); nuvens de 10–200
  milhões de pontos. Armazenamento em objeto (R2), nunca no banco.
- **Tempo de processamento:** meta ≤ 4 h por captura de até 1.500 fotos.
- **Custo de processamento:** meta < R$ 30 de GPU por captura típica (a validar na
  Fase 0).
- **Campo com sinal ruim:** captura 100% offline; upload resumível e retomável.
- **Navegador:** visualizador fluido em notebook comum (sem GPU dedicada) e em tablet.
- **LGPD e propriedade:** os dados do bem pertencem à organização; exportação completa
  a qualquer momento; visita pública só com opt-in.
- **Idioma:** português primeiro (pt-BR); i18n preparado.

---

## 9. Arquitetura técnica

```
[App celular]  →  [Upload resumível]  →  [Fila de jobs]  →  [Workers GPU]  →  [Plataforma web]
 Expo/RN +          R2 (S3 multipart       Postgres/Neon      Python: SfM,      Next.js, visualizador,
 vision-camera      com URLs assinadas)    (status dos jobs)  MVS, malha,       mapa de danos, pranchas
                                                              splat, ortofoto
```

| Camada | Escolha | Por quê |
|---|---|---|
| Plataforma web | **Next.js (App Router) + TypeScript + Tailwind + shadcn/ui** | Stack padrão (dev.md) |
| Banco | **Neon (Postgres) + Drizzle** | Stack padrão; jobs, bens, danos, usuários |
| Arquivos | **Cloudflare R2** | Sem custo de saída de dados — nuvens têm GBs; Vercel Blob não serve |
| App de captura | **Expo / React Native + react-native-vision-camera** | iOS e Android com uma base; fotogrametria não exige LiDAR. Módulo nativo ARKit/LiDAR na V2 |
| Processamento | **Python em container com GPU** (Modal ou RunPod, pago por minuto) | GPU sob demanda, sem servidor parado |
| Alinhamento (SfM) | **COLMAP / GLOMAP** (avaliar também modelos recentes tipo MASt3R/VGGT para casos difíceis) | Open source, padrão acadêmico |
| Nuvem densa / malha | **OpenMVS** | Open source, maduro |
| Splat | **gsplat / Nerfstudio** | Open source |
| Nuvens (conversão/limpeza) | **PDAL + Open3D**; saída **COPC** para a web | Formatos abertos; COPC faz streaming por nível de detalhe |
| Visualizador | **three.js + copc.js** (ou Potree 2) e visualizador de splats para three.js | Roda no navegador, sem plugin |
| Pranchas | Geração de PDF no servidor (SVG → PDF) e DXF via biblioteca de escrita DXF | Sem depender de AutoCAD |
| Conversão de formatos | **PDAL, libE57, GDAL/PROJ, IfcOpenShell, ezdxf**; DWG via SDK ODA (fase posterior) | Hub de importação/exportação (seção 5.4) |
| Geoespacial | **PROJ/EPSG** (SIRGAS 2000/UTM), PDAL para classificação de solo e MDT, GDAL para curvas de nível e GeoTIFF | Planialtimétrico e aerolevantamento |
| Auth | Cookie de sessão próprio + scrypt (dev.md) | Padrão |
| Deploy | Vercel (web) + provedor GPU (workers) | Padrão |

**Alternativa a avaliar na Fase 0:** usar o **RealityScan/RealityCapture (Epic)** como
motor de processamento em vez do pipeline open source — qualidade de referência, mas
exige Windows e tem condições de licença comercial a verificar.

---

## 10. Modelo de dados (rascunho)

- **Organizacao** — escritório, diocese, prefeitura (plano, limites).
- **Usuario** / **Membro** — papel na organização (admin, técnico, campo, leitor).
- **Bem** — nome, tipo (igreja, casarão, conjunto…), endereço, coordenadas, nível de
  proteção (federal/estadual/municipal), órgão, nº de processo, fotos de capa.
- **Elemento** — parte do bem (fachada norte, nave, sacristia, retábulo-mor), hierárquico.
- **Campanha** — data, equipe, objetivo (levantamento, monitoramento, obra-fase-X).
- **Captura** — elemento, modo (fotos/vídeo/LiDAR/drone/E57), dispositivo, status.
- **ArquivoCaptura** — foto/vídeo/scan no R2, metadados EXIF, nota de nitidez.
- **DistanciaControle** — alvo A, alvo B, medida de trena, resíduo no modelo.
- **JobProcessamento** — etapa, progresso, logs, custo de GPU, erro.
- **Produto** — nuvem (COPC/E57/LAS), malha (GLB/OBJ), splat, com tamanho e versão.
- **RelatorioQualidade** — métricas, cobertura, selo de aptidão.
- **Ortofoto** — plano de projeção, resolução (mm/pixel), arquivo.
- **TipoDano** — biblioteca (código, nome, cor, hachura) — padrão + personalizados.
- **Dano** — tipo, geometria (na ortofoto e/ou ponto 3D), gravidade, área/comprimento,
  fotos, causa provável, recomendação, captura de origem.
- **BemIntegrado** (V2) — ficha de inventário presa a um ponto 3D.
- **Anotacao** / **Medicao** — no visualizador.
- **Prancha** / **Relatorio** — tipo, conteúdo gerado, versão, arquivo.
- **LinkPublico** — visita virtual ou compartilhamento com permissão.

---

## 11. Modelo de negócio (hipóteses a validar)

- **SaaS por organização**, com cobrança por **bem ativo** e **créditos de
  processamento** (cada captura consome créditos conforme o nº de fotos):
  - **Ateliê** — escritórios pequenos, poucos bens ativos, créditos inclusos.
  - **Escritório** — mais bens, mais usuários, DXF/pacote de edital.
  - **Institucional** — dioceses e prefeituras: muitos bens, inventário, monitoramento,
    preço anual.
- **Serviço assistido (receita complementar):** técnico do Oraclo revisa a captura,
  desenha o mapa de danos ou modela — cobrado por projeto/m², como uma empresa de
  serviço, mas com custo muito menor por usar o celular.
- **Parceria com empresas de laser** para os casos que exigem milímetro (o Oraclo
  encaminha e importa o E57).
- **Kit de campo** (alvos impressos, bastão telescópico) vendido ou incluído no plano
  anual.

Valores concretos ficam para depois da Fase 0, quando o custo real de GPU por captura
for conhecido.

---

## 12. Roteiro

### Fase 0 — Validação técnica (2–3 semanas, antes de código de produto)
1. Escrever o **protocolo de captura** v1 (alvos, distâncias de controle, duas voltas,
   bastão para partes altas).
2. Capturar **3 casos reais**: uma fachada, um interior de igreja (nave), um elemento
   artístico (retábulo ou azulejaria).
3. Processar cada caso em **dois motores**: pipeline open source (COLMAP + OpenMVS) e
   RealityScan, além de um app pronto (Polycam modo foto) como referência.
4. Medir **5–10 distâncias com trena a laser** por caso e comparar com o modelo
   (planilha de resíduos).
5. Medir tempo de campo, tempo e **custo de processamento** em GPU.
6. **Decisão:** motor de processamento, meta de precisão realista e preço mínimo viável.

### Fase 1 — MVP (≈ 10–12 semanas)
- Provisionamento (dev.md): GitHub, Vercel, Neon, R2, provedor GPU.
- Plataforma web: auth, organizações, bens, campanhas.
- Pipeline de processamento automático + relatório de qualidade.
- App de captura guiada (fotos) + upload resumível.
- Visualizador 3D + medição + anotações.
- Ortofotos + mapa de danos + prancha PDF + exportações.
- **Piloto com 1–3 escritórios de restauro** usando em obra real.

- Importação de nuvens de laser (E57, LAS/LAZ, PTX, PTS, XYZ) desde o início, para
  que o Oraclo já sirva como hub de quem tem scanner.

### Fase 2 — V2
Vídeo e LiDAR no app, splats e visita pública, fusão de capturas/drone/E57, cortes,
DXF/DWG com camadas, inventário de bens integrados, pacote para edital, plano
institucional para dioceses. **Hub completo de formatos:** RCP/RCS, IFC + BCF,
georreferência SIRGAS 2000, planialtimétrico (MDT, curvas de nível, GeoTIFF/SHP),
LiDAR aéreo, plantas/cortes/fachadas por seção em DXF, modelagem BIM como serviço.

### Fase 3 — V3
Monitoramento por comparação de nuvens, as-built nuvem × projeto, sugestão automática
de danos por IA, vetorização semiautomática e extração de planta e modelo BIM (IFC),
plugins Revit/Archicad, 3D Tiles/Cesium, API pública e webhooks.

---

## 13. Métricas de sucesso

- **Precisão:** % de capturas com selo "apto para cadastral" (meta ≥ 80% no piloto).
- **Taxa de sucesso do processamento** sem intervenção manual (meta ≥ 90%).
- **Tempo de campo** por elemento e **tempo até a prancha** pronta.
- **Ativação:** organização que gerou a primeira prancha em até 7 dias.
- **Retenção:** bens com 2+ campanhas (indica monitoramento/uso contínuo).
- **Receita:** bens ativos pagantes; ticket por organização; receita de serviço
  assistido.

---

## 14. Riscos e mitigação

| Risco | Impacto | Mitigação |
|---|---|---|
| Precisão do celular insuficiente para o órgão de proteção | Alto | Fase 0 com medições reais; relatório de qualidade transparente; integração com laser para casos críticos |
| Capturas ruins feitas por leigos | Alto | Captura guiada com feedback em tempo real; triagem automática; serviço assistido |
| Custo de GPU por captura alto demais | Médio | Medir na Fase 0; reduzir resolução/quadros; créditos no preço |
| Ambientes altos e escuros (naves, forros, torres) | Médio | Bastão telescópico, iluminação, importação de drone |
| Pipeline open source frágil em casos difíceis | Médio | Avaliar RealityScan e modelos recentes de reconstrução como alternativa |
| Volume de dados (GBs por captura) e custo de armazenamento | Médio | R2 (sem custo de saída); política de retenção das fotos brutas |
| Formatos proprietários (DWG, RCP/RCS, LGS, FLS) exigem SDK/licença paga | Médio | Começar com formatos abertos que os softwares importam (E57, DXF, IFC); licenciar SDKs conforme demanda |
| Escopo "plataforma completa" diluir o foco do MVP | Alto | Hub entra em fases (seção 6); MVP mantém o fluxo celular → mapa de danos + importação básica de laser |
| Ciclo de venda lento em dioceses e prefeituras | Médio | Começar por escritórios de restauro (venda rápida); institucional na V2 |
| Concorrente genérico lançar recurso de patrimônio | Baixo/médio | Profundidade vertical: biblioteca de danos, pranchas no padrão, editais, português |

---

## 15. Questões em aberto

1. **Piloto da Fase 0:** usar obras do Estúdio Restaura? Quais bens estão acessíveis
   agora?
2. **Motor de processamento:** open source × RealityScan — decidir após a Fase 0.
3. **Biblioteca de danos:** validar nomenclatura e legenda com restauradores (e com o
   padrão adotado pelos órgãos com que o piloto trabalha).
4. **Formato das pranchas:** carimbo e normas de apresentação exigidos pelo IPHAN e pelos
   órgãos estaduais do piloto.
5. **App:** confirmar Expo/React Native para a V1 ou ir direto para nativo iOS.
6. **Canal de dioceses:** usar a Patrinu como porta de entrada nas igrejas?
7. **Domínio e marca:** oraclo.com.br / identidade visual.

---

## 16. Glossário

- **Nuvem de pontos** — milhões de pontos 3D (x, y, z + cor) que representam a superfície
  do bem.
- **Fotogrametria** — reconstrução 3D a partir de muitas fotos sobrepostas.
- **SfM / MVS** — etapas da fotogrametria: alinhar as fotos e calcular as posições das
  câmeras (*Structure from Motion*) e depois densificar a nuvem (*Multi-View Stereo*).
- **Ortofoto** — imagem retificada de um plano (fachada, parede), sem perspectiva e em
  escala, sobre a qual se mede e desenha.
- **Gaussian Splat** — representação 3D fotorrealista, ótima para visualização, mas não
  métrica.
- **Mapa de danos** — representação gráfica das patologias do bem, com legenda
  padronizada.
- **Alvos / distâncias de controle** — marcadores impressos e medidas de trena que dão
  escala e permitem medir o erro do modelo.
- **E57 / LAS / COPC** — formatos abertos de nuvem de pontos (troca com Revit/ReCap,
  arquivamento e streaming web).
