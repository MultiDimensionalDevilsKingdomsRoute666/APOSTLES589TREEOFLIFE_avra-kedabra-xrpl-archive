import { useState, type FormEvent } from "react";
import { isValidXrplAddress } from "../lib/addressValidation";

export interface AddressInputProps {
  onSubmit: (address: string) => void;
  disabled?: boolean;
}

export function AddressInput({ onSubmit, disabled }: AddressInputProps) {
  const [value, setValue] = useState("");
  const [touched, setTouched] = useState(false);

  const trimmed = value.trim();
  const isValid = isValidXrplAddress(trimmed);
  const showError = touched && trimmed.length > 0 && !isValid;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTouched(true);
    if (!isValid) return;
    onSubmit(trimmed);
  }

  return (
    <form className="address-input" onSubmit={handleSubmit} noValidate>
      <label htmlFor="address">XRPL ADDRESS</label>
      <div className="address-input-row">
        <input
          id="address"
          name="address"
          type="text"
          placeholder="rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH"
          value={value}
          disabled={disabled}
          onChange={(event) => setValue(event.target.value)}
          onBlur={() => setTouched(true)}
          aria-invalid={showError}
          aria-describedby={showError ? "address-error" : undefined}
          autoComplete="off"
          spellCheck={false}
        />
        <button type="submit" disabled={disabled || trimmed.length === 0}>
          SCAN
        </button>
      </div>
      {showError && (
        <p id="address-error" role="alert" className="field-error">
          ENTER A VALID XRPL CLASSIC OR X-ADDRESS.
        </p>
      )}
    </form>
  );
}
