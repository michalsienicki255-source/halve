import type { PersonSummary, Receipt } from "./types";

/**
 * Liczy ile każda osoba płaci.
 * - Pozycja dzielona = po równo między ownerIds.
 * - Tax i tip = proporcjonalnie do sumy pozycji osoby względem subtotal.
 * - Nieprzypisane pozycje nie liczą się do nikogo (widoczne w UI jako brakujące).
 */
export function computeSummary(
  receipt: Receipt,
  peopleIds: string[]
): PersonSummary[] {
  const itemsSubtotal = receipt.items.reduce(
    (acc, it) => acc + it.unitPrice * it.quantity,
    0
  );

  return peopleIds.map((personId) => {
    const personItems = receipt.items
      .filter((it) => it.ownerIds.includes(personId))
      .map((it) => ({
        itemId: it.id,
        share: (it.unitPrice * it.quantity) / it.ownerIds.length,
      }));

    const itemsTotal = personItems.reduce((acc, p) => acc + p.share, 0);

    const ratio = itemsSubtotal > 0 ? itemsTotal / itemsSubtotal : 0;
    const taxShare = receipt.tax * ratio;
    const tipShare = receipt.tip * ratio;

    return {
      personId,
      items: personItems,
      itemsTotal,
      taxShare,
      tipShare,
      total: itemsTotal + taxShare + tipShare,
    };
  });
}

export function unassignedItemsCount(receipt: Receipt): number {
  return receipt.items.filter((it) => it.ownerIds.length === 0).length;
}

export function assignedRatio(receipt: Receipt): number {
  if (receipt.items.length === 0) return 0;
  const assigned = receipt.items.filter((it) => it.ownerIds.length > 0).length;
  return assigned / receipt.items.length;
}

export function itemsSubtotal(receipt: Receipt): number {
  return receipt.items.reduce(
    (acc, it) => acc + it.unitPrice * it.quantity,
    0
  );
}
