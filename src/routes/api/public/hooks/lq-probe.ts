import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/public/hooks/lq-probe")({
  server: {
    handlers: {
      GET: async () => {
        const t0 = Date.now();
        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          const imported = Date.now() - t0;
          const t1 = Date.now();
          const { data, error } = await supabaseAdmin.from("boards").select("id").limit(1);
          return Response.json({
            imported_ms: imported,
            query_ms: Date.now() - t1,
            rows: data?.length ?? 0,
            error: error?.message ?? null,
          });
        } catch (e: any) {
          return Response.json({ failed: String(e?.message ?? e), ms: Date.now() - t0 }, { status: 500 });
        }
      },
    },
  },
});
