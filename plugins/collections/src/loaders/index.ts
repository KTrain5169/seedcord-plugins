import type { LoaderOptions } from "./config";

export function defineLoader<const TLoader extends LoaderOptions>(loader: TLoader): TLoader {
  return loader;
}
