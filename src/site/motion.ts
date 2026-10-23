import { useEffect, useRef, useState, type RefObject } from 'react';

// Same curves as the hero entrance, so every section moves the same way.
export const EASE_QUINT = 'cubic-bezier(0.22, 1, 0.36, 1)';
export const EASE_EXPO = 'cubic-bezier(0.16, 1, 0.3, 1)';
export const EASE_RULE = 'cubic-bezier(0.7, 0, 0.2, 1)';

export function prefersReducedMotion(): boolean {
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/**
 * Scroll reveals for every `[data-rv]` element under `rootRef`: adds `is-in`
 * once the element enters the viewport. CSS in landing.css does the motion.
 */
export function useReveal(rootRef: RefObject<HTMLElement>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = Array.from(root.querySelectorAll<HTMLElement>('[data-rv]'));
    if (prefersReducedMotion() || typeof IntersectionObserver === 'undefined') {
      targets.forEach((el) => el.classList.add('is-in'));
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
    );
    targets.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [rootRef]);
}

/** True while the element is (nearly) on screen. Used to pause demos off-screen. */
export function useInView<T extends Element>(rootMargin = '120px'): [RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { rootMargin });
    observer.observe(el);
    return () => observer.disconnect();
  }, [rootMargin]);
  return [ref, inView];
}

/** Counts from 0 to `target` with an expo ease-out the first time `start` is true. */
export function useCountUp(target: number, start: boolean, duration = 1600): number {
  const [value, setValue] = useState(0);
  const done = useRef(false);
  useEffect(() => {
    if (!start || done.current) return;
    done.current = true;
    if (prefersReducedMotion()) {
      setValue(target);
      return;
    }
    let frame = 0;
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = Math.min(1, (now - t0) / duration);
      const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
      setValue(Math.round(target * eased));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [start, target, duration]);
  return value;
}

/**
 * Scroll progress (0 → 1) of an element travelling from the bottom of the
 * viewport to `endAt` (fraction of viewport height). Written to `--p`.
 */
export function useScrollProgress<T extends HTMLElement>(endAt = 0.35): RefObject<T> {
  const ref = useRef<T>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (prefersReducedMotion()) {
      el.style.setProperty('--p', '1');
      return;
    }
    let frame = 0;
    const update = () => {
      frame = 0;
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - rect.top) / (vh * (1 - endAt));
      el.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [endAt]);
  return ref;
}

/** Pointer-follow spotlight for cards: writes --mx / --my in px. */
export function spotlight(e: React.PointerEvent<HTMLElement>) {
  const el = e.currentTarget;
  const rect = el.getBoundingClientRect();
  el.style.setProperty('--mx', `${e.clientX - rect.left}px`);
  el.style.setProperty('--my', `${e.clientY - rect.top}px`);
}

/**
 * Tracks which of `ids` is current. By default that is the element crossing the
 * middle of the viewport; pass a different `rootMargin` to move the trigger band.
 */
export function useScrollSpy(ids: readonly string[], rootMargin = '-45% 0px -50% 0px'): string | null {
  const [active, setActive] = useState<string | null>(null);
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => entry.isIntersecting && setActive(entry.target.id)),
      { rootMargin }
    );
    ids.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [ids, rootMargin]);
  return active;
}

/** Marketing pages always use the night-sky palette, whatever the vault theme is. */
export function useNightThemeColor() {
  useEffect(() => {
    const metas = Array.from(document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]'));
    const previous = metas.map((m) => m.content);
    metas.forEach((m) => (m.content = '#01061a'));
    return () => metas.forEach((m, i) => (m.content = previous[i]));
  }, []);
}
