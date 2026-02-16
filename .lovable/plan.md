

# Trocar imagem do Dashboard Preview no Hero

Substituir o arquivo `src/assets/dashboard-preview.png` pela nova imagem enviada (`user-uploads://dashboard.png`).

## Passos

1. Copiar `user-uploads://dashboard.png` para `src/assets/dashboard-preview.png`, sobrescrevendo o arquivo atual
2. Nenhuma alteracao de codigo necessaria -- o `HeroSection.tsx` ja importa `@/assets/dashboard-preview.png`

## Resultado

A landing page exibira a nova screenshot do dashboard Toqler com sidebar, cards de metricas e grafico "Ultimos 7 dias".

