const DEFAULT_IMAGES = {
  FUTBOL: '/defaults/futbol.svg',
  BASKETBALL: '/defaults/basketball.svg',
  BAILE: '/defaults/baile.svg',
  BOLOS: '/defaults/bolos.svg',
  REUNION: '/defaults/reunion.svg',
  OTRO: '/defaults/otro.svg',
};

export function getEventImage(event) {
  if (event.image) return event.image;
  return DEFAULT_IMAGES[event.category] || DEFAULT_IMAGES.OTRO;
}
