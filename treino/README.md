# Treino da IA do ArchRay (motor ml-1)

Esteira gratuita para treinar o modelo próprio de detecção de danos e publicá-lo no app. O motor
clássico **cv-2** continua sempre ativo; o modelo treinado só assume, **classe a classe**, onde
provar em vistas reais que é melhor que ele.

## 1. Juntar dados bons (no app, no dia a dia)

- Em **Equipe › Uso dos dados**, a organização autoriza o uso para treino (desligado por padrão).
- Em cada vista revisada, marque **Mapeamento completo** (painel direito do editor) quando todos os
  danos visíveis estiverem marcados. Só essas vistas ensinam que "o que não foi marcado é parede sã".
- Aceite e rejeite as sugestões da IA: as rejeitadas viram exemplos negativos.
- Projetos de demonstração e os de nome "Teste…" ficam fora da base.

Meta para o primeiro treino: **30 a 50 vistas completas**, de **pelo menos 8 edificações**
diferentes (a validação separa por edificação).

## 2. Exportar a base (no computador do projeto)

```bash
node scripts/treino-exportar.mjs
```

```bash
node scripts/treino-avaliar.mjs
```

Gera `.cache/treino/archray/` com recortes 512×512 + máscaras, as vistas de validação inteiras e
`avaliacao-cv-2.json` (o desempenho do motor clássico, que o modelo precisa superar).
Compacte a pasta `archray` em `archray.zip`.

## 3. Treinar de graça (Kaggle ou Colab)

1. No Kaggle: **Datasets › New Dataset** e suba `archray.zip` (privado).
2. Opcional, recomendado: suba também as bases públicas (CC BY 4.0, uso comercial com atribuição):
   - BFDD — Building Façade Defect Dataset: https://data.mendeley.com/datasets/9ych7czvyg
   - Concrete Crack Segmentation Dataset (Özgenel): https://data.mendeley.com/datasets/jwsn7tfbrp/1
3. **Code › New Notebook › File › Import Notebook** e escolha `treino/archray_segmentacao.ipynb`.
   Em *Settings*: Accelerator **GPU T4**, Internet **On**. Anexe os datasets e rode tudo.
4. Na primeira execução com o BFDD, confira a linha "valores encontrados nas máscaras" e, se
   preciso, ajuste `BFDD_MAP` (o notebook para com aviso se faltar algum valor).

O notebook escolhe o limiar de cada classe priorizando a precisão, compara com o cv-2 e liga só as
classes com precisão ≥ 70 %, revocação ≥ 35 % e resultado melhor que o cv-2.

## 4. Publicar

Baixe `modelo.json` e `ml-1-int8.onnx` da saída do notebook e coloque em `public/modelos/`.
Depois do deploy, o botão **Detectar danos** usa o modelo nas classes ligadas (o aviso mostra
"ml-1 + cv-2"), cada sugestão diz a probabilidade e a precisão medida na validação, e o laudo cita
o motor. Para desligar, apague `public/modelos/modelo.json`.

Para a versão seguinte, troque `VERSION` no notebook (ml-2…) — o laudo de cada dano guarda o motor
que o sugeriu.

Para editar o notebook, mude `scripts/gerar-notebook-treino.mjs` e rode
`node scripts/gerar-notebook-treino.mjs`.
