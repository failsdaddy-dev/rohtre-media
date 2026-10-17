import Image from "next/image";

// The wordmark in black (light theme) and white (dark theme); CSS in
// globals.css shows the one that matches the active theme. Files are local
// (public/brand), so `unoptimized` skips the Cloudinary loader.
export function Logo({ className = "h-9 w-auto" }: { className?: string }) {
  return (
    <>
      <Image
        src="/brand/logo-wordmark-black.png"
        alt="RohTre Media"
        width={687}
        height={181}
        priority
        unoptimized
        className={`rm-logo-on-light ${className}`}
      />
      <Image
        src="/brand/logo-wordmark-white.png"
        alt=""
        width={687}
        height={181}
        priority
        unoptimized
        className={`rm-logo-on-dark ${className}`}
      />
    </>
  );
}
