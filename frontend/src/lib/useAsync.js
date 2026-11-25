import { useCallback, useEffect, useRef, useState } from 'react'

// Runs an async loader and tracks {data, error, loading}. Re-runs when deps change.
// Ignores results from older calls (fast typing in search never shows stale results)
// and from calls that finish after the page has been left.
export function useAsync(loader, deps) {
  const [state, setState] = useState({ data: null, error: null, loading: true })
  const callId = useRef(0)

  const run = useCallback(async () => {
    const id = ++callId.current
    setState((s) => (s.loading && !s.error ? s : { ...s, loading: true, error: null }))
    try {
      const data = await loader()
      if (id === callId.current) setState({ data, error: null, loading: false })
    } catch (error) {
      if (id === callId.current) setState((s) => ({ ...s, error, loading: false }))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps)

  useEffect(() => {
    run()
    return () => {
      callId.current += 1 // anything still loading for the old deps is ignored
    }
  }, [run])

  const setData = useCallback((data) => setState((s) => ({ ...s, data })), [])

  return { ...state, reload: run, setData }
}
