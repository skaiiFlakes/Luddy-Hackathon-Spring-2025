import { SourceTextModule } from "vm";

type InterviewState = 'greeting' | 'asking' | 'responding' | 'closing';
type InterviewerPersonality = 'friendly' | 'professional' | 'challenging';

export interface InterviewQuestion {
    question: string;
    asked: boolean;
}

export interface InterviewResponse {
    text: string;
    type: 'ai' | 'user';
    timestamp: number;
}

export interface AudioConfig {
    voice: string;
    rate: number;
    pitch: number;
    elevenlabsVoiceId?: string; // Add ElevenLabs voice ID
}

class AIInterviewService {
    private interviewState: InterviewState = 'greeting';
    private personality: InterviewerPersonality = 'professional';
    private questions: InterviewQuestion[] = [];
    private responses: InterviewResponse[] = [];
    private currentQuestionIndex: number = 0;
    private interviewerName: string = 'todd';
    private audioContext: AudioContext | null = null;
    private elevenlabsApiKey: string | null = null;
    private useElevenlabs: boolean = false;

    constructor() {
        if (typeof window !== 'undefined') {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        }
    }

    // Initialize the interview with provided parameters
    public initializeInterview(
        interviewerName: string,
        personality: InterviewerPersonality,
        customQuestions: string[]
    ): void {
        this.interviewerName = interviewerName;
        this.personality = personality;
        this.interviewState = 'greeting';  // Start in greeting state
        this.currentQuestionIndex = 0;
        this.responses = [];

        // If custom questions are provided, use them
        // if (customQuestions && customQuestions.length > 0) {
        //   this.questions = customQuestions.map(q => ({ question: q, asked: false }));
        // } else {
        // Default questions based on personality
        this.setDefaultQuestions();
        // }
        console.log("questions:", this.questions);

    }

    private setDefaultQuestions(): void {
        const baseQuestions = [
            "Tell me about yourself and your background.",
            //   "What are your greatest strengths and weaknesses?",
            //   "Why are you interested in this position?",
            //   "Describe a challenging project you've worked on.",
            //   "Where do you see yourself in five years?"
        ];

        // Add personality-specific questions
        switch (this.personality) {
            case 'friendly':
                baseQuestions.push(
                    "What do you like to do outside of work?",
                    "What's your ideal work environment?"
                );
                break;
            case 'professional':
                baseQuestions.push(
                    "How do you handle tight deadlines?",
                    "Describe your approach to problem-solving."
                );
                break;
            case 'challenging':
                baseQuestions.push(
                    "Tell me about a time you failed and what you learned.",
                    "How would you handle a disagreement with a team member?",
                    "What's a gap in your skill set you're working to address?"
                );
                break;
        }

        this.questions = baseQuestions.map(q => ({ question: q, asked: false }));
    }

    // Get the next interviewer statement based on current state
    public async getNextInterviewerStatement(): Promise<string> {
        let statement = '';

        switch (this.interviewState) {
            case 'greeting':
                statement += this.generateGreeting();
                this.interviewState = 'asking';  // Immediately advance to asking state
                break;
            case 'responding':
                statement += this.generateResponse() + ' ';
                // Important fix: After responding, immediately transition to asking state
                // This prevents getting stuck in the responding state
                this.interviewState = this.hasMoreQuestions() ? 'asking' : 'closing';
            case 'asking':
                statement += this.askNextQuestion();
                break;
            case 'closing':
                statement += this.generateClosing();
                break;
        }

        console.log(statement)

        // Add to responses
        this.responses.push({
            text: statement,
            type: 'ai',
            timestamp: Date.now()
        });

        return statement;
    }

    // Process user response and move to next state
    public processUserResponse(audioBlob: Blob, transcript: string): void {
        // Add to responses
        this.responses.push({
            text: transcript,
            type: 'user',
            timestamp: Date.now()
        });

        // After user responds, directly set state to 'responding'
        // This ensures we'll provide a response and then move to the next question
        this.interviewState = 'responding';
    }

    // Check if the interview is complete
    public isInterviewComplete(): boolean {
        return this.interviewState === 'closing' &&
            this.responses[this.responses.length - 1]?.type === 'ai';
    }

    // Set ElevenLabs API key
    public setElevenlabsApiKey(apiKey: string): void {
        this.elevenlabsApiKey = apiKey;
        this.useElevenlabs = true;
    }

    // Get audio configuration based on interviewer personality
    public getAudioConfig(): AudioConfig {
        const voiceConfigs: Record<string, AudioConfig> = {
            'todd': {
                voice: this.personality === 'challenging' ? 'en-US-GuyNeural' : 'en-US-BryanNeural',
                rate: 0.9,
                pitch: this.personality === 'professional' ? 0 : 1,
                elevenlabsVoiceId: '5Q0t7uMcjvnagumLfvZi' // Liam voice (friendly male)
            },
            'jeff': {
                voice: 'en-US-DavisNeural',
                rate: 1,
                pitch: -1,
                elevenlabsVoiceId: 'ZQe5CZNOzWyzPSCn5a3c' // Jeremy voice (deep, professional)
            },
            'karen': {
                voice: 'en-US-JennyNeural',
                rate: 1.1,
                pitch: 2,
                elevenlabsVoiceId: 'jsCqWAovK2LkecY7zXl4' // Freya voice (female)
            },
            'creep': {
                voice: 'en-US-JennyNeural',
                rate: 0.8,
                pitch: 1,
                elevenlabsVoiceId: 'g5CIjZEefAph4nQFvHAz' // Ethan voice (male)
            }
        };

        return voiceConfigs[this.interviewerName] || voiceConfigs.todd;
    }

    // Play text as speech using ElevenLabs or Web Speech API
    public async speakText(text: string): Promise<void> {
        const config = this.getAudioConfig();

        // Try ElevenLabs if enabled and API key is available
        if (this.useElevenlabs && this.elevenlabsApiKey && config.elevenlabsVoiceId) {
            try {
                await this.speakWithElevenlabs(text, config.elevenlabsVoiceId);
                return;
            } catch (error) {
                console.error("Error with ElevenLabs TTS, falling back to Web Speech API:", error);
                // Fall back to Web Speech API
            }
        }

        // Use the Web Speech API as fallback
        return this.speakWithWebSpeechAPI(text, config);
    }

    // Speak text using ElevenLabs API
    private async speakWithElevenlabs(text: string, voiceId: string): Promise<void> {
        const url = `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`;
        const config = this.getAudioConfig();

        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'xi-api-key': this.elevenlabsApiKey!
            },
            body: JSON.stringify({
                text,
                model_id: 'eleven_monolingual_v1',
                voice_settings: {
                    stability: 0.5,
                    similarity_boost: 0.9,
                    speed: config.rate,
                }
            })
        });

        if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.status}`);
        }

        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        return new Promise((resolve) => {
            audio.onended = () => {
                URL.revokeObjectURL(audioUrl);
                resolve();
            };
            audio.play();
        });
    }

    // Enhanced Web Speech API implementation
    private speakWithWebSpeechAPI(text: string, config: AudioConfig): Promise<void> {
        return new Promise((resolve) => {
            if (!('speechSynthesis' in window)) {
                console.error("Browser doesn't support speech synthesis");
                resolve();
                return;
            }

            const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
            let sentenceIndex = 0;

            const speakNextSentence = () => {
                if (sentenceIndex >= sentences.length) {
                    resolve();
                    return;
                }

                const sentence = sentences[sentenceIndex].trim();
                sentenceIndex++;

                const utterance = new SpeechSynthesisUtterance(sentence);

                // Load voices if not already loaded
                let voices = window.speechSynthesis.getVoices();
                if (!voices.length) {
                    window.speechSynthesis.onvoiceschanged = () => {
                        voices = window.speechSynthesis.getVoices();
                        setVoiceAndSpeak();
                    };
                } else {
                    setVoiceAndSpeak();
                }

                function setVoiceAndSpeak() {
                    // Find a matching voice or use the first available one
                    const voiceName = config.voice.split('-')[2].replace('Neural', '');
                    utterance.voice = voices.find(voice =>
                        voice.name.includes(voiceName) ||
                        voice.name.toLowerCase().includes(voiceName.toLowerCase())
                    ) || voices[0];

                    utterance.rate = config.rate;
                    utterance.pitch = config.pitch;
                    // Add natural pauses between sentences
                    utterance.onend = () => {
                        setTimeout(speakNextSentence, 250); // Add a small pause between sentences
                    };

                    window.speechSynthesis.speak(utterance);
                }
            };

            speakNextSentence();
        });
    }

    // Get all interview responses
    public getResponses(): InterviewResponse[] {
        return this.responses;
    }

    // Generate appropriate greeting based on personality
    private generateGreeting(): string {
        const nameCapitalized = this.interviewerName.charAt(0).toUpperCase() + this.interviewerName.slice(1);

        switch (this.personality) {
            case 'creepy':
                return `Hey, pookie bear. My name is ${nameCapitalized}. I'll be conducting your interview today. Wink wink. Are you ready to begin this interview?`;
            case 'friendly':
                return `Hi there! I'm ${nameCapitalized}. It's great to meet you! I'm excited to learn more about you and your experience today. Let's have a casual chat about your background and see how you might fit with our team. Are you ready to begin this interview?`;
            case 'professional':
                return `Hello, I'm ${nameCapitalized}. Thank you for joining me today for this interview. I'd like to discuss your qualifications and experience to determine if you're a good match for the position. Are you ready to begin this interview?`;
            case 'challenging':
                return `Good day. My name is ${nameCapitalized}. I'll be conducting your interview today. I'd like to warn you that I'll be asking some challenging questions to really understand your capabilities and how you handle pressure. Are you ready to begin this interview?`;
            default:
                return `Hello, I'm ${nameCapitalized}. Let's begin the interview.`;
        }
    }

    // Ask the next question in the list
    private askNextQuestion(): string {
        if (!this.hasMoreQuestions()) {
            this.interviewState = 'closing';
            return this.generateClosing();
        }

        const question = this.questions[this.currentQuestionIndex];
        question.asked = true;
        this.currentQuestionIndex++;

        return question.question;
    }

    // Generate an appropriate response to the user's answer
    private generateResponse(): string {
        const lastUserResponse = this.responses.filter(r => r.type === 'user').pop();

        if (!lastUserResponse) {
            return "I see. Let's continue.";
        }
        const friendlyResponses = [
            "That's great to hear! I love that.",
            "Wow, that's really cool! Thanks for sharing.",
            "That's really interesting! Thanks for sharing that with me.",
            "I love that! It's always nice to hear different perspectives.",
            "That's a unique take! I appreciate you sharing that.",
            "I appreciate your perspective. It's always good to hear different viewpoints.",
            "That's a really interesting point! Thank you for sharing.",
            "That's a great thought! I appreciate your insight.",
            "I love that perspective! Thanks for sharing.",
            "That's a unique perspective! Thank you for sharing.",
            "I appreciate your honesty. That's a great insight.",
            "That's a great point! I appreciate your perspective.",
            "That's great to hear!",
            "Wow, that's cool!",
            "That's interesting!",
            "I love that!",
            "That's unique!",
            "Good perspective!",
            "Interesting point!",
            "Great thought!",
            "Love that perspective!",
            "Great point!",
        ]
        const professionalResponses = [
            "Thank you for sharing your thoughts. That's a valuable perspective.",
            "I appreciate your insight. It helps me understand your approach better.",
            "That's a well-considered response. Thank you for your honesty.",
            "Thank you for that detailed answer. It gives me a clearer picture of your experience.",
            "I appreciate your thoroughness. It shows your commitment to the role.",
            "That's a thoughtful response. Thank you for your clarity.",
            "Thank you for your detailed answer. It helps me understand your approach.",
            "I appreciate your thoroughness. It shows your commitment to the role.",
            "That's a well-considered response. Thank you for your honesty.",
            "Thank you for sharing your thoughts. That's a valuable perspective.",
            "That's a thoughtful response. Thank you for your clarity.",
            "I appreciate your insight. It helps me understand your approach better.",
            "That's a well-articulated response. Thank you for your clarity.",
            "Thank you for sharing your thoughts.",
            "That's a valuable perspective.",
            "I appreciate your insight.",
            "That's a well-considered response.",
            "Thank you for your honesty.",
            "I appreciate your thoroughness.",
            "That's a thoughtful response.",
            "Thank you for your clarity.",
            "That's a well-articulated response.",
        ]
        const challengingResponses = [
            "Interesting answer.",
            "Hmmm, okay.",
            "That's one way to look at it.",
            "I see your point.",
            "That's a unique perspective.",
            "Interesting approach.",
            "That's a different take.",
            "I appreciate your honesty.",
            "That's a bold statement.",
            "That's a thought-provoking response.",
            "That's a challenging perspective.",
            "That's a unique take on it.",
            "",
        ]

        // Simple response based on personality
        switch (this.personality) {
            case 'friendly':
                return friendlyResponses[Math.floor(Math.random() * friendlyResponses.length)];
            case 'professional':
                return professionalResponses[Math.floor(Math.random() * professionalResponses.length)];
            case 'challenging':
                return challengingResponses[Math.floor(Math.random() * challengingResponses.length)];
            default:
                return "I understand. Let's move on.";
        }
    }

    // Generate closing statement
    private generateClosing(): string {
        switch (this.personality) {
            case 'friendly':
                return "It's been a pleasure talking with you today! I really enjoyed our conversation. Thank you for your time, and we'll be in touch soon about next steps. Have a great day!";
            case 'professional':
                return "Thank you for your time today. We will review your qualifications and be in touch regarding the next steps in our hiring process. Do you have any questions before we conclude?";
            case 'challenging':
                return "We've come to the end of our interview. I appreciate your responses to my challenging questions. Our team will evaluate your performance and contact you with the results. Thank you for your time.";
            default:
                return "That concludes our interview. Thank you for your time.";
        }
    }

    private hasMoreQuestions(): boolean {
        return this.currentQuestionIndex < this.questions.length;
    }
}

export const aiInterviewService = new AIInterviewService();
export default aiInterviewService;
