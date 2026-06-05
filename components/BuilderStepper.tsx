import Link from 'next/link';

/**
 * 3-step wizard stepper matching the Nivoda ring builder reference.
 * Steps: 1 = Setting, 2 = Diamond, 3 = Complete your Ring
 */
type Step = 1 | 2 | 3;

type Props = {
  current: Step;
  hasSetting?: boolean;
  hasDiamond?: boolean;
  settingSlug?: string;
  diamondId?: string;
};

function RingIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <line x1="12" y1="5" x2="12" y2="3" />
      <circle cx="12" cy="2" r="1" fill="currentColor" stroke="none" />
    </svg>
  );
}

function DiamondIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <polygon points="12,2 22,9 12,22 2,9" />
      <polyline points="2,9 12,15 22,9" />
      <line x1="12" y1="2" x2="12" y2="15" />
    </svg>
  );
}

function CompleteIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="12" r="7" />
      <circle cx="12" cy="12" r="3" />
      <circle cx="12" cy="5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

const STEPS: {
  id: Step;
  sub: string;
  name: string;
  icon: React.ReactNode;
  href: (qs: string) => string;
}[] = [
  {
    id: 1,
    sub: 'Choose a',
    name: 'Setting',
    icon: <RingIcon />,
    href: (qs) => `/ring-builder/setting${qs}`,
  },
  {
    id: 2,
    sub: 'Choose a',
    name: 'Diamond',
    icon: <DiamondIcon />,
    href: (qs) => `/ring-builder/diamond${qs}`,
  },
  {
    id: 3,
    sub: 'Complete your',
    name: 'Ring',
    icon: <CompleteIcon />,
    href: (qs) => `/ring-builder/review${qs}`,
  },
];

export default function BuilderStepper({
  current,
  hasSetting,
  hasDiamond,
  settingSlug,
  diamondId,
}: Props) {
  const qs = buildQuery({ setting: settingSlug, diamond: diamondId });

  return (
    <nav className="rb-stepper" aria-label="Ring builder steps">
      <ol className="rb-stepper-list">
        {STEPS.map((step, idx) => {
          const reachable =
            step.id === 1 ||
            (step.id === 2 && hasSetting) ||
            (step.id === 3 && hasSetting && hasDiamond);
          const isCurrent = step.id === current;
          const isDone = step.id < current;

          const badge = (
            <span
              className={`rb-step-badge${isCurrent ? ' rb-step-badge--active' : ''}${isDone ? ' rb-step-badge--done' : ''}`}
            >
              {step.id}
            </span>
          );

          const content = (
            <span className="rb-step-content">
              <span className="rb-step-sub">{step.sub}</span>
              <span className="rb-step-name">
                {step.icon}
                {step.name}
              </span>
            </span>
          );

          const inner = (
            <>
              {badge}
              {content}
            </>
          );

          const cls = [
            'rb-step',
            isCurrent ? 'rb-step--active' : '',
            isDone ? 'rb-step--done' : '',
            !reachable ? 'rb-step--locked' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <li key={step.id} className={cls}>
              {reachable && !isCurrent ? (
                <Link href={step.href(qs)} className="rb-step-link">
                  {inner}
                </Link>
              ) : (
                <span className="rb-step-link">{inner}</span>
              )}
              {idx < STEPS.length - 1 && (
                <span className="rb-step-sep" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function buildQuery(parts: { setting?: string; diamond?: string }): string {
  const p = new URLSearchParams();
  if (parts.setting) p.set('setting', parts.setting);
  if (parts.diamond) p.set('diamond', parts.diamond);
  const s = p.toString();
  return s ? `?${s}` : '';
}
