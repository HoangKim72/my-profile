import { AlertTriangle } from "lucide-react";
import { StateMessage, type StateMessageProps } from "./StateMessage";

export interface ErrorStateProps extends Omit<StateMessageProps, "title"> {
  /** Defaults to "Không tải được dữ liệu". */
  title?: StateMessageProps["title"];
}

export function ErrorState({
  icon,
  title = "Không tải được dữ liệu",
  description = "Đã có lỗi xảy ra. Vui lòng thử lại sau.",
  ...props
}: ErrorStateProps) {
  return (
    <StateMessage
      tone="danger"
      role="alert"
      icon={icon ?? <AlertTriangle size={22} />}
      title={title}
      description={description}
      {...props}
    />
  );
}
