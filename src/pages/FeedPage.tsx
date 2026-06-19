import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { api } from '../api/client';
import { ItemCard } from '../components/ItemCard';
import type { Item, Tag } from '../types';

type SortKey = 'new' | 'trend' | 'price_asc' | 'price_desc';
type FeedType = 'all' | 'following';

interface AiSearchResult {
  keyword: string;
  price_min: number | null;
  price_max: number | null;
  sort: string;
  summary: string;
}

export function FeedPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';

  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('new');
  const [feedType, setFeedType] = useState<FeedType>('all');
  const [activeTag, setActiveTag] = useState<string>('');

  // AI検索
  const [aiInput, setAiInput] = useState('');
  const [aiSearching, setAiSearching] = useState(false);
  const [aiResult, setAiResult] = useState<AiSearchResult | null>(null);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};

      if (aiResult) {
        if (aiResult.keyword) params.q = aiResult.keyword;
        if (aiResult.price_min != null) params.price_min = String(aiResult.price_min);
        if (aiResult.price_max != null) params.price_max = String(aiResult.price_max);
        params.sort = aiResult.sort || 'new';
      } else {
        params.sort = sort;
        if (keyword) params.q = keyword;
        if (activeTag) params.tag = activeTag;
        if (feedType === 'following') params.feed = 'following';
      }

      const res = await api.get<Item[]>('/items', { params });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [sort, keyword, activeTag, feedType, aiResult]);

  useEffect(() => {
    api.get<Tag[]>('/tags/trend').then((res) => setTags(res.data));
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleLikeToggle = (itemId: number, liked: boolean) => {
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, is_liked: liked, like_count: liked ? item.like_count + 1 : item.like_count - 1 }
          : item
      )
    );
  };

  const handleAiSearch = async () => {
    if (!aiInput.trim() || aiSearching) return;
    setAiSearching(true);
    try {
      const res = await api.post<AiSearchResult>('/ai/search', { query: aiInput });
      setAiResult(res.data);
    } catch {
      alert('検索の解析に失敗しました');
    } finally {
      setAiSearching(false);
    }
  };

  const clearAiSearch = () => {
    setAiResult(null);
    setAiInput('');
  };

  return (
    <div className="px-3 pt-3">
      {/* AI自然言語検索バー */}
      <div className="mb-3">
        <div className="flex gap-2">
          <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-purple-200 px-3 py-2.5 shadow-sm">
            <Sparkles size={15} className="text-purple-400 shrink-0" />
            <input
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAiSearch()}
              placeholder="「5000円以下のスニーカー」など自然な言葉で"
              className="flex-1 text-sm outline-none bg-transparent text-gray-700 placeholder:text-gray-400"
            />
            {aiInput && (
              <button onClick={() => setAiInput('')} className="text-gray-300 hover:text-gray-400">
                <X size={14} />
              </button>
            )}
          </div>
          <button
            onClick={handleAiSearch}
            disabled={aiSearching || !aiInput.trim()}
            className="px-4 py-2.5 bg-purple-500 text-white rounded-xl text-sm font-bold hover:bg-purple-600 disabled:opacity-40 transition-colors whitespace-nowrap"
          >
            {aiSearching ? '解析中...' : 'AI検索'}
          </button>
        </div>
      </div>

      {/* AI検索結果バナー */}
      {aiResult && (
        <div className="mb-3 bg-purple-50 border border-purple-200 rounded-xl px-3 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Sparkles size={13} className="text-purple-500 shrink-0" />
            <span className="text-sm text-purple-700 font-medium truncate">{aiResult.summary}</span>
            <span className="text-xs text-purple-400 shrink-0">({items.length}件)</span>
          </div>
          <button
            onClick={clearAiSearch}
            className="text-purple-400 hover:text-purple-600 ml-2 shrink-0"
          >
            <X size={15} />
          </button>
        </div>
      )}

      {/* 通常フィルター（AI検索中は非表示） */}
      {!aiResult && (
        <>
          <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setFeedType('all')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                feedType === 'all' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              すべて
            </button>
            <button
              onClick={() => setFeedType('following')}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                feedType === 'following' ? 'bg-pink-500 text-white' : 'bg-white text-gray-600 border border-gray-200'
              }`}
            >
              フォロー中
            </button>

            <div className="w-px h-5 bg-gray-200 shrink-0" />

            {(['new', 'trend', 'price_asc', 'price_desc'] as SortKey[]).map((key) => {
              const labels: Record<SortKey, string> = {
                new: '新着',
                trend: 'トレンド',
                price_asc: '安い順',
                price_desc: '高い順',
              };
              return (
                <button
                  key={key}
                  onClick={() => setSort(key)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                    sort === key ? 'bg-gray-800 text-white' : 'bg-white text-gray-500 border border-gray-200'
                  }`}
                >
                  {labels[key]}
                </button>
              );
            })}
          </div>

          {tags.length > 0 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-hide">
              <button
                onClick={() => setActiveTag('')}
                className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                  activeTag === '' ? 'bg-pink-100 text-pink-600 font-medium' : 'text-gray-500 hover:bg-gray-100'
                }`}
              >
                # すべて
              </button>
              {tags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => setActiveTag(activeTag === tag.name ? '' : tag.name)}
                  className={`shrink-0 px-3 py-1 rounded-full text-xs transition-colors ${
                    activeTag === tag.name
                      ? 'bg-pink-100 text-pink-600 font-medium'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  # {tag.name}
                </button>
              ))}
            </div>
          )}

          {keyword && (
            <p className="text-sm text-gray-500 mb-3">
              「{keyword}」の検索結果 ({items.length}件)
            </p>
          )}
        </>
      )}

      {/* 商品グリッド */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">商品がありません</p>
          {aiResult && (
            <button onClick={clearAiSearch} className="mt-3 text-sm text-purple-500 hover:underline">
              検索条件をクリア
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} onLikeToggle={handleLikeToggle} />
          ))}
        </div>
      )}
    </div>
  );
}
