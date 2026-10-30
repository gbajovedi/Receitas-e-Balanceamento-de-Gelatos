import React, { useState } from 'react';
import { X, Save, BookmarkPlus, CheckCircle2 } from 'lucide-react';

interface SaveRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentCategory: string;
  isExisting: boolean;
  onUpdateExisting: (name: string, category: string, notes: string) => Promise<void>;
  onSaveAsNew: (name: string, category: string, notes: string) => Promise<void>;
}

export const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentCategory,
  isExisting,
  onUpdateExisting,
  onSaveAsNew,
}) => {
  const [mode, setMode] = useState<'update' | 'new'>(isExisting ? 'update' : 'new');
  const [name, setName] = useState(currentName);
  const [category, setCategory] = useState(currentCategory || 'Gelatos de Leite');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === 'update') {
        await onUpdateExisting(name.trim(), category, notes.trim());
      } else {
        await onSaveAsNew(name.trim(), category, notes.trim());
      }
      onClose();
    } catch (err) {
      alert('Erro ao salvar receita: ' + err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl w-full max-w-md p-6 shadow-2xl relative space-y-4">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1.5 rounded-xl hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div>
          <h3 className="text-xl font-black text-white">
            {mode === 'update' ? 'Atualizar Receita' : 'Salvar Receita Balanceada'}
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            As alterações são gravadas diretamente no banco de dados offline do seu navegador.
          </p>
        </div>

        {isExisting && (
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setMode('update');
                setName(currentName);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'update'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Atualizar Receita</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('new');
                setName(`${currentName} (Cópia)`);
              }}
              className={`py-2 text-xs sm:text-sm font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                mode === 'new'
                  ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Salvar como Nova</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Nome da Receita:
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
              placeholder="Ex: Fior di Latte Especial"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Categoria de Estilo:
            </label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2.5 text-sm text-white font-semibold focus:outline-none focus:border-amber-500"
            >
              <option value="Gelatos de Leite">Gelatos de Leite</option>
              <option value="Sorbets">Sorbets</option>
              <option value="Gelatos de Leite com Fruta">Gelatos de Leite com Fruta</option>
              <option value="Chocolate base água">Chocolate base água</option>
              <option value="Vegano">Vegano</option>
              <option value="Alcoólicos">Alcoólicos</option>
              <option value="Zero">Zero</option>
              <option value="Gelatos Proteicos">Gelatos Proteicos</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Observações / Notas Técnicas (opcional):
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={e => setNotes(e.target.value)}
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
              placeholder="Ex: Calibrado com 10g a menos de sacarose, consistência ideal para vitrine a -11°C."
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2 active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : mode === 'update' ? 'Confirmar Atualização' : 'Salvar Nova Receita'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
