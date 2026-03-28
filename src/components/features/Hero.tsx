// src/components/features/Hero.tsx

import Link from "next/link";
import { SITE_NAME } from "@/lib/utils/constants";

export function Hero() {
  return (
    <section className="py-20 md:py-32 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-950 dark:to-gray-900">
      <div className="container-custom">
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-gradient">
            Welcome to {SITE_NAME}
          </h1>

          <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 mb-8 leading-relaxed">
            I&apos;m a passionate developer and student showcasing my projects,
            skills, and learning journey. Explore my work and let&apos;s connect!
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/projects" className="btn-primary text-lg">
              View Projects
            </Link>
            <Link href="/contact" className="btn-secondary text-lg">
              Get in Touch
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-blue-600">15+</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Projects
              </p>
            </div>
            <div>
              <div className="text-3xl font-bold text-purple-600">10+</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">Skills</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-pink-600">5+</div>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Subjects
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
