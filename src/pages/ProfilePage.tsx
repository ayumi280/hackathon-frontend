import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { ItemCard } from '../components/ItemCard';
import type { Item, User } from '../types';

interface ProfileData {
  user: User;
  follower_count: number;
  following_count: number;
  is_following: boolean;
  items: Item[];
}

export function ProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { user: me } = useAuth();

  const [data, setData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [followLoading, setFollowLoading] = useState(false);

  useEffect(() => {
    api.get<ProfileData>(`/users/${id}`)
      .then((res) => setData(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleFollow = async () => {
    if (!data) return;
    setFollowLoading(true);
    try {
      if (data.is_following) {
        await api.delete(`/users/${id}/follow`);
        setData((prev) => prev ? {
          ...prev,
          is_following: false,
          follower_count: prev.follower_count - 1,
        } : null);
      } else {
        await api.post(`/users/${id}/follow`);
        setData((prev) => prev ? {
          ...prev,
          is_following: true,
          follower_count: prev.follower_count + 1,
        } : null);
      }
    } finally {
      setFollowLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) return <div className="p-4 text-center text-gray-500">ユーザーが見つかりません</div>;

  const { user, follower_count, following_count, is_following, items } = data;
  const isMe = me?.id === user.id;

  return (
    <div>
      {/* プロフィールヘッダー */}
      <div className="bg-white px-4 pt-6 pb-4">
        <div className="flex items-start gap-4">
          {user.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-20 h-20 rounded-full object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center">
              <span className="text-2xl font-bold text-white">
                {user.username?.[0]?.toUpperCase()}
              </span>
            </div>
          )}

          <div className="flex-1">
            <h2 className="text-lg font-bold text-gray-900">{user.username}</h2>
            <div className="flex items-center gap-1 text-amber-400 text-sm mb-1">
              ★ <span className="font-medium">{user.rating?.toFixed(1)}</span>
            </div>
            {user.bio && <p className="text-sm text-gray-500">{user.bio}</p>}

            <div className="flex gap-4 mt-2">
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">{follower_count}</p>
                <p className="text-xs text-gray-500">フォロワー</p>
              </div>
              <div className="text-center">
                <p className="text-base font-bold text-gray-900">{following_count}</p>
                <p className="text-xs text-gray-500">フォロー中</p>
              </div>
            </div>
          </div>
        </div>

        {/* 自分のプロフィール：取引履歴リンク */}
        {isMe && (
          <div className="mt-4">
            <Link
              to="/transactions"
              className="block w-full py-2.5 rounded-xl border border-gray-200 text-gray-700 text-sm font-medium text-center hover:bg-gray-50 transition-colors"
            >
              取引履歴を見る
            </Link>
          </div>
        )}

        {/* フォロー・メッセージボタン（自分以外） */}
        {me && !isMe && (
          <div className="flex gap-2 mt-4">
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className={`flex-1 py-2.5 rounded-xl font-medium text-sm transition-colors ${
                is_following
                  ? 'border border-gray-200 text-gray-600 hover:bg-gray-50'
                  : 'bg-pink-500 text-white hover:bg-pink-600'
              } disabled:opacity-50`}
            >
              {followLoading ? '...' : is_following ? 'フォロー中' : 'フォローする'}
            </button>
            <Link
              to={`/messages/${user.id}`}
              className="flex-1 py-2.5 rounded-xl font-medium text-sm text-center border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              メッセージを送る
            </Link>
          </div>
        )}
      </div>

      {/* 出品中の商品 */}
      <div className="px-3 pt-3">
        <h3 className="text-sm font-medium text-gray-700 mb-3">出品中の商品 ({items.length}件)</h3>
        {items.length === 0 ? (
          <p className="text-center text-gray-400 py-12 text-sm">出品中の商品はありません</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {items.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
