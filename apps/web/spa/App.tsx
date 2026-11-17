import "@/lib/random-uuid-fallback";
import { useEffect, useState } from "react";
import { RouterProvider, type RouterHistory } from "@tanstack/react-router";
import { QueryProvider } from "@/components/QueryProvider";
import { ToastProvider } from "@/components/ui/toast";
import { installStrayFileDropGuard } from "@/lib/chat/file-drop";
import { installZhLocale } from "@/lib/i18n/translate";
import { createAppRouter } from "@/spa/router";

/**
 * The OvertChat UI. Hosts render it inside `ThemeProvider`, so the theme can
 * be applied before the bundle loads.
 */
export function App({ history }: { history?: RouterHistory }) {
  const [router] = useState(() => createAppRouter(history));
  // A file dropped outside a drop zone would otherwise open in place of the app.
  useEffect(() => installStrayFileDropGuard(window), []);
  // Built-in Chinese UI override: exact-match dictionary on DOM text/attributes.
  useEffect(() => installZhLocale(), []);
  return (
    <QueryProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryProvider>
  );
}
