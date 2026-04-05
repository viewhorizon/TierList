import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import type { DebateWallVoter } from "../../types";

interface VotersPanelProps {
  voters: DebateWallVoter[];
  query: string;
  onQueryChange: (value: string) => void;
  activeUsers: number;
  selectedUserHandles: string[];
  onToggleUser: (handle: string) => void;
}

export function VotersPanel({
  voters,
  query,
  onQueryChange,
  activeUsers,
  selectedUserHandles,
  onToggleUser,
}: VotersPanelProps) {
  const [page, setPage] = useState(1);
  const pageSize = 24;
  const filtered = useMemo(() => voters.filter((voter) => voter.name.toLowerCase().includes(query.toLowerCase())), [voters, query]);
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
    <div className="flex h-full flex-col rounded-2xl border border-white/6 bg-[#101a2c] p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-3xl font-bold tracking-[-0.03em]">Votantes</h3>
        <span className="rounded-md bg-emerald-400/15 px-2 py-1 text-xs font-semibold text-emerald-300">{(activeUsers / 1000).toFixed(1)}k Active</span>
      </div>
      <label className="flex items-center gap-2 rounded-lg border border-white/8 bg-[#131c30] px-3 py-2.5 text-slate-400 focus-within:ring-2 focus-within:ring-[#0052ff]">
        <Search className="h-4 w-4" aria-hidden="true" />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          className="w-full bg-transparent text-sm outline-none"
          placeholder="Buscar votantes..."
          aria-label="Buscar votantes"
        />
      </label>
      <div className="mt-5 grid flex-1 grid-cols-4 grid-rows-6 gap-2">
        {pageVoters.map((voter) => (
          <button
            key={voter.id}
            type="button"
            onClick={() => onToggleUser(voter.handle)}
            className={`aspect-square rounded-lg text-[10px] ring-1 ring-white/5 focus-visible:ring-[#0052ff] ${
              selectedUserHandles.includes(voter.handle)
                ? "bg-[#0052ff]/30 text-slate-100 ring-[#0052ff]/60"
                : voter.active
                  ? "bg-[#24314c] text-slate-200"
                  : "bg-[#1b2438] text-slate-500 hover:bg-[#24314c]"
            }`}
            aria-label={voter.handle}
          >
            <span className="block truncate px-1">{voter.name}</span>
          </button>
        ))}
        {Array.from({ length: placeholders }).map((_, index) => (
          <div key={`empty-${index}`} className="aspect-square rounded-lg bg-[#1b2438] ring-1 ring-white/5" aria-hidden="true" />
        ))}
      </div>
      <div className="mt-4 flex items-center justify-between border-t border-white/8 pt-3 text-xs uppercase tracking-[0.14em] text-slate-400">
        <button
          type="button"
          onClick={() => setPage((prev) => Math.max(1, prev - 1))}
          disabled={page === 1}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 disabled:opacity-40"
          aria-label="Pagina anterior"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>
        <span>
          Page {String(page).padStart(2, "0")} / {String(totalPages).padStart(2, "0")}
        </span>
        <button
          type="button"
          onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
          disabled={page >= totalPages}
          className="inline-flex items-center gap-1 rounded-md border border-white/10 px-2 py-1 disabled:opacity-40"
          aria-label="Pagina siguiente"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
