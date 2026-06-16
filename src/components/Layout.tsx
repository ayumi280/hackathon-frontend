import { Outlet, Link, useNavigate } from 'react-router-dom';
import { Home, PlusSquare, User, LogOut, Search } from 'lucide-react';
import { useState } from 'react';
import type { User as UserType } from '../types';

interface Props {
  user: UserType | null;
}

export function Layout({ user }: Props) {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(`/?q=${encodeURIComponent(searchQuery)}`);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
          <Link to="/" className="text-xl font-bold text-pink-500 shrink-0">
            nexflea
          </Link>

          {/* 検索バー */}
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="商品を検索"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-pink-300"
              />
            </div>
          </form>

          {user ? (
            <button
              onClick={handleLogout}
              className="shrink-0 text-gray-500 hover:text-gray-700"
              title="ログアウト"
            >
              <LogOut size={20} />
            </button>
          ) : (
            <Link to="/login" className="text-sm text-pink-500 font-medium shrink-0">
              ログイン
            </Link>
          )}
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-lg mx-auto pb-20">
        <Outlet />
      </main>

      {/* ボトムナビゲーション（モバイルファースト） */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50">
        <div className="max-w-lg mx-auto flex items-center justify-around h-14">
          <Link to="/" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-pink-500">
            <Home size={22} />
            <span className="text-xs">ホーム</span>
          </Link>
          {user && (
            <Link to="/post" className="flex flex-col items-center gap-0.5">
              <div className="bg-pink-500 rounded-full p-2">
                <PlusSquare size={22} className="text-white" />
              </div>
            </Link>
          )}
          {user ? (
            <Link to={`/users/${user.id}`} className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-pink-500">
              {user.avatar_url ? (
                <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover" />
              ) : (
                <User size={22} />
              )}
              <span className="text-xs">マイページ</span>
            </Link>
          ) : (
            <Link to="/login" className="flex flex-col items-center gap-0.5 text-gray-600 hover:text-pink-500">
              <User size={22} />
              <span className="text-xs">ログイン</span>
            </Link>
          )}
        </div>
      </nav>
    </div>
  );
}
