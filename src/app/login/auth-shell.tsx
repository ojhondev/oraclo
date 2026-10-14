import { BrandLogo } from "@/components/brand";

/** Moldura das telas de entrada: formulário à esquerda, "nuvem de pontos" à direita. */
export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="grid min-h-svh lg:grid-cols-[minmax(0,1fr)_minmax(0,1.15fr)]">
      <div className="flex flex-col justify-between px-6 py-8 sm:px-12 lg:px-16">
        <BrandLogo />
        <div className="w-full max-w-sm py-12">
          <p className="label mb-3">{eyebrow}</p>
          <h1 className="h-display mb-2 text-5xl">{title}</h1>
          <p className="mb-8 text-sm text-muted-foreground">{description}</p>
          {children}
        </div>
        <div className="text-sm text-muted-foreground">{footer}</div>
      </div>
      <div className="relative hidden overflow-hidden bg-[#16181b] lg:block">
        <div className="dot-field absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_at_center,black_20%,transparent_75%)]" />
        <svg viewBox="0 0 400 420" className="absolute inset-x-[12%] top-[14%] w-[76%] opacity-90" aria-hidden>
          {Array.from({ length: 900 }, (_, i) => {
            // fachada de igreja estilizada em pontos (determinístico)
            const r = (n: number) => {
              const s = Math.sin(i * 12.9898 + n * 78.233) * 43758.5453;
              return s - Math.floor(s);
            };
            const x = 40 + r(1) * 320;
            const y = 60 + r(2) * 340;
            const inTower = (x > 150 && x < 250) || y > 160;
            const inArch = y > 290 && Math.abs(x - 200) < 34;
            const roof = y < 160 && Math.abs(x - 200) < 50 + (y - 60) * 0.1;
            if (!(inTower || roof) || inArch) return null;
            const warm = r(3) > 0.55;
            return <circle key={i} cx={x} cy={y} r={0.9 + r(4) * 1.1} fill={warm ? "#c8742a" : "#3fc1bf"} opacity={0.5 + r(5) * 0.5} />;
          })}
        </svg>
        <p className="absolute right-12 bottom-12 left-12 font-serif text-3xl leading-snug text-white/90">
          Fotografe com o celular. Receba a nuvem de pontos, o mapa de danos e as pranchas.
        </p>
      </div>
    </div>
  );
}
