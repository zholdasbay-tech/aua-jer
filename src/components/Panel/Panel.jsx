import PlaceStep from './PlaceStep';
import PassesStep from './PassesStep';
import ChangeStep from './ChangeStep';
import PointStep from './PointStep';
import SourcesStep from './SourcesStep';
import HelpSections from './HelpSections';
import s from './Panel.module.css';

export default function Panel() {
  return (
    <aside className={s.panel} id="panel" aria-label="Controls">
      <PlaceStep />
      <PassesStep />
      <ChangeStep />
      <PointStep />
      <SourcesStep />
      <HelpSections />
      <div className={s.foot} id="about">
        Team Edviller · project Aua Jer · Astana, Kazakhstan<br />
        NASA Space Apps Challenge 2026 · Dancing with the SARs<br />
        Not affiliated with or endorsed by NASA.
        <div className={s.keys}>Press <span className="kbd">?</span> for keyboard shortcuts.</div>
      </div>
    </aside>
  );
}
