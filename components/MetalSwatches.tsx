'use client';

/**
 * Visual metal-color picker for the product detail page.
 *
 * Renders one circular swatch per available metal in the product's
 * metals array. Click a swatch to set the active metal — the parent
 * (ProductOptions) owns the state so the choice flows through to
 * AddToBag's redirect target.
 *
 * Color mapping is matched to the legacy danhov.com product page so
 * customers see the same accurate gold / white / rose / platinum tones
 * they're used to.
 */

type Tone = {
  bg: string;
  border?: string;
};

const METAL_TONES: Record<string, Tone> = {
  yellow: { bg: 'linear-gradient(135deg, #e9c463 0%, #c69a3a 100%)' },
  white:  { bg: 'linear-gradient(135deg, #f4efe9 0%, #c9c7c2 100%)', border: '1px solid rgba(60, 30, 20, 0.18)' },
  rose:   { bg: 'linear-gradient(135deg, #f1b7a3 0%, #cf8a72 100%)' },
  platinum: { bg: 'linear-gradient(135deg, #ecebe7 0%, #babab5 100%)', border: '1px solid rgba(60, 30, 20, 0.18)' },
};

function toneFor(metal: string): Tone {
  const m = metal.toLowerCase();
  if (m.includes('rose')) return METAL_TONES.rose;
  if (m.includes('white')) return METAL_TONES.white;
  if (m.includes('platinum')) return METAL_TONES.platinum;
  if (m.includes('yellow') || m.includes('gold')) return METAL_TONES.yellow;
  return METAL_TONES.yellow;
}

function labelFor(metal: string): string {
  // Convert "14k_yellow" → "14k Yellow Gold", leave human strings alone
  if (/_/.test(metal)) {
    const [karat, kind] = metal.split('_');
    const colour = kind ? kind.charAt(0).toUpperCase() + kind.slice(1) : '';
    return `${karat} ${colour} Gold`.trim();
  }
  return metal;
}

type Props = {
  metals: string[];
  selectedMetal: string | null;
  onSelect: (metal: string) => void;
};

export default function MetalSwatches({ metals, selectedMetal, onSelect }: Props) {
  // Hide the entire control when the product only comes in one metal —
  // there's nothing for the customer to choose between, so the swatch
  // row + "METAL · ..." label would just be visual noise.
  if (!metals || metals.length < 2) return null;

  const selectedLabel = selectedMetal ? labelFor(selectedMetal) : 'Select metal';

  return (
    <div className="metal-swatches" role="group" aria-label="Available metals">
      <div className="metal-swatches-label">
        <span className="metal-swatches-eyebrow">Metal</span>
        <span className="metal-swatches-value">{selectedLabel}</span>
      </div>
      <ul className="metal-swatches-row">
        {metals.map((m) => {
          const tone = toneFor(m);
          const isActive = m === selectedMetal;
          return (
            <li key={m}>
              <button
                type="button"
                className={`metal-swatch${isActive ? ' is-active' : ''}`}
                onClick={() => onSelect(m)}
                aria-pressed={isActive}
                aria-label={labelFor(m)}
                title={labelFor(m)}
              >
                <span
                  className="metal-swatch-circle"
                  style={{
                    background: tone.bg,
                    border: tone.border,
                  }}
                />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
