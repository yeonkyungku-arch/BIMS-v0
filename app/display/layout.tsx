import React from "react";
import type { Metadata, Viewport } from "next";

export const metadata: Metadata = {
  title: "버스정보안내",
  description: "E-paper 버스정보시스템 단말 화면",
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
  userScalable: false,
};

export default function DisplayLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div 
      className="fixed inset-0 w-full h-screen flex flex-col bg-white text-black overflow-hidden"
      style={{ 
        imageRendering: "pixelated",
        WebkitFontSmoothing: "none",
      }}
    >
      {children}
    </div>
  );
}
