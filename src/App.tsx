import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { FeedPage } from './pages/FeedPage';
import { ItemDetailPage } from './pages/ItemDetailPage';
import { PostItemPage } from './pages/PostItemPage';
import { ProfilePage } from './pages/ProfilePage';
import { MessagesPage } from './pages/MessagesPage';
import { ChatPage } from './pages/ChatPage';
import { Layout } from './components/Layout';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!user ? <LoginPage /> : <Navigate to="/" />} />
        <Route path="/register" element={!user ? <RegisterPage /> : <Navigate to="/" />} />
        <Route element={<Layout user={user} />}>
          <Route path="/" element={<FeedPage />} />
          <Route path="/items/:id" element={<ItemDetailPage />} />
          <Route
            path="/post"
            element={user ? <PostItemPage /> : <Navigate to="/login" />}
          />
          <Route path="/users/:id" element={<ProfilePage />} />
          <Route
            path="/messages"
            element={user ? <MessagesPage /> : <Navigate to="/login" />}
          />
          <Route
            path="/messages/:id"
            element={user ? <ChatPage /> : <Navigate to="/login" />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
