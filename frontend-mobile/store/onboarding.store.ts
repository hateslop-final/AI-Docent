import { create } from "zustand";

type State = {
  age?: string;
  aesthetic?: string;
  gallery?: number;
  exhibition?: number;
  setAge: (age: string) => void;
  setAesthetic: (level: string) => void;
  setGallery: (galleryId: number) => void;
  setExhibition: (exhibitionId: number | undefined) => void;
  clearExhibition: () => void;
};

export const useOnboardingStore = create<State>((set) => ({
  age: undefined,
  aesthetic: undefined,
  gallery: undefined,
  exhibition: undefined,
  setAge: (age) => set({ age }),
  setAesthetic: (level) => set({ aesthetic: level }),
  setGallery: (galleryId) => set({ gallery: galleryId }),
  setExhibition: (exhibitionId) => set({ exhibition: exhibitionId }),
  clearExhibition: () => set({ exhibition: undefined }),
}));