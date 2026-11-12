import { useCallback, useEffect, useState } from 'react'

/**
 * Minimal form state: values, errors, field binders, and focus-first-error after a failed submit.
 *   const f = useFormState(initial)
 *   <Input {...f.bind('name')} />   <Toggle {...f.bindToggle('isVip')} />
 */
export const useFormState = (initial) => {
  const [values, setValues] = useState(initial)
  const [errors, setErrors] = useState({})
  const [attempt, setAttempt] = useState(0)
  const [initialJson] = useState(() => JSON.stringify(initial))

  const setValue = useCallback((name, value) => {
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e))
  }, [])

  useEffect(() => {
    if (!attempt) return
    const el = document.querySelector('form [aria-invalid="true"]')
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.focus({ preventScroll: true })
    }
  }, [attempt])

  return {
    values,
    errors,
    setValue,
    setValues,
    dirty: JSON.stringify(values) !== initialJson,
    fail: (errs) => { setErrors(errs); setAttempt((n) => n + 1) },
    clearError: (name) => setErrors((e) => (e[name] ? { ...e, [name]: undefined } : e)),
    bind: (name) => ({ name, value: values[name] ?? '', error: errors[name], onChange: (e) => setValue(name, e.target.value) }),
    bindToggle: (name) => ({ checked: Boolean(values[name]), onChange: (v) => setValue(name, v) }),
  }
}

export default useFormState
