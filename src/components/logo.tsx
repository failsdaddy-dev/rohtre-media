import Image from "next/image";

// The wordmark: black on light backgrounds, white inside dark sections
// (CSS in globals.css picks the right one). `tone` forces one version.
// Files are local (public/brand), so `unoptimized` skips the Cloudinary loader.

const SRC = { black: "/brand/logo-wordmark-black.png", white: "/brand/logo-wordmark-white.png" };

function Mark({ tone, className, alt }: { tone: "black" | "white"; className: string; alt: string }) {
  return <Image src={SRC[tone]} alt={alt} width={687} height={181} unoptimized loading="eager" className={className} />;
}

export function Logo({
  className = "h-9 w-auto",
  tone = "auto",
}: {
  className?: string;
  tone?: "auto" | "black" | "white";
}) {
  if (tone !== "auto") return <Mark tone={tone} alt="RohTre Media" className={className} />;
  return (
    <>
      <Mark tone="black" alt="RohTre Media" className={`rm-logo-on-light ${className}`} />
      <Mark tone="white" alt="" className={`rm-logo-on-dark ${className}`} />
    </>
  );
}
