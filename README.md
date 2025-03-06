Women Health Checker AI Chat – README
Overview
This web-based chat interface helps women fill out a health questionnaire and receive AI-driven, doctor-like advice—focusing on potential future diseases and lifestyle precautions. It does not prescribe medications.

Key Features
Health Questionnaire (Sidebar):

Enter Name, Gender, Age, Weight, Height, and Past Medical History.
Data is stored for context in AI responses.
Main Chat:

Single text area (chatInput) for typing or speech input.
Speech Recognition (English via built-in, non-English via Reverie STT).
AI Doctor-Like Advice using Gemini:
Identifies possible future risks and suggests precautions.
Avoids prescribing medications.
Local Doctors (mock function) if an address is provided (e.g., “My address is…”).
Text-to-Speech (Reverie TTS):

Click Start Speaking to hear the AI’s response.
Pause/Resume or Stop speech anytime.
Predict Health Risk (Optional):

Placeholder button sends sample data to a dummy endpoint.
Can be replaced with a real predictive model.
How to Use
Open index.html.
Fill out the questionnaire in the sidebar and click Submit Questionnaire.
Enter or speak your query in the main chat and click Submit.
(Optional) Provide your address in the chat to get local doctor suggestions.
(Optional) Click Predict Health Risk to test the placeholder risk feature.
Customization
Replace placeholder API keys (Gemini, Reverie, Firebase) with real credentials.
Update findLocalDoctors() or integrate a real database.
Adjust the AI prompt in getDoctorLikeAnswer() for different constraints or style.
Disclaimer
This project is a demonstration and does not provide real medical advice.
Consult a healthcare professional for actual medical guidance.
