

## Ajuste dos botões no preview

Alterações no arquivo `src/pages/DashboardAppearance.tsx`:

1. **Botão Salvar (ícone Download)**: Como agora tem apenas o ícone, o botão precisa ser quadrado/compacto. Vou:
   - Aumentar o ícone de `w-3 h-3` para `w-4 h-4`
   - Ajustar o padding para ficar proporcional (formato icon-only)
   - Remover a margem horizontal excessiva (`mx-[47px]`)

2. **Botão Trocar (ícone Send + texto)**: Vou ajustar para ficar visualmente equilibrado com o botão salvar:
   - Aumentar o ícone de `w-3 h-3` para `w-4 h-4`
   - Manter o texto "Trocar" mas ajustar o tamanho da fonte e padding para melhor proporção

Ambos os botões ficarão visualmente consistentes no grid de 2 colunas do preview.
