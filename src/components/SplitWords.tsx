/**
 * Splits text into per-letter spans for animation while keeping each word
 * unbreakable, so lines only wrap between words.
 */
export default function SplitWords({
  text,
  charProps,
  charStyle,
}: {
  text: string;
  charProps?: Record<string, string>;
  charStyle?: (globalIndex: number) => React.CSSProperties | undefined;
}) {
  let k = 0;
  const words = text.split(" ");
  return (
    <>
      <span className="sr-only">{text}</span>
      {words.map((w, wi) => (
        <span key={wi} aria-hidden="true" className="inline-block whitespace-nowrap" style={{ marginRight: wi < words.length - 1 ? "0.3em" : undefined }}>
          {w.split("").map((ch) => {
            const i = k++;
            return (
              <span key={i} className="inline-block" {...charProps} style={charStyle?.(i)}>
                {ch}
              </span>
            );
          })}
        </span>
      ))}
    </>
  );
}
