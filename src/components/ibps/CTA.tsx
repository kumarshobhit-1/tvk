import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CTA() {
  return (
    <section className="bg-slate-950 py-14 text-slate-50 md:py-18">
      <div className="container mx-auto px-4">
        <div className="rounded-3xl border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(14,165,233,0.18),transparent_30%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.98))] p-8 text-center shadow-2xl md:p-12">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-sky-200">Take the next step</p>
          <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Master Professional Knowledge. Win the rank.</h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm leading-7 text-slate-300 md:text-base">
            Get notification-accurate notes, new-pattern mock tests, and daily free lessons — everything for IBPS SO IT Officer 2026 in one place.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg" className="h-12 bg-amber-500 px-6 text-slate-950 hover:bg-amber-400">
              <Link href="/contact">
                Enroll now
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 border-white/15 bg-transparent px-6 text-white hover:bg-white/10 hover:text-white">
              <Link href="/exam">Open exam hub</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
