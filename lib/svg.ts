/** The <svg> an event's element belongs to (the element itself if it is one). */
export function owningSvg(e: { currentTarget: EventTarget }): SVGSVGElement | null {
  const el = e.currentTarget;
  return el instanceof SVGSVGElement ? el : el instanceof SVGElement ? el.ownerSVGElement : null;
}

/** A pointer position in the owning SVG's own (viewBox) coordinates, for dragging things on a drawing. */
export function svgPoint(e: { currentTarget: EventTarget; clientX: number; clientY: number }): DOMPoint | null {
  const ctm = owningSvg(e)?.getScreenCTM();
  return ctm ? new DOMPoint(e.clientX, e.clientY).matrixTransform(ctm.inverse()) : null;
}
