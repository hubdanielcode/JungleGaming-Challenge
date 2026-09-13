interface PendingOrderRecord {
  idempotencyKey: string;
  orderId: string | null;
}

const pendingOrderStorageKeyPrefix = "kurio-pending-order:";

/* - Guarda, por identidade, a chave de idempotência do pedido em andamento e o id retornado assim que a API responde. Isso resolve dois cenários do enunciado: 

1. O usuário atualiza a página antes da resposta da criação do pedido — o reenvio reaproveita a mesma chave em vez de gerar uma nova

2. O usuário atualiza ou reconecta depois que o pedido já foi criado — a tela de checkout redireciona para a confirmação existente em vez de permitir uma nova compra. - */

const getPendingOrder = (identityId: string): PendingOrderRecord | null => {
  const storedValue = localStorage.getItem(`${pendingOrderStorageKeyPrefix}${identityId}`);

  if (!storedValue) {
    return null;
  }

  try {
    return JSON.parse(storedValue) as PendingOrderRecord;
  } catch {
    return null;
  }
};

const setPendingOrder = (identityId: string, pendingOrderRecord: PendingOrderRecord): void => {
  localStorage.setItem(`${pendingOrderStorageKeyPrefix}${identityId}`, JSON.stringify(pendingOrderRecord));
};

const clearPendingOrder = (identityId: string): void => {
  localStorage.removeItem(`${pendingOrderStorageKeyPrefix}${identityId}`);
};

export { getPendingOrder, setPendingOrder, clearPendingOrder };

export type { PendingOrderRecord };
