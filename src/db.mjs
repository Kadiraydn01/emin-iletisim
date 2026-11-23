// Offline development uses SQLite; production selects Neon when DATABASE_URL exists.
const store = await import(process.env.DATABASE_URL ? './postgres-store.mjs' : './sqlite-store.mjs');
export const {db,dataDir,getSetting,setSetting,allPages,pageById,pageBySlug,isPublished,publishedPages,savePage,deletePage}=store;
export const cloud=Boolean(process.env.DATABASE_URL);
export const withData=store.withData || (async fn=>fn());
export const mediaById=store.mediaById || (id=>db.prepare('SELECT * FROM media WHERE id=?').get(id));
