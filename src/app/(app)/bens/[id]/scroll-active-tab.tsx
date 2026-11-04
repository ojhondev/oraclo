"use client";

import { useEffect, useRef } from "react";

/** No celular as abas rolam de lado: mantém a aba atual à vista ao abrir a tela. */
export function ScrollActiveTab() {
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const nav = ref.current?.parentElement;
    const tab = nav?.querySelector<HTMLElement>('[aria-current="page"]');
    if (nav && tab) nav.scrollLeft = tab.offsetLeft - (nav.clientWidth - tab.offsetWidth) / 2;
  });
  return <span ref={ref} hidden />;
}
