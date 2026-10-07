"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from "@/lib/api-client";

export default function RespondentFlow({ form }: { form: any }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [direction, setDirection] = useState(1);

  const questions = form.questions || [];
  const currentQuestion = questions[currentIndex];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        // Prevent default form submission behavior if within a form, though we don't use <form>
        // Go to next if answer exists or not required
        e.preventDefault();
        handleNext();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentIndex, answers]);

  const handleNext = () => {
    if (currentQuestion.required && !answers[currentQuestion.id]) {
      // In a real app, show error animation
      return;
    }
    
    if (currentIndex < questions.length - 1) {
      setDirection(1);
      setCurrentIndex((prev) => prev + 1);
    } else {
      submitForm();
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const submitForm = async () => {
    setIsSubmitting(true);
    try {
      await apiClient.public.submit(form.slug, answers);
      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      alert("Failed to submit form.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md"
        >
          <h1 className="mb-4 text-4xl font-bold text-gray-900">Thank you!</h1>
          <p className="text-xl text-gray-500">Your response has been recorded.</p>
        </motion.div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-gray-50 text-center">
        <p className="text-xl text-gray-500">This form has no questions.</p>
      </div>
    );
  }

  const variants = {
    enter: (direction: number) => ({
      y: direction > 0 ? 100 : -100,
      opacity: 0,
    }),
    center: {
      y: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      y: direction > 0 ? -100 : 100,
      opacity: 0,
    }),
  };

  return (
    <div className="relative flex h-screen w-full flex-col overflow-hidden bg-white text-gray-900 selection:bg-gray-200">
      <div className="absolute top-0 left-0 w-full h-1 bg-gray-100">
        <div 
          className="h-full bg-black transition-all duration-300" 
          style={{ width: `${((currentIndex) / questions.length) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 md:px-8">
        <div className="w-full max-w-3xl">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={variants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="w-full"
            >
              <div className="flex items-start">
                <div className="mr-4 mt-1 flex text-xl font-bold text-blue-600">
                  {currentIndex + 1}
                  <span className="ml-1 mt-1 text-base text-gray-300">→</span>
                </div>
                <div className="flex-1">
                  <h2 className="mb-2 text-2xl font-bold md:text-4xl">
                    {currentQuestion.title}
                    {currentQuestion.required && <span className="ml-2 text-red-500">*</span>}
                  </h2>
                  {currentQuestion.description && (
                    <p className="mb-8 text-lg text-gray-500 md:text-xl">
                      {currentQuestion.description}
                    </p>
                  )}

                  <div className="mt-8">
                    {/* Render input based on type */}
                    {currentQuestion.type === "text" || currentQuestion.type === "email" ? (
                      <input
                        autoFocus
                        type={currentQuestion.type}
                        className="w-full border-b-2 border-blue-200 bg-transparent py-2 text-2xl text-gray-900 focus:border-blue-600 focus:outline-none"
                        placeholder="Type your answer here..."
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleNext();
                          }
                        }}
                      />
                    ) : (
                      <input
                        autoFocus
                        type="text"
                        className="w-full border-b-2 border-blue-200 bg-transparent py-2 text-2xl text-gray-900 focus:border-blue-600 focus:outline-none"
                        placeholder="Type your answer here..."
                        value={answers[currentQuestion.id] || ""}
                        onChange={(e) => setAnswers({ ...answers, [currentQuestion.id]: e.target.value })}
                      />
                    )}
                  </div>
                  
                  <div className="mt-8 flex items-center gap-4">
                    <button
                      onClick={handleNext}
                      disabled={isSubmitting || (currentQuestion.required && !answers[currentQuestion.id])}
                      className="rounded-md bg-blue-600 px-6 py-2.5 font-bold text-white transition-colors hover:bg-blue-700 disabled:bg-gray-300"
                    >
                      {currentIndex === questions.length - 1 ? (isSubmitting ? "Submitting..." : "Submit") : "OK"}
                    </button>
                    {currentIndex < questions.length - 1 && (
                      <span className="text-sm font-medium text-gray-400">press Enter ↵</span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <div className="absolute bottom-6 right-6 flex gap-2">
        <button
          onClick={handlePrev}
          disabled={currentIndex === 0 || isSubmitting}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
        </button>
        <button
          onClick={handleNext}
          disabled={isSubmitting}
          className="flex h-10 w-10 items-center justify-center rounded-md bg-gray-100 text-gray-600 hover:bg-gray-200 disabled:opacity-30"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </button>
      </div>
    </div>
  );
}
