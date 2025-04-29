import * as React from "react";
import { Input } from "@/components/ui/input";

export interface PlayerAutocompleteOption {
  id: string;
  name: string;
  telegram?: string;
  phone?: string;
}

interface PlayerAutocompleteProps {
  options: PlayerAutocompleteOption[];
  value: string[];
  onChange: (value: string[]) => void;
  disabled?: boolean;
  loading?: boolean;
}

export const PlayerAutocomplete: React.FC<PlayerAutocompleteProps> = ({
  options,
  value,
  onChange,
  disabled,
  loading,
}) => {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);
  const listRef = React.useRef<HTMLUListElement>(null);

  const filtered = React.useMemo(
    () =>
      options.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          (p.telegram?.toLowerCase().includes(search.toLowerCase()) ?? false) ||
          (p.phone?.toLowerCase().includes(search.toLowerCase()) ?? false)
      ),
    [options, search]
  );

  React.useEffect(() => {
    if (!open) setSearch("");
  }, [open]);

  React.useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = 0;
    }
  }, [open, filtered]);

  // Close dropdown on click outside
  React.useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (!open) return;
      if (
        inputRef.current &&
        !inputRef.current.contains(e.target as Node) &&
        listRef.current &&
        !listRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  function handleSelect(id: string) {
    if (value.includes(id)) {
      onChange(value.filter((v) => v !== id));
    } else {
      onChange([...value, id]);
    }
  }

  function handleRemove(id: string) {
    onChange(value.filter((v) => v !== id));
  }

  const selectedPlayers = options.filter((o) => value.includes(o.id));

  return (
    <div className="relative w-full min-w-[160px]">
      <div className="flex flex-wrap gap-1 mb-1">
        {selectedPlayers.map((p) => (
          <span key={p.id} className="inline-flex items-center bg-accent rounded px-2 py-0.5 text-xs max-w-full truncate">
            <span className="truncate max-w-[100px] md:max-w-[160px]">{p.name}</span>
            <button
              type="button"
              className="ml-1 text-destructive hover:underline"
              onClick={() => handleRemove(p.id)}
              tabIndex={-1}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <Input
        ref={inputRef}
        placeholder={selectedPlayers.length ? "Add more players..." : "Search and select players..."}
        value={search}
        onFocus={() => setOpen(true)}
        onChange={(e) => {
          setSearch(e.target.value);
          setOpen(true);
        }}
        disabled={disabled || loading}
        autoComplete="off"
        className="pr-8 text-base md:text-sm h-10 md:h-9"
      />
      {open && (
        <ul
          ref={listRef}
          className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded border bg-background shadow-lg text-base md:text-sm"
          style={{ minWidth: 0 }}
        >
          {loading ? (
            <li className="px-3 py-2 text-muted-foreground">Loading...</li>
          ) : filtered.length === 0 ? (
            <li className="px-3 py-2 text-muted-foreground">No players found</li>
          ) : (
            filtered.map((p) => (
              <li
                key={p.id}
                className={`px-3 py-2 cursor-pointer hover:bg-accent flex items-center ${value.includes(p.id) ? "bg-accent/50" : ""}`}
                onMouseDown={() => handleSelect(p.id)}
                style={{ minWidth: 0 }}
              >
                <input
                  type="checkbox"
                  checked={value.includes(p.id)}
                  readOnly
                  className="mr-2"
                />
                <span className="truncate max-w-[100px] md:max-w-[160px]">{p.name}</span>
                {p.telegram && <span className="ml-2 text-xs text-muted-foreground">({p.telegram})</span>}
                {p.phone && <span className="ml-2 text-xs text-muted-foreground">({p.phone})</span>}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
};
