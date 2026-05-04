import Image from "next/image";

type BrandLogoProps = {
  size?: "sm" | "md" | "lg";
  className?: string;
  priority?: boolean;
};

const sizeClass = {
  sm: {
    mark: "h-10 w-10",
    title: "text-base leading-4",
    subtitle: "text-[9px] tracking-[0.16em]",
  },
  md: {
    mark: "h-12 w-12",
    title: "text-xl leading-5",
    subtitle: "text-[11px] tracking-[0.18em]",
  },
  lg: {
    mark: "h-14 w-14",
    title: "text-2xl leading-6",
    subtitle: "text-xs tracking-[0.2em]",
  },
};

export function BrandLogo({ size = "md", className = "", priority = false }: BrandLogoProps) {
  const classes = sizeClass[size];

  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <span className={`grid ${classes.mark} shrink-0 place-items-center overflow-hidden rounded-full bg-white shadow-sm ring-1 ring-orange-100`}>
        <Image
          src="/brand/luis-one-logo.jpg"
          alt="Luis One Supply Hub logo"
          width={56}
          height={56}
          className="h-full w-full object-cover"
          priority={priority}
        />
      </span>
      <span className="min-w-0">
        <span className={`block whitespace-nowrap font-black tracking-tight text-zinc-950 ${classes.title}`}>Luis One</span>
        <span className={`block whitespace-nowrap font-black uppercase text-orange-600 ${classes.subtitle}`}>Supply Hub</span>
      </span>
    </span>
  );
}
