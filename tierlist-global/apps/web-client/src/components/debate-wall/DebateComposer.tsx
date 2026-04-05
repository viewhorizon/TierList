import type {
  DebateWallCategory,
  DebateWallColorMode,
  DebateWallShape,
  DebateWallStyle,
  DebateWallTemplate,
  DebateWallTool,
} from "../../types";

interface DebateComposerProps {
  activeTool: DebateWallTool;
  activeCategory: DebateWallCategory;
  colorMode: DebateWallColorMode;
  shape: DebateWallShape;
  style: DebateWallStyle;
  template: DebateWallTemplate;
  text: string;
  onToolChange: (tool: DebateWallTool) => void;
  onCategoryChange: (category: DebateWallCategory) => void;
  onColorModeChange: (mode: DebateWallColorMode) => void;
  onShapeChange: (shape: DebateWallShape) => void;
  onStyleChange: (style: DebateWallStyle) => void;
  onTemplateChange: (template: DebateWallTemplate) => void;
  onTextChange: (value: string) => void;
  onSubmit: () => void;
  onOpenCreateModal: () => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isPublishing: boolean;
  showAdminJsonControls?: boolean;
}

const tools: Array<{ key: DebateWallTool; label: string }> = [
  { key: "pin", label: "Pines" },
  { key: "sticker", label: "Stickers" },
  { key: "bubble", label: "Burbujas" },
];

const categories: Array<{ key: DebateWallCategory; label: string }> = [
  { key: "informacion", label: "Informacion" },
  { key: "importante", label: "Importante" },
  { key: "detalle", label: "Detalle" },
  { key: "advertencia", label: "Advertencia" },
  { key: "nota", label: "Nota" },
];

export function DebateComposer({
  activeTool,
  activeCategory,
  colorMode,
  shape,
  style,
  template,
  text,
  onToolChange,
  onCategoryChange,
  onColorModeChange,
  onShapeChange,
  onStyleChange,
  onTemplateChange,
  onTextChange,
  onSubmit,
  onOpenCreateModal,
  onExport,
  onImport,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  isPublishing,
  showAdminJsonControls = false,
}: DebateComposerProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-[#131c2f] p-4">
      <div className="mb-3 flex flex-wrap gap-2">
        {tools.map((tool) => (
          <button
            key={tool.key}
            type="button"
            onClick={() => onToolChange(tool.key)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${activeTool === tool.key ? "bg-[#0052ff] text-white" : "bg-white/10 hover:bg-white/15"}`}
          >
            {tool.label}
          </button>
        ))}
        <button
          type="button"
          onClick={onOpenCreateModal}
          className="rounded-full border border-[#2f8bff]/45 bg-[#2f8bff]/12 px-4 py-2 text-sm font-semibold text-[#96c5ff]"
        >
          Add
        </button>
      </div>

      <div className="mb-3 flex flex-wrap gap-2">
        {categories.map((category) => (
          <button
            key={category.key}
            type="button"
            onClick={() => onCategoryChange(category.key)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] ${activeCategory === category.key ? "bg-white/20 text-white" : "bg-white/8 text-slate-300 hover:bg-white/14"}`}
          >
            {category.label}
          </button>
        ))}
      </div>

      <div className="mb-3 grid gap-2 md:grid-cols-3">
        <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
          Color
          <select value={colorMode} onChange={(event) => onColorModeChange(event.target.value as DebateWallColorMode)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0c1426] px-2 text-sm text-slate-200">
            <option value="auto">Automatico</option>
            <option value="theme">Tema</option>
            <option value="custom">Custom</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
          Forma
          <select value={shape} onChange={(event) => onShapeChange(event.target.value as DebateWallShape)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0c1426] px-2 text-sm text-slate-200">
            <option value="normal">Normal</option>
            <option value="nube">Nube</option>
            <option value="burbuja">Burbuja</option>
            <option value="etiqueta">Etiqueta</option>
            <option value="cinta">Cinta</option>
          </select>
        </label>
        <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
          Estilo
          <select value={style} onChange={(event) => onStyleChange(event.target.value as DebateWallStyle)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0c1426] px-2 text-sm text-slate-200">
            <option value="glass">Glass</option>
            <option value="blur">Blur</option>
            <option value="sepia">Sepia</option>
            <option value="dark">Dark</option>
            <option value="transparente">Transparente</option>
          </select>
        </label>
      </div>

      <div className="mb-3">
        <label className="text-xs uppercase tracking-[0.1em] text-slate-400">
          Plantilla
          <select value={template} onChange={(event) => onTemplateChange(event.target.value as DebateWallTemplate)} className="mt-1 h-10 w-full rounded-lg border border-white/10 bg-[#0c1426] px-2 text-sm text-slate-200">
            <option value="estandar">Estandar</option>
            <option value="minimal">Minimal</option>
            <option value="tarjeta">Tarjeta</option>
            <option value="moderno">Moderno</option>
            <option value="elegante">Elegante</option>
          </select>
        </label>
      </div>

      <div className="flex flex-col gap-3 md:flex-row">
        <input
          value={text}
          onChange={(event) => onTextChange(event.target.value)}
          className="h-12 flex-1 rounded-xl bg-[#091125] px-4 outline-none ring-1 ring-white/10 focus:ring-[#0052ff]"
          placeholder="Escriba su aporte al consenso aqui..."
          aria-label="Aporte"
        />
        <button
          type="button"
          onClick={onSubmit}
          disabled={isPublishing || !text.trim()}
          className="rounded-xl bg-[#0052ff] px-8 py-3 font-semibold tracking-[0.08em] disabled:cursor-not-allowed disabled:opacity-45"
        >
          {isPublishing ? "PUBLICANDO" : "PUBLICAR"}
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button type="button" onClick={onUndo} disabled={!canUndo} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200 disabled:opacity-40">
          Deshacer
        </button>
        <button type="button" onClick={onRedo} disabled={!canRedo} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200 disabled:opacity-40">
          Rehacer
        </button>
        {showAdminJsonControls && (
          <>
            <button type="button" onClick={onExport} className="rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200">
              Exportar JSON
            </button>
            <label className="cursor-pointer rounded-lg border border-white/15 px-3 py-1.5 text-xs font-semibold uppercase tracking-[0.08em] text-slate-200">
              Importar JSON
              <input
                type="file"
                accept="application/json"
                className="hidden"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    onImport(file);
                  }
                  event.currentTarget.value = "";
                }}
              />
            </label>
          </>
        )}
      </div>
    </div>
  );
}