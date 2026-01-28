/**
 * History List Component
 *
 * Displays a scrollable list of history items
 */

import { AnimatePresence } from "framer-motion";
import type { HistoryListItem } from "@/lib/database/schema";
import { HistoryCard } from "./HistoryCard";

interface HistoryListProps {
  items: HistoryListItem[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export function HistoryList({ items, selectedId, onSelect, onDelete }: HistoryListProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <AnimatePresence mode="popLayout">
        {items.map((item, index) => (
          <HistoryCard
            key={item.id}
            item={item}
            index={index}
            isSelected={selectedId === item.id}
            onSelect={() => onSelect(item.id)}
            onDelete={() => onDelete(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
