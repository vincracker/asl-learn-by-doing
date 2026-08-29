import type { ReactNode } from 'react'

type GameFact = {
  label: string
  value: string | number
}

export function GameIntro({
  art,
  eyebrow,
  title,
  description,
  facts,
  action,
  onStart,
  children,
}: {
  art: ReactNode
  eyebrow: string
  title: string
  description: string
  facts: GameFact[]
  action: string
  onStart: () => void
  children?: ReactNode
}) {
  return (
    <section className="gameintro">
      <div className="gameintro__art" aria-hidden="true">
        {art}
      </div>

      <div className="gameintro__content">
        <p className="eyebrow">{eyebrow}</p>
        <p className="gameintro__title">{title}</p>
        <p className="gameintro__description">{description}</p>

        <dl className="gamefacts">
          {facts.map((fact) => (
            <div key={fact.label}>
              <dt>{fact.label}</dt>
              <dd>{fact.value}</dd>
            </div>
          ))}
        </dl>

        {children}

        <div className="btnrow">
          <button className="btn btn-primary" onClick={onStart}>
            {action}
          </button>
        </div>
      </div>
    </section>
  )
}
