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
       

        <Founders />
        <Locations />
        <ProcessSteps />
      </div>
    </section>
  )
}
