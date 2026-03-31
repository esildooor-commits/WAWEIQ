import { Station } from './types';

export const CURATED_STATIONS: Station[] = [
  {
    id: 'groove-salad',
    name: 'SomaFM: Groove Salad',
    url: 'https://ice1.somafm.com/groovesalad-128-mp3',
    favicon: 'https://somafm.com/img/groovesalad120.png',
    tags: ['ambient', 'downtempo', 'chill'],
    country: 'USA'
  },
  {
    id: 'drone-zone',
    name: 'SomaFM: Drone Zone',
    url: 'https://ice1.somafm.com/dronezone-128-mp3',
    favicon: 'https://somafm.com/img/dronezone120.png',
    tags: ['ambient', 'drone', 'space'],
    country: 'USA'
  },
  {
    id: 'kexp',
    name: 'KEXP 90.3 FM',
    url: 'https://kexp-mp3-128.streamguys1.com/kexp128.mp3',
    favicon: 'https://www.kexp.org/static/assets/img/kexp-logo.png',
    tags: ['alternative', 'indie', 'eclectic'],
    country: 'USA'
  },
  {
    id: 'chill-out',
    name: 'Chillout Lounge',
    url: 'http://icecast.unitedradio.it/ChilloutLounge.mp3',
    favicon: 'https://static.radio.net/images/ads/chillout.png',
    tags: ['chillout', 'lounge'],
    country: 'Italy'
  },
  {
    id: 'jazz-radio',
    name: 'Jazz Radio',
    url: 'http://jazzradio.ice.infomaniak.ch/jazzradio-high.mp3',
    favicon: 'https://www.jazzradio.fr/media/radio/logo_jazz_radio.png',
    tags: ['jazz', 'blues'],
    country: 'France'
  }
];
