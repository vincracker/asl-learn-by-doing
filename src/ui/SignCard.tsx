import { Link } from 'react-router-dom'
import type { LoadedSign } from '../signs/registry'

export function SignCard({ sign }: { sign: LoadedSign }) {
  return (
    <Link
      to={`/practice/${sign.id}`}
      className="card border-2 border-base-300 bg-base-100 transition-colors hover:border-accent"
    >
      <div className="card-body items-start gap-2 p-4">
        <span className={`badge badge-sm ${sign.template ? 'badge-success' : 'badge-warning'}`}>
          {sign.template ? 'ready' : 'not recorded'}
        </span>
        <span className="text-lg font-bold">{sign.gloss}</span>
        <span className="text-sm leading-relaxed opacity-60">{sign.how}</span>
      </div>
    </Link>
  )
}
