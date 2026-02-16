

# Atualizar UID do cartao NFC com numero de serie real

## O que sera feito

Atualizar o campo `tag_uid` do cartao "Ian Veras" de `1F:7B:1D:5C:FC:12:1F` (gerado automaticamente) para `04:FB:5B:52:6E:1E:90` (numero de serie real do cartao fisico).

## Detalhes tecnicos

Executar a seguinte migracao SQL:

```sql
UPDATE nfc_cards 
SET tag_uid = '04:FB:5B:52:6E:1E:90', updated_at = now()
WHERE id = '15c39e38-f2a1-4f26-8aef-010d6339553e';
```

Nenhuma alteracao de codigo necessaria.

