"use client";

import { Printer } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PrintButton() {
  return (
    <Button className="w-fit" onClick={() => window.print()}>
      <Printer /> Imprimir ou salvar em PDF
    </Button>
  );
}
