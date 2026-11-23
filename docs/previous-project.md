# Emin İletişim

Canlı tasarım önizlemesi: https://emin-iletisim.vercel.app

Bağımlılıksız Node.js derlemesi, 10 statik HTML sayfası, özgün SVG görseli, responsive CSS. CMS veya ürün stok sistemi yoktur. Fiyatlar, değerlendirmeler ve işletme bilgileri uydurulmamıştır. Hizmet listesi yayın öncesinde işletmeyle doğrulanmalıdır.

## Yerel geliştirme

- `npm run build`: dist klasörünü üretir.
- `npm run check`: iç bağlantıları, H1/meta bilgilerini ve önizleme korumasını denetler.
- `npm run dev`: http://127.0.0.1:4173

Metinler ve HTML: scripts/build.mjs. Tasarım: public/style.css. Etkileşimler: public/app.js.

## İşletme bilgileri ve SEO

site.config.json dosyasında url (https ile), phone (uluslararası biçim), whatsapp (ülke koduyla), address, city ve district alanlarını doldurun. Hizmetleri ve gizlilik metnini gerçek işletme koşullarıyla doğrulayın. Sonra indexable değerini true yapıp yeniden derleyin. Zorunlu işletme bilgileri eksikse indekslenebilir derleme durur.

Bu sürüm bilinçli olarak noindex,nofollow kullanır ve robots.txt taramayı kapatır. Sitemap şu an boştur. indexable açılınca canonical, dolu sitemap, taramaya açık robots.txt ve LocalBusiness JSON-LD üretilir. Başlık ve açıklamalar her sayfaya özeldir. Domain ayrıca Vercel projesine eklenmeli ve DNS doğrulanmalıdır.

Yayın sonrası Google Search Console mülkünü doğrulayıp sitemap.xml gönderin. Gerçek adres, telefon, çalışma saatleri, mağaza fotoğrafları ve Google İşletme Profili tutarlı olmalı. Gerçek müşteri yorumları ve faydalı yerel içerik sürdürülebilir görünürlük için önemlidir. Sıralama garantisi yoktur.

Kaynaklar:
- https://developers.google.com/search/docs/fundamentals/seo-starter-guide
- https://support.google.com/business/answer/7091?hl=tr

## Vercel

Yeni proje: emin-iletisim / prj_ijwAjmaNmDaftcij2uQlFt4Fqe10
Takım: kadiraydn01s-projects / team_vqPQQyxFhno1m4IUu0P7Vom5
Dağıtım: dpl_7iXJ3EJQu5XRYwzU7fFJ1WuF6UCh, READY, production (ilk proje yayını), tasarım önizlemesi noindex.
Mevcut eminiletisim projesi değiştirilmedi. Kaynak dosyalar Vercel API ile gönderildi; otomatik Git dağıtım bağlantısı kurulmadı. Build: npm run build; output: dist; Node: 22.x.

Kontroller: 10 sayfa / 161 iç referans, Vercel READY, canlı hizmet seçici yönlendirmesi, 390px mobil menü açılma-kapanması ve hizmet kartları. Yerel önizleme tarayıcı oturumu kararsız olduğu için son etkileşim kontrolü canlı Vercel sürümünde yapıldı. Analytics ve performans ölçümü henüz kurulmadı.
