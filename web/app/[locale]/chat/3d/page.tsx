"use client";

import { Suspense, useState, FormEvent, useRef, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import MorphingShape, { Persona } from '@/components/3d/MorphingShape';
import { Mic, Send, StopCircle } from 'lucide-react';

const personas: Persona[] = ['Default', 'Poet', 'Teacher', 'Wise Elder'];

interface Message {
  author: 'User' | 'AI';
  text: string;
}

function ThreeDChatPage() {
  const [persona, setPersona] = useState<Persona>('Default');
  const [messages, setMessages] = useState<Message[]>([
    { author: 'AI', text: 'Hello! Select a persona and ask me something.' },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false); // New state for AI speaking
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioContextRef = useRef<AudioContext | null>(null); // For Web Audio API

  // Initialize AudioContext if not already
  useEffect(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
    }
  }, []);

  const playAudio = async (base64Audio: string) => {
    if (!audioContextRef.current) return;

    try {
      setIsAiSpeaking(true);
      // Ensure the base64 string doesn't include data URI prefix for atob
      const base64Data = base64Audio.includes(',') ? base64Audio.split(',')[1] : base64Audio;
      const audioData = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0)).buffer;
      const audioBuffer = await audioContextRef.current.decodeAudioData(audioData);
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContextRef.current.destination);
      source.start(0);

      source.onended = () => {
        setIsAiSpeaking(false);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsAiSpeaking(false);
    }
  };

  const handleSend = async (e: FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading || isAiSpeaking) return; // Disable if AI is speaking

    const userMessage: Message = { author: 'User', text: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const system_prompt = `You are an AI assistant. Your current persona is '${persona}'. Please respond accordingly.`;

      const response = await fetch('/api/v1/ai/understand?return_audio=true', { // Request audio
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: input,
          context: { system_prompt },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const data = await response.json();
      const aiResponse: Message = { author: 'AI', text: data.content };
      setMessages((prev) => [...prev, aiResponse]);

      if (data.audio_base64) {
        playAudio(data.audio_base64);
      }

    } catch (error) {
      console.error('Chat API failed:', error);
      const errorResponse: Message = { author: 'AI', text: 'Sorry, I encountered an error. Please try again.' };
      setMessages((prev) => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        setIsRecording(false);
        setIsLoading(true); // Set loading for AI processing
        const audioBlob = new Blob(audioChunksRef.current, { type: mediaRecorderRef.current?.mimeType || 'audio/webm' });
        audioChunksRef.current = [];

        // Add a temporary "Listening..." message
        const listeningMessage: Message = { author: 'AI', text: 'Listening...' };
        setMessages((prev) => [...prev, listeningMessage]);

        try {
          const reader = new FileReader();
          reader.readAsDataURL(audioBlob);
          reader.onloadend = async () => {
            let base64AudioData = (reader.result as string);
            // Remove data URI prefix if present before sending to backend
            if (base64AudioData.includes(',')) {
              base64AudioData = base64AudioData.split(',')[1];
            }
            const mimeType = audioBlob.type;

            const system_prompt = `You are an AI assistant. Your current persona is '${persona}'. Please respond accordingly.`;

            const response = await fetch('/api/v1/ai/understand?return_audio=true', { // Request audio
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                audio_base64: base64AudioData,
                audio_mime_type: mimeType,
                context: { system_prompt },
              }),
            });

            // Remove "Listening..." message
            setMessages((prev) => prev.filter(msg => msg !== listeningMessage));

            if (!response.ok) {
              throw new Error(`API Error: ${response.statusText}`);
            }

            const data = await response.json();
            const aiResponse: Message = { author: 'AI', text: data.content };
            setMessages((prev) => [...prev, aiResponse]);

            if (data.audio_base64) {
              playAudio(data.audio_base64);
            }
          };
        } catch (error) {
          console.error('Voice chat API failed:', error);
          // Remove "Listening..." message if it's still there
          setMessages((prev) => prev.filter(msg => msg !== listeningMessage));
          const errorResponse: Message = { author: 'AI', text: 'Sorry, I could not process your voice. Please try again.' };
          setMessages((prev) => [...prev, errorResponse]);
        } finally {
          setIsLoading(false);
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Could not start microphone. Please ensure permissions are granted.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      // setIsRecording(false) is handled in onstop event now
    }
  };

  return (
    <div className="w-full h-screen relative bg-gray-900">
      {/* 3D Canvas */}
      <Suspense fallback={<span className="absolute text-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">Loading 3D Scene...</span>}>
        <Canvas>
          <ambientLight intensity={0.8} />
          <pointLight position={[10, 10, 10]} intensity={2} />
          <MorphingShape persona={persona} isSpeaking={isAiSpeaking} /> {/* Pass isAiSpeaking */}
          <OrbitControls />
        </Canvas>
      </Suspense>

      {/* Chat UI */}
      <div className="absolute top-0 left-0 bottom-0 flex flex-col w-full md:w-1/3 p-4 bg-black/40 backdrop-blur-sm">
        {/* Persona Selector */}
        <div className="flex-shrink-0 p-4 bg-black/20 rounded-lg text-white mb-4">
          <h2 className="font-bold mb-2">Select Persona</h2>
          <div className="flex flex-wrap gap-2">
            {personas.map((p) => (
              <button
                key={p}
                onClick={() => setPersona(p)}
                className={`px-3 py-1 rounded text-sm ${persona === p ? 'bg-orange-500' : 'bg-white/30 hover:bg-white/40'}`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        {/* Message Display */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {messages.map((msg, index) => (
            <div key={index} className={`flex ${msg.author === 'User' ? 'justify-end' : 'justify-start'}`}>
              <div className={`px-4 py-2 rounded-2xl max-w-sm ${msg.author === 'User' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* Input Form */}
        <form onSubmit={handleSend} className="flex-shrink-0 mt-4">
          <div className="flex rounded-lg bg-gray-700 has-[input:disabled]:opacity-50">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isLoading || isAiSpeaking ? 'Waiting for response...' : 'Ask something...'}
              className="flex-1 bg-transparent p-3 text-white placeholder-gray-400 focus:outline-none"
              disabled={isLoading || isRecording || isAiSpeaking} // Disable input while AI speaks
            />
            {!isRecording ? (
              <button
                type="button" // Change to type="button" to prevent form submission
                onClick={startRecording}
                className="bg-red-500 text-white px-4 py-2 rounded-l-lg hover:bg-red-600 disabled:bg-gray-500"
                disabled={isLoading || isAiSpeaking} // Disable while AI speaks
              >
                <Mic size={20} />
              </button>
            ) : (
              <button
                type="button"
                onClick={stopRecording}
                className="bg-red-700 text-white px-4 py-2 rounded-l-lg hover:bg-red-800"
                disabled={isLoading || isAiSpeaking} // Disable while AI speaks
              >
                <StopCircle size={20} />
              </button>
            )}
            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-r-lg hover:bg-blue-700 disabled:bg-gray-500 transition-colors"
              disabled={!input.trim() || isLoading || isRecording || isAiSpeaking} // Disable while AI speaks
            >
              <Send size={20} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ThreeDChatPage;
