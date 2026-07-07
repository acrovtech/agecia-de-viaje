'use client';

import Script from 'next/script';

export interface TrustIndexWidgetProps {
  // Trustindex generates a specific script URL when you connect Tripadvisor.
  // Example: "https://cdn.trustindex.io/loader.js?xxxx"
  scriptUrl: string;
}

export function TrustIndexWidget({ scriptUrl }: TrustIndexWidgetProps) {
  return (
    <div className="w-full max-w-5xl mx-auto my-12">
      {/* This div is the container where TrustIndex will inject the widget */}
      <div className="trustindex-container">
        <Script
          src={scriptUrl}
          strategy="lazyOnload"
          defer
          async
        />
      </div>
    </div>
  );
}
