import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import "./QuizPage.css";

import {
  collection,
  query,
  where,
  getDocs,
  limit,
  doc,
  updateDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";

import { auth, db } from "../firebase";
import { toast } from "sonner";

function QuizPage() {
  const { roomCode } = useParams();
  const navigate = useNavigate();

  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);

  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);

  const [answers, setAnswers] = useState([]);
  const [submittedAnswers, setSubmittedAnswers] = useState([]);

  const [quizFinished, setQuizFinished] = useState(false);
  const [score, setScore] = useState(0);

  const [participants, setParticipants] = useState([]);

  // =========================================================
  // NORMALIZE CORRECT ANSWER
  // =========================================================

  const getCorrectAnswerLetter = (question) => {
    if (!question || !question.answer) {
      return null;
    }

    const rawAnswer = question.answer
      .toString()
      .trim();

    if (!rawAnswer) {
      return null;
    }

    /*
      CASE 1:
      Gemini gives:
      "A"
    */

    const directLetterMatch =
      rawAnswer.match(/^([A-Z])$/i);

    if (directLetterMatch) {
      const letter =
        directLetterMatch[1].toUpperCase();

      const index =
        letter.charCodeAt(0) - 65;

      if (
        question.options &&
        index >= 0 &&
        index < question.options.length
      ) {
        return letter;
      }
    }

    /*
      CASE 2:
      Gemini gives:
      "A) Julius Caesar"
      "A. Julius Caesar"
      "A - Julius Caesar"
    */

    const letterWithTextMatch =
      rawAnswer.match(/^([A-Z])\s*[\)\.\:\-]\s*(.*)$/i);

    if (letterWithTextMatch) {
      const letter =
        letterWithTextMatch[1].toUpperCase();

      const index =
        letter.charCodeAt(0) - 65;

      if (
        question.options &&
        index >= 0 &&
        index < question.options.length
      ) {
        return letter;
      }
    }

    /*
      CASE 3:
      Gemini gives the complete answer:
      "Julius Caesar"

      We compare it with every option.
    */

    if (question.options) {
      const answerText =
        rawAnswer
          .toLowerCase()
          .replace(/^[a-z]\s*[\)\.\:\-]\s*/i, "")
          .trim();

      const optionIndex =
        question.options.findIndex(
          (option) =>
            option
              ?.toString()
              .trim()
              .toLowerCase() === answerText
        );

      if (optionIndex !== -1) {
        return String.fromCharCode(
          65 + optionIndex
        );
      }

      /*
        More flexible comparison.

        Example:
        answer = "Julius Caesar"
        option = "Julius Caesar"
      */

      const flexibleIndex =
        question.options.findIndex(
          (option) => {
            const cleanOption =
              option
                ?.toString()
                .trim()
                .toLowerCase();

            return (
              cleanOption.includes(answerText) ||
              answerText.includes(cleanOption)
            );
          }
        );

      if (flexibleIndex !== -1) {
        return String.fromCharCode(
          65 + flexibleIndex
        );
      }
    }

    return null;
  };

  // =========================================================
  // LOAD QUIZ FROM FIRESTORE
  // =========================================================

  useEffect(() => {
    const loadQuiz = async () => {
      try {
        setLoading(true);

        if (!roomCode) {
          toast.error("Invalid quiz room.");
          setLoading(false);
          return;
        }

        const cleanRoomCode =
          roomCode.trim().toUpperCase();

        const quizQuery = query(
          collection(db, "quizRooms"),
          where(
            "roomCode",
            "==",
            cleanRoomCode
          ),
          limit(1)
        );

        const snapshot =
          await getDocs(quizQuery);

        if (snapshot.empty) {
          toast.error(
            "Quiz room not found."
          );

          setQuiz(null);
          setLoading(false);
          return;
        }

        const quizDoc =
          snapshot.docs[0];

        const quizData = {
          id: quizDoc.id,
          ...quizDoc.data(),
        };

        /*
          Allow both active and waiting rooms.

          This is important for multiplayer.
        */

        if (
          quizData.status !== "active" &&
          quizData.status !== "waiting"
        ) {
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

        toast.error(
          "Failed to load quiz."
        );
      } finally {
        setLoading(false);
      }
    };

    loadQuiz();
  }, [roomCode]);

  // =========================================================
  // REAL-TIME PARTICIPANTS
  // =========================================================

  useEffect(() => {
    if (!quiz?.id) {
      return;
    }

    const participantsRef =
      collection(
        db,
        "quizRooms",
        quiz.id,
        "participants"
      );

    const unsubscribe =
      onSnapshot(
        participantsRef,
        (snapshot) => {
          const participantList =
            snapshot.docs.map(
              (participantDoc) => ({
                id: participantDoc.id,
                ...participantDoc.data(),
              })
            );

          /*
            Sort by score.

            If scores are equal, the player
            who finished earlier comes first.
          */

          participantList.sort(
            (a, b) => {
              if (
                (b.score || 0) !==
                (a.score || 0)
              ) {
                return (
                  (b.score || 0) -
                  (a.score || 0)
                );
              }

              const aTime =
                a.finishedAt?.seconds ||
                a.joinedAt?.seconds ||
                0;

              const bTime =
                b.finishedAt?.seconds ||
                b.joinedAt?.seconds ||
                0;

              return aTime - bTime;
            }
          );

          setParticipants(
            participantList
          );
        },
        (error) => {
          console.error(
            "Participant listener error:",
            error
          );
        }
      );

    return () => {
      unsubscribe();
    };
  }, [quiz?.id]);

  // =========================================================
  // SELECT ANSWER
  // =========================================================

  const handleAnswer = (option) => {
    setSelectedAnswer(option);
  };

  // =========================================================
  // CALCULATE RESULT
  // =========================================================

  const calculateResult = async (
    finalAnswers
  ) => {
    let correct = 0;

    quiz.questions.forEach(
      (question, index) => {
        const userAnswer =
          finalAnswers[index];

        const correctAnswer =
          getCorrectAnswerLetter(
            question
          );

        if (
          userAnswer &&
          correctAnswer &&
          userAnswer.toUpperCase() ===
            correctAnswer.toUpperCase()
        ) {
          correct++;
        }
      }
    );

    setScore(correct);

    /*
      IMPORTANT:
      Save the final answers separately.

      This prevents React state timing issues
      from showing the previous answers.
    */

    setSubmittedAnswers(
      [...finalAnswers]
    );

    try {
      if (!auth.currentUser) {
        throw new Error(
          "User is not logged in."
        );
      }

      const participantsRef =
        collection(
          db,
          "quizRooms",
          quiz.id,
          "participants"
        );

      const participantQuery =
        query(
          participantsRef,
          where(
            "uid",
            "==",
            auth.currentUser.uid
          ),
          limit(1)
        );

      const participantSnapshot =
        await getDocs(
          participantQuery
        );

      if (
        !participantSnapshot.empty
      ) {
        const participantDoc =
          participantSnapshot.docs[0];

        const participantRef =
          doc(
            db,
            "quizRooms",
            quiz.id,
            "participants",
            participantDoc.id
          );

        await updateDoc(
          participantRef,
          {
            score: correct,
            finished: true,
            answers: finalAnswers,
            finishedAt:
              serverTimestamp(),
          }
        );
      } else {
        console.warn(
          "Participant document not found."
        );
      }

      setQuizFinished(true);

      toast.success(
        "Quiz completed! 🎉"
      );

    } catch (error) {
      console.error(
        "Saving quiz result error:",
        error
      );

      toast.error(
        "Quiz completed, but result could not be saved."
      );

      /*
        Still show the result locally.
      */

      setQuizFinished(true);
    }
  };

  // =========================================================
  // NEXT QUESTION
  // =========================================================

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

    /*
      LAST QUESTION
    */

    if (
      currentQuestion >=
      quiz.questions.length - 1
    ) {
      calculateResult(
        updatedAnswers
      );

      return;
    }

    /*
      NEXT QUESTION
    */

    setSelectedAnswer(null);

    setCurrentQuestion(
      currentQuestion + 1
    );
  };

  // =========================================================
  // LOADING SCREEN
  // =========================================================

  if (loading) {
    return (
      <div className="quiz-page">
        <div className="quiz-status-card">

          <div className="quiz-status-icon">
            🎯
          </div>

          <h2>
            Loading Quiz...
          </h2>

          <p>
            Please wait while we load
            the quiz.
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // QUIZ NOT FOUND
  // =========================================================

  if (!quiz) {
    return (
      <div className="quiz-page">

        <div className="quiz-status-card">

          <div className="quiz-error-icon">
            😕
          </div>

          <h1>
            Quiz Not Found
          </h1>

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

  // =========================================================
  // RESULT SCREEN
  // =========================================================

  if (quizFinished) {
    const totalQuestions =
      quiz.questions.length;

    const percentage =
      totalQuestions > 0
        ? Math.round(
            (score /
              totalQuestions) *
              100
          )
        : 0;

    /*
      Find current player's ranking.
    */

    const currentUserId =
      auth.currentUser?.uid;

    const currentPlayerIndex =
      participants.findIndex(
        (player) =>
          player.uid === currentUserId
      );

    const currentRank =
      currentPlayerIndex !== -1
        ? currentPlayerIndex + 1
        : null;

    return (
      <div className="quiz-page">

        <div className="quiz-result-wrapper">

          {/* =========================================
              RESULT CARD
          ========================================= */}

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
              <strong>
                {score}
              </strong>{" "}
              out of{" "}
              <strong>
                {totalQuestions}
              </strong>{" "}
              questions correctly.
            </p>

            {currentRank && (
              <div className="your-rank-box">
                <span>
                  🏆 Your Rank
                </span>

                <strong>
                  #{currentRank}
                </strong>
              </div>
            )}

            <button
              className="quiz-next-btn"
              onClick={() =>
                navigate("/dashboard")
              }
            >
              ← Back to Dashboard
            </button>

          </div>

          {/* =========================================
              LEADERBOARD
          ========================================= */}

          <div className="leaderboard-card">

            <div className="leaderboard-header">

              <div>
                <span className="leaderboard-icon">
                  🏆
                </span>

                <div>
                  <h2>
                    Room Leaderboard
                  </h2>

                  <p>
                    Scores and ranking of all players
                  </p>
                </div>
              </div>

              <span className="player-count">
                {participants.length} Players
              </span>

            </div>

            <div className="leaderboard-list">

              {participants.length === 0 ? (
                <div className="leaderboard-empty">
                  <p>
                    No player results available yet.
                  </p>
                </div>
              ) : (
                participants.map(
                  (player, index) => {

                    const isCurrentPlayer =
                      player.uid ===
                      currentUserId;

                    const playerPercentage =
                      totalQuestions > 0
                        ? Math.round(
                            ((player.score || 0) /
                              totalQuestions) *
                              100
                          )
                        : 0;

                    return (
                      <div
                        key={player.id}
                        className={`leaderboard-player ${
                          isCurrentPlayer
                            ? "current-player"
                            : ""
                        }`}
                      >

                        <div className="rank-number">

                          {index === 0
                            ? "🥇"
                            : index === 1
                            ? "🥈"
                            : index === 2
                            ? "🥉"
                            : `#${index + 1}`}

                        </div>

                        <div className="player-info">

                          <strong>
                            {player.name ||
                              "Participant"}

                            {isCurrentPlayer &&
                              " (You)"}
                          </strong>

                          <span>
                            {player.finished
                              ? "Quiz completed"
                              : "Still playing"}
                          </span>

                        </div>

                        <div className="player-score">

                          <strong>
                            {player.score || 0}/
                            {totalQuestions}
                          </strong>

                          <span>
                            {playerPercentage}%
                          </span>

                        </div>

                      </div>
                    );
                  }
                )
              )}

            </div>

          </div>

          {/* =========================================
              ANSWER REVIEW
          ========================================= */}

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
                    submittedAnswers[index];

                  const correctAnswer =
                    getCorrectAnswerLetter(
                      question
                    );

                  const isCorrect =
                    userAnswer &&
                    correctAnswer &&
                    userAnswer.toUpperCase() ===
                      correctAnswer.toUpperCase();

                  /*
                    Convert A/B/C/D to option index.
                  */

                  const userIndex =
                    userAnswer
                      ? userAnswer.charCodeAt(0) -
                        65
                      : -1;

                  const correctIndex =
                    correctAnswer
                      ? correctAnswer.charCodeAt(0) -
                        65
                      : -1;

                  const userOption =
                    userIndex >= 0 &&
                    question.options?.[
                      userIndex
                    ];

                  const correctOption =
                    correctIndex >= 0 &&
                    question.options?.[
                      correctIndex
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

                      {/* TOP */}

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

                      {/* QUESTION */}

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
                            ? `${userAnswer}) ${
                                userOption ||
                                "Unknown option"
                              }`
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
                            ? `${correctAnswer}) ${
                                correctOption ||
                                "Unknown option"
                              }`
                            : "Correct answer not available"}
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

  // =========================================================
  // CURRENT QUESTION
  // =========================================================

  const question =
    quiz.questions[currentQuestion];

  const progress =
    ((currentQuestion + 1) /
      quiz.questions.length) *
    100;

  // =========================================================
  // QUIZ UI
  // =========================================================

  return (
    <div className="quiz-page">

      <div className="quiz-container">

        {/* =========================================
            HEADER
        ========================================= */}

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

        {/* =========================================
            PROGRESS
        ========================================= */}

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

        {/* =========================================
            QUESTION CARD
        ========================================= */}

        <div className="quiz-card">

          <div className="question-number">
            Question {currentQuestion + 1}
          </div>

          <h2>
            {question.question}
          </h2>

          {/* =========================================
              OPTIONS
          ========================================= */}

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

          {/* =========================================
              NEXT / FINISH
          ========================================= */}

          <button
            type="button"
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