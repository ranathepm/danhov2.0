import Link from 'next/link';

type Step = 1 | 2 | 3 | 4;

type Props = {
  current: Step;
  hasSetting?: boolean;
  hasDiamond?: boolean;
  settingSlug?: string;
  diamondId?: string;
};

const STEPS: { id: Step; label: string; sub: string; href: (q: string) => string }[] = [
  { id: 1, label: 'Create Your Ring', sub: 'Begin', href: () => '/ring-builder' },
  { id: 2, label: 'Select A Ring', sub: 'Setting', href: (q) => `/ring-builder/setting${q}` },
  { id: 3, label: 'Select A Diamond', sub: 'Stone', href: (q) => `/ring-builder/diamond${q}` },
  { id: 4, label: 'Complete Your Ring', sub: 'Confirm', href: (q) => `/ring-builder/review${q}` },
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
    <nav className="builder-stepper" aria-label="Ring builder progress">
      <ol className="builder-stepper-list">
        {STEPS.map((step) => {
          const reachable =
            step.id === 1 ||
            (step.id === 2 && true) ||
            (step.id === 3 && hasSetting) ||
            (step.id === 4 && hasSetting && hasDiamond);
          const isCurrent = step.id === current;
          const isPast = step.id < current;
          const className = `builder-stepper-item${isCurrent ? ' is-current' : ''}${isPast ? ' is-past' : ''}${!reachable ? ' is-locked' : ''}`;
          const inner = (
            <>
              <span className="builder-stepper-num">{step.id}</span>
              <span className="builder-stepper-text">
                <span className="builder-stepper-label">{step.label}</span>
                <span className="builder-stepper-sub">{step.sub}</span>
              </span>
            </>
          );
          return (
            <li key={step.id} className={className}>
              {reachable && !isCurrent ? (
                <Link href={step.href(qs)} className="builder-stepper-link">
                  {inner}
                </Link>
              ) : (
                <span className="builder-stepper-link">{inner}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function buildQuery(parts: { setting?: string; diamond?: string }): string {
  const usp = new URLSearchParams();
  if (parts.setting) usp.set('setting', parts.setting);
  if (parts.diamond) usp.set('diamond', parts.diamond);
  const s = usp.toString();
  return s ? `?${s}` : '';
}
