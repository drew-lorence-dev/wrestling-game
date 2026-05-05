import Image from "next/image";
import { Wrestler } from "@/types/database";

const FALLBACK = "https://static.wixstatic.com/media/815952_22a11f977bc54920b8bb6031745ea039~mv2.jpg";

export default function WrestlerCard({ wrestler }: { wrestler: Wrestler }) {
  return (
    <div className="flex flex-col items-center gap-2 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg p-4 hover:border-[#c9a84c]/40 transition-colors">
      <div className="relative w-24 h-24 rounded-full overflow-hidden bg-[#2a2a2a] shrink-0">
        <Image
          src={wrestler.image_url ?? FALLBACK}
          alt={wrestler.name}
          fill
          sizes="96px"
          className="object-cover"
          unoptimized
        />
      </div>
      <span className="text-sm font-semibold text-center text-white leading-tight">
        {wrestler.name}
      </span>
    </div>
  );
}
