import Icon from '../icons/Icon';
import s from './Panel.module.css';

// A numbered section of the panel. status: 'todo' | 'active' | 'done'
export default function Step({ n, id, title, status = 'todo', aside, children }) {
  return (
    <section className={s.step + ' ' + s[status]} id={id} aria-labelledby={id + '-title'}>
      <header className={s.head}>
        <span className={s.num} aria-hidden="true">{status === 'done' ? <Icon name="check" size={13} /> : n}</span>
        <h2 className={s.title} id={id + '-title'}>{title}</h2>
        {aside ? <span className={s.aside} title={typeof aside === 'string' ? aside : undefined}>{aside}</span> : null}
      </header>
      {children}
    </section>
  );
}
