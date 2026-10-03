import { useState } from "react";

import {
  Moon,
  Sun,
  Upload,
  Sparkles,
  BookOpen,
  MessageCircle,
  Brain,
  FileText,
  ArrowRight,
  LoaderCircle,
  CheckCircle2,
  Send,
  ClipboardList,
} from "lucide-react";

import {
  analyzeMaterial,
  chatWithMaterial,
  getQuiz,
} from "./api";

import "./App.css";


function App() {

  // ==================================================
  // UI
  // ==================================================

  const [darkMode, setDarkMode] = useState(false);

  const [selectedFile, setSelectedFile] =
    useState(null);

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");


  // ==================================================
  // STUDY MATERIAL
  // ==================================================

  const [studyMaterial, setStudyMaterial] =
    useState(null);

  const [documentId, setDocumentId] =
    useState(null);


  // ==================================================
  // CHAT
  // ==================================================

  const [question, setQuestion] =
    useState("");

  const [chatAnswer, setChatAnswer] =
    useState("");

  const [chatLoading, setChatLoading] =
    useState(false);


  // ==================================================
  // QUIZ
  // ==================================================

  const [quiz, setQuiz] =
    useState(null);

  const [quizLoading, setQuizLoading] =
    useState(false);


  // ==================================================
  // FILE SELECTION
  // ==================================================

  const handleFileChange = (event) => {

    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }


    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "application/pdf",
    ];


    if (!allowedTypes.includes(file.type)) {

      setError(
        "Please upload JPG, PNG, WEBP or PDF."
      );

      setSelectedFile(null);

      return;
    }


    if (file.size > 10 * 1024 * 1024) {

      setError(
        "File must be smaller than 10 MB."
      );

      setSelectedFile(null);

      return;
    }


    setError("");

    setSelectedFile(file);

    setStudyMaterial(null);

    setDocumentId(null);

    setChatAnswer("");

    setQuiz(null);
  };


  // ==================================================
  // ANALYZE FILE
  // ==================================================

  const handleAnalyze = async () => {

    if (!selectedFile) {

      setError(
        "Please choose a file first."
      );

      return;
    }


    try {

      setLoading(true);

      setError("");

      console.log(
        "Uploading:",
        selectedFile.name
      );


      const result =
        await analyzeMaterial(
          selectedFile
        );


      console.log(
        "Backend response:",
        result
      );


      setDocumentId(
        result.document_id
      );


      /*
       Your backend currently returns:

       study_material

       NOT

       material
      */

      setStudyMaterial(
        result.study_material
      );


    } catch (error) {

      console.error(
        "UPLOAD ERROR:",
        error
      );


      if (
        error.response
      ) {

        setError(
          error.response.data?.detail ||
          "Backend returned an error."
        );

      } else if (
        error.request
      ) {

        setError(
          "Could not connect to the SnapStudy AI backend."
        );

      } else {

        setError(
          error.message ||
          "Something went wrong."
        );

      }

    } finally {

      setLoading(false);

    }
  };


  // ==================================================
  // CHAT
  // ==================================================

  const handleChat = async () => {

    if (!documentId) {

      setError(
        "Analyze your study material first."
      );

      return;
    }


    if (!question.trim()) {

      return;
    }


    try {

      setChatLoading(true);

      setError("");

      setChatAnswer("");


      const result =
        await chatWithMaterial(
          documentId,
          question
        );


      setChatAnswer(
        result.answer
      );


    } catch (error) {

      console.error(
        "CHAT ERROR:",
        error
      );


      setError(
        error.response?.data?.detail ||
        "Unable to answer your question."
      );

    } finally {

      setChatLoading(false);

    }
  };


  // ==================================================
  // QUIZ
  // ==================================================

  const handleQuiz = async () => {

    if (!documentId) {

      setError(
        "Analyze your study material first."
      );

      return;
    }


    try {

      setQuizLoading(true);

      setError("");


      const result =
        await getQuiz(
          documentId
        );


      setQuiz(
        result.quiz
      );


    } catch (error) {

      console.error(
        "QUIZ ERROR:",
        error
      );


      setError(
        error.response?.data?.detail ||
        "Unable to generate quiz."
      );

    } finally {

      setQuizLoading(false);

    }
  };


  return (

    <div
      className={
        darkMode
          ? "app dark"
          : "app"
      }
    >

      {/* ==================================================
          NAVBAR
      ================================================== */}

      <header className="navbar">

        <div className="brand">

          <div className="brand-icon">

            <Sparkles size={20} />

          </div>


          <div>

            <h1>
              SnapStudy
            </h1>

            <span>
              AI
            </span>

          </div>

        </div>


        <div className="nav-actions">

          <button
            className="theme-button"
            onClick={() =>
              setDarkMode(
                !darkMode
              )
            }
          >

            {darkMode ? (
              <Sun size={20} />
            ) : (
              <Moon size={20} />
            )}

          </button>


          <div className="avatar">
            S
          </div>

        </div>

      </header>


      {/* ==================================================
          MAIN
      ================================================== */}

      <main className="dashboard">


        {/* ==================================================
            HERO
        ================================================== */}

        <section className="hero">

          <div className="hero-text">

            <div className="eyebrow">

              <Sparkles size={16} />

              Your AI study companion

            </div>


            <h2>

              Turn your notes into

              <span>
                {" "}knowledge.
              </span>

            </h2>


            <p>

              Upload notes, textbook pages,
              diagrams, or questions and let
              SnapStudy AI transform them into
              interactive study material.

            </p>

          </div>


          <div className="hero-decoration">

            <div className="floating-card card-one">

              <Brain size={22} />

              <span>
                AI Analysis
              </span>

            </div>


            <div className="floating-card card-two">

              <BookOpen size={22} />

              <span>
                Smart Notes
              </span>

            </div>


            <div className="floating-card card-three">

              <MessageCircle size={22} />

              <span>
                Ask Anything
              </span>

            </div>

          </div>

        </section>


        {/* ==================================================
            ERROR
        ================================================== */}

        {error && (

          <div className="error-box">

            {error}

          </div>

        )}


        {/* ==================================================
            UPLOAD
        ================================================== */}

        <section className="upload-section">

          <div className="upload-card">

            <div className="upload-icon">

              <Upload size={30} />

            </div>


            <h3>
              Upload your study material
            </h3>


            <p>

              Drop an image or PDF here,
              or choose a file from your device.

            </p>


            {/* REAL FILE INPUT */}

            <label className="upload-button">

              <Upload size={18} />

              Choose File

              <input
                type="file"
                accept=".jpg,.jpeg,.png,.webp,.pdf"
                onChange={
                  handleFileChange
                }
                hidden
              />

            </label>


            <span className="upload-hint">

              JPG · PNG · WEBP · PDF ·
              Max 10 MB

            </span>


            {/* SELECTED FILE */}

            {selectedFile && (

              <div className="selected-file">

                <FileText size={18} />

                <span>
                  {selectedFile.name}
                </span>

                <CheckCircle2
                  size={18}
                />

              </div>

            )}


            {/* ANALYZE BUTTON */}

            {selectedFile && (

              <button
                className="analyze-button"
                onClick={
                  handleAnalyze
                }
                disabled={loading}
              >

                {loading ? (

                  <>

                    <LoaderCircle
                      size={19}
                      className="spin"
                    />

                    Analyzing...

                  </>

                ) : (

                  <>

                    <Sparkles
                      size={19}
                    />

                    Analyze with AI

                  </>

                )}

              </button>

            )}

          </div>

        </section>


        {/* ==================================================
            AI RESULTS
        ================================================== */}

        {studyMaterial && (

          <section className="results-section">


            <div className="section-heading">

              <div>

                <span>
                  AI ANALYSIS
                </span>

                <h3>
                  {studyMaterial.title}
                </h3>

              </div>


              <div className="success-pill">

                <CheckCircle2
                  size={16}
                />

                Analyzed

              </div>

            </div>


            {/* SUMMARY */}

            <div className="result-card">

              <div className="card-title">

                <BookOpen size={20} />

                Summary

              </div>


              <p>
                {studyMaterial.summary}
              </p>

            </div>


            {/* KEY CONCEPTS + IMPORTANT POINTS */}

            <div className="result-grid">


              <div className="result-card">

                <div className="card-title">

                  <Brain size={20} />

                  Key Concepts

                </div>


                <ul>

                  {(
                    studyMaterial.key_concepts ||
                    []
                  ).map(
                    (concept, index) => (

                      <li key={index}>

                        {concept}

                      </li>

                    )
                  )}

                </ul>

              </div>


              <div className="result-card">

                <div className="card-title">

                  <Sparkles size={20} />

                  Important Points

                </div>


                <ul>

                  {(
                    studyMaterial.important_points ||
                    []
                  ).map(
                    (point, index) => (

                      <li key={index}>

                        {point}

                      </li>

                    )
                  )}

                </ul>

              </div>

            </div>


            {/* DEFINITIONS */}

            {studyMaterial.definitions?.length > 0 && (

              <div className="result-card">

                <div className="card-title">

                  <FileText size={20} />

                  Definitions

                </div>


                {studyMaterial.definitions.map(
                  (definition, index) => (

                    <div
                      className="definition"
                      key={index}
                    >

                      <strong>
                        {definition.term}
                      </strong>

                      <p>
                        {definition.meaning}
                      </p>

                    </div>

                  )
                )}

              </div>

            )}


            {/* FORMULAS */}

            {studyMaterial.formulas?.length > 0 && (

              <div className="result-card">

                <div className="card-title">

                  📐 Formulas

                </div>


                {studyMaterial.formulas.map(
                  (formula, index) => (

                    <div
                      className="formula"
                      key={index}
                    >

                      {formula}

                    </div>

                  )
                )}

              </div>

            )}


            {/* PRACTICE QUESTIONS */}

            <div className="result-card">

              <div className="card-title">

                <ClipboardList size={20} />

                Practice Questions

              </div>


              {(
                studyMaterial.practice_questions ||
                []
              ).map(
                (item, index) => (

                  <div
                    className="question-item"
                    key={index}
                  >

                    <strong>

                      Q{index + 1}.{" "}

                      {item.question}

                    </strong>


                    <p>

                      <b>
                        Answer:
                      </b>{" "}

                      {item.answer}

                    </p>


                    <small>
                      {item.difficulty}
                    </small>

                  </div>

                )
              )}

            </div>


            {/* ==================================================
                CHAT
            ================================================== */}

            <div className="chat-card">

              <div className="card-title">

                <MessageCircle size={20} />

                Ask Your Notes

              </div>


              <div className="chat-input-row">

                <input
                  type="text"
                  value={question}
                  placeholder="Ask something about your notes..."
                  onChange={(event) =>
                    setQuestion(
                      event.target.value
                    )
                  }
                  onKeyDown={(event) => {

                    if (
                      event.key === "Enter"
                    ) {

                      handleChat();

                    }

                  }}
                />


                <button
                  onClick={
                    handleChat
                  }
                  disabled={
                    chatLoading ||
                    !question.trim()
                  }
                >

                  {chatLoading ? (

                    <LoaderCircle
                      size={20}
                      className="spin"
                    />

                  ) : (

                    <Send size={20} />

                  )}

                </button>

              </div>


              {chatAnswer && (

                <div className="chat-answer">

                  <strong>
                    ✦ SnapStudy AI
                  </strong>

                  <p>
                    {chatAnswer}
                  </p>

                </div>

              )}

            </div>


            {/* ==================================================
                QUIZ
            ================================================== */}

            <div className="quiz-section">

              <div className="card-title">

                <Brain size={20} />

                Practice Quiz

              </div>


              <button
                className="quiz-button"
                onClick={
                  handleQuiz
                }
                disabled={
                  quizLoading
                }
              >

                {quizLoading ? (

                  <>
                    <LoaderCircle
                      size={18}
                      className="spin"
                    />

                    Generating...

                  </>

                ) : (

                  <>
                    <ClipboardList
                      size={18}
                    />

                    Generate Quiz

                  </>

                )}

              </button>


              {Array.isArray(quiz) && (

                <div className="quiz-list">

                  {quiz.map(
                    (item, index) => (

                      <div
                        className="quiz-question"
                        key={index}
                      >

                        <h4>

                          {index + 1}.{" "}

                          {item.question}

                        </h4>


                        <p>

                          <strong>
                            Answer:
                          </strong>{" "}

                          {item.answer}

                        </p>


                        <small>
                          {item.difficulty}
                        </small>

                      </div>

                    )
                  )}

                </div>

              )}

            </div>

          </section>

        )}


        {/* ==================================================
            FEATURES
        ================================================== */}

        {!studyMaterial && (

          <section className="features">

            <div className="section-heading">

              <div>

                <span>
                  WHAT YOU CAN DO
                </span>

                <h3>
                  Study smarter
                </h3>

              </div>

            </div>


            <div className="feature-grid">

              <div className="feature-card lavender">

                <div className="feature-icon">

                  <FileText />

                </div>

                <h4>
                  AI Notes
                </h4>

                <p>

                  Get concise summaries,
                  key concepts, definitions,
                  and important points.

                </p>

                <ArrowRight
                  className="feature-arrow"
                  size={20}
                />

              </div>


              <div className="feature-card blue">

                <div className="feature-icon">

                  <MessageCircle />

                </div>

                <h4>
                  Ask Your Notes
                </h4>

                <p>

                  Chat with your uploaded
                  study material and get
                  grounded answers.

                </p>

                <ArrowRight
                  className="feature-arrow"
                  size={20}
                />

              </div>


              <div className="feature-card pink">

                <div className="feature-icon">

                  <Brain />

                </div>

                <h4>
                  Practice Quiz
                </h4>

                <p>

                  Generate practice questions
                  with difficulty levels and answers.

                </p>

                <ArrowRight
                  className="feature-arrow"
                  size={20}
                />

              </div>

            </div>

          </section>

        )}


        <footer>

          <p>
            Made with <span>✦</span>
            {" "}for better learning.
          </p>

        </footer>

      </main>

    </div>
  );
}


export default App;