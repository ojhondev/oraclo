/**
 * Hachuras SVG dos tipos de dano. `unit` = tamanho de 1 pixel de tela em pixels da
 * imagem, para a hachura manter o mesmo espaçamento visual em qualquer zoom.
 */
export function DamagePattern({ id, color, pattern, unit }: { id: string; color: string; pattern: string; unit: number }) {
  const s = 10 * unit;
  const sw = 1.2 * unit;
  const common = { id, patternUnits: "userSpaceOnUse" as const, width: s, height: s };
  switch (pattern) {
    case "diagonal":
      return (
        <pattern {...common} patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={s} stroke={color} strokeWidth={sw} />
        </pattern>
      );
    case "diagonal-inversa":
      return (
        <pattern {...common} patternTransform="rotate(-45)">
          <line x1="0" y1="0" x2="0" y2={s} stroke={color} strokeWidth={sw} />
        </pattern>
      );
    case "cruzado":
      return (
        <pattern {...common} patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2={s} stroke={color} strokeWidth={sw} />
          <line x1="0" y1="0" x2={s} y2="0" stroke={color} strokeWidth={sw} />
        </pattern>
      );
    case "horizontal":
      return (
        <pattern {...common}>
          <line x1="0" y1={s / 2} x2={s} y2={s / 2} stroke={color} strokeWidth={sw} />
        </pattern>
      );
    case "pontilhado":
      return (
        <pattern {...common}>
          <circle cx={s / 2} cy={s / 2} r={1.3 * unit} fill={color} />
        </pattern>
      );
    case "pontilhado-denso":
      return (
        <pattern {...common} width={s / 2} height={s / 2}>
          <circle cx={s / 4} cy={s / 4} r={1.1 * unit} fill={color} />
        </pattern>
      );
    case "circulos":
      return (
        <pattern {...common} width={s * 1.4} height={s * 1.4}>
          <circle cx={s * 0.7} cy={s * 0.7} r={s * 0.4} fill="none" stroke={color} strokeWidth={sw} />
        </pattern>
      );
    default:
      return (
        <pattern {...common}>
          <rect width={s} height={s} fill={color} fillOpacity={pattern === "contorno" ? 0.05 : 0.35} />
        </pattern>
      );
  }
}

/** Espessura e tracejado das linhas (fissura/trinca/rachadura…), em pixels de tela. */
export function lineStyle(pattern: string) {
  switch (pattern) {
    case "linha-dupla":
      return { width: 3, dash: undefined };
    case "linha-grossa":
      return { width: 4.5, dash: undefined };
    case "tracejado":
      return { width: 2, dash: "6 4" };
    default:
      return { width: 2, dash: undefined };
  }
}
