import { useState } from "react";
import { toast } from "sonner";
import { auth } from "../firebase";
import { useNavigate } from "react-router-dom";
import "./QuizPage.css";

import {
  generateQuizQuestions,
} from "../services/gemini";

import {
  createQuizRoom,
  joinQuizRoom,
} from "../services/quizService";


function QuizRoom({
  selectedFile,
  pdfText,
}) {

  const navigate = useNavigate();


  const [creating, setCreating] =
    useState(false);

  const [joining, setJoining] =
    useState(false);

  const [showJoin, setShowJoin] =
    useState(false);

  const [roomCode, setRoomCode] =
    useState("");

  const [playerName, setPlayerName] =
    useState("");


  // ========================================
  // CREATE QUIZ
  // ========================================

  const handleCreateQuiz =
    async () => {

      if (!selectedFile) {
        toast.error(
          "Please upload a PDF first."
        );
        return;
      }


      if (!pdfText) {
        toast.error(
          "PDF content is not available."
        );
        return;
      }


      if (!auth.currentUser) {
        toast.error(
          "Please login first."
        );
        return;
      }


      try {

        setCreating(true);


        toast.loading(
          "Generating 10 quiz questions...",
          {
            id: "quiz",
          }
        );


        const questions =
          await generateQuizQuestions(
            pdfText
          );


        if (
          !questions ||
          questions.length === 0
        ) {
          throw new Error(
            "No quiz questions were generated."
          );
        }


        toast.loading(
          "Creating quiz room...",
          {
            id: "quiz",
          }
        );


        const room =
          await createQuizRoom(
            questions,
            auth.currentUser.uid
          );


        toast.success(
          "Quiz room created! 🎉",
          {
            id: "quiz",
          }
        );


        navigate(
          `/quiz/${room.roomCode}`
        );


      } catch (error) {

        console.error(
          "Quiz creation error:",
          error
        );


        toast.error(
          error?.message ||
          "Failed to create quiz room.",
          {
            id: "quiz",
          }
        );

      } finally {

        setCreating(false);

      }
    };


  // ========================================
  // JOIN QUIZ
  // ========================================

  const handleJoinQuiz =
    async () => {

      const cleanCode =
        roomCode
          .trim()
          .toUpperCase();


      if (!cleanCode) {

        toast.error(
          "Please enter a room code."
        );

        return;
      }


      if (cleanCode.length !== 6) {

        toast.error(
          "Room code must be 6 characters."
        );

        return;
      }


      if (!auth.currentUser) {

        toast.error(
          "Please login first."
        );

        return;
      }


      try {

        setJoining(true);


        toast.loading(
          "Joining quiz room...",
          {
            id: "join-quiz",
          }
        );


        await joinQuizRoom(
          cleanCode,
          auth.currentUser.uid,
          playerName ||
            auth.currentUser.displayName ||
            "Participant"
        );


        toast.success(
          "Joined quiz successfully! 🎉",
          {
            id: "join-quiz",
          }
        );


        navigate(
          `/quiz/${cleanCode}`
        );


      } catch (error) {

        console.error(
          "Join quiz error:",
          error
        );


        toast.error(
          error?.message ||
          "Failed to join quiz.",
          {
            id: "join-quiz",
          }
        );

      } finally {

        setJoining(false);

      }
    };


  return (

    <div className="quiz-room">

      {/* =================================
          HEADER
      ================================= */}

      <div className="quiz-room-header">

        <div className="quiz-icon">
          🎯
        </div>


        <div>

          <h2>
            Quiz Mode
          </h2>

          <p>
            Create a quiz from your PDF
            and challenge your friends.
          </p>

        </div>

      </div>


      {/* =================================
          INFO CARDS
      ================================= */}

      <div className="quiz-info">

        <div className="quiz-info-item">

          <span>📝</span>

          <div>

            <strong>
              10 Questions
            </strong>

            <small>
              Generated from your PDF
            </small>

          </div>

        </div>


        <div className="quiz-info-item">

          <span>👥</span>

          <div>

            <strong>
              Multiplayer
            </strong>

            <small>
              Invite your friends
            </small>

          </div>

        </div>


        <div className="quiz-info-item">

          <span>🏆</span>

          <div>

            <strong>
              Live Results
            </strong>

            <small>
              See everyone's score
            </small>

          </div>

        </div>

      </div>


      {/* =================================
          JOIN FORM
      ================================= */}

      {showJoin && (

        <div className="quiz-join-box">

          <h3>
            🔗 Join a Quiz
          </h3>

          <p>
            Enter the 6-character room
            code shared by your friend.
          </p>


          <input
            type="text"
            value={roomCode}
            onChange={(e) =>
              setRoomCode(
                e.target.value
                  .toUpperCase()
                  .replace(
                    /[^A-Z0-9]/g,
                    ""
                  )
                  .slice(0, 6)
              )
            }
            placeholder="Enter room code"
            maxLength={6}
          />


          <input
            type="text"
            value={playerName}
            onChange={(e) =>
              setPlayerName(
                e.target.value
              )
            }
            placeholder="Your name"
            maxLength={30}
          />


          <div className="quiz-join-actions">

            <button
              className="quiz-cancel-btn"
              onClick={() => {
                setShowJoin(false);
                setRoomCode("");
                setPlayerName("");
              }}
            >
              Cancel
            </button>


            <button
              className="quiz-join-btn"
              onClick={handleJoinQuiz}
              disabled={joining}
            >
              {joining
                ? "Joining..."
                : "Join Quiz →"}
            </button>

          </div>

        </div>

      )}


      {/* =================================
          BUTTONS
      ================================= */}

      {!showJoin && (

        <div className="quiz-room-actions">

          <button
            className="generate-btn"
            onClick={handleCreateQuiz}
            disabled={creating}
          >

            {creating
              ? "Creating Quiz..."
              : "🎯 Create Quiz Room"}

          </button>


          <button
            className="quiz-secondary-btn"
            onClick={() =>
              setShowJoin(true)
            }
          >
            🔗 Join Quiz
          </button>

        </div>

      )}

    </div>

  );
}


export default QuizRoom;