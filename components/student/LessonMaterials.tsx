import type { StudyMaterial } from '@/lib/types';
import { Icon } from '@/lib/icons';
import { describeMaterial } from '@/lib/studyMaterials';

type Props = {
  materials: StudyMaterial[];
};

export function LessonMaterials({ materials }: Props) {
  return (
    <section className="lesson-materials" aria-labelledby="lesson-materials-title">
      <h2 id="lesson-materials-title">
        <Icon name="folder" size={18} /> Material de estudio
      </h2>
      <ul>
        {materials.map(material => (
          <li key={material.id}>
            <a
              href={material.url}
              target="_blank"
              rel="noopener noreferrer"
              download={material.kind === 'file' ? material.name : undefined}
              className="lesson-material-link"
            >
              <span className="lesson-material-icon" aria-hidden="true">
                <Icon name={material.kind === 'link' ? 'link' : 'file'} size={18} />
              </span>
              <span className="lesson-material-text">
                <strong>{material.name}</strong>
                <small>{describeMaterial(material)}</small>
              </span>
              <Icon name={material.kind === 'link' ? 'arrow' : 'download'} size={16} />
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
