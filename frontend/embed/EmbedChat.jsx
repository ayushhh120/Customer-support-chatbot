import { useSearchParams } from "react-router-dom";
import ChatContainer from "@/components/chat/ChatContainer";

const EmbedChat = () => {
  const [params] = useSearchParams();
  const clientId = params.get("client_id");

  if (!clientId) {
    return <p>Invalid client</p>;
  }

  return (
    <div className="h-screen w-full bg-background">
      <ChatContainer clientId={clientId} />
    </div>
  );
};

export default EmbedChat;