import {landingSteps} from '../data';

export default function HowItWorks() {
  return (
    <section id="how" className="how">
      <h2>ဘယ်လိုအလုပ်လုပ်လဲ?</h2>
      <div className="steps">
        {landingSteps.map((step) => (
          <article key={step.number}>
            <span>{step.number}</span>
            <h3>{step.title}</h3>
            <p>{step.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
