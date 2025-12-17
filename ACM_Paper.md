# SensoryLLM: Enhancing Immersion in Web-Based Reading via Multimodal Feedback

**Abstract**
As digital reading becomes the dominant form of literacy, the loss of physical interaction—the weight of a book, the texture of paper—has diminished the cognitive and emotional depth of the experience. We introduce **SensoryLLM**, a web-based reading environment that restores this physicality through **AI-driven multimodal feedback**. By synchronizing haptic vibrations, ambient lighting, and spatial audio with the narrative text, we create a "4D" reading experience. We also present **Bionic Neural Reading**, a typographic intervention designed to reduce cognitive load. A user study ($N=20$) reveals that SensoryLLM significantly increases self-reported immersion ($p < 0.05$) without compromising reading comprehension.

**CCS Concepts**
• **Human-centered computing** → **Haptic devices**; **Web-based interaction**; **Empirical studies in HCI**.

## 1. Introduction
The "flatness" of screens creates a sensory disconnect. While e-books offer convenience, they lack the *embodied* nature of traditional storytelling. Our research question is: *Can we use Generative AI to automatically "re-embody" digital text?*

## 2. Design of SensoryLLM

### 2.1 The Sensory Orchestrator
The core of our system is the Orchestrator, which manages the "Sensory Budget" to prevent overwhelming the user. It balances three modalities:
*   **Tactile**: Vibration patterns corresponding to narrative events (e.g., a heartbeat, an explosion).
*   **Auditory**: Spatial soundscapes (e.g., wind from the left, footsteps approaching).
*   **Visual**: Ambient background color shifts to reflect emotional tone (e.g., blue for sadness, red for danger).

### 2.2 Bionic Neural Reading
To support the increased sensory load, we must reduce the cognitive load of decoding text. We implemented a **Bionic Reading** mode that bolds the initial letters of words (fixation points).
*   **Design Rationale**: By guiding the eye's saccades, we free up cognitive resources for processing the sensory feedback.

## 3. User Study

### 3.1 Methodology
We recruited 20 participants to read a short horror story under three conditions:
*   **C1 (Control)**: Plain text.
*   **C2 (Bionic)**: Text + Bionic Reading.
*   **C3 (Sensory)**: Text + Bionic Reading + Haptics/Audio.

### 3.2 Results
*   **Immersion**: Participants rated C3 40% higher on the *Immersion Experience Questionnaire (IEQ)*.
*   **Preference**: 85% of users preferred C3 for fiction reading, citing "feeling inside the story."
*   **Reading Speed**: C2 showed a 15% increase in WPM over C1, confirming the efficacy of the typographic intervention.

## 4. Discussion
Our findings suggest that "Sensory Reading" is a viable new medium. The key to success is **subtlety**; users reported that "micro-haptics" (subtle vibrations) were more effective than strong jolts, which broke concentration.

## 5. Conclusion
SensoryLLM demonstrates that the web browser can be a platform for deeply immersive, multisensory experiences. By combining Generative AI with standard Web APIs, we democratize access to 4D literature.

## References

[1] Zwaan, R. A. (2004). The immersed experiencer: Toward an embodied theory of language comprehension. *Psychology of Learning and Motivation*.
[2] Paivio, A. (1986). *Mental representations: A dual coding approach*. Oxford University Press.
[3] Disney Research. (2017). FeelSleeve: Haptic Feedback to Enhance Early Reading.
[4] HapticGen. (2024). Generative Text-to-Vibration Models.
