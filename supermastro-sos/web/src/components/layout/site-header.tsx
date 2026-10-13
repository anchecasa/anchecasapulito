import Image from "next/image";
import { HardLink } from "@/components/layout/hard-link";
import { SuperMastroWordmark } from "@/components/layout/supermastro-wordmark";
import { cn } from "@/lib/utils";
const SUPERMASTRO_HOME_LOGO = "/images/supermastro-icona.png";

type SiteHeaderProps = {
  product: "supermastro" | "artigiano" | "lavoro";
  subtitle?: string;
  className?: string;
  ctaHref?: string;
  ctaLabel?: string;
};

export function SiteHeader({
  product,
  subtitle,
  className,
  ctaHref,
  ctaLabel,
}: SiteHeaderProps) {
  const home =
    product === "supermastro"
      ? "/supermastro"
      : product === "lavoro"
        ? "/lavoro"
        : "/artigiano";
  const label =
    product === "supermastro"
      ? "SuperMastro"
      : product === "lavoro"
        ? "AncheCasa Lavoro"
        : "Area Mastri";
  const secondaryHref =
    product === "supermastro"
      ? "/supermastro/iscrizione"
      : product === "lavoro"
        ? "/supermastro"
        : "/supermastro";
  const secondaryLabel =
    product === "supermastro"
      ? "Sei artigiano"
      : product === "lavoro"
        ? "SOS casa"
        : "Problema in casa.";
  const hideSecondaryLink =
    Boolean(ctaHref && ctaLabel) &&
    ctaHref === secondaryHref &&
    ctaLabel === secondaryLabel;

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b border-[var(--border)] bg-white/95 backdrop-blur-sm",
        className
      )}
    >
      <div
        className={cn(
          "mx-auto flex max-w-6xl min-w-0 items-center justify-between gap-3 px-4 sm:gap-4 sm:px-6",
          product === "supermastro" ? "py-[14.5px]" : "py-3"
        )}
      >
        <HardLink
          href={home}
          className="group flex shrink-0 items-center"
          aria-label={product === "supermastro" ? "SuperMastro" : label}
        >
          {product === "supermastro" ? (
            <div className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <Image
                src={SUPERMASTRO_HOME_LOGO}
                alt=""
                width={40}
                height={40}
                className="h-9 w-9 shrink-0 object-contain drop-shadow-md sm:h-10 sm:w-10"
                priority
              />
              <div className="flex min-w-0 flex-col leading-tight">
                <SuperMastroWordmark size="sm" className="truncate" />
              </div>
            </div>
          ) : (            <span className="min-w-0">
              <span className="block truncate text-sm font-semibold tracking-tight text-foreground">
                {label}
              </span>
              <span className="block truncate text-[11px] text-muted">
                {subtitle ?? "by AncheCasa"}
              </span>
            </span>
          )}
        </HardLink>

        <div className="flex min-w-0 shrink items-center gap-2 sm:gap-3">
          {!hideSecondaryLink && (
            <HardLink
              href={secondaryHref}
              className="hidden text-xs font-medium text-muted transition-colors hover:text-foreground sm:inline"
            >
              {secondaryLabel}
            </HardLink>
          )}
          {/* Diagnosi video: sempre a portata, per privati, artigiani e chiunque. */}
          <HardLink
            href="/supermastro/video"
            className="inline-flex h-9 shrink-0 items-center justify-center rounded-full border border-[#E56B10] px-3 text-xs font-semibold text-[#B4500B] transition hover:bg-[#E56B10]/10"
          >
            Video guasto
          </HardLink>
          {ctaHref && ctaLabel && (
            <HardLink
              href={ctaHref}
              className={cn(
                "inline-flex h-9 max-w-[9.5rem] shrink items-center justify-center rounded-full px-3 text-center text-xs font-semibold leading-tight text-white shadow-sm transition sm:max-w-none sm:px-4",
                product === "supermastro"
                  ? "bg-[#E56B10] hover:bg-[#E56B10]"
                  : product === "artigiano"
                    ? "bg-worker hover:bg-amber-600"
                    : "bg-brand hover:bg-blue-700"
              )}
            >
              {ctaLabel}
            </HardLink>
          )}
        </div>
      </div>
    </header>
  );
}
