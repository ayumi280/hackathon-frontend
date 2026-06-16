import { Heart } from 'lucide-react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import type { Item } from '../types';

interface Props {
  item: Item;
  onLikeToggle?: (itemId: number, liked: boolean) => void;
}

export function ItemCard({ item, onLikeToggle }: Props) {
  const thumbnail = item.images?.[0]?.url;

  const handleLike = async (e: React.MouseEvent) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    try {
      const res = await api.post<{ liked: boolean }>(`/items/${item.id}/like`);
      onLikeToggle?.(item.id, res.data.liked);
    } catch {
      // 認証エラーはaxiosインターセプターで処理済み
    }
  };

  return (
    <Link to={`/items/${item.id}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
        {/* 商品画像 */}
        <div className="relative aspect-square bg-gray-100">
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={item.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}

          {/* いいねボタン */}
          <button
            onClick={handleLike}
            className="absolute top-2 right-2 bg-white/80 backdrop-blur-sm rounded-full p-1.5 shadow"
          >
            <Heart
              size={16}
              className={item.is_liked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'}
            />
          </button>

          {/* 売り切れバッジ */}
          {item.status === 'sold' && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
              <span className="bg-white text-gray-800 text-xs font-bold px-3 py-1 rounded-full">
                SOLD
              </span>
            </div>
          )}
        </div>

        {/* 商品情報 */}
        <div className="p-2.5">
          <p className="text-xs text-gray-700 line-clamp-2 leading-snug mb-1">{item.title}</p>
          <p className="text-sm font-bold text-gray-900">¥{item.price.toLocaleString()}</p>
          <div className="flex items-center gap-1 mt-1">
            <Heart size={11} className="text-gray-400" />
            <span className="text-xs text-gray-400">{item.like_count}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
