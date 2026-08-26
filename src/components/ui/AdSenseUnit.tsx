"use client";

import { useEffect } from "react";

interface AdSenseUnitProps {
  adSlot: string; // Google AdSense se milega
  adFormat?: string;
  responsive?: string;
}

export default function AdSenseUnit({ adSlot, adFormat = "auto", responsive = "true" }: AdSenseUnitProps) {
  useEffect(() => {
    try {
      // Trigger AdSense to load ad in this slot
      ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
    } catch (err) {
      console.error("AdSense error:", err);
    }
  }, []);

  return (
    <div className="my-6 overflow-hidden flex justify-center text-center">
      {/* Inserts the Ad block */}
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client="ca-pub-3914938885581520" // Apni ID dalein
        data-ad-slot={adSlot}
        data-ad-format={adFormat}
        data-full-width-responsive={responsive}
      />
    </div>
  );
}
