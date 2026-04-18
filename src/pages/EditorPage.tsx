// src/pages/EditorPage.tsx
// エディタ画面。App をレンダリングし、AppHeader に一覧へ戻るボタンを渡す。
// navigate("/") は App 内の AppHeader 経由で発火する。
import { useNavigate } from 'react-router-dom';
import App from '../App';

export function EditorPage() {
    const navigate = useNavigate();
    return <App onBack={() => navigate('/')} />;
}