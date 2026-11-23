export const advantageContent = {
  eyebrow: "Consulting Delivers Advice. We Ship Production AI.",
  title: "The Forward Deployed Advantage",
  points: [
    {
      title: "Directly Embedded:",
      body: "Our FDEs embed with your engineering teams to configure cluster hardware and deploy production IaC.",
    },
    {
      title: "Audit-Ready Ownership:",
      body: "Retain 100% ownership of all raw benchmark datasets, deployment scripts, and acceptance evidence engineered for your team.",
    },
    {
      title: "Outcome-Based Accountability:",
      body: "Engagements are measured by hard benchmarks—throughput per GPU, cost per token, and system availability.",
    },
  ],
} as const;

export const testimonialContent = {
  quote:
    "RatioClub shipped production AI agents with enterprise evals and cost controls – within weeks. We gained senior AI engineering expertise immediately, without months of hiring.",
  attribution: "~ Peco Karayanev, CTO, Autoptic",
} as const;

export const featureContent = {
  eyebrow: "AWS AI Infrastructure & Forward Deployed Engineering",
  title: "Engineered for Scale, Speed, and Efficiency",
  cards: [
    {
      title: "100% Senior FDEs:",
      body: "Hands-on execution alongside your team; no passive advisory decks.",
    },
    {
      title: "Optimization",
      body: "Achieve sub-millisecond inference latency with custom vLLM, TensorRT-LLM, and Neuron SDK integration.",
    },
    {
      title: "Outcome SLAs",
      body: "Engagements measured on throughput, token costs, and uptime.",
    },
    {
      title: "Validation",
      body: "Become audit ready – 100% client ownership of benchmark data, code, and IaC scripts.",
    },
  ],
} as const;

export const solutionsContent = {
  eyebrow: "Production AI Engineering Pillars",
  title: "Core Solutions Overview",
  cards: [
    {
      title: "GPU Cluster & UltraCluster Validation",
      caption: "Diagram: GPU scale, ideal capacity, and validated capacity.",
      body: "Pre-flight benchmarking of Amazon EC2 UltraClusters, P5/P4de instances, and Trainium nodes. EFA interconnect benchmarking, NCCL collective tuning, and memory stress testing.",
    },
    {
      title: "High-Throughput AI Inference Platforms",
      caption: "Diagram: throughput and the operating point.",
      body: "Low-latency inference deployment on Amazon Bedrock, SageMaker, and self-hosted EKS/EC2. Custom optimization via vLLM, TensorRT-LLM, dynamic batching, and AWS Neuron SDK.",
    },
    {
      title: "Managed Production AI Operations",
      caption:
        "Diagram: drift and recovery over time, relative to the SLA band.",
      body: "Transition experimental models to 24/7 mission-critical production with outcome-based SLAs. Proactive drift detection, SageMaker/Karpenter autoscaling governance, and real-time observability.",
    },
  ],
} as const;

export const conversionContent = {
  title: "Deploy Production AI on AWS with Guaranteed Velocity",
  body: "Whether you are validating a multi-node GPU cluster, launching Amazon Bedrock workloads, or seeking co-funded AWS program support, our Forward Deployed Engineers are ready to embed.",
  action: "COME SAY HI!",
  actionIntent: "contact" as const,
} as const;
