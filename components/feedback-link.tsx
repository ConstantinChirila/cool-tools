"use client";

import * as React from "react";

// Address kept in reversed pieces so it never appears as a string in the
// HTML or the JS bundle; assembled in the browser after hydration.
const USER = "sbobnstib";
const DOMAIN = "moc.alirihcnitnatsnoc";
const flip = (s: string) => s.split("").reverse().join("");
const address = () => `${flip(USER)}@${flip(DOMAIN)}`;

// Client-only value: the server renders no href, the browser fills it in.
const noop = () => () => {};
const clientAddress = () => address();
const serverAddress = () => undefined;

/** Mailto link for tool ideas, obfuscated against address harvesters. */
export function FeedbackLink({
  subject,
  className,
  children,
}: {
  subject: string;
  className?: string;
  children: React.ReactNode;
}) {
  const email = React.useSyncExternalStore(noop, clientAddress, serverAddress);
  const href = email ? `mailto:${email}?subject=${encodeURIComponent(subject)}` : undefined;

  return (
    <a href={href} className={className}>
      {children}
    </a>
  );
}
