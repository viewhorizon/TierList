import { useEffect, useMemo, useState } from "react";

export interface VoterOption {
  id: string;
  name: string;
  handle: string;
  active: boolean;
  posts: number;
}

interface VotersPanelProps {
  voters: VoterOption[];
  query: string;
  onQueryChange: (value: string) => void;
  selectedHandles: string[];
  onToggleUser: (handle: string) => void;
  onClearSelection: () => void;
}

export function VotersPanel({ voters, query, onQueryChange, selectedHandles, onToggleUser, onClearSelection }: VotersPanelProps) {
  const [page, setPage] = useState(1);
  const pageSize = 12;

  const filtered = useMemo(() => {
    const value = query.toLowerCase();
    return voters.filter((voter) => {
      return voter.name.toLowerCase().includes(value) || voter.handle.toLowerCase().includes(value);
    });
  }, [voters, query]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const start = (page - 1) * pageSize;
  const pageVoters = filtered.slice(start, start + pageSize);
  const placeholders = Math.max(0, pageSize - pageVoters.length);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  return (
    <section className="tl-surface p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-100">Votantes</h2>
        <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-300">
          {selectedHandles.length}/{voters.length}
        </span>
      </div>

      <label className="block text-xs uppercase tracking-[0.12em] text-slate-400" htmlFor="voters-query">
        Buscar
      </label>
      <input
        id="voters-query"
        value={query}
        onChange={(event) => onQueryChange(event.target.value)}
        className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#131c30] px-3 text-sm text-slate-100 outline-none focus-visible:ring-2 focus-visible:ring-[#2f8bff]"
        placeholder="Nombre de usuario"
      />

      <button
        type="button"
        className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-400 hover:text-slate-200"
        onClick={onClearSelection}
      >
        Limpiar seleccion
      </button>

      <div className="mt-4 grid grid-cols-4 grid-rows-3 gap-2">
        {pageVoters.map((voter) => (
          <button
            key={voter.id}
            type="button"
            onClick={() => onToggleUser(voter.handle)}
            className={`aspect-square rounded-lg px-1 text-[10px] ring-1 ring-white/5 focus-visible:ring-[#2f8bff] ${
              selectedHandles.includes(voter.handle)
                ? "bg-[#0052ff]/30 text-slate-100 ring-[#0052ff]/60"
                : voter.active
                  ? "bg-[#24314c] text-slate-200"
                  : "bg-[#1b2438] text-slate-500"
            }`}
            aria-label={voter.name}
          >
            <span className="block truncate">{voter.name}</span>
            <span className="mt-0.5 block text-[9px] text-slate-400">{voter.posts}</span>
          </button>
        ))}

        {Array.from({ length: placeholders }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square rounded-lg bg-[#1b2438] ring-1 ring-white/5" aria-hidden="true" />
        ))}
      </div>

      {!pageVoters.length ? <p className="mt-3 text-xs text-slate-400">No hay usuarios para esta busqueda.</p> : null}

      <div className="mt-3 flex items-center justify-between border-t border-white/8 pt-3 text-xs uppercase tracking-[0.12em] text-slate-400">
        <button
          type="button"
          onClick={() => setPage((previous) => Math.max(1, previous - 1))}
          disabled={page <= 1}
          className="rounded-md border border-white/10 px-2 py-1 disabled:opacity-40"
        >
          Prev
        </button>
        <span>
          {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => setPage((previous) => Math.min(totalPages, previous + 1))}
          disabled={page >= totalPages}
          className="rounded-md border border-white/10 px-2 py-1 disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </section>
  );
}
