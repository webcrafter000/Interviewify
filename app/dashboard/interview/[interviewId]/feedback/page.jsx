"use client";
import { db } from "@/utils/db";
import { UserAnswer } from "@/utils/schema";
import { eq } from "drizzle-orm";
import React, { useEffect, useState } from "react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { chatSession } from "@/utils/GeminiAIModal"; // Import Gemini AI
import Sentiment from "sentiment"; // Import Sentiment library

const Feedback = ({ params }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [overallRating, setOverallRating] = useState(0); // State for overall rating
  const router = useRouter();
  const sentiment = new Sentiment(); // Initialize Sentiment instance

  useEffect(() => {
    GetFeedback();
  }, []);

  const GetFeedback = async () => {
    const result = await db
      .select()
      .from(UserAnswer)
      .where(eq(UserAnswer.mockIdRef, params.interviewId))
      .orderBy(UserAnswer.id);

    let totalRating = 0;
    const updatedFeedback = [];

    for (const item of result) {
      const prompt = `
      Evaluate the user's answer against the correct answer for the following question:
      Question: ${item.question}
      Correct Answer: ${item.correctAns}
      User's Answer: ${item.userAns}
      
      Provide a rating between 1 and 10 and feedback in 1-3 sentences as JSON with fields:
      {
        "rating": 0,
        "feedback": "string"
      }
      `;

      try {
        const aiResponse = await chatSession.sendMessage(prompt);
        const parsedResponse = JSON.parse(aiResponse.response.text());
        let aiRating = Math.min(10, Math.max(1, parsedResponse.rating)); // Ensure rating is between 1-10

        // Use Sentiment to analyze user answer
        const sentimentScore = sentiment.analyze(item.userAns).score;
        const sentimentRating = Math.min(10, Math.max(1, Math.round((sentimentScore + 5) * 2))); // Normalize to 1-10

        // Combine AI rating and sentiment-based rating
        const finalRating = Math.round((aiRating + sentimentRating) / 2); // Averaging for a balanced rating
        totalRating += finalRating;

        updatedFeedback.push({
          ...item,
          rating: finalRating, // Use the combined rating
          feedback: parsedResponse.feedback, // Use feedback from AI
        });
      } catch (error) {
        console.error("AI evaluation failed:", error);

        // Fallback: Use Sentiment rating if AI fails
        const sentimentScore = sentiment.analyze(item.userAns).score;
        const sentimentRating = Math.min(10, Math.max(1, Math.round((sentimentScore + 5) * 2))); // Normalize to 1-10

        updatedFeedback.push({
          ...item,
          rating: sentimentRating,
          feedback: "Fallback feedback: based on sentiment analysis.", // Generic feedback
        });

        totalRating += sentimentRating;
      }
    }

    setOverallRating((totalRating / updatedFeedback.length).toFixed(1)); // Calculate average rating
    setFeedbackList(updatedFeedback);
  };

  return (
    <div className="p-10">
      {/* Render feedback only if there are recorded answers */}
      {feedbackList?.length === 0 ? (
        <h2 className="font-bold text-lg text-green-500">
          Oops😓! No feedback as answers haven't been recorded.
        </h2>
      ) : (
        <>
          <h2 className="text-3xl font-bold text-green-600">
            Congratulations🥳!
          </h2>
          <h2 className="font-bold text-2xl">
            Here is your interview feedback
          </h2>
          <h2 className="text-primary text-lg my-2">
            Your overall interview rating: <strong>{overallRating}/10</strong>
          </h2>
          <h2 className="text-sm text-gray-500">
            Find below interview questions with correct answers, your answer, and feedback for improvements for your next interview.
          </h2>
          {feedbackList &&
            feedbackList.map((item, index) => (
              <Collapsible key={index} className="mt-7">
                <CollapsibleTrigger className="p-2 flex justify-between bg-secondary rounded-lg my-2 text-left gap-7 w-full">
                  {item.question} <ChevronsUpDown className="h-4" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="flex flex-col gap-2">
                    <h2 className="text-red-500 p-2 border rounded-lg">
                      <strong>Rating:</strong> {item.rating}
                    </h2>
                    <h2 className="p-2 border rounded-lg bg-red-50 text-sm text-red-900">
                      <strong>Your Answer: </strong>
                      {item.userAns}
                    </h2>
                    <h2 className="p-2 border rounded-lg bg-green-50 text-sm text-green-900">
                      <strong>Correct Answer Looks Like: </strong>
                      {item.correctAns}
                    </h2>
                    <h2 className="p-2 border rounded-lg bg-blue-50 text-sm text-primary">
                      <strong>Feedback: </strong>
                      {item.feedback}
                    </h2>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            ))}
        </>
      )}
      <Button className="mt-5" onClick={() => router.replace("/dashboard")}>
        Go Home
      </Button>
    </div>
  );
};

export default Feedback;
