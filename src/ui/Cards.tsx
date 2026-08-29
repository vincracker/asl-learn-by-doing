import { Link } from 'react-router-dom'
import type { ReactNode } from 'react'
import { SceneArt, type SceneArtId } from './scenes'

function Chips({ items }: { items: string[] }) {
  return (
    <div className="words">
      {items.map((c) => (
        <span key={c} className="chip">
          {c}
        </span>
      ))}
    </div>
  )
}

type Body = {
  art: SceneArtId
  tag: ReactNode
  name: string
  desc: string
  chips: string[]
  extra?: ReactNode
}

function CardBody({ art, tag, name, desc, chips, extra }: Body) {
  return (
    <>
      {tag}
      <div className="art">
        <SceneArt id={art} />
      </div>
      <div className="meta">
        <h3>{name}</h3>
        <p className="desc">{desc}</p>
        {extra}
        <Chips items={chips} />
      </div>
    </>
  )
}

/** A card that goes somewhere. */
export function LinkCard({ to, ...body }: Body & { to: string }) {
  return (
    <Link className="tile" to={to}>
      <CardBody {...body} />
    </Link>
  )
}

/** A card that doesn't — locked scenarios and games still in development. */
export function LockedCard(body: Body) {
  return (
    <div className="tile locked" aria-disabled="true">
      <CardBody {...body} />
    </div>
  )
}

export function Tag({ kind, children }: { kind: 'open' | 'done' | 'locked'; children: ReactNode }) {
  return <span className={`tag${kind === 'open' ? '' : ` ${kind}`}`}>{children}</span>
}
