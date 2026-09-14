import { Suspense } from 'react';
import LoginForm from '@/components/LoginForm';

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-7 text-center">
          <div
            aria-hidden="true"
            className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-stage-accent text-lg font-bold text-stage-onAccent"
          >
            A
          </div>
          <h1 className="text-xl font-semibold tracking-tight text-stage-text">
            Actor Pocket Companion
          </h1>
          <p className="mt-1.5 text-sm text-stage-muted">
            Your private rehearsal space.
          </p>
        </div>
        <Suspense fallback={null}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
