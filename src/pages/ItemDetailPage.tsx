import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, ChevronLeft, ShoppingBag, MessageCircle } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import { OfferModal } from '../components/OfferModal';
import type { Item } from '../types';

export function ItemDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageIndex, setImageIndex] = useState(0);
  const [showOfferModal, setShowOfferModal] = useState(false);
  const [buying, setBuying] = useState(false);

  useEffect(() => {
    api.get<Item>(`/items/${id}`)
      .then((res) => setItem(res.data))
      .finally(() => setLoading(false));
  }, [id]);

  const handleLike = async () => {
    if (!user) { navigate('/login'); return; }
    if (!item) return;
    const res = await api.post<{ liked: boolean }>(`/items/${item.id}/like`);
    setItem((prev) => prev ? {
      ...prev,
      is_liked: res.data.liked,
      like_count: res.data.liked ? prev.like_count + 1 : prev.like_count - 1,
    } : null);
  };

  const handleBuy = async () => {
    if (!user) { navigate('/login'); return; }
    if (!item || buying) return;
    if (!confirm(`¥${item.price.toLocaleString()} で購入しますか？`)) return;
    setBuying(true);
    try {
      await api.post(`/items/${item.id}/buy`);
      alert('購入しました！取引ページを確認してください。');
      navigate('/');
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      alert(msg || '購入に失敗しました');
    } finally {
      setBuying(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      await navigator.share({ title: item?.title || '', url });
    } else {
      await navigator.clipboard.writeText(url);
      alert('URLをコピーしました');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!item) return <div className="p-4 text-center text-gray-500">商品が見つかりません</div>;

  const isMine = user?.id === item.seller_id;
  const isSelling = item.status === 'selling';

  return (
    <div className="bg-white min-h-screen">
      {/* 戻るボタン */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-16 left-3 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow"
      >
        <ChevronLeft size={20} />
      </button>

      {/* 画像スライダー */}
      <div className="relative aspect-square bg-gray-100">
        {item.images?.[imageIndex]?.url ? (
          <img
            src={item.images[imageIndex].url}
            alt={item.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}

        {/* 画像インジケーター */}
        {item.images?.length > 1 && (
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {item.images.map((_, i) => (
              <button
                key={i}
                onClick={() => setImageIndex(i)}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${i === imageIndex ? 'bg-pink-500' : 'bg-white/60'}`}
              />
            ))}
          </div>
        )}
      </div>

      <div className="px-4 py-4">
        {/* タグ */}
        {item.tags?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {item.tags.map((tag) => (
              <span key={tag.id} className="text-xs bg-pink-50 text-pink-500 px-2.5 py-1 rounded-full">
                #{tag.name}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-lg font-bold text-gray-800 mb-1">{item.title}</h1>
        <p className="text-2xl font-bold text-gray-900 mb-3">¥{item.price.toLocaleString()}</p>

        {/* 出品者 */}
        <Link to={`/users/${item.seller_id}`} className="flex items-center gap-2 mb-4">
          {item.seller?.avatar_url ? (
            <img src={item.seller.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover" />
          ) : (
            <div className="w-9 h-9 rounded-full bg-gray-200 flex items-center justify-center">
              <span className="text-sm text-gray-500">{item.seller?.username?.[0]?.toUpperCase()}</span>
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-800">{item.seller?.username}</p>
            <p className="text-xs text-gray-400">評価 ★{item.seller?.rating?.toFixed(1)}</p>
          </div>
        </Link>

        {/* 説明文 */}
        {item.description && (
          <div className="mb-4">
            <h3 className="text-sm font-medium text-gray-700 mb-1">商品説明</h3>
            <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{item.description}</p>
          </div>
        )}

        {/* アクションバー */}
        <div className="flex gap-2 items-center mt-4">
          <button onClick={handleLike} className="flex items-center gap-1.5 px-4 py-3 rounded-xl border border-gray-200">
            <Heart size={18} className={item.is_liked ? 'fill-pink-500 text-pink-500' : 'text-gray-400'} />
            <span className="text-sm text-gray-600">{item.like_count}</span>
          </button>

          <button onClick={handleShare} className="px-4 py-3 rounded-xl border border-gray-200">
            <Share2 size={18} className="text-gray-400" />
          </button>

          {!isMine && isSelling && (
            <>
              <button
                onClick={() => { if (!user) navigate('/login'); else setShowOfferModal(true); }}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-pink-500 text-pink-500 font-bold text-sm hover:bg-pink-50 transition-colors"
              >
                <MessageCircle size={18} />
                オファー
              </button>
              <button
                onClick={handleBuy}
                disabled={buying}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-pink-500 text-white font-bold text-sm hover:bg-pink-600 disabled:opacity-50 transition-colors"
              >
                <ShoppingBag size={18} />
                {buying ? '購入中...' : '今すぐ購入'}
              </button>
            </>
          )}

          {item.status === 'sold' && (
            <div className="flex-1 text-center py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm">
              SOLD OUT
            </div>
          )}
        </div>
      </div>

      {/* オファーモーダル */}
      {showOfferModal && item && (
        <OfferModal
          item={item}
          onClose={() => setShowOfferModal(false)}
          onSuccess={() => { setShowOfferModal(false); alert('オファーを送りました！'); }}
        />
      )}
    </div>
  );
}
