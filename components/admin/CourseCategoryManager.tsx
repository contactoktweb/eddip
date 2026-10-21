'use client';
import { useMemo, useState } from 'react';
import type { Course } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { useDemo } from '@/app/providers';
import { adminService } from '@/lib/supabase/adminService';
import { settingsService } from '@/lib/supabase/settingsService';
import { useCourseCategories } from '@/lib/useSiteSettings';
import { useAdminToast } from '@/lib/useAdminToast';
import { AdminToast } from './AdminToast';

type Props = {
  courses: Course[];
};

const MAX_CATEGORY_LENGTH = 60;

export function CourseCategoryManager({ courses }: Props) {
  const { updateCourse } = useDemo();
  const { categories, loading } = useCourseCategories();
  const { toast, showToast } = useAdminToast();
  const [newCategory, setNewCategory] = useState('');
  const [editing, setEditing] = useState<{ original: string; value: string } | null>(null);
  const [busy, setBusy] = useState(false);

  const usage = useMemo(() => {
    const map = new Map<string, number>();
    for (const c of courses) map.set(c.category, (map.get(c.category) || 0) + 1);
    return map;
  }, [courses]);

  // Las categorías usadas por cursos existentes siempre se muestran, aunque no estén en la lista guardada
  const allCategories = useMemo(() => {
    const list = [...categories];
    for (const used of usage.keys()) {
      if (!list.some(c => c.toLowerCase() === used.toLowerCase())) list.push(used);
    }
    return list;
  }, [categories, usage]);

  const exists = (name: string, except?: string) =>
    allCategories.some(c => c.toLowerCase() === name.toLowerCase() && c !== except);

  const persist = async (next: string[], successMessage: string) => {
    const result = await settingsService.saveCourseCategories(next);
    if (result.success) {
      showToast('success', successMessage);
    } else {
      showToast('error', `No fue posible guardar las categorías. ${result.error ?? ''}`.trim());
    }
    return result.success;
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    if (exists(name)) {
      showToast('error', `La categoría "${name}" ya existe.`);
      return;
    }
    setBusy(true);
    if (await persist([...allCategories, name], `Categoría "${name}" creada.`)) setNewCategory('');
    setBusy(false);
  };

  const handleRename = async () => {
    if (!editing) return;
    const name = editing.value.trim();
    if (!name || name === editing.original) {
      setEditing(null);
      return;
    }
    if (exists(name, editing.original)) {
      showToast('error', `La categoría "${name}" ya existe.`);
      return;
    }

    setBusy(true);
    const affected = courses.filter(c => c.category === editing.original);
    const saved = await persist(
      allCategories.map(c => (c === editing.original ? name : c)),
      affected.length > 0
        ? `Categoría renombrada y ${affected.length} curso(s) actualizados.`
        : 'Categoría renombrada.'
    );

    if (saved) {
      for (const course of affected) {
        const updated = { ...course, category: name };
        await adminService.saveCourse(updated);
        updateCourse(updated);
      }
      setEditing(null);
    }
    setBusy(false);
  };

  const handleDelete = async (name: string) => {
    if ((usage.get(name) || 0) > 0) return;
    if (!confirm(`¿Eliminar la categoría "${name}"?`)) return;
    setBusy(true);
    await persist(allCategories.filter(c => c !== name), `Categoría "${name}" eliminada.`);
    setBusy(false);
  };

  return (
    <section id="categorias" className="settings-card category-manager" aria-labelledby="category-manager-title">
      <AdminToast toast={toast} />

      <div className="settings-card-head">
        <span className="settings-card-icon" aria-hidden="true">
          <Icon name="tag" size={20} />
        </span>
        <div>
          <h2 id="category-manager-title">Categorías de cursos</h2>
          <p>
            Crea las categorías aquí y asígnalas a cada curso desde el campo «Categoría académica» al crearlo o editarlo.
            Las categorías se muestran en el catálogo público y en el pie de página.
          </p>
        </div>
      </div>

      <form className="category-add-form" onSubmit={handleAdd}>
        <label htmlFor="newCategoryName" className="sr-only">Nombre de la nueva categoría</label>
        <input
          id="newCategoryName"
          value={newCategory}
          maxLength={MAX_CATEGORY_LENGTH}
          onChange={e => setNewCategory(e.target.value)}
          placeholder="Nombre de la nueva categoría, ej. Derechos Humanos"
          disabled={busy}
        />
        <button type="submit" className="btn btn-primary" disabled={busy || !newCategory.trim()}>
          <Icon name="plus" size={15} /> Crear categoría
        </button>
      </form>

      {loading ? (
        <p className="category-empty">Cargando categorías…</p>
      ) : (
        <ul className="category-chip-list">
          {allCategories.map(category => {
            const count = usage.get(category) || 0;
            const isEditing = editing?.original === category;
            return (
              <li key={category} className="category-chip ui-fade-up">
                {isEditing ? (
                  <form
                    className="category-chip-edit"
                    onSubmit={e => {
                      e.preventDefault();
                      handleRename();
                    }}
                  >
                    <label htmlFor={`rename-${category}`} className="sr-only">Nuevo nombre para {category}</label>
                    <input
                      id={`rename-${category}`}
                      value={editing.value}
                      maxLength={MAX_CATEGORY_LENGTH}
                      onChange={e => setEditing({ original: category, value: e.target.value })}
                      onKeyDown={e => e.key === 'Escape' && setEditing(null)}
                      autoFocus
                      disabled={busy}
                    />
                    <button type="submit" className="icon-btn" aria-label="Guardar nombre" disabled={busy}>
                      <Icon name="check" size={14} />
                    </button>
                    <button type="button" className="icon-btn" aria-label="Cancelar" onClick={() => setEditing(null)}>
                      <Icon name="close" size={14} />
                    </button>
                  </form>
                ) : (
                  <>
                    <span className="category-chip-name">{category}</span>
                    <span className="category-chip-count">
                      {count} {count === 1 ? 'curso' : 'cursos'}
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      aria-label={`Renombrar categoría ${category}`}
                      onClick={() => setEditing({ original: category, value: category })}
                      disabled={busy}
                    >
                      <Icon name="edit" size={14} />
                    </button>
                    <button
                      type="button"
                      className="icon-btn icon-btn-danger"
                      aria-label={`Eliminar categoría ${category}`}
                      title={count > 0 ? 'Reasigna los cursos de esta categoría antes de eliminarla' : 'Eliminar categoría'}
                      onClick={() => handleDelete(category)}
                      disabled={busy || count > 0}
                    >
                      <Icon name="trash" size={14} />
                    </button>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
