# Soma
*Your body. Your symptoms. One place to track and understand.*

## Inspiration
Everyone has experienced that moment at the doctor’s office when they’re asked, “When did this start?” or “How often does it happen?”—and suddenly, you’re forced to rely on vague memories and guesses. Our health is something we live with constantly, yet we have no intuitive way to observe it, track it, or understand patterns over time.

We realized that the human body doesn’t come with an interface. There’s no dashboard, no timeline, no system that helps people visualize and truly understand what their body is experiencing. As a result, important signals often go unnoticed until they become serious.

We were inspired to build something that bridges this gap—a system that makes health visible, trackable, and understandable. By combining an intuitive visual interface with AI pattern detection, we wanted to create a tool that helps people better understand their own bodies and enables more informed conversations with healthcare professionals.

## What it does
Our application is an AI-powered interactive body journal that allows users to visually log symptoms by clicking directly on a 3D model of their body. Instead of writing vague notes or trying to remember details later, users can precisely track where and how they’re feeling discomfort over time.

As users log entries, our AI continuously analyzes their symptom history to detect patterns, trends, and anomalies. It identifies recurring issues, monitors changes in severity, and connects symptoms to relevant factors such as lifestyle and family health history. The system then generates insights, risk indicators, and structured summaries that help users understand their health more clearly.

Over time, this transforms scattered symptom observations into a coherent, visual timeline of the user’s health—empowering users with awareness and helping clinicians see patterns that might otherwise be missed.

## How we built it
We built the frontend using a modern UI framework to create an immersive split-screen interface featuring an interactive 3D human body model alongside a dynamic journal interface. Users can click directly on body regions, triggering animated page transitions that open dedicated logging pages for that specific area.

We used Supabase as our backend and database to store user logs, health profiles, and AI-generated insights. This allowed us to efficiently manage structured symptom data, attachments, and historical records.

The core intelligence of the system is powered by an AI analysis engine that processes symptom logs, analyzes trends over time, and generates insights using large language models and statistical pattern detection techniques. The AI evaluates severity progression, recurrence patterns, anomaly detection, and potential correlations with family health history.

We integrated the frontend, database, and AI analysis pipeline into a cohesive system that allows real-time logging, analysis, and visualization—transforming raw symptom entries into meaningful, actionable health insights.


### Full Feature List
#### Authentication & Profile
- Auth0 single sign-on integration
- User health profile with lifestyle tracking (sleep, activity, diet)
- Family medical history documentation

#### Interactive 3D body viewer with clickable regions for symptom logging
- Human realistic anatomical model with detailed anatomy mapping
- Body region detection and mapping system (~20 clickable regions mapped to detailed anatomy)
- Heat map overlay showing symptom frequency and severity by body region
- Real-time visualization updates based on log history
- Health Logging

#### Create, edit, and delete symptom/health logs
- Severity and location tracking
- Multimedia attachments (images/files) with blob storage in Supabase
- Rich log detail views with timeline context
- Advanced search across all logs
- Timeline & Visualization

#### Chronological timeline view with health events
- 3D interactive health book with page-flipping animations
- Organized information display across multiple book sections
- AI-Powered Insights

#### Automated AI pattern analysis with anomaly detection
- Z-score statistical analysis for outlier detection
- Severity trend analysis and slope calculations
- Anomaly severity scoring and confidence ratings
- Family history correlation detection
- AI-generated insights from pattern analysis
- Doctor appointment preparation summaries with AI analysis across date ranges
- Predictive risk indicators

#### Appointment Management
- Schedule and track doctor appointments
- Appointment-specific question tracking
- AI-generated preparation summaries based on logged symptoms
- PDF export of appointment preparation documents grouped by body region
- Filtering by past/future appointments

#### Data & Persistence
- IndexedDB local storage via Dexie for offline-first capability
- Supabase cloud database integration
- Edge functions for AI processing (Deno/TypeScript)
- Row-level security (RLS) policies for data privacy

#### UI/UX
- Dark mode support with theme switching
- Responsive glass-morphism design with Tailwind CSS
- Loading states and error handling
- Modal and overlay interfaces

#### Infrastructure
- Vite + React 18 for fast development
- TypeScript for type safety
- React Router for navigation
- Three.js + React Three Fiber for 3D graphics
- Vercel for deployment and hosting

## Challenges we ran into
- Cindy: working with Edison on integrating backboard with Supabase and auth0 was challenging but we managed to figure it out
- Michelle: integrating NVIDIA MONIA because i was experiencing errors with the dimensions of the input image. also 

## Accomplishments that we’re proud of
Successfully building a fully functional end-to-end application, with all core features—from interactive logging to AI insight generation—working together seamlessly
Integrating a fully interactive 3D human body model into the web interface, which required extensive research into 3D rendering, model interaction, and frontend-backend coordination
Integrating NVIDIA MONAI to enable medical image segmentation and abnormality detection, allowing users to visualize and understand potential issues without requiring immediate clinical interpretation
Designing and implementing a clean, modern, and intuitive UI that makes complex health tracking feel natural and accessible
Developing a complete AI analysis pipeline that transforms raw symptom logs into meaningful insights, summaries, and risk indicators
Building a robust backend infrastructure with authentication, database persistence, and real-time data synchronization

## What we learned
Cindy:
Learned how to deploy a full-stack application, including setting up authentication, configuring a production-ready database, and ensuring secure and reliable data storage and access.
Michelle:
Learned how to integrate external machine learning and AI models into a production application, and strengthened my understanding of frontend-backend communication, API design, and building systems that connect user interactions with intelligent analysis.



## What's next for Soma
Our next step is to make Soma deeply personalized, predictive, and seamlessly integrated into real-world healthcare workflows.
Instead of relying on a generic 3D body model, we plan to integrate SHAPY (https://github.com/muelea/shapy), which allows users to generate an accurate, personalized 3D model of their own body from a simple photo. This makes symptom tracking far more precise and intuitive, allowing Soma to become a true digital twin of the user’s physical body.
We also plan to integrate wearable device data from smartwatches and health platforms such as Apple Health and Google Fit. This will allow Soma to continuously monitor physiological signals like heart rate, heart rate variability, sleep patterns, and activity levels. By combining this data with symptom logs, we can train machine learning models to detect early warning signs of potential health issues, such as cardiovascular abnormalities or chronic stress patterns.
To improve accuracy and personalization, we will expand Soma’s health profile to include additional biometric and lifestyle metrics such as height, weight, activity level, sleep quality, and family health history. This allows the AI to generate more context-aware insights and identify inherited or lifestyle-related risk patterns more effectively.
We also plan to implement secure NFC tags or QR codes that allow healthcare providers to quickly access a patient’s health summary during appointments. This creates a frictionless way to share structured symptom timelines, AI-generated insights, and relevant medical history, improving communication and enabling more informed clinical decision-making.
Beyond these features, we aim to evolve Soma into a comprehensive longitudinal health intelligence platform. This includes predictive modeling to forecast potential health risks before symptoms worsen, intelligent alerts that notify users of concerning trends, and automated doctor-ready summaries that help clinicians quickly understand symptom progression.
We also plan to integrate multimodal inputs such as voice logs, photos, and medical documents, allowing users to capture their health experiences more naturally. Over time, Soma will function as a continuously learning system that adapts to each user, helping them better understand their body and detect issues earlier.
Ultimately, our goal is to transform Soma from a symptom tracker into a personalized health intelligence companion — one that helps users visualize, understand, and proactively manage their health over time.

## Running the Application
To run the application:

1. Start the frontend:
	```bash
	npm run dev
	```

2. Activate the backend Python environment:
	```powershell
	cd medical-image-api
	.\.venv\Scripts\Activate.ps1
	```