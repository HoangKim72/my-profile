import { MicFilterTool } from "@/components/tools/MicFilterTool";
import type { MicFilterConfig } from "@/tools/mic-filter/config";

export function MicFilterWorkspace({ config }: { config: MicFilterConfig }) {
  return (
    <div className="min-h-full bg-mic-canvas py-8 text-mic-ink md:py-10">
      <div className="container-custom max-w-6xl">
        <MicFilterTool config={config} />
      </div>
    </div>
  );
}
