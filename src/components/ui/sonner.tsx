import { Toaster as Sonner } from "sonner";

export function Toaster() {
  return (
    <Sonner
      position="top-right"
      expand={true}
      richColors
      closeButton
      duration={4000}
    />
  );
}
