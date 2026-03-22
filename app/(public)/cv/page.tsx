// app/(public)/cv/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "CV / Resume",
  description: "Download my CV and resume",
};

export default function CVPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container-custom max-w-4xl">
        <h1 className="text-5xl font-bold mb-8 text-gradient">
          Curriculum Vitae
        </h1>

        {/* Education */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            Education
          </h2>
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold">
                  Bachelor of Science in Computer Science
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  2022 - Present
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                University Name
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                Relevant courses: Web Development, Database Systems, Software
                Engineering, Data Structures
              </p>
            </div>
          </div>
        </section>

        {/* Experience */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            Experience
          </h2>
          <div className="space-y-6">
            <div className="card p-6">
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-xl font-bold">
                  Full Stack Developer (Intern)
                </h3>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  2024
                </span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-3">
                Tech Company Name
              </p>
              <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li>
                  Built responsive web applications using React and Next.js
                </li>
                <li>Developed backend APIs with Node.js and Express</li>
                <li>Collaborated with team using Git and Agile methodology</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Skills */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-800">
            Technical Skills
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="card p-4">
              <h4 className="font-bold mb-3">Languages</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                JavaScript, TypeScript, SQL, HTML, CSS
              </p>
            </div>
            <div className="card p-4">
              <h4 className="font-bold mb-3">Frontend</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                React, Next.js, Tailwind CSS, Responsive Design
              </p>
            </div>
            <div className="card p-4">
              <h4 className="font-bold mb-3">Backend</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Node.js, Express, RESTful APIs, PostgreSQL
              </p>
            </div>
            <div className="card p-4">
              <h4 className="font-bold mb-3">Tools</h4>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Git, Docker, Vercel, VS Code, Figma
              </p>
            </div>
          </div>
        </section>

        {/* Download CTA */}
        <div className="card p-8 text-center">
          <h3 className="text-2xl font-bold mb-4">Download Full CV</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            Click the button below to download my complete CV as PDF
          </p>
          <a href="/cv.pdf" download className="btn-primary">
            Download PDF
          </a>
        </div>
      </div>
    </div>
  );
}
