import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { X, MessageSquare, Send, AtSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

const NOTIF_KEY = (projectId) => `collab_comments_seen_${projectId}`;

export function getUnseenCount(projectId, comments) {
  try {
    const seen = parseInt(localStorage.getItem(NOTIF_KEY(projectId)) || "0");
    return comments.filter(c => new Date(c.created_date).getTime() > seen).length;
  } catch { return 0; }
}

export function markCommentsSeen(projectId) {
  localStorage.setItem(NOTIF_KEY(projectId), Date.now().toString());
}

export default function CommentsPanel({ taskId, projectId, open, onClose, projectMembers = [] }) {
  const [comments, setComments] = useState([]);
  const [text, setText] = useState("");
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showMentions, setShowMentions] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const textareaRef = useRef(null);
  const bottomRef = useRef(null);

  useEffect(() => {
    if (!open || !taskId) return;
    base44.auth.me().then(setUser);
    const load = async () => {
      const data = await base44.entities.Comment.filter({ task_id: taskId }, "created_date", 100);
      setComments(data);
      setLoading(false);
    };
    load();
    const unsub = base44.entities.Comment.subscribe(() => load());
    return unsub;
  }, [taskId, open]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [comments]);

  const handleTextChange = (e) => {
    const val = e.target.value;
    setText(val);
    const atIdx = val.lastIndexOf("@");
    if (atIdx >= 0 && atIdx === val.length - 1 || (atIdx >= 0 && !val.slice(atIdx + 1).includes(" "))) {
      setMentionQuery(val.slice(atIdx + 1).toLowerCase());
      setShowMentions(true);
    } else {
      setShowMentions(false);
    }
  };

  const insertMention = (member) => {
    const atIdx = text.lastIndexOf("@");
    const newText = text.slice(0, atIdx) + `@${member.name || member.email} `;
    setText(newText);
    setShowMentions(false);
    textareaRef.current?.focus();
  };

  const filteredMembers = projectMembers.filter(m =>
    (m.name || m.email || "").toLowerCase().includes(mentionQuery)
  );

  const handleSend = async () => {
    if (!text.trim() || !user) return;
    const mentions = (text.match(/@[\w.\-@]+/g) || []).map(m => m.slice(1));
    await base44.entities.Comment.create({
      task_id: taskId,
      project_id: projectId,
      user_email: user.email,
      user_name: user.full_name || user.email,
      content: text.trim(),
      mentions,
    });
    setText("");
  };

  if (!open) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-80 md:w-96 bg-card border-l border-border shadow-2xl z-50 flex flex-col animate-in slide-in-from-right-full duration-300">
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold">Comments</h2>
          {comments.length > 0 && (
            <span className="text-xs bg-muted px-1.5 py-0.5 rounded-full text-muted-foreground">{comments.length}</span>
          )}
        </div>
        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-5 h-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
          ) : comments.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground text-sm">
              <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No comments yet. Be the first!
            </div>
          ) : (
            comments.map(comment => <CommentBubble key={comment.id} comment={comment} currentUser={user} />)
          )}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>

      {/* Input */}
      <div className="p-4 border-t border-border relative">
        {showMentions && filteredMembers.length > 0 && (
          <div className="absolute bottom-full left-4 right-4 mb-1 bg-popover border border-border rounded-lg shadow-lg z-10 overflow-hidden">
            {filteredMembers.map((m, i) => (
              <button
                key={i}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-muted text-left text-sm"
                onClick={() => insertMention(m)}
              >
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                  {(m.name || m.email).charAt(0).toUpperCase()}
                </div>
                <span>{m.name || m.email}</span>
              </button>
            ))}
          </div>
        )}
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <textarea
              ref={textareaRef}
              value={text}
              onChange={handleTextChange}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
              }}
              placeholder="Add a comment... Type @ to mention"
              rows={2}
              className="w-full resize-none text-sm rounded-lg border border-input bg-background px-3 py-2 pr-8 focus:outline-none focus:ring-1 focus:ring-ring"
            />
            <AtSign className="absolute right-2.5 top-2.5 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
          </div>
          <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!text.trim()}>
            <Send className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

function CommentBubble({ comment, currentUser }) {
  const isMe = comment.user_email === currentUser?.email;
  const timeAgo = comment.created_date
    ? formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })
    : "";

  // Render @mentions as highlighted spans
  const renderContent = (content) => {
    const parts = content.split(/(@[\w.\-@]+)/g);
    return parts.map((part, i) =>
      part.startsWith("@")
        ? <span key={i} className="text-primary font-medium">{part}</span>
        : part
    );
  };

  return (
    <div className={`flex gap-2.5 ${isMe ? "flex-row-reverse" : ""}`}>
      <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0 mt-0.5">
        {(comment.user_name || comment.user_email).charAt(0).toUpperCase()}
      </div>
      <div className={`max-w-[80%] ${isMe ? "items-end" : "items-start"} flex flex-col gap-0.5`}>
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-xs font-semibold">{comment.user_name || comment.user_email}</span>
          <span className="text-[10px] text-muted-foreground">{timeAgo}</span>
        </div>
        <div className={`rounded-2xl px-3 py-2 text-sm ${isMe ? "bg-primary text-primary-foreground rounded-tr-sm" : "bg-muted text-foreground rounded-tl-sm"}`}>
          {renderContent(comment.content)}
        </div>
      </div>
    </div>
  );
}