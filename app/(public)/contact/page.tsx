// app/(public)/contact/page.tsx

import type { Metadata } from "next";
import { submitContactMessage } from "@/actions/contact";
import { ContactForm } from "@/components/features/ContactForm";

export const metadata: Metadata = {
  title: "Contact",
  description: "Get in touch with me",
};

export default function ContactPage() {
  return (
    <div className="min-h-screen py-20">
      <div className="container-custom max-w-2xl">
        <h1 className="text-5xl font-bold mb-6 text-gradient">Get in Touch</h1>
        <p className="text-lg text-gray-600 dark:text-gray-300 mb-12">
          Have a question or want to collaborate? I&apos;d love to hear from you.
          Fill out the form below and I&apos;ll get back to you as soon as possible.
        </p>

        <ContactForm onSubmit={submitContactMessage} />
      </div>
    </div>
  );
}
