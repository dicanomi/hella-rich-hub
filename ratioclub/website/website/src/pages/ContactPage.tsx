import { useState } from 'react';
import type { FormEvent } from 'react';
import { SubpageHero } from '../components/SubpageHero';
import { Footer } from '../components/Footer';
import { contactConfig } from '../config/contact';
import arrow from '../assets/arrow-right-desktop.svg';
import artwork from '../assets/hero-about-eight-arms.svg';
import './contact.css';
export default function ContactPage(){
 const [submitted,setSubmitted]=useState(false);
 // Disconnected preview: report that nothing was sent; never imply delivery.
 function sendMessage(event:FormEvent<HTMLFormElement>){
  event.preventDefault();
  setSubmitted(true);
 }

 return <div className="contact-page">
  <a className="skip-link" href="#contact-form">Skip to contact form</a>
  <SubpageHero title="Contact" artwork={artwork} width={211} height={211}/>
  <main className="contact-layout">
   <div className="contact-introduction"><h2>Let’s talk about what you’re building.</h2><p>Tell us about your infrastructure, the challenge you’re working through, or a collaboration you have in mind.</p>
    <a className="contact-email" href={`mailto:${contactConfig.email}`}>{contactConfig.email}</a>

   </div>
   <div id="contact-form" className="contact-form">
   {submitted ? <p className="contact-send-status" role="status">Message not sent. Email delivery is currently disconnected. Please email hello@ratioclub.com.</p> : <form inert={typeof document === "undefined"} onSubmit={sendMessage}>
    <div className="contact-field"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" autoComplete="name" required maxLength={120}/></div>
    <div className="contact-field"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" autoComplete="email" required maxLength={254}/></div>
    <div className="contact-field"><label htmlFor="contact-company">Company <span>(optional)</span></label><input id="contact-company" name="company" autoComplete="organization" maxLength={160}/></div>
    <div className="contact-field"><label htmlFor="contact-message">Message</label><textarea id="contact-message" name="message" required rows={7} maxLength={5000}/></div>
    <button className="primary-action" type="submit"><span>SEND MESSAGE</span><span className="action-arrow" aria-hidden="true" style={{maskImage:`url("${arrow}")`}}/></button>
   </form>}
   </div>
  </main><Footer/>
 </div>;
}
