import { HellaRichSEO } from "../../components/HellaRichSEO";

const happyHumanUrl = `${import.meta.env.BASE_URL}happy-human/index.html`;
const navOffset = "clamp(86px, 10vh, 118px)";

export default function HappyHumanPage() {
  return (
    <>
      <HellaRichSEO
        title="HAPPY HUMAN — hella.rich"
        description="HAPPY HUMAN. A satirical labor archive for jobs that were already politely deleted."
        keywords="HAPPY HUMAN, hella.rich, AI satire, labor archive, job loss archive"
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
        }}
      />
    </>
  );
}
