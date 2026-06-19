import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, Star } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../hooks/useAuth';
import type { Transaction } from '../types';

type Tab = 'buy' | 'sell';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  pending:   { label: '取引中',   color: 'bg-yellow-100 text-yellow-700' },
  shipping:  { label: '発送済み', color: 'bg-blue-100 text-blue-700' },
  completed: { label: '完了',     color: 'bg-green-100 text-green-700' },
  canceled:  { label: 'キャンセル', color: 'bg-gray-100 text-gray-500' },
};

export function TransactionsPage() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>('buy');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [completing, setCompleting] = useState<number | null>(null);
  const [reviewTarget, setReviewTarget] = useState<number | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get<Transaction[]>(`/transactions?role=${tab === 'buy' ? 'buyer' : 'seller'}`)
      .then((res) => setTransactions(res.data))
      .finally(() => setLoading(false));
  }, [tab]);

  const handleComplete = async (txId: number) => {
    if (!confirm('受取完了にしますか？')) return;
    setCompleting(txId);
    try {
      await api.post(`/transactions/${txId}/complete`);
      setTransactions((prev) =>
        prev.map((tx) => tx.id === txId ? { ...tx, status: 'completed' } : tx)
      );
    } catch {
      alert('操作に失敗しました');
    } finally {
      setCompleting(null);
    }
  };

  const handleReview = async (txId: number) => {
    if (rating < 1 || rating > 5) return;
    setSubmittingReview(true);
    try {
      await api.post(`/transactions/${txId}/review`, { rating, comment });
      setReviewTarget(null);
      setRating(5);
      setComment('');
      alert('レビューを投稿しました！');
    } catch {
      alert('レビューの投稿に失敗しました（既に投稿済みの可能性があります）');
    } finally {
      setSubmittingReview(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <div className="bg-white px-4 py-3 flex items-center gap-3 border-b border-gray-100 sticky top-0 z-10">
        <Link to={`/users/${user?.id}`} className="p-1">
          <ChevronLeft size={22} className="text-gray-600" />
        </Link>
        <h1 className="text-base font-bold text-gray-800">取引履歴</h1>
      </div>

      {/* タブ */}
      <div className="flex bg-white border-b border-gray-100">
        {(['buy', 'sell'] as Tab[]).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-3 text-sm font-medium transition-colors border-b-2 ${
              tab === t
                ? 'border-pink-500 text-pink-500'
                : 'border-transparent text-gray-500'
            }`}
          >
            {t === 'buy' ? '購入した商品' : '販売した商品'}
          </button>
        ))}
      </div>

      {/* リスト */}
      <div className="p-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : transactions.length === 0 ? (
          <p className="text-center text-gray-400 py-16 text-sm">
            {tab === 'buy' ? '購入した商品はありません' : '販売した商品はありません'}
          </p>
        ) : (
          transactions.map((tx) => {
            const partner = tab === 'buy' ? tx.seller : tx.buyer;
            const thumbUrl = tx.item?.images?.[0]?.url;
            const st = STATUS_LABEL[tx.status] ?? STATUS_LABEL.pending;
            const canComplete = tab === 'buy' && (tx.status === 'pending' || tx.status === 'shipping');
            const canReview = tx.status === 'completed';

            return (
              <div key={tx.id} className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <div className="flex gap-3 p-4">
                  {/* サムネイル */}
                  <div className="w-16 h-16 rounded-xl bg-gray-100 overflow-hidden shrink-0">
                    {thumbUrl ? (
                      <img src={thumbUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">No img</div>
                    )}
                  </div>

                  {/* 商品情報 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <Link
                        to={`/items/${tx.item_id}`}
                        className="text-sm font-medium text-gray-800 leading-snug line-clamp-2 hover:text-pink-500"
                      >
                        {tx.item?.title || `商品ID: ${tx.item_id}`}
                      </Link>
                      <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-base font-bold text-gray-900 mt-1">
                      ¥{tx.final_price.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {tab === 'buy' ? '出品者' : '購入者'}: {partner?.username}
                    </p>
                  </div>
                </div>

                {/* アクションボタン */}
                {canComplete && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => handleComplete(tx.id)}
                      disabled={completing === tx.id}
                      className="w-full py-2.5 rounded-xl bg-pink-500 text-white text-sm font-bold hover:bg-pink-600 disabled:opacity-50 transition-colors"
                    >
                      {completing === tx.id ? '処理中...' : '受取完了'}
                    </button>
                  </div>
                )}

                {canReview && reviewTarget !== tx.id && (
                  <div className="px-4 pb-4">
                    <button
                      onClick={() => setReviewTarget(tx.id)}
                      className="w-full py-2.5 rounded-xl border border-pink-300 text-pink-500 text-sm font-medium hover:bg-pink-50 transition-colors"
                    >
                      レビューを書く
                    </button>
                  </div>
                )}

                {/* レビューフォーム */}
                {reviewTarget === tx.id && (
                  <div className="px-4 pb-4 border-t border-gray-50 pt-3">
                    <p className="text-xs text-gray-500 mb-2 font-medium">
                      {partner?.username} さんへのレビュー
                    </p>
                    {/* 星評価 */}
                    <div className="flex gap-1 mb-3">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button key={n} onClick={() => setRating(n)}>
                          <Star
                            size={28}
                            className={n <= rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="コメント（任意）"
                      rows={3}
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-pink-300 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setReviewTarget(null)}
                        className="flex-1 py-2 rounded-xl border border-gray-200 text-gray-500 text-sm"
                      >
                        キャンセル
                      </button>
                      <button
                        onClick={() => handleReview(tx.id)}
                        disabled={submittingReview}
                        className="flex-1 py-2 rounded-xl bg-pink-500 text-white text-sm font-bold disabled:opacity-50"
                      >
                        {submittingReview ? '投稿中...' : '投稿する'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
