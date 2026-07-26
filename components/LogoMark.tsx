"use client";

import React from "react";

interface LogoMarkProps {
  className?: string;
  size?: number;
  variant?: "mark" | "full" | "text";
}

export default function LogoMark({
  className = "",
  size = 32,
  variant = "mark",
}: LogoMarkProps) {
  if (variant === "full") {
    return (
      <img
        src="/karliq-logo.png"
        alt="Karliq"
        width={size * 3.4}
        height={size}
        className={`logo-full ${className}`}
        style={{ height: size, width: "auto", objectFit: "contain" }}
      />
    );
  }

  if (variant === "text") {
    return (
      <img
        src="/karliq-logo-text.png"
        alt="KARLIQ"
        width={size * 2.4}
        height={size}
        className={`logo-text ${className}`}
        style={{ height: size, width: "auto", objectFit: "contain" }}
      />
    );
  }

  return (
    <img
      src="/karliq-logo-mark.png"
      alt="KQ Mark"
      width={size}
      height={size}
      className={`logo-mark ${className}`}
      style={{ height: size, width: "auto", objectFit: "contain" }}
    />
  );
}
