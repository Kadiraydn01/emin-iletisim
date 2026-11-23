# Emin İletişim

Çorlu için sunucuda HTML üreten web sitesi ve SQLite tabanlı içerik yönetimi. Dokuz hizmet sayfası, hakkında/iletişim/gizlilik, blog ve mobil yönetim paneli bulunur. Mevcut canlı Vercel sitesi değiştirilmedi. Önceki projenin notları `docs/previous-project.md` içinde korunmuştur.

## Çalıştırma

Node.js 22.13 veya üzeri gerekir. Node 22, `node:sqlite` için deneysel API uyarısı verir; uyarı uygulamanın çalışmasını engellemez.

```powershell
npm install
npm run dev
```

Site: http://127.0.0.1:4173 — Yönetim: http://127.0.0.1:4173/admin

İlk yönetici hesabı için **ayrı bir etkileşimli terminalde**:

```powershell
npm run admin:create
```

Kullanıcı adınızı ve en az 12 karakterlik parolanızı girin. Parola yazılırken görünmez; açık metin kaydedilmez. Varsayılan parola veya herkese açık kayıt ekranı yoktur. Parola daha sonra panelde Hesabım bölümünden değiştirilir. Test hesapları gerçek `data/` veritabanına eklenmez.

## Panel kullanımı

- **İçerikler:** sayfa, hizmet veya blog oluşturun; düzenleyin, taslak/yayın/zamanlı yayın seçin. Blog URL'si `blog/` ile başlar. Yayın saatleri Türkiye saatidir. Güncelleme tarihi otomatik tutulur.
- **Editör:** paragraflar, `##` ve `###` başlıklar, `-` listeler, `**kalın**` ve `[metin](/adres)` bağlantıları. Önizleme sunucudaki aynı güvenli dönüştürücüyü kullanır. Ham HTML çalıştırılmaz. SSS, ilgili sayfalar ve menü için mobil ekle/kaldır alanları vardır.
- **Görseller:** JPEG, PNG, WebP veya AVIF; en fazla 8 MB ve 24 megapiksel. Dosya içeriği decode edilir, WebP olarak 1600px ve 480px sürümlerle yeniden yazılır; EXIF/konum bilgisi taşınmaz. Alt metin zorunludur. Görseli yükledikten sonra içerik veya ana sayfa ayarından seçin.
- **Site ayarları:** işletme bilgileri, telefon, WhatsApp, sosyal medya, menü, ana sayfa başlık/özet/SSS/görsel, domain ve doğrulama kodları.
- **SEO kontrolü:** başlık, açıklama, H1, görsel alt metni, canonical, schema, iç bağlantı ve sitemap kontrolleri. Bu ekran Google sıralamasını veya gerçek indekslenmeyi ölçmez.
- **Yönlendirmeler:** yalnızca yayındaki site sayfalarına 301. URL değişikliklerinde eski adres otomatik yönlendirilir. Hakkımızda/iletişim/gizlilik adresleri sabittir; içerikleri değiştirilebilir.

## İçerik ve SEO

İşletme bilgileri ilk çalıştırmada `site.config.json` üzerinden SQLite'a alınır. Sonraki değişiklikleri panelden yapın; JSON dosyasını değiştirmek mevcut veritabanını değiştirmez.

Gerçek alan adı verilmediğinden global indeksleme **kapalıdır**; HTML `noindex,follow` içerir ve sitemap boştur. `robots.txt` admini engeller, diğer HTML sayfalarını noindex etiketinin okunabilmesi için taramaya açık bırakır. Canlı HTTPS alan adı panelde tanımlanıp indeksleme açıldığında canonical, sitemap, LocalBusiness/Organization, WebSite, BreadcrumbList ve uygun içeriklerde Article/Service verileri üretilir. Taslaklar, gelecekte yayınlanacak sayfalar, noindex ve başka canonical'a sahip sayfalar sitemap'e girmez. JSON-LD kapatılabilir. Search Console ve Bing doğrulama meta alanları paneldedir.

Gerçek mağaza fotoğrafları henüz verilmedi. Mevcut telefon çizimi **illüstrasyon** olarak kullanıldı. Mağaza fotoğraflarını ve doğrulanmış hizmet detaylarını panelden ekleyin. Çalışma saati, fiyat, yorum, sertifika veya yetkili servis iddiası uydurulmadı. Başlangıç yazıları genel bilgilendirmedir; işletmeye özgü deneyim iddiası içermez. Google, Bing, Apple Maps veya AI aramalarında sıralama garantisi verilmez; harita platformlarında işletme kaydı bu kodla otomatik oluşturulmaz.

## Veri ve yedek

`data/site.sqlite` asıl veritabanıdır. `data/uploads` görsellerdir. Bu klasörler ve yedekler Git'e alınmaz, HTTP sunucusu bunları doğrudan servis etmez (yalnızca işlenmiş WebP dosyaları sunulur). Kullanıcı ve oturum tabloları içerik veritabanındadır. Oturum tokenları hash olarak tutulur.

```powershell
npm run backup
```

`backups/<zaman>/` içinde SQLite snapshot ve görseller oluşur. Yedek alırken görsel yüklemeyi duraklatın; veritabanı ve görsellerin birlikte tutarlı olmasını sağlayın. Yedekleri düzenli olarak özel bir harici diske/depolamaya kopyalayın. Otomatik uzak yedek planlanmadı.

Geri yükleme: sunucuyu durdurun; mevcut `data` klasörünü korumak için başka bir adla taşıyın; yedekteki `site.sqlite` ve `uploads` öğelerini yeni `data` klasörüne kopyalayın; sunucuyu yeniden başlatın. Eski WAL/SHM dosyalarını yeni veritabanıyla karıştırmayın. Yedek parola hashleri içerir; özel tutulmalıdır.

## Barındırma

Bu sürüm tek Node süreci + **kalıcı yazılabilir disk** ister. Mevcut `vercel.json` ve `dist/` eski statik önizlemeye aittir; CMS için kullanılamaz. Yanlışlıkla statik CMS yayını yapılmasını engellemek için Vercel ortamında build bilinçli olarak durur. Yeni sürümü Vercel'de yayınlamak için kalıcı harici veritabanı ve dosya deposu entegrasyonu gerekir. Bu çalışma yerel geliştirmedir; yayın yapılmadı.

Kalıcı diskli sunucuda HTTPS reverse proxy arkasında örnek:

```powershell
$env:NODE_ENV = 'production'
$env:APP_ORIGIN = 'https://GERCEK-ALAN-ADI'
$env:HOST = '127.0.0.1'
$env:PORT = '4173'
$env:DATA_DIR = 'KALICI-VERI-KLASORU'
npm start
```

APP_ORIGIN tarayıcıdaki kesin origin ile eşleşmeli; sonuna `/` eklemeyin. Üretimde HTTPS ve Secure cookie zorunludur. Reverse proxy arkasında uygulama iletilen IP başlıklarına güvenmez; giriş limiti proxy IP'si üzerinden ortak uygulanır. Dış erişimi proxy ile sınırlandırın; tek süreç kullanın. Hassas veriler, .env, test-results ve backups web kökünde sunulmaz.

## Doğrulama

```powershell
npm run build
npm run check
npm test
```

`build` statik çıktı üretmez; SSR sayfalarını doğrular. `check` iç bağlantıları denetler. Testler geçici veritabanında çalışır: giriş/çıkış/parola değişimi, CSRF ve origin, rate limit, CRUD, kalıcılık, zamanlı yayın, 301/404, sitemap/canonical/schema, upload güvenliği ve yedek bütünlüğü.

23 Kasım 2026: 16 SSR sayfası, 230 iç bağlantı; mobil 390px görünümde menü ve hizmet geçişi, ayrı test veritabanında tarayıcıdan içerik/SSS kaydetme-önizleme-yayınlama doğrulandı. Yatay taşma ve konsol hatası görülmedi. Lighthouse puanı ve gerçek kullanıcı Core Web Vitals ölçümü yapılmadı; canlı domain henüz olmadığı için harici arama motoru doğrulaması ve Search Console gönderimi yapılmadı.

Mimari: `ARCHITECTURE.md`. Önizleme: `preview.jpg`.

Resmi kaynaklar:
- https://developers.google.com/search/docs/appearance/structured-data/local-business
- https://developers.google.com/search/docs/appearance/structured-data/sd-policies
- https://developers.google.com/search/docs/appearance/ai-features
