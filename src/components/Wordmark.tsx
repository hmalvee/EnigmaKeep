// Geometric ENIGMAKEEP wordmark, drawn in the same construction as the Vexel
// mark (mirrored E included). viewBox height matches Vexel's 23.5 units.
const GLYPHS = [
  'M0.6 0.3H18.3V4.7H7V9.3H16.1V13.9H7V18.4H19.3V23H0.6Z',
  'M20.7 0.3H26.7L34.3 13.4V0.3H39.9V23H33.9L26.3 9.9V23H20.7Z',
  'M41.3 0.3H47.1V23H41.3Z',
  'M48.5 0.3H66.5V4.7H54.7V18.6H61.1V15H57.7V10.5H67.1V23H48.5Z',
  'M68.5 0.3H74.8L80.7 11.8L86.6 0.3H92.9V23H87.4V10.2L82.9 18.9H78.5L74 10.2V23H68.5Z',
  'M101.6 0.3H108L115.3 23H109.1L108 19.4H101.6L100.5 23H94.3ZM104.8 9.5L103 15.1H106.6Z',
  'M116.7 0.3H122.5V9L129.4 0.3H136.3L127.5 11.1L136.7 23H129.7L124 15.5L122.5 17.4V23H116.7Z',
  'M138.1 0.3H154.1V23H138.1V18.4H148.8V13.9H141.5V9.3H148.8V4.7H138.1Z',
  'M155.5 0.3H173.2V4.7H161.9V9.3H171V13.9H161.9V18.4H174.2V23H155.5Z',
  'M175.6 0.3H194V14.5H181.5V23H175.6ZM181.5 4.7V10.1H188.2V4.7Z',
];

export function Wordmark({ className = '' }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 195 23.5"
      fill="currentColor"
      fillRule="evenodd"
      className={className}
      aria-hidden="true"
      focusable="false"
    >
      {GLYPHS.map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
