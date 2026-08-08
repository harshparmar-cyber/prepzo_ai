import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  collection,
  query,
  where,
  getDocs,
  limit,
} from "firebase/firestore";

import { db } from "../firebase";
import { toast } from "sonner";

function QuizPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);

  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  // =========================================
  // LOAD QUIZ
  // =========================================

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);

        if (!roomCode) {
          toast.error("Invalid quiz room.");
          setLoading(false);
          return;
        }

        const quizQuery = query(
          collection(db, "quizRooms"),
          where(
            "roomCode",
            "==",
            roomCode.toUpperCase()
          ),
          limit(1)
        );

        const snapshot = await getDocs(quizQuery);

        if (snapshot.empty) {
          toast.error("Quiz room not found.");
          setQuiz(null);
          setLoading(false);
          return;
        }

        const quizDoc = snapshot.docs[0];

        const quizData = {
          id: quizDoc.id,
          ...quizDoc.data(),
        };

        if (quizData.status !== "active") {
          toast.error(
            "This quiz room is no longer active."
          );

          setQuiz(null);
          setLoading(false);
          return;
        }

        setQuiz(quizData);

      } catch (error) {
        console.error(
          "Quiz loading error:",
          error
        );

        toast.error("Failed to load quiz.");

      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [roomCode]);

  // =========================================
  // SELECT ANSWER
  // =========================================

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
  };

  // =========================================
  // CALCULATE RESULT
  // =========================================

  const calculateResult = (finalAnswers) => {
    let correct = 0;

    quiz.questions.forEach(
      (question, index) => {
        const userAnswer =
          finalAnswers[index];

        const correctAnswer =
          question.answer;

        if (
          userAnswer &&
          correctAnswer &&
          userAnswer
            .toString()
            .trim()
            .toUpperCase() ===
            correctAnswer
              .toString()
              .trim()
              .charAt(0)
              .toUpperCase()
        ) {
          correct++;
        }
      }
    );

    setScore(correct);
    setQuizFinished(true);

    toast.success(
      "Quiz completed! 🎉"
    );
  };

  // =========================================
  // NEXT QUESTION
  // =========================================

  const handleNext = () => {
    if (selectedAnswer === null) {
      toast.error(
        "Please select an answer."
      );
      return;
    }

    const updatedAnswers = [
      ...answers,
      selectedAnswer,
    ];

    setAnswers(updatedAnswers);

    // Last question
    if (
      currentQuestion >=
      quiz.questions.length - 1
    ) {
      calculateResult(updatedAnswers);
      return;
    }

    setSelectedAnswer(null);

    setCurrentQuestion(
      currentQuestion + 1
    );
  };

  // =========================================
  // LOADING
  // =========================================

  if (loading) {
    return (
      <div className="quiz-page quiz-loading-page">
        <div className="quiz-loading-card">
          <div className="quiz-loading-icon">
            🎯
          </div>

          <h2>Loading Quiz...</h2>

          <p>
            Please wait while we load
            the quiz.
          </p>
        </div>
      </div>
    );
  }

  // =========================================
  // QUIZ NOT FOUND
  // =========================================

  if (!quiz) {
    return (
      <div className="quiz-page quiz-error-page">
        <div className="quiz-error-card">

          <div className="quiz-error-icon">
            😕
          </div>

          <h1>Quiz Not Found</h1>

          <p>
            This quiz room may no longer
            exist or the room code is invalid.
          </p>

          <button
            className="quiz-next-btn"
            onClick={() =>
              navigate("/dashboard")
            }
          >
            ← Back to Dashboard
          </button>

        </div>
      </div>
    );
  }

  // =========================================
  // RESULT SCREEN
  // =========================================

  if (quizFinished) {
    const totalQuestions =
      quiz.questions.length;

    const percentage = Math.round(
      (score / totalQuestions) * 100
    );

    return (
      <div className="quiz-page">

        <div className="quiz-result-wrapper">

          {/* RESULT CARD */}

          <div className="quiz-result-card">

            <div className="result-icon">
              🎉
            </div>

            <p className="result-label">
              QUIZ COMPLETED
            </p>

            <h1>
              Great job!
            </h1>

            <p className="result-room">
              Room Code:{" "}
              <strong>
                {roomCode.toUpperCase()}
              </strong>
            </p>

            <div className="score-circle">

              <strong>
                {score}/{totalQuestions}
              </strong>

              <span>
                {percentage}%
              </span>

            </div>

            <h2>
              {percentage >= 80
                ? "Excellent! 🔥"
                : percentage >= 60
                ? "Good Job! 👏"
                : percentage >= 40
                ? "Keep Practicing! 💪"
                : "Keep Learning! 📚"}
            </h2>

            <p className="result-description">
              You answered{" "}
              <strong>{score}</strong>{" "}
              out of{" "}
              <strong>
                {totalQuestions}
              </strong>{" "}
              questions correctly.
            </p>

            <button
              className="quiz-next-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>


          {/* ANSWER REVIEW */}

          <div className="answer-review-card">

            <div className="answer-review-header">

              <div>
                <span className="review-icon">
                  📋
                </span>

                <div>
                  <h2>
                    Answer Review
                  </h2>

                  <p>
                    Review your answers
                    and the correct answers.
                  </p>
                </div>
              </div>

              <span className="review-score">
                {score}/{totalQuestions}
              </span>

            </div>


            <div className="answer-list">

              {quiz.questions.map(
                (question, index) => {

                  const userAnswer =
                    answers[index];

                  const correctAnswer =
                    question.answer
                      ?.toString()
                      .trim()
                      .charAt(0)
                      .toUpperCase();

                  const isCorrect =
                    userAnswer ===
                    correctAnswer;

                  const userOption =
                    question.options?.[
                      userAnswer
                        ? userAnswer.charCodeAt(0) -
                          65
                        : -1
                    ];

                  const correctOption =
                    question.options?.[
                      correctAnswer
                        ? correctAnswer.charCodeAt(0) -
                          65
                        : -1
                    ];

                  return (
                    <div
                      key={index}
                      className={`answer-review-item ${
                        isCorrect
                          ? "answer-correct"
                          : "answer-wrong"
                      }`}
                    >

                      <div className="review-question-top">

                        <span className="review-question-number">
                          Q{index + 1}
                        </span>

                        <span
                          className={`review-status ${
                            isCorrect
                              ? "correct-status"
                              : "wrong-status"
                          }`}
                        >
                          {isCorrect
                            ? "✓ Correct"
                            : "✕ Incorrect"}
                        </span>

                      </div>

                      <h3>
                        {question.question}
                      </h3>


                      {/* USER ANSWER */}

                      <div className="review-answer user-answer">

                        <span>
                          Your Answer
                        </span>

                        <strong>
                          {userAnswer
                            ? `${userAnswer}) ${userOption}`
                            : "Not answered"}
                        </strong>

                      </div>


                      {/* CORRECT ANSWER */}

                      <div className="review-answer correct-answer">

                        <span>
                          Correct Answer
                        </span>

                        <strong>
                          {correctAnswer
                            ? `${correctAnswer}) ${correctOption}`
                            : "Not available"}
                        </strong>

                      </div>

                    </div>
                  );
                }
              )}

            </div>

          </div>

        </div>
      </div>
    );
  }

  // =========================================
  // CURRENT QUESTION
  // =========================================

  const question =
    quiz.questions[currentQuestion];

  const progress =
    ((currentQuestion + 1) /
      quiz.questions.length) *
    100;

  // =========================================
  // QUIZ UI
  // =========================================

  return (
    <div className="quiz-page">

      <div className="quiz-container">

        {/* HEADER */}

        <div className="quiz-header">

          <div className="quiz-title-area">

            <div className="quiz-title-icon">
              🎯
            </div>

            <div>
              <h1>
                Quiz Mode
              </h1>

              <p>
                Answer the questions based
                on the uploaded PDF.
              </p>
            </div>

          </div>

          <div className="quiz-room-code">

            <span>
              ROOM CODE
            </span>

            <strong>
              {roomCode.toUpperCase()}
            </strong>

          </div>

        </div>


        {/* PROGRESS */}

        <div className="quiz-progress">

          <div className="progress-info">

            <span>
              Question{" "}
              {currentQuestion + 1}{" "}
              of{" "}
              {quiz.questions.length}
            </span>

            <span>
              {Math.round(progress)}%
            </span>

          </div>

          <div className="progress-bar">

            <div
              className="progress-fill"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>


        {/* QUESTION CARD */}

        <div className="quiz-card">

          <div className="question-number">
            Question {currentQuestion + 1}
          </div>

          <h2>
            {question.question}
          </h2>


          {/* OPTIONS */}

          <div className="quiz-options">

            {question.options?.map(
              (option, index) => {

                const optionLetter =
                  String.fromCharCode(
                    65 + index
                  );

                const isSelected =
                  selectedAnswer ===
                  optionLetter;

                return (
                  <button
                    key={index}
                    type="button"
                    className={`quiz-option ${
                      isSelected
                        ? "selected"
                        : ""
                    }`}
                    onClick={() =>
                      handleAnswer(
                        optionLetter
                      )
                    }
                  >

                    <span className="option-letter">
                      {optionLetter}
                    </span>

                    <span className="option-text">
                      {option}
                    </span>

                    {isSelected && (
                      <span className="selected-check">
                        ✓
                      </span>
                    )}

                  </button>
                );
              }
            )}

          </div>


          {/* NEXT */}

          <button
            className="quiz-next-btn"
            onClick={handleNext}
          >
            {currentQuestion ===
            quiz.questions.length - 1
              ? "Finish Quiz 🎉"
              : "Next Question →"}
          </button>

        </div>

      </div>

    </div>
  );
}

export default QuizPage;