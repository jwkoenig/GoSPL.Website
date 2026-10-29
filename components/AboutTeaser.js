import ProcessSteps from './ProcessSteps'
import Founders from './Founders'
import Locations from './Locations'

export default function AboutTeaser() {
  return (
    <section id="about" className="about-section">
      <div className="wrap">
        <h2>About GoSPL</h2>
        <p>
          GoSPL is a viewer and authoring suite for Gaussian Splatting — a real-time, photoreal 3D
          capture format. We photograph a space in available light or render the scene from a 3D
          model, reconstruct it as a volumetric scene, and hand you a tour that runs in any browser.
        </p>
        <p>
          We turn your spaces and products interactive online, mobile first. We are your partner
          for capture, authoring and delivery.
        </p>
        <p>
          For interactive memories and events — weddings, birthdays, photobooths and live
          moments — our sister studio{' '}
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
