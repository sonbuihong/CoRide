import { MessagesWorkspace } from '@/components/chat/messages-workspace';
export default function ConversationPage({ params }: { params: { conversationId: string } }) { return <MessagesWorkspace conversationId={decodeURIComponent(params.conversationId)} />; }
