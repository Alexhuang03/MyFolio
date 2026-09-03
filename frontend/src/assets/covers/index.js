import coverCulinary from './cover-culinary.svg';
import coverClassic from './cover-classic.svg';
import coverBotanical from './cover-botanical.svg';
import coverFantasy from './cover-fantasy.svg';
import coverTravel from './cover-travel.svg';
import coverMinimal from './cover-minimal.svg';

export const COVERS = [
  {
    id: 'cover-classic.svg',
    name: 'Vintage Classique & Or',
    src: coverClassic,
    defaultColor: '#1e3a8a',
  },
  {
    id: 'cover-minimal.svg',
    name: 'Minimaliste & Moderne',
    src: coverMinimal,
    defaultColor: '#334155',
  },
  {
    id: 'cover-fantasy.svg',
    name: 'Grimoire & Imaginaire',
    src: coverFantasy,
    defaultColor: '#7c3aed',
  },
  {
    id: 'cover-travel.svg',
    name: 'Exploration & Voyage',
    src: coverTravel,
    defaultColor: '#0284c7',
  },
  {
    id: 'cover-botanical.svg',
    name: 'Herbier & Nature',
    src: coverBotanical,
    defaultColor: '#059669',
  },
  {
    id: 'cover-culinary.svg',
    name: 'Gastronomie & Recettes',
    src: coverCulinary,
    defaultColor: '#f97316',
  },
];

export const getCoverSrc = (coverId) => {
  const found = COVERS.find((c) => c.id === coverId);
  return found ? found.src : coverClassic;
};
