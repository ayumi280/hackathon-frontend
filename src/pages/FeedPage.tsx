import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
import { ItemCard } from '../components/ItemCard';
import type { Item, Tag } from '../types';

type SortKey = 'new' | 'trend' | 'price_asc' | 'price_desc';
type FeedType = 'all' | 'following';

export function FeedPage() {
  const [searchParams] = useSearchParams();
  const keyword = searchParams.get('q') || '';

  const [items, setItems] = useState<Item[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('new');
  const [feedType, setFeedType] = useState<FeedType>('all');
  const [activeTag, setActiveTag] = useState<string>('');

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = { sort };
      if (keyword) params.q = keyword;
      if (activeTag) params.tag = activeTag;
      if (feedType === 'following') params.feed = 'following';

      const res = await api.get<Item[]>('/items', { params });
      setItems(res.data);
    } finally {
      setLoading(false);
    }
  }, [sort, keyword, activeTag, feedType]);

  useEffect(() => {
    // トレンドタグ取得
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

  return (
    <div className="px-3 pt-3">
      {/* フィード切り替え + ソート */}
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

      {/* トレンドタグ */}
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

      {/* キーワード表示 */}
      {keyword && (
        <p className="text-sm text-gray-500 mb-3">
          「{keyword}」の検索結果 ({items.length}件)
        </p>
      )}

      {/* 商品グリッド（2カラム） */}
      {loading ? (
        <div className="grid grid-cols-2 gap-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-gray-200 rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-lg">商品がありません</p>
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
