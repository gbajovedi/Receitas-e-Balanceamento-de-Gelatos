import React, { useState } from 'react';
import { X, Save, BookmarkPlus } from 'lucide-react';

interface SaveRecipeModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentName: string;
  currentCategory: string;
  isExisting: boolean;
  onUpdateExisting: () => Promise<void>;
  onSaveAsNew: (name: string, category: string, notes: string) => Promise<void>;
}

export const SaveRecipeModal: React.FC<SaveRecipeModalProps> = ({
  isOpen,
  onClose,
  currentName,
  currentCategory,
  isExisting,
  onUpdateExisting,
  onSaveAsNew
}) => {
  const [mode, setMode] = useState<'update' | 'new'>(isExisting ? 'update' : 'new');
  const [name, setName] = useState(isExisting ? `${currentName} (Ajustada)` : currentName);
  const [category, setCategory] = useState(currentCategory || 'Gelatos de Leite');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (mode === 'update') {
        await onUpdateExisting();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
        >
          <X className="w-5 h-5" />
        </button>

        <h3 className="text-lg font-bold text-white mb-1">Salvar Receita Balanceada</h3>
        <p className="text-xs text-slate-400 mb-5">
          As alterações ficam salvas no armazenamento seguro do seu dispositivo (IndexedDB).
        </p>

        {isExisting && (
          <div className="grid grid-cols-2 gap-2 mb-4 p-1 bg-slate-800 rounded-xl">
            <button
              type="button"
              onClick={() => setMode('update')}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'update'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Save className="w-3.5 h-3.5" />
              <span>Atualizar Original</span>
            </button>
            <button
              type="button"
              onClick={() => setMode('new')}
              className={`py-2 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                mode === 'new'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <BookmarkPlus className="w-3.5 h-3.5" />
              <span>Salvar como Nova</span>
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'new' ? (
            <>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Nome da Receita:
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Fior di Latte Especial"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Categoria de Estilo:
                </label>
                <select
                  value={category}
                  onChange={e => setCategory(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
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
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Observações / Notas do Mestre Gelatiere (opcional):
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                  placeholder="Ex: Teste com 10g a menos de sacarose, ficou ideal para a cuba 3."
                />
              </div>
            </>
          ) : (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300">
              Você está prestes a atualizar a receita existente <strong>"{currentName}"</strong> com os novos pesos e ingredientes da calculadora.
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? 'Salvando...' : 'Confirmar e Salvar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
