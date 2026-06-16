import { useEffect, useRef, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import type { Message, User } from '../types';

export function ChatPage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();

  const [partner, setPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      api.get(`/users/${id}`).then((res) => setPartner(res.data.user)),
      api.get<Message[]>(`/messages/${id}`).then((res) => setMessages(res.data)),
    ]).finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || sending) return;
    setSending(true);
    try {
      const res = await api.post<Message>(`/messages/${id}`, { content });
      setMessages((prev) => [...prev, res.data]);
      setContent('');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="flex items-center gap-2 px-4 py-2 bg-white border-b border-gray-100">
        <Link to="/messages" className="text-gray-500">
          <ArrowLeft size={20} />
        </Link>
        <span className="font-medium text-gray-900">{partner?.username}</span>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex ${m.sender_id === me?.id ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm ${
                m.sender_id === me?.id
                  ? 'bg-pink-500 text-white'
                  : 'bg-gray-100 text-gray-900'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="flex items-center gap-2 px-3 py-2 bg-white border-t border-gray-100">
        <input
          type="text"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="メッセージを入力"
          className="flex-1 px-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
        />
        <button
          type="submit"
          disabled={!content.trim() || sending}
          className="bg-pink-500 text-white rounded-full p-2 disabled:opacity-50"
        >
          <Send size={18} />
        </button>
      </form>
    </div>
  );
}
