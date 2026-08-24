import ProcessSteps from './ProcessSteps'

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

        <ProcessSteps />
      </div>
    </section>
  )
}
