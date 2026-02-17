

## Gradiente de fundo infinito na foto do perfil

### Problema
Atualmente o gradiente usa uma unica camada com opacidade de 70%, o que permite que as cores da foto vazem e criem uma divisao visivel quando ha contraste entre a foto e a cor de fundo.

### Solucao
Substituir o gradiente unico por duas camadas sobrepostas que garantem uma transicao suave independentemente da combinacao de cores:

1. **Camada inferior (mais alta, mais suave)**: cobre 60% da altura da foto, vai de `T.bg` solido ate transparente -- cria a base da transicao
2. **Camada superior (mais curta, mais forte)**: cobre 35% da altura da foto, vai de `T.bg` solido ate transparente -- garante que a borda inferior seja completamente coberta pela cor de fundo

Ambas com opacidade total (sem `opacity: 0.7`), pois a transparencia ja e controlada pelo proprio gradiente CSS. O efeito combinado cria um fade progressivo que funciona com qualquer foto e qualquer cor de fundo.

### Arquivos alterados

1. **`src/pages/PublicProfile.tsx`** (linha 225): Substituir a div unica do gradiente por duas divs sobrepostas
2. **`src/pages/DashboardAppearance.tsx`** (linha 303): Mesma alteracao no preview do dashboard

### Detalhe tecnico

Codigo do gradiente (aplicado nos dois arquivos):

```text
Antes (1 camada):
div h-[40%] opacity-0.7 | linear-gradient(to top, T.bg 0%, transparent 100%)

Depois (2 camadas):
div h-[60%] | linear-gradient(to top, T.bg 0%, transparent 100%)
div h-[35%] | linear-gradient(to top, T.bg 20%, transparent 100%)
```

A primeira camada faz a transicao ampla e suave. A segunda camada reforça a parte mais proxima da borda inferior, eliminando qualquer vestígio da foto na juncao com o fundo.

