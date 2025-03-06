/***** ▼▼▼ ADDED: Firebase Setup ▼▼▼ *****/
// 1. Your Firebase config (replace with your real values):
const firebaseConfig = {
    apiKey: "YOUR-HF-API-KEY",
    authDomain: "YOUR-AUTH-DOMAIN",
    projectId: "YOUR-PROJECT-ID",
    storageBucket: "YOUR-STORAGE-BUCKET",
    messagingSenderId: "YOUR-MESSAGING-SENDER-ID",
    appId: "YOUR-APP-ID"
  };
  
  // 2. Initialize Firebase
  firebase.initializeApp(firebaseConfig);
  
  // 3. Get Firestore reference
  const db = firebase.firestore();
  
  /***** EXAMPLE: Store a user doc *****/
  async function addOrUpdateUser() {
    try {
      const userId = "user123"; // In a real app, use the authenticated user's ID
      await db.collection("users").doc(userId).set({
        name: "Alice",
        email: "alice@example.com",
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("User added/updated successfully!");
    } catch (error) {
      console.error("Error adding/updating user:", error);
    }
  }
  
  /***** EXAMPLE: Store chat history *****/
  async function storeChatHistory(question, answer) {
    try {
      await db.collection("chatHistory").add({
        question: question,
        answer: answer,
        timestamp: firebase.firestore.FieldValue.serverTimestamp()
      });
      console.log("Chat history stored successfully!");
    } catch (error) {
      console.error("Error storing chat history:", error);
    }
  }
  /***** ▲▲▲ END: Firebase Setup & Example Functions ▲▲▲ *****/
  
  /***** 1. API KEYS & ENDPOINTS *****/
  const HF_API_KEY = "YOUR-HF-API-KEY";
  const HF_IMAGE_API_URL = "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0"; // (Not used now)
  
  const GEMINI_API_KEY = "AIzaSyD9kGnAUXcRa8KH8czjd-6aB0qsutVlrVQ";
  const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  
  // Reverie TTS
  const REVERIE_API_KEY = "db9bd468ee2d7cc1272433c69a125ab1c730f0be";
  const REVERIE_APP_ID  = "dev.prabhakarpratham02";
  const REVERIE_API_URL = "https://revapi.reverieinc.com/";
  
  /***** 2. HTML Elements *****/
  // Chat Input & AI Response
  const chatInput = document.getElementById("chatInput");
  const aiResponse = document.getElementById("aiResponse");
  
  // Chat Buttons (Main Area)
  const toggleRecordingBtn_main = document.getElementById("toggleRecordingBtn_main");
  const askButton_main          = document.getElementById("askButton_main");
  const toggleSpeakBtn_main     = document.getElementById("toggleSpeakBtn_main");
  const pauseSpeakBtn_main      = document.getElementById("pauseSpeakBtn_main");
  
  // Sidebar Elements
  const fileInput       = document.getElementById("fileInput");
  const processFileBtn  = document.getElementById("processFileBtn");
  const inputLangSelect = document.getElementById("inputLang");
  const outputLangSelect= document.getElementById("outputLang");
  const predictRiskBtn  = document.getElementById("predictRiskBtn");
  
  // Women-Health Modes
  const modeSelect  = document.getElementById("modeSelect");
  const applyModeBtn= document.getElementById("applyModeBtn");
  let selectedMode   = "";
  
  // Questionnaire Form Elements
  const userName     = document.getElementById("userName");
  const userGender   = document.getElementById("userGender");
  const userAge      = document.getElementById("userAge");
  const userWeight   = document.getElementById("userWeight");
  const userHeight   = document.getElementById("userHeight");
  const userHistory  = document.getElementById("userHistory");
  const submitQuestionnaireBtn = document.getElementById("submitQuestionnaireBtn");
  
  // Additional form field for address (not in the original HTML, but you can add it)
  let userAddress = "";  // We'll prompt for this in the chat if needed
  
  /***** Additional Variables *****/
  let recognition;
  let isRecording = false;
  let mediaRecorder = null;
  let recordedChunks = [];
  let isRecordingReverie = false;
  let isSpeaking = false;
  let currentAudio = null;
  
  /***** 
   * 4. STORED USER INFO
   * We'll store the user's details after they submit the questionnaire.
   * Then, when the user asks a question, we'll incorporate those details in the prompt.
   ****/
  let storedUserInfo = {
    name: "",
    gender: "",
    age: "",
    weight: "",
    height: "",
    history: ""
  };
  
  /***** 3. Women‑Health Mode Settings *****/
  applyModeBtn.addEventListener("click", () => {
    selectedMode = modeSelect.value; 
    switch (selectedMode) {
      case "pregnant":
        document.body.style.fontSize = "1.3em";
        alert("🟢 Pregnant Mode Activated: Tailored guidance for expectant mothers.");
        break;
      case "pcos":
        alert("🟢 PCOS Mode Activated: Information and advice for PCOS management.");
        break;
      case "endometriosis":
        alert("🟢 Endometriosis Mode Activated: Personalized support for endometriosis issues.");
        break;
      case "thyroid":
        alert("🟢 Thyroid Mode Activated: Early detection and guidance for thyroid imbalances.");
        break;
      default:
        document.body.style = "";
        alert("⚪ Default Women’s Health Mode Activated");
    }
  });
  
  /***** 4. Speech Recognition (English + Reverie STT) *****/
  if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = "en-US";
  
    recognition.onresult = (event) => {
      // Put recognized text into the main chat input
      chatInput.value = event.results[0][0].transcript;
    };
  
    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      isRecording = false;
      toggleRecordingBtn_main.textContent = "Start Recording";
    };
  } else {
    alert("Speech recognition is not supported by your browser.");
  }
  
  // Start/Stop Recording Button
  toggleRecordingBtn_main.addEventListener("click", async () => {
    const chosenLang = inputLangSelect.value;
    if (chosenLang === "en" || chosenLang === "auto") {
      // English or auto → use built-in SpeechRecognition
      if (!recognition) {
        alert("Speech recognition not supported. Please try a different approach.");
        return;
      }
      if (!isRecording) {
        recognition.start();
        isRecording = true;
        toggleRecordingBtn_main.textContent = "Stop Recording";
      } else {
        recognition.stop();
        isRecording = false;
        toggleRecordingBtn_main.textContent = "Start Recording";
      }
    } else {
      // Non-English → record via MediaRecorder + Reverie STT
      if (!isRecordingReverie) {
        try {
          let stream = await navigator.mediaDevices.getUserMedia({ audio: true });
          mediaRecorder = new MediaRecorder(stream);
          recordedChunks = [];
  
          mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) recordedChunks.push(e.data);
          };
          mediaRecorder.onstop = async () => {
            let blob = new Blob(recordedChunks, { type: "audio/wav" });
            try {
              let sttText = await sendToReverieSTT(blob, chosenLang);
              chatInput.value = sttText;
            } catch (err) {
              console.error("Reverie STT error:", err);
              alert("Error transcribing audio. See console for details.");
            }
          };
  
          mediaRecorder.start();
          isRecordingReverie = true;
          toggleRecordingBtn_main.textContent = "Stop Recording";
        } catch (err) {
          console.error("Error accessing mic:", err);
          alert("Could not access microphone. Check permissions.");
        }
      } else {
        mediaRecorder.stop();
        isRecordingReverie = false;
        toggleRecordingBtn_main.textContent = "Start Recording";
      }
    }
  });
  
  async function sendToReverieSTT(audioBlob, langCode) {
    const supportedReverieLangs = {
      en: "en", hi: "hi", bn: "bn", ml: "ml", ta: "ta", te: "te",
      gu: "gu", mr: "mr", kn: "kn", or: "or", pa: "pa", as: "as",
      ur: "ur", ma: "ma", sa: "sa", sd: "sd", ks: "ks", mni: "mni",
      ne: "ne", kok: "kok"
    };
    const reverieLang = supportedReverieLangs[langCode] || "hi";
  
    let formData = new FormData();
    formData.append("audio_file", audioBlob, "recording.wav");
  
    let response = await fetch(REVERIE_API_URL, {
      method: "POST",
      headers: {
        "REV-API-KEY": REVERIE_API_KEY,
        "REV-APP-ID": REVERIE_APP_ID,
        "REV-APPNAME": "stt_file",
        "src_lang": reverieLang,
        "domain": "generic",
        "format": "wav"
      },
      body: formData
    });
    if (!response.ok) {
      throw new Error(`Reverie STT error: ${response.status} - ${response.statusText}`);
    }
  
    let data = await response.json();
    console.log("Reverie STT data:", data);
    return data.text || data.transcript || "Could not parse STT text.";
  }
  
  /***** 5. File Processing (Text only) *****/
  processFileBtn.addEventListener("click", async () => {
    const file = fileInput.files[0];
    if (!file) {
      alert("Select a file first.");
      return;
    }
    if (file.type === "text/plain") {
      const reader = new FileReader();
      reader.onload = (e) => {
        chatInput.value = e.target.result; // Put file text into chatInput
      };
      reader.readAsText(file);
    } else {
      alert("Only text files are supported.");
    }
  });
  
  /***** 6. Additional function: findLocalDoctors(address) *****/
  /** 
   * This is a mock function. In real life, you'd call an API or have a local DB.
   * For now, we just return a dummy list of doctors. 
   */
  function findLocalDoctors(address) {
    if (!address.trim()) {
      return "No address provided. Please provide your address for local doctor info.";
    }
    // Just an example. You might do something like:
    // if address includes "Mumbai" => return Dr. X, Dr. Y
    return `Based on your address: "${address}", here are some local doctors: 
    1. Dr. A 
    2. Dr. B 
    3. Dr. C
    (This is a demo; real data would come from an actual database or API.)`;
  }
  
  /***** 7. Ask AI (Gemini) - Simple Q&A (Now includes user context) *****/
  askButton_main.addEventListener("click", async () => {
    let question = chatInput.value.trim();
  
    // If we haven't asked for an address yet, we can prompt for it
    // Or we can just add an address field to the user data
    if (!userAddress.trim()) {
      // We'll do a quick check if the question includes 'my address is ...'
      let matchAddress = question.match(/my address is (.*)/i);
      if (matchAddress) {
        userAddress = matchAddress[1].trim();
        alert("Address saved as: " + userAddress);
      }
    }
  
    if (!question) {
      alert("Enter or upload a question in the chat box.");
      return;
    }
  
    aiResponse.value = "Processing your question...";
  
    try {
      // We'll call getDoctorLikeAnswer so it uses the new doctor-like prompt
      const geminiText = await getDoctorLikeAnswer(question, outputLangSelect.value);
      // Remove asterisks
      const sanitizedText = geminiText.replace(/\*/g, "");
      aiResponse.value = sanitizedText;
  
      // Store the question/answer in Firestore
      await storeChatHistory(question, sanitizedText);
    } catch (err) {
      console.error("Error calling getDoctorLikeAnswer:", err);
      aiResponse.value = "❌ Error generating response. Please try again.";
    }
  });
  
  /***** 8. getDoctorLikeAnswer() that includes user context (like a doctor) *****/
  async function getDoctorLikeAnswer(question, outputLang) {
    // Basic language map
    const langNameMap = { en: "English", hi: "Hindi", bn: "Bengali", ml: "Malayalam", ta: "Tamil", te: "Telugu" };
    const languageName = langNameMap[outputLang] || "English";
  
    // Women’s health mode note
    let modeNote = "";
    switch (selectedMode) {
      case "pregnant":
        modeNote = " The patient is pregnant; provide guidance focusing on pregnancy-related care.";
        break;
      case "pcos":
        modeNote = " The patient has a history of PCOS.";
        break;
      case "endometriosis":
        modeNote = " The patient has had issues related to endometriosis.";
        break;
      case "thyroid":
        modeNote = " The patient may be experiencing thyroid imbalances.";
        break;
      default:
        modeNote = "";
    }
  
    // Incorporate user info
    let userContext = "";
    if (storedUserInfo.name)    userContext += `Name: ${storedUserInfo.name}\n`;
    if (storedUserInfo.gender)  userContext += `Gender: ${storedUserInfo.gender}\n`;
    if (storedUserInfo.age)     userContext += `Age: ${storedUserInfo.age}\n`;
    if (storedUserInfo.weight)  userContext += `Weight: ${storedUserInfo.weight}\n`;
    if (storedUserInfo.height)  userContext += `Height: ${storedUserInfo.height}\n`;
    if (storedUserInfo.history) userContext += `Past Medical History: ${storedUserInfo.history}\n`;
  
    // If we have an address
    if (userAddress.trim()) {
      userContext += `Address: ${userAddress}\n`;
    }
  
    // Generate local doctors info if address is provided
    let localDoctorInfo = "";
    if (userAddress.trim()) {
      localDoctorInfo = findLocalDoctors(userAddress);
    }
  
    // Enhanced prompt: ask for future disease risk, precautions, no asterisks, no medications
    const prompt = `
  You are a friendly, human-like doctor. Here is the patient's info:
  ${userContext}
  
  They asked: "${question}"
  
  Additional context: ${modeNote}
  
  Your instructions:
  1. Identify possible future diseases or conditions that might occur based on the user's data.
  2. Provide practical precautions or lifestyle changes the user should consider.
  3. DO NOT provide any prescription or medication details.
  4. DO NOT include any asterisks (*).
  5. If address is available, mention local doctors (like a short list).
  6. Respond in ${languageName} with a caring tone.
  
  Local Doctor Info (if address is known):
  ${localDoctorInfo}
  `;
  
    console.log("Doctor-Like Prompt:", prompt);
  
    const response = await fetch(GEMINI_API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: prompt }
            ]
          }
        ]
      })
    });
    if (!response.ok) {
      const errText = `Error: ${response.status} - ${response.statusText}`;
      console.error(errText);
      return errText;
    }
  
    const data = await response.json();
    console.log("Gemini API JSON:", data);
  
    // We remove any stray asterisks from the final text
    let answer = data.candidates?.[0]?.content?.parts?.[0]?.text || "No valid response from AI.";
    answer = answer.replace(/\*/g, "");
    return answer;
  }
  
  /***** 9. Health Risk Prediction *****/
  predictRiskBtn.addEventListener("click", () => {
    // Example data
    const exampleHealthData = {
      age: 26,
      weight: 65,      // in kg
      fatigue: 1,      // e.g., 0: none, 1: mild, 2: severe
      symptom1: 0.5,   // sample
      symptom2: 0.8    // sample
    };
    predictHealthRisk(exampleHealthData);
  });
  
  async function predictHealthRisk(healthData) {
    try {
      const response = await fetch("http://localhost:8000/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(healthData)
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      console.log("Prediction result:", result);
      alert("Your risk level is: " + result.risk_level);
      return result;
    } catch (error) {
      console.error("Error predicting health risk:", error);
    }
  }
  
  /***** 10. Health Questionnaire Form - store user info *****/
  submitQuestionnaireBtn.addEventListener("click", async () => {
    const name    = userName.value.trim();
    const gender  = userGender.value.trim();
    const age     = userAge.value.trim();
    const weight  = userWeight.value.trim();
    const height  = userHeight.value.trim();
    const history = userHistory.value.trim();
  
    // The "current problem" is whatever is in the main chat box
    const currentProblem = chatInput.value.trim();
  
    if (!name || !gender || !age || !weight || !height || !currentProblem) {
      alert("Please fill in Name, Gender, Age, Weight, Height, and your current health issue in the chat box.");
      return;
    }
  
    // Save this info in memory for future queries
    storedUserInfo = {
      name,
      gender,
      age,
      weight,
      height,
      history
    };
  
    // If you want to also store in Firestore, you can do that here
    // For now, we just store in memory
    alert("Your questionnaire data is saved. Now you can ask a question in the main box, and the AI will respond as a doctor. If you want to provide an address, type: 'My address is ...' in the chat.");
  });
  
  /***** 11. TTS for AI Response (Reverie) *****/
  toggleSpeakBtn_main.addEventListener("click", () => {
    // If not speaking, start TTS; else stop
    if (!isSpeaking) {
      speakReverieTTS(aiResponse.value, outputLangSelect.value);
    } else {
      stopReverieTTS();
    }
  });
  
  pauseSpeakBtn_main.addEventListener("click", () => {
    if (!currentAudio) {
      alert("No speech is playing right now.");
      return;
    }
    if (currentAudio.paused) {
      // Resume
      currentAudio.play();
      pauseSpeakBtn_main.textContent = "Pause Speech";
    } else {
      // Pause
      currentAudio.pause();
      pauseSpeakBtn_main.textContent = "Resume Speech";
    }
  });
  
  async function speakReverieTTS(text, languageCode) {
    if (!text.trim()) {
      alert("No AI response to speak.");
      return;
    }
    // Map language codes to Reverie TTS speaker IDs
    const speakerMap = {
      en: "en_female",
      hi: "hi_female",
      bn: "bn_female",
      ml: "ml_female",
      ta: "ta_female",
      te: "te_female"
      // add more if needed
    };
    const speaker = speakerMap[languageCode] || "en_female";
  
    toggleSpeakBtn_main.textContent = "Stop Speaking";
    isSpeaking = true;
  
    try {
      const response = await fetch(REVERIE_API_URL, {
        method: "POST",
        headers: {
          "REV-API-KEY": REVERIE_API_KEY,
          "REV-APP-ID": REVERIE_APP_ID,
          "REV-APPNAME": "tts",
          "speaker": speaker,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: [text],
          speed: 1,
          pitch: 0,
          format: "WAV"
        })
      });
  
      if (!response.ok) {
        throw new Error(`Reverie TTS Error: ${response.status} - ${response.statusText}`);
      }
  
      const audioBlob = await response.blob();
      const audioUrl  = URL.createObjectURL(audioBlob);
  
      currentAudio = new Audio(audioUrl);
      currentAudio.play();
  
      currentAudio.onended = () => {
        isSpeaking = false;
        toggleSpeakBtn_main.textContent = "Start Speaking";
        currentAudio = null;
      };
    } catch (error) {
      console.error("Reverie TTS error:", error);
      alert("Error generating speech. Please try again.");
      isSpeaking = false;
      toggleSpeakBtn_main.textContent = "Start Speaking";
    }
  }
  
  function stopReverieTTS() {
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
      currentAudio = null;
    }
    isSpeaking = false;
    toggleSpeakBtn_main.textContent = "Start Speaking";
    pauseSpeakBtn_main.textContent = "Pause Speech"; // reset if paused
  }
  