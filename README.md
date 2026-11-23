# Emin İletişim — canlı site ve içerik yönetimi

Canlı site: https://emin-iletisim.vercel.app

Yönetim paneli: https://emin-iletisim.vercel.app/admin

23 Kasım 2026 tarihinde mevcut Emin İletişim Vercel projesine yayınlandı. İçerikler, kullanıcılar ve oturumlar **Neon Postgres** üzerinde; fotoğraflar **Vercel Blob** üzerinde kalıcı saklanır. Yeniden dağıtım içerikleri sıfırlamaz. Yerel geliştirme, DATABASE_URL verilmedikçe SQLite kullanır.

## Yönetici girişi

İlk canlı yönetici hesabı benzersiz rastgele parola ile oluşturuldu. Kullanıcı adı ve parola yalnızca bilgisayarınızdaki **data/canli-yonetici.txt** dosyasındadır. Bu dosya Git'e veya Vercel'e yüklenmedi. Panelde **Hesabım** bölümünden parolayı değiştirebilirsiniz; parola değişimi bütün açık oturumları kapatır.

## Panel kullanımı

- **İçerikler:** sayfa, hizmet ve blog yazısı oluşturma/düzenleme/silme; taslak, yayın ve zamanlı yayın. Blog URL'si `blog/` ile başlar. Tarihler Türkiye saatidir; güncelleme tarihi otomatik tutulur.
- **İçerik editörü:** `##` ve `###` başlık, `-` liste, `**kalın**`, `[metin](/sayfa-adresi)` bağlantısı. Ham HTML çalıştırılmaz. Önizleme, ziyaretçi sayfasıyla aynı dönüştürücüyü kullanır.
- **SSS, menü ve ilgili sayfalar:** mobil ekle/kaldır alanları; menü ve SSS sıralaması değiştirilebilir.
- **Görseller:** JPEG/PNG/WebP/AVIF. Canlıda en fazla **3 MB**, yerelde 8 MB; 24 megapiksel sınırı. WebP'ye dönüştürülüp iki boyutta saklanır. EXIF/konum metaverileri taşınmaz. Alt metin zorunludur. Yükledikten sonra içerikten veya ana sayfa ayarlarından görseli seçin.
- **Site ayarları:** işletme, telefon, WhatsApp, sosyal medya, menü, ana sayfa, SSS, canonical alan adı, Search Console ve Bing doğrulama kodları.
- **SEO kontrolü:** başlık/açıklama/H1/alt metin/canonical/schema/iç bağlantı/sitemap denetimleri. Gerçek Google sıralaması veya indekslenme durumu ölçülmez.
- **Yönlendirmeler:** yayındaki yerel sayfalara 301. İçerik URL'si değişince eski adres otomatik yönlendirilir. Hakkımızda/iletişim/gizlilik adresleri sabittir.

## SEO ve içerik durumu

Canlı alan adı `https://emin-iletisim.vercel.app` olarak tanımlandı, indeksleme açıldı. Canonical ve sitemap bu alan adını kullanır. `/admin` noindex ve robots engeli taşır. Taslak, zamanlanmış, noindex ve farklı canonical'a sahip içerikler sitemap'e alınmaz. LocalBusiness/Organization, WebSite, BreadcrumbList, Article ve Service verileri uygun sayfalarda üretilir.

Özel alan adı verilmedi. İleride alan adı değiştirilirse Vercel domain ayarı, panelde site adresi ve üretim `APP_ORIGIN` birlikte güncellenmelidir. Google Search Console/Bing mülk doğrulaması ve sitemap gönderimi henüz yapılmadı. Harita platformlarında işletme kaydı bu kodla otomatik oluşturulmaz; sıralama garantisi yoktur.

Gerçek mağaza fotoğrafları henüz verilmedi; mevcut telefon illüstrasyonu kullanılıyor. Gerçek fotoğrafları ve işletmeye özgü doğrulanmış bilgileri panelden ekleyin. Fiyat, çalışma saati, yorum veya yetkili servis iddiası uydurulmadı.

## Yerel geliştirme

Node.js 22.x ve npm gerekir:

```powershell
npm ci
npm run dev
```

Yerel site: http://127.0.0.1:4173

Yerel yönetici oluşturmak için ayrı etkileşimli terminalde `npm run admin:create`. Yerel `data/site.sqlite`, canlı veritabanından ayrıdır. Buluttaki düzenlemeler yerel SQLite'a otomatik kopyalanmaz.

`site.config.json` yalnızca yeni yerel SQLite veritabanını başlatır. Sonraki değişiklikleri yönetim panelinden yapın.

## Bulut ortamı ve yayın

Vercel proje: `emin-iletisim` / `prj_ijwAjmaNmDaftcij2uQlFt4Fqe10`

Takım: `kadiraydn01s-projects` / `team_vqPQQyxFhno1m4IUu0P7Vom5`

Neon: `emin-iletisim-db`, Free plan, Frankfurt. Blob: `emin-iletisim-media`, Frankfurt, public erişimli yalnızca yayın görselleri. Veritabanı ve gizli bilgiler Blob'a yüklenmez. Hizmetlerin kota ve kullanım koşulları Vercel/Neon panelinden izlenebilir.

Gerekli sunucu ortam değişkenleri: `DATABASE_URL`, `BLOB_READ_WRITE_TOKEN`, `APP_ORIGIN`. Değerleri ekrana yazdırmayın. Yerel taşıma/doğrulama için `.env.production.local` kullanılır; Git ve dağıtım dışında tutulur. Üretim sırlarını geliştirme ortamına taşımadan çalışmak için ayrı geliştirme veritabanı kullanın.

`api/index.mjs` Vercel giriş noktasıdır. `vercel.json` sayfaları bu işleyiciye yönlendirir. `scripts/build.mjs` SSR çıktısını doğrular; `dist` eski statik önizlemedir ve kullanılmaz. `src/db.mjs`, DATABASE_URL varsa Neon, yoksa SQLite seçer. Canlı veritabanı migration/seed işlemi build içinde çalışmaz.

Yeni yayın, aynı projeye kaynak dosyalarıyla yapılır. `.vercelignore` veritabanı, parolalar, yedekler, test çıktıları ve ortam dosyalarını dışlar. İlk aktarımı yapan `scripts/migrate-production.mjs` mevcut canlı içerik varsa tekrar aktarım yapmaz. Çalışan veritabanını sıfırlamayın.

## Yedek

Yerel SQLite: `npm run backup`

Canlı Neon + Blob: `.env.production.local` bağlantıları mevcutken `npm run backup:cloud`

Canlı yedek `backups/<zaman>/postgres.json` ve `uploads/` içerir; parola hashleri nedeniyle özel tutulmalıdır. Oturum ve rate-limit kayıtları dışlanır. Yedekleri ayrı güvenli depolamaya kopyalayın. Otomatik uzak yedekleme planlanmadı. PostgreSQL yedeğini geri yüklemeden önce ayrı bir veritabanında tablolar, sequence değerleri, kullanıcılar ve görseller doğrulanmalıdır; doğrudan çalışan veritabanının üzerine yazmayın.

## Kontroller

```powershell
npm run build
npm run check
npm test
```

15 yerel entegrasyon testi; 16 SSR sayfası ve 230 iç bağlantı doğrulandı. Gerçek Neon/Blob üzerinde ve sonrasında canlı Vercel adresinde yönetici girişi, bütün panel ekranları, taslak CRUD, kalıcılık, CSRF, fotoğraf yükleme/okuma ve çıkış doğrulandı. Testlerin oluşturduğu taslak ve görseller temizlendi. Build paket denetimi 0 güvenlik açığı bildirdi.

`npm run check:cloud` gerçek bulut ortamında geçici taslak/görsel oluşturup temizleyen entegrasyon kontrolüdür; özel yerel yönetici dosyasını kullanır. Parolanızı değiştirdiğinizde dosyayı güncellemeden bu komutu çalıştırmayın. Canlı URL'yi test etmek için `CHECK_ORIGIN=https://emin-iletisim.vercel.app` ortam değişkeni kullanılabilir.

Lighthouse ve gerçek kullanıcı Core Web Vitals ölçülmedi. Önceki yerel turda 390px mobil görünüm ve tarayıcıdan içerik yayınlama kontrol edildi; bu yayın turunda kontroller gerçek HTTPS/HTTP istekleriyle yapıldı.

Mimari: ARCHITECTURE.md. Yayın kaydı: docs/deployment.md. Önceki yerel sürüm notları: docs/local-version-notes.md.
