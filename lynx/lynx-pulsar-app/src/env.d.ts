declare module "*.png" {
  const src: string;
  export default src;
}

interface ImportMeta {
  webpackHot?: {
    accept(): void;
  };
}
