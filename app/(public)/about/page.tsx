// app/(public)/about/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Me",
  description: "Learn about me and my background",
};

export default function About() {
  return (
    <div className="min-h-screen py-20">
      <div className="container-custom max-w-3xl">
        <h1 className="text-5xl font-bold mb-8 text-gradient">About Me</h1>

        <div className="prose dark:prose-invert max-w-none">
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 leading-relaxed">
            Hello! I&apos;m a passionate developer and student dedicated to building
            great applications and continuously learning new technologies.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">Background</h2>
          <p className="text-gray-600 dark:text-gray-300 mb-4">
            I started my programming journey with a curiosity about how things
            work. Over time, I&apos;ve developed expertise in full-stack web
            development and modern JavaScript frameworks.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">What I Do</h2>
          <ul className="list-disc list-inside space-y-3 text-gray-600 dark:text-gray-300">
            <li>Build scalable web applications using React and Next.js</li>
            <li>Design responsive, user-friendly interfaces</li>
            <li>Develop robust backend systems with Node.js and PostgreSQL</li>
            <li>Implement modern development practices and workflows</li>
          </ul>

          <h2 className="text-3xl font-bold mt-12 mb-6">Current Focus</h2>
          <p className="text-gray-600 dark:text-gray-300">
            I&apos;m currently focusing on learning about cloud technologies, system
            design, and building projects that make a real impact. Each project
            on my portfolio represents both a learning opportunity and the
            chance to apply my skills in practical ways.
          </p>

          <h2 className="text-3xl font-bold mt-12 mb-6">Outside of Code</h2>
          <p className="text-gray-600 dark:text-gray-300">
            When I&apos;m not coding, you&apos;ll find me exploring new technologies,
            contributing to open-source projects, or sharing knowledge with
            other developers through blogs and discussions.
          </p>
        </div>
      </div>
    </div>
  );
}
