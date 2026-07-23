import { HellaRichSEO } from "../../components/HellaRichSEO";

const happyHumanUrl = `${import.meta.env.BASE_URL}happy-human/index.html?hub=1`;
const navPad = "clamp(14px, 2.2vh, 22px)";
const navHeight = "clamp(30px, 4vh, 36px)";
const navOffset = `calc(${navPad} * 2 + ${navHeight})`;
const navBackground = "#111110";

export default function HappyHumanPage() {
  return (
    <>
      <HellaRichSEO
        title="HAPPY HUMAN — hella.rich"
        description="HAPPY HUMAN. A satirical labor archive for jobs that were already politely deleted."
        keywords="HAPPY HUMAN, hella.rich, AI satire, labor archive, job loss archive"
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          background: navBackground,
          pointerEvents: "none",
          zIndex: 0,
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          left: 0,
          height: navOffset,
          background: navBackground,
          pointerEvents: "none",
          zIndex: 1,
        }}
      />
      <iframe
        title="HAPPY HUMAN"
        src={happyHumanUrl}
        style={{
          position: "fixed",
          top: navOffset,
          right: 0,
          bottom: 0,
          left: 0,
          width: "100vw",
          height: `calc(100dvh - ${navOffset})`,
          border: 0,
          background: "#0d0d0d",
          zIndex: 1,
        }}
      />
    </>
  );
}
