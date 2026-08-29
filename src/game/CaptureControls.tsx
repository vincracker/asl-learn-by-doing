import type { CaptureMode, CaptureState } from './useSignCapture'

type Props = {
  mode: CaptureMode
  onModeChange: (mode: CaptureMode) => void
  state: CaptureState
  onTap: () => void
  disabled?: boolean
}

const TAP_LABEL: Record<CaptureState, string> = {
  idle: 'Tap to sign',
  armed: 'Get into position — starts when you move',
  capturing: 'Signing… stop when you finish',
}

/**
 * Capture mode switch plus the tap-to-sign button.
 *
 * Tap mode is the dependable path: the signer taps, takes as long as they like getting
 * into position, and recording begins on their first real movement and ends when they
 * stop. Auto mode skips the tap but will trigger on any movement in frame, so it is the
 * one to abandon when the room is busy.
 */
export function CaptureControls({ mode, onModeChange, state, onTap, disabled }: Props) {
  const active = state !== 'idle'

  return (
    <div className="flex flex-col gap-2.5">
      <div role="tablist" className="tabs tabs-box">
        <button
          role="tab"
          className={`tab ${mode === 'tap' ? 'tab-active' : ''}`}
          onClick={() => onModeChange('tap')}
          disabled={disabled}
        >
          Tap to sign
        </button>
        <button
          role="tab"
          className={`tab ${mode === 'auto' ? 'tab-active' : ''}`}
          onClick={() => onModeChange('auto')}
          disabled={disabled}
        >
          Auto-detect
        </button>
      </div>

      {mode === 'tap' ? (
        <>
          <button
            className={`btn ${active ? 'btn-neutral' : 'btn-primary'}`}
            onClick={onTap}
            disabled={disabled}
          >
            {TAP_LABEL[state]}
          </button>
          <p className="text-sm opacity-60">
            {active
              ? 'Tap again to cancel. The take ends on its own once you stop moving.'
              : 'Tap, get into position, then sign. Space bar works too.'}
          </p>
        </>
      ) : (
        <p className="text-sm opacity-60">Start moving to begin; pause when you finish the sign.</p>
      )}
    </div>
  )
}
