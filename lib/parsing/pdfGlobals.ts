// pdfjs-dist v6 bundles its canvas rendering layer into the same module as
// the document API, and that layer evaluates `new DOMMatrix()` at module
// scope. So merely *importing* pdfjs in Node throws
//
//   DOMMatrix is not defined
//
// unless the browser graphics globals exist beforehand. pdfjs tries to
// polyfill them itself from `@napi-rs/canvas`, but that's an *optional*
// native dependency: npm only installs the prebuilt binary matching the
// platform recorded at install time. If node_modules was populated on a
// different OS/arch than the one running the app (e.g. installed in a Linux
// container, then run on macOS), the require fails, pdfjs logs
// "Cannot polyfill `DOMMatrix`" as a mere warning, and the import then dies
// on the line above.
//
// We only ever call `getTextContent()` — never `render()` — so a real canvas
// implementation isn't actually needed. It just has to exist at import time.
// Strategy: use the native package when it genuinely loads (correct, and
// keeps rendering available), otherwise install inert stubs so that text
// extraction can't be taken down by a rendering dependency we never use.
//
// The stubs construct fine but throw on use, so a future code path that
// actually tries to rasterize gets a clear, actionable error instead of
// silently drawing nothing.

import { createRequire } from 'node:module';

let ensured: Promise<void> | null = null;

const NEEDS_CANVAS =
  'PDF rasterization needs the @napi-rs/canvas native binary for this ' +
  'platform, which is not installed. Run `npm install` on this machine. ' +
  '(Text extraction does not need it.)';

function stubGraphicsGlobals() {
  const g = globalThis as Record<string, unknown>;

  if (typeof g.DOMMatrix === 'undefined') {
    class DOMMatrixStub {
      a = 1;
      b = 0;
      c = 0;
      d = 1;
      e = 0;
      f = 0;
      is2D = true;
      isIdentity = true;

      constructor(init?: number[] | string) {
        if (Array.isArray(init) && init.length >= 6) {
          [this.a, this.b, this.c, this.d, this.e, this.f] = init;
          this.isIdentity = false;
        }
      }

      // Every mutating/derived operation belongs to the render path.
      translate(): never {
        throw new Error(NEEDS_CANVAS);
      }
      scale(): never {
        throw new Error(NEEDS_CANVAS);
      }
      multiplySelf(): never {
        throw new Error(NEEDS_CANVAS);
      }
      preMultiplySelf(): never {
        throw new Error(NEEDS_CANVAS);
      }
      invertSelf(): never {
        throw new Error(NEEDS_CANVAS);
      }
    }
    g.DOMMatrix = DOMMatrixStub;
  }

  if (typeof g.Path2D === 'undefined') {
    class Path2DStub {
      addPath(): never {
        throw new Error(NEEDS_CANVAS);
      }
    }
    g.Path2D = Path2DStub;
  }

  if (typeof g.ImageData === 'undefined') {
    class ImageDataStub {
      data: Uint8ClampedArray;
      width: number;
      height: number;

      constructor(width = 0, height = 0) {
        this.width = width;
        this.height = height;
        this.data = new Uint8ClampedArray(Math.max(0, width * height * 4));
      }
    }
    g.ImageData = ImageDataStub;
  }
}

/**
 * Guarantees DOMMatrix / Path2D / ImageData exist before pdfjs-dist is
 * imported. Idempotent and safe to call on every request — the work happens
 * once and the same promise is reused thereafter.
 */
export function ensurePdfGlobals(): Promise<void> {
  ensured ??= (async () => {
    if (typeof (globalThis as Record<string, unknown>).DOMMatrix !== 'undefined') {
      return;
    }

    try {
      // Resolved at runtime from the project root rather than with a static
      // `import`, because @napi-rs/canvas is genuinely optional: a bare
      // import would make both `tsc` and the Next build hard-fail whenever
      // the platform binary isn't present, which is the exact situation
      // this module exists to survive.
      const requireFromRoot = createRequire(`${process.cwd()}/`);
      const canvas = requireFromRoot('@napi-rs/canvas');
      const g = globalThis as Record<string, unknown>;
      g.DOMMatrix ??= canvas.DOMMatrix;
      g.Path2D ??= canvas.Path2D;
      g.ImageData ??= canvas.ImageData;
    } catch {
      // Not installed, or the prebuilt binary doesn't match this platform.
      // Fall through to the stubs below.
    }

    stubGraphicsGlobals();
  })();

  return ensured;
}
