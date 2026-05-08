// Copy a recipe's ingredient list to the clipboard, formatted as a plain
// shopping list. Used by the recipe detail page and the photo-scan preview.

type IngredientLike = {
  name: string
  amount?: string
  unit?: string
  notes?: string
}

// Mirror of the inline scaler used on the recipe page. Keeps simple
// numeric amounts ("2", "1.5") + tolerates passthrough for vague ones
// ("a pinch", "to taste"). Multiplier defaults to 1 (no scaling).
function scaleAmount(amount: string | undefined, multiplier: number): string {
  if (!amount) return ''
  if (multiplier === 1) return amount
  const n = parseFloat(amount)
  if (Number.isFinite(n)) {
    const scaled = n * multiplier
    return Number.isInteger(scaled) ? String(scaled) : scaled.toFixed(2).replace(/\.?0+$/, '')
  }
  return amount
}

function buildPayload(title: string, items: IngredientLike[], multiplier = 1): string {
  const lines = items.map(item => {
    const amount = scaleAmount(item.amount, multiplier)
    const head = [amount, item.unit].filter(Boolean).join(' ')
    return `${head ? head + ' ' : ''}${item.name}${item.notes ? ` (${item.notes})` : ''}`
  })
  return `${title}\n${lines.join('\n')}`
}

export async function copyIngredientsToClipboard(
  title: string,
  items: IngredientLike[],
  multiplier = 1,
): Promise<boolean> {
  const payload = buildPayload(title, items, multiplier)
  try {
    await navigator.clipboard.writeText(payload)
    return true
  } catch {
    // Fallback for browsers that block clipboard API (e.g. older Safari,
    // non-secure contexts). execCommand is deprecated but still works.
    try {
      const ta = document.createElement('textarea')
      ta.value = payload
      document.body.appendChild(ta)
      ta.select()
      const ok = document.execCommand('copy')
      document.body.removeChild(ta)
      return ok
    } catch {
      return false
    }
  }
}
