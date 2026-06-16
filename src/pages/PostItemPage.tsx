import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Upload, X, Loader } from 'lucide-react';
import { api } from '../api/client';
import type { AIAssistResult } from '../types';

export function PostItemPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [previewURLs, setPreviewURLs] = useState<string[]>([]);
  const [, setUploadedURLs] = useState<string[]>([]);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestPrice, setAiSuggestPrice] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 画像を選択してプレビュー表示
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []).slice(0, 4 - imageFiles.length);
    if (files.length === 0) return;

    setImageFiles((prev) => [...prev, ...files]);
    setPreviewURLs((prev) => [...prev, ...files.map((f) => URL.createObjectURL(f))]);
  };

  const removeImage = (index: number) => {
    URL.revokeObjectURL(previewURLs[index]);
    setImageFiles((prev) => prev.filter((_, i) => i !== index));
    setPreviewURLs((prev) => prev.filter((_, i) => i !== index));
    setUploadedURLs((prev) => prev.filter((_, i) => i !== index));
  };

  // 1枚目の画像をClaude APIに送ってAIアシスト
  const handleAIAssist = async () => {
    if (imageFiles.length === 0) {
      setError('先に画像を選択してください');
      return;
    }
    setAiLoading(true);
    setError('');
    try {
      const formData = new FormData();
      formData.append('image', imageFiles[0]);
      const res = await api.post<AIAssistResult>('/ai/assist', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setTitle(res.data.title || title);
      setDescription(res.data.description || description);
      setAiSuggestPrice(res.data.suggest_price);
      if (res.data.tags?.length > 0) {
        setTags((prev) => [...new Set([...prev, ...res.data.tags])]);
      }
    } catch {
      setError('AI解析に失敗しました');
    } finally {
      setAiLoading(false);
    }
  };

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags((prev) => [...prev, tag]);
      setTagInput('');
    }
  };

  // GCSに画像アップロード
  const uploadImages = async (): Promise<string[]> => {
    const urls: string[] = [];
    for (const file of imageFiles) {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post<{ url: string }>('/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      urls.push(res.data.url);
    }
    return urls;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !price) {
      setError('タイトルと価格は必須です');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      // 画像をGCSにアップロード
      const imageURLs = imageFiles.length > 0 ? await uploadImages() : [];

      const res = await api.post<{ id: number }>('/items', {
        title,
        description,
        price: Number(price),
        tags,
        image_urls: imageURLs,
      });
      navigate(`/items/${res.data.id}`);
    } catch {
      setError('出品に失敗しました');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="px-4 pt-4 pb-4">
      <h2 className="text-lg font-bold text-gray-800 mb-4">商品を出品する</h2>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* 画像アップロードエリア */}
        <div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {previewURLs.map((url, i) => (
              <div key={i} className="relative shrink-0 w-24 h-24 rounded-xl overflow-hidden bg-gray-100">
                <img src={url} alt="" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeImage(i)}
                  className="absolute top-1 right-1 bg-black/50 rounded-full p-0.5"
                >
                  <X size={12} className="text-white" />
                </button>
              </div>
            ))}
            {imageFiles.length < 4 && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="shrink-0 w-24 h-24 rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-1 hover:border-pink-400 transition-colors"
              >
                <Upload size={20} className="text-gray-400" />
                <span className="text-xs text-gray-400">画像追加</span>
              </button>
            )}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleImageSelect}
          />
          <p className="text-xs text-gray-400 mt-1">最大4枚まで</p>
        </div>

        {/* AIアシストボタン */}
        <button
          type="button"
          onClick={handleAIAssist}
          disabled={aiLoading || imageFiles.length === 0}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-pink-300 text-pink-500 font-medium text-sm hover:bg-pink-50 disabled:opacity-40 transition-colors"
        >
          {aiLoading ? (
            <Loader size={18} className="animate-spin" />
          ) : (
            <Sparkles size={18} />
          )}
          {aiLoading ? 'AI解析中...' : 'AIで自動入力'}
        </button>

        {/* タイトル */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">商品タイトル *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            maxLength={50}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
            placeholder="例：ユニクロ ダウンジャケット Lサイズ"
          />
        </div>

        {/* 説明文 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">商品説明</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300 resize-none"
            placeholder="状態・サイズ・カラーなど詳しく記入してください"
          />
        </div>

        {/* 価格 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">価格 *</label>
          {aiSuggestPrice && (
            <p className="text-xs text-pink-500 mb-1">
              AI推定相場: ¥{aiSuggestPrice.toLocaleString()}
              <button
                type="button"
                onClick={() => setPrice(String(aiSuggestPrice))}
                className="ml-2 underline"
              >
                使う
              </button>
            </p>
          )}
          <div className="relative">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">¥</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              required
              min={1}
              className="w-full border border-gray-200 rounded-xl pl-8 pr-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="300"
            />
          </div>
        </div>

        {/* タグ */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">タグ（最大10個）</label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="flex items-center gap-1 bg-pink-100 text-pink-600 text-xs px-2.5 py-1 rounded-full"
              >
                #{tag}
                <button type="button" onClick={() => setTags((prev) => prev.filter((t) => t !== tag))}>
                  <X size={11} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
              className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              placeholder="タグを追加"
            />
            <button
              type="button"
              onClick={addTag}
              className="px-4 py-2.5 bg-gray-100 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-200"
            >
              追加
            </button>
          </div>
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-pink-500 text-white rounded-xl py-3.5 font-bold text-sm hover:bg-pink-600 disabled:opacity-50 transition-colors"
        >
          {submitting ? '出品中...' : '出品する'}
        </button>
      </form>
    </div>
  );
}
