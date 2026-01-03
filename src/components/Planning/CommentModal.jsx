import React, { useState } from 'react';
import { X, Send } from 'lucide-react';

const CommentModal = ({
    isOpen,
    onClose,
    task,
    currentUser,
    onAddComment
}) => {
    const [newComment, setNewComment] = useState('');

    if (!isOpen || !task) return null;

    const handleSubmit = () => {
        if (newComment.trim()) {
            onAddComment(task.id, currentUser.name, newComment);
            setNewComment('');
        }
    };

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md border border-slate-800 flex flex-col h-[500px]">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-800/50 rounded-t-2xl">
                    <h3 className="font-bold text-white truncate max-w-[200px]">{task.title}</h3>
                    <button onClick={onClose}><X className="text-slate-400" /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950/30">
                    {task.comments?.length === 0 && <p className="text-center text-slate-500 text-sm mt-10">No hay comentarios aún.</p>}
                    {task.comments?.map(c => (
                        <div key={c.id} className="bg-slate-800 rounded-xl p-3 border border-slate-700">
                            <div className="flex justify-between items-baseline mb-1">
                                <span className="text-xs font-bold text-blue-400">{c.author}</span>
                                <span className="text-[10px] text-slate-600">{new Date(c.timestamp).toLocaleString()}</span>
                            </div>
                            <p className="text-sm text-slate-300">{c.text}</p>
                        </div>
                    ))}
                </div>
                <div className="p-3 border-t border-slate-800 bg-slate-900 rounded-b-2xl">
                    <div className="relative">
                        <input
                            value={newComment}
                            onChange={e => setNewComment(e.target.value)}
                            onKeyDown={e => {
                                if (e.key === 'Enter') handleSubmit();
                            }}
                            placeholder="Escribe un comentario..."
                            className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-sm text-white focus:border-blue-500 outline-none"
                        />
                        <button
                            onClick={handleSubmit}
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-blue-500 hover:bg-slate-700 rounded-lg"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CommentModal;
