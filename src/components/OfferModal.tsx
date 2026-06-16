import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../api/client';
import type { Item } from '../types';

interface Props {
  item: Item;
  onClose: () => void;
  onSuccess: () => void;
}

const OFFER_PRESETS = [0.9, 0.8, 0.7]; // 10%・20%・30%オフ

export function OfferModal({ item, onClose, onSuccess }: Props) {
  const [customPrice, setCustomPrice] = useState('');
  const [selectedPrice, setSelectedPrice] = useState<number | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const finalPrice = selectedPrice ?? (customPrice ? Number(customPrice) : null);

  const handlePreset = (ratio: number) => {
    const p = Math.floor(item.price * ratio);
    setSelectedPrice(p);
    setCustomPrice('');
  };

  const handleCustomChange = (v: string) => {
    setCustomPrice(v);
    setSelectedPrice(null);
  };

  const handleSubmit = async () => {
    if (!finalPrice || finalPrice <= 0) {
      setError('価格を選択または入力してください');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await api.post(`/items/${item.id}/offers`, {
        offered_price: finalPrice,
        message,
      });
      onSuccess();
    } catch (e: unknown) {
      const msg = (e as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(msg || 'オファーの送信に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-black/40" onClick={onClose}>
      <div
        className="w-full bg-white rounded-t-3xl p-6 max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-800">オファーを送る</h3>
          <button onClick={onClose}><X size={22} className="text-gray-400" /></button>
        </div>

        <p className="text-sm text-gray-500 mb-1">定価</p>
        <p className="text-xl font-bold text-gray-900 mb-4">¥{item.price.toLocaleString()}</p>

        {/* プリセット（ボタン1タップで交渉） */}
        <p className="text-sm font-medium text-gray-700 mb-2">値引き額を選択</p>
        <div className="grid grid-cols-3 gap-2 mb-4">
          {OFFER_PRESETS.map((ratio) => {
            const p = Math.floor(item.price * ratio);
            const isSelected = selectedPrice === p;
            return (
              <button
                key={ratio}
                onClick={() => handlePreset(ratio)}
                className={`py-3 rounded-xl text-sm font-medium border-2 transition-colors ${
                  isSelected
                    ? 'border-pink-500 bg-pink-50 text-pink-600'
                    : 'border-gray-200 text-gray-700'
                }`}
              >
                <div className="font-bold">{Math.round((1 - ratio) * 100)}%オフ</div>
                <div className="text-xs mt-0.5">¥{p.toLocaleString()}</div>
              </button>
            );
          })}
        </div>

        {/* カスタム価格入力 */}
        <p className="text-sm font-medium text-gray-700 mb-2">または金額を直接入力</p>
        <div className="relative mb-4">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">¥</span>
          <input
            type="number"
            value={customPrice}
            onChange={(e) => handleCustomChange(e.target.value)}
            className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="希望価格"
          />
        </div>

        {/* メッセージ */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
          className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none mb-4"
          placeholder="一言メッセージ（任意）"
        />

        {finalPrice && (
          <p className="text-center text-sm text-gray-600 mb-3">
            オファー価格: <span className="text-lg font-bold text-pink-500">¥{finalPrice.toLocaleString()}</span>
          </p>
        )}

        {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

        <button
          onClick={handleSubmit}
          disabled={loading || !finalPrice}
          className="w-full bg-pink-500 text-white rounded-xl py-3.5 font-bold text-sm hover:bg-pink-600 disabled:opacity-50 transition-colors"
        >
          {loading ? '送信中...' : 'オファーを送る'}
        </button>
      </div>
    </div>
  );
}
