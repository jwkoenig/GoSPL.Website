import ProcessSteps from './ProcessSteps'
import Founders from './Founders'
import Locations from './Locations'

export default function AboutTeaser() {
  return (
    <section id="about" className="about-section">
      <div className="wrap">
        <h2>About GoSPL</h2>
        <p>
          We turn your spaces and products interactive online, mobile first. We are your partner
          for capture, authoring and delivery.
        </p>
        <p>
          For interactive memories and events - weddings, birthdays, photobooths and live
          moments - our sister studio{' '}
          <a href="https://laika-studio.de/de/" target="_blank" rel="noopener noreferrer">Laika</a>{' '}
          brings the same technology to life&apos;s personal milestones.
        </p>

        <Founders />
        <Locations />
        <ProcessSteps />
      </div>
    </section>
  )
}
