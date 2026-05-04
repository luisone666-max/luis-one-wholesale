export const defaultMetaPixelId = "909127758753748";

export function getMetaPixelId() {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || defaultMetaPixelId;
}
