export const indexContent = {
  title: "Enterprise AWS Consulting & Scalable AI Infrastructure",
  primaryAction: "Schedule an Architecture Review",
  introductionDetail:
    "From EC2 UltraCluster and EFA interconnect validation to high-throughput AI inference across Amazon SageMaker, Bedrock, and self-hosted EKS, we eliminate compute bottlenecks, maximize GPU efficiency, and accelerate time-to-production under outcome-based SLAs.",
} as const;

// Only confirmed Ratioclub destinations belong here. Never import legal placeholders.
export const navigationItems = [
  { label: "Solutions", path: "/solutions", external: false },
  { label: "About Us", path: "/about", external: false },
  { label: "Contact", path: "/contact", external: false },
  { label: "Privacy Notice", path: "/privacy-notice", external: false },
  {
    label: "Terms & Conditions",
    path: "/terms-and-conditions",
    external: false,
  },
  { label: "RatioClub", path: "/", external: false },
  { label: "GitHub", path: "https://github.com/the-ratio-club/", external: true },
  { label: "LinkedIn", path: "https://www.linkedin.com/company/ratioclub/", external: true },
] as const;

export const legalNavigationItems=navigationItems.filter(item=>item.path==='/privacy-notice'||item.path==='/terms-and-conditions');
export const primaryNavigationItems=navigationItems.filter(item=>item.path!=='/privacy-notice'&&item.path!=='/terms-and-conditions');
