import { Github } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col justify-center text-center">
      <div className="mx-auto max-w-6xl px-4 py-20">
        {/* Hero Text */}
        <div className="text-center">
          <h1 className="bg-gradient-to-r from-blue-400 to-violet-400 bg-clip-text text-5xl font-bold tracking-tight text-transparent sm:text-7xl">
            Type-safe SQL query builder
            <br /> for TypeScript.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
            Experience the power of fully type-safe SQL queries with Kysely.
            Built for TypeScript developers who demand both safety and
            flexibility.
          </p>
          <div className="mt-8 flex items-center justify-center gap-4">
            <button className="gap-2 border-gray-800 bg-black text-gray-300 hover:bg-gray-900">
              <Github className="h-4 w-4" />
              <span>Star 2.5k</span>
            </button>
            <button className="bg-blue-600 hover:bg-blue-700">
              Quick Start
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
