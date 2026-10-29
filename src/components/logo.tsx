import Link from "next/link";
import { site } from "@/content/site";

// Знак — жемчужина-планета с орбитой из 4 бусин (03-design §1); словесный знак — текстом, Lora
export function Logo({ light = false, className = "" }: { light?: boolean; className?: string }) {
  const [first, ...rest] = site.name.split(" ");
  return (
    <Link href="/" className={`inline-flex items-center gap-2.5 ${className}`} aria-label={`${site.name} — на главную`}>
      <img src={light ? "/brand/sign-light.svg" : "/brand/sign.svg"} alt="" width={34} height={34} className="size-[34px]" />
      <span className="font-serif text-[19px] font-semibold leading-none tracking-tight">
        {first} <i className="font-medium">{rest.join(" ")}</i>
      </span>
    </Link>
  );
}
