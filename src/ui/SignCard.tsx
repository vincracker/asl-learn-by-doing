import { Link } from 'react-router-dom'
import type { LoadedSign } from '../signs/registry'

export function SignCard({ sign }: { sign: LoadedSign }) {
  return (
    <Link to={`/practice/${sign.id}`} className="sign-card">
      <span className={`badge ${sign.template ? 'badge--ready' : 'badge--missing'}`}>
        {sign.template ? 'ready' : 'not recorded'}
      </span>
      <span className="sign-card__gloss">{sign.gloss}</span>
      <span className="sign-card__how">{sign.how}</span>
    </Link>
  )
}
