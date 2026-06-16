import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Conversation } from '../types';

export function MessagesPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get<Conversation[]>('/messages')
      .then((res) => setConversations(res.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return <p className="text-center text-gray-400 py-20 text-sm">メッセージはまだありません</p>;
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map(({ partner, last_message, unread_count }) => (
        <Link
          key={partner.id}
          to={`/messages/${partner.id}`}
          className="flex items-center gap-3 px-4 py-3 bg-white hover:bg-gray-50"
        >
          {partner.avatar_url ? (
            <img src={partner.avatar_url} alt="" className="w-12 h-12 rounded-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center shrink-0">
              <span className="text-lg font-bold text-white">
                {partner.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <p className="font-medium text-gray-900 truncate">{partner.username}</p>
              <span className="text-xs text-gray-400 shrink-0 ml-2">
                {new Date(last_message.created_at).toLocaleDateString()}
              </span>
            </div>
            <p className="text-sm text-gray-500 truncate">{last_message.content}</p>
          </div>
          {unread_count > 0 && (
            <span className="bg-pink-500 text-white text-xs rounded-full px-2 py-0.5 shrink-0">
              {unread_count}
            </span>
          )}
        </Link>
      ))}
    </div>
  );
}
