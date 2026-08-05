import { create } from "zustand";

interface NavigationPendingState {
  pending: boolean;
  setPending: (value: boolean) => void;
}

// Set to true the instant a region switch is clicked (in TopBar), and
// cleared once the newly-navigated page's fresh server data actually
// arrives (ProductGrid clears it in a useEffect keyed on its own
// initialProducts prop changing). This is the bridge between "the click
// happened in TopBar" and "the grid on a completely different part of
// the tree should dim" — the two aren't parent/child, so a shared store
// is simpler than threading a prop through the whole layout.
export const useNavigationPendingStore = create<NavigationPendingState>((set) => ({
  pending: false,
  setPending: (value) => set({ pending: value }),
}));