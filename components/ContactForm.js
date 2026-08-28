'use client'

import { useState, useMemo } from 'react'

const WEB3FORMS_ACCESS_KEY = '2ed464e2-539d-46c2-b552-2ecf5c799b73'

function makeCaptcha() {
  const a = 1 + Math.floor(Math.random() * 9)
  const b = 1 + Math.floor(Math.random() * 9)
  return { a, b, answer: String(a + b) }
}

export default function ContactForm() {
  const [captcha, setCaptcha] = useState(makeCaptcha)
  const [captchaInput, setCaptchaInput] = useState('')
  const [status, setStatus] = useState('idle') // idle | submitting | success | error
  const [errorMsg, setErrorMsg] = useState('')

  const captchaQuestion = useMemo(() => `${captcha.a} + ${captcha.b} = ?`, [captcha])

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')

    const form = e.target
    if (form.botcheck.checked) return // honeypot tripped, silently ignore

    if (captchaInput.trim() !== captcha.answer) {
      setErrorMsg('That answer isn’t quite right — please try again.')
      setCaptcha(makeCaptcha())
      setCaptchaInput('')
      return
    }

    setStatus('submitting')

    try {
      const res = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'New message from gospl.io contact form',
          from_name: form.name.value,
          name: form.name.value,
          email: form.email.value,
          message: form.message.value,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setStatus('success')
        form.reset()
        setCaptchaInput('')
        setCaptcha(makeCaptcha())
      } else {
        throw new Error(data.message || 'Something went wrong.')
      }
    } catch (err) {
      setStatus('error')
      setErrorMsg('Something went wrong — please email us directly at studio@gospl.io.')
    }
  }

  if (status === 'success') {
    return <p className="form-success">Thanks — your message is on its way. We’ll get back to you soon.</p>
  }

  return (
    <form className="contact-form" onSubmit={handleSubmit}>
      <input type="checkbox" name="botcheck" className="form-honeypot" tabIndex={-1} autoComplete="off" aria-hidden="true" />

      <div className="form-field">
        <label htmlFor="name">Name</label>
        <input id="name" name="name" type="text" required autoComplete="name" />
      </div>

      <div className="form-field">
        <label htmlFor="email">Email</label>
        <input id="email" name="email" type="email" required autoComplete="email" />
      </div>

      <div className="form-field">
        <label htmlFor="message">Message</label>
        <textarea id="message" name="message" rows={5} required />
      </div>

      <div className="form-field">
        <label htmlFor="captcha">{captchaQuestion}</label>
        <input
          id="captcha"
          type="text"
          inputMode="numeric"
          required
          value={captchaInput}
          onChange={(e) => setCaptchaInput(e.target.value)}
        />
      </div>

      {errorMsg && <p className="form-error">{errorMsg}</p>}

      <button type="submit" className="form-submit" disabled={status === 'submitting'}>
        {status === 'submitting' ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
