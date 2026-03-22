// app/(public)/skills/page.tsx

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skills",
  description: "My technical skills and expertise",
};

export default function SkillsPage() {
  const skillCategories = [
    {
      category: "Frontend",
      skills: ["React", "Next.js", "TypeScript", "Tailwind CSS", "HTML/CSS"],
    },
    {
      category: "Backend",
      skills: [
        "Node.js",
        "Express",
        "PostgreSQL",
        "Prisma ORM",
        "RESTful APIs",
      ],
    },
    {
      category: "Tools & DevOps",
      skills: ["Git", "Docker", "Vercel", "Supabase", "VS Code"],
    },
    {
      category: "Soft Skills",
      skills: [
        "Problem Solving",
        "Communication",
        "Teamwork",
        "Time Management",
        "Learning",
      ],
    },
  ];

  return (
    <div className="min-h-screen py-20">
      <div className="container-custom max-w-4xl">
        <h1 className="text-5xl font-bold mb-8 text-gradient">
          Skills & Expertise
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {skillCategories.map((group) => (
            <div key={group.category} className="card p-6">
              <h3 className="text-2xl font-bold mb-6">{group.category}</h3>
              <div className="space-y-4">
                {group.skills.map((skill) => (
                  <div key={skill} className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-blue-600 to-purple-600" />
                    <span className="font-medium">{skill}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Proficiency Levels */}
        <div className="mt-12 card p-8">
          <h2 className="text-3xl font-bold mb-8">Languages & Frameworks</h2>

          <div className="space-y-6">
            {[
              { name: "JavaScript", level: 90 },
              { name: "TypeScript", level: 85 },
              { name: "React", level: 90 },
              { name: "Next.js", level: 88 },
              { name: "PostgreSQL", level: 80 },
              { name: "CSS & Tailwind", level: 90 },
            ].map((skill) => (
              <div key={skill.name}>
                <div className="flex justify-between mb-2">
                  <span className="font-medium">{skill.name}</span>
                  <span className="text-gray-600 dark:text-gray-400">
                    {skill.level}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-purple-600 h-2 rounded-full"
                    style={{ width: `${skill.level}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
