import { useState } from "react";
import { NavLink } from "react-router-dom";
import AvatarSmall from "./common/AvatarSmall";
import MediaGrid from "./common/MediaGrid";
import Reactions from "./Reactions";
import Comments from "./Comments";
import { feedFormatDate } from "../lib/helper";

const FeedPost = ({ post,
    reactions,
    comments,
    media = [],
    my_reaction,
    community,
    author,
    commentExpandedPost,
    showReactions,
    setCommentExpandedPost,
    ws,
    scope,
    load,
    
}) => {
    const [updatedComments, setUpdatedComments] = useState(comments);

    const isExpanded = commentExpandedPost.has(post.id)
    return (
        <div className='card mb-3 !p-0 overflow-hidden'>
            <div className="feed-item">
                <div className='!p-3 !pb-0' style={{ fontSize: 12, opacity: 0.85, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <NavLink to={`/?user=@${(author?.handle || post.author)}`}>
                        <AvatarSmall size={38} author={author} username={post.author} />
                    </NavLink>
                    <div className='flex flex-col w-full'>
                        <div className='flex gap-2 justify-between'>
                            <div>
                                <NavLink to={`/?user=@${(author?.handle || post.author)}`} className='text-sm' style={{ fontWeight: 700, }}>
                                    {author?.display_name || author?.handle || post.author}
                                </NavLink>
                                <NavLink to={`/?user=@${(author?.handle || post.author)}`} style={{ opacity: 0.8 }}>@{author?.handle || post.author}</NavLink>

                            </div>
                            <span style={{
                                fontSize: 11,
                                padding: '2px 6px',
                                borderRadius: 6,
                                background: 'var(--primary, #e9e5e0)',
                                color: '#333',
                                border: '1px solid rgba(0,0,0,0.1)'
                            }}>
                                {scope === 'circle' ? 'Circle' : (community ? `Community${community.name ? ': ' + community.name : ''}` : ((post.visibility || 'friends') === 'global' ? 'Global' : 'Friends'))}
                            </span>
                        </div>
                        <span className="meta !text-xs">{feedFormatDate(post.created_at)}</span>
                    </div>
                </div>
                <div className='p-3 pt-0'>
                    <div style={{ marginTop: 12 }}>{post.text}</div>
                    {!!media.length && (
                        <MediaGrid media={media} />
                    )}
                    <div style={{ marginTop: 12, fontSize: 12, opacity: 0.7 }}>
                        <span className='hover:underline cursor-pointer' onClick={(e) => { e.preventDefault(); showReactions(post.id) }}>{reactions} reactions</span>
                        {/* <ReactionBreakdown postId={post.id} /> */}
                        {" "}• <span className='hover:underline cursor-pointer' onClick={() => {
                            setCommentExpandedPost(pre => {
                                const nSet = new Set(pre)
                                if (nSet.has(post.id)) {
                                    nSet.delete(post.id)
                                } else {
                                    nSet.add(post.id)
                                }
                                return nSet;
                            });
                        }}>{updatedComments} comments</span>
                    </div>
                    <Reactions postId={post.id} onReact={load} my={my_reaction} />
                    {
                        isExpanded && (
                            <div style={{ marginTop: 12, }} className='border-t py-1 border-[var(--border)]'>
                                <Comments count={updatedComments} me={me} postId={post.id} notify={() => { try { ws && ws.readyState === 1 && ws.send(JSON.stringify({ kind: 'comment', post_id: post.id })); setUpdatedComments(pre => pre + 1) } catch (e) { } }} />
                            </div>
                        )
                    }
                </div>
            </div>
        </div>
    )
}


export default FeedPost