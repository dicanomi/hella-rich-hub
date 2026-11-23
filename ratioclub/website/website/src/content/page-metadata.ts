import {localMedia} from "./local-media.ts";
// Shared by the browser and static HTML build, so link previews don't rely on JavaScript.
export const pageMetadata = {
 '/': {title:'Ratioclub — Enterprise AWS Consulting & AI Infrastructure',description:'Ratioclub embeds senior Forward Deployed Engineers to validate GPU clusters, optimize inference, and operate production AI infrastructure on AWS.'},
 '/solutions': {title:'Solutions — Ratioclub',description:'Production AI infrastructure and inference engineering on AWS. Ratioclub validates GPU clusters, engineers inference platforms, and operates production AI.'},
 '/about': {title:'About Us — Ratioclub',description:'Meet Ratioclub: independent AI infrastructure engineering on AWS, combining architectural neutrality, senior execution, and measurable production outcomes.'},
 '/contact': {title:'Contact — Ratioclub',description:'Talk to Ratioclub about AI infrastructure, engineering collaboration, or your next project. Connect with the team or schedule an architecture review.'},
 '/terms-and-conditions': {title:'Terms & Conditions — Ratioclub',description:'Ratioclub website terms and conditions. Local design preview; approved Ratioclub legal copy is pending.'},
 '/privacy-notice': {title:'Privacy Notice — Ratioclub',description:'Ratioclub privacy notice. Local design preview; approved information about privacy and data handling is pending.'},
 '/404': {title:'Signal Down — 404 — Ratioclub',description:'This Ratioclub page could not be found. Return to the Index to explore AI infrastructure engineering, solutions, and the team.'},
};
// User-supplied social card, exported at the native 1200 × 630 sharing ratio.
export const socialImage = {path:localMedia('socialCard','/social/web-card.png'),width:1200,height:630,alt:'RatioClub wordmark on brand cyan beneath the dark spiral hero texture.'};
