import { useState, type ChangeEvent } from "react";
import type { ResultFilter } from "../lib/types";

export interface FilterBarProps {
  onFilterChange: (filter: ResultFilter) => void;
  disabled?: boolean;
}

export function FilterBar({ onFilterChange, disabled }: FilterBarProps) {
  const [filter, setFilter] = useState<ResultFilter>({});

  function update(next: Partial<ResultFilter>) {
    const merged = { ...filter, ...next };
    setFilter(merged);
    onFilterChange(merged);
  }

  return (
    <div className="filter-bar">
      <label>
        FROM
        <input
          type="date"
          disabled={disabled}
          value={filter.dateFrom ?? ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ dateFrom: event.target.value || undefined })
          }
        />
      </label>
      <label>
        TO
        <input
          type="date"
          disabled={disabled}
          value={filter.dateTo ?? ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ dateTo: event.target.value || undefined })
          }
        />
      </label>
      <label className="filter-bar-search">
        SEARCH
        <input
          type="search"
          disabled={disabled}
          placeholder="SEARCH MEMOS, HASH, COUNTERPARTY…"
          value={filter.searchText ?? ""}
          onChange={(event: ChangeEvent<HTMLInputElement>) =>
            update({ searchText: event.target.value || undefined })
          }
        />
      </label>
    </div>
  );
}
