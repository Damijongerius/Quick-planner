import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Redirecting...",
  other: {
    "http-equiv": "refresh",
    content: "0; url=/projects",
  },
};

export default function Home() {
  return (
    <div style={{ padding: "24px", fontFamily: "sans-serif" }}>
      <p>Redirecting to projects...</p>
    </div>
  );
}
