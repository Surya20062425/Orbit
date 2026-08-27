import React, { useState, useRef, useEffect } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Sparkles, 
  Orbit, 
  ShieldAlert, 
  HelpCircle, 
  Loader2, 
  RefreshCw 
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { CelestialBody } from '../types';

interface AiAssistantModalProps {
  selectedBody: CelestialBody | null;
  onClose: () => void;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export const AiAssistantModal: React.FC<AiAssistantModalProps> = ({
  selectedBody,
  onClose,
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I am your **Orbital Astrodynamicist & Planetary Defense Advisor** powered by Gemini AI. 

I can analyze orbital mechanics, impact risks, Close Approach ephemerides, NASA/ESA defense missions (like DART & Hera), or asteroid resource utilization. 

${selectedBody ? `Currently inspecting **${selectedBody.name}** (${selectedBody.category.toUpperCase()}). How can I assist you with this celestial body?` : 'Ask me any question about the Solar System and Near-Earth Objects!'}`,
    },
  ]);

  const [inputPrompt, setInputPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const suggestedQuestions = selectedBody
    ? [
        `What makes ${selectedBody.name}'s orbital trajectory significant?`,
        `How would we deflect ${selectedBody.name} if on a collision course?`,
        `What is the scientific and resource composition of ${selectedBody.name}?`,
      ]
    : [
        'How does Kepler\'s Equation solve 3D orbital positions over time?',
        'How did NASA DART prove kinetic asteroid deflection?',
        'What are the differences between Atens, Apollos, and Amors?',
      ];

  const handleSend = async (queryText?: string) => {
    const textToSend = queryText || inputPrompt;
    if (!textToSend.trim() || isLoading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: textToSend }];
    setMessages(newMessages);
    setInputPrompt('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai/ask-expert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: textToSend,
          prompt: textToSend,
          history: messages.slice(-6),
          objectContext: selectedBody ? {
            name: selectedBody.name,
            category: selectedBody.category,
            isPHA: selectedBody.isPHA,
            semiMajorAxisAU: selectedBody.orbitalElements.a,
            eccentricity: selectedBody.orbitalElements.e,
            inclinationDeg: selectedBody.orbitalElements.i,
            diameterMeters: selectedBody.diameterMeters,
            spectralClass: selectedBody.spectralClass,
            moidAU: selectedBody.moidAU,
            torinoScale: selectedBody.torinoScale,
          } : undefined,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch expert response');
      }

      const data = await response.json();
      setMessages([...newMessages, { role: 'assistant', content: data.reply }]);
    } catch (err: any) {
      setMessages([
        ...newMessages,
        {
          role: 'assistant',
          content: '⚠️ Unable to connect to the astrodynamics AI service. Please verify server connection and try again.',
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div 
      id="ai-assistant-modal" 
      role="dialog"
      aria-modal="true"
      aria-labelledby="ai-assistant-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200"
    >
      <div className="bg-[#050507] border border-white/10 rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden text-[#e0e0e0]">
        {/* Header */}
        <div className="bg-black/60 border-b border-white/10 p-4 px-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.2)]">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 id="ai-assistant-title" className="text-base font-light text-white tracking-widest uppercase flex items-center gap-2 font-sans">
                Orbital Astrodynamics <span className="font-bold text-amber-500">AI Expert</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                  Gemini 3.7 Flash
                </span>
              </h2>
              <p className="text-[10px] text-white/40 font-mono tracking-wider">
                {selectedBody ? `ACTIVE TARGET: ${selectedBody.name.toUpperCase()}` : 'SOLAR SYSTEM ASTRODYNAMICS'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4 text-xs leading-relaxed">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-[88%] rounded-2xl p-3.5 ${
                  msg.role === 'user'
                    ? 'bg-amber-500 text-black font-semibold rounded-tr-sm shadow-md'
                    : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm shadow-sm'
                }`}
              >
                <div className="markdown-body">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-amber-400 text-xs font-mono bg-white/5 p-3 rounded-xl border border-white/10 w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-amber-400" />
              <span>Analyzing Keplerian ephemeris and orbital mechanics...</span>
            </div>
          )}
          <div ref={chatBottomRef} />
        </div>

        {/* Suggested Quick Prompts */}
        <div className="px-5 py-2 bg-black/40 border-t border-white/10 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-white/40 uppercase font-mono flex items-center gap-1 shrink-0 tracking-wider">
            <Sparkles className="w-3 h-3 text-amber-400" /> SUGGESTED:
          </span>
          {suggestedQuestions.map((q, idx) => (
            <button
              key={idx}
              disabled={isLoading}
              onClick={() => handleSend(q)}
              className="text-[11px] bg-white/5 hover:bg-amber-500/10 hover:border-amber-500/40 hover:text-amber-300 text-white/70 px-2.5 py-1 rounded-lg border border-white/10 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Message Input Bar */}
        <div className="p-4 bg-black/60 border-t border-white/10 flex items-center gap-2">
          <input
            type="text"
            placeholder={
              selectedBody
                ? `Ask about ${selectedBody.name}, impact physics, or orbital elements...`
                : 'Ask a question about asteroids, planetary defense, or orbital mechanics...'
            }
            value={inputPrompt}
            onChange={(e) => setInputPrompt(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSend();
            }}
            disabled={isLoading}
            className="flex-1 bg-black/60 border border-white/15 rounded-xl px-4 py-2.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-amber-500"
          />
          <button
            onClick={() => handleSend()}
            disabled={isLoading || !inputPrompt.trim()}
            className="p-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-40 text-black font-bold rounded-xl transition-all shadow-[0_0_12px_rgba(245,158,11,0.3)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
