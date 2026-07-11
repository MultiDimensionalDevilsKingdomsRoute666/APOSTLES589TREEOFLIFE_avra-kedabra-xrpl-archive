import { NETWORKS } from "../lib/networks";
import type { NetworkId } from "../lib/types";

export interface NetworkToggleProps {
  value: NetworkId;
  onChange: (id: NetworkId) => void;
  disabled?: boolean;
}

const NETWORK_IDS = Object.keys(NETWORKS) as NetworkId[];

export function NetworkToggle({ value, onChange, disabled }: NetworkToggleProps) {
  return (
    <div className="network-toggle" role="radiogroup" aria-label="Network">
      {NETWORK_IDS.map((id) => (
        <button
          key={id}
          type="button"
          role="radio"
          aria-checked={value === id}
          className="network-toggle-option"
          data-active={value === id}
          disabled={disabled}
          onClick={() => onChange(id)}
        >
          {NETWORKS[id].label.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
