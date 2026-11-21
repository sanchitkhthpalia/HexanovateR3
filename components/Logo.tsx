import Image from "next/image";

// KlearStack monogram + gradient wordmark, from the lead form's "Logo wrapper" (Figma 3009:10051).
// The header and footer logo slots in Figma are empty white placeholders, so this is reused there.
const sizes = {
  sm: { mark: 22, markPad: "", text: "text-[1.1875rem] leading-7" }, // fits the 142×48 header slot
  md: { mark: 28, markPad: "px-2 pt-[7px] pb-[9px]", text: "text-[1.625rem] leading-7" }, // design: "Monogram wrapper" + 26/28 text
};

export default function Logo({ size = "md", priority = false }: { size?: keyof typeof sizes; priority?: boolean }) {
  const s = sizes[size];
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`flex items-center justify-center ${s.markPad}`}>
        <Image src="/images/klearstack-monogram.svg" alt="" width={s.mark} height={s.mark} priority={priority} />
      </span>
      <span className={`text-wordmark whitespace-nowrap ${s.text}`}>
        <span className="font-bold">Klear</span>
        <span className="font-normal">Stack</span>
      </span>
    </span>
  );
}
