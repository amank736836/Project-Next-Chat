import { FullPageLoader } from "../../../components/layout/Loaders";

export default function ChatLoading() {
  return <FullPageLoader minHeight="calc(100vh - 4rem)" message="Loading chat..." />;
}
