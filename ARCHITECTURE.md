# Emin İletişim — mimari

## Çalışma ortamları

Yerelde Node.js 22 + SQLite; canlıda Vercel Node.js Function + Neon Postgres + Vercel Blob. DATABASE_URL varsa bulut sürücüsü seçilir. Neon bağlantısı TLS verify-full kullanır. Kullanıcı verisi geçici Vercel diskine yazılmaz. Blob yalnızca decode edilip WebP'ye çevrilen yayın görsellerini tutar.

## Veri katmanı

`src/db.mjs` ortak arayüz; `sqlite-store.mjs` yerel sürücü; `postgres-store.mjs` bulut sürücüsü. Bulutta her istek AsyncLocalStorage ile kendi bağlantı ve içerik görünümüne sahiptir. Ayarlar/sayfalar/medya bir isteğin başında okunur, HTML oluşturma bu görünümden yapılır. Küresel kullanıcı veya oturum önbelleği yoktur. Yönetim mutasyonları parametreli SQL ve gerektiğinde transaction kullanır. URL değişimi ile 301 kayıtları aynı transaction'da yazılır.

Tablolar: settings, pages, users, sessions, media, redirects, login_attempts. Parolalar scrypt, oturum tokenları SHA-256 hash olarak saklanır. Giriş sayacı atomik UPSERT ile artırılır. Vercel'de platformun istemci IP başlığı, yerelde soket IP'si kullanılır.

## HTTP ve içerik

`src/server.mjs` ortak HTTP işleyicisi; `api/index.mjs` Vercel uyarlaması. `src/render.mjs` semantic HTML, güvenli sınırlı Markdown, meta, canonical, OG/Twitter, schema, sitemap, robots. `src/admin.mjs` içerik editörü ve yönetim ekranları. Fotoğraf yükleme `media-storage.mjs` aracılığıyla yerel disk veya Blob'a gider; aynı `/uploads` URL yapısı korunur. Dosyalar UUID benzeri rastgele adlarla saklanır, ham kullanıcı dosyası sunulmaz.

Dokuz `/corlu-*` hizmet sayfası, kurumsal sayfalar ve `/blog/<slug>`. Taslak/zamanlanmış sayfalar gerçek 404; URL değişimi 301. Kullanıcıya verilen işletme bilgileri tek merkezden gelir. Yayın saatleri Türkiye saatidir. Schema gerçek görünen bilgilerle sınırlıdır; fiyat, yorum veya çalışma saati uydurulmaz.

## Güvenlik

Admin yetkilendirmesi, HttpOnly/SameSite ve üretimde Secure cookie; POST üzerinde origin + CSRF; atomik giriş limiti; XSS için metin kaçışlama ve ham HTML engeli; CSP; dosya decode ve boyut/piksel sınırları; admin noindex. Canlı upload sınırı 3 MB (platformun 4,5 MB istek limitinin altında). Parola değişince tüm oturumlar iptal edilir. Gizli ortam dosyaları, veritabanları ve yedekler dağıtım dışında tutulur.

## Yayın ve bakım

Migration/seed build sırasında çalışmaz. İlk aktarım `scripts/migrate-production.mjs` ile bilerek yapıldı; mevcut business kaydı varsa kullanıcı içeriğini korur. Build yalnızca SSR doğrulaması. Yedek komutu SQLite snapshot veya PostgreSQL tablo snapshot + Blob görsel kopyaları üretir. Aktif oturumlar bulut yedeğine alınmaz. Git bağlantılı otomatik deployment kurulmadı; mevcut üretim yayını Vercel API ile yapıldı.

Resmi kaynaklar: https://developers.google.com/search/docs/appearance/structured-data/local-business ; https://vercel.com/docs/functions/runtimes/node-js ; https://vercel.com/docs/storage/vercel-blob .
