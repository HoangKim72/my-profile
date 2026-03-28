import Link from "next/link";

export default function AuthCodeErrorPage() {
  return (
    <div className="min-h-screen px-4 py-24">
      <div className="mx-auto max-w-xl rounded-2xl border border-red-200 bg-white p-8 shadow-sm dark:border-red-900 dark:bg-gray-950">
        <h1 className="mb-4 text-3xl font-bold text-red-700 dark:text-red-300">
          Authentication failed
        </h1>
        <p className="mb-6 text-gray-600 dark:text-gray-300">
          We could not complete the sign-in or email confirmation request.
          Please try again, or return to the login page and start over.
        </p>
        <div className="flex gap-3">
          <Link href="/login" className="btn-primary">
            Back to login
          </Link>
          <Link href="/" className="btn-secondary">
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
