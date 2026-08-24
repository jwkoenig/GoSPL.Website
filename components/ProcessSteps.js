import { PROCESS } from '@/data/process'

export default function ProcessSteps() {
  return (
    <div className="process">
      {PROCESS.map((step) => (
        <div key={step.num} className="pstep">
          <div className="num">{step.num}</div>
          <h3>{step.title}</h3>
          <p>{step.body}</p>
        </div>
      ))}
    </div>
  )
}
