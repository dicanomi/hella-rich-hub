export const solutionServices = [
  {
    "id": "gpu",
    "number": "01",
    "title": "AWS GPU Cluster & EC2 UltraCluster Validation",
    "subtitle": "Pre-Flight Benchmarking, Interconnect Tuning & Acceptance Testing",
    "introduction": "Embedded FDEs validate Amazon EC2 UltraClusters, P5/P4de instances, and AWS Trainium nodes before going live—eliminating silent hardware degradation, unblocking interconnect bottlenecks, and providing audit-ready acceptance evidence you own.",
    "points": [
      {
        "label": "GPUDirect RDMA over EFA:",
        "body": "Network topology profiling and Elastic Fabric Adapter optimization for distributed workloads."
      },
      {
        "label": "NCCL Collective Tuning:",
        "body": "Eliminating all-reduce synchronization delays across multi-node cluster topologies."
      },
      {
        "label": "Bandwidth & Stress Testing:",
        "body": "High-stress memory bandwidth validation, thermal throttling detection, and PyTorch DDP benchmarking."
      },
      {
        "label": "Acceptance Evidence:",
        "body": "Comprehensive pre-production documentation and sign-off verification required for enterprise handoff and AWS milestone funding."
      }
    ],
    "caption": "Connected compute: EFA / RDMA. Stress and synchronize: NCCL / bandwidth. Acceptance evidence: client-owned.",
    "width": 636.15234375,
    "height": 872.666748046875
  },
  {
    "id": "inference",
    "number": "02",
    "title": "AWS AI Inference Platform Engineering",
    "subtitle": "Latency Reduction, vLLM Optimization & Cost-Per-Token Yield",
    "introduction": "Forward Deployed Engineers architect high-throughput, low-latency inference pipelines across Amazon Bedrock, Amazon SageMaker, and self-hosted EC2/EKS environments to maximize compute yield per watt and minimize cost per token.",
    "points": [
      {
        "label": "Engine Optimization:",
        "body": "Custom runtime compilation and tuning using vLLM, TensorRT-LLM, and TGI."
      },
      {
        "label": "AWS Neuron SDK Integration:",
        "body": "Custom ASIC acceleration and model porting for AWS Inferentia2 and Trainium hardware."
      },
      {
        "label": "Dynamic Batching & Memory Management:",
        "body": "PagedAttention tuning, continuous batching configurations, and speculative decoding implementation."
      },
      {
        "label": "Enterprise Routing:",
        "body": "Secure model gateway routing, token usage guardrails, and hybrid fallback between managed APIs and OSS models."
      }
    ],
    "caption": "Route requests: secure gateway. Batch / compile / decode: vLLM / Neuron. Deliver tokens: latency / yield.",
    "width": 635.2578125,
    "height": 850.69873046875
  },
  {
    "id": "operations",
    "number": "03",
    "title": "Managed Production AI Operations on AWS",
    "subtitle": "24/7 Mission-Critical Reliability Under Outcome-Based SLAs",
    "introduction": "Transition experimental AI pilots into 24/7 mission-critical production with embedded FDE coverage taking direct operational accountability for uptime, tail latency (P99), and ongoing AWS cloud cost governance.",
    "points": [
      {
        "label": "Autoscaling Governance:",
        "body": "Fast scale-out policies on SageMaker endpoints and Karpenter-managed EKS GPU node pools."
      },
      {
        "label": "Proactive Infrastructure Drift Detection:",
        "body": "Automated drift identification, IaC state validation, and continuous health checking."
      },
      {
        "label": "Full-Stack Observability:",
        "body": "Real-time CloudWatch telemetry, Prometheus/Grafana GPU metrics dashboards, and automated alerting."
      },
      {
        "label": "FinOps Optimization:",
        "body": "Active elimination of idle GPU compute, Spot/Savings Plans orchestration, and token cost attribution."
      }
    ],
    "caption": "Production node pools: EKS / SageMaker. Observe and detect: drift / telemetry. Scale and recover: uptime / cost.",
    "width": 633.37890625,
    "height": 826.03369140625
  }
] as const;

export const solutionComparison = [
  {
    "dimension": "Execution Model",
    "traditional": "Advisory decks, high-level governance roadmaps, and detached junior delivery benches.",
    "label": "Hands-on Execution:",
    "body": "Senior FDEs sit alongside your platform, infrastructure, and ML teams to ship code, configure cluster hardware, and push production IaC."
  },
  {
    "dimension": "Asset Ownership",
    "traditional": "Proprietary consulting IP, black-box platforms, or recurring service lock-in.",
    "label": "Audit-Ready Ownership:",
    "body": "You retain 100% of the raw benchmark data, reproducible test scripts, IaC modules, and acceptance evidence engineered during the engagement."
  },
  {
    "dimension": "Commercial Structure",
    "traditional": "Open-ended billable hours with shifting timelines and uncommitted delivery outcomes.",
    "label": "Outcome-Based Delivery:",
    "body": "Engagements are scoped and measured against clear targets—throughput per GPU, cost per token, and system availability SLAs."
  }
] as const;
