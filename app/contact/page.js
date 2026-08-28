import ContactForm from '@/components/ContactForm'

export const metadata = {
  title: 'Contact — GoSPL',
}

export default function ContactPage() {
  return (
    <main id="main" className="page page-offset">
      <div className="wrap">
        <div className="contact-wrap">
          <h1>Have a space to showcase?</h1>
          <ContactForm />
        </div>
      </div>
    </main>
  )
}
