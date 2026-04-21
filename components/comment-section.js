// LogWise — CommentSection
// Refactor Aşama 2, Faz 2C-5 (Bölüm 44) — sosyal feed'deki paylaşımlara yorum yapma.
// Özellikler: yorum ekleme, düzenleme (sahip), silme (yorum sahibi veya paylaşım sahibi),
// beğeni (toggle), tek seviye thread (reply). Misafir kullanıcılar okuyabilir, yazamaz.
// Bağımlılıklar (runtime'da çözülür):
//   - React (CDN)                   — React.useState, React.useEffect, React.createElement
//   - window.LOGWISE_TR / _EN       — i18n sözlükleri (comments*, ... anahtarları)
//   - window.LOGWISE_DB             — { sb, profileRoute }
// Kullanım: window.LOGWISE_COMPONENTS.CommentSection
// Props:
//   postId        — paylaşımın id'si (shared_workouts.id, text)
//   postOwnerId   — paylaşım sahibinin user_id'si (yorum silme yetkisi için)
//   user          — { id, email, ... } | null
//   isGuest       — boolean (true → yorum yazamaz, sadece okur)
//   lang          — "tr" | "en"
//   S             — index.html'den S (style) objesi
//   setToast      — (msg: string) => void
//   onCountChange — (newCount: number) => void  (feed card'daki sayacı güncellemek için, opsiyonel)
(function () {
  // Küçük id üretici — text primary key için (Date.now + random)
  const genId = () =>
    Date.now().toString(36) + "-" + Math.random().toString(36).slice(2, 8);

  function CommentSection({
    postId,
    postOwnerId,
    user,
    isGuest,
    lang,
    S,
    setToast,
    onCountChange
  }) {
    const TR = window.LOGWISE_TR;
    const EN = window.LOGWISE_EN;
    const L = lang === "tr" ? TR : EN;
    const DB = window.LOGWISE_DB || {};
    const sb = DB.sb;
    const profileRoute = DB.profileRoute || (id => "/profile?id=" + (id || ""));

    const [comments, setComments] = React.useState([]);
    const [profiles, setProfiles] = React.useState({}); // { user_id: {username, display_name, avatar} }
    const [likes, setLikes] = React.useState({}); // { comment_id: { count, liked } }
    const [loading, setLoading] = React.useState(true);
    const [input, setInput] = React.useState("");
    const [replyTo, setReplyTo] = React.useState(null); // parent comment id
    const [editingId, setEditingId] = React.useState(null);
    const [editInput, setEditInput] = React.useState("");
    const [expandedReplies, setExpandedReplies] = React.useState({}); // { parentId: true }
    const [posting, setPosting] = React.useState(false);

    // Yorumları yükle
    const loadComments = React.useCallback(async () => {
      if (!sb || !postId) return;
      setLoading(true);
      try {
        const { data: rows, error } = await sb
          .from("shared_workout_comments")
          .select("*")
          .eq("post_id", postId)
          .order("created_at", { ascending: true });
        if (error) throw error;
        const list = rows || [];
        setComments(list);
        if (onCountChange) onCountChange(list.length);

        // Profil bilgilerini topla
        const uids = [...new Set(list.map(c => c.user_id))];
        if (uids.length > 0) {
          const { data: profs } = await sb
            .from("profiles")
            .select("user_id,username,display_name,avatar")
            .in("user_id", uids);
          const pmap = {};
          (profs || []).forEach(p => { pmap[p.user_id] = p; });
          setProfiles(pmap);
        }

        // Beğenileri topla
        if (list.length > 0) {
          const cids = list.map(c => c.id);
          const { data: lks } = await sb
            .from("comment_likes")
            .select("comment_id,user_id")
            .in("comment_id", cids);
          const lmap = {};
          cids.forEach(cid => { lmap[cid] = { count: 0, liked: false }; });
          (lks || []).forEach(l => {
            if (!lmap[l.comment_id]) lmap[l.comment_id] = { count: 0, liked: false };
            lmap[l.comment_id].count++;
            if (user && l.user_id === user.id) lmap[l.comment_id].liked = true;
          });
          setLikes(lmap);
        } else {
          setLikes({});
        }
      } catch (e) {
        console.error("loadComments:", e);
      } finally {
        setLoading(false);
      }
    }, [postId, user, onCountChange, sb]);

    React.useEffect(() => { loadComments(); }, [loadComments]);

    // Yorum ekle (parent_id ile reply de destekli)
    const postComment = async (text, parentId) => {
      if (isGuest || !user) {
        setToast(L.commentsLoginRequired);
        return;
      }
      const trimmed = (text || "").trim();
      if (!trimmed) return;
      if (trimmed.length > 500) {
        setToast(L.commentsTooLong);
        return;
      }
      setPosting(true);
      try {
        const row = {
          id: genId(),
          post_id: postId,
          user_id: user.id,
          parent_id: parentId || null,
          content: trimmed
        };
        const { error } = await sb.from("shared_workout_comments").insert(row);
        if (error) throw error;
        if (!parentId) setInput("");
        setReplyTo(null);
        await loadComments();
        if (parentId) setExpandedReplies(s => ({ ...s, [parentId]: true }));
      } catch (e) {
        setToast((lang === "tr" ? "Hata: " : "Error: ") + (e.message || e));
      } finally {
        setPosting(false);
      }
    };

    // Yorum düzenle
    const saveEdit = async commentId => {
      const trimmed = (editInput || "").trim();
      if (!trimmed) return;
      if (trimmed.length > 500) {
        setToast(L.commentsTooLong);
        return;
      }
      try {
        const { error } = await sb
          .from("shared_workout_comments")
          .update({ content: trimmed, edited: true })
          .eq("id", commentId)
          .eq("user_id", user.id);
        if (error) throw error;
        setEditingId(null);
        setEditInput("");
        await loadComments();
      } catch (e) {
        setToast((lang === "tr" ? "Hata: " : "Error: ") + (e.message || e));
      }
    };

    // Yorum sil (yorum sahibi veya paylaşım sahibi)
    const deleteComment = async commentId => {
      if (!window.confirm(L.commentsDeleteConfirm)) return;
      try {
        const { error } = await sb
          .from("shared_workout_comments")
          .delete()
          .eq("id", commentId);
        if (error) throw error;
        await loadComments();
      } catch (e) {
        setToast((lang === "tr" ? "Hata: " : "Error: ") + (e.message || e));
      }
    };

    // Beğeni toggle
    const toggleLike = async commentId => {
      if (isGuest || !user) {
        setToast(L.commentsLoginRequired);
        return;
      }
      const cur = likes[commentId] || { count: 0, liked: false };
      // Optimistik güncelleme
      setLikes(ls => ({
        ...ls,
        [commentId]: {
          count: cur.count + (cur.liked ? -1 : 1),
          liked: !cur.liked
        }
      }));
      try {
        if (cur.liked) {
          await sb
            .from("comment_likes")
            .delete()
            .eq("comment_id", commentId)
            .eq("user_id", user.id);
        } else {
          await sb
            .from("comment_likes")
            .insert({ comment_id: commentId, user_id: user.id });
        }
      } catch (e) {
        // Hata → geri al
        setLikes(ls => ({ ...ls, [commentId]: cur }));
        setToast((lang === "tr" ? "Hata: " : "Error: ") + (e.message || e));
      }
    };

    // Göreceli zaman
    const timeAgo = iso => {
      const d = new Date(iso);
      const diff = (Date.now() - d.getTime()) / 1000;
      if (diff < 60) return lang === "tr" ? "şimdi" : "now";
      if (diff < 3600) return Math.floor(diff / 60) + (lang === "tr" ? "dk" : "m");
      if (diff < 86400) return Math.floor(diff / 3600) + (lang === "tr" ? "sa" : "h");
      if (diff < 604800) return Math.floor(diff / 86400) + (lang === "tr" ? "g" : "d");
      return d.toLocaleDateString(lang === "tr" ? "tr-TR" : "en-US", {
        day: "numeric",
        month: "short"
      });
    };

    // Tek bir yorumu render et (top-level veya reply)
    const renderComment = (c, isReply) => {
      const prof = profiles[c.user_id] || {};
      const displayName = prof.display_name || (lang === "tr" ? "Kullanıcı" : "User");
      const avatar = prof.avatar || "";
      const isAvatarImg = avatar && avatar.startsWith("http");
      const isMine = user && c.user_id === user.id;
      const canDelete = isMine || (user && user.id === postOwnerId);
      const canEdit = isMine;
      const lk = likes[c.id] || { count: 0, liked: false };
      const isEditing = editingId === c.id;

      return React.createElement("div", {
        key: c.id,
        style: {
          display: "flex",
          gap: 8,
          marginTop: isReply ? 8 : 10,
          marginLeft: isReply ? 28 : 0
        }
      },
        // Avatar
        React.createElement("div", {
          style: {
            width: isReply ? 24 : 28,
            height: isReply ? 24 : 28,
            borderRadius: "50%",
            background: "var(--blueL)",
            border: "1px solid var(--blue)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: isReply ? 10 : 11,
            fontWeight: 700,
            color: "var(--blue)",
            cursor: "pointer",
            flexShrink: 0,
            overflow: "hidden"
          },
          onClick: () => { window.location.href = profileRoute(c.user_id); }
        }, isAvatarImg
          ? React.createElement("img", {
            src: avatar,
            alt: "avatar",
            style: { width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }
          })
          : (avatar || displayName.charAt(0).toUpperCase())),
        // İçerik bloğu
        React.createElement("div", { style: { flex: 1, minWidth: 0 } },
          React.createElement("div", {
            style: {
              background: "var(--bg3)",
              borderRadius: 10,
              padding: "6px 10px",
              fontSize: 13,
              color: "var(--t1)",
              wordBreak: "break-word"
            }
          },
            React.createElement("span", {
              style: {
                fontWeight: 600,
                fontSize: 12,
                color: "var(--t1)",
                cursor: "pointer",
                marginRight: 6
              },
              onClick: () => { window.location.href = profileRoute(c.user_id); }
            }, displayName),
            prof.username && React.createElement("span", {
              style: { fontSize: 11, color: "var(--t3)", marginRight: 6 }
            }, "@" + prof.username),
            isEditing
              ? React.createElement("div", { style: { marginTop: 4 } },
                React.createElement("textarea", {
                  value: editInput,
                  onChange: e => setEditInput(e.target.value),
                  maxLength: 500,
                  rows: 2,
                  style: { ...S.inp, fontSize: 13, resize: "vertical", minHeight: 40 }
                }),
                React.createElement("div", { style: { display: "flex", gap: 6, marginTop: 4 } },
                  React.createElement("button", {
                    onClick: () => saveEdit(c.id),
                    style: { ...S.pri, fontSize: 11, padding: "4px 12px" }
                  }, L.commentsSave),
                  React.createElement("button", {
                    onClick: () => { setEditingId(null); setEditInput(""); },
                    style: { ...S.sec, fontSize: 11, padding: "4px 12px" }
                  }, L.commentsCancel)
                )
              )
              : React.createElement("span", null, c.content)
          ),
          // Meta satırı: zaman + düzenlendi + beğen + yanıtla + düzenle/sil
          !isEditing && React.createElement("div", {
            style: {
              display: "flex",
              alignItems: "center",
              gap: 10,
              fontSize: 11,
              color: "var(--t3)",
              marginTop: 4,
              paddingLeft: 4,
              flexWrap: "wrap"
            }
          },
            React.createElement("span", null, timeAgo(c.created_at)),
            c.edited && React.createElement("span", {
              style: { fontStyle: "italic" }
            }, "· " + L.commentsEdited),
            React.createElement("button", {
              onClick: () => toggleLike(c.id),
              style: {
                background: "transparent",
                border: "none",
                padding: 0,
                cursor: "pointer",
                fontSize: 11,
                color: lk.liked ? "var(--red)" : "var(--t3)",
                fontFamily: "inherit",
                fontWeight: lk.liked ? 600 : 400
              }
            }, (lk.liked ? "\u2764\uFE0F " : "\uD83E\uDD0D ") + (lk.count > 0 ? lk.count + " " : "") + L.commentsLike),
            !isReply && !isGuest && React.createElement("button", {
              onClick: () => { setReplyTo(c.id); setInput(""); },
              style: {
                background: "transparent", border: "none", padding: 0,
                cursor: "pointer", fontSize: 11, color: "var(--t3)", fontFamily: "inherit"
              }
            }, L.commentsReply),
            canEdit && React.createElement("button", {
              onClick: () => { setEditingId(c.id); setEditInput(c.content); },
              style: {
                background: "transparent", border: "none", padding: 0,
                cursor: "pointer", fontSize: 11, color: "var(--t3)", fontFamily: "inherit"
              }
            }, L.commentsEdit),
            canDelete && React.createElement("button", {
              onClick: () => deleteComment(c.id),
              style: {
                background: "transparent", border: "none", padding: 0,
                cursor: "pointer", fontSize: 11, color: "var(--red)", fontFamily: "inherit"
              }
            }, L.commentsDelete)
          )
        )
      );
    };

    // Top-level ve replies ayrımı
    const topLevel = comments.filter(c => !c.parent_id);
    const repliesByParent = {};
    comments.filter(c => c.parent_id).forEach(c => {
      (repliesByParent[c.parent_id] = repliesByParent[c.parent_id] || []).push(c);
    });

    return React.createElement("div", {
      style: {
        marginTop: 12,
        paddingTop: 12,
        borderTop: "1px solid var(--brd)"
      }
    },
      // Başlık
      React.createElement("div", {
        style: {
          fontSize: 12,
          fontWeight: 600,
          color: "var(--t2)",
          marginBottom: 8
        }
      }, "\uD83D\uDCAC " + L.comments + (comments.length > 0 ? " (" + comments.length + ")" : "")),

      // Liste
      loading
        ? React.createElement("div", {
          style: { fontSize: 12, color: "var(--t3)", padding: "6px 0" }
        }, L.commentsLoading)
        : topLevel.length === 0
          ? React.createElement("div", {
            style: { fontSize: 12, color: "var(--t3)", padding: "6px 0", fontStyle: "italic" }
          }, L.commentsNone)
          : topLevel.map(c => {
            const reps = repliesByParent[c.id] || [];
            const expanded = expandedReplies[c.id];
            return React.createElement("div", { key: c.id },
              renderComment(c, false),
              // Reply input (inline)
              replyTo === c.id && !isGuest && React.createElement("div", {
                style: {
                  marginLeft: 28,
                  marginTop: 6,
                  display: "flex",
                  gap: 6
                }
              },
                React.createElement("input", {
                  type: "text",
                  value: input,
                  onChange: e => setInput(e.target.value),
                  onKeyDown: e => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      postComment(input, c.id);
                    }
                  },
                  placeholder: L.commentsReplyPlaceholder,
                  maxLength: 500,
                  disabled: posting,
                  style: { ...S.inp, fontSize: 12, padding: "6px 10px" }
                }),
                React.createElement("button", {
                  onClick: () => postComment(input, c.id),
                  disabled: posting || !input.trim(),
                  style: { ...S.pri, fontSize: 11, padding: "4px 12px", opacity: posting || !input.trim() ? .5 : 1 }
                }, L.commentsPost),
                React.createElement("button", {
                  onClick: () => { setReplyTo(null); setInput(""); },
                  style: { ...S.sec, fontSize: 11, padding: "4px 10px" }
                }, L.commentsCancel)
              ),
              // Reply aç/kapa
              reps.length > 0 && React.createElement("button", {
                onClick: () => setExpandedReplies(s => ({ ...s, [c.id]: !s[c.id] })),
                style: {
                  marginLeft: 36,
                  marginTop: 6,
                  background: "transparent",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                  fontSize: 11,
                  color: "var(--blue)",
                  fontFamily: "inherit",
                  fontWeight: 500
                }
              }, expanded
                ? ("\u2303 " + L.commentsHideReplies)
                : ("\u2304 " + L.commentsShowReplies.replace("{n}", reps.length))),
              // Replies
              expanded && reps.map(r => renderComment(r, true))
            );
          }),

      // Yeni yorum girişi (top-level)
      replyTo === null && !isGuest && React.createElement("div", {
        style: {
          display: "flex",
          gap: 6,
          marginTop: 10
        }
      },
        React.createElement("input", {
          type: "text",
          value: input,
          onChange: e => setInput(e.target.value),
          onKeyDown: e => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              postComment(input, null);
            }
          },
          placeholder: L.commentsAddPlaceholder,
          maxLength: 500,
          disabled: posting,
          style: { ...S.inp, fontSize: 13 }
        }),
        React.createElement("button", {
          onClick: () => postComment(input, null),
          disabled: posting || !input.trim(),
          style: {
            ...S.pri,
            fontSize: 12,
            padding: "6px 14px",
            opacity: posting || !input.trim() ? .5 : 1
          }
        }, L.commentsPost)
      ),
      // Misafir için bilgi notu
      replyTo === null && isGuest && React.createElement("div", {
        style: {
          fontSize: 12,
          color: "var(--t3)",
          marginTop: 10,
          fontStyle: "italic",
          padding: "8px 10px",
          background: "var(--bg3)",
          borderRadius: 8
        }
      }, L.commentsLoginRequired)
    );
  }

  window.LOGWISE_COMPONENTS = window.LOGWISE_COMPONENTS || {};
  window.LOGWISE_COMPONENTS.CommentSection = CommentSection;
})();
