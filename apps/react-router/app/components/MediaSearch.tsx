import { Search } from "lucide-react";
import { Input } from "./ui/input";
import type { ComponentProps } from "react";

export function MediaSearch(props: ComponentProps<"input">) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
      <Input
        {...props}
        placeholder="Search by title or description..."
        className="pl-9 bg-gray-50"
      />
    </div>
  );
}
