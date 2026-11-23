import {pageMetadata} from '../src/content/page-metadata.ts';
import {publicPaths} from '../src/content/indexing.ts';
export function llmsText(base){
 return `# RatioClub\n\n> ${pageMetadata['/'].description}\n\n## Pages\n\n${publicPaths.map(path=>`- [${pageMetadata[path].title}](${new URL(path.replace(/^\//,''),base).href}): ${pageMetadata[path].description}`).join('\n')}\n\n## Scope\n\nThe website describes AWS AI infrastructure engineering services. Draft legal pages and local design experiments are excluded from this guide.\n`;
}
