import { Inbox } from "lucide-react";
import { StateMessage, type StateMessageProps } from "./StateMessage";

export type EmptyStateProps = StateMessageProps;

export function EmptyState({ icon, ...props }: EmptyStateProps) {
  return (
    <StateMessage
      tone="neutral"
      role="status"
      icon={icon ?? <Inbox size={22} />}
      {...props}
    />
  );
}
